"use client";
import { Fragment } from "react";
import { themes, font, radius } from "@/lib/theme";
import { ToneGraphs } from "@/components/ToneContour";
import { parseToneTags, stripTags } from "@/lib/tags";
import { useSpeaker } from "@/lib/audio";

const HANZI_RUN = /([一-鿿㐀-䶿]+)/g;
const HAS_HANZI = /[一-鿿㐀-䶿]/;

export default function Message({ message, theme }) {
  const t = themes[theme];
  const isAI = message.role === "assistant";
  const [playing, play] = useSpeaker();

  return (
    <div
      className="fade-up"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        justifyContent: isAI ? "flex-start" : "flex-end",
      }}
    >
      {isAI && (
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: radius.full,
            border: `1px solid ${t.accentBorder}`,
            background: t.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <span style={{ fontFamily: font.cn, fontSize: "12px", color: t.accent, fontWeight: 700 }}>明</span>
        </div>
      )}

      <div
        style={{
          background: message.error ? "transparent" : isAI ? t.surface : t.accentSoft,
          border: `1px ${message.error ? "dashed" : "solid"} ${isAI ? t.border : t.accentBorder}`,
          borderRadius: isAI
            ? `${radius.lg} ${radius.lg} ${radius.lg} 4px`
            : `${radius.lg} ${radius.lg} 4px ${radius.lg}`,
          padding: "11px 15px",
          maxWidth: "min(85%, 600px)",
          minWidth: 0,
          boxShadow: message.error ? "none" : t.shadow,
        }}
      >
        <Content content={message.content} t={t} playing={playing} play={play} muted={message.error} />
      </div>
    </div>
  );
}

function Content({ content, t, playing, play, muted }) {
  const tags = parseToneTags(content);
  const text = stripTags(content)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  return (
    <div>
      <p
        style={{
          fontSize: "14.5px",
          lineHeight: 1.65,
          color: muted ? t.textSecondary : t.text,
          margin: 0,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {text.split(/(\*\*[^*\n]+\*\*)/g).map((segment, i) => {
          const bold = segment.length > 4 && segment.startsWith("**") && segment.endsWith("**");
          const inner = bold ? segment.slice(2, -2) : segment;
          const nodes = inner.split(HANZI_RUN).map((part, j) =>
            HAS_HANZI.test(part) ? (
              <Hanzi key={j} text={part} t={t} playing={playing === part} onPlay={() => play(part)} />
            ) : (
              part
            )
          );
          return bold ? (
            <strong key={i} style={{ fontWeight: 600 }}>
              {nodes}
            </strong>
          ) : (
            <Fragment key={i}>{nodes}</Fragment>
          );
        })}
      </p>

      {tags.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
          {tags.map((tag, i) => (
            <button
              key={i}
              onClick={() => play(tag.hanzi)}
              title={`Play ${tag.hanzi}`}
              style={{
                textAlign: "left",
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                padding: "8px 10px",
                minWidth: "90px",
                opacity: playing === tag.hanzi ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginBottom: "5px" }}>
                <span style={{ fontFamily: font.cn, fontSize: "15px", color: t.accent }}>{tag.hanzi}</span>
                <span style={{ fontSize: "10px", color: t.textSecondary, fontStyle: "italic" }}>{tag.pinyin}</span>
              </div>
              <ToneGraphs tones={tag.tones} color={t.accent} height={16} />
              <p style={{ fontSize: "9.5px", color: t.textMuted, margin: "4px 0 0" }}>{tag.meaning}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Hanzi({ text, t, playing, onPlay }) {
  return (
    <button
      onClick={onPlay}
      title="Play pronunciation"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontFamily: font.cn,
        fontSize: "16px",
        fontWeight: 500,
        color: t.accent,
        background: "transparent",
        border: "none",
        borderBottom: `1px dotted ${t.accentBorder}`,
        padding: "0 1px",
        margin: 0,
        lineHeight: 1.4,
        opacity: playing ? 0.55 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {text}
      <SpeakerIcon color={t.textMuted} animated={playing} />
    </button>
  );
}

function SpeakerIcon({ color, animated }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, animation: animated ? "pulse 0.8s ease-in-out infinite" : "none" }}
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}
