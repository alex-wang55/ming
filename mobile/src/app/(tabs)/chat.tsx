import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { postJSON } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useMingTheme } from "@/lib/theme";
import { speak, useMingRecorder } from "@/lib/voice";
import { parseToneTags, stripTags } from "@/shared/tags";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
const NETWORK_ERROR = "Couldn't reach Ming. Check your connection and try again.";

export default function Chat() {
  const t = useMingTheme();
  const { profile } = useSession();
  const consented = !!profile?.ai_consent_at;
  const mic = useMingRecorder();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [usageLeft, setUsageLeft] = useState<number | null>(null);
  const list = useRef<FlatList<Msg>>(null);

  // Same request and response shape as sendMessage in the web app's page.js.
  async function send(raw: string) {
    const content = raw.trim();
    if (!content || sending) return;
    if (!consented) {
      router.push("/consent");
      return;
    }
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages(history);
    setText("");
    setSending(true);
    try {
      const res = await postJSON("/api/chat", {
        messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
        preferences: { pinyin: "always", pace: "adaptive" }, // read from settings once that's ported
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data.remaining === "number") setUsageLeft(data.remaining);
      if (!res.ok || !data.reply) {
        setMessages([...history, { role: "assistant", content: data.error ?? NETWORK_ERROR, error: true }]);
        return;
      }
      setMessages([...history, { role: "assistant", content: data.reply }]);
      // TODO: port saveConversation() and recordActivity() from page.js. They're plain
      // Supabase calls and work unchanged here.
      const [first] = parseToneTags(data.reply);
      if (first) speak(first.hanzi).catch(() => {});
    } catch {
      setMessages([...history, { role: "assistant", content: NETWORK_ERROR, error: true }]);
    } finally {
      setSending(false);
    }
  }

  async function onMic() {
    if (!consented) {
      router.push("/consent");
      return;
    }
    try {
      if (mic.state === "recording") {
        const heard = await mic.stopAndTranscribe();
        if (heard) send(heard);
      } else if (mic.state === "idle") {
        await mic.start();
      }
    } catch (e) {
      Alert.alert("Microphone", e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const busy = sending || mic.state === "transcribing";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                backgroundColor: item.role === "user" ? t.accent : t.surface,
                borderColor: t.border,
                borderWidth: item.role === "user" ? 0 : 1,
                borderRadius: 16,
                padding: 12,
              }}
            >
              <Text style={{ color: item.role === "user" ? t.btnText : item.error ? t.danger : t.text, fontSize: 16, lineHeight: 23 }}>
                {stripTags(item.content)}
              </Text>
            </View>
          )}
        />
        {usageLeft !== null && usageLeft <= 5 ? (
          <Text style={{ textAlign: "center", color: t.textMuted, fontSize: 13 }}>
            {usageLeft === 0 ? "You've used today's messages. They reset tomorrow." : `${usageLeft} left today`}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={mic.state === "recording" ? "Listening..." : "Message Ming"}
            placeholderTextColor={t.textMuted}
            editable={!busy && mic.state !== "recording"}
            multiline
            style={{
              flex: 1,
              color: t.text,
              backgroundColor: t.surface,
              borderColor: mic.state === "recording" ? t.danger : t.border,
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 16,
              maxHeight: 120,
            }}
          />
          <Pressable onPress={onMic} disabled={busy} style={{ padding: 10 }}>
            <SymbolView name={mic.state === "recording" ? "stop.circle.fill" : "mic.fill"} tintColor={mic.state === "recording" ? t.danger : t.accent} size={24} />
          </Pressable>
          <Pressable onPress={() => send(text)} disabled={busy || !text.trim()} style={{ padding: 10 }}>
            {busy ? <ActivityIndicator color={t.accent} /> : <Text style={{ color: t.accent, fontWeight: "600", fontSize: 16 }}>Send</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
