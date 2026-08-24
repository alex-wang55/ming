"use client";
import { useState, useEffect } from "react";
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
  return WORDS_OF_DAY[new Date().getDay() % WORDS_OF_DAY.length];
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

export default function RightPanel({ completedLessons, wordCount, streak, onStartLesson, theme }) {
  const isDark = theme === "dark";
  const word = getTodayWord();
  const weekDays = getWeekDays();
  const nextLesson = getNextLesson(completedLessons);
  const progress = getProgress(completedLessons);
  const [playing, setPlaying] = useState(false);

  const circumference = 113;
  const offset = circumference - (progress.pct / 100) * circumference;

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

  // Theme tokens
  const t = isDark ? {
    panel: "#0d0d0d",
    border: "rgba(255,255,255,0.06)",
    card: "#111111",
    cardBorder: "rgba(255,255,255,0.07)",
    text: "#f0f0f0",
    muted: "#555",
    accent: "#d4a843",
    accentDim: "rgba(212,168,67,0.1)",
    accentBorder: "rgba(212,168,67,0.2)",
    wodBg: "linear-gradient(135deg,#1a1408,#120f05)",
    wodBorder: "rgba(212,168,67,0.2)",
    wodText: "#d4a843",
    wodSub: "#8a6a2a",
    dotDone: "#1a3a0a",
    dotDoneText: "#4a9a4a",
    dotEmpty: "#1a1a1a",
    dotEmptyText: "#333",
    ringBg: "#1a1a1a",
    ringColor: "#d4a843",
    nextBg: "linear-gradient(135deg,#0a0f1a,#080c14)",
    nextBorder: "rgba(99,155,210,0.15)",
    nextLabel: "#4a6a9a",
    nextTitle: "#8ab0d8",
    nextSub: "#3a5a7a",
    nextBtnBg: "rgba(99,155,210,0.1)",
    nextBtnBorder: "rgba(99,155,210,0.2)",
    nextBtnText: "#6a9abf",
  } : {
    panel: "#faf8f4",
    border: "#e8e0d4",
    card: "#ffffff",
    cardBorder: "#e8e0d4",
    text: "#2d2520",
    muted: "#bbb",
    accent: "#8b6a3a",
    accentDim: "#fff7ec",
    accentBorder: "#e8d4a8",
    wodBg: "linear-gradient(135deg,#fff7ec,#fff2e0)",
    wodBorder: "#e8d4a8",
    wodText: "#8b6a3a",
    wodSub: "#c4903a",
    dotDone: "#eef5e8",
    dotDoneText: "#4a8a4a",
    dotEmpty: "#f5f0e8",
    dotEmptyText: "#ccc",
    ringBg: "#f0e8dc",
    ringColor: "#8b6a3a",
    nextBg: "linear-gradient(135deg,#f0f5ff,#e8f0ff)",
    nextBorder: "#c8d8f8",
    nextLabel: "#5a7abf",
    nextTitle: "#2a3a6a",
    nextSub: "#8a9abf",
    nextBtnBg: "#fff",
    nextBtnBorder: "#c8d8f8",
    nextBtnText: "#4a6abf",
  };

  return (
    <div style={{ width: "210px", flexShrink: 0, padding: "14px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", borderLeft: `1px solid ${t.border}`, background: t.panel }}>

      {/* Word of the day */}
      <div style={{ background: t.wodBg, border: `1px solid ${t.wodBorder}`, borderRadius: "12px", padding: "14px", position: "relative", overflow: "hidden" }}>
        <p style={{ fontSize: "9px", color: t.wodSub, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 6px" }}>✦ Word of the day</p>
        <p style={{ fontSize: "34px", fontFamily: "'Noto Sans SC', sans-serif", color: t.wodText, margin: "0 0 2px", lineHeight: 1 }}>{word.chinese}</p>
        <p style={{ fontSize: "12px", color: t.wodSub, margin: "0 0 3px", fontStyle: "italic" }}>{word.pinyin}</p>
        <p style={{ fontSize: "12px", color: isDark ? "#888" : "#6a5040", margin: "0 0 10px" }}>{word.meaning}</p>
        <button style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: t.wodSub, fontWeight: 500, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "Inter, sans-serif" }} onClick={speak}>
          {playing ? "🔊 Playing..." : "🔈 Hear it"}
        </button>
        <div style={{ position: "absolute", right: "-8px", bottom: "-8px", fontSize: "52px", opacity: 0.06, fontFamily: "serif", color: t.wodText, lineHeight: 1, pointerEvents: "none" }}>{word.chinese[0]}</div>
      </div>

      {/* Streak */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "10px", padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>🔥 Streak</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#e07a30" }}>{streak} days</span>
        </div>
        <div style={{ display: "flex", gap: "3px", marginBottom: "6px" }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, background: d.done ? t.dotDone : t.dotEmpty, color: d.done ? t.dotDoneText : t.dotEmptyText }}>
              {d.label}
            </div>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: t.muted, margin: 0 }}>
          {streak === 0 ? "Start your streak today!" : streak < 3 ? "Keep it going!" : streak < 7 ? "You're on a roll 🎉" : "Incredible streak! 🏆"}
        </p>
      </div>

      {/* Progress ring */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "10px", padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flexShrink: 0, position: "relative", width: "44px", height: "44px" }}>
            <svg style={{ width: "44px", height: "44px", transform: "rotate(-90deg)" }} viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke={t.ringBg} strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={t.ringColor} strokeWidth="4"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
            </svg>
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "10px", fontWeight: 700, color: t.wodText }}>{progress.pct}%</span>
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: t.text, margin: "0 0 2px" }}>Week 1</p>
            <p style={{ fontSize: "11px", color: t.muted, margin: 0 }}>{progress.week1Done} of {progress.week1Total} done</p>
            <p style={{ fontSize: "11px", color: t.muted, margin: 0 }}>{wordCount} words learned</p>
          </div>
        </div>
      </div>

      {/* Next lesson */}
      {nextLesson && (
        <div style={{ background: t.nextBg, border: `1px solid ${t.nextBorder}`, borderRadius: "10px", padding: "12px", cursor: "pointer" }} onClick={() => onStartLesson(nextLesson)}>
          <p style={{ fontSize: "9px", color: t.nextLabel, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, margin: "0 0 4px" }}>Up next</p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: t.nextTitle, margin: "0 0 2px" }}>{nextLesson.title}</p>
          <p style={{ fontSize: "11px", color: t.nextSub, margin: "0 0 8px" }}>{nextLesson.sub}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: t.nextBtnText, background: t.nextBtnBg, border: `1px solid ${t.nextBtnBorder}`, borderRadius: "20px", padding: "4px 10px" }}>
            ▶ Start lesson
          </div>
        </div>
      )}

      {!nextLesson && (
        <div style={{ background: isDark ? "rgba(74,154,74,0.06)" : "linear-gradient(135deg,#eef5e8,#e8f5e0)", border: `1px solid ${isDark ? "rgba(74,154,74,0.15)" : "#c8dab8"}`, borderRadius: "10px", padding: "12px" }}>
          <p style={{ fontSize: "9px", color: isDark ? "#4a9a4a" : "#4a7a3a", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, margin: "0 0 4px" }}>🎉 All done!</p>
          <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#6aba6a" : "#2a4a2a", margin: "0 0 2px" }}>All lessons complete</p>
          <p style={{ fontSize: "11px", color: isDark ? "#3a6a3a" : "#8a9abf", margin: 0 }}>Explore the map for regional content</p>
        </div>
      )}
    </div>
  );
}