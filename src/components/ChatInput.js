"use client";
import { useState, useRef } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
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
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = handleTranscribe;
      mediaRecorder.current.start();
      setRecording(true);
    } catch {
      alert("Microphone access denied — check your browser settings.");
    }
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

      if (data.text) {
        onSend(data.text);
      }
    } catch {
      alert("Transcription failed — try again.");
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <textarea
        style={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={transcribing ? "Transcribing..." : "Type or hold 🎤 to speak..."}
        disabled={disabled || transcribing}
        rows={1}
      />
      <button
        style={{
          ...styles.micBtn,
          background: recording ? "#e53e3e" : "#2a2a2a",
        }}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled || transcribing}
        title="Hold to speak"
      >
        🎤
      </button>
      <button
        style={{
          ...styles.btn,
          opacity: !value.trim() || disabled ? 0.4 : 1,
          cursor: !value.trim() || disabled ? "not-allowed" : "pointer",
        }}
        onClick={submit}
        disabled={!value.trim() || disabled}
      >
        ↑
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex", gap: "10px", alignItems: "flex-end",
    background: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "14px", padding: "10px 10px 10px 16px",
  },
  input: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#f0f0f0", fontSize: "15px", fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: "1.5", resize: "none", maxHeight: "120px", overflowY: "auto",
  },
  micBtn: {
    width: "34px", height: "34px", borderRadius: "9px",
    border: "none", fontSize: "16px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.15s",
  },
  btn: {
    width: "34px", height: "34px", borderRadius: "9px",
    background: "#d4a843", border: "none", color: "#0f0f0f",
    fontSize: "18px", fontWeight: 600, display: "flex",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "opacity 0.15s",
  },
};