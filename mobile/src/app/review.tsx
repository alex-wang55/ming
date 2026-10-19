import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CloseIcon } from "@/components/icons";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useSpeak, useStore } from "@/lib/store";
import { cnFont, radius, useMingTheme } from "@/lib/theme";

// Flashcard review, a port of the web Checkpoint. Used for the quick check every third
// lesson and for due-word reviews. Each rating updates the word's review schedule.
export default function Review() {
  const t = useMingTheme();
  const { review, rateWord } = useStore();
  const [playing, play] = useSpeak();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gotIt, setGotIt] = useState(0);

  const words = review?.words ?? [];
  const title = review?.title ?? "Review";
  const finished = idx >= words.length;
  const word = words[idx];
  const close = () => router.back();

  function rate(rating: "easy" | "hard") {
    if (!word) return;
    haptic.select();
    rateWord(word, rating);
    if (rating === "easy") setGotIt((n) => n + 1);
    setRevealed(false);
    const next = idx + 1;
    if (next >= words.length) haptic.success();
    setIdx(next);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["bottom"]}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 12 }}>
        <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close review" style={{ padding: 6 }}>
          <CloseIcon color={t.textMuted} size={22} />
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40 }}>
        {!words.length ? (
          <View style={{ alignItems: "center", gap: 16 }}>
            <Text style={{ fontSize: 16, color: t.textMuted }}>Nothing to review right now.</Text>
            <PrimaryButton onPress={close} style={{ alignSelf: "stretch" }}>
              Done
            </PrimaryButton>
          </View>
        ) : finished ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: cnFont, fontSize: 52, color: t.accent, marginBottom: 10 }}>好</Text>
            <Text style={{ fontSize: 20, fontWeight: "600", color: t.text, marginBottom: 8 }}>Review done</Text>
            <Text style={{ fontSize: 15, color: t.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
              {gotIt} of {words.length} came back easily. Shaky words will come back sooner.
            </Text>
            <PrimaryButton onPress={close} style={{ alignSelf: "stretch" }}>
              Done
            </PrimaryButton>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: t.textMuted, textAlign: "center", marginBottom: 12 }}>
              {title} · {idx + 1} of {words.length}
            </Text>
            <View style={{ height: 4, backgroundColor: t.border, borderRadius: radius.full, marginBottom: 36, overflow: "hidden" }}>
              <View style={{ width: `${(idx / words.length) * 100}%`, height: "100%", backgroundColor: t.accent }} />
            </View>

            <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.lg, paddingVertical: 36, paddingHorizontal: 20, alignItems: "center", marginBottom: 24 }}>
              <Pressable onPress={() => play(word.chinese)} accessibilityLabel={`Hear ${word.chinese}`} style={{ opacity: playing === word.chinese ? 0.6 : 1 }}>
                <Text style={{ fontFamily: cnFont, fontSize: 56, color: t.accent, textAlign: "center" }}>{word.chinese}</Text>
              </Pressable>
              <View style={{ minHeight: 64, marginTop: 14, alignItems: "center", justifyContent: "center" }}>
                {revealed ? (
                  <>
                    {word.pinyin ? <Text style={{ fontSize: 17, fontStyle: "italic", color: t.textSecondary, marginBottom: 6 }}>{word.pinyin}</Text> : null}
                    {word.meaning ? <Text style={{ fontSize: 18, color: t.text, textAlign: "center" }}>{word.meaning}</Text> : null}
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: t.textMuted, textAlign: "center", lineHeight: 21 }}>
                    Do you remember how to say it and what it means? Tap the word to hear it.
                  </Text>
                )}
              </View>
            </View>

            {revealed ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <SecondaryButton onPress={() => rate("hard")} style={{ flex: 1 }}>
                  Still shaky
                </SecondaryButton>
                <PrimaryButton onPress={() => rate("easy")} style={{ flex: 1 }}>
                  Got it
                </PrimaryButton>
              </View>
            ) : (
              <PrimaryButton
                onPress={() => {
                  haptic.tap();
                  setRevealed(true);
                }}
              >
                Show answer
              </PrimaryButton>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
