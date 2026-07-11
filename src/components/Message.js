"use client";
import { useState } from "react";

export default function Message({ message }) {
  const isAI = message.role === "assistant";
  return (
    <div style={{ ...styles.wrapper, justifyContent: isAI ? "flex-start" : "flex-end" }}>
      {isAI && <Avatar />}
      <div style={isAI ? styles.aiBubble : styles.userBubble}>
        <FormattedContent content={message.content} />
      </div>
    </div>
  );
}

function FormattedContent({ content }) {
  const parts = content.split(/([\u4e00-\u9fff\u3400-\u4dbf，。！？、：；""''（）【】《》]+)/g);
  return (
    <p style={styles.text}>
      {parts.map((part, i) => {
        const isChinese = /[\u4e00-\u9fff]/.test(part);
        return isChinese ? <ChineseWord key={i} text={part} /> : part;
      })}
    </p>
  );
}

function ChineseWord({ text }) {
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
    <span style={styles.chineseGroup}>
      <span style={styles.chinese}>{text}</span>
      <button onClick={speak} style={{ ...styles.speakBtn, opacity: playing ? 0.5 : 1 }}>
        {playing ? "🔊" : "🔈"}
      </button>
    </span>
  );
}

function Avatar() {
  return (
    <div style={styles.avatar}>
      <span style={styles.avatarChar}>明</span>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", alignItems: "flex-end", gap: "8px" },
  aiBubble: {
    background: "#ffffff",
    border: "1px solid #e8e0d4",
    borderRadius: "14px 14px 14px 3px",
    padding: "12px 16px", maxWidth: "80%",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  userBubble: {
    background: "#fff7ec",
    border: "1px solid #e8d4a8",
    borderRadius: "14px 14px 3px 14px",
    padding: "12px 16px", maxWidth: "80%",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  text: { fontSize: "15px", lineHeight: "1.65", color: "#2d2520", margin: 0, whiteSpace: "pre-wrap" },
  chineseGroup: { display: "inline-flex", alignItems: "center", gap: "3px" },
  chinese: {
    fontFamily: "'Noto Sans SC', sans-serif", color: "#8b6a3a", fontWeight: 500,
    background: "#fff7ec", borderRadius: "4px", padding: "0 3px",
  },
  speakBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "12px", padding: "0 2px", lineHeight: 1, transition: "opacity 0.15s",
  },
  avatar: {
    width: "30px", height: "30px", borderRadius: "50%",
    background: "#fff7ec", border: "1px solid #e8d4a8",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarChar: { fontFamily: "'Noto Sans SC', sans-serif", fontSize: "13px", color: "#8b6a3a", fontWeight: 500 },
};