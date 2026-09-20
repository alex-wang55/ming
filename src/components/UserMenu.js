"use client";
import { supabase } from "@/lib/supabase";
import { themes, radius } from "@/lib/theme";

export default function UserMenu({ user, wordCount, streak, theme }) {
  const t = themes[theme];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {streak > 0 && (
        <Pill t={t} color={t.warning} bg={t.accentSoft} border={t.accentBorder}>
          {streak} day streak
        </Pill>
      )}
      {wordCount > 0 && (
        <Pill t={t} color={t.success} bg={t.successSoft} border={t.successBorder}>
          {wordCount} words
        </Pill>
      )}
      <div style={{ width: "1px", height: "16px", background: t.border, margin: "0 2px" }} />
      <span style={{ fontSize: "12.5px", color: t.textMuted }}>{user.email.split("@")[0]}</span>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          fontSize: "12px",
          padding: "5px 12px",
          borderRadius: radius.sm,
          border: `1px solid ${t.border}`,
          background: "transparent",
          color: t.textMuted,
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function Pill({ children, color, bg, border }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "11.5px",
        fontWeight: 600,
        background: bg,
        border: `1px solid ${border}`,
        color,
      }}
    >
      {children}
    </span>
  );
}
