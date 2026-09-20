"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { LESSONS } from "@/lib/lessons";
import { themes, font, radius } from "@/lib/theme";

export default function CommandPalette({ open, onClose, theme, words = [], onSelectLesson, onSelectTab }) {
  const t = themes[theme];
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  const allLessons = useMemo(
    () =>
      LESSONS.flatMap((w) =>
        w.lessons.map((l) => ({ ...l, week: w.weekTitle.split("—")[0].trim() }))
      ),
    []
  );

  const tabs = [
    { id: "learn", label: "Lesson path" },
    { id: "chat", label: "Chat with Ming" },
    { id: "map", label: "Regional map" },
    { id: "words", label: "Vocabulary" },
    { id: "settings", label: "Settings" },
  ];

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    const groups = [];
    if (!q) {
      groups.push({ label: "Go to", items: tabs.map((x) => ({ type: "tab", ...x })) });
      return groups;
    }
    const lm = allLessons
      .filter((l) => l.title.toLowerCase().includes(q) || l.sub.toLowerCase().includes(q))
      .slice(0, 5);
    const wm = words
      .filter(
        (w) =>
          w.chinese?.includes(query) ||
          w.pinyin?.toLowerCase().includes(q) ||
          w.meaning?.toLowerCase().includes(q)
      )
      .slice(0, 5);
    const tm = tabs.filter((x) => x.label.toLowerCase().includes(q));

    if (lm.length) groups.push({ label: "Lessons", items: lm.map((l) => ({ type: "lesson", ...l })) });
    if (wm.length) groups.push({ label: "Words", items: wm.map((w) => ({ type: "word", ...w })) });
    if (tm.length) groups.push({ label: "Go to", items: tm.map((x) => ({ type: "tab", ...x })) });
    return groups;
  }, [q, query, words, allLessons]);

  const flat = results.flatMap((g) => g.items);

  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, flat.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        pick(flat[cursor]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, cursor]);

  function pick(item) {
    if (!item) return;
    if (item.type === "lesson") onSelectLesson(item);
    if (item.type === "tab") onSelectTab(item.id);
    if (item.type === "word") onSelectTab("words");
    onClose();
  }

  if (!open) return null;

  let idx = -1;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 92vw)",
          background: t.surface,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: radius.lg,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "13px 16px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <SearchIcon color={t.textMuted} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, words, or pages"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: t.text,
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: "6px" }}>
          {flat.length === 0 && (
            <p style={{ fontSize: "13px", color: t.textMuted, textAlign: "center", padding: "24px 0", margin: 0 }}>
              Nothing matches that
            </p>
          )}
          {results.map((group) => (
            <div key={group.label}>
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: t.textFaint,
                  margin: "8px 10px 5px",
                }}
              >
                {group.label}
              </p>
              {group.items.map((item) => {
                idx++;
                const active = idx === cursor;
                const myIdx = idx;
                return (
                  <button
                    key={`${item.type}-${item.id || item.chinese}`}
                    onClick={() => pick(item)}
                    onMouseEnter={() => setCursor(myIdx)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: radius.sm,
                      border: "none",
                      background: active ? t.accentSoft : "transparent",
                    }}
                  >
                    {item.type === "word" ? (
                      <>
                        <span style={{ fontFamily: font.cn, fontSize: "15px", color: t.accent }}>
                          {item.chinese}
                        </span>
                        <span style={{ fontSize: "12px", color: t.textSecondary, fontStyle: "italic" }}>
                          {item.pinyin}
                        </span>
                        <span style={{ fontSize: "12px", color: t.textMuted, flex: 1, textAlign: "right" }}>
                          {item.meaning}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "13px", color: t.text, flex: 1 }}>
                          {item.title || item.label}
                        </span>
                        {item.week && <span style={{ fontSize: "10px", color: t.textMuted }}>{item.week}</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: "8px 14px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "13px" }}>
          {[
            ["enter", "open"],
            ["up down", "navigate"],
            ["esc", "close"],
          ].map(([k, l]) => (
            <span key={k} style={{ fontSize: "10px", color: t.textFaint }}>
              <span
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: "3px",
                  padding: "1px 4px",
                  marginRight: "4px",
                  color: t.textMuted,
                }}
              >
                {k}
              </span>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
