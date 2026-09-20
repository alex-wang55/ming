"use client";
import { useState } from "react";
import { themes, font, radius } from "@/lib/theme";

export default function Checkpoint({ words, theme, onFinish }) {
  const t = themes[theme];
  const [idx, setIdx] = useState(0);
  const [ratings, setRatings] = useState([]);

  if (!words.length) {
    onFinish([]);
    return null;
  }

  const word = words[idx];

  function rate(value) {
    const next = [...ratings, { word: word.chinese, rating: value }];
    if (idx + 1 < words.length) {
      setRatings(next);
      setIdx(idx + 1);
    } else {
      onFinish(next);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: radius.lg,
          padding: "26px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.textMuted, margin: "0 0 14px" }}>
          Quick check · {idx + 1} of {words.length}
        </p>

        <p style={{ fontFamily: font.cn, fontSize: "38px", color: t.accent, margin: "0 0 6px" }}>{word.chinese}</p>
        <p style={{ fontSize: "13px", fontStyle: "italic", color: t.textSecondary, margin: "0 0 4px" }}>{word.pinyin}</p>
        <p style={{ fontSize: "14px", color: t.text, margin: "0 0 22px" }}>{word.meaning}</p>

        <p style={{ fontSize: "12.5px", color: t.textMuted, margin: "0 0 12px" }}>Did that come back to you easily?</p>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => rate("hard")}
            style={{
              flex: 1, padding: "10px", borderRadius: radius.md,
              background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "13px",
            }}
          >
            Still shaky
          </button>
          <button
            onClick={() => rate("easy")}
            style={{
              flex: 1, padding: "10px", borderRadius: radius.md,
              background: t.accent, border: "none", color: t.btnText, fontSize: "13px", fontWeight: 600,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}