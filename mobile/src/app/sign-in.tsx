import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/ui";
import { WEB_URL } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { cnFont, radius, serifFont, useMingTheme } from "@/lib/theme";

type Mode = "login" | "signup" | "forgot";

const COPY: Record<Mode, string> = {
  login: "Sign in to Ming",
  signup: "Start learning free",
  forgot: "Send reset link",
};

const PERKS = [
  "Goal-aware lessons built around your timeline",
  "Real conversations, not flashcard drills",
  "Pronunciation audio for every word",
  "Same account on your phone and the web",
];

// Port of the web Auth screen. Email links (confirm, reset password) open the website,
// and once that's done, signing in here just works.
export default function SignIn() {
  const t = useMingTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    let failure: string | null = null;
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: WEB_URL } });
      failure = error?.message ?? null;
      if (!error) setSuccess("Check your email to confirm your account, then sign in here.");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: WEB_URL });
      failure = error?.message ?? null;
      if (!error) setSuccess("If that email has an account, a reset link is on its way. It opens Ming's website.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      failure = error?.message ?? null;
    }
    if (failure) setError(failure);
    setBusy(false);
  }

  const input = {
    color: t.text,
    backgroundColor: t.bg,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.dark ? t.bg : "#f5ede0" }}>
      <Text pointerEvents="none" style={{ position: "absolute", left: -20, bottom: "10%", fontFamily: cnFont, fontSize: 120, color: t.accent, opacity: 0.05, fontWeight: "700" }}>
        学
      </Text>
      <Text pointerEvents="none" style={{ position: "absolute", right: -20, top: "8%", fontFamily: cnFont, fontSize: 120, color: t.accent, opacity: 0.05, fontWeight: "700" }}>
        语
      </Text>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 20, padding: 24, gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  backgroundColor: t.accentSoft,
                  borderWidth: 1,
                  borderColor: t.accentBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 29, fontFamily: cnFont, color: t.accent }}>明</Text>
              </View>
              <View>
                <Text style={{ fontSize: 26, fontWeight: "600", color: t.text, fontFamily: serifFont }}>Ming</Text>
                <Text style={{ fontSize: 14, color: t.accent, opacity: 0.85 }}>Your Mandarin coach</Text>
              </View>
            </View>

            {mode !== "forgot" ? (
              <>
                <View style={{ gap: 8 }}>
                  {PERKS.map((p) => (
                    <View key={p} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <Text style={{ color: t.accent, fontSize: 11, marginTop: 4 }}>✦</Text>
                      <Text style={{ flex: 1, fontSize: 14, color: t.textSecondary, lineHeight: 20 }}>{p}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ height: 1, backgroundColor: t.border, marginVertical: 2 }} />
                <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 6, backgroundColor: t.bg, padding: 4, borderRadius: radius.md }}>
                  {(["login", "signup"] as const).map((m) => (
                    <Pressable
                      key={m}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: mode === m }}
                      onPress={() => switchMode(m)}
                      style={{ flex: 1, paddingVertical: 9, borderRadius: 7, alignItems: "center", backgroundColor: mode === m ? t.surface : "transparent" }}
                    >
                      <Text style={{ fontSize: 14, color: mode === m ? t.text : t.textMuted, fontWeight: mode === m ? "500" : "400" }}>
                        {m === "login" ? "Sign in" : "Create account"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View>
                <Text style={{ fontSize: 18, fontWeight: "600", color: t.text, marginBottom: 4 }}>Reset your password</Text>
                <Text style={{ fontSize: 14, color: t.textMuted, lineHeight: 20 }}>
                  {"Enter your email and we'll send you a link to set a new password."}
                </Text>
              </View>
            )}

            <TextInput
              style={input}
              placeholder="Email address"
              placeholderTextColor={t.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              accessibilityLabel="Email address"
              value={email}
              onChangeText={setEmail}
            />
            {mode !== "forgot" && (
              <TextInput
                style={input}
                placeholder={mode === "login" ? "Password" : "New password (8+ characters)"}
                placeholderTextColor={t.textMuted}
                secureTextEntry
                textContentType={mode === "login" ? "password" : "newPassword"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            )}

            {error ? (
              <Text accessibilityRole="alert" style={{ fontSize: 14, color: t.danger }}>
                {error}
              </Text>
            ) : null}
            {success ? <Text style={{ fontSize: 14, color: t.success }}>{success}</Text> : null}

            <PrimaryButton onPress={submit} busy={busy} style={{ marginTop: 4 }}>
              {COPY[mode]}
            </PrimaryButton>

            {mode === "login" && (
              <Pressable onPress={() => switchMode("forgot")} hitSlop={8} style={{ alignItems: "center" }}>
                <Text style={{ color: t.textMuted, fontSize: 14, textDecorationLine: "underline" }}>Forgot your password?</Text>
              </Pressable>
            )}
            {mode === "forgot" && (
              <Pressable onPress={() => switchMode("login")} hitSlop={8} style={{ alignItems: "center" }}>
                <Text style={{ color: t.textMuted, fontSize: 14, textDecorationLine: "underline" }}>Back to sign in</Text>
              </Pressable>
            )}
            {mode === "signup" && (
              <Text style={{ fontSize: 12, color: t.textMuted, textAlign: "center" }}>By continuing you agree to our terms and privacy policy.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
