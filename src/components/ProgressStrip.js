"use client";
import { LESSONS } from "@/lib/lessons";
import { themes, radius } from "@/lib/theme";

export default function ProgressStrip({ completedLessons, streak, dueCount = 0, onReview, theme }) {
  const t = themes[theme];

  const found = LESSONS.findIndex((w) => w.lessons.some((l) => !completedLessons.includes(l.id)));
  const weekIdx = found === -1 ? LESSONS.length - 1 : found;
  const week = LESSONS[weekIdx];
  const done = week.lessons.filter((l) => completedLessons.includes(l.id)).length;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: radius.md,
        padding: "12px 15px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: t.shadow,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
          <span
            style={{
              fontSize: "11.5px",
              color: t.text,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {week.weekTitle}
          </span>
          <span style={{ fontSize: "11px", color: t.accent, fontWeight: 600, flexShrink: 0 }}>
            {done} / {week.lessons.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: "3px" }}>
          {week.lessons.map((l) => (
            <div
              key={l.id}
              style={{
                flex: 1,
                height: "5px",
                borderRadius: radius.full,
                background: completedLessons.includes(l.id) ? t.accent : t.border,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ width: "1px", height: "30px", background: t.border, flexShrink: 0 }} />

      <Stat value={streak} label="day streak" color={t.warning} t={t} />
      <Stat
        value={dueCount}
        label="to review"
        color={t.accent}
        t={t}
        onClick={dueCount > 0 ? onReview : undefined}
      />
    </div>
  );
}

function Stat({ value, label, color, t, onClick }) {
  const content = (
    <>
      <p style={{ fontSize: "16px", fontWeight: 700, color, margin: 0, lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: "9.5px", color: t.textMuted, margin: 0, whiteSpace: "nowrap" }}>{label}</p>
    </>
  );
  if (!onClick) return <div style={{ textAlign: "center", flexShrink: 0 }}>{content}</div>;
  return (
    <button
      onClick={onClick}
      title="Start a review"
      style={{
        textAlign: "center",
        flexShrink: 0,
        background: t.accentSoft,
        border: `1px solid ${t.accentBorder}`,
        borderRadius: radius.sm,
        padding: "4px 8px",
      }}
    >
      {content}
    </button>
  );
}
