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
        return isChinese
          ? <ChineseWord key={i} text={part} />
          : part;
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
    } catch {
      setPlaying(false);
    }
  }

  return (
    <span style={styles.chineseGroup}>
      <span style={styles.chinese}>{text}</span>
      <button
        onClick={speak}
        style={{ ...styles.speakBtn, opacity: playing ? 0.5 : 1 }}
        title="Hear pronunciation"
      >
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
  wrapper: { display: "flex", alignItems: "flex-end", gap: "10px" },
  aiBubble: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px 14px 14px 4px",
    padding: "12px 16px",
    maxWidth: "82%",
  },
  userBubble: {
    background: "#1e2a3a",
    border: "1px solid #2a3d55",
    borderRadius: "14px 14px 4px 14px",
    padding: "12px 16px",
    maxWidth: "82%",
  },
  text: { fontSize: "15px", lineHeight: "1.65", color: "#f0f0f0", margin: 0, whiteSpace: "pre-wrap" },
  chineseGroup: { display: "inline-flex", alignItems: "center", gap: "3px" },
  chinese: { fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843", fontWeight: 500 },
  speakBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "13px", padding: "0 2px", lineHeight: 1,
    transition: "opacity 0.15s",
  },
  avatar: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: "rgba(212, 168, 67, 0.12)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarChar: { fontFamily: "'Noto Sans SC', sans-serif", fontSize: "14px", color: "#d4a843", fontWeight: 500 },
};