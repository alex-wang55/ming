"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { themes, font, radius } from "@/lib/theme";

export default function WordsTab({ userId, theme }) {
  const t = themes[theme];
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    supabase
      .from("words")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setWords(data || []);
        setLoading(false);
      });
  }, [userId]);

  async function speak(word) {
    if (playingId) return;
    setPlayingId(word.id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word.chinese }),
      });
      const data = await res.json();
      if (data.audio) {
        const a = new Audio(`data:audio/mp3;base64,${data.audio}`);
        a.onended = () => setPlayingId(null);
        a.play();
      } else setPlayingId(null);
    } catch {
      setPlayingId(null);
    }
  }

  if (loading)
    return (
      <Centered t={t}>
        <Spinner t={t} />
      </Centered>
    );

  if (!words.length)
    return (
      <Centered t={t}>
        <p style={{ fontFamily: font.cn, fontSize: "40px", color: t.accent, opacity: 0.2, margin: "0 0 14px" }}>
          字
        </p>
        <p style={{ fontSize: "15px", fontWeight: 600, color: t.text, margin: "0 0 6px" }}>No words yet</p>
        <p style={{ fontSize: "13px", color: t.textMuted, maxWidth: "260px", lineHeight: 1.6, margin: 0 }}>
          Words Ming teaches you get saved here automatically, with review timing built in.
        </p>
      </Centered>
    );

  const now = new Date();
  const due = words.filter((w) => new Date(w.next_review) <= now);
  const shown = filter === "due" ? due : words;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "22px 26px", background: t.bg }}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")} t={t}>
          All {words.length}
        </FilterTab>
        <FilterTab active={filter === "due"} onClick={() => setFilter("due")} t={t}>
          Due {due.length}
        </FilterTab>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: "10px" }}>
        {shown.map((w) => {
          const isDue = new Date(w.next_review) <= now;
          const isPlaying = playingId === w.id;
          return (
            <button
              key={w.id}
              onClick={() => speak(w)}
              style={{
                textAlign: "left",
                background: isDue ? t.accentSoft : t.surface,
                border: `1px solid ${isDue ? t.accentBorder : t.border}`,
                borderRadius: radius.md,
                padding: "14px",
                boxShadow: t.shadow,
                opacity: isPlaying ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" }}>
                <span style={{ fontFamily: font.cn, fontSize: "24px", fontWeight: 500, color: t.accent, lineHeight: 1.1 }}>
                  {w.chinese}
                </span>
                <SpeakerIcon color={t.textMuted} />
              </div>
              <p style={{ fontSize: "11.5px", fontStyle: "italic", color: t.textSecondary, margin: "0 0 3px" }}>
                {w.pinyin}
              </p>
              <p style={{ fontSize: "13px", color: t.text, margin: "0 0 9px" }}>{w.meaning}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: t.textFaint }}>Seen {w.times_seen}x</span>
                {isDue && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: t.accent,
                      background: "transparent",
                      border: `1px solid ${t.accentBorder}`,
                      borderRadius: radius.full,
                      padding: "2px 7px",
                    }}
                  >
                    Review
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterTab({ children, active, onClick, t }) {
  return (
    <button
      onClick={onClick}
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
