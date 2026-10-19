import { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { pinyinSyllables } from "@/lib/pinyin";
import { cnFont, radius, useMingTheme } from "@/lib/theme";

// Where the tapped word is: `x` is the finger, `top`/`bottom` are the edges of the line of
// text it's on. All relative to the view the bubble is drawn in.
export type PinyinHint = { id: number; text: string; x: number; top: number; bottom: number };

const MARGIN = 10;
const GAP = 9; // space between the line of text and the bubble (the arrow fills most of it)

// A small bubble right above the Chinese you just tapped (or below it, if it's near the top),
// with each character's pinyin sitting on top of it.
export function PinyinBubble({ hint }: { hint: PinyinHint }) {
  const t = useMingTheme();
  const { width: screenW } = useWindowDimensions();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const chars = Array.from(hint.text);
  const syllables = pinyinSyllables(hint.text);
  const lined = syllables.length === chars.length;

  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const left = Math.min(Math.max(hint.x - w / 2, MARGIN), screenW - w - MARGIN);
  const above = hint.top - h - GAP >= 4;
  const top = above ? hint.top - h - GAP : hint.bottom + GAP;
  const arrowX = Math.min(Math.max(hint.x - left - 6, 12), Math.max(w - 24, 12));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{
        position: "absolute",
        left,
        top,
        maxWidth: screenW - MARGIN * 2,
        pointerEvents: "none",
        opacity: size ? 1 : 0,
        backgroundColor: t.text,
        borderRadius: radius.md,
        paddingVertical: 8,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      }}
    >
      {lined ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 6, rowGap: 6 }}>
          {chars.map((ch, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={{ color: t.bg, fontSize: 16, fontWeight: "600" }}>{syllables[i]}</Text>
              <Text style={{ color: t.bg, opacity: 0.75, fontFamily: cnFont, fontSize: 18, marginTop: 1 }}>{ch}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: t.bg, fontSize: 16, fontWeight: "600", textAlign: "center" }}>{syllables.join(" ")}</Text>
          <Text style={{ color: t.bg, opacity: 0.75, fontFamily: cnFont, fontSize: 18, marginTop: 1, textAlign: "center" }}>{hint.text}</Text>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          left: arrowX,
          [above ? "bottom" : "top"]: -5,
          width: 12,
          height: 12,
          backgroundColor: t.text,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}
