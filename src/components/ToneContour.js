"use client";
import { themes, font, radius } from "@/lib/theme";

// Pitch contours on an 80x26 grid. Higher on screen = higher pitch.
const CONTOURS = {
  1: { path: "M4 6 L76 6", label: "Flat and high" },
  2: { path: "M4 20 L76 5", label: "Rising" },
  3: { path: "M4 8 Q22 22 40 21 Q58 20 76 6", label: "Dip then rise" },
  4: { path: "M4 5 L76 21", label: "Sharp fall" },
  5: { path: "M30 13 L50 13", label: "Neutral" },
};

export function ToneGraph({ tone, color, height = 26 }) {
  const c = CONTOURS[tone] || CONTOURS[5];
  return (
    <svg width="100%" height={height} viewBox="0 0 80 26" style={{ display: "block" }}>
      <line x1="0" y1="25" x2="80" y2="25" stroke={color} strokeWidth="1" opacity="0.15" />
      <path d={c.path} stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ToneCard({ hanzi, pinyin, tone, meaning, theme, onPlay }) {
  const t = themes[theme];
  const c = CONTOURS[tone] || CONTOURS[5];

  return (
    <button
      onClick={onPlay}
      style={{
        flex: 1,
        minWidth: "118px",
        textAlign: "left",
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: radius.md,
        padding: "12px 14px",
        cursor: onPlay ? "pointer" : "default",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "7px", marginBottom: "8px" }}>
        <span style={{ fontFamily: font.cn, fontSize: "22px", fontWeight: 500, color: t.accent }}>{hanzi}</span>
        <span style={{ fontSize: "12px", color: t.textSecondary, fontStyle: "italic" }}>{pinyin}</span>
      </div>
      <ToneGraph tone={tone} color={t.accent} />
      <p style={{ fontSize: "11px", color: t.textMuted, margin: "6px 0 0" }}>
        {c.label} · {meaning}
      </p>
    </button>
  );
}

export default function ToneReference({ theme, onPlay }) {
  const t = themes[theme];
  const set = [
    { hanzi: "妈", pinyin: "mā", tone: 1, meaning: "mother" },
    { hanzi: "麻", pinyin: "má", tone: 2, meaning: "hemp" },
    { hanzi: "马", pinyin: "mǎ", tone: 3, meaning: "horse" },
    { hanzi: "骂", pinyin: "mà", tone: 4, meaning: "scold" },
  ];

  return (
    <div>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: t.textMuted,
          margin: "0 0 10px",
        }}
      >
        The four tones
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {set.map((s) => (
          <ToneCard key={s.hanzi} {...s} theme={theme} onPlay={onPlay ? () => onPlay(s.hanzi) : null} />
        ))}
      </div>
      <p style={{ fontSize: "11.5px", color: t.textMuted, margin: "10px 0 0", lineHeight: 1.55 }}>
        Same syllable, four meanings. This is why tone accuracy matters more in Mandarin than in most languages.
      </p>
    </div>
  );
}
