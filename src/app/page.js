"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import Auth from "@/components/Auth";
import UserMenu from "@/components/UserMenu";
import MapTab from "@/components/MapTab";
import Sidebar from "@/components/Sidebar";
import LearnTab from "@/components/LearnTab";
import WordsTab from "@/components/WordsTab";

const WELCOME = {
  role: "assistant",
  content: "嗨！Hi! I'm Ming — your personal Mandarin coach. Before we dive in, tell me: what's your reason for learning Mandarin? There's no wrong answer.",
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
  const bottomRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) { setMessages([WELCOME]); setConversationId(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) { loadConversation(); loadWordCount(); loadProgress(); }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversation() {
    const { data } = await supabase
      .from("conversations").select("*").eq("user_id", user.id)
      .order("updated_at", { ascending: false }).limit(1).single();
    if (data && data.messages.length > 0) {
      setMessages([WELCOME, ...data.messages]);
      setConversationId(data.id);
    }
  }

  async function loadWordCount() {
    const { count } = await supabase
      .from("words").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    setWordCount(count || 0);
  }

  async function loadProgress() {
    const { data } = await supabase
      .from("lesson_progress").select("lesson_id").eq("user_id", user.id);
    setCompletedLessons(data ? data.map(d => d.lesson_id) : []);
  }

  async function saveConversation(updatedMessages) {
    const apiMessages = updatedMessages.slice(1);
    if (conversationId) {
      await supabase.from("conversations")
        .update({ messages: apiMessages, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      const { data } = await supabase.from("conversations")
        .insert({ user_id: user.id, messages: apiMessages }).select().single();
      if (data) setConversationId(data.id);
    }
  }

  async function markLessonComplete(lessonId) {
    if (!user) return;
    try {
      const { error } = await supabase.from("lesson_progress")
        .upsert(
          { user_id: user.id, lesson_id: lessonId, completed_at: new Date().toISOString() },
          { onConflict: "user_id,lesson_id" }
        );
      if (error) {
        console.error("Error saving progress:", error);
        return;
      }
      setCompletedLessons(prev => [...new Set([...prev, lessonId])]);
    } catch (err) {
      console.error("markLessonComplete failed:", err);
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const apiMessages = updatedMessages.slice(1);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, userId: user?.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const finalMessages = [...updatedMessages, { role: "assistant", content: data.reply }];
      setMessages(finalMessages);
      if (user) { await saveConversation(finalMessages); loadWordCount(); }
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, { role: "assistant", content: "Something went wrong — try again in a moment." }]);
    } finally { setLoading(false); }
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
    sendMessage(`I want to focus on ${region.name} (${region.chineseName}). Teach me the language, accent, and culture specific to this region.`);
  }

  async function handleFinishLesson() {
    if (currentLesson) {
      await markLessonComplete(currentLesson.id);
      setCurrentLesson(null);
      setTab("learn");
    }
  }

  if (authLoading) return (
    <div style={styles.loading}>
      <style>{`
        @keyframes mingPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes shimmerRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Decorative background chars */}
      <div style={{ position: "absolute", fontSize: "160px", fontFamily: "'Noto Sans SC', sans-serif", color: "rgba(139,106,58,0.05)", top: "5%", right: "-20px", lineHeight: 1, pointerEvents: "none" }}>语</div>
      <div style={{ position: "absolute", fontSize: "160px", fontFamily: "'Noto Sans SC', sans-serif", color: "rgba(139,106,58,0.05)", bottom: "5%", left: "-20px", lineHeight: 1, pointerEvents: "none" }}>学</div>

      {/* Spinning ring */}
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid #e8d4a8",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#8b6a3a",
          animation: "shimmerRing 1.2s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: "10px", borderRadius: "50%",
          background: "linear-gradient(135deg, #fff7ec, #f5e8d0)",
          border: "1px solid #e8d4a8",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={styles.loadingChar}>明</span>
        </div>
      </div>

      {/* App name */}
      <div style={{ textAlign: "center", animation: "fadeInUp 0.6s ease forwards" }}>
        <p style={{ fontSize: "22px", fontWeight: 600, color: "#2d2520", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Ming</p>
        <p style={{ fontSize: "13px", color: "#b89860", margin: 0 }}>Your Mandarin coach</p>
      </div>

      {/* Bouncing dots */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#c4a868",
            animation: `dotBounce 1.2s ease-in-out ${delay}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
  if (!user) return <Auth />;

  return (
    <div style={styles.page}>
      <Sidebar tab={tab} setTab={setTab} />

      <div style={styles.content}>
        {/* Top bar */}
        <header style={styles.header}>
          <div>
            <p style={styles.headerTitle}>
              {tab === "learn" && "Your lesson path"}
              {tab === "chat" && (currentLesson ? currentLesson.title : "Chat with Ming")}
              {tab === "map" && "Regional map"}
              {tab === "words" && "Your vocabulary"}
            </p>
            <p style={styles.headerSub}>
              {tab === "learn" && `${completedLessons.length} lessons completed`}
              {tab === "chat" && (currentLesson ? currentLesson.sub : "Free conversation")}
              {tab === "map" && "Explore accents and culture by region"}
              {tab === "words" && `${wordCount} words learned`}
            </p>
          </div>
          <UserMenu user={user} wordCount={wordCount} streak={streak} />
        </header>

        {/* Tab content */}
        {tab === "learn" && (
          <div style={styles.tabContent}>
            <LearnTab
              completedLessons={completedLessons}
              onStartLesson={handleStartLesson}
              wordCount={wordCount}
              streak={streak}
            />
          </div>
        )}

        {tab === "chat" && (
          <>
            <main style={styles.main}>
              {messages.length === 1 && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>明</div>
                  <p style={styles.emptyTitle}>Ready to learn?</p>
                  <p style={styles.emptySub}>Pick a lesson from the Learn tab or just start talking.</p>
                </div>
              )}
              <div style={styles.messages}>
                {messages.map((msg, i) => <Message key={i} message={msg} />)}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>
            </main>
            <footer style={styles.footer}>
              <div style={styles.footerInner}>
                {currentLesson && (
                  <div style={styles.lessonBanner}>
                    <span style={styles.lessonBannerText}>
                      <i className="ti ti-route" aria-hidden="true" /> Lesson: {currentLesson.title}
                    </span>
                    <button style={styles.finishBtn} onClick={handleFinishLesson}>
                      Mark complete ✓
                    </button>
                  </div>
                )}
                <ChatInput onSend={sendMessage} disabled={loading} />
              </div>
            </footer>
          </>
        )}

        {tab === "map" && (
          <div style={styles.tabContent}>
            <MapTab onStartLesson={handleStartRegion} />
          </div>
        )}

        {tab === "words" && (
          <div style={styles.tabContent}>
            <WordsTab userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={styles.typingWrapper}>
      <div style={styles.avatar2}><span style={styles.avatarChar2}>明</span></div>
      <div style={styles.typingBubble}>
        {[0, 0.15, 0.3].map((d, i) => (
          <span key={i} style={{ ...styles.dot, animationDelay: `${d}s` }} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", height: "100vh", width: "100%", background: "#faf8f4" },
  loading: { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5ede0", gap: "20px", position: "relative", overflow: "hidden" },
  loadingChar: { fontSize: "52px", fontFamily: "'Noto Sans SC', sans-serif", color: "#8b6a3a", animation: "mingPulse 1.8s ease-in-out infinite" },
  content: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: "52px", flexShrink: 0,
    borderBottom: "1px solid #e8e0d4", background: "#faf8f4",
  },
  headerTitle: { fontSize: "14px", fontWeight: 600, color: "#2d2520", margin: 0 },
  headerSub: { fontSize: "11px", color: "#aaa", margin: 0 },
  tabContent: { flex: 1, overflow: "hidden" },
  main: { flex: 1, overflowY: "auto", position: "relative", background: "#faf8f4" },
  emptyState: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", textAlign: "center", pointerEvents: "none" },
  emptyIcon: { fontSize: "48px", fontFamily: "'Noto Sans SC', sans-serif", color: "rgba(139,106,58,0.15)", marginBottom: "12px" },
  emptyTitle: { fontSize: "18px", fontWeight: 500, color: "#d8d0c8", margin: "0 0 8px" },
  emptySub: { fontSize: "14px", color: "#d8d0c8", maxWidth: "280px", margin: "0 auto" },
  messages: { display: "flex", flexDirection: "column", gap: "16px", padding: "24px", maxWidth: "720px", margin: "0 auto", paddingBottom: "24px" },
  footer: { flexShrink: 0, borderTop: "1px solid #e8e0d4", background: "#faf8f4", padding: "10px 24px 18px" },
  footerInner: { maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" },
  lessonBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff7ec", border: "1px solid #e8d4a8", borderRadius: "10px", padding: "8px 14px" },
  lessonBannerText: { fontSize: "12px", color: "#8b6a3a", display: "flex", alignItems: "center", gap: "6px" },
  finishBtn: { fontSize: "12px", padding: "4px 12px", borderRadius: "7px", background: "#fff", border: "1px solid #e8d4a8", color: "#8b6a3a", cursor: "pointer", fontFamily: "Inter, sans-serif" },
  mapContainer: { flex: 1, overflow: "hidden" },
  typingWrapper: { display: "flex", alignItems: "flex-end", gap: "8px" },
  avatar2: { width: "30px", height: "30px", borderRadius: "50%", background: "#fff7ec", border: "1px solid #e8d4a8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarChar2: { fontFamily: "'Noto Sans SC', sans-serif", fontSize: "13px", color: "#8b6a3a" },
  typingBubble: { background: "#ffffff", border: "1px solid #e8e0d4", borderRadius: "14px 14px 14px 3px", padding: "12px 16px", display: "flex", gap: "5px", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  dot: { display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#d8c8b8", animation: "bounce 1.2s infinite ease-in-out" },
};