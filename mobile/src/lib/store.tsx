import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LESSONS } from "@/shared/lessons";
import { localDateKey } from "@/shared/dates";
import { isDue, nextReview } from "@/shared/review";
import { computeStreak } from "@/shared/streak";
import { parseToneTags } from "@/shared/tags";
import { postJSON } from "./api";
import { haptic } from "./haptics";
import { useSession } from "./session";
import { useSettings } from "./settings";
import { supabase } from "./supabase";
import { speak, useSpeaker } from "./voice";

// The app's data and actions. A port of the web app's page.js: same tables, same
// queries, same rules, so the phone and the website stay in sync.

export type Word = {
  id: string;
  chinese: string;
  pinyin: string | null;
  meaning: string | null;
  times_seen: number | null;
  last_seen: string | null;
  next_review: string | null;
  created_at: string | null;
};
export type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
export type Lesson = { id: string; title: string; sub: string; prompt: string };
export type Region = { id: string; name: string; chineseName: string };
export type Activity = { date: string; count: number };
export type ReviewSession = { id: number; title: string; words: Word[] };

const WORD_FIELDS = "id, chinese, pinyin, meaning, times_seen, last_seen, next_review, created_at";
const NETWORK_ERROR = "Couldn't reach Ming. Check your connection and try again.";
export const TOTAL_LESSONS = LESSONS.reduce((s, w) => s + w.lessons.length, 0);

type Store = {
  words: Word[];
  wordsLoading: boolean;
  dueCount: number;
  completedLessons: string[];
  streak: number;
  activity: Activity[];
  messages: Msg[];
  sending: boolean;
  usageLeft: number | null;
  currentLesson: Lesson | null;
  review: ReviewSession | null;
  sendMessage: (text: string) => void;
  startLesson: (lesson: Lesson) => void;
  startRegion: (region: Region) => void;
  finishLesson: () => Promise<boolean>;
  startReview: () => void;
  rateWord: (word: Word, rating: "easy" | "hard") => void;
  refresh: () => Promise<void>;
  withConsent: (action: () => void) => void;
  runPendingConsent: () => void;
  dropPendingConsent: () => void;
};

const Ctx = createContext<Store | null>(null);
export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}

// Keyed on the signed-in user, so signing out (or in as someone else) starts from a clean slate.
export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  return (
    <StoreInner key={userId ?? "signed-out"} userId={userId}>
      {children}
    </StoreInner>
  );
}

function StoreInner({ userId, children }: { userId: string | null; children: ReactNode }) {
  const { profile } = useSession();
  const { settings } = useSettings();

  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [streak, setStreak] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const [usageLeft, setUsageLeft] = useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [review, setReview] = useState<ReviewSession | null>(null);

  const conversationId = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const messagesRef = useRef<Msg[]>([]);
  const wordsRef = useRef<Word[]>([]);
  const settingsRef = useRef(settings);
  const pendingConsent = useRef<(() => void) | null>(null);
  const consentRef = useRef(false);
  const hasConsent = !!profile?.ai_consent_at;

  // Actions read the latest values through refs, so they can stay stable callbacks.
  useLayoutEffect(() => {
    messagesRef.current = messages;
    wordsRef.current = words;
    settingsRef.current = settings;
    consentRef.current = hasConsent;
  }, [messages, words, settings, hasConsent]);

  /* ---------------- loading ---------------- */

  const loadWords = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("words")
      .select(WORD_FIELDS)
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!error) setWords((data as Word[]) || []);
    setWordsLoading(false);
  }, []);

  const loadProgress = useCallback(async (uid: string) => {
    const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", uid);
    setCompletedLessons(data ? data.map((d: { lesson_id: string }) => d.lesson_id) : []);
  }, []);

  const loadActivity = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("daily_activity")
      .select("activity_date, session_count")
      .eq("user_id", uid)
      .order("activity_date", { ascending: false })
      .limit(90);
    const rows = (data || []).map((d: { activity_date: string; session_count: number }) => ({
      date: d.activity_date,
      count: d.session_count,
    }));
    setActivity(rows);
    setStreak(computeStreak(rows));
  }, []);

  const loadConversation = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("conversations")
      .select("id, messages")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.messages?.length) {
      setMessages(data.messages as Msg[]);
      conversationId.current = data.id as string;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    // These are async: state is only set once each fetch resolves, not during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversation(userId);
    loadWords(userId);
    loadProgress(userId);
    loadActivity(userId);
  }, [userId, loadConversation, loadWords, loadProgress, loadActivity]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await Promise.all([loadWords(userId), loadProgress(userId), loadActivity(userId)]);
  }, [userId, loadWords, loadProgress, loadActivity]);

  /* ---------------- AI consent (App Review 5.1.2(i)) ---------------- */

  // Anything that sends data to an AI provider goes through here. Without consent the
  // action waits, the consent screen opens, and it runs right after the user agrees.
  const withConsent = useCallback((action: () => void) => {
    if (consentRef.current) {
      action();
      return;
    }
    pendingConsent.current = action;
    router.push("/consent");
  }, []);

  const runPendingConsent = useCallback(() => {
    const action = pendingConsent.current;
    pendingConsent.current = null;
    consentRef.current = true;
    action?.();
  }, []);
  const dropPendingConsent = useCallback(() => {
    pendingConsent.current = null;
  }, []);

  /* ---------------- chat ---------------- */

  const recordActivity = useCallback(async () => {
    if (!userId) return;
    const today = localDateKey();
    const { data } = await supabase
      .from("daily_activity")
      .select("session_count")
      .eq("user_id", userId)
      .eq("activity_date", today)
      .maybeSingle();
    await supabase
      .from("daily_activity")
      .upsert(
        { user_id: userId, activity_date: today, session_count: (data?.session_count || 0) + 1 },
        { onConflict: "user_id,activity_date" }
      );
    loadActivity(userId);
  }, [userId, loadActivity]);

  const saveConversation = useCallback(
    async (all: Msg[]) => {
      if (!userId) return;
      const clean = all.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
      if (conversationId.current) {
        await supabase
          .from("conversations")
          .update({ messages: clean, updated_at: new Date().toISOString() })
          .eq("id", conversationId.current);
      } else {
        const { data } = await supabase.from("conversations").insert({ user_id: userId, messages: clean }).select("id").single();
        if (data) conversationId.current = data.id as string;
      }
    },
    [userId]
  );

  // `base` lets a new lesson start from an empty chat; otherwise continue the current one.
  const send = useCallback(
    async (text: string, base?: Msg[]) => {
      const content = text.trim();
      if (!content || sendingRef.current || !userId) return;
      sendingRef.current = true;
      setSending(true);

      const history: Msg[] = [...(base ?? messagesRef.current), { role: "user", content }];
      setMessages(history);
      const { pinyin, pace, autoplay } = settingsRef.current;

      try {
        const res = await postJSON("/api/chat", {
          messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
          preferences: { pinyin, pace },
        });
        const data = await res.json().catch(() => ({}));
        if (typeof data.remaining === "number") setUsageLeft(data.remaining);

        if (!res.ok || !data.reply) {
          setMessages([...history, { role: "assistant", content: data.error || NETWORK_ERROR, error: true }]);
          return;
        }

        const final: Msg[] = [...history, { role: "assistant", content: data.reply }];
        setMessages(final);
        saveConversation(final);
        recordActivity();
        if (data.newWords) loadWords(userId);
        if (autoplay) {
          const [first] = parseToneTags(data.reply);
          if (first) speak(first.hanzi).catch(() => {});
        }
      } catch {
        setMessages([...history, { role: "assistant", content: NETWORK_ERROR, error: true }]);
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [userId, saveConversation, recordActivity, loadWords]
  );

  const sendMessage = useCallback((text: string) => withConsent(() => send(text)), [withConsent, send]);

  const startConversation = useCallback(
    (prompt: string, lesson: Lesson | null) => {
      withConsent(() => {
        if (sendingRef.current) return;
        setCurrentLesson(lesson);
        conversationId.current = null; // each lesson gets its own saved conversation
        router.navigate("/chat");
        send(prompt, []);
      });
    },
    [withConsent, send]
  );

  const startLesson = useCallback((lesson: Lesson) => startConversation(lesson.prompt, lesson), [startConversation]);

  const startRegion = useCallback(
    (region: Region) =>
      startConversation(
        `I want to focus on ${region.name} (${region.chineseName}). Tell me about the accent and culture there, and teach me a few useful local phrases.`,
        null
      ),
    [startConversation]
  );

  /* ---------------- lessons and reviews ---------------- */

  const openReview = useCallback((title: string, list: Word[]) => {
    if (!list.length) return;
    setReview({ id: Date.now(), title, words: list });
    router.push("/review");
  }, []);

  const finishLesson = useCallback(async () => {
    if (!currentLesson || !userId) return false;
    const lessonId = currentLesson.id;
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
    if (error) {
      console.warn("Error saving progress:", error.message);
      return false;
    }
    haptic.success();
    const next = [...new Set([...completedLessons, lessonId])];
    setCompletedLessons(next);
    setCurrentLesson(null);
    router.navigate("/");
    // Every 3rd lesson: a quick check on the most recent words.
    if (next.length % 3 === 0 && wordsRef.current.length) {
      setTimeout(() => openReview("Quick check", wordsRef.current.slice(0, 3)), 350);
    }
    return true;
  }, [currentLesson, userId, completedLessons, openReview]);

  const startReview = useCallback(() => {
    const due = wordsRef.current
      .filter((w) => isDue(w))
      .sort((a, b) => new Date(a.next_review ?? 0).getTime() - new Date(b.next_review ?? 0).getTime());
    openReview("Review", due.slice(0, 20));
  }, [openReview]);

  const rateWord = useCallback(async (word: Word, rating: "easy" | "hard") => {
    const patch = nextReview(word, rating);
    setWords((ws) => ws.map((w) => (w.id === word.id ? { ...w, ...patch } : w)));
    const { error } = await supabase.from("words").update(patch).eq("id", word.id);
    if (error) console.warn("Saving review failed:", error.message);
  }, []);

  const dueCount = useMemo(() => words.filter((w) => isDue(w)).length, [words]);

  const value: Store = {
    words,
    wordsLoading,
    dueCount,
    completedLessons,
    streak,
    activity,
    messages,
    sending,
    usageLeft,
    currentLesson,
    review,
    sendMessage,
    startLesson,
    startRegion,
    finishLesson,
    startReview,
    rateWord,
    refresh,
    withConsent,
    runPendingConsent,
    dropPendingConsent,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// [playingText, play]: tap-to-hear for screens. Audio comes from Google TTS through
// Ming's server, so it waits for AI consent like chat does.
export function useSpeak() {
  const { withConsent } = useStore();
  const [playing, play] = useSpeaker();
  const gatedPlay = useCallback((text: string) => withConsent(() => play(text)), [withConsent, play]);
  return [playing, gatedPlay] as const;
}
