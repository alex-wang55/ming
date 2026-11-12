import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Rise } from "@/components/motion";
import { PrimaryButton } from "@/components/ui";
import { WEB_URL } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useMingTheme } from "@/lib/theme";

// App Review 5.1.2(i): name every AI provider, say what goes to each, and get a yes
// before the first request. The names come from /api/providers, which reads the keys the
// server actually has, so this screen can't drift from what the server does. The fallback
// is used only if that request fails, and matches the production setup.
type Providers = { chat: string | null; voice: string; audio: string };
const FALLBACK: Providers = { chat: "Anthropic (Claude)", voice: "OpenAI (Whisper)", audio: "Google Cloud Text-to-Speech" };

function sharing(p: Providers) {
  return [
    {
      who: p.chat ?? FALLBACK.chat!,
      what: "Your chat messages, your learning goal and deadline, and the words you're reviewing, so Ming can reply.",
    },
    { who: p.voice, what: "Your voice recordings when you tap the mic, to turn speech into text. Ming doesn't keep the recordings." },
    { who: p.audio, what: "Chinese text you tap to hear read out loud." },
  ];
}

export default function Consent() {
  const t = useMingTheme();
  const { session, updateProfile } = useSession();
  const { runPendingConsent, dropPendingConsent } = useStore();
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<Providers>(FALLBACK);
  const agreed = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch(`${WEB_URL}/api/providers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Partial<Providers> | null) => {
        if (alive && p && typeof p.voice === "string" && typeof p.audio === "string") {
          setProviders({ chat: typeof p.chat === "string" ? p.chat : null, voice: p.voice, audio: p.audio });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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
        <Rise>
          <Text style={{ fontSize: 26, fontWeight: "700", color: t.text }}>Before you chat with Ming</Text>
          <Text style={{ fontSize: 16, lineHeight: 23, color: t.textSecondary, marginTop: 10 }}>
            {"Ming uses outside AI services to reply, understand your voice, and pronounce Chinese. Here's exactly what gets sent and to whom."}
          </Text>
        </Rise>
        {sharing(providers).map((s, i) => (
          <Rise key={s.who} index={i + 1}>
            <View style={{ gap: 4, paddingVertical: 12, borderTopWidth: 1, borderColor: t.border }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: t.text }}>{s.who}</Text>
              <Text style={{ fontSize: 15, lineHeight: 21, color: t.textSecondary }}>{s.what}</Text>
            </View>
          </Rise>
        ))}
        <Text style={{ fontSize: 14, lineHeight: 20, color: t.textMuted }}>
          Your word list, reviews and progress still work without this. You can turn it off any time in Settings.
        </Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} hitSlop={8} accessibilityRole="link">
          <Text style={{ fontSize: 14, color: t.accent, textDecorationLine: "underline" }}>Read the privacy policy</Text>
        </Pressable>
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
