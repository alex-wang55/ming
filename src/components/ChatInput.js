"use client";
import { useState, useRef, useEffect } from "react";
import { themes, radius } from "@/lib/theme";
import { apiFetch } from "@/lib/api";

const MAX_RECORDING_MS = 60 * 1000;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return ["audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function extensionFor(mimeType) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export default function ChatInput({ onSend, disabled, theme, compact = false, usageLeft = null, onFocusChange }) {
  const [value, setValue] = useState("");
  const [mic, setMic] = useState("idle"); // idle | starting | recording | transcribing
  const [error, setError] = useState(null);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const stopTimer = useRef(null);
  const ta = useRef(null);
  const t = themes[theme];

  useEffect(() => {
    if (!ta.current) return;
    ta.current.style.height = "auto";
    ta.current.style.height = Math.min(ta.current.scrollHeight, 140) + "px";
  }, [value]);

  useEffect(
    () => () => {
      clearTimeout(stopTimer.current);
      recorder.current?.stream.getTracks().forEach((tr) => tr.stop());
    },
    []
  );

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  async function toggleMic() {
    setError(null);
    if (mic === "recording") return stopRec();
    if (mic !== "idle") return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice input isn't supported in this browser.");
      return;
    }

    setMic("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      chunks.current = [];
      recorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      recorder.current.onstop = transcribe;
      recorder.current.start();
      setMic("recording");
      stopTimer.current = setTimeout(stopRec, MAX_RECORDING_MS);
    } catch {
      setMic("idle");
      setError("Microphone access was blocked. Allow it in your browser settings to speak to Ming.");
    }
  }

  function stopRec() {
    clearTimeout(stopTimer.current);
    if (!recorder.current || recorder.current.state === "inactive") return;
    recorder.current.stop();
    recorder.current.stream.getTracks().forEach((tr) => tr.stop());
    setMic("transcribing");
  }

  async function transcribe() {
    try {
      const type = recorder.current?.mimeType || "audio/webm";
      const blob = new Blob(chunks.current, { type });
      if (blob.size < 1000) {
        setError("That was too short — tap the mic, speak, then tap again to send.");
        return;
      }
      const fd = new FormData();
      fd.append("audio", blob, `recording.${extensionFor(type)}`);
      const res = await apiFetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (data.text?.trim()) onSend(data.text.trim());
      else setError(data.error || "Couldn't hear anything. Try again a little closer to the mic.");
    } catch {
      setError("Transcription failed. Check your connection and try again.");
    } finally {
      setMic("idle");
    }
  }

  const recording = mic === "recording";
  const busy = disabled || mic === "transcribing" || mic === "starting";
  const canSend = value.trim() && !busy && !recording;
  const keepFocus = (e) => e.preventDefault(); // tapping a button shouldn't close the phone keyboard

  let hint = compact ? null : "Enter to send · Shift + Enter for a new line · tap the mic to speak";
  if (usageLeft !== null && usageLeft <= 5) {
    hint = usageLeft === 0 ? "You've used today's messages. They reset tomorrow." : `${usageLeft} message${usageLeft === 1 ? "" : "s"} left today`;
  }

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
          disabled={busy || recording}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !compact && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          enterKeyHint={compact ? "enter" : "send"}
          aria-label="Message Ming"
          placeholder={
            mic === "transcribing"
              ? "Transcribing your audio..."
              : recording
              ? "Listening — tap the mic again to send"
              : "Message Ming"
          }
          style={{
            flex: 1,
            minWidth: 0,
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
            onPointerDown={keepFocus}
            onClick={toggleMic}
            disabled={disabled || mic === "transcribing" || mic === "starting"}
            title={recording ? "Stop and send" : "Speak"}
            aria-label={recording ? "Stop recording and send" : "Record a voice message"}
            aria-pressed={recording}
            style={{
              background: recording ? `${t.danger}1a` : "transparent",
              border: `1px solid ${recording ? t.danger : t.border}`,
              color: recording ? t.danger : t.textMuted,
              animation: recording ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
          >
            {recording ? <StopIcon /> : <MicIcon />}
          </IconButton>

          <IconButton
            onPointerDown={keepFocus}
            onClick={submit}
            disabled={!canSend}
            title="Send"
            aria-label="Send message"
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

      {(error || hint) && (
        <p
          role={error ? "alert" : undefined}
          style={{ fontSize: "11px", color: error ? t.danger : t.textFaint, textAlign: "center", margin: 0 }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

function IconButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      style={{
        width: "36px",
        height: "36px",
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
function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
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
