import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { PrimaryButton } from "@/components/ui";
import { SessionProvider, useSession } from "@/lib/session";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { StoreProvider } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { cnFont, useMingTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

// Same gates as the web app's page.js: signed out → sign in, no goal yet → goal setup,
// otherwise the tabs. Consent and review open as sheets over the tabs.
function RootStack() {
  const t = useMingTheme();
  const { ready } = useSettings();
  const { session, profile, profileError, loading, refreshProfile } = useSession();

  const booting = loading || !ready;
  useEffect(() => {
    if (!booting) SplashScreen.hideAsync();
  }, [booting]);

  const navTheme = {
    ...(t.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.dark ? DarkTheme : DefaultTheme).colors,
      primary: t.accent,
      background: t.bg,
      card: t.bg,
      text: t.text,
      border: t.border,
    },
  };

  if (booting) return null;

  // Signed in but the profile hasn't loaded (or failed): never fall through to onboarding.
  if (session && !profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: t.bg }}>
        <StatusBar style={t.dark ? "light" : "dark"} />
        <Text style={{ fontFamily: cnFont, fontSize: 40, color: t.accent }}>明</Text>
        {profileError ? (
          <>
            <Text style={{ fontSize: 16, color: t.textSecondary, textAlign: "center" }}>{"Couldn't load your account. Check your connection."}</Text>
            <PrimaryButton onPress={refreshProfile} style={{ alignSelf: "stretch" }}>
              Try again
            </PrimaryButton>
            <Text onPress={() => supabase.auth.signOut()} style={{ fontSize: 14, color: t.textMuted, textDecorationLine: "underline" }}>
              Sign out
            </Text>
          </>
        ) : (
          <ActivityIndicator color={t.accent} />
        )}
      </View>
    );
  }

  const needsGoal = !!profile && !profile.goal_text && !profile.onboarding_skipped;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && needsGoal}>
          <Stack.Screen name="goal-setup" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && !needsGoal}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="review" options={{ presentation: "modal" }} />
          <Stack.Screen name="consent" options={{ presentation: "modal" }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    // KeyboardProvider tracks the keyboard frame by frame, so Chat can keep its box above it.
    <KeyboardProvider>
      <SettingsProvider>
        <SessionProvider>
          <StoreProvider>
            <RootStack />
          </StoreProvider>
        </SessionProvider>
      </SettingsProvider>
    </KeyboardProvider>
  );
}
