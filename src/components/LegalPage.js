import { CONTACT_EMAIL, LAST_UPDATED } from "@/lib/legal";

// Plain reading page for /privacy and /terms. Server-rendered with the CSS variables from
// globals.css, so it follows the saved theme and works without JavaScript (App Review
// opens these links in Safari).
export default function LegalPage({ title, intro, sections }) {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)", padding: "48px 20px 80px" }}>
      <article style={{ maxWidth: "680px", margin: "0 auto" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "36px" }}>
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "19px",
              color: "var(--accent)",
            }}
          >
            明
          </span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: "19px", fontWeight: 600, color: "var(--text)" }}>Ming</span>
        </a>

        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", lineHeight: 1.2, fontWeight: 600, marginBottom: "8px" }}>{title}</h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px" }}>Last updated {LAST_UPDATED}</p>
        <p style={{ fontSize: "16px", lineHeight: 1.7, marginBottom: "8px" }}>{intro}</p>

        {sections.map((s) => (
          <section key={s.heading} style={{ marginTop: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>{s.heading}</h2>
            {s.body?.map((p, i) => (
              <p key={i} style={{ fontSize: "15px", lineHeight: 1.7, marginBottom: "10px" }}>
                {p}
              </p>
            ))}
            {s.list && (
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {s.list.map(([term, text]) => (
                  <li key={term} style={{ fontSize: "15px", lineHeight: 1.65 }}>
                    <strong style={{ fontWeight: 600 }}>{term}</strong> {text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {CONTACT_EMAIL && (
          <section style={{ marginTop: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>Contact</h2>
            <p style={{ fontSize: "15px", lineHeight: 1.7 }}>
              Questions or requests:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent)" }}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        )}

        <p style={{ marginTop: "40px", fontSize: "13px", color: "var(--muted)" }}>
          <a href="/privacy" style={{ color: "var(--accent)" }}>
            Privacy
          </a>
          {" · "}
          <a href="/terms" style={{ color: "var(--accent)" }}>
            Terms
          </a>
        </p>
      </article>
    </main>
  );
}
