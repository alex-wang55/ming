"use client";

const NAV_ITEMS = [
  { id: "learn", emoji: "📚", label: "Learn" },
  { id: "chat", emoji: "💬", label: "Chat" },
  { id: "map", emoji: "🗺️", label: "Map" },
  { id: "words", emoji: "✦", label: "Words" },
];

export default function Sidebar({ tab, setTab, theme }) {
  const isDark = theme === "dark";

  const s = {
    sidebar: {
      width: "72px", flexShrink: 0,
      background: isDark ? "#0a0a08" : "#f5f0e8",
      borderRight: `1px solid ${isDark ? "rgba(212,168,67,0.1)" : "#e8e0d4"}`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "14px 0 18px", gap: "2px",
    },
    logo: {
      width: "38px", height: "38px", borderRadius: "10px",
      background: isDark ? "transparent" : "#fff7ec",
      border: `1px solid ${isDark ? "rgba(212,168,67,0.3)" : "#e8d4a8"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "16px",
    },
    logoChar: {
      fontSize: "20px", fontFamily: "'Noto Sans SC', sans-serif",
      color: isDark ? "#d4a843" : "#8b6a3a", fontWeight: 700,
    },
    navBtn: {
      width: "60px", height: "54px", borderRadius: "10px", border: "none",
      background: "transparent",
      color: isDark ? "rgba(212,168,67,0.25)" : "#c8b8a8",
      cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "3px", transition: "all 0.15s",
      fontFamily: "Inter, sans-serif",
    },
    navBtnActive: {
      background: isDark ? "rgba(212,168,67,0.08)" : "#fff7ec",
      color: isDark ? "#d4a843" : "#8b6a3a",
      border: isDark ? "1px solid rgba(212,168,67,0.15)" : "none",
    },
    navEmoji: { fontSize: "18px", lineHeight: 1 },
    navLabel: { fontSize: "10px", fontWeight: 500, lineHeight: 1, color: "inherit", letterSpacing: "0.02em" },
  };

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <span style={s.logoChar}>明</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "100%" }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            style={{ ...s.navBtn, ...(tab === item.id ? s.navBtnActive : {}) }}
            onClick={() => setTab(item.id)}
            title={item.label}
          >
            <span style={s.navEmoji}>{item.emoji}</span>
            <span style={s.navLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button
        style={{ ...s.navBtn, ...(tab === "settings" ? s.navBtnActive : {}) }}
        onClick={() => setTab("settings")}
        title="Settings"
      >
        <span style={s.navEmoji}>⚙️</span>
        <span style={s.navLabel}>Settings</span>
      </button>
    </div>
  );
}