"use client";
import { useState, useRef, useEffect } from "react";
import { themes, radius } from "@/lib/theme";
import { apiFetch } from "@/lib/api";

const MAX_RECORDING_MS = 60 * 1000;
const BARS = 28;

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
  const [stream, setStream] = useState(null);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const stopTimer = useRef(null);
  const ta = useRef(null);
  const t = themes[theme];

  useEffect(() => {
    if (!ta.current) return;
    ta.current.style.height = "auto";
    ta.current.style.height = Math.min(ta.current.scrollHeight, 140) + "px";
  }, [value, mic]);

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
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      chunks.current = [];
      recorder.current = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      recorder.current.onstop = transcribe;
      recorder.current.start();
      setStream(media);
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
    setStream(null);
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
  const transcribing = mic === "transcribing";
  const busy = disabled || transcribing || mic === "starting";
  const canSend = !!value.trim() && !busy && !recording;
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
          background: recording ? t.accentSoft : t.surface,
          border: `1px solid ${recording ? t.accent : t.border}`,
          borderRadius: radius.xl,
          padding: "7px 7px 7px 16px",
          boxShadow: recording ? `0 0 0 4px ${t.accentSoft}` : t.shadow,
          transition: "border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
        }}
      >
        {recording ? (
          // While you speak, the text box becomes a live level meter with a timer.
          <RecordingBar stream={stream} t={t} />
        ) : transcribing ? (
          <div className="fade-up" style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", height: "38px", color: t.textSecondary, fontSize: "14px" }}>
            <span
              aria-hidden
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: `2px solid ${t.accentBorder}`,
                borderTopColor: t.accent,
                animation: "spin 0.7s linear infinite",
              }}
            />
            Turning that into text
          </div>
        ) : (
          <textarea
            ref={ta}
            rows={1}
            value={value}
            disabled={busy}
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
            placeholder="Message Ming (pinyin is fine)"
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
              paddingTop: "8px",
              paddingBottom: "8px",
            }}
          />
        )}

        {/* The mic gives way to Send once there's text, like a single smart button. */}
        {canSend ? (
          <RoundButton
            key="send"
            onPointerDown={keepFocus}
            onClick={submit}
            title="Send"
            aria-label="Send message"
            style={{ background: t.accent, border: `1px solid ${t.accent}`, color: t.btnText }}
          >
            <ArrowUpIcon />
          </RoundButton>
        ) : (
          <div key="mic" style={{ position: "relative", flexShrink: 0 }}>
            {recording && <span className="ring" style={{ background: t.accent }} />}
            <RoundButton
              onPointerDown={keepFocus}
              onClick={toggleMic}
              disabled={busy}
              title={recording ? "Stop and send" : "Speak"}
              aria-label={recording ? "Stop recording and send" : "Record a voice message"}
              aria-pressed={recording}
              style={{
                position: "relative",
                background: recording ? t.accent : "transparent",
                border: `1px solid ${recording ? t.accent : t.border}`,
                color: recording ? t.btnText : t.textSecondary,
              }}
            >
              {recording ? <StopIcon /> : <MicIcon />}
            </RoundButton>
          </div>
        )}
      </div>

      {(error || hint) && (
        <p
          key={error || hint}
          className="fade-up"
          role={error ? "alert" : undefined}
          style={{ fontSize: "11px", color: error ? t.danger : t.textFaint, textAlign: "center", margin: 0 }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

// Live microphone level as a row of bars that scroll right to left, plus elapsed time.
// The bars are drawn straight to the DOM from an AnalyserNode, so the meter doesn't
// re-render React thirty times a second.
function RecordingBar({ stream, t }) {
  const bars = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const clock = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!stream || !AudioCtx) return;
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const levels = Array(BARS).fill(0);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let peak = 0;
      for (const s of samples) peak = Math.max(peak, Math.abs(s - 128) / 128);
      levels.shift();
      levels.push(still ? 0.4 : Math.min(peak * 2.2, 1));
      const nodes = bars.current?.children;
      if (nodes) for (let i = 0; i < nodes.length; i++) nodes[i].style.height = `${3 + levels[i] * 23}px`;
    }, 80);

    return () => {
      clearInterval(timer);
      ctx.close().catch(() => {});
    };
  }, [stream]);

  return (
    <div
      className="fade-up"
      aria-label={`Recording, ${seconds} seconds. Tap stop to send.`}
      style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "12px", height: "38px" }}
    >
      <span style={{ fontSize: "13.5px", fontWeight: 600, color: t.accent, fontVariantNumeric: "tabular-nums", minWidth: "32px" }}>
        0:{String(seconds).padStart(2, "0")}
      </span>
      <div ref={bars} aria-hidden style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "3px", height: "26px", overflow: "hidden" }}>
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            style={{
              flex: "1 1 0",
              maxWidth: "4px",
              height: "3px",
              borderRadius: "2px",
              background: t.accent,
              opacity: 0.35 + 0.65 * (i / BARS),
              transition: "height 0.08s linear",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "11.5px", color: t.textMuted, flexShrink: 0 }}>Tap to send</span>
    </div>
  );
}

function RoundButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      className="press pop"
      style={{
        width: "38px",
        height: "38px",
        borderRadius: radius.full,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        opacity: props.disabled ? 0.45 : undefined,
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
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
