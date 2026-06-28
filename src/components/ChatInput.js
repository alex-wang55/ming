"use client";
// components/ChatInput.js
import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  function handleKeyDown(e) {
    // Send on Enter, new line on Shift+Enter
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

  return (
    <div style={styles.wrapper}>
      <textarea
        style={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Enter to send)"
        disabled={disabled}
        rows={1}
      />
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
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px",
    padding: "10px 10px 10px 16px",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f0f0f0",
    fontSize: "15px",
    fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: "1.5",
    resize: "none",
    maxHeight: "120px",
    overflowY: "auto",
  },
  btn: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#d4a843",
    border: "none",
    color: "#0f0f0f",
    fontSize: "18px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
};
