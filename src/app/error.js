"use client";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="app-root"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "24px",
        textAlign: "center",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <p style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "44px", color: "var(--accent)", lineHeight: 1 }}>明</p>
      <p style={{ fontSize: "17px", fontWeight: 600 }}>Something went wrong</p>
      <p style={{ fontSize: "13px", color: "var(--muted)", maxWidth: "300px" }}>
        Your progress is saved. Try again, and if it keeps happening, reload the page.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "8px",
          padding: "10px 20px",
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
    </div>
  );
}
