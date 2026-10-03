"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { themes, font, radius } from "@/lib/theme";

const COPY = {
  login: { button: "Sign in to Ming", busy: "Signing in..." },
  signup: { button: "Start learning free", busy: "Creating account..." },
  forgot: { button: "Send reset link", busy: "Sending..." },
  update: { button: "Save new password", busy: "Saving..." },
};

export default function Auth({ theme = "light", recovery = false, onRecovered }) {
  const t = themes[theme];
  const [mode, setMode] = useState(recovery ? "update" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function switchMode(next) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if ((mode === "signup" || mode === "update") && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);
    const redirectTo = window.location.origin;
    let result;
    if (mode === "signup") {
      result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (!result.error) setSuccess("Check your email to confirm your account, then sign in.");
    } else if (mode === "forgot") {
      result = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (!result.error) setSuccess("If that email has an account, a reset link is on its way.");
    } else if (mode === "update") {
      result = await supabase.auth.updateUser({ password });
      if (!result.error) onRecovered?.();
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    if (result.error) setError(result.error.message);
    setLoading(false);
  }

  const inputStyle = {
    padding: "11px 14px",
    borderRadius: radius.md,
    border: `1px solid ${t.border}`,
    background: t.bg,
    color: t.text,
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      className="app-root"
      style={{
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme === "dark" ? t.bg : "#f5ede0",
        padding: "24px 16px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(700px, 140vw)",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Deco side="left" t={t}>学</Deco>
      <Deco side="right" t={t}>语</Deco>

      <form
        onSubmit={handleSubmit}
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "20px",
          padding: "clamp(22px, 6vw, 36px)",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          position: "relative",
          zIndex: 1,
          boxShadow: theme === "dark" ? t.shadowLg : "0 4px 24px rgba(139,106,58,0.1), 0 1px 4px rgba(139,106,58,0.08)",
          margin: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: t.accentSoft,
              border: `1px solid ${t.accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "28px", fontFamily: font.cn, color: t.accent }}>明</span>
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: t.text, margin: 0, fontFamily: "Georgia, serif" }}>Ming</h1>
            <p style={{ fontSize: "13px", color: t.accent, margin: 0, opacity: 0.85 }}>Your Mandarin coach</p>
          </div>
        </div>

        {mode === "login" || mode === "signup" ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "Goal-aware lessons built around your timeline",
                "Real conversations, not flashcard drills",
                "Pronunciation audio for every word",
                "Works on your phone and computer",
              ].map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ color: t.accent, fontSize: "10px", marginTop: "4px", flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: "13px", color: t.textSecondary, lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>

            <div style={{ height: "1px", background: t.border, margin: "2px 0" }} />

            <div role="tablist" style={{ display: "flex", gap: "6px", background: t.bg, padding: "4px", borderRadius: radius.md }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "7px",
                    border: "none",
                    background: mode === m ? t.surface : "transparent",
                    color: mode === m ? t.text : t.textMuted,
                    fontSize: "13px",
                    boxShadow: mode === m ? t.shadow : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: t.text, margin: "0 0 4px" }}>
              {mode === "forgot" ? "Reset your password" : "Choose a new password"}
            </p>
            <p style={{ fontSize: "13px", color: t.textMuted, margin: 0, lineHeight: 1.5 }}>
              {mode === "forgot"
                ? "Enter your email and we'll send you a link to set a new password."
                : "You're almost back in. Pick something you haven't used before."}
            </p>
          </div>
        )}

        {mode !== "update" && (
          <input
            style={inputStyle}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="Email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
        {mode !== "forgot" && (
          <input
            style={inputStyle}
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            placeholder={mode === "login" ? "Password" : "New password (8+ characters)"}
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {error && (
          <p role="alert" style={{ fontSize: "13px", color: t.danger, margin: 0 }}>
            {error}
          </p>
        )}
        {success && <p style={{ fontSize: "13px", color: t.success, margin: 0 }}>{success}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "13px",
            borderRadius: radius.md,
            background: theme === "dark" ? t.accent : "linear-gradient(135deg,#8b6a3a,#6a4a2a)",
            border: "none",
            color: t.btnText,
            fontSize: "14px",
            fontWeight: 600,
            marginTop: "4px",
            fontFamily: "Georgia, serif",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? COPY[mode].busy : COPY[mode].button}
        </button>

        {mode === "login" && (
          <button type="button" onClick={() => switchMode("forgot")} style={linkStyle(t)}>
            Forgot your password?
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => switchMode("login")} style={linkStyle(t)}>
            Back to sign in
          </button>
        )}
        {mode === "signup" && (
          <p style={{ fontSize: "11px", color: t.textMuted, textAlign: "center", margin: 0 }}>
            By continuing you agree to our terms and privacy policy.
          </p>
        )}
      </form>
    </div>
  );
}

function linkStyle(t) {
  return {
    background: "none",
    border: "none",
    color: t.textMuted,
    fontSize: "12.5px",
    padding: "2px",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  };
}

function Deco({ children, side, t }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        [side]: "-20px",
        [side === "left" ? "bottom" : "top"]: "10%",
        fontSize: "clamp(110px, 22vw, 180px)",
        fontFamily: font.cn,
        color: t.accent,
        opacity: 0.05,
        fontWeight: 700,
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  );
}
