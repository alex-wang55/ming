import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useMingTheme } from "@/lib/theme";

const WEB_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ming-wine.vercel.app";

// Email + password, same as the web app. Confirmation and reset emails keep linking
// to the website, which is fine: once confirmed, signing in here just works.
export default function SignIn() {
  const t = useMingTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: WEB_URL } });
    setBusy(false);
    if (error) Alert.alert("Couldn't sign in", error.message);
    else if (mode === "signup") Alert.alert("Check your email", "Confirm your address, then sign in here.");
  }

  const input = {
    color: t.text,
    backgroundColor: t.surface,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 40, color: t.accent }}>明</Text>
        <Text style={{ fontSize: 28, fontWeight: "700", color: t.text }}>
          {mode === "signin" ? "Welcome back" : "Start learning"}
        </Text>
        <TextInput style={input} placeholder="Email" placeholderTextColor={t.textMuted} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} />
        <TextInput style={input} placeholder="Password" placeholderTextColor={t.textMuted} secureTextEntry textContentType={mode === "signin" ? "password" : "newPassword"} value={password} onChangeText={setPassword} />
        <Pressable onPress={submit} disabled={busy} style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}>
          {busy ? <ActivityIndicator color={t.btnText} /> : <Text style={{ color: t.btnText, fontSize: 17, fontWeight: "600" }}>{mode === "signin" ? "Sign in" : "Create account"}</Text>}
        </Pressable>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
            <Text style={{ color: t.textSecondary }}>{mode === "signin" ? "New here? Make an account" : "Have an account? Sign in"}</Text>
          </Pressable>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(WEB_URL)}>
            <Text style={{ color: t.textSecondary }}>Forgot password?</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
