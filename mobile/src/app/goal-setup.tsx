import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DateField } from "@/components/DateField";
import { PressableScale, Rise } from "@/components/motion";
import { PrimaryButton } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useSession, type Profile } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { cnFont, radius, serifFont, useMingTheme } from "@/lib/theme";
import { daysUntil, localDateKey } from "@/shared/dates";
import { DEADLINE_PRESETS, GOAL_PRESETS, planPreview } from "@/shared/goals";

type GoalPreset = { id: string; label: string; hanzi: string; text: string };
type DeadlinePreset = { id: string; label: string; days: number };

function dateIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

// Shown once after signing up, until a goal is set or skipped. Same fields as the web
// GoalSetup; the shortcuts and the plan line come from shared/goals.js on both.
export default function GoalSetup() {
  const t = useMingTheme();
  const { session, updateProfile } = useSession();
  const [goal, setGoal] = useState("");
  const [preset, setPreset] = useState<string | null>(null);
  // "" means no deadline.
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(patch: Partial<Profile>) {
    if (!session) return;
    setSaving(true);
    setError(null);
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", session.user.id).select("id");
    setSaving(false);
    if (error) {
      haptic.warn();
      setError("Couldn't save that. Check your connection and try again.");
      return;
    }
    // No rows back means the database refused the update (missing RLS policy, see
    // supabase/migrations). Let the user in anyway rather than trapping them here.
    if (!data?.length) console.warn("Profile update affected no rows");
    haptic.success();
    updateProfile(patch);
  }

  const days = date ? daysUntil(date) : null;
  const activeDeadline = (DEADLINE_PRESETS as DeadlinePreset[]).find((p) => date === dateIn(p.days))?.id ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 22 }} keyboardShouldPersistTaps="handled">
          <Rise>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: t.accentSoft,
                borderWidth: 1,
                borderColor: t.accentBorder,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Text style={{ fontFamily: cnFont, fontSize: 28, color: t.accent }}>明</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: t.accent, marginBottom: 6 }}>Your goal</Text>
            <Text style={{ fontSize: 28, lineHeight: 34, fontWeight: "600", color: t.text, fontFamily: serifFont }}>What are you learning Mandarin for?</Text>
            <Text style={{ fontSize: 15.5, color: t.textSecondary, lineHeight: 22, marginTop: 8 }}>Ming plans every lesson around your answer.</Text>
          </Rise>

          <Rise index={1}>
            <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(GOAL_PRESETS as GoalPreset[]).map((p) => {
                const active = preset === p.id;
                return (
                  <PressableScale
                    key={p.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={p.label}
                    onPress={() => {
                      haptic.select();
                      setPreset(p.id);
                      setGoal(p.text);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      paddingVertical: 9,
                      paddingHorizontal: 13,
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: active ? t.accent : t.border,
                      backgroundColor: active ? t.accentSoft : t.surface,
                    }}
                  >
                    <Text style={{ fontFamily: cnFont, fontSize: 15, color: t.accent }}>{p.hanzi}</Text>
                    <Text style={{ fontSize: 14.5, fontWeight: "500", color: active ? t.accent : t.text }}>{p.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </Rise>

          <Rise index={2}>
            <TextInput
              value={goal}
              onChangeText={(v) => {
                setGoal(v);
                setPreset(null);
              }}
              maxLength={300}
              multiline
              accessibilityLabel="Your Mandarin goal"
              placeholder="Or say it your way: a trip to Beijing in 3 weeks, dinner with my partner's parents..."
              placeholderTextColor={t.textMuted}
              style={{
                minHeight: 92,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: goal.trim() ? t.accentBorder : t.border,
                borderRadius: radius.lg,
                padding: 14,
                fontSize: 16,
                lineHeight: 22,
                color: t.text,
                textAlignVertical: "top",
              }}
            />
          </Rise>

          <Rise index={3}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: t.text, marginBottom: 10 }}>Is there a date you need it by?</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <Chip label="No deadline" active={!date} onPress={() => setDate("")} />
              {(DEADLINE_PRESETS as DeadlinePreset[]).map((p) => (
                <Chip key={p.id} label={p.label} active={activeDeadline === p.id} onPress={() => setDate(dateIn(p.days))} />
              ))}
            </View>
            {date ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
                <Text style={{ fontSize: 14, color: t.textMuted }}>Exact date</Text>
                <DateField value={date} onChange={setDate} />
              </View>
            ) : null}
          </Rise>

          <Rise index={4}>
            <View style={{ flexDirection: "row", gap: 10, backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accentBorder, borderRadius: radius.md, padding: 12 }}>
              <Text style={{ fontFamily: cnFont, fontSize: 16, color: t.accent }}>明</Text>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: t.textSecondary }}>{planPreview(goal, days)}</Text>
            </View>
          </Rise>

          {error ? (
            <Text accessibilityRole="alert" style={{ fontSize: 13.5, color: t.danger }}>
              {error}
            </Text>
          ) : null}

          <Rise index={5} style={{ gap: 6 }}>
            <PrimaryButton
              onPress={() => goal.trim() && persist({ goal_text: goal.trim(), deadline_date: date || null })}
              disabled={!goal.trim()}
              busy={saving}
            >
              Start learning
            </PrimaryButton>
            <Pressable onPress={() => persist({ onboarding_skipped: true })} disabled={saving} hitSlop={8} style={{ alignItems: "center", padding: 10 }}>
              <Text style={{ fontSize: 14.5, color: t.textMuted }}>Skip for now</Text>
            </Pressable>
          </Rise>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useMingTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? t.accent : t.border,
        backgroundColor: active ? t.accent : t.surface,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "500", color: active ? t.btnText : t.textSecondary }}>{label}</Text>
    </PressableScale>
  );
}
