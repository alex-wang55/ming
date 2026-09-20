"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { themes, font, radius } from "@/lib/theme";

export default function GoalSetup({ user, theme, onDone }) {
  const t = themes[theme];
  const [goal, setGoal] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!goal.trim()) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        goal_text: goal.trim(),
        deadline_date: hasDeadline && date ? date : null,
      })
      .eq("id", user.id);
    setSaving(false);
    onDone({ goal_text: goal.trim(), deadline_date: hasDeadline && date ? date : null });
  }

  function skip() {
    onDone({ goal_text: null, deadline_date: null });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: t.bg,
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: radius.lg,
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <span style={{ fontFamily: font.cn, fontSize: "26px", color: t.accent }}>明</span>
          <p style={{ fontSize: "17px", fontWeight: 600, color: t.text, margin: "10px 0 4px" }}>
            What's your Mandarin goal?
          </p>
          <p style={{ fontSize: "13px", color: t.textMuted, margin: 0, lineHeight: 1.5 }}>
            This shapes what Ming teaches you first. Be as specific as you like.
          </p>
        </div>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Traveling to Beijing in 3 weeks, or talking with my partner's family"
          rows={3}
          style={{
            background: t.bg,
            border: `1px solid ${t.border}`,
            borderRadius: radius.md,
            padding: "12px",
            fontSize: "13.5px",
            color: t.text,
            resize: "none",
            outline: "none",
          }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: t.textSecondary }}>
          <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} />
          I have a deadline
        </label>

        {hasDeadline && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              background: t.bg,
              border: `1px solid ${t.border}`,
              borderRadius: radius.md,
              padding: "10px 12px",
              fontSize: "13.5px",
              color: t.text,
              outline: "none",
            }}
          />
        )}

        <button
          onClick={save}
          disabled={!goal.trim() || saving}
          style={{
            padding: "12px",
            borderRadius: radius.md,
            background: t.accent,
            border: "none",
            color: t.btnText,
            fontSize: "14px",
            fontWeight: 600,
            opacity: !goal.trim() || saving ? 0.5 : 1,
          }}
        >
          {saving ? "Saving..." : "Start learning"}
        </button>

        <button
          onClick={skip}
          style={{
            background: "none",
            border: "none",
            fontSize: "12.5px",
            color: t.textMuted,
            padding: "2px",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}