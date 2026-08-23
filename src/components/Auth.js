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
      {/* Warm background glow */}
      <div style={styles.glow} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
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
          {[
            "Goal-aware lessons built around your timeline",
            "Real conversations, not flashcard drills",
            "Pronunciation audio for every word",
            "Interactive map of regional accents and culture",
          ].map((p, i) => (
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
            <button
              key={m}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              onClick={() => setMode(m)}
            >
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

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "..." : mode === "login" ? "Sign in to Ming" : "Start learning free"}
        </button>

        <p style={styles.legal}>By continuing you agree to our terms and privacy policy.</p>
      </div>

      {/* Decorative Chinese characters */}
      <div style={styles.decoLeft}>学</div>
      <div style={styles.decoRight}>语</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#f5ede0", padding: "24px", position: "relative", overflow: "hidden",
  },
  glow: {
    position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
    width: "700px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  decoLeft: {
    position: "absolute", left: "-20px", bottom: "10%",
    fontSize: "180px", fontFamily: "'Noto Sans SC', sans-serif",
    color: "rgba(139,106,58,0.05)", fontWeight: 700,
    pointerEvents: "none", userSelect: "none", lineHeight: 1,
  },
  decoRight: {
    position: "absolute", right: "-20px", top: "10%",
    fontSize: "180px", fontFamily: "'Noto Sans SC', sans-serif",
    color: "rgba(139,106,58,0.05)", fontWeight: 700,
    pointerEvents: "none", userSelect: "none", lineHeight: 1,
  },
  card: {
    background: "#faf8f4", border: "1px solid #e8e0d4",
    borderRadius: "20px", padding: "36px", width: "100%", maxWidth: "400px",
    display: "flex", flexDirection: "column", gap: "14px",
    position: "relative", zIndex: 1,
    boxShadow: "0 4px 24px rgba(139,106,58,0.1), 0 1px 4px rgba(139,106,58,0.08)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" },
  logoIcon: {
    width: "52px", height: "52px", borderRadius: "14px",
    background: "linear-gradient(135deg,#fff7ec,#f5e8d0)",
    border: "1px solid #e8d4a8",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(139,106,58,0.15)",
  },
  logoChar: { fontSize: "28px", fontFamily: "'Noto Sans SC', sans-serif", color: "#8b6a3a" },
  logoText: { fontSize: "24px", fontWeight: 600, color: "#2d2520", margin: 0, fontFamily: "Georgia, serif" },
  logoSub: { fontSize: "13px", color: "#b89860", margin: 0 },
  props: { display: "flex", flexDirection: "column", gap: "8px" },
  prop: { display: "flex", alignItems: "flex-start", gap: "10px" },
  propDot: { color: "#d4a843", fontSize: "10px", marginTop: "4px", flexShrink: 0 },
  propText: { fontSize: "13px", color: "#8a7060", lineHeight: 1.5 },
  divider: { height: "1px", background: "#e8e0d4", margin: "2px 0" },
  tabs: {
    display: "flex", gap: "6px",
    background: "#f0ebe0", padding: "4px", borderRadius: "10px",
  },
  tab: {
    flex: 1, padding: "8px", borderRadius: "7px", border: "none",
    background: "transparent", color: "#b89860", fontSize: "13px",
    cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s",
  },
  tabActive: {
    background: "#ffffff", color: "#2d2520",
    boxShadow: "0 1px 4px rgba(139,106,58,0.12)",
  },
  input: {
    padding: "11px 14px", borderRadius: "10px",
    border: "1px solid #e8e0d4", background: "#ffffff",
    color: "#2d2520", fontSize: "14px", outline: "none",
    fontFamily: "Inter, sans-serif", transition: "border-color 0.15s",
  },
  error: { fontSize: "13px", color: "#c05a3a", margin: 0 },
  success: { fontSize: "13px", color: "#4a7a3a", margin: 0 },
  btn: {
    padding: "13px", borderRadius: "10px",
    background: "linear-gradient(135deg,#8b6a3a,#6a4a2a)",
    border: "none", color: "#fff7ec", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", marginTop: "4px", fontFamily: "Georgia, serif",
    boxShadow: "0 4px 16px rgba(139,106,58,0.25)",
    transition: "opacity 0.15s",
    letterSpacing: "0.01em",
  },
  legal: { fontSize: "11px", color: "#c8b8a0", textAlign: "center", margin: 0 },
};