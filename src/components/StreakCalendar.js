"use client";
import { themes, radius } from "@/lib/theme";

// activity: array of { date: "YYYY-MM-DD", count: number }
export default function StreakCalendar({ activity = [], streak = 0, theme, weeks = 5 }) {
  const t = themes[theme];

  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const totalDays = weeks * 7;
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

  const byDate = Object.fromEntries(activity.map((a) => [a.date, a.count]));

  const cells = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, count: byDate[key] || 0, future: d > today };
  });

  const levels = [
    "transparent",
    "rgba(90,154,90,0.18)",
    "rgba(90,154,90,0.45)",
    "rgba(90,154,90,0.85)",
  ];
  const levelOf = (c) => (c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : 3);

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius.md, padding: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "11px" }}>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: t.textMuted,
          }}
        >
          Last {weeks} weeks
        </span>
        <span style={{ fontSize: "15px", fontWeight: 700, color: t.warning }}>
          {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "9px" }}>
        {cells.map((c) => (
          <div
            key={c.key}
            title={`${c.key}: ${c.count} session${c.count === 1 ? "" : "s"}`}
            style={{
              aspectRatio: "1",
              borderRadius: "3px",
              background: c.future ? "transparent" : levels[levelOf(c.count)],
              border: `1px solid ${c.count === 0 || c.future ? t.border : "transparent"}`,
              opacity: c.future ? 0.35 : 1,
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "5px", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "9px", color: t.textFaint }}>Less</span>
        {levels.map((bg, i) => (
          <div
            key={i}
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "2px",
              background: bg,
              border: `1px solid ${i === 0 ? t.border : "transparent"}`,
            }}
          />
        ))}
        <span style={{ fontSize: "9px", color: t.textFaint }}>More</span>
      </div>
    </div>
  );
}
