"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { themes, radius } from "@/lib/theme";

export default function SettingsTab({ user, theme, setTheme }) {
  const t = themes[theme];
  const [autoplay, setAutoplay] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [pinyin, setPinyin] = useState("always");
  const [pace, setPace] = useState("adaptive");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("ming-settings");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (typeof s.autoplay === "boolean") setAutoplay(s.autoplay);
      if (typeof s.reminders === "boolean") setReminders(s.reminders);
      if (s.pinyin) setPinyin(s.pinyin);
      if (s.pace) setPace(s.pace);
    } catch {}
  }, []);

  function save() {
    localStorage.setItem(
      "ming-settings",
      JSON.stringify({ autoplay, reminders, pinyin, pace, theme })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: t.bg }}>
      <div
        style={{
          maxWidth: "580px",
          margin: "0 auto",
          padding: "26px 26px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <Group label="Appearance" t={t}>
          <Row title="Theme" sub="Light for daytime, dark for focus" t={t}>
            <Segmented
              t={t}
              value={theme}
              onChange={setTheme}
              options={[
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
              ]}
            />
          </Row>
        </Group>

        <Group label="Learning" t={t}>
          <Toggle
            title="Autoplay pronunciation"
            sub="Play audio when Ming introduces a new word"
            value={autoplay}
            onChange={setAutoplay}
            t={t}
          />
          <Divider t={t} />
          <Row title="Pinyin" sub="When to show pronunciation guides" t={t}>
            <Select
              t={t}
              value={pinyin}
              onChange={setPinyin}
              options={[
                { v: "always", l: "Always" },
                { v: "hover", l: "On hover" },
                { v: "never", l: "Hidden" },
              ]}
            />
          </Row>
          <Divider t={t} />
          <Row title="Pace" sub="How fast new material is introduced" t={t}>
            <Select
              t={t}
              value={pace}
              onChange={setPace}
              options={[
                { v: "slow", l: "Slow" },
                { v: "adaptive", l: "Adaptive" },
                { v: "fast", l: "Fast" },
              ]}
            />
          </Row>
        </Group>

        <Group label="Notifications" t={t}>
          <Toggle
            title="Daily reminders"
            sub="A nudge to practice and keep your streak"
            value={reminders}
            onChange={setReminders}
            t={t}
          />
        </Group>

        <Group label="Account" t={t}>
          <Row title="Signed in" sub={user.email} t={t}>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                padding: "7px 14px",
                borderRadius: radius.sm,
                background: "transparent",
                border: `1px solid ${t.border}`,
                color: t.danger,
                fontSize: "12.5px",
                fontWeight: 500,
              }}
            >
              Sign out
            </button>
          </Row>
        </Group>

        <button
          onClick={save}
          style={{
            padding: "13px",
            borderRadius: radius.md,
            background: saved ? t.successSoft : t.accent,
            border: `1px solid ${saved ? t.successBorder : t.accent}`,
            color: saved ? t.success : t.btnText,
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.2s",
            marginTop: "4px",
          }}
        >
          {saved ? "Saved" : "Save changes"}
        </button>

        <p style={{ fontSize: "11px", color: t.textFaint, textAlign: "center", margin: "6px 0 0" }}>
          Ming v1.0 · Next.js, Supabase, Claude, Google TTS
        </p>
      </div>
    </div>
  );
}

function Group({ label, children, t }) {
  return (
    <section>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: t.textMuted,
          margin: "0 0 8px",
          paddingLeft: "2px",
        }}
      >
        {label}
      </p>
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: radius.md,
          padding: "4px 16px",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ title, sub, children, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "14px 0" }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "13.5px", fontWeight: 500, color: t.text, margin: "0 0 2px" }}>{title}</p>
        <p style={{ fontSize: "12px", color: t.textMuted, margin: 0, lineHeight: 1.45 }}>{sub}</p>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Divider({ t }) {
  return <div style={{ height: "1px", background: t.border }} />;
}

function Toggle({ title, sub, value, onChange, t }) {
  return (
    <Row title={title} sub={sub} t={t}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "42px",
          height: "24px",
          borderRadius: radius.full,
          background: value ? t.accent : "transparent",
          border: `1px solid ${value ? t.accent : t.borderStrong}`,
          position: "relative",
          padding: 0,
          transition: "all 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: "2px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: value ? t.btnText : t.textMuted,
            transform: value ? "translateX(18px)" : "translateX(0)",
            transition: "transform 0.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </button>
    </Row>
  );
}

function Segmented({ value, onChange, options, t }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        padding: "3px",
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: radius.md,
      }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: "6px 14px",
            borderRadius: radius.sm,
            border: "none",
            background: value === o.id ? t.accent : "transparent",
            color: value === o.id ? t.btnText : t.textMuted,
            fontSize: "12.5px",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, t }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 10px",
        borderRadius: radius.sm,
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.text,
        fontSize: "12.5px",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}
