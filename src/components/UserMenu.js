"use client";
import { supabase } from "@/lib/supabase";

export default function UserMenu({ user, wordCount, streak }) {
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={styles.wrapper}>
      {streak > 0 && (
        <div style={styles.streakBadge}>
          <span>🔥</span>
          <span style={styles.streakNum}>{streak}</span>
        </div>
      )}
      {wordCount > 0 && (
        <div style={styles.wordsBadge}>
          <span style={styles.wordsNum}>{wordCount}</span>
          <span style={styles.wordsLabel}>words</span>
        </div>
      )}
      <div style={styles.divider} />
      <span style={styles.email}>{user.email.split("@")[0]}</span>
      <button style={styles.btn} onClick={signOut}>Sign out</button>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", alignItems: "center", gap: "8px" },
  streakBadge: {
    display: "flex", alignItems: "center", gap: "4px",
    background: "#fff7ec", border: "1px solid #e8d4a8",
    borderRadius: "20px", padding: "4px 10px", fontSize: "12px",
  },
  streakNum: { fontWeight: 600, color: "#e07a30" },
  wordsBadge: {
    display: "flex", alignItems: "center", gap: "4px",
    background: "#eef5e8", border: "1px solid #c8dab8",
    borderRadius: "20px", padding: "4px 10px",
  },
  wordsNum: { fontSize: "12px", fontWeight: 600, color: "#4a7a3a" },
  wordsLabel: { fontSize: "11px", color: "#8aba6a" },
  divider: { width: "1px", height: "16px", background: "#e8e0d4" },
  email: { fontSize: "13px", color: "#bbb" },
  btn: {
    fontSize: "12px", padding: "5px 12px", borderRadius: "8px",
    border: "1px solid #e8e0d4", background: "transparent",
    color: "#aaa", cursor: "pointer", fontFamily: "Inter, sans-serif",
  },
};