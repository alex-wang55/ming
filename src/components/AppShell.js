"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { themes, font, radius } from "@/lib/theme";
import { LESSONS } from "@/lib/lessons";
import { useIsMobile } from "@/lib/hooks";
import { isDue } from "@/lib/review";
import { STARTERS } from "@/lib/goals";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import UserMenu from "@/components/UserMenu";
import MapTab from "@/components/MapTab";
import Sidebar, { BottomNav } from "@/components/Sidebar";
import LearnTab from "@/components/LearnTab";
import WordsTab from "@/components/WordsTab";
import SettingsTab from "@/components/SettingsTab";
import Checkpoint from "@/components/Checkpoint";
import CommandPalette from "@/components/CommandPalette";

const TOTAL_LESSONS = LESSONS.reduce((s, w) => s + w.lessons.length, 0);

const HEADINGS = {
  learn: ["Your lesson path", (s) => `${s.done} of ${s.total} lessons complete`],
  chat: ["Chat with Ming", () => "Free conversation"],
  map: ["Regional map", () => "Explore accents and culture by region"],
  words: ["Your vocabulary", (s) => `${s.wordCount} word${s.wordCount === 1 ? "" : "s"} learned`],
  settings: ["Settings", () => "Manage your preferences"],
};

function welcomeFor(profile) {
  return {
    role: "assistant",
    content: profile?.goal_text
      ? `嗨！Welcome back. Your goal: ${profile.goal_text}\n\nPick a lesson from the Learn tab, or just start talking — English or Mandarin both work.`
      : "嗨！Hi! I'm Ming — your personal Mandarin coach. Tell me why you're learning Mandarin, or pick a lesson from the Learn tab.",
  };
}

export default function AppShell({
  user,
  profile,
  settings,
  updateSettings,
  tab,
  setTab,
  messages,
  loading,
  usageLeft,
  words,
  wordsLoading,
  completedLessons,
  streak,
  activity,
  currentLesson,
  review,
  onSend,
  onStartLesson,
  onStartRegion,
  onFinishLesson,
  onStartReview,
  onRate,
  onCloseReview,
  onUpdateProfile,
}) {
  const theme = settings.theme;
  const t = themes[theme];
  const isMobile = useIsMobile();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const blurTimer = useRef(null);

  const dueCount = useMemo(() => words.filter((w) => isDue(w)).length, [words]);
  const welcome = useMemo(() => welcomeFor(profile), [profile]);

  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, tab]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  // On phones the tab bar hides while typing so the keyboard and input get the room.
  function onInputFocus(focused) {
    clearTimeout(blurTimer.current);
    if (focused) setTyping(true);
    else blurTimer.current = setTimeout(() => setTyping(false), 120);
  }

  const stats = { done: completedLessons.length, total: TOTAL_LESSONS, wordCount: words.length };
  const [headTitle, headSubFn] = HEADINGS[tab];
  const inLesson = tab === "chat" && currentLesson;
  const title = inLesson ? currentLesson.title : headTitle;
  const subtitle = inLesson ? currentLesson.sub : headSubFn(stats);

  return (
    <div className="app-root" style={{ display: "flex", width: "100%", background: t.bg, color: t.text }}>
      {!isMobile && <Sidebar tab={tab} setTab={setTab} theme={theme} dueCount={dueCount} />}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: t.bg }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: isMobile ? "calc(env(safe-area-inset-top) + 10px) 14px 10px" : "0 24px",
            minHeight: isMobile ? 0 : "56px",
            flexShrink: 0,
            borderBottom: `1px solid ${t.border}`,
            background: t.bg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {isMobile && (
              <div
                aria-hidden
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: radius.sm,
                  border: `1px solid ${t.accentBorder}`,
                  background: t.accentSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: font.cn, fontSize: "16px", color: t.accent, fontWeight: 700 }}>明</span>
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={ellipsis({ fontSize: "15px", fontWeight: 600, color: t.text, margin: 0, letterSpacing: "-0.01em" })}>
                {title}
              </p>
              <p style={ellipsis({ fontSize: "12px", color: t.textMuted, margin: 0 })}>{subtitle}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <SearchButton t={t} compact={isMobile} onClick={() => setPaletteOpen(true)} />
            <UserMenu user={user} wordCount={words.length} streak={streak} theme={theme} compact={isMobile} />
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {tab === "learn" && (
            <div className="tab-in" style={{ flex: 1, minHeight: 0 }}>
              <LearnTab
                completedLessons={completedLessons}
                onStartLesson={onStartLesson}
                wordCount={words.length}
                dueCount={dueCount}
                onReview={onStartReview}
                streak={streak}
                activity={activity}
                theme={theme}
                goalText={profile?.goal_text}
                deadlineDate={profile?.deadline_date}
                isMobile={isMobile}
              />
            </div>
          )}

          {tab === "chat" && (
            <>
              <main className="tab-in" style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative", background: t.bg }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    padding: isMobile ? "16px 12px" : "24px",
                    maxWidth: "720px",
                    margin: "0 auto",
                  }}
                >
                  <Message message={welcome} theme={theme} />
                  {messages.map((msg, i) => (
                    <Message key={i} message={msg} theme={theme} />
                  ))}
                  {loading && <TypingIndicator t={t} />}
                  {messages.length === 0 && !loading && <Starters t={t} onPick={onSend} />}
                  <div ref={bottomRef} />
                </div>
              </main>

              <footer
                style={{
                  flexShrink: 0,
                  borderTop: `1px solid ${t.border}`,
                  background: t.bg,
                  padding: isMobile ? `8px 10px ${typing ? "calc(env(safe-area-inset-bottom) + 8px)" : "8px"}` : "12px 24px 20px",
                }}
              >
                <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {currentLesson && (
                    <div
                      className="fade-up"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        background: t.accentSoft,
                        border: `1px solid ${t.accentBorder}`,
                        borderRadius: radius.md,
                        padding: "8px 8px 8px 14px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.accent, opacity: 0.75, margin: 0 }}>
                          Lesson in progress
                        </p>
                        <p style={ellipsis({ fontSize: "13.5px", fontWeight: 500, color: t.text, margin: 0 })}>{currentLesson.title}</p>
                      </div>
                      <button
                        className="press"
                        onClick={onFinishLesson}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12.5px",
                          padding: "7px 12px",
                          borderRadius: "8px",
                          background: t.accent,
                          border: "none",
                          color: t.btnText,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12.5 10 17 19 7" />
                        </svg>
                        Complete
                      </button>
                    </div>
                  )}
                  <ChatInput
                    onSend={onSend}
                    disabled={loading}
                    theme={theme}
                    compact={isMobile}
                    usageLeft={usageLeft}
                    onFocusChange={isMobile ? onInputFocus : undefined}
                  />
                </div>
              </footer>
            </>
          )}

          {tab === "map" && (
            <div className="tab-in" style={{ flex: 1, minHeight: 0 }}>
              <MapTab onStartLesson={onStartRegion} theme={theme} isMobile={isMobile} />
            </div>
          )}

          {tab === "words" && (
            <div className="tab-in" style={{ flex: 1, minHeight: 0 }}>
              <WordsTab words={words} loading={wordsLoading} onReview={onStartReview} theme={theme} isMobile={isMobile} />
            </div>
          )}

          {tab === "settings" && (
            <div className="tab-in" style={{ flex: 1, minHeight: 0 }}>
              <SettingsTab
                user={user}
                settings={settings}
                updateSettings={updateSettings}
                profile={profile}
                onUpdateProfile={onUpdateProfile}
              />
            </div>
          )}
        </div>

        {isMobile && !(typing && tab === "chat") && (
          <BottomNav tab={tab} setTab={setTab} theme={theme} dueCount={dueCount} />
        )}
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        theme={theme}
        words={words}
        onSelectLesson={onStartLesson}
        onSelectTab={setTab}
        isMobile={isMobile}
      />

      {review && (
        <Checkpoint
          key={review.id}
          words={review.words}
          title={review.title}
          theme={theme}
          onRate={onRate}
          onClose={onCloseReview}
        />
      )}
    </div>
  );
}

function ellipsis(style) {
  return { ...style, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
}

function SearchButton({ t, compact, onClick }) {
  const [shortcut, setShortcut] = useState("Ctrl K");
  useEffect(() => {
    if (/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)) setShortcut("⌘K");
  }, []);

  return (
    <button
      onClick={onClick}
      aria-label="Search lessons and words"
      title={`Search (${shortcut})`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "32px",
        padding: compact ? "0" : "0 8px 0 10px",
        width: compact ? "32px" : "auto",
        justifyContent: "center",
        borderRadius: radius.sm,
        border: `1px solid ${t.border}`,
        background: t.surface,
        color: t.textMuted,
        fontSize: "12px",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      {!compact && (
        <>
          <span>Search</span>
          <kbd
            style={{
              fontFamily: "inherit",
              fontSize: "10px",
              border: `1px solid ${t.border}`,
              borderRadius: "4px",
              padding: "1px 5px",
              color: t.textFaint,
            }}
          >
            {shortcut}
          </kbd>
        </>
      )}
    </button>
  );
}

// Empty chat: three ways in, so the first message is a click rather than a blank box.
function Starters({ t, onPick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "32px 0 8px" }}>
      <div className="rise" style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontFamily: font.cn, fontSize: "44px", lineHeight: 1.1, color: t.accent, opacity: 0.18 }}>明</div>
        <p style={{ fontSize: "17px", fontWeight: 600, color: t.text, margin: "8px 0 2px" }}>Ready when you are</p>
        <p style={{ fontSize: "13.5px", color: t.textMuted, margin: 0 }}>Say anything, or start with one of these.</p>
      </div>
      {STARTERS.map((s, i) => (
        <button
          key={s.id}
          className="rise press lift"
          onClick={() => onPick(s.prompt)}
          style={{
            "--i": i + 1,
            width: "min(360px, 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: radius.md,
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 500,
            color: t.text,
            textAlign: "left",
          }}
        >
          {s.label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function TypingIndicator({ t }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }} aria-label="Ming is typing">
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "999px",
          background: t.accentSoft,
          border: `1px solid ${t.accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <span style={{ fontFamily: font.cn, fontSize: "12px", color: t.accent, fontWeight: 700 }}>明</span>
      </div>
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "14px 14px 14px 4px",
          padding: "13px 16px",
          display: "flex",
          gap: "5px",
          alignItems: "center",
          boxShadow: t.shadow,
        }}
      >
        {[0, 0.15, 0.3].map((d, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: t.textMuted,
              animation: "bounce 1.2s infinite ease-in-out",
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
