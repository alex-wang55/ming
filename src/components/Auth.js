"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoChar}>明</span>
          <span style={styles.logoText}>Ming</span>
        </div>
        <p style={styles.tagline}>Your personal Mandarin coach</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#0f0f0f",
  },
  card: {
    background: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "16px", padding: "32px", width: "100%",
    maxWidth: "380px", display: "flex", flexDirection: "column", gap: "12px",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  logoChar: { fontSize: "28px", fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843", fontWeight: 500 },
  logoText: { fontSize: "22px", fontWeight: 500, color: "#f0f0f0" },
  tagline: { fontSize: "13px", color: "#666", margin: "0 0 8px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "4px" },
  tab: {
    flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #2a2a2a",
    background: "transparent", color: "#888", fontSize: "14px", cursor: "pointer",
  },
  tabActive: { background: "#2a2a2a", color: "#f0f0f0", borderColor: "#3a3a3a" },
  input: {
    padding: "10px 14px", borderRadius: "8px", border: "1px solid #2a2a2a",
    background: "#111", color: "#f0f0f0", fontSize: "14px", outline: "none",
    fontFamily: "Inter, sans-serif",
  },
  error: { fontSize: "13px", color: "#fc8181", margin: 0 },
  success: { fontSize: "13px", color: "#68d391", margin: 0 },
  btn: {
    padding: "11px", borderRadius: "8px", background: "#d4a843",
    border: "none", color: "#0f0f0f", fontSize: "15px", fontWeight: 500,
    cursor: "pointer", marginTop: "4px",
  },
};