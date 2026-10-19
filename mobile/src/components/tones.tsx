import { Pressable, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { cnFont, radius, useMingTheme } from "@/lib/theme";

// Pitch contours on an 80x26 grid, same as the web app's ToneContour.js.
// Higher on screen = higher pitch.
const CONTOURS: Record<number, { path: string; label: string }> = {
  1: { path: "M4 6 L76 6", label: "Flat and high" },
  2: { path: "M4 20 L76 5", label: "Rising" },
  3: { path: "M4 8 Q22 22 40 21 Q58 20 76 6", label: "Dip then rise" },
  4: { path: "M4 5 L76 21", label: "Sharp fall" },
  5: { path: "M30 13 L50 13", label: "Neutral" },
};

export function ToneGraph({ tone, color, height = 26 }: { tone: number; color: string; height?: number }) {
  const c = CONTOURS[tone] || CONTOURS[5];
  return (
    <Svg width="100%" height={height} viewBox="0 0 80 26">
      <Line x1="0" y1="25" x2="80" y2="25" stroke={color} strokeWidth={1} opacity={0.15} />
      <Path d={c.path} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// One contour per syllable, e.g. tones [4, 5] for 谢谢.
export function ToneGraphs({ tones, color, height = 16 }: { tones: number[]; color: string; height?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {tones.map((tone, i) => (
        <View key={i} style={{ flex: 1, minWidth: 0 }}>
          <ToneGraph tone={tone} color={color} height={height} />
        </View>
      ))}
    </View>
  );
}

const TONE_SET = [
  { hanzi: "妈", pinyin: "mā", tone: 1, meaning: "mother" },
  { hanzi: "麻", pinyin: "má", tone: 2, meaning: "hemp" },
  { hanzi: "马", pinyin: "mǎ", tone: 3, meaning: "horse" },
  { hanzi: "骂", pinyin: "mà", tone: 4, meaning: "scold" },
];

export function ToneReference({ playing, onPlay }: { playing: string | null; onPlay: (hanzi: string) => void }) {
  const t = useMingTheme();
  return (
    <View>
      <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: t.textMuted, marginBottom: 10 }}>
        The four tones
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {TONE_SET.map((s) => {
          const c = CONTOURS[s.tone];
          return (
            <Pressable
              key={s.hanzi}
              onPress={() => onPlay(s.hanzi)}
              accessibilityLabel={`Play ${s.hanzi}, ${s.pinyin}`}
              style={({ pressed }) => ({
                flexBasis: "47%",
                flexGrow: 1,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: radius.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
                opacity: playing === s.hanzi || pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7, marginBottom: 8 }}>
                <Text style={{ fontFamily: cnFont, fontSize: 24, fontWeight: "500", color: t.accent }}>{s.hanzi}</Text>
                <Text style={{ fontSize: 13, color: t.textSecondary, fontStyle: "italic" }}>{s.pinyin}</Text>
              </View>
              <ToneGraph tone={s.tone} color={t.accent} />
              <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>
                {c.label} · {s.meaning}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 12.5, color: t.textMuted, marginTop: 10, lineHeight: 19 }}>
        Same syllable, four meanings. This is why tone accuracy matters more in Mandarin than in most languages. Tap a card to hear it.
      </Text>
    </View>
  );
}
