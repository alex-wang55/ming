"use client";
// app/page.js
import { useState, useRef, useEffect } from "react";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";

const WELCOME = {
  role: "assistant",
  content: "嗨！Hi! I'm Ming — your personal Mandarin coach. Before we dive in, tell me: what's your reason for learning Mandarin? There's no wrong answer.",
};

export default function Home() {
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    // Add user message immediately
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Strip the initial welcome from history — it's UI only, not part of API conversation
      const apiMessages = updatedMessages.slice(1);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Something went wrong — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoChar}>明</span>
          <span style={styles.logoText}>Ming</span>
        </div>
        <span style={styles.tagline}>Mandarin coach</span>
      </header>

      {/* Messages */}
      <main style={styles.main}>
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <Message key={i} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer style={styles.footer}>
        <ChatInput onSend={sendMessage} disabled={loading} />
      </footer>
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
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: "680px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #1e1e1e",
    flexShrink: 0,
  },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoChar: {
    fontSize: "22px",
    fontFamily: "'Noto Sans SC', sans-serif",
    color: "#d4a843",
    fontWeight: 500,
  },
  logoText: { fontSize: "18px", fontWeight: 500, color: "#f0f0f0" },
  tagline: { fontSize: "13px", color: "#555" },
  main: { flex: 1, overflowY: "auto", padding: "24px 24px 0" },
  messages: { display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "24px" },
  footer: {
    padding: "16px 24px 24px",
    borderTop: "1px solid #1e1e1e",
    flexShrink: 0,
  },
  typingWrapper: { display: "flex" },
  typingBubble: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px",
    padding: "12px 16px",
    display: "flex",
    gap: "5px",
    alignItems: "center",
  },
  dot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#888",
    animation: "bounce 1.2s infinite ease-in-out",
  },
};
