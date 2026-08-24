"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WordsTab({ userId, theme }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === "dark";

  const t = isDark ? {
    bg: "#080808", card: "#111", cardBorder: "rgba(255,255,255,0.06)",
    cardDue: "rgba(212,168,67,0.04)", cardDueBorder: "rgba(212,168,67,0.2)",
    text: "#f0f0f0", muted: "#555", chinese: "#d4a843",
    dueBadge: "rgba(212,168,67,0.15)", dueBadgeText: "#d4a843",
    alert: "rgba(212,168,67,0.06)", alertBorder: "rgba(212,168,67,0.15)", alertText: "#d4a843",
    seen: "#222",
  } : {
    bg: "#faf8f4", card: "#fff", cardBorder: "rgba(0,0,0,0.06)",
    cardDue: "rgba(212,168,67,0.04)", cardDueBorder: "#e8d4a8",
    text: "#2d2520", muted: "#bbb", chinese: "#8b6a3a",
    dueBadge: "rgba(139,106,58,0.1)", dueBadgeText: "#8b6a3a",
    alert: "rgba(139,106,58,0.06)", alertBorder: "#e8d4a8", alertText: "#8b6a3a",
    seen: "#eee",
  };

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("words").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false });
      setWords(data || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: t.muted, background: t.bg }}>Loading words...</div>;

  if (words.length === 0) return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", textAlign: "center", padding: "24px", background: t.bg }}>
      <p style={{ fontSize: "40px", margin: 0 }}>📚</p>
      <p style={{ fontSize: "16px", fontWeight: 500, color: t.text, margin: 0 }}>No words yet</p>
      <p style={{ fontSize: "13px", color: t.muted, maxWidth: "240px", lineHeight: 1.6, margin: 0 }}>Words you learn with Ming will appear here for review.</p>
    </div>
  );

  const dueWords = words.filter(w => new Date(w.next_review) <= new Date());

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px", background: t.bg }}>
      {dueWords.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: t.alert, border: `1px solid ${t.alertBorder}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
          <span style={{ color: t.alertText }}>🔔</span>
          <span style={{ fontSize: "13px", color: t.alertText }}>{dueWords.length} word{dueWords.length > 1 ? "s" : ""} due for review today</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
        {words.map(w => {
          const isDue = new Date(w.next_review) <= new Date();
          return (
            <div key={w.id} style={{ background: isDue ? t.cardDue : t.card, border: `1px solid ${isDue ? t.cardDueBorder : t.cardBorder}`, borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                <span style={{ fontSize: "22px", fontFamily: "'Noto Sans SC', sans-serif", color: t.chinese, fontWeight: 500 }}>{w.chinese}</span>
                {isDue && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: t.dueBadge, color: t.dueBadgeText, fontWeight: 500 }}>Review</span>}
              </div>
              <p style={{ fontSize: "12px", color: t.muted, margin: "0 0 4px", fontStyle: "italic" }}>{w.pinyin}</p>
              <p style={{ fontSize: "13px", color: t.text, margin: "0 0 8px" }}>{w.meaning}</p>
              <p style={{ fontSize: "11px", color: t.seen, margin: 0 }}>Seen {w.times_seen}×</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}