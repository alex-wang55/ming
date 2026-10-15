import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useMingTheme } from "@/lib/theme";

// App Review 5.1.2(i): name every AI provider, say what goes to each, and get a yes
// before the first request. CHAT_PROVIDER should match whichever key is set on Vercel.
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
  const { session, refreshProfile } = useSession();
  const [saving, setSaving] = useState(false);

  async function agree() {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ai_consent_at: new Date().toISOString() })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Couldn't save that", "Check your connection and try again.");
      return;
    }
    await refreshProfile();
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: t.text }}>Before you chat with Ming</Text>
        <Text style={{ fontSize: 16, lineHeight: 23, color: t.textSecondary }}>
          Ming uses outside AI services to reply, understand your voice, and pronounce Chinese. Here's exactly what gets
          sent and to whom.
        </Text>
        {SHARING.map((s) => (
          <View key={s.who} style={{ gap: 4, paddingVertical: 12, borderTopWidth: 1, borderColor: t.border }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: t.text }}>{s.who}</Text>
            <Text style={{ fontSize: 15, lineHeight: 21, color: t.textSecondary }}>{s.what}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 14, lineHeight: 20, color: t.textMuted }}>
          Lessons, your word list and reviews still work without this. You can turn it off any time in Settings.
        </Text>
      </ScrollView>
      <View style={{ padding: 24, gap: 8 }}>
        <Pressable
          onPress={agree}
          disabled={saving}
          style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
        >
          {saving ? (
            <ActivityIndicator color={t.btnText} />
          ) : (
            <Text style={{ color: t.btnText, fontSize: 17, fontWeight: "600" }}>Agree and continue</Text>
          )}
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: t.textSecondary, fontSize: 16 }}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
