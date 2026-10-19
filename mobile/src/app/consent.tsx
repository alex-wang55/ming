import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useMingTheme } from "@/lib/theme";

// App Review 5.1.2(i): name every AI provider, say what goes to each, and get a yes
// before the first request. CHAT_PROVIDER matches the key set on Vercel (Anthropic).
const CHAT_PROVIDER = "Anthropic (Claude)";
const SHARING = [
  {
    who: CHAT_PROVIDER,
    what: "Your chat messages, your learning goal and deadline, and the words you're reviewing, so Ming can reply.",
  },
  { who: "OpenAI (Whisper)", what: "Your voice recordings when you tap the mic, to turn speech into text." },
  { who: "Google Cloud Text-to-Speech", what: "Chinese text you tap to hear read out loud." },
];

export default function Consent() {
  const t = useMingTheme();
  const { session, updateProfile } = useSession();
  const { runPendingConsent, dropPendingConsent } = useStore();
  const [saving, setSaving] = useState(false);
  const agreed = useRef(false);

  // Swiping the sheet away counts as "Not now": forget whatever was waiting on consent.
  useEffect(() => () => {
    if (!agreed.current) dropPendingConsent();
  }, [dropPendingConsent]);

  async function agree() {
    if (!session) return;
    setSaving(true);
    const at = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ ai_consent_at: at }).eq("id", session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Couldn't save that", "Check your connection and try again.");
      return;
    }
    agreed.current = true;
    updateProfile({ ai_consent_at: at });
    router.back();
    // Whatever needed consent (a message, a lesson, the mic, audio) goes ahead now.
    setTimeout(runPendingConsent, 300);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, gap: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: t.text }}>Before you chat with Ming</Text>
        <Text style={{ fontSize: 16, lineHeight: 23, color: t.textSecondary }}>
          {"Ming uses outside AI services to reply, understand your voice, and pronounce Chinese. Here's exactly what gets sent and to whom."}
        </Text>
        {SHARING.map((s) => (
          <View key={s.who} style={{ gap: 4, paddingVertical: 12, borderTopWidth: 1, borderColor: t.border }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: t.text }}>{s.who}</Text>
            <Text style={{ fontSize: 15, lineHeight: 21, color: t.textSecondary }}>{s.what}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 14, lineHeight: 20, color: t.textMuted }}>
          Your word list, reviews and progress still work without this. You can turn it off any time in Settings.
        </Text>
      </ScrollView>
      <View style={{ padding: 24, gap: 8 }}>
        <PrimaryButton onPress={agree} busy={saving}>
          Agree and continue
        </PrimaryButton>
        <Pressable
          onPress={() => {
            dropPendingConsent();
            router.back();
          }}
          style={{ paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ color: t.textSecondary, fontSize: 16 }}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
