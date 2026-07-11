"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
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
      {/* Background glow */}
      <div style={styles.glow} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>
            <span style={styles.logoChar}>明</span>
          </div>
          <div>
            <h1 style={styles.logoText}>Ming</h1>
            <p style={styles.logoSub}>Your Mandarin coach</p>
          </div>
        </div>

        {/* Value props */}
        <div style={styles.props}>
          {["Goal-aware lessons built around your timeline", "Real conversations, not flashcard drills", "Pronunciation audio for every word"].map((p, i) => (
            <div key={i} style={styles.prop}>
              <span style={styles.propDot}>✦</span>
              <span style={styles.propText}>{p}</span>
            </div>
          ))}
        </div>

        <div style={styles.divider} />

        {/* Tabs */}
        <div style={styles.tabs}>
          {["login", "signup"].map(m => (
            <button key={m} style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }} onClick={() => setMode(m)}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <input
          style={styles.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Sign in to Ming" : "Start learning free"}
        </button>

        <p style={styles.legal}>By continuing you agree to our terms and privacy policy.</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#080808", padding: "24px", position: "relative", overflow: "hidden",
  },
  glow: {
    position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
    width: "600px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(212,168,67,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(17,17,17,0.9)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px", padding: "36px", width: "100%", maxWidth: "400px",
    display: "flex", flexDirection: "column", gap: "14px",
    backdropFilter: "blur(20px)", position: "relative", zIndex: 1,
    boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.4)",
  },
  logoWrapper: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" },
  logoIcon: {
    width: "48px", height: "48px", borderRadius: "14px",
    background: "linear-gradient(135deg, #2a1f08, #1a1408)",
    border: "1px solid rgba(212,168,67,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 20px rgba(212,168,67,0.1)",
  },
  logoChar: { fontSize: "24px", fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843" },
  logoText: { fontSize: "22px", fontWeight: 600, color: "#f0f0f0", margin: 0 },
  logoSub: { fontSize: "13px", color: "#666", margin: 0 },
  props: { display: "flex", flexDirection: "column", gap: "8px" },
  prop: { display: "flex", alignItems: "flex-start", gap: "10px" },
  propDot: { color: "#d4a843", fontSize: "10px", marginTop: "4px", flexShrink: 0 },
  propText: { fontSize: "13px", color: "#888", lineHeight: 1.5 },
  divider: { height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" },
  tabs: { display: "flex", gap: "6px", background: "#0a0a0a", padding: "4px", borderRadius: "10px" },
  tab: {
    flex: 1, padding: "8px", borderRadius: "7px", border: "none",
    background: "transparent", color: "#666", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif",
  },
  tabActive: { background: "#1a1a1a", color: "#f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" },
  input: {
    padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
    background: "#0a0a0a", color: "#f0f0f0", fontSize: "14px", outline: "none",
    fontFamily: "Inter, sans-serif", transition: "border-color 0.15s",
  },
  error: { fontSize: "13px", color: "#fc8181", margin: 0 },
  success: { fontSize: "13px", color: "#68d391", margin: 0 },
  btn: {
    padding: "12px", borderRadius: "10px",
    background: "linear-gradient(135deg, #d4a843, #b8912e)",
    border: "none", color: "#0a0a0a", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", marginTop: "4px", fontFamily: "Inter, sans-serif",
    boxShadow: "0 4px 16px rgba(212,168,67,0.2)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  legal: { fontSize: "11px", color: "#3a3a3a", textAlign: "center", margin: 0 },
};