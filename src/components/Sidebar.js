"use client";

const NAV_ITEMS = [
  { id: "learn", emoji: "📚", label: "Learn" },
  { id: "chat", emoji: "💬", label: "Chat" },
  { id: "map", emoji: "🗺️", label: "Map" },
  { id: "words", emoji: "✦", label: "Words" },
];

export default function Sidebar({ tab, setTab }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoChar}>明</span>
      </div>

      <div style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            style={{ ...styles.navBtn, ...(tab === item.id ? styles.navBtnActive : {}) }}
            onClick={() => setTab(item.id)}
            title={item.label}
          >
            <span style={styles.navEmoji}>{item.emoji}</span>
            <span style={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button style={styles.navBtn} title="Settings" onClick={() => setTab("settings")}>
        <span style={styles.navEmoji}>⚙️</span>
        <span style={styles.navLabel}>Settings</span>
      </button>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "72px", flexShrink: 0, background: "#f5f0e8",
    borderRight: "1px solid #e8e0d4",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "12px 0 16px", gap: "2px",
  },
  logo: {
    width: "38px", height: "38px", borderRadius: "10px",
    background: "#fff7ec", border: "1px solid #e8d4a8",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "12px",
  },
  logoChar: { fontSize: "18px", fontFamily: "'Noto Sans SC', sans-serif", color: "#8b6a3a" },
  nav: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", width: "100%" },
  navBtn: {
    width: "60px", height: "54px", borderRadius: "10px", border: "none",
    background: "transparent", color: "#c8b8a8", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "3px", transition: "all 0.15s",
    fontFamily: "Inter, sans-serif",
  },
  navBtnActive: { background: "#fff7ec", color: "#8b6a3a" },
  navEmoji: { fontSize: "18px", lineHeight: 1 },
  navLabel: { fontSize: "10px", fontWeight: 500, lineHeight: 1, color: "inherit" },
};