"use client";
import { useState } from "react";
import { themes, font, radius } from "@/lib/theme";
import { useSpeaker } from "@/lib/audio";
import { isDue, describeNextReview } from "@/lib/review";

export default function WordsTab({ words, loading, onReview, theme, isMobile }) {
  const t = themes[theme];
  const [filter, setFilter] = useState("all");
  const [playing, play] = useSpeaker();

  if (loading)
    return (
      <Centered t={t}>
        <Spinner t={t} />
      </Centered>
    );

  if (!words.length)
    return (
      <Centered t={t}>
        <p style={{ fontFamily: font.cn, fontSize: "40px", color: t.accent, opacity: 0.2, margin: "0 0 14px" }}>字</p>
        <p style={{ fontSize: "15px", fontWeight: 600, color: t.text, margin: "0 0 6px" }}>No words yet</p>
        <p style={{ fontSize: "13px", color: t.textMuted, maxWidth: "260px", lineHeight: 1.6, margin: 0 }}>
          New words Ming teaches you in chat are saved here automatically, with review timing built in.
        </p>
      </Centered>
    );

  const due = words.filter((w) => isDue(w));
  const shown = filter === "due" ? due : words;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: isMobile ? "16px 14px 24px" : "22px 26px", background: t.bg }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "18px", alignItems: "center", flexWrap: "wrap" }}>
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")} t={t}>
          All {words.length}
        </FilterTab>
        <FilterTab active={filter === "due"} onClick={() => setFilter("due")} t={t}>
          Due {due.length}
        </FilterTab>
        <div style={{ flex: 1 }} />
        {due.length > 0 && (
          <button
            onClick={onReview}
            style={{
              padding: "7px 16px",
              borderRadius: radius.full,
              background: t.accent,
              border: "none",
              color: t.btnText,
              fontSize: "12.5px",
              fontWeight: 600,
            }}
          >
            Review {due.length} word{due.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {filter === "due" && !due.length ? (
        <p style={{ fontSize: "13px", color: t.textMuted, textAlign: "center", padding: "40px 0" }}>
          Nothing due right now. Nice work.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 140 : 168}px, 1fr))`,
            gap: "10px",
          }}
        >
          {shown.map((w) => {
            const wordDue = isDue(w);
            return (
              <button
                key={w.id}
                onClick={() => play(w.chinese)}
                title="Play pronunciation"
                style={{
                  textAlign: "left",
                  background: wordDue ? t.accentSoft : t.surface,
                  border: `1px solid ${wordDue ? t.accentBorder : t.border}`,
                  borderRadius: radius.md,
                  padding: "14px",
                  boxShadow: t.shadow,
                  opacity: playing === w.chinese ? 0.6 : 1,
                  transition: "all 0.15s",
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px", marginBottom: "5px" }}>
                  <span
                    style={{
                      fontFamily: font.cn,
                      fontSize: "24px",
                      fontWeight: 500,
                      color: t.accent,
                      lineHeight: 1.1,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {w.chinese}
                  </span>
                  <SpeakerIcon color={t.textMuted} />
                </div>
                <p style={{ fontSize: "11.5px", fontStyle: "italic", color: t.textSecondary, margin: "0 0 3px" }}>{w.pinyin}</p>
                <p style={{ fontSize: "13px", color: t.text, margin: "0 0 9px" }}>{w.meaning}</p>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: wordDue ? 700 : 400,
                    color: wordDue ? t.accent : t.textFaint,
                    letterSpacing: wordDue ? "0.04em" : 0,
                  }}
                >
                  {describeNextReview(w)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterTab({ children, active, onClick, t }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "6px 14px",
        borderRadius: radius.full,
        fontSize: "12px",
        fontWeight: 500,
        background: active ? t.accentSoft : "transparent",
        border: `1px solid ${active ? t.accentBorder : t.border}`,
        color: active ? t.accent : t.textMuted,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Centered({ children, t }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
        background: t.bg,
      }}
    >
      {children}
    </div>
  );
}

function Spinner({ t }) {
  return (
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        border: `2px solid ${t.border}`,
        borderTopColor: t.accent,
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

function SpeakerIcon({ color }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: "3px" }}
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
