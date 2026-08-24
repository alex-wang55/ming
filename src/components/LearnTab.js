"use client";
import { LESSONS } from "@/lib/lessons";
import RightPanel from "@/components/RightPanel";

export default function LearnTab({ completedLessons, onStartLesson, wordCount, streak, theme }) {
  const isDark = theme === "dark";
  const totalLessons = LESSONS.reduce((s, w) => s + w.lessons.length, 0);
  const completedCount = completedLessons.length;

  function getLessonState(lessonId, weekIdx, lessonIdx) {
    if (completedLessons.includes(lessonId)) return "done";
    for (let wi = 0; wi < LESSONS.length; wi++) {
      for (let li = 0; li < LESSONS[wi].lessons.length; li++) {
        const id = LESSONS[wi].lessons[li].id;
        if (!completedLessons.includes(id)) {
          if (wi === weekIdx && li === lessonIdx) return "active";
          return "locked";
        }
      }
    }
    return "locked";
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Lesson path */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: isDark ? "#080808" : "#faf8f4" }}>
        {/* Progress bar */}
        <div style={{ height: "3px", background: isDark ? "#1a1a1a" : "#e8e0d4", borderRadius: "2px", marginBottom: "24px", overflow: "hidden" }}>
          <div style={{ height: "100%", background: isDark ? "linear-gradient(90deg,#8b6a2a,#d4a843)" : "linear-gradient(90deg,#c8dab8,#4a8a4a)", borderRadius: "2px", width: `${(completedCount / totalLessons) * 100}%`, transition: "width 0.4s ease" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "440px" }}>
          {LESSONS.map((week, wi) => (
            <div key={wi}>
              <div style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#f0f0f0" : "#2d2520", margin: "0 0 2px", fontFamily: "Georgia, serif" }}>{week.weekTitle}</p>
                <p style={{ fontSize: "12px", color: isDark ? "#555" : "#bbb", margin: 0 }}>{week.weekSub}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                {week.lessons.map((lesson, li) => {
                  const state = getLessonState(lesson.id, wi, li);
                  const isDone = state === "done";
                  const isActive = state === "active";
                  const isLocked = state === "locked";

                  return (
                    <div key={lesson.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {li > 0 && (
                        <div style={{ width: "1.5px", height: "16px", background: isDark ? (completedLessons.includes(week.lessons[li - 1].id) ? "#d4a843" : "#1a1a1a") : (completedLessons.includes(week.lessons[li - 1].id) ? "#c8dab8" : "#e8e0d4") }} />
                      )}
                      <div
                        style={{
                          width: "100%", borderRadius: "10px", padding: "12px 14px",
                          display: "flex", alignItems: "center", gap: "12px",
                          cursor: isLocked ? "not-allowed" : "pointer",
                          opacity: isLocked ? 0.4 : 1,
                          transition: "all 0.15s",
                          background: isDark
                            ? isDone ? "#0a1a0a" : isActive ? "rgba(212,168,67,0.05)" : "#0d0d0d"
                            : isDone ? "#fafdf8" : isActive ? "#fffdf8" : "#fff",
                          border: isDark
                            ? isDone ? "1px solid #1a3a1a" : isActive ? "1.5px solid rgba(212,168,67,0.3)" : "1px solid #1a1a1a"
                            : isDone ? "1px solid #c8dab8" : isActive ? "1.5px solid #e8d4a8" : "1px solid #e8e0d4",
                          boxShadow: isActive ? (isDark ? "0 2px 12px rgba(212,168,67,0.08)" : "0 2px 8px rgba(212,168,67,0.12)") : "none",
                        }}
                        onClick={() => !isLocked && onStartLesson(lesson)}
                      >
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "9px",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          background: isDark
                            ? isDone ? "#0a2a0a" : isActive ? "rgba(212,168,67,0.1)" : "#111"
                            : isDone ? "#eef5e8" : isActive ? "#fff7ec" : "#f5f0e8",
                          border: isDark
                            ? isDone ? "1px solid #1a4a1a" : isActive ? "1px solid rgba(212,168,67,0.25)" : "1px solid #222"
                            : isDone ? "1px solid #c8dab8" : isActive ? "1px solid #e8d4a8" : "1px solid #e8e0d4",
                        }}>
                          <i className={`ti ${lesson.icon}`} style={{ fontSize: "16px", color: isDark ? (isDone ? "#4a9a4a" : isActive ? "#d4a843" : "#333") : (isDone ? "#4a8a4a" : isActive ? "#d4a050" : "#ccc") }} aria-hidden="true" />
                        </div>

                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px", color: isDark ? (isDone ? "#4a9a4a" : isActive ? "#d4a843" : "#333") : (isDone ? "#4a8a4a" : isActive ? "#8b6a3a" : "#ccc") }}>
                            {lesson.title}
                          </p>
                          <p style={{ fontSize: "11px", color: isDark ? "#444" : "#bbb", margin: 0 }}>{lesson.sub}</p>
                        </div>

                        {isDone && <i className="ti ti-circle-check" style={{ fontSize: "16px", color: isDark ? "#4a9a4a" : "#4a8a4a", flexShrink: 0 }} aria-hidden="true" />}
                        {isActive && <span style={{ fontSize: "11px", background: isDark ? "rgba(212,168,67,0.1)" : "#fff7ec", border: `1px solid ${isDark ? "rgba(212,168,67,0.2)" : "#e8d4a8"}`, color: isDark ? "#d4a843" : "#d4a050", borderRadius: "20px", padding: "3px 9px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>Continue →</span>}
                        {isLocked && <i className="ti ti-lock" style={{ fontSize: "13px", color: isDark ? "#222" : "#ddd", flexShrink: 0 }} aria-hidden="true" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
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