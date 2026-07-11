"use client";
import { useState, useRef } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = handleTranscribe;
      mediaRecorder.current.start();
      setRecording(true);
    } catch { alert("Microphone access denied."); }
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
      setTranscribing(true);
    }
  }

  async function handleTranscribe() {
    try {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) onSend(data.text);
    } catch { alert("Transcription failed."); }
    finally { setTranscribing(false); }
  }

  const placeholder = transcribing ? "Transcribing..." : recording ? "Recording... release to send" : "Message Ming...";

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.inputRow, borderColor: recording ? "#e8a090" : "#e8e0d4" }}>
        <textarea
          style={styles.input}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || transcribing}
          rows={1}
        />
        <div style={styles.actions}>
          <button
            style={{ ...styles.micBtn, background: recording ? "#fff0ee" : "#f5f0e8", borderColor: recording ? "#e8c0b8" : "#e8e0d4" }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={disabled || transcribing}
            title="Hold to speak"
          >
            {recording ? "⏹" : "🎤"}
          </button>
          <button
            style={{ ...styles.sendBtn, opacity: !value.trim() || disabled ? 0.4 : 1, cursor: !value.trim() || disabled ? "not-allowed" : "pointer" }}
            onClick={submit}
            disabled={!value.trim() || disabled}
          >
            ↑
          </button>
        </div>
      </div>
      <p style={styles.hint}>Enter to send · Shift+Enter for new line · Hold 🎤 to speak</p>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", gap: "5px" },
  inputRow: {
    display: "flex", alignItems: "flex-end", gap: "8px",
    background: "#ffffff", border: "1.5px solid",
    borderRadius: "14px", padding: "10px 10px 10px 16px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)", transition: "border-color 0.15s",
  },
  input: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#2d2520", fontSize: "15px", fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: "1.5", resize: "none", maxHeight: "120px", overflowY: "auto",
  },
  actions: { display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 },
  micBtn: {
    width: "34px", height: "34px", borderRadius: "9px",
    border: "1px solid", fontSize: "15px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  },
  sendBtn: {
    width: "34px", height: "34px", borderRadius: "9px",
    background: "linear-gradient(135deg,#8b6a3a,#6a4a2a)",
    border: "none", color: "#fff", fontSize: "18px", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(139,106,58,0.2)", transition: "opacity 0.15s",
  },
  hint: { fontSize: "11px", color: "#ccc", textAlign: "center", margin: 0 },
};