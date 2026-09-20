"use client";
import { themes, font, radius } from "@/lib/theme";

const NAV = [
  { id: "learn", label: "Learn", icon: PathIcon },
  { id: "chat", label: "Chat", icon: ChatIcon },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "words", label: "Words", icon: BookIcon },
];

export default function Sidebar({ tab, setTab, theme }) {
  const t = themes[theme];

  return (
    <nav
      style={{
        width: "76px",
        flexShrink: 0,
        background: t.bg,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0 20px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: radius.md,
          border: `1px solid ${t.accentBorder}`,
          background: t.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "19px", fontFamily: font.cn, color: t.accent, fontWeight: 700 }}>
          明
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", alignItems: "center" }}>
        {NAV.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={tab === item.id}
            onClick={() => setTab(item.id)}
            t={t}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <NavButton
        item={{ id: "settings", label: "Settings", icon: GearIcon }}
        active={tab === "settings"}
        onClick={() => setTab("settings")}
        t={t}
      />
    </nav>
  );
}

function NavButton({ item, active, onClick, t }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      style={{
        width: "60px",
        height: "56px",
        borderRadius: radius.md,
        border: `1px solid ${active ? t.accentBorder : "transparent"}`,
        background: active ? t.accentSoft : "transparent",
        color: active ? t.accent : t.textMuted,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        transition: "all 0.15s ease",
      }}
    >
      <Icon />
      <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.01em" }}>{item.label}</span>
    </button>
  );
}

const ico = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function PathIcon() {
  return (
    <svg {...ico}>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M12 19h4a2 2 0 0 0 0-4H8a2 2 0 0 1 0-4h4" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...ico}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg {...ico}>
      <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg {...ico}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...ico}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
