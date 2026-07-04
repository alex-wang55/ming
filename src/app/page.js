"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import Auth from "@/components/Auth";
import UserMenu from "@/components/UserMenu";
import MapTab from "@/components/MapTab";

const WELCOME = {
  role: "assistant",
  content: "嗨！Hi! I'm Ming — your personal Mandarin coach. Before we dive in, tell me: what's your reason for learning Mandarin? There's no wrong answer.",
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([WELCOME]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setMessages([WELCOME]);
        setConversationId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadConversation();
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

  async function saveConversation(updatedMessages) {
    const apiMessages = updatedMessages.slice(1);
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
      if (user) await saveConversation(finalMessages);
    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, {
        role: "assistant",
        content: "Something went wrong — try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Called when user clicks "Start lesson here" on the map
  function handleStartLesson(region) {
    const regionMessage = {
      role: "user",
      content: `I want to focus on ${region.name} (${region.chineseName}). Teach me the language, accent, and culture specific to this region.`,
    };
    setMessages([WELCOME, regionMessage]);
    setTab("chat");
    // Auto-send the region message
    sendMessage(regionMessage.content);
  }

  if (authLoading) return <div style={styles.loading}>Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoChar}>明</span>
            <span style={styles.logoText}>Ming</span>
          </div>
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(tab === "chat" ? styles.tabActive : {}) }}
              onClick={() => setTab("chat")}
            >
              Chat
            </button>
            <button
              style={{ ...styles.tab, ...(tab === "map" ? styles.tabActive : {}) }}
              onClick={() => setTab("map")}
            >
              🗺️ Map
            </button>
          </div>
        </div>
        <UserMenu user={user} />
      </header>

      {tab === "chat" ? (
        <>
          <main style={styles.main}>
            <div style={styles.messages}>
              {messages.map((msg, i) => (
                <Message key={i} message={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </main>
          <footer style={styles.footer}>
            <ChatInput onSend={sendMessage} disabled={loading} />
          </footer>
        </>
      ) : (
        <div style={styles.mapContainer}>
          <MapTab onStartLesson={handleStartLesson} />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={styles.typingWrapper}>
      <div style={styles.typingBubble}>
        <span style={styles.dot} />
        <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
        <span style={{ ...styles.dot, animationDelay: "0.3s" }} />
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", height: "100vh", width: "100%" },
  loading: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", background: "#0f0f0f" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 24px", borderBottom: "1px solid #1e1e1e", flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "20px" },
  logo: { display: "flex", alignItems: "center", gap: "8px" },
  logoChar: { fontSize: "20px", fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843", fontWeight: 500 },
  logoText: { fontSize: "17px", fontWeight: 500, color: "#f0f0f0" },
  tabs: { display: "flex", gap: "4px" },
  tab: {
    padding: "6px 14px", borderRadius: "8px", border: "1px solid transparent",
    background: "transparent", color: "#888", fontSize: "13px", cursor: "pointer",
  },
  tabActive: { background: "#1a1a1a", color: "#f0f0f0", borderColor: "#2a2a2a" },
  main: { flex: 1, overflowY: "auto", padding: "24px 24px 0" },
  messages: { display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" },
  footer: { padding: "16px 24px 24px", borderTop: "1px solid #1e1e1e", flexShrink: 0 },
  mapContainer: { flex: 1, overflow: "hidden" },
  typingWrapper: { display: "flex" },
  typingBubble: {
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "14px",
    padding: "12px 16px", display: "flex", gap: "5px", alignItems: "center",
  },
  dot: {
    display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
    background: "#888", animation: "bounce 1.2s infinite ease-in-out",
  },
};