import { useAudioRecorderState, type AudioRecorder } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, FlatList, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, ZoomIn, ZoomOut } from "react-native-reanimated";
// The tab-aware SafeAreaView knows how tall the iOS tab bar is, so the input sits above it.
import { SafeAreaView } from "react-native-screens/experimental";
import { ArrowUpIcon, CheckIcon, MicIcon, StopIcon } from "@/components/icons";
import { MessageBubble, TypingIndicator, type WordTap } from "@/components/Message";
import { PressableScale, PulseRing, Rise } from "@/components/motion";
import { PinyinBubble, type PinyinHint } from "@/components/PinyinBubble";
import { ScreenHeader } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { toPinyin } from "@/lib/pinyin";
import { useSession, type Profile } from "@/lib/session";
import { useSpeak, useStore, type Msg } from "@/lib/store";
import { cnFont, radius, useMingTheme } from "@/lib/theme";
import { useMingRecorder } from "@/lib/voice";
import { STARTERS } from "@/shared/goals";

// Same greeting the web app shows at the top of the chat. It isn't saved or sent to the AI.
function welcomeFor(profile: Profile | null): Msg {
  return {
    role: "assistant",
    content: profile?.goal_text
      ? `嗨！Welcome back. Your goal: ${profile.goal_text}\n\nPick a lesson from the Learn tab, or just start talking. English or Mandarin both work.`
      : "嗨！Hi! I'm Ming, your personal Mandarin coach. Tell me why you're learning Mandarin, or pick a lesson from the Learn tab.",
  };
}

export default function Chat() {
  const t = useMingTheme();
  const { profile } = useSession();
  const { messages, sending, usageLeft, currentLesson, sendMessage, finishLesson, reportMessage } = useStore();
  const [playing, play] = useSpeak();
  const list = useRef<FlatList<Msg>>(null);
  const [finishing, setFinishing] = useState(false);

  const welcome = useMemo(() => welcomeFor(profile), [profile]);
  const data = useMemo(() => [welcome, ...messages], [welcome, messages]);

  // A light tap when Ming's reply lands, so you feel the answer arrive.
  const wasSending = useRef(false);
  useEffect(() => {
    if (wasSending.current && !sending) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") (last.error ? haptic.warn : haptic.select)();
    }
    wasSending.current = sending;
  }, [sending, messages]);

  // Keep the message box right on top of the keyboard. The keyboard's height is measured
  // from the bottom of the screen, but this screen already sits above the tab bar, so only
  // lift by the part of the keyboard that overlaps it. `gap` is measured on screen (not from
  // the layout tree), so it stays right whatever the tab bar and safe areas are doing.
  const { height: windowHeight } = useWindowDimensions();
  const body = useRef<View>(null);
  const keyboard = useSharedValue(0);
  const gap = useSharedValue(0);
  useKeyboardHandler(
    {
      onMove: (e) => {
        "worklet";
        keyboard.value = e.height;
      },
      onEnd: (e) => {
        "worklet";
        keyboard.value = e.height;
      },
    },
    []
  );
  const lift = useAnimatedStyle(() => ({ height: Math.max(keyboard.value - gap.value, 0) }));
  const bodyOrigin = useRef({ x: 0, y: 0 });
  const measureGap = () =>
    body.current?.measureInWindow((x, y, _w, h) => {
      bodyOrigin.current = { x, y };
      if (h > 0) gap.value = Math.max(windowHeight - (y + h), 0);
    });

  // Tapping Chinese plays it and shows its pinyin in a bubble just above the word. It stays
  // until you tap or scroll somewhere else, or a new message comes in.
  const [hint, setHint] = useState<(PinyinHint & { forCount: number }) | null>(null);
  const onWord: WordTap = useCallback(
    (text, at) => {
      const { x, y } = bodyOrigin.current;
      setHint({ id: Date.now(), text, x: at.x - x, top: at.top - y, bottom: at.bottom - y, forCount: messages.length });
      AccessibilityInfo.announceForAccessibility(toPinyin(text));
    },
    [messages.length]
  );
  const clearHint = () => setHint(null);
  const showHint = hint && hint.forCount === messages.length ? hint : null;

  // Press and hold a reply to flag it (App Review expects this in AI chat apps).
  const onReport = useCallback(
    (content: string) => {
      haptic.tap();
      Alert.alert("Report this reply?", "Use this if Ming said something wrong, offensive or inappropriate. The reply is sent to Ming's developer.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            const ok = await reportMessage(content);
            if (ok) Alert.alert("Thanks", "The reply was reported.");
            else Alert.alert("Couldn't send the report", "Check your connection and try again.");
          },
        },
      ]);
    },
    [reportMessage]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title={currentLesson ? currentLesson.title : "Chat with Ming"}
        subtitle={currentLesson ? currentLesson.sub : "Free conversation"}
        right={currentLesson ? <LessonPill /> : undefined}
      />
      <View style={{ height: 1, backgroundColor: t.border }} />
      <View ref={body} style={{ flex: 1 }} onLayout={measureGap}>
        <FlatList
          ref={list}
          data={data}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 16, gap: 16, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: messages.length > 0 })}
          // When the keyboard opens the list gets shorter; keep the latest message in view.
          onLayout={() => list.current?.scrollToEnd({ animated: false })}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          // Any new touch clears the pinyin bubble; tapping another word shows that one instead.
          onTouchStart={clearHint}
          onScrollBeginDrag={clearHint}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              playing={playing}
              onPlay={play}
              onWord={onWord}
              // The greeting at the top is the app's own text, not an AI reply.
              onReport={index > 0 ? onReport : undefined}
              // Only the newest exchange animates in; history appears at rest.
              animate={index > 0 && index >= data.length - 2}
            />
          )}
          ListFooterComponent={
            sending ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <TypingIndicator />
              </Animated.View>
            ) : messages.length === 0 ? (
              <Starters onPick={sendMessage} />
            ) : null
          }
        />

        <View
          onTouchStart={clearHint}
          style={{ borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, gap: 8 }}
        >
          {currentLesson && (
            <Animated.View
              entering={FadeIn.duration(250)}
              exiting={FadeOut.duration(150)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                backgroundColor: t.accentSoft,
                borderWidth: 1,
                borderColor: t.accentBorder,
                borderRadius: radius.md,
                paddingVertical: 8,
                paddingLeft: 14,
                paddingRight: 8,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: t.accent, opacity: 0.75 }}>
                  Lesson in progress
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "500", color: t.text }}>
                  {currentLesson.title}
                </Text>
              </View>
              <PressableScale
                disabled={finishing}
                accessibilityLabel="Mark lesson complete"
                onPress={async () => {
                  setFinishing(true);
                  await finishLesson();
                  setFinishing(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: t.accent,
                  opacity: finishing ? 0.6 : 1,
                }}
              >
                {finishing ? <ActivityIndicator size="small" color={t.btnText} /> : <CheckIcon color={t.btnText} size={13} />}
                <Text style={{ fontSize: 13, color: t.btnText, fontWeight: "600" }}>{finishing ? "Saving" : "Complete"}</Text>
              </PressableScale>
            </Animated.View>
          )}
          <ChatInput onSend={sendMessage} disabled={sending} usageLeft={usageLeft} />
        </View>
        <Animated.View style={lift} />
        {showHint && <PinyinBubble key={showHint.id} hint={showHint} />}
      </View>
    </SafeAreaView>
  );
}

function LessonPill() {
  const t = useMingTheme();
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accentBorder }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: t.accent }}>Lesson</Text>
    </View>
  );
}

// Empty chat: three ways in, so the first message is a tap rather than a blank box.
function Starters({ onPick }: { onPick: (text: string) => void }) {
  const t = useMingTheme();
  return (
    <View style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 12, gap: 10 }}>
      <Rise>
        <Text style={{ fontFamily: cnFont, fontSize: 46, color: t.accent, opacity: 0.18, textAlign: "center" }}>明</Text>
        <Text style={{ fontSize: 17, fontWeight: "600", color: t.text, textAlign: "center", marginTop: 6 }}>Ready when you are</Text>
        <Text style={{ fontSize: 14, color: t.textMuted, textAlign: "center", marginTop: 4, marginBottom: 8 }}>Say anything, or start with one of these.</Text>
      </Rise>
      {STARTERS.map((s: { id: string; label: string; prompt: string }, i: number) => (
        <Rise key={s.id} index={i + 1} style={{ alignSelf: "stretch" }}>
          <PressableScale
            onPress={() => {
              haptic.tap();
              onPick(s.prompt);
            }}
            accessibilityLabel={s.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: radius.md,
              paddingVertical: 13,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 15, color: t.text, fontWeight: "500" }}>{s.label}</Text>
            <ArrowUpIcon color={t.accent} size={15} />
          </PressableScale>
        </Rise>
      ))}
    </View>
  );
}

function ChatInput({ onSend, disabled, usageLeft }: { onSend: (text: string) => void; disabled: boolean; usageLeft: number | null }) {
  const t = useMingTheme();
  const { withConsent } = useStore();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onText = useCallback((text: string) => onSend(text), [onSend]);
  const onError = useCallback((message: string) => {
    haptic.warn();
    setError(message);
  }, []);
  const mic = useMingRecorder(onText, onError);

  const recording = mic.state === "recording";
  const transcribing = mic.state === "transcribing";
  const busy = disabled || transcribing || mic.state === "starting";
  const canSend = !!value.trim() && !busy && !recording;

  function submit() {
    const text = value.trim();
    if (!text || busy) return;
    setError(null);
    haptic.tap();
    onSend(text);
    setValue("");
  }

  function toggleMic() {
    setError(null);
    if (recording) {
      haptic.success();
      mic.stop();
    } else {
      haptic.tap();
      withConsent(() => mic.start());
    }
  }

  let hint: string | null = null;
  if (usageLeft !== null && usageLeft <= 5) {
    hint = usageLeft === 0 ? "You've used today's messages. They reset tomorrow." : `${usageLeft} message${usageLeft === 1 ? "" : "s"} left today`;
  }

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          backgroundColor: recording ? t.accentSoft : t.surface,
          borderWidth: 1,
          borderColor: recording ? t.accent : t.border,
          borderRadius: radius.xl,
          paddingVertical: 6,
          paddingRight: 6,
          paddingLeft: 14,
        }}
      >
        {recording ? (
          // While you speak, the text box becomes a live level meter with a timer.
          <RecordingBar recorder={mic.recorder} />
        ) : transcribing ? (
          <Animated.View entering={FadeIn.duration(180)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: 40 }}>
            <ActivityIndicator size="small" color={t.accent} />
            <Text style={{ fontSize: 15, color: t.textSecondary }}>Turning that into text</Text>
          </Animated.View>
        ) : (
          <TextInput
            value={value}
            onChangeText={setValue}
            editable={!busy}
            multiline
            accessibilityLabel="Message Ming"
            placeholder="Message Ming (pinyin is fine)"
            placeholderTextColor={t.textMuted}
            style={{ flex: 1, color: t.text, fontSize: 16, lineHeight: 21, maxHeight: 140, paddingTop: 8, paddingBottom: 8 }}
          />
        )}

        {/* The mic gives way to Send once there's text, like a single smart button. */}
        {canSend ? (
          <Animated.View key="send" entering={ZoomIn.duration(160)} exiting={ZoomOut.duration(120)}>
            <RoundButton onPress={submit} label="Send message" bg={t.accent}>
              <ArrowUpIcon color={t.btnText} />
            </RoundButton>
          </Animated.View>
        ) : (
          <Animated.View key="mic" entering={ZoomIn.duration(160)} exiting={ZoomOut.duration(120)} style={{ alignItems: "center", justifyContent: "center" }}>
            <PulseRing active={recording} color={t.accent} size={40} />
            <RoundButton
              onPress={toggleMic}
              disabled={busy}
              label={recording ? "Stop recording and send" : "Record a voice message"}
              bg={recording ? t.accent : "transparent"}
              border={recording ? t.accent : t.border}
            >
              {recording ? <StopIcon color={t.btnText} /> : <MicIcon color={t.textSecondary} />}
            </RoundButton>
          </Animated.View>
        )}
      </View>
      {error || hint ? (
        <Animated.Text
          entering={FadeIn.duration(180)}
          accessibilityRole={error ? "alert" : undefined}
          style={{ fontSize: 12, color: error ? t.danger : t.textMuted, textAlign: "center" }}
        >
          {error || hint}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const BARS = 26;
const SILENCE_DB = -50;

// Live microphone level as a row of bars that scroll right to left, plus elapsed time.
function RecordingBar({ recorder }: { recorder: AudioRecorder }) {
  const t = useMingTheme();
  const status = useAudioRecorderState(recorder, 90);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));

  const db = status.metering ?? SILENCE_DB;
  const tick = status.durationMillis;
  useEffect(() => {
    const level = Math.min(Math.max((db - SILENCE_DB) / -SILENCE_DB, 0), 1);
    // Each recorder update adds one bar; this is the meter's whole job.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevels((prev) => [...prev.slice(1), level]);
  }, [db, tick]);

  const seconds = Math.floor(tick / 1000);
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      accessibilityLabel={`Recording, ${seconds} seconds. Tap stop to send.`}
      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: 40 }}
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color: t.accent, fontVariant: ["tabular-nums"], minWidth: 34 }}>
        0:{String(seconds).padStart(2, "0")}
      </Text>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 3, height: 28, overflow: "hidden" }}>
        {levels.map((l, i) => (
          <View key={i} style={{ flex: 1, maxWidth: 4, height: 3 + l * 25, borderRadius: 2, backgroundColor: t.accent, opacity: 0.35 + 0.65 * (i / BARS) }} />
        ))}
      </View>
      <Text style={{ fontSize: 12, color: t.textMuted }}>Tap to send</Text>
    </Animated.View>
  );
}

function RoundButton({
  children,
  onPress,
  disabled,
  label,
  bg,
  border,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  label: string;
  bg: string;
  border?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={4}
      scaleTo={0.9}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </PressableScale>
  );
}
