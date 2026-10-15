import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useMingTheme } from "@/lib/theme";

export default function Settings() {
  const t = useMingTheme();
  const { session, profile, refreshProfile } = useSession();

  async function setAiSharing(on: boolean) {
    if (on) {
      router.push("/consent");
      return;
    }
    if (!session) return;
    await supabase.from("profiles").update({ ai_consent_at: null }).eq("id", session.user.id);
    await refreshProfile();
  }

  // Apple requires a way to delete the account from inside the app (5.1.1(v)).
  function deleteAccount() {
    Alert.alert("Delete your account?", "This erases your words, lessons, streak and chat history. It can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch("/api/account", { method: "DELETE" });
          if (!res.ok) {
            Alert.alert("Couldn't delete your account", "Try again in a moment.");
            return;
          }
          // The user no longer exists server-side, so only clear the local session.
          await supabase.auth.signOut({ scope: "local" });
        },
      },
    ]);
  }

  const row = { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingVertical: 14, borderBottomWidth: 1, borderColor: t.border };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: t.text, marginBottom: 12 }}>Settings</Text>
        {/* TODO: theme, autoplay, pinyin and pace from the web SettingsTab, stored in AsyncStorage */}
        <View style={row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 16, color: t.text }}>Share with AI services</Text>
            <Text style={{ fontSize: 13, color: t.textMuted }}>Needed for chat, voice and audio</Text>
          </View>
          <Switch value={!!profile?.ai_consent_at} onValueChange={setAiSharing} />
        </View>
        <Pressable style={row} onPress={() => supabase.auth.signOut()}>
          <Text style={{ fontSize: 16, color: t.text }}>Sign out</Text>
        </Pressable>
        <Pressable style={row} onPress={deleteAccount}>
          <Text style={{ fontSize: 16, color: t.danger }}>Delete account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
