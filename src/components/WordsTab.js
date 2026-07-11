"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WordsTab({ userId }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={styles.loading}>Loading words...</div>;

  if (words.length === 0) return (
    <div style={styles.empty}>
      <p style={styles.emptyIcon}>📚</p>
      <p style={styles.emptyTitle}>No words yet</p>
      <p style={styles.emptySub}>Words you learn with Ming will appear here for review.</p>
    </div>
  );

  const dueWords = words.filter(w => new Date(w.next_review) <= new Date());

  return (
    <div style={styles.container}>
      {dueWords.length > 0 && (
        <div style={styles.dueAlert}>
          <i className="ti ti-bell" aria-hidden="true" style={{ color: "#d4a843" }} />
          <span style={styles.dueText}>{dueWords.length} word{dueWords.length > 1 ? "s" : ""} due for review today</span>
        </div>
      )}

      <div style={styles.grid}>
        {words.map(w => {
          const isDue = new Date(w.next_review) <= new Date();
          return (
            <div key={w.id} style={{ ...styles.wordCard, ...(isDue ? styles.wordCardDue : {}) }}>
              <div style={styles.wordTop}>
                <span style={styles.chinese}>{w.chinese}</span>
                {isDue && <span style={styles.dueBadge}>Review</span>}
              </div>
              <p style={styles.pinyin}>{w.pinyin}</p>
              <p style={styles.meaning}>{w.meaning}</p>
              <p style={styles.seenCount}>Seen {w.times_seen}×</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100%", overflowY: "auto", padding: "24px" },
  loading: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" },
  empty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", textAlign: "center", padding: "24px" },
  emptyIcon: { fontSize: "40px", margin: 0 },
  emptyTitle: { fontSize: "16px", fontWeight: 500, color: "#f0f0f0", margin: 0 },
  emptySub: { fontSize: "13px", color: "#555", maxWidth: "240px", lineHeight: 1.6, margin: 0 },
  dueAlert: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" },
  dueText: { fontSize: "13px", color: "#d4a843" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" },
  wordCard: { background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px" },
  wordCardDue: { border: "1px solid rgba(212,168,67,0.2)", background: "rgba(212,168,67,0.04)" },
  wordTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" },
  chinese: { fontSize: "22px", fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843", fontWeight: 500 },
  dueBadge: { fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(212,168,67,0.15)", color: "#d4a843", fontWeight: 500 },
  pinyin: { fontSize: "12px", color: "#888", margin: "0 0 4px" },
  meaning: { fontSize: "13px", color: "#f0f0f0", margin: "0 0 8px" },
  seenCount: { fontSize: "11px", color: "#333", margin: 0 },
};