"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsTab({ user, theme, setTheme }) {
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [pinyinDisplay, setPinyinDisplay] = useState("always");
  const [difficulty, setDifficulty] = useState("adaptive");
  const [saved, setSaved] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleSave() {
    localStorage.setItem("ming-settings", JSON.stringify({
      notifications, autoplay, pinyinDisplay, difficulty, theme
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useEffect(() => {
    const stored = localStorage.getItem("ming-settings");
    if (stored) {
      const s = JSON.parse(stored);
      if (s.notifications !== undefined) setNotifications(s.notifications);
      if (s.autoplay !== undefined) setAutoplay(s.autoplay);
      if (s.pinyinDisplay) setPinyinDisplay(s.pinyinDisplay);
      if (s.difficulty) setDifficulty(s.difficulty);
    }
  }, []);

  const t = theme === "dark" ? dark : light;

  return (
    <div style={{ ...styles.container, background: t.bg }}>
      <div style={styles.inner}>
        <h2 style={{ ...styles.pageTitle, color: t.text }}>Settings</h2>

        {/* Account */}
        <Section title="Account" theme={t}>
          <div style={styles.row}>
            <div>
              <p style={{ ...styles.rowTitle, color: t.text }}>Signed in as</p>
              <p style={{ ...styles.rowSub, color: t.muted }}>{user.email}</p>
            </div>
            <button style={{ ...styles.dangerBtn, borderColor: t.border }} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" theme={t}>
          <div style={styles.row}>
            <div>
              <p style={{ ...styles.rowTitle, color: t.text }}>Theme</p>
              <p style={{ ...styles.rowSub, color: t.muted }}>Choose how Ming looks</p>
            </div>
            <div style={{ ...styles.themeToggle, background: t.surface2, border: `1px solid ${t.border}` }}>
              {[
                { id: "light", label: "☀️ Light" },
                { id: "dark", label: "🌙 Dark" },
              ].map(opt => (
                <button
                  key={opt.id}
                  style={{
                    ...styles.themeBtn,
                    background: theme === opt.id ? t.accent : "transparent",
                    color: theme === opt.id ? "#fff7ec" : t.muted,
                  }}
                  onClick={() => setTheme(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Learning */}
        <Section title="Learning" theme={t}>
          <ToggleRow
            title="Autoplay pronunciation"
            sub="Automatically play audio when Ming introduces a new word"
            value={autoplay}
            onChange={setAutoplay}
            theme={t}
          />

          <div style={{ ...styles.divider, background: t.border }} />

          <div style={styles.row}>
            <div>
              <p style={{ ...styles.rowTitle, color: t.text }}>Pinyin display</p>
              <p style={{ ...styles.rowSub, color: t.muted }}>When to show pronunciation guides</p>
            </div>
            <select
              style={{ ...styles.select, background: t.surface2, color: t.text, borderColor: t.border }}
              value={pinyinDisplay}
              onChange={e => setPinyinDisplay(e.target.value)}
            >
              <option value="always">Always show</option>
              <option value="hover">Show on hover</option>
              <option value="never">Hide (challenge mode)</option>
            </select>
          </div>

          <div style={{ ...styles.divider, background: t.border }} />

          <div style={styles.row}>
            <div>
              <p style={{ ...styles.rowTitle, color: t.text }}>Lesson difficulty</p>
              <p style={{ ...styles.rowSub, color: t.muted }}>How fast Ming introduces new content</p>
            </div>
            <select
              style={{ ...styles.select, background: t.surface2, color: t.text, borderColor: t.border }}
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              <option value="slow">Slow & steady</option>
              <option value="adaptive">Adaptive (recommended)</option>
              <option value="fast">Fast paced</option>
            </select>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" theme={t}>
          <ToggleRow
            title="Daily practice reminders"
            sub="Get reminded to practice and keep your streak"
            value={notifications}
            onChange={setNotifications}
            theme={t}
          />
        </Section>

        {/* About */}
        <Section title="About" theme={t}>
          <div style={styles.row}>
            <div>
              <p style={{ ...styles.rowTitle, color: t.text }}>Version</p>
              <p style={{ ...styles.rowSub, color: t.muted }}>Ming v1.0 — Phase 5</p>
            </div>
          </div>
          <div style={{ ...styles.divider, background: t.border }} />
          <div style={styles.row}>
            <div>
              <p style={{ ...styles.rowTitle, color: t.text }}>Built with</p>
              <p style={{ ...styles.rowSub, color: t.muted }}>Next.js · Supabase · Claude API · Google TTS</p>
            </div>
          </div>
        </Section>

        {/* Save button */}
        <button
          style={{ ...styles.saveBtn, background: theme === "dark" ? "linear-gradient(135deg,#d4a843,#b8912e)" : "linear-gradient(135deg,#8b6a3a,#6a4a2a)" }}
          onClick={handleSave}
        >
          {saved ? "✓ Saved!" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children, theme: t }) {
  return (
    <div style={{ ...sectionStyles.wrapper, background: t.surface, border: `1px solid ${t.border}` }}>
      <p style={{ ...sectionStyles.title, color: t.muted }}>{title}</p>
      {children}
    </div>
  );
}

function ToggleRow({ title, sub, value, onChange, theme: t }) {
  return (
    <div style={styles.row}>
      <div>
        <p style={{ ...styles.rowTitle, color: t.text }}>{title}</p>
        <p style={{ ...styles.rowSub, color: t.muted }}>{sub}</p>
      </div>
      <div
        style={{
          ...styles.toggle,
          background: value
            ? "linear-gradient(135deg,#8b6a3a,#6a4a2a)"
            : t.surface2,
          border: `1px solid ${value ? "#8b6a3a" : t.border}`,
        }}
        onClick={() => onChange(!value)}
      >
        <div style={{ ...styles.toggleKnob, transform: value ? "translateX(18px)" : "translateX(2px)" }} />
      </div>
    </div>
  );
}

// Theme tokens
const light = {
  bg: "#faf8f4",
  surface: "#ffffff",
  surface2: "#f5f0e8",
  border: "#e8e0d4",
  text: "#2d2520",
  muted: "#b89860",
  accent: "#8b6a3a",
};

const dark = {
  bg: "#080808",
  surface: "#111111",
  surface2: "#1a1a1a",
  border: "rgba(255,255,255,0.08)",
  text: "#f0f0f0",
  muted: "#888",
  accent: "#d4a843",
};

const styles = {
  container: { height: "100%", overflowY: "auto" },
  inner: { maxWidth: "560px", margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "14px" },
  pageTitle: { fontSize: "20px", fontWeight: 600, fontFamily: "Georgia, serif", margin: "0 0 4px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "4px 0" },
  rowTitle: { fontSize: "14px", fontWeight: 500, margin: "0 0 2px" },
  rowSub: { fontSize: "12px", margin: 0, lineHeight: 1.5 },
  divider: { height: "1px", margin: "10px 0" },
  themeToggle: { display: "flex", borderRadius: "9px", padding: "3px", gap: "2px", flexShrink: 0 },
  themeBtn: { padding: "6px 12px", borderRadius: "7px", border: "none", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" },
  select: { padding: "7px 10px", borderRadius: "8px", border: "1px solid", fontSize: "13px", outline: "none", fontFamily: "Inter, sans-serif", flexShrink: 0 },
  toggle: { width: "42px", height: "24px", borderRadius: "20px", cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0 },
  toggleKnob: { position: "absolute", top: "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
  dangerBtn: { padding: "6px 14px", borderRadius: "8px", background: "transparent", border: "1px solid", color: "#c05a3a", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 },
  saveBtn: { padding: "13px", borderRadius: "10px", border: "none", color: "#fff7ec", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Georgia, serif", boxShadow: "0 4px 16px rgba(139,106,58,0.25)", marginTop: "4px" },
};

const sectionStyles = {
  wrapper: { borderRadius: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" },
  title: { fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" },
};