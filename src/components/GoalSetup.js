"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { themes, font, radius } from "@/lib/theme";
import { daysUntil, localDateKey } from "@/lib/dates";
import { DEADLINE_PRESETS, GOAL_PRESETS, planPreview } from "@/lib/goals";

function dateIn(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

// Shown once after signing up, until a goal is set or skipped. The shortcuts and the plan
// line come from lib/goals.js, shared with the iOS app's goal-setup screen.
export default function GoalSetup({ user, theme, onDone }) {
  const t = themes[theme];
  const [goal, setGoal] = useState("");
  const [preset, setPreset] = useState(null);
  // "" means no deadline.
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function persist(patch) {
    setSaving(true);
    setError(null);
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select("id");
    setSaving(false);
    if (error) {
      console.error("Profile save failed:", error);
      setError("Couldn't save that. Check your connection and try again.");
      return;
    }
    // No rows back means the database refused the update (missing RLS policy, see
    // supabase/migrations). Let the user in anyway rather than trapping them here.
    if (!data?.length) console.warn("Profile update affected no rows");
    onDone(patch);
  }

  function save() {
    if (!goal.trim()) return;
    persist({ goal_text: goal.trim(), deadline_date: date || null });
  }

  const days = date ? daysUntil(date) : null;
  const activeDeadline = DEADLINE_PRESETS.find((p) => date === dateIn(p.days))?.id ?? null;
  const ready = !!goal.trim() && !saving;

  const chip = (active) => ({
    padding: "7px 13px",
    borderRadius: radius.full,
    border: `1px solid ${active ? t.accent : t.border}`,
    background: active ? t.accent : t.surface,
    color: active ? t.btnText : t.textSecondary,
    fontSize: "13px",
    fontWeight: 500,
  });

  return (
    <div
      className="app-root"
      style={{ overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, padding: "24px" }}
    >
      <div style={{ width: "100%", maxWidth: "460px", display: "flex", flexDirection: "column", gap: "22px", margin: "auto" }}>
        <div className="rise">
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
              marginBottom: "18px",
            }}
          >
            <span style={{ fontFamily: font.cn, fontSize: "28px", color: t.accent }}>明</span>
          </div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.accent, margin: "0 0 6px" }}>
            Your goal
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", lineHeight: 1.2, fontWeight: 600, color: t.text, margin: 0 }}>
            What are you learning Mandarin for?
          </h1>
          <p style={{ fontSize: "14.5px", color: t.textSecondary, margin: "8px 0 0", lineHeight: 1.5 }}>
            Ming plans every lesson around your answer.
          </p>
        </div>

        <div className="rise" role="radiogroup" aria-label="Common goals" style={{ "--i": 1, display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {GOAL_PRESETS.map((p) => {
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                className="press"
                onClick={() => {
                  setPreset(p.id);
                  setGoal(p.text);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 13px",
                  borderRadius: radius.full,
                  border: `1px solid ${active ? t.accent : t.border}`,
                  background: active ? t.accentSoft : t.surface,
                  color: active ? t.accent : t.text,
                  fontSize: "13.5px",
                  fontWeight: 500,
                }}
              >
                <span style={{ fontFamily: font.cn, fontSize: "14px", color: t.accent }}>{p.hanzi}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        <textarea
          className="rise"
          value={goal}
          maxLength={300}
          aria-label="Your Mandarin goal"
          onChange={(e) => {
            setGoal(e.target.value);
            setPreset(null);
          }}
          placeholder="Or say it your way: a trip to Beijing in 3 weeks, dinner with my partner's parents..."
          rows={3}
          style={{
            "--i": 2,
            background: t.surface,
            border: `1px solid ${goal.trim() ? t.accentBorder : t.border}`,
            borderRadius: radius.lg,
            padding: "14px",
            fontSize: "14.5px",
            lineHeight: 1.5,
            color: t.text,
            resize: "none",
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />

        <div className="rise" style={{ "--i": 3 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: t.text, margin: "0 0 10px" }}>Is there a date you need it by?</p>
          <div role="radiogroup" aria-label="Deadline" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <button type="button" role="radio" aria-checked={!date} className="press" onClick={() => setDate("")} style={chip(!date)}>
              No deadline
            </button>
            {DEADLINE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={activeDeadline === p.id}
                className="press"
                onClick={() => setDate(dateIn(p.days))}
                style={chip(activeDeadline === p.id)}
              >
                {p.label}
              </button>
            ))}
            <input
              type="date"
              aria-label="Exact deadline date"
              value={date}
              min={localDateKey()}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: radius.full,
                padding: "6px 12px",
                fontSize: "13px",
                color: date ? t.text : t.textMuted,
                outline: "none",
              }}
            />
          </div>
        </div>

        <div
          className="rise"
          style={{
            "--i": 4,
            display: "flex",
            gap: "10px",
            background: t.accentSoft,
            border: `1px solid ${t.accentBorder}`,
            borderRadius: radius.md,
            padding: "12px",
          }}
        >
          <span style={{ fontFamily: font.cn, fontSize: "15px", color: t.accent }}>明</span>
          <p key={planPreview(goal, days)} className="fade-up" style={{ fontSize: "13.5px", lineHeight: 1.5, color: t.textSecondary, margin: 0 }}>
            {planPreview(goal, days)}
          </p>
        </div>

        {error && (
          <p role="alert" style={{ fontSize: "12.5px", color: t.danger, margin: 0 }}>
            {error}
          </p>
        )}

        <div className="rise" style={{ "--i": 5, display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            className="press"
            onClick={save}
            disabled={!ready}
            style={{
              padding: "13px",
              borderRadius: radius.md,
              background: t.accent,
              border: "none",
              color: t.btnText,
              fontSize: "14.5px",
              fontWeight: 600,
              opacity: ready ? 1 : 0.5,
              boxShadow: ready ? "0 4px 14px rgba(139,106,58,0.25)" : "none",
            }}
          >
            {saving ? "Saving..." : "Start learning"}
          </button>
          <button
            onClick={() => persist({ onboarding_skipped: true })}
            disabled={saving}
            style={{ background: "none", border: "none", fontSize: "13px", color: t.textMuted, padding: "6px" }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
