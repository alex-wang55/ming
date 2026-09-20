"use client";
import { useState, useRef, useEffect } from "react";
import { themes, radius } from "@/lib/theme";

export default function ChatInput({ onSend, disabled, theme }) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const ta = useRef(null);
  const t = themes[theme];

  useEffect(() => {
    if (!ta.current) return;
    ta.current.style.height = "auto";
    ta.current.style.height = Math.min(ta.current.scrollHeight, 140) + "px";
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream);
      recorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.current.onstop = transcribe;
      recorder.current.start();
      setRecording(true);
    } catch {
      alert("Microphone access denied. Check your browser settings.");
    }
  }

  function stopRec() {
    if (!recorder.current) return;
    recorder.current.stop();
    recorder.current.stream.getTracks().forEach((tr) => tr.stop());
    setRecording(false);
    setTranscribing(true);
  }

  async function transcribe() {
    try {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "rec.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) onSend(data.text);
    } catch {
      alert("Transcription failed. Try again.");
    } finally {
      setTranscribing(false);
    }
  }

  const busy = disabled || transcribing;
  const canSend = value.trim() && !busy;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          background: t.surface,
          border: `1px solid ${recording ? t.danger : t.border}`,
          borderRadius: radius.lg,
          padding: "8px 8px 8px 14px",
          boxShadow: t.shadow,
          transition: "border-color 0.15s",
        }}
      >
        <textarea
          ref={ta}
          rows={1}
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            transcribing ? "Transcribing your audio..." : recording ? "Listening..." : "Message Ming"
          }
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: t.text,
            fontSize: "14.5px",
            lineHeight: 1.55,
            resize: "none",
            overflowY: "auto",
            maxHeight: "140px",
            paddingTop: "7px",
            paddingBottom: "7px",
          }}
        />

        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <IconButton
            onMouseDown={startRec}
            onMouseUp={stopRec}
            onTouchStart={startRec}
            onTouchEnd={stopRec}
            disabled={busy}
            title="Hold to speak"
            style={{
              background: recording ? `${t.danger}1a` : "transparent",
              border: `1px solid ${recording ? t.danger : t.border}`,
              color: recording ? t.danger : t.textMuted,
            }}
          >
            <MicIcon />
          </IconButton>

          <IconButton
            onClick={submit}
            disabled={!canSend}
            title="Send"
            style={{
              background: canSend ? t.accent : "transparent",
              border: `1px solid ${canSend ? t.accent : t.border}`,
              color: canSend ? t.btnText : t.textFaint,
            }}
          >
            <ArrowUpIcon />
          </IconButton>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: t.textFaint, textAlign: "center", margin: 0 }}>
        Enter to send · Shift + Enter for a new line · hold the mic to speak
      </p>
    </div>
  );
}

function IconButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: radius.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        opacity: props.disabled ? 0.45 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}
function ArrowUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
