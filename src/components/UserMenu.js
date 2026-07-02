"use client";
import { supabase } from "@/lib/supabase";

export default function UserMenu({ user }) {
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={styles.wrapper}>
      <span style={styles.email}>{user.email}</span>
      <button style={styles.btn} onClick={signOut}>Sign out</button>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", alignItems: "center", gap: "12px" },
  email: { fontSize: "12px", color: "#555" },
  btn: {
    fontSize: "12px", padding: "4px 10px", borderRadius: "6px",
    border: "1px solid #2a2a2a", background: "transparent",
    color: "#888", cursor: "pointer",
  },
};