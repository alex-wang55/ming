import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DateField } from "@/components/DateField";
import { PrimaryButton } from "@/components/ui";
import { useSession, type Profile } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { cnFont, radius, useMingTheme } from "@/lib/theme";
import { localDateKey } from "@/shared/dates";

// Port of the web GoalSetup: shown once after signing up, until a goal is set or skipped.
export default function GoalSetup() {
  const t = useMingTheme();
  const { session, updateProfile } = useSession();
  const [goal, setGoal] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return localDateKey(d);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(patch: Partial<Profile>) {
    if (!session) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", session.user.id).select("id");
    setSaving(false);
    if (error) {
      setError("Couldn't save that. Check your connection and try again.");
      return;
    }
    // No rows back means the database refused the update (missing RLS policy, see
    // supabase/migrations). Let the user in anyway rather than trapping them here.
    if (!data?.length) console.warn("Profile update affected no rows");
    updateProfile(patch);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.lg, padding: 24, gap: 16 }}>
            <View>
              <Text style={{ fontFamily: cnFont, fontSize: 30, color: t.accent }}>明</Text>
              <Text style={{ fontSize: 20, fontWeight: "600", color: t.text, marginTop: 10, marginBottom: 4 }}>{"What's your Mandarin goal?"}</Text>
              <Text style={{ fontSize: 14.5, color: t.textMuted, lineHeight: 21 }}>This shapes what Ming teaches you first. Be as specific as you like.</Text>
            </View>

            <TextInput
              value={goal}
              onChangeText={setGoal}
              maxLength={300}
              multiline
              accessibilityLabel="Your Mandarin goal"
              placeholder="e.g. Traveling to Beijing in 3 weeks, or talking with my partner's family"
              placeholderTextColor={t.textMuted}
              style={{
                minHeight: 90,
                backgroundColor: t.bg,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: radius.md,
                padding: 12,
                fontSize: 15.5,
                color: t.text,
                textAlignVertical: "top",
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 15, color: t.textSecondary }}>I have a deadline</Text>
              <Switch
                value={hasDeadline}
                onValueChange={setHasDeadline}
                accessibilityLabel="I have a deadline"
                trackColor={{ true: t.accent, false: t.borderStrong }}
                ios_backgroundColor={t.borderStrong}
              />
            </View>
            {hasDeadline && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 14, color: t.textMuted }}>Deadline</Text>
                <DateField value={date} onChange={setDate} />
              </View>
            )}

            {error ? (
              <Text accessibilityRole="alert" style={{ fontSize: 13.5, color: t.danger }}>
                {error}
              </Text>
            ) : null}

            <PrimaryButton
              onPress={() => goal.trim() && persist({ goal_text: goal.trim(), deadline_date: hasDeadline && date ? date : null })}
              disabled={!goal.trim()}
              busy={saving}
            >
              Start learning
            </PrimaryButton>
            <Pressable onPress={() => persist({ onboarding_skipped: true })} disabled={saving} hitSlop={8} style={{ alignItems: "center", padding: 4 }}>
              <Text style={{ fontSize: 14, color: t.textMuted }}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
