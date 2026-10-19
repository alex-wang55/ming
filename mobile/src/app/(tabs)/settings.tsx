import Constants from "expo-constants";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateField } from "@/components/DateField";
import { ScreenHeader, Segmented } from "@/components/ui";
import { apiFetch, WEB_URL } from "@/lib/api";
import { haptic } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { useSettings, type Settings } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { radius, useMingTheme } from "@/lib/theme";
import { localDateKey } from "@/shared/dates";

// Port of the web SettingsTab, plus what the App Store needs: the AI sharing switch
// and account deletion.
export default function SettingsScreen() {
  const t = useMingTheme();
  const insets = useSafeAreaInsets();
  const { session, profile, updateProfile } = useSession();
  const { settings, update } = useSettings();
  const email = session?.user.email ?? "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      // Clear the status bar on top and the tab bar below (iOS).
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: Platform.OS === "android" ? insets.top : 0, paddingBottom: 40 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title="Settings" subtitle="Manage your preferences" />
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <Group label="Appearance">
          <Stacked title="Theme" sub="Match your phone, or pick one">
            <Segmented<Settings["theme"]>
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              options={[
                { id: "system", label: "System" },
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
              ]}
            />
          </Stacked>
        </Group>

        <Group label="Your goal">
          <GoalEditor
            userId={session?.user.id}
            goalText={profile?.goal_text ?? ""}
            deadline={profile?.deadline_date ?? ""}
            onSaved={updateProfile}
          />
        </Group>

        <Group label="Learning">
          <Row title="Autoplay pronunciation" sub="Play the first new word when Ming introduces it">
            <Toggle value={settings.autoplay} onChange={(autoplay) => update({ autoplay })} label="Autoplay pronunciation" />
          </Row>
          <Divider />
          <Stacked title="Pinyin" sub="When Ming writes pronunciation guides">
            <Segmented<Settings["pinyin"]>
              value={settings.pinyin}
              onChange={(pinyin) => update({ pinyin })}
              options={[
                { id: "always", label: "Always" },
                { id: "new", label: "New words" },
                { id: "never", label: "Hidden" },
              ]}
            />
          </Stacked>
          <Divider />
          <Stacked title="Pace" sub="How fast new material is introduced">
            <Segmented<Settings["pace"]>
              value={settings.pace}
              onChange={(pace) => update({ pace })}
              options={[
                { id: "slow", label: "Slow" },
                { id: "adaptive", label: "Adaptive" },
                { id: "fast", label: "Fast" },
              ]}
            />
          </Stacked>
        </Group>

        <Group label="Privacy">
          <Row title="Share with AI services" sub="Needed for chat, voice and audio. See exactly what's shared before you turn it on.">
            <Toggle
              label="Share with AI services"
              value={!!profile?.ai_consent_at}
              onChange={async (on) => {
                if (on) {
                  router.push("/consent");
                  return;
                }
                if (!session) return;
                const { error } = await supabase.from("profiles").update({ ai_consent_at: null }).eq("id", session.user.id);
                if (error) Alert.alert("Couldn't save that", "Check your connection and try again.");
                else updateProfile({ ai_consent_at: null });
              }}
            />
          </Row>
        </Group>

        <Group label="Account">
          <Row title="Signed in" sub={email} />
          <Divider />
          <ActionRow
            title="Change password"
            onPress={async () => {
              if (!email) return;
              const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: WEB_URL });
              if (error) Alert.alert("Couldn't send the email", error.message);
              else Alert.alert("Check your email", `We sent a link to ${email}. It opens Ming's website, where you can pick a new password.`);
            }}
          />
          <Divider />
          <ActionRow title="Sign out" color={t.danger} onPress={() => supabase.auth.signOut()} />
          <Divider />
          <ActionRow title="Delete account" color={t.danger} onPress={() => confirmDelete()} />
        </Group>

        <Text style={{ fontSize: 12, color: t.textMuted, textAlign: "center" }}>
          Settings save automatically · Ming v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </View>
    </ScrollView>
  );
}

// Apple requires a way to delete the account from inside the app (5.1.1(v)).
function confirmDelete() {
  Alert.alert("Delete your account?", "This erases your words, lessons, streak and chat history. It can't be undone.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        const res = await apiFetch("/api/account", { method: "DELETE" }).catch(() => null);
        if (!res?.ok) {
          Alert.alert("Couldn't delete your account", "Try again in a moment.");
          return;
        }
        haptic.success();
        // The user no longer exists server-side, so only clear the local session.
        await supabase.auth.signOut({ scope: "local" });
      },
    },
  ]);
}

function GoalEditor({
  userId,
  goalText,
  deadline,
  onSaved,
}: {
  userId?: string;
  goalText: string;
  deadline: string;
  onSaved: (patch: { goal_text: string | null; deadline_date: string | null }) => void;
}) {
  const t = useMingTheme();
  // Unsaved edits. null means "show what's saved", so changes made elsewhere show up.
  const [draftGoal, setDraftGoal] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const goal = draftGoal ?? goalText;
  const date = draftDate ?? deadline;
  const setGoal = setDraftGoal;
  const setDate = setDraftDate;

  const changed = goal.trim() !== goalText || date !== deadline;

  async function save() {
    if (!userId) return;
    setState("saving");
    const patch = { goal_text: goal.trim() || null, deadline_date: date || null };
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("id");
    if (error || !data?.length) {
      setState("error");
      return;
    }
    haptic.success();
    onSaved(patch);
    setDraftGoal(null);
    setDraftDate(null);
    setState("saved");
    setTimeout(() => setState("idle"), 1800);
  }

  const in30 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return localDateKey(d);
  };

  return (
    <View style={{ paddingVertical: 14, gap: 12 }}>
      <TextInput
        value={goal}
        onChangeText={setGoal}
        placeholder="What are you learning Mandarin for?"
        placeholderTextColor={t.textMuted}
        accessibilityLabel="Your Mandarin goal"
        multiline
        maxLength={300}
        style={{
          minHeight: 64,
          backgroundColor: t.bg,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 10,
          fontSize: 15,
          color: t.text,
          textAlignVertical: "top",
        }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Text style={{ fontSize: 14, color: t.textSecondary }}>Deadline</Text>
        {date ? (
          <>
            <DateField value={date} onChange={setDate} />
            <Pressable onPress={() => setDate("")} hitSlop={8}>
              <Text style={{ fontSize: 14, color: t.textMuted }}>Clear</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => setDate(in30())} hitSlop={8}>
            <Text style={{ fontSize: 14, color: t.accent, fontWeight: "500" }}>Add a deadline</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={save}
        disabled={!changed || state === "saving"}
        style={{
          paddingVertical: 11,
          borderRadius: radius.md,
          alignItems: "center",
          backgroundColor: state === "saved" ? t.successSoft : t.accentSoft,
          borderWidth: 1,
          borderColor: state === "saved" ? t.successBorder : t.accentBorder,
          opacity: !changed && state === "idle" ? 0.5 : 1,
        }}
      >
        {state === "saving" ? (
          <ActivityIndicator color={t.accent} />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: "600", color: state === "saved" ? t.success : t.accent }}>
            {state === "saved" ? "Saved" : "Update goal"}
          </Text>
        )}
      </Pressable>
      {state === "error" ? (
        <Text accessibilityRole="alert" style={{ fontSize: 13, color: t.danger }}>
          {"Couldn't save your goal. Try again in a moment."}
        </Text>
      ) : null}
    </View>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  const t = useMingTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: t.textMuted, marginBottom: 8, paddingLeft: 2 }}>
        {label}
      </Text>
      <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, paddingHorizontal: 16 }}>{children}</View>
    </View>
  );
}

function Row({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  const t = useMingTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingVertical: 14 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: t.text, marginBottom: sub ? 2 : 0 }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 13, color: t.textMuted, lineHeight: 18 }}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Stacked({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const t = useMingTheme();
  return (
    <View style={{ paddingVertical: 14, gap: 10 }}>
      <View>
        <Text style={{ fontSize: 15, fontWeight: "500", color: t.text, marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontSize: 13, color: t.textMuted }}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

function ActionRow({ title, onPress, color }: { title: string; onPress: () => void; color?: string }) {
  const t = useMingTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ paddingVertical: 14, opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ fontSize: 15, fontWeight: "500", color: color ?? t.accent }}>{title}</Text>
    </Pressable>
  );
}

function Divider() {
  const t = useMingTheme();
  return <View style={{ height: 1, backgroundColor: t.border }} />;
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useMingTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ true: t.accent, false: t.borderStrong }}
      ios_backgroundColor={t.borderStrong}
    />
  );
}
