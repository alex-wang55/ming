"use client";
import { LESSONS } from "@/lib/lessons";
import { themes, font, radius } from "@/lib/theme";
import { useSpeaker } from "@/lib/audio";
import { daysUntil } from "@/lib/dates";
import StreakCalendar from "@/components/StreakCalendar";

const WORDS = [
  { chinese: "谢谢", pinyin: "xiè xie", meaning: "Thank you" },
  { chinese: "你好", pinyin: "nǐ hǎo", meaning: "Hello" },
  { chinese: "再见", pinyin: "zài jiàn", meaning: "Goodbye" },
  { chinese: "对不起", pinyin: "duì bu qǐ", meaning: "Sorry" },
  { chinese: "多少钱", pinyin: "duōshao qián", meaning: "How much?" },
  { chinese: "好吃", pinyin: "hǎo chī", meaning: "Delicious" },
  { chinese: "朋友", pinyin: "péng yǒu", meaning: "Friend" },
  { chinese: "加油", pinyin: "jiā yóu", meaning: "You can do it!" },
  { chinese: "没关系", pinyin: "méi guān xi", meaning: "It's okay" },
  { chinese: "慢慢来", pinyin: "màn màn lái", meaning: "Take your time" },
  { chinese: "开心", pinyin: "kāi xīn", meaning: "Happy" },
];

function dayOfYear(d = new Date()) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

// Desktop: a narrow column beside the lesson path. Phone (inline): a grid of
// cards below it, without "Up next" since the active lesson is highlighted above.
export default function RightPanel({
  completedLessons,
  wordCount,
  streak,
  activity,
  onStartLesson,
  theme,
  goalText,
  deadlineDate,
  inline = false,
}) {
  const t = themes[theme];
  const [playing, play] = useSpeaker();

  const word = WORDS[dayOfYear() % WORDS.length];
  const allLessons = LESSONS.flatMap((w) => w.lessons);
  const next = allLessons.find((l) => !completedLessons.includes(l.id));
  const done = completedLessons.length;
  const pct = Math.round((done / allLessons.length) * 100);

  const R = 15;
  const C = 2 * Math.PI * R;

  const days = deadlineDate ? daysUntil(deadlineDate) : null;

  return (
    <aside
      style={
        inline
          ? { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }
          : {
              width: "212px",
              flexShrink: 0,
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              overflowY: "auto",
              borderLeft: `1px solid ${t.border}`,
              background: t.bg,
            }
      }
    >
      <div
        style={{
          background: t.accentSoft,
          border: `1px solid ${t.accentBorder}`,
          borderRadius: radius.lg,
          padding: "13px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Label t={t} color={t.accent}>
          Word of the day
        </Label>
        <p style={{ fontFamily: font.cn, fontSize: "30px", fontWeight: 500, color: t.accent, margin: "0 0 2px", lineHeight: 1 }}>
          {word.chinese}
        </p>
        <p style={{ fontSize: "11.5px", fontStyle: "italic", color: t.textSecondary, margin: "0 0 2px" }}>{word.pinyin}</p>
        <p style={{ fontSize: "11.5px", color: t.textSecondary, margin: "0 0 9px" }}>{word.meaning}</p>
        <button
          onClick={() => play(word.chinese)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: 600,
            color: t.accent,
            background: "none",
            border: "none",
            padding: 0,
            opacity: playing ? 0.55 : 1,
          }}
        >
          <SpeakerIcon /> {playing ? "Playing" : "Hear it"}
        </button>
        <div
          style={{
            position: "absolute",
            right: "-8px",
            bottom: "-12px",
            fontFamily: font.cn,
            fontSize: "52px",
            opacity: 0.07,
            color: t.accent,
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          {word.chinese[0]}
        </div>
      </div>

      {days !== null && (
        <Card t={t}>
          <Label t={t}>{days > 0 ? "Days to your goal" : days === 0 ? "Deadline is today" : "Deadline passed"}</Label>
          <p style={{ fontSize: "22px", fontWeight: 700, color: days <= 3 ? t.danger : t.accent, margin: "0 0 4px" }}>
            {Math.max(days, 0)}
          </p>
          {goalText && <p style={{ fontSize: "11px", color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>{goalText}</p>}
        </Card>
      )}

      <StreakCalendar activity={activity} streak={streak} theme={theme} weeks={5} />

      <Card t={t}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div style={{ position: "relative", width: "38px", height: "38px", flexShrink: 0 }}>
            <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="19" cy="19" r={R} fill="none" stroke={t.border} strokeWidth="3.5" />
              <circle
                cx="19"
                cy="19"
                r={R}
                fill="none"
                stroke={t.accent}
                strokeWidth="3.5"
                strokeDasharray={C}
                strokeDashoffset={C - (pct / 100) * C}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                fontSize: "9.5px",
                fontWeight: 700,
                color: t.accent,
              }}
            >
              {pct}%
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: t.text, margin: "0 0 1px" }}>Course progress</p>
            <p style={{ fontSize: "10.5px", color: t.textMuted, margin: 0 }}>
              {done} of {allLessons.length} lessons
            </p>
            <p style={{ fontSize: "10.5px", color: t.textMuted, margin: 0 }}>
              {wordCount} word{wordCount === 1 ? "" : "s"} learned
            </p>
          </div>
        </div>
      </Card>

      {!inline &&
        (next ? (
          <button
            onClick={() => onStartLesson(next)}
            style={{
              textAlign: "left",
              background: t.surface,
              border: `1px solid ${t.accentBorder}`,
              borderRadius: radius.md,
              padding: "12px",
            }}
          >
            <Label t={t}>Up next</Label>
            <p style={{ fontSize: "12.5px", fontWeight: 600, color: t.text, margin: "0 0 2px" }}>{next.title}</p>
            <p style={{ fontSize: "10.5px", color: t.textMuted, margin: "0 0 9px" }}>{next.sub}</p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "10.5px",
                fontWeight: 600,
                color: t.btnText,
                background: t.accent,
                borderRadius: radius.full,
                padding: "4px 11px",
              }}
            >
              Start lesson <ChevronIcon />
            </span>
          </button>
        ) : (
          <Card t={t}>
            <p style={{ fontSize: "12.5px", fontWeight: 600, color: t.success, margin: "0 0 3px" }}>All lessons done</p>
            <p style={{ fontSize: "10.5px", color: t.textMuted, margin: 0 }}>Try the map for regional practice</p>
          </Card>
        ))}
    </aside>
  );
}

function Label({ children, t, color }) {
  return (
    <p
      style={{
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: color || t.textMuted,
        opacity: color ? 0.8 : 1,
        margin: "0 0 6px",
      }}
    >
      {children}
    </p>
  );
}

function Card({ children, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius.md, padding: "12px" }}>
      {children}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
