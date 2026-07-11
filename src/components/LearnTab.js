"use client";
import { LESSONS } from "@/lib/lessons";
import RightPanel from "@/components/RightPanel";

export default function LearnTab({ completedLessons, onStartLesson, wordCount, streak }) {
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
    <div style={styles.container}>
      {/* Lesson path */}
      <div style={styles.pathWrapper}>
        {/* Progress bar */}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(completedCount / totalLessons) * 100}%` }} />
        </div>

        <div style={styles.path}>
          {LESSONS.map((week, wi) => (
            <div key={wi} style={styles.weekBlock}>
              <div style={styles.weekHeader}>
                <p style={styles.weekTitle}>{week.weekTitle}</p>
                <p style={styles.weekSub}>{week.weekSub}</p>
              </div>

              <div style={styles.nodes}>
                {week.lessons.map((lesson, li) => {
                  const state = getLessonState(lesson.id, wi, li);
                  return (
                    <div key={lesson.id} style={styles.nodeWrapper}>
                      {li > 0 && (
                        <div style={{ ...styles.connector, background: completedLessons.includes(week.lessons[li - 1].id) ? "#c8dab8" : "#e8e0d4" }} />
                      )}
                      <div
                        style={{
                          ...styles.node,
                          ...(state === "done" ? styles.nodeDone : {}),
                          ...(state === "active" ? styles.nodeActive : {}),
                          ...(state === "locked" ? styles.nodeLocked : {}),
                        }}
                        onClick={() => state !== "locked" && onStartLesson(lesson)}
                      >
                        <div style={{
                          ...styles.nodeIcon,
                          background: state === "done" ? "#eef5e8" : state === "active" ? "#fff7ec" : "#f5f0e8",
                          border: `1px solid ${state === "done" ? "#c8dab8" : state === "active" ? "#e8d4a8" : "#e8e0d4"}`,
                        }}>
                          <i className={`ti ${lesson.icon}`} style={{ fontSize: "16px", color: state === "done" ? "#4a8a4a" : state === "active" ? "#d4a050" : "#ccc" }} aria-hidden="true" />
                        </div>
                        <div style={styles.nodeText}>
                          <p style={{ ...styles.nodeTitle, color: state === "done" ? "#4a8a4a" : state === "active" ? "#8b6a3a" : "#ccc" }}>
                            {lesson.title}
                          </p>
                          <p style={styles.nodeSub}>{lesson.sub}</p>
                        </div>
                        {state === "done" && <i className="ti ti-circle-check" style={{ fontSize: "16px", color: "#4a8a4a", flexShrink: 0 }} aria-hidden="true" />}
                        {state === "active" && <span style={styles.continueBtn}>Continue →</span>}
                        {state === "locked" && <i className="ti ti-lock" style={{ fontSize: "13px", color: "#ddd", flexShrink: 0 }} aria-hidden="true" />}
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
      />
    </div>
  );
}

const styles = {
  container: { height: "100%", display: "flex", overflow: "hidden" },
  pathWrapper: { flex: 1, overflowY: "auto", padding: "20px 24px" },
  progressBar: { height: "3px", background: "#e8e0d4", borderRadius: "2px", marginBottom: "24px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,#c8dab8,#4a8a4a)", borderRadius: "2px", transition: "width 0.4s ease" },
  path: { display: "flex", flexDirection: "column", gap: "28px", maxWidth: "440px" },
  weekBlock: {},
  weekHeader: { marginBottom: "14px" },
  weekTitle: { fontSize: "14px", fontWeight: 600, color: "#2d2520", margin: "0 0 2px" },
  weekSub: { fontSize: "12px", color: "#bbb", margin: 0 },
  nodes: { display: "flex", flexDirection: "column", alignItems: "stretch" },
  nodeWrapper: { display: "flex", flexDirection: "column", alignItems: "center" },
  connector: { width: "1.5px", height: "16px" },
  node: { width: "100%", borderRadius: "10px", border: "1px solid #e8e0d4", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", background: "#fff", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  nodeDone: { border: "1px solid #c8dab8", background: "#fafdf8" },
  nodeActive: { border: "1.5px solid #e8d4a8", background: "#fffdf8", boxShadow: "0 2px 8px rgba(212,168,67,0.12)" },
  nodeLocked: { cursor: "not-allowed", opacity: 0.5, boxShadow: "none" },
  nodeIcon: { width: "36px", height: "36px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  nodeText: { flex: 1 },
  nodeTitle: { fontSize: "13px", fontWeight: 500, margin: "0 0 2px" },
  nodeSub: { fontSize: "11px", color: "#bbb", margin: 0 },
  continueBtn: { fontSize: "11px", background: "#fff7ec", border: "1px solid #e8d4a8", color: "#d4a050", borderRadius: "20px", padding: "3px 9px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 },
};