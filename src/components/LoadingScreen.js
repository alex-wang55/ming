// Uses CSS variables (set from the saved theme before first paint) instead of the
// theme object, so it renders in the right colours even before React hydrates.
export default function LoadingScreen({ error = false, onRetry }) {
  return (
    <div
      className="app-root"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: "18px",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--border)" }} />
        {!error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "var(--accent)",
              animation: "spin 1.1s linear infinite",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "24px", color: "var(--accent)", fontWeight: 700 }}>
            明
          </span>
        </div>
      </div>
      <div>
        <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", margin: "0 0 3px" }}>Ming</p>
        <p style={{ fontSize: "12.5px", color: "var(--muted)", margin: 0 }}>
          {error ? "Couldn't reach Ming. Check your connection." : "Your Mandarin coach"}
        </p>
      </div>
      {error && onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "9px 18px",
            borderRadius: "10px",
            border: "1px solid var(--accent-border)",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
