"use client";
import { useState } from "react";

export default function Message({ message, theme }) {
  const isAI = message.role === "assistant";
  const isDark = theme === "dark";
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", justifyContent: isAI ? "flex-start" : "flex-end" }}>
      {isAI && <Avatar isDark={isDark} />}
      <div style={isAI ? {
        background: isDark ? "#111110" : "#ffffff",
        border: `1px solid ${isDark ? "rgba(212,168,67,0.1)" : "#e8e0d4"}`,
        borderRadius: "14px 14px 14px 3px",
        padding: "12px 16px", maxWidth: "80%",
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.06)",
      } : {
        background: "#fff7ec",
        border: "1px solid #e8d4a8",
        borderRadius: "14px 14px 3px 14px",
        padding: "12px 16px", maxWidth: "80%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <FormattedContent content={message.content} isDark={isDark} />
      </div>
    </div>
  );
}

function FormattedContent({ content, isDark }) {
  const parts = content.split(/([\u4e00-\u9fff\u3400-\u4dbf，。！？、：；""''（）【】《》]+)/g);
  return (
    <p style={{ fontSize: "15px", lineHeight: "1.65", color: isDark ? "#f0ece0" : "#2d2520", margin: 0, whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) => {
        const isChinese = /[\u4e00-\u9fff]/.test(part);
        return isChinese ? <ChineseWord key={i} text={part} isDark={isDark} /> : part;
      })}
    </p>
  );
}

function ChineseWord({ text, isDark }) {
  const [playing, setPlaying] = useState(false);

  async function speak() {
    if (playing) return;
    setPlaying(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.onended = () => setPlaying(false);
        audio.play();
      }
    } catch { setPlaying(false); }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
      <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843", fontWeight: 500, background: isDark ? "rgba(212,168,67,0.08)" : "#fff7ec", borderRadius: "4px", padding: "0 3px" }}>{text}</span>
      <button onClick={speak} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "0 2px", lineHeight: 1, opacity: playing ? 0.5 : 1, transition: "opacity 0.15s" }}>
        {playing ? "🔊" : "🔈"}
      </button>
    </span>
  );
}

function Avatar({ isDark }) {
  return (
    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: isDark ? "transparent" : "#fff7ec", border: `1px solid ${isDark ? "rgba(212,168,67,0.3)" : "#e8d4a8"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "13px", color: "#d4a843", fontWeight: 700 }}>明</span>
    </div>
  );
}