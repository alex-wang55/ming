import { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseIcon, SearchIcon, SpeakerIcon } from "@/components/icons";
import { ScreenHeader } from "@/components/ui";
import { useSpeak, useStore, type Word } from "@/lib/store";
import { cnFont, radius, useMingTheme } from "@/lib/theme";
import { describeNextReview, isDue } from "@/shared/review";

// Port of the web WordsTab, plus a search box (the web app searches words from its ⌘K palette).
export default function Words() {
  const t = useMingTheme();
  const insets = useSafeAreaInsets();
  const { words, wordsLoading, startReview, refresh } = useStore();
  const [playing, play] = useSpeak();
  const [filter, setFilter] = useState<"all" | "due">("all");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const due = useMemo(() => words.filter((w) => isDue(w)), [words]);
  const shown = useMemo(() => {
    const base = filter === "due" ? due : words;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (w) => w.chinese?.includes(query.trim()) || w.pinyin?.toLowerCase().includes(q) || w.meaning?.toLowerCase().includes(q)
    );
  }, [filter, due, words, query]);

  const header = <ScreenHeader title="Your vocabulary" subtitle={`${words.length} word${words.length === 1 ? "" : "s"} learned`} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      // Clear the status bar on top and the tab bar below (iOS).
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: Platform.OS === "android" ? insets.top : 0, paddingBottom: 28, flexGrow: 1 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={t.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        />
      }
    >
      {header}

      {wordsLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : !words.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: cnFont, fontSize: 44, color: t.accent, opacity: 0.2, marginBottom: 14 }}>字</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: t.text, marginBottom: 6 }}>No words yet</Text>
          <Text style={{ fontSize: 14, color: t.textMuted, textAlign: "center", lineHeight: 21, maxWidth: 280 }}>
            New words Ming teaches you in chat are saved here automatically, with review timing built in.
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: radius.md,
              paddingHorizontal: 12,
            }}
          >
            <SearchIcon color={t.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search characters, pinyin or meaning"
              placeholderTextColor={t.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search your words"
              style={{ flex: 1, color: t.text, fontSize: 15, paddingVertical: 11 }}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Clear search">
                <CloseIcon color={t.textMuted} size={16} />
              </Pressable>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FilterChip active={filter === "all"} onPress={() => setFilter("all")} label={`All ${words.length}`} />
            <FilterChip active={filter === "due"} onPress={() => setFilter("due")} label={`Due ${due.length}`} />
            <View style={{ flex: 1 }} />
            {due.length > 0 && (
              <Pressable
                onPress={startReview}
                style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: t.accent, opacity: pressed ? 0.85 : 1 })}
              >
                <Text style={{ color: t.btnText, fontSize: 13.5, fontWeight: "600" }}>
                  Review {due.length} word{due.length === 1 ? "" : "s"}
                </Text>
              </Pressable>
            )}
          </View>

          {shown.length === 0 ? (
            <Text style={{ fontSize: 14, color: t.textMuted, textAlign: "center", paddingVertical: 40 }}>
              {query ? "No words match that search." : "Nothing due right now. Nice work."}
            </Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {shown.map((w) => (
                <WordCard key={w.id} word={w} playing={playing === w.chinese} onPress={() => play(w.chinese)} />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function WordCard({ word, playing, onPress }: { word: Word; playing: boolean; onPress: () => void }) {
  const t = useMingTheme();
  const due = isDue(word);
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${word.chinese}, ${word.pinyin ?? ""}, ${word.meaning ?? ""}. Tap to hear it.`}
      style={({ pressed }) => ({
        flexBasis: "47%",
        flexGrow: 1,
        backgroundColor: due ? t.accentSoft : t.surface,
        borderWidth: 1,
        borderColor: due ? t.accentBorder : t.border,
        borderRadius: radius.md,
        padding: 14,
        opacity: playing || pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <Text style={{ flex: 1, fontFamily: cnFont, fontSize: 26, fontWeight: "500", color: t.accent }}>{word.chinese}</Text>
        <View style={{ marginTop: 4 }}>
          <SpeakerIcon color={t.textMuted} />
        </View>
      </View>
      {word.pinyin ? <Text style={{ fontSize: 13, fontStyle: "italic", color: t.textSecondary, marginBottom: 3 }}>{word.pinyin}</Text> : null}
      {word.meaning ? <Text style={{ fontSize: 14.5, color: t.text, marginBottom: 9 }}>{word.meaning}</Text> : null}
      <Text style={{ fontSize: 11, fontWeight: due ? "700" : "400", color: due ? t.accent : t.textMuted, letterSpacing: due ? 0.4 : 0 }}>
        {describeNextReview(word)}
      </Text>
    </Pressable>
  );
}

function FilterChip({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  const t = useMingTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        backgroundColor: active ? t.accentSoft : "transparent",
        borderWidth: 1,
        borderColor: active ? t.accentBorder : t.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "500", color: active ? t.accent : t.textMuted }}>{label}</Text>
    </Pressable>
  );
}
