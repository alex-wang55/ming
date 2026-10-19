import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChinaMap } from "@/components/ChinaMap";
import { ChevronIcon } from "@/components/icons";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { cnFont, radius, serifFont, useMingTheme } from "@/lib/theme";
import { REGIONS, REGION_TYPES } from "@/shared/regions";

type Region = (typeof REGIONS)[number];

// Open on the region your goal mentions ("...family in Shanghai this winter"), else Beijing,
// so the screen isn't half empty before you've picked anything.
const ALIASES: Record<string, string[]> = { taipei: ["taiwan", "台湾", "台灣"], xian: ["xian"], guangzhou: ["canton"] };
function regionForGoal(goal: string | null | undefined): string {
  const g = (goal ?? "").toLowerCase();
  const hit = REGIONS.find(
    (r: Region) => g.includes(r.name.toLowerCase()) || g.includes(r.chineseName) || (ALIASES[r.id] ?? []).some((a) => g.includes(a))
  );
  return hit?.id ?? REGIONS[0].id;
}

// Port of the web MapTab's phone layout: the parchment map on top, then the region's
// accent, culture, tip, food and scenarios, then a button that starts a lesson there.
export default function MapScreen() {
  const t = useMingTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { startRegion } = useStore();
  const { profile } = useSession();
  const [selected, setSelected] = useState<string>(() => regionForGoal(profile?.goal_text));
  const scroll = useRef<ScrollView>(null);
  const detailY = useRef(0);
  // Keep the selected chip in view when a region is picked on the map (or picked for you).
  const chips = useRef<ScrollView>(null);
  const chipX = useRef<Record<string, number>>({});
  const showChip = useCallback((id: string, animated: boolean) => {
    const x = chipX.current[id];
    if (x !== undefined) chips.current?.scrollTo({ x: Math.max(x - 16, 0), animated });
  }, []);

  const region: Region | undefined = REGIONS.find((r: Region) => r.id === selected);

  const select = useCallback((id: string) => {
    haptic.select();
    setSelected(id);
    showChip(id, true);
    // Wait a frame so the detail panel has laid out, then bring it into view.
    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(detailY.current - 8, 0), animated: true }), 60);
  }, [showChip]);

  const typeColors = (type: string) =>
    type === "mainland"
      ? { bg: t.accentSoft, fg: t.accent, border: t.accentBorder }
      : type === "taiwan"
        ? { bg: t.successSoft, fg: t.success, border: t.successBorder }
        : { bg: "rgba(74,106,191,0.08)", fg: "#6a8ad8", border: "rgba(74,106,191,0.25)" };

  return (
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: t.bg }}
      // Clear the status bar on top and the tab bar below (iOS).
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: Platform.OS === "android" ? insets.top : 0, paddingBottom: 28 }}
    >
      <ScreenHeader title="Regional map" subtitle="Explore accents and culture by region" />

      <View style={{ backgroundColor: "#e8d8b8", borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border }}>
        <ChinaMap width={width} selected={selected} onSelect={select} />
      </View>

      {/* Bigger targets than the map for small regions like Shanghai */}
      <ScrollView ref={chips} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        {REGIONS.map((r: Region) => {
          const on = r.id === selected;
          return (
            <Pressable
              key={r.id}
              onPress={() => select(r.id)}
              onLayout={(e) => {
                chipX.current[r.id] = e.nativeEvent.layout.x;
                if (on) showChip(r.id, false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 6,
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: on ? t.accent : t.border,
                backgroundColor: on ? t.accent : t.surface,
              }}
            >
              <Text style={{ fontFamily: cnFont, fontSize: 15, color: on ? t.btnText : t.accent }}>{r.chineseName}</Text>
              <Text style={{ fontSize: 13, color: on ? t.btnText : t.textSecondary }}>{r.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View onLayout={(e) => (detailY.current = e.nativeEvent.layout.y)} style={{ paddingHorizontal: 16 }}>
        {!region ? (
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 40 }}>🗺️</Text>
            <Text style={{ fontSize: 17, fontWeight: "500", color: t.text }}>Tap a region</Text>
            <Text style={{ fontSize: 14, color: t.textMuted, textAlign: "center", lineHeight: 21, maxWidth: 280 }}>
              Select a highlighted province, Taiwan, or a diaspora city to explore its accent, culture, and food
            </Text>
          </View>
        ) : (
          <View>
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              {(() => {
                const c = typeColors(region.type);
                return (
                  <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
                    <Text style={{ fontSize: 12, fontWeight: "500", color: c.fg }}>{REGION_TYPES[region.type as keyof typeof REGION_TYPES].label}</Text>
                  </View>
                );
              })()}
            </View>
            <Text style={{ fontFamily: cnFont, fontSize: 36, color: t.accent, fontWeight: "500", marginTop: 6 }}>{region.chineseName}</Text>
            <Text style={{ fontFamily: serifFont, fontSize: 20, color: t.text, fontWeight: "500", marginBottom: 14 }}>{region.name}</Text>

            <Section title="🗣️ Accent & Speech">
              <Body>{region.accent}</Body>
            </Section>
            <Section title="🏮 Culture">
              <Body>{region.culture}</Body>
            </Section>
            <Section title="💡 Local tip">
              <Body>{region.tip}</Body>
            </Section>
            <Section title="🍜 Food vocabulary">
              {region.food.map((f: string, i: number) => (
                <Body key={i} style={{ marginBottom: 4 }}>
                  • {f}
                </Body>
              ))}
            </Section>
            <Section title="🎭 Scenarios">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {region.scenarios.map((s: string, i: number) => (
                  <View key={i} style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accentBorder }}>
                    <Text style={{ fontSize: 12.5, color: t.accent }}>{s}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <PrimaryButton onPress={() => startRegion(region)} style={{ marginTop: 6 }}>
              {`Start lesson in ${region.name}`}
            </PrimaryButton>
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 10 }}>
              <Text style={{ fontSize: 12.5, color: t.textMuted }}>Opens a new chat with Ming</Text>
              <ChevronIcon color={t.textMuted} size={11} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useMingTheme();
  return (
    <View style={{ marginBottom: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: t.surface, borderRadius: radius.md, borderWidth: 1, borderColor: t.border }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: t.textSecondary, marginBottom: 6 }}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children, style }: { children: React.ReactNode; style?: object }) {
  const t = useMingTheme();
  return <Text style={[{ fontSize: 14.5, color: t.textSecondary, lineHeight: 22 }, style]}>{children}</Text>;
}
