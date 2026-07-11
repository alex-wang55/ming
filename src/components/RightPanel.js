"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LESSONS } from "@/lib/lessons";

const WORDS_OF_DAY = [
  { chinese: "谢谢", pinyin: "xiè xie", meaning: "Thank you" },
  { chinese: "你好", pinyin: "nǐ hǎo", meaning: "Hello" },
  { chinese: "再见", pinyin: "zài jiàn", meaning: "Goodbye" },
  { chinese: "对不起", pinyin: "duì bu qǐ", meaning: "Sorry" },
  { chinese: "多少钱", pinyin: "duōshao qián", meaning: "How much?" },
  { chinese: "好吃", pinyin: "hǎo chī", meaning: "Delicious" },
  { chinese: "朋友", pinyin: "péng yǒu", meaning: "Friend" },
];

function getTodayWord() {
  const day = new Date().getDay();
  return WORDS_OF_DAY[day % WORDS_OF_DAY.length];
}

function getWeekDays() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay();
  const mondayOffset = today === 0 ? 6 : today - 1;
  return days.map((d, i) => ({ label: d, done: i <= mondayOffset }));
}

function getNextLesson(completedLessons) {
  for (const week of LESSONS) {
    for (const lesson of week.lessons) {
      if (!completedLessons.includes(lesson.id)) return lesson;
    }
  }
  return null;
}

function getProgress(completedLessons) {
  const total = LESSONS.reduce((s, w) => s + w.lessons.length, 0);
  const week1Total = LESSONS[0].lessons.length;
  const week1Done = LESSONS[0].lessons.filter(l => completedLessons.includes(l.id)).length;
  return { total, week1Total, week1Done, pct: Math.round((week1Done / week1Total) * 100) };
}

export default function RightPanel({ completedLessons, wordCount, streak, onStartLesson }) {
  const word = getTodayWord();
  const weekDays = getWeekDays();
  const nextLesson = getNextLesson(completedLessons);
  const progress = getProgress(completedLessons);
  const [playing, setPlaying] = useState(false);

  async function speak() {
    if (playing) return;
    setPlaying(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word.chinese }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.onended = () => setPlaying(false);
        audio.play();
      }
    } catch { setPlaying(false); }
  }

  // Progress ring circumference = 2 * pi * 18 = ~113
  const circumference = 113;
  const offset = circumference - (progress.pct / 100) * circumference;

  return (
    <div style={styles.panel}>

      {/* Word of the day */}
      <div style={styles.wod}>
        <p style={styles.wodLabel}>✦ Word of the day</p>
        <p style={styles.wodChinese}>{word.chinese}</p>
        <p style={styles.wodPinyin}>{word.pinyin}</p>
        <p style={styles.wodMeaning}>{word.meaning}</p>
        <button style={styles.wodSpeak} onClick={speak}>
          {playing ? "🔊 Playing..." : "🔈 Hear it"}
        </button>
        <div style={styles.wodDeco}>{word.chinese[0]}</div>
      </div>

      {/* Streak tracker */}
      <div style={styles.card}>
        <div style={styles.streakTop}>
          <span style={styles.cardLabel}>🔥 Streak</span>
          <span style={styles.streakNum}>{streak} days</span>
        </div>
        <div style={styles.dots}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ ...styles.dot, background: d.done ? "#eef5e8" : "#f5f0e8", color: d.done ? "#4a8a4a" : "#ccc" }}>
              {d.label}
            </div>
          ))}
        </div>
        <p style={styles.streakMsg}>
          {streak === 0 ? "Start your streak today!" : streak < 3 ? "Keep it going!" : streak < 7 ? "You're on a roll 🎉" : "Incredible streak! 🏆"}
        </p>
      </div>

      {/* Progress ring */}
      <div style={styles.card}>
        <div style={styles.progressRow}>
          <div style={styles.ringWrapper}>
            <svg style={styles.ringSvg} viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#f0e8dc" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#8b6a3a" strokeWidth="4"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
            </svg>
            <span style={styles.ringPct}>{progress.pct}%</span>
          </div>
          <div style={styles.progressText}>
            <p style={styles.progressTitle}>Week 1</p>
            <p style={styles.progressSub}>{progress.week1Done} of {progress.week1Total} done</p>
            <p style={styles.progressSub}>{wordCount} words learned</p>
          </div>
        </div>
      </div>

      {/* Next lesson teaser */}
      {nextLesson && (
        <div style={styles.nextCard} onClick={() => onStartLesson(nextLesson)}>
          <p style={styles.nextLabel}>Up next</p>
          <p style={styles.nextTitle}>{nextLesson.title}</p>
          <p style={styles.nextSub}>{nextLesson.sub}</p>
          <div style={styles.nextBtn}>
            <i className="ti ti-player-play" style={{ fontSize: "10px" }} aria-hidden="true" />
            Start lesson
          </div>
        </div>
      )}

      {!nextLesson && (
        <div style={{ ...styles.nextCard, background: "linear-gradient(135deg,#eef5e8,#e8f5e0)", borderColor: "#c8dab8" }}>
          <p style={{ ...styles.nextLabel, color: "#4a7a3a" }}>🎉 All done!</p>
          <p style={{ ...styles.nextTitle, color: "#2a4a2a" }}>You finished all lessons</p>
          <p style={styles.nextSub}>Explore the map for region-specific content</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  panel: { width: "210px", flexShrink: 0, padding: "14px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", borderLeft: "1px solid #e8e0d4", background: "#faf8f4" },
  wod: { background: "linear-gradient(135deg,#fff7ec,#fff2e0)", border: "1px solid #e8d4a8", borderRadius: "12px", padding: "14px", position: "relative", overflow: "hidden" },
  wodLabel: { fontSize: "9px", color: "#c4903a", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 6px" },
  wodChinese: { fontSize: "34px", fontFamily: "'Noto Sans SC', sans-serif", color: "#8b6a3a", margin: "0 0 2px", lineHeight: 1 },
  wodPinyin: { fontSize: "12px", color: "#c4903a", margin: "0 0 3px", fontStyle: "italic" },
  wodMeaning: { fontSize: "12px", color: "#6a5040", margin: "0 0 10px" },
  wodSpeak: { display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#c4903a", fontWeight: 500, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "Inter, sans-serif" },
  wodDeco: { position: "absolute", right: "-8px", bottom: "-8px", fontSize: "52px", opacity: 0.06, fontFamily: "serif", color: "#8b6a3a", lineHeight: 1, pointerEvents: "none" },
  card: { background: "#fff", border: "1px solid #e8e0d4", borderRadius: "10px", padding: "12px" },
  cardLabel: { fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em" },
  streakTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" },
  streakNum: { fontSize: "16px", fontWeight: 700, color: "#e07a30" },
  dots: { display: "flex", gap: "3px", marginBottom: "6px" },
  dot: { width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500 },
  streakMsg: { fontSize: "11px", color: "#bbb", margin: 0 },
  progressRow: { display: "flex", alignItems: "center", gap: "12px" },
  ringWrapper: { flexShrink: 0, position: "relative", width: "44px", height: "44px" },
  ringSvg: { width: "44px", height: "44px", transform: "rotate(-90deg)" },
  ringPct: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "10px", fontWeight: 700, color: "#8b6a3a" },
  progressText: { flex: 1 },
  progressTitle: { fontSize: "13px", fontWeight: 500, color: "#333", margin: "0 0 2px" },
  progressSub: { fontSize: "11px", color: "#bbb", margin: 0 },
  nextCard: { background: "linear-gradient(135deg,#f0f5ff,#e8f0ff)", border: "1px solid #c8d8f8", borderRadius: "10px", padding: "12px", cursor: "pointer" },
  nextLabel: { fontSize: "9px", color: "#5a7abf", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, margin: "0 0 4px" },
  nextTitle: { fontSize: "13px", fontWeight: 600, color: "#2a3a6a", margin: "0 0 2px" },
  nextSub: { fontSize: "11px", color: "#8a9abf", margin: "0 0 8px" },
  nextBtn: { display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: "#4a6abf", background: "#fff", border: "1px solid #c8d8f8", borderRadius: "20px", padding: "4px 10px" },
};