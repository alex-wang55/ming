"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { themes, font } from "@/lib/theme";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import Auth from "@/components/Auth";
import UserMenu from "@/components/UserMenu";
import MapTab from "@/components/MapTab";
import Sidebar from "@/components/Sidebar";
import LearnTab from "@/components/LearnTab";
import WordsTab from "@/components/WordsTab";
import SettingsTab from "@/components/SettingsTab";

const WELCOME = {
  role: "assistant",
  content:
    "嗨！Hi! I'm Ming — your personal Mandarin coach. Before we dive in, tell me: what's your reason for learning Mandarin? There's no wrong answer.",
};

const HEADINGS = {
  learn: ["Your lesson path", (s) => `${s.done} of ${s.total} lessons complete`],
  chat: ["Chat with Ming", () => "Free conversation"],
  map: ["Regional map", () => "Explore accents and culture by region"],
  words: ["Your vocabulary", (s) => `${s.wordCount} words learned`],
  settings: ["Settings", () => "Manage your preferences"],
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("learn");
  const [messages, setMessages] = useState([WELCOME]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [streak, setStreak] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [theme, setTheme] = useState("light");
  const bottomRef = useRef(null);

  const t = themes[theme];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setMessages([WELCOME]);
        setConversationId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("ming-settings");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.theme) setTheme(s.theme);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      loadConversation();
      loadWordCount();
      loadProgress();
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversation() {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    if (data && data.messages.length > 0) {
      setMessages([WELCOME, ...data.messages]);
      setConversationId(data.id);
    }
  }

  async function loadWordCount() {
    const { count } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setWordCount(count || 0);
  }

  async function loadProgress() {
    const { data } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id);
    setCompletedLessons(data ? data.map((d) => d.lesson_id) : []);
  }

  async function saveConversation(updated) {
    const apiMessages = updated.slice(1);
    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ messages: apiMessages, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, messages: apiMessages })
        .select()
        .single();
      if (data) setConversationId(data.id);
    }
  }

  async function markLessonComplete(lessonId) {
    if (!user) return;
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
    setCompletedLessons((prev) => [...new Set([...prev, lessonId])]);
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.slice(1), userId: user?.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const final = [...updated, { role: "assistant", content: data.reply }];
      setMessages(final);
      if (user) {
        await saveConversation(final);
        loadWordCount();
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...updated,
        { role: "assistant", content: "Something went wrong — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleStartLesson(lesson) {
    setCurrentLesson(lesson);
    setMessages([WELCOME]);
    setTab("chat");
    sendMessage(lesson.prompt);
  }

  function handleStartRegion(region) {
    setCurrentLesson(null);
    setMessages([WELCOME]);
    setTab("chat");
    sendMessage(
      `I want to focus on ${region.name} (${region.chineseName}). Teach me the language, accent, and culture specific to this region.`
    );
  }

  async function handleFinishLesson() {
    if (!currentLesson) return;
    await markLessonComplete(currentLesson.id);
    setCurrentLesson(null);
    setTab("learn");
  }

  if (authLoading) return <LoadingScreen t={t} />;
  if (!user) return <Auth />;

  const totalLessons = 18;
  const stats = { done: completedLessons.length, total: totalLessons, wordCount };
  const [headTitle, headSubFn] = HEADINGS[tab];
  const headSub =
    tab === "chat" && currentLesson ? currentLesson.sub : headSubFn(stats);
  const title = tab === "chat" && currentLesson ? currentLesson.title : headTitle;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: t.bg }}>
      <Sidebar tab={tab} setTab={setTab} theme={theme} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: t.bg }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: "56px",
            flexShrink: 0,
            borderBottom: `1px solid ${t.border}`,
            background: t.bg,
          }}
        >
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: t.text, margin: 0, letterSpacing: "-0.01em" }}>
              {title}
            </p>
            <p style={{ fontSize: "12px", color: t.textMuted, margin: 0 }}>{headSub}</p>
          </div>
          <UserMenu user={user} wordCount={wordCount} streak={streak} theme={theme} />
        </header>

        {tab === "learn" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <LearnTab
              completedLessons={completedLessons}
              onStartLesson={handleStartLesson}
              wordCount={wordCount}
              streak={streak}
              theme={theme}
            />
          </div>
        )}

        {tab === "chat" && (
          <>
            <main style={{ flex: 1, overflowY: "auto", position: "relative", background: t.bg }}>
              {messages.length === 1 && <EmptyState t={t} />}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  padding: "24px",
                  maxWidth: "720px",
                  margin: "0 auto",
                }}
              >
                {messages.map((msg, i) => (
                  <Message key={i} message={msg} theme={theme} />
                ))}
                {loading && <TypingIndicator t={t} />}
                <div ref={bottomRef} />
              </div>
            </main>

            <footer
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${t.border}`,
                background: t.bg,
                padding: "12px 24px 20px",
              }}
            >
              <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {currentLesson && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: t.accentSoft,
                      border: `1px solid ${t.accentBorder}`,
                      borderRadius: "10px",
                      padding: "8px 14px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: t.accent }}>
                      Lesson · {currentLesson.title}
                    </span>
                    <button
                      onClick={handleFinishLesson}
                      style={{
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "7px",
                        background: t.surface,
                        border: `1px solid ${t.accentBorder}`,
                        color: t.accent,
                        fontWeight: 500,
                      }}
                    >
                      Mark complete
                    </button>
                  </div>
                )}
                <ChatInput onSend={sendMessage} disabled={loading} theme={theme} />
              </div>
            </footer>
          </>
        )}

        {tab === "map" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <MapTab onStartLesson={handleStartRegion} theme={theme} />
          </div>
        )}

        {tab === "words" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <WordsTab userId={user.id} theme={theme} />
          </div>
        )}

        {tab === "settings" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SettingsTab user={user} theme={theme} setTheme={setTheme} />
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ t }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: t.bg,
        gap: "18px",
      }}
    >
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${t.border}` }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: t.accent,
            animation: "spin 1.1s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            background: t.accentSoft,
            border: `1px solid ${t.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: font.cn, fontSize: "24px", color: t.accent, fontWeight: 700 }}>明</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "18px", fontWeight: 600, color: t.text, margin: "0 0 3px" }}>Ming</p>
        <p style={{ fontSize: "12.5px", color: t.textMuted, margin: 0 }}>Your Mandarin coach</p>
      </div>
    </div>
  );
}

function EmptyState({ t }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-60%)",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontFamily: font.cn, fontSize: "44px", color: t.accent, opacity: 0.15, marginBottom: "10px" }}>
        明
      </div>
      <p style={{ fontSize: "16px", fontWeight: 500, color: t.textFaint, margin: "0 0 6px" }}>
        Ready when you are
      </p>
      <p style={{ fontSize: "13px", color: t.textFaint, maxWidth: "280px", margin: "0 auto" }}>
        Pick a lesson from the Learn tab, or just start talking.
      </p>
    </div>
  );
}

function TypingIndicator({ t }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "999px",
          background: t.accentSoft,
          border: `1px solid ${t.accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <span style={{ fontFamily: font.cn, fontSize: "12px", color: t.accent, fontWeight: 700 }}>明</span>
      </div>
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "14px 14px 14px 4px",
          padding: "13px 16px",
          display: "flex",
          gap: "5px",
          alignItems: "center",
          boxShadow: t.shadow,
        }}
      >
        {[0, 0.15, 0.3].map((d, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: t.textMuted,
              animation: "bounce 1.2s infinite ease-in-out",
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
