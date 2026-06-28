"use client";
// components/Message.js

export default function Message({ message }) {
  const isAI = message.role === "assistant";

  return (
    <div style={{ ...styles.wrapper, justifyContent: isAI ? "flex-start" : "flex-end" }}>
      {isAI && <Avatar />}
      <div style={isAI ? styles.aiBubble : styles.userBubble}>
        <FormattedContent content={message.content} />
      </div>
    </div>
  );
}

// Renders message text — highlights Chinese characters with correct font
function FormattedContent({ content }) {
  // Split on Chinese character blocks so they render in Noto Sans SC
  const parts = content.split(/([\u4e00-\u9fff\u3400-\u4dbf，。！？、：；""''（）【】《》]+)/g);

  return (
    <p style={styles.text}>
      {parts.map((part, i) => {
        const isChinese = /[\u4e00-\u9fff]/.test(part);
        return isChinese
          ? <span key={i} style={styles.chinese}>{part}</span>
          : part;
      })}
    </p>
  );
}

function Avatar() {
  return (
    <div style={styles.avatar}>
      <span style={styles.avatarChar}>明</span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },
  aiBubble: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px 14px 14px 4px",
    padding: "12px 16px",
    maxWidth: "82%",
  },
  userBubble: {
    background: "#1e2a3a",
    border: "1px solid #2a3d55",
    borderRadius: "14px 14px 4px 14px",
    padding: "12px 16px",
    maxWidth: "82%",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.65",
    color: "#f0f0f0",
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  chinese: {
    fontFamily: "'Noto Sans SC', sans-serif",
    color: "#d4a843",
    fontWeight: 500,
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(212, 168, 67, 0.12)",
    border: "1px solid rgba(212, 168, 67, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarChar: {
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: "14px",
    color: "#d4a843",
    fontWeight: 500,
  },
};
