"use client";
import { useState } from "react";
import { themes, font, radius } from "@/lib/theme";

export default function Message({ message, theme }) {
  const t = themes[theme];
  const isAI = message.role === "assistant";

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        justifyContent: isAI ? "flex-start" : "flex-end",
      }}
    >
      {isAI && (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: radius.full,
            border: `1px solid ${t.accentBorder}`,
            background: t.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <span style={{ fontFamily: font.cn, fontSize: "12px", color: t.accent, fontWeight: 700 }}>
            明
          </span>
        </div>
      )}

      <div
        style={{
          background: isAI ? t.surface : t.accentSoft,
          border: `1px solid ${isAI ? t.border : t.accentBorder}`,
          borderRadius: isAI
            ? `${radius.lg} ${radius.lg} ${radius.lg} 4px`
            : `${radius.lg} ${radius.lg} 4px ${radius.lg}`,
          padding: "11px 15px",
          maxWidth: "76%",
          boxShadow: t.shadow,
        }}
      >
        <Content content={message.content} t={t} />
      </div>
    </div>
  );
}

function Content({ content, t }) {
  const parts = content.split(/([\u4e00-\u9fff\u3400-\u4dbf]+)/g);
  return (
    <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: t.text, margin: 0, whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) =>
        /[\u4e00-\u9fff]/.test(part) ? <Hanzi key={i} text={part} t={t} /> : part
      )}
    </p>
  );
}

function Hanzi({ text, t }) {
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
      } else setPlaying(false);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <button
      onClick={speak}
      title="Play pronunciation"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontFamily: font.cn,
        fontSize: "16px",
        fontWeight: 500,
        color: t.accent,
        background: "transparent",
        border: "none",
        borderBottom: `1px dotted ${t.accentBorder}`,
        padding: "0 1px",
        margin: 0,
        lineHeight: 1.4,
        opacity: playing ? 0.55 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {text}
      <SpeakerIcon color={t.textMuted} animated={playing} />
    </button>
  );
}

function SpeakerIcon({ color, animated }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, animation: animated ? "pulse 0.8s ease-in-out infinite" : "none" }}
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
