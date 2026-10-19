import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
// The tab-aware SafeAreaView knows how tall the iOS tab bar is, so the input sits above it.
import { SafeAreaView } from "react-native-screens/experimental";
import { ArrowUpIcon, MicIcon, StopIcon } from "@/components/icons";
import { MessageBubble, TypingIndicator } from "@/components/Message";
import { ScreenHeader } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useSession, type Profile } from "@/lib/session";
import { useSpeak, useStore, type Msg } from "@/lib/store";
import { cnFont, radius, useMingTheme } from "@/lib/theme";
import { useMingRecorder } from "@/lib/voice";

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
  const { messages, sending, usageLeft, currentLesson, sendMessage, finishLesson } = useStore();
  const [playing, play] = useSpeak();
  const list = useRef<FlatList<Msg>>(null);
  const [finishing, setFinishing] = useState(false);

  const welcome = useMemo(() => welcomeFor(profile), [profile]);
  const data = useMemo(() => [welcome, ...messages], [welcome, messages]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={{ top: true, bottom: true }}>
      <ScreenHeader
        title={currentLesson ? currentLesson.title : "Chat with Ming"}
        subtitle={currentLesson ? currentLesson.sub : "Free conversation"}
      />
      <View style={{ height: 1, backgroundColor: t.border }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={list}
          data={data}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 16, gap: 16, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: messages.length > 0 })}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <MessageBubble message={item} playing={playing} onPlay={play} />}
          ListFooterComponent={
            sending ? (
              <TypingIndicator />
            ) : messages.length === 0 ? (
              // Same empty state as the web app's chat.
              <View style={{ alignItems: "center", paddingTop: 56, paddingHorizontal: 32 }}>
                <Text style={{ fontFamily: cnFont, fontSize: 46, color: t.accent, opacity: 0.15, marginBottom: 10 }}>明</Text>
                <Text style={{ fontSize: 16, fontWeight: "500", color: t.textMuted, marginBottom: 6 }}>Ready when you are</Text>
                <Text style={{ fontSize: 13.5, color: t.textMuted, textAlign: "center" }}>Pick a lesson from the Learn tab, or just start talking.</Text>
              </View>
            ) : null
          }
        />

        <View style={{ borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, gap: 8 }}>
          {currentLesson && (
            <View
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
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: t.accent }}>
                Lesson · {currentLesson.title}
              </Text>
              <Pressable
                disabled={finishing}
                onPress={async () => {
                  setFinishing(true);
                  await finishLesson();
                  setFinishing(false);
                }}
                style={({ pressed }) => ({
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 7,
                  backgroundColor: t.surface,
                  borderWidth: 1,
                  borderColor: t.accentBorder,
                  opacity: pressed || finishing ? 0.6 : 1,
                })}
              >
                <Text style={{ fontSize: 13, color: t.accent, fontWeight: "500" }}>{finishing ? "Saving..." : "Mark complete"}</Text>
              </Pressable>
            </View>
          )}
          <ChatInput onSend={sendMessage} disabled={sending} usageLeft={usageLeft} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  const busy = disabled || mic.state === "transcribing" || mic.state === "starting";
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
    haptic.tap();
    if (recording) mic.stop();
    else withConsent(() => mic.start());
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
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: recording ? t.danger : t.border,
          borderRadius: radius.lg,
          paddingVertical: 6,
          paddingRight: 6,
          paddingLeft: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          editable={!busy && !recording}
          multiline
          accessibilityLabel="Message Ming"
          placeholder={mic.state === "transcribing" ? "Transcribing your audio..." : recording ? "Listening... tap stop to send" : "Message Ming"}
          placeholderTextColor={t.textMuted}
          style={{ flex: 1, color: t.text, fontSize: 16, lineHeight: 21, maxHeight: 140, paddingTop: 8, paddingBottom: 8 }}
        />
        <IconButton
          onPress={toggleMic}
          disabled={busy}
          label={recording ? "Stop recording and send" : "Record a voice message"}
          bg={recording ? `${t.danger}1a` : "transparent"}
          border={recording ? t.danger : t.border}
        >
          {recording ? <StopIcon color={t.danger} /> : <MicIcon color={t.textMuted} />}
        </IconButton>
        <IconButton onPress={submit} disabled={!canSend} label="Send message" bg={canSend ? t.accent : "transparent"} border={canSend ? t.accent : t.border}>
          <ArrowUpIcon color={canSend ? t.btnText : t.textFaint} />
        </IconButton>
      </View>
      {error || hint ? (
        <Text accessibilityRole={error ? "alert" : undefined} style={{ fontSize: 12, color: error ? t.danger : t.textMuted, textAlign: "center" }}>
          {error || hint}
        </Text>
      ) : null}
    </View>
  );
}

function IconButton({
  children,
  onPress,
  disabled,
  label,
  bg,
  border,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled: boolean;
  label: string;
  bg: string;
  border: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
