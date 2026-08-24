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
      background: isDark ? "#0d0d0d" : "#f5f0e8",
      borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e8e0d4"}`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "12px 0 16px", gap: "2px",
    },
    logo: {
      width: "38px", height: "38px", borderRadius: "10px",
      background: isDark ? "linear-gradient(135deg,#2a1f08,#1a1408)" : "#fff7ec",
      border: `1px solid ${isDark ? "rgba(212,168,67,0.25)" : "#e8d4a8"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "12px",
      boxShadow: isDark ? "0 0 12px rgba(212,168,67,0.08)" : "none",
    },
    logoChar: { fontSize: "18px", fontFamily: "'Noto Sans SC', sans-serif", color: isDark ? "#d4a843" : "#8b6a3a" },
    navBtn: {
      width: "60px", height: "54px", borderRadius: "10px", border: "none",
      background: "transparent", color: isDark ? "#444" : "#c8b8a8", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "3px", transition: "all 0.15s",
      fontFamily: "Inter, sans-serif",
    },
    navBtnActive: {
      background: isDark ? "rgba(212,168,67,0.1)" : "#fff7ec",
      color: isDark ? "#d4a843" : "#8b6a3a",
    },
    navEmoji: { fontSize: "18px", lineHeight: 1 },
    navLabel: { fontSize: "10px", fontWeight: 500, lineHeight: 1, color: "inherit" },
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