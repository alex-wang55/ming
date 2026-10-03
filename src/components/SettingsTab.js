"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { themes, radius } from "@/lib/theme";
import { useInstallPrompt } from "@/lib/hooks";

export default function SettingsTab({ user, settings, updateSettings, profile, onUpdateProfile }) {
  const t = themes[settings.theme];
  const [goal, setGoal] = useState(profile?.goal_text || "");
  const [deadline, setDeadline] = useState(profile?.deadline_date || "");
  const [goalState, setGoalState] = useState("idle"); // idle | saving | saved | error
  const install = useInstallPrompt();

  const goalChanged = goal.trim() !== (profile?.goal_text || "") || deadline !== (profile?.deadline_date || "");

  async function saveGoal() {
    setGoalState("saving");
    const patch = { goal_text: goal.trim() || null, deadline_date: deadline || null };
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select("id");
    if (error || !data?.length) {
      console.error("Goal save failed:", error);
      setGoalState("error");
      return;
    }
    onUpdateProfile(patch);
    setGoalState("saved");
    setTimeout(() => setGoalState("idle"), 1800);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: t.bg }}>
      <div
        style={{
          maxWidth: "580px",
          margin: "0 auto",
          padding: "22px 16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <Group label="Appearance" t={t}>
          <Row title="Theme" sub="Light for daytime, dark for focus" t={t}>
            <Segmented
              t={t}
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
              ]}
            />
          </Row>
        </Group>

        <Group label="Your goal" t={t}>
          <div style={{ padding: "12px 0 14px" }}>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What are you learning Mandarin for?"
              aria-label="Your Mandarin goal"
              rows={2}
              maxLength={300}
              style={{
                width: "100%",
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: radius.md,
                padding: "10px 12px",
                fontSize: "13px",
                color: t.text,
                resize: "none",
                outline: "none",
                marginBottom: "8px",
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12.5px", color: t.textSecondary }}>Deadline (optional)</span>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                  borderRadius: radius.md,
                  padding: "7px 10px",
                  fontSize: "13px",
                  color: t.text,
                  outline: "none",
                }}
              />
              {deadline && (
                <button
                  onClick={() => setDeadline("")}
                  style={{ background: "none", border: "none", color: t.textMuted, fontSize: "12px", padding: 0 }}
                >
                  Clear
                </button>
              )}
            </label>
            <button
              onClick={saveGoal}
              disabled={!goalChanged || goalState === "saving"}
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: radius.md,
                background: goalState === "saved" ? t.successSoft : t.accentSoft,
                border: `1px solid ${goalState === "saved" ? t.successBorder : t.accentBorder}`,
                color: goalState === "saved" ? t.success : t.accent,
                fontSize: "12.5px",
                fontWeight: 600,
                opacity: !goalChanged && goalState === "idle" ? 0.5 : 1,
              }}
            >
              {goalState === "saving" ? "Saving..." : goalState === "saved" ? "Saved" : "Update goal"}
            </button>
            {goalState === "error" && (
              <p role="alert" style={{ fontSize: "12px", color: t.danger, margin: "8px 0 0" }}>
                Couldn't save your goal. Try again in a moment.
              </p>
            )}
          </div>
        </Group>

        <Group label="Learning" t={t}>
          <Toggle
            title="Autoplay pronunciation"
            sub="Play the first new word when Ming introduces it"
            value={settings.autoplay}
            onChange={(autoplay) => updateSettings({ autoplay })}
            t={t}
          />
          <Divider t={t} />
          <Row title="Pinyin" sub="When Ming writes pronunciation guides" t={t}>
            <Select
              t={t}
              label="Pinyin"
              value={settings.pinyin}
              onChange={(pinyin) => updateSettings({ pinyin })}
              options={[
                { v: "always", l: "Always" },
                { v: "new", l: "New words only" },
                { v: "never", l: "Hidden" },
              ]}
            />
          </Row>
          <Divider t={t} />
          <Row title="Pace" sub="How fast new material is introduced" t={t}>
            <Select
              t={t}
              label="Pace"
              value={settings.pace}
              onChange={(pace) => updateSettings({ pace })}
              options={[
                { v: "slow", l: "Slow" },
                { v: "adaptive", l: "Adaptive" },
                { v: "fast", l: "Fast" },
              ]}
            />
          </Row>
        </Group>

        <Group label="App" t={t}>
          <Row
            title={install.standalone ? "Installed" : "Install Ming"}
            sub={
              install.standalone
                ? "You're using the app version."
                : install.event
                ? "Add Ming to your home screen or desktop, like a regular app."
                : install.ios
                ? "In Safari, tap Share, then Add to Home Screen."
                : "Use your browser menu: Install app, or Add to Home screen."
            }
            t={t}
          >
            {!install.standalone && install.event && (
              <button
                onClick={install.install}
                style={{
                  padding: "7px 14px",
                  borderRadius: radius.sm,
                  background: t.accent,
                  border: "none",
                  color: t.btnText,
                  fontSize: "12.5px",
                  fontWeight: 600,
                }}
              >
                Install
              </button>
            )}
          </Row>
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

        <p style={{ fontSize: "11px", color: t.textFaint, textAlign: "center", margin: "6px 0 0" }}>
          Settings save automatically · Ming v1.1
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
        <p style={{ fontSize: "12px", color: t.textMuted, margin: 0, lineHeight: 1.45, overflowWrap: "anywhere" }}>{sub}</p>
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
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
        role="switch"
        aria-checked={value}
        aria-label={title}
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
      role="radiogroup"
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
          role="radio"
          aria-checked={value === o.id}
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

function Select({ value, onChange, options, label, t }) {
  return (
    <select
      value={value}
      aria-label={label}
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
