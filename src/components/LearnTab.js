"use client";
import { LESSONS } from "@/lib/lessons";
import RightPanel from "@/components/RightPanel";
import { themes, radius } from "@/lib/theme";

export default function LearnTab({ completedLessons, onStartLesson, wordCount, streak, theme }) {
  const t = themes[theme];
  const total = LESSONS.reduce((s, w) => s + w.lessons.length, 0);
  const done = completedLessons.length;

  function stateOf(weekIdx, lessonIdx) {
    const id = LESSONS[weekIdx].lessons[lessonIdx].id;
    if (completedLessons.includes(id)) return "done";
    for (let wi = 0; wi < LESSONS.length; wi++) {
      for (let li = 0; li < LESSONS[wi].lessons.length; li++) {
        if (!completedLessons.includes(LESSONS[wi].lessons[li].id)) {
          return wi === weekIdx && li === lessonIdx ? "active" : "locked";
        }
      }
    }
    return "locked";
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: t.bg }}>
        <div style={{ maxWidth: "460px", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: t.textSecondary }}>Overall progress</span>
            <span style={{ fontSize: "12px", color: t.accent, fontWeight: 600 }}>
              {done} of {total}
            </span>
          </div>
          <div style={{ height: "4px", background: t.border, borderRadius: radius.full, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(done / total) * 100}%`,
                background: t.accent,
                borderRadius: radius.full,
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "460px" }}>
          {LESSONS.map((week, wi) => {
            const weekDone = week.lessons.filter((l) => completedLessons.includes(l.id)).length;
            return (
              <section key={wi}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: t.text, margin: "0 0 2px", letterSpacing: "-0.01em" }}>
                      {week.weekTitle}
                    </h2>
                    <p style={{ fontSize: "12px", color: t.textMuted, margin: 0 }}>{week.weekSub}</p>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: weekDone === week.lessons.length ? t.success : t.textFaint,
                    }}
                  >
                    {weekDone}/{week.lessons.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {week.lessons.map((lesson, li) => {
                    const state = stateOf(wi, li);
                    const prevDone = li > 0 && completedLessons.includes(week.lessons[li - 1].id);
                    return (
                      <div key={lesson.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {li > 0 && (
                          <div
                            style={{
                              width: "2px",
                              height: "14px",
                              background: prevDone ? t.accent : t.border,
                              opacity: prevDone ? 0.35 : 1,
                            }}
                          />
                        )}
                        <LessonRow
                          lesson={lesson}
                          state={state}
                          t={t}
                          onClick={() => state !== "locked" && onStartLesson(lesson)}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <RightPanel
        completedLessons={completedLessons}
        wordCount={wordCount}
        streak={streak}
        onStartLesson={onStartLesson}
        theme={theme}
      />
    </div>
  );
}

function LessonRow({ lesson, state, t, onClick }) {
  const done = state === "done";
  const active = state === "active";
  const locked = state === "locked";

  return (
    <button
      onClick={onClick}
      disabled={locked}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: radius.md,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        background: active ? t.accentSoft : t.surface,
        border: `1px solid ${done ? t.successBorder : active ? t.accentBorder : t.border}`,
        opacity: locked ? 0.42 : 1,
        cursor: locked ? "not-allowed" : "pointer",
        boxShadow: active ? t.shadowLg : t.shadow,
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: radius.sm,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done ? t.successSoft : active ? t.accentSoft : "transparent",
          border: `1px solid ${done ? t.successBorder : active ? t.accentBorder : t.border}`,
          color: done ? t.success : active ? t.accent : t.textFaint,
        }}
      >
        {done ? <CheckIcon /> : locked ? <LockIcon /> : <DotIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "13.5px",
            fontWeight: 500,
            margin: "0 0 2px",
            color: done ? t.success : active ? t.accent : locked ? t.textFaint : t.text,
          }}
        >
          {lesson.title}
        </p>
        <p
          style={{
            fontSize: "11.5px",
            color: t.textMuted,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lesson.sub}
        </p>
      </div>

      {active && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: t.accent,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
          }}
        >
          Continue <ChevronIcon />
        </span>
      )}
    </button>
  );
}

const sv = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
function CheckIcon() {
  return (
    <svg {...sv}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg {...sv} strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg {...sv}>
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
