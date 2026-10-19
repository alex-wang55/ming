"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { postJSON } from "@/lib/api";
import { speak } from "@/lib/audio";
import { useSettings } from "@/lib/settings";
import { localDateKey } from "@/lib/dates";
import { isDue, nextReview } from "@/lib/review";
import { parseToneTags } from "@/lib/tags";
import Auth from "@/components/Auth";
import GoalSetup from "@/components/GoalSetup";
import AppShell from "@/components/AppShell";
import LoadingScreen from "@/components/LoadingScreen";

const WORD_FIELDS = "id, chinese, pinyin, meaning, times_seen, last_seen, next_review, created_at";
const NETWORK_ERROR = "Couldn't reach Ming — check your connection and try again.";

export default function Home() {
  const [settings, updateSettings] = useSettings();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(false);
  const [tab, setTab] = useState("learn");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usageLeft, setUsageLeft] = useState(null);
  const [words, setWords] = useState([]);
  const [wordsLoading, setWordsLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [review, setReview] = useState(null);
  const conversationId = useRef(null);
  const loadedUserId = useRef(null);
  const sending = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setUser(session?.user ?? null);
      if (!session) resetState();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Supabase re-emits a fresh session (and so a fresh user object) on token
    // refresh, not just on sign-in. Only reload when the signed-in user changes.
    if (user && user.id !== loadedUserId.current) {
      loadedUserId.current = user.id;
      loadProfile(user.id);
      loadConversation(user.id);
      loadWords(user.id);
      loadProgress(user.id);
      loadActivity(user.id);
    }
  }, [user]);

  function resetState() {
    loadedUserId.current = null;
    conversationId.current = null;
    setProfile(null);
    setMessages([]);
    setWords([]);
    setWordsLoading(true);
    setCompletedLessons([]);
    setActivity([]);
    setStreak(0);
    setCurrentLesson(null);
    setReview(null);
    setUsageLeft(null);
    setTab("learn");
  }

  async function loadProfile(uid) {
    const { data, error } = await supabase
      .from("profiles")
      .select("goal_text, deadline_date, onboarding_skipped")
      .eq("id", uid)
      .maybeSingle();
    // A failed fetch must never look like "no goal set", or returning users get
    // sent back into onboarding.
    if (error) {
      console.error("Profile load failed:", error);
      setProfileError(true);
      return;
    }
    setProfileError(false);
    setProfile(data || { goal_text: null, deadline_date: null, onboarding_skipped: false });
  }

  async function loadConversation(uid) {
    const { data } = await supabase
      .from("conversations")
      .select("id, messages")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.messages?.length) {
      setMessages(data.messages);
      conversationId.current = data.id;
    }
  }

  async function loadWords(uid) {
    const { data, error } = await supabase
      .from("words")
      .select(WORD_FIELDS)
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!error) setWords(data || []);
    setWordsLoading(false);
  }

  async function loadProgress(uid) {
    const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", uid);
    setCompletedLessons(data ? data.map((d) => d.lesson_id) : []);
  }

  // Streak with a 1-day-per-week freeze so a single missed day doesn't reset it.
  async function loadActivity(uid) {
    const { data } = await supabase
      .from("daily_activity")
      .select("activity_date, session_count")
      .eq("user_id", uid)
      .order("activity_date", { ascending: false })
      .limit(90);

    const rows = (data || []).map((d) => ({ date: d.activity_date, count: d.session_count }));
    setActivity(rows);

    const dates = new Set(rows.map((r) => r.date));
    let count = 0;
    let freezeUsed = false;
    let daysSinceFreeze = 0;
    const cursor = new Date();
    if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

    for (let i = 0; i < 400; i++) {
      if (dates.has(localDateKey(cursor))) {
        count++;
        daysSinceFreeze++;
      } else if (!freezeUsed && daysSinceFreeze < 7) {
        freezeUsed = true;
        daysSinceFreeze = 0;
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    setStreak(count);
  }

  async function recordActivity() {
    const today = localDateKey();
    const { data } = await supabase
      .from("daily_activity")
      .select("session_count")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .maybeSingle();

    await supabase
      .from("daily_activity")
      .upsert(
        { user_id: user.id, activity_date: today, session_count: (data?.session_count || 0) + 1 },
        { onConflict: "user_id,activity_date" }
      );
    loadActivity(user.id);
  }

  async function saveConversation(all) {
    const clean = all.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    if (conversationId.current) {
      await supabase
        .from("conversations")
        .update({ messages: clean, updated_at: new Date().toISOString() })
        .eq("id", conversationId.current);
    } else {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, messages: clean })
        .select("id")
        .single();
      if (data) conversationId.current = data.id;
    }
  }

  // `base` lets a new lesson start from an empty chat; otherwise continue the current one.
  async function sendMessage(text, base = messages) {
    const content = text.trim();
    if (!content || sending.current) return;
    sending.current = true;

    const history = [...base, { role: "user", content }];
    setMessages(history);
    setLoading(true);

    try {
      const res = await postJSON("/api/chat", {
        messages: history.filter((m) => !m.error),
        preferences: { pinyin: settings.pinyin, pace: settings.pace },
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data.remaining === "number") setUsageLeft(data.remaining);

      if (!res.ok || !data.reply) {
        setMessages([...history, { role: "assistant", content: data.error || NETWORK_ERROR, error: true }]);
        return;
      }

      const final = [...history, { role: "assistant", content: data.reply }];
      setMessages(final);
      saveConversation(final);
      recordActivity();
      if (data.newWords) loadWords(user.id);
      if (settings.autoplay) {
        const [first] = parseToneTags(data.reply);
        if (first) speak(first.hanzi).catch(() => {}); // browsers may block autoplay; that's fine
      }
    } catch (err) {
      console.error(err);
      setMessages([...history, { role: "assistant", content: NETWORK_ERROR, error: true }]);
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }

  function startConversation(prompt, lesson) {
    if (sending.current) return;
    setCurrentLesson(lesson);
    conversationId.current = null; // each lesson gets its own saved conversation
    setTab("chat");
    sendMessage(prompt, []);
  }

  function handleStartRegion(region) {
    startConversation(
      `I want to focus on ${region.name} (${region.chineseName}). Tell me about the accent and culture there, and teach me a few useful local phrases.`,
      null
    );
  }

  async function handleFinishLesson() {
    if (!currentLesson) return;
    const lessonId = currentLesson.id;
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: user.id, lesson_id: lessonId, completed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
    if (error) {
      console.error("Error saving progress:", error);
      return;
    }
    const next = [...new Set([...completedLessons, lessonId])];
    setCompletedLessons(next);
    setCurrentLesson(null);
    setTab("learn");

    // Every 3rd lesson: a quick check on the most recent words.
    if (next.length % 3 === 0 && words.length) {
      openReview("Quick check", words.slice(0, 3));
    }
  }

  function openReview(title, list) {
    if (list.length) setReview({ id: Date.now(), title, words: list });
  }

  function startReview() {
    const due = words
      .filter((w) => isDue(w))
      .sort((a, b) => new Date(a.next_review) - new Date(b.next_review));
    openReview("Review", due.slice(0, 20));
  }

  async function rateWord(word, rating) {
    const patch = nextReview(word, rating);
    setWords((ws) => ws.map((w) => (w.id === word.id ? { ...w, ...patch } : w)));
    const { error } = await supabase.from("words").update(patch).eq("id", word.id);
    if (error) console.error("Saving review failed:", error);
  }

  function updateProfile(patch) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  if (recovery) {
    return <Auth theme={settings.theme} recovery onRecovered={() => setRecovery(false)} />;
  }
  if (authLoading) return <LoadingScreen />;
  if (!user) return <Auth theme={settings.theme} />;
  if (!profile) return <LoadingScreen error={profileError} onRetry={() => loadProfile(user.id)} />;
  if (!profile.goal_text && !profile.onboarding_skipped) {
    return <GoalSetup user={user} theme={settings.theme} onDone={updateProfile} />;
  }

  return (
    <AppShell
      user={user}
      profile={profile}
      settings={settings}
      updateSettings={updateSettings}
      tab={tab}
      setTab={setTab}
      messages={messages}
      loading={loading}
      usageLeft={usageLeft}
      words={words}
      wordsLoading={wordsLoading}
      completedLessons={completedLessons}
      streak={streak}
      activity={activity}
      currentLesson={currentLesson}
      review={review}
      onSend={(text) => sendMessage(text)}
      onStartLesson={(lesson) => startConversation(lesson.prompt, lesson)}
      onStartRegion={handleStartRegion}
      onFinishLesson={handleFinishLesson}
      onStartReview={startReview}
      onRate={rateWord}
      onCloseReview={() => setReview(null)}
      onUpdateProfile={updateProfile}
    />
  );
}
