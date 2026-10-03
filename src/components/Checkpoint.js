"use client";
import { useState, useEffect } from "react";
import { themes, font, radius } from "@/lib/theme";
import { useSpeaker } from "@/lib/audio";

// Flashcard review. Used for the quick check after lessons and for due-word reviews.
// Every rating is saved through onRate so it updates the word's review schedule.
export default function Checkpoint({ words, title = "Review", theme, onRate, onClose }) {
  const t = themes[theme];
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gotIt, setGotIt] = useState(0);
  const [playing, play] = useSpeaker();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finished = idx >= words.length;
  const word = words[idx];

  function rate(rating) {
    onRate(word, rating);
    if (rating === "easy") setGotIt((n) => n + 1);
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: "380px",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: radius.lg,
          padding: "24px",
          textAlign: "center",
          position: "relative",
          boxShadow: t.shadowLg,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "30px",
            height: "30px",
            borderRadius: radius.sm,
            border: "none",
            background: "transparent",
            color: t.textMuted,
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {finished ? (
          <>
            <p style={{ fontFamily: font.cn, fontSize: "40px", color: t.accent, margin: "4px 0 8px" }}>好</p>
            <p style={{ fontSize: "16px", fontWeight: 600, color: t.text, margin: "0 0 6px" }}>Review done</p>
            <p style={{ fontSize: "13px", color: t.textMuted, margin: "0 0 20px", lineHeight: 1.55 }}>
              {gotIt} of {words.length} came back easily. Shaky words will come back sooner.
            </p>
            <PrimaryButton t={t} onClick={onClose}>
              Done
            </PrimaryButton>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: t.textMuted,
                margin: "0 0 10px",
              }}
            >
              {title} · {idx + 1} of {words.length}
            </p>
            <div style={{ height: "3px", background: t.border, borderRadius: radius.full, margin: "0 0 20px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(idx / words.length) * 100}%`,
                  height: "100%",
                  background: t.accent,
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <button
              onClick={() => play(word.chinese)}
              title="Play pronunciation"
              style={{
                fontFamily: font.cn,
                fontSize: "42px",
                color: t.accent,
                background: "none",
                border: "none",
                margin: "0 0 4px",
                opacity: playing === word.chinese ? 0.6 : 1,
              }}
            >
              {word.chinese}
            </button>

            <div style={{ minHeight: "58px", marginBottom: "16px" }}>
              {revealed ? (
                <>
                  <p style={{ fontSize: "13.5px", fontStyle: "italic", color: t.textSecondary, margin: "0 0 4px" }}>
                    {word.pinyin}
                  </p>
                  <p style={{ fontSize: "15px", color: t.text, margin: 0 }}>{word.meaning}</p>
                </>
              ) : (
                <p style={{ fontSize: "12.5px", color: t.textMuted, margin: "8px 0 0" }}>
                  Do you remember how to say it and what it means? Tap the word to hear it.
                </p>
              )}
            </div>

            {revealed ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => rate("hard")}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: radius.md,
                    background: "transparent",
                    border: `1px solid ${t.border}`,
                    color: t.textSecondary,
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Still shaky
                </button>
                <PrimaryButton t={t} onClick={() => rate("easy")}>
                  Got it
                </PrimaryButton>
              </div>
            ) : (
              <PrimaryButton t={t} onClick={() => setRevealed(true)}>
                Show answer
              </PrimaryButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, t }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        width: "100%",
        padding: "11px",
        borderRadius: radius.md,
        background: t.accent,
        border: "none",
        color: t.btnText,
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
