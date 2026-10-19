import { Fragment, useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import type { Msg } from "@/lib/store";
import { cnFont, radius, useMingTheme } from "@/lib/theme";
import { parseToneTags, stripTags } from "@/shared/tags";
import { ToneGraphs } from "./tones";

const HANZI_RUN = /([一-鿿㐀-䶿]+)/g;
const HAS_HANZI = /[一-鿿㐀-䶿]/;

type Props = { message: Msg; playing: string | null; onPlay: (text: string) => void };

// Port of the web Message.js: Ming on the left with the 明 avatar, you on the right.
// Chinese in Ming's replies is tappable to hear it, and new words get a card with tone contours.
export function MessageBubble({ message, playing, onPlay }: Props) {
  const t = useMingTheme();
  const isAI = message.role === "assistant";

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, justifyContent: isAI ? "flex-start" : "flex-end" }}>
      {isAI && <Avatar />}
      <View
        style={{
          backgroundColor: message.error ? "transparent" : isAI ? t.surface : t.accentSoft,
          borderWidth: 1,
          borderStyle: message.error ? "dashed" : "solid",
          borderColor: isAI ? t.border : t.accentBorder,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderBottomLeftRadius: isAI ? 4 : radius.lg,
          borderBottomRightRadius: isAI ? radius.lg : 4,
          paddingVertical: 11,
          paddingHorizontal: 15,
          maxWidth: "85%",
          flexShrink: 1,
        }}
      >
        <Content content={message.content} muted={!!message.error} tappable={!message.error} playing={playing} onPlay={onPlay} />
      </View>
    </View>
  );
}

function Avatar() {
  const t = useMingTheme();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: t.accentBorder,
        backgroundColor: t.accentSoft,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
      }}
    >
      <Text style={{ fontFamily: cnFont, fontSize: 13, color: t.accent, fontWeight: "700" }}>明</Text>
    </View>
  );
}

function Content({
  content,
  muted,
  tappable,
  playing,
  onPlay,
}: {
  content: string;
  muted: boolean;
  tappable: boolean;
  playing: string | null;
  onPlay: (text: string) => void;
}) {
  const t = useMingTheme();
  const tags = tappable ? parseToneTags(content) : [];
  const text: string = stripTags(content)
    .replace(/^#{1,6}\s+/gm, "")
    // A stripped [TONE:...] tag can leave "word ." behind; pull the punctuation back.
    .replace(/[ \t]+([.,!?;:，。！？；：])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  const renderRuns = (s: string) =>
    s.split(HANZI_RUN).map((part, j) =>
      tappable && HAS_HANZI.test(part) ? (
        <Text
          key={j}
          onPress={() => onPlay(part)}
          accessibilityRole="button"
          accessibilityHint="Plays the pronunciation"
          style={{
            fontFamily: cnFont,
            fontSize: 17,
            fontWeight: "500",
            color: t.accent,
            textDecorationLine: "underline",
            textDecorationStyle: "dotted",
            textDecorationColor: t.accentBorder,
            opacity: playing === part ? 0.55 : 1,
          }}
        >
          {part}
        </Text>
      ) : (
        <Fragment key={j}>{part}</Fragment>
      )
    );

  return (
    <View>
      <Text selectable={!tappable} style={{ fontSize: 15.5, lineHeight: 24, color: muted ? t.textSecondary : t.text }}>
        {text.split(/(\*\*[^*\n]+\*\*)/g).map((segment, i) => {
          const bold = segment.length > 4 && segment.startsWith("**") && segment.endsWith("**");
          const inner = bold ? segment.slice(2, -2) : segment;
          return bold ? (
            <Text key={i} style={{ fontWeight: "600" }}>
              {renderRuns(inner)}
            </Text>
          ) : (
            <Fragment key={i}>{renderRuns(inner)}</Fragment>
          );
        })}
      </Text>

      {tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {tags.map((tag, i) => (
            <Pressable
              key={i}
              onPress={() => onPlay(tag.hanzi)}
              accessibilityLabel={`Play ${tag.hanzi}, ${tag.meaning}`}
              style={({ pressed }) => ({
                backgroundColor: t.bg,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 10,
                minWidth: 96,
                opacity: playing === tag.hanzi || pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginBottom: 5 }}>
                <Text style={{ fontFamily: cnFont, fontSize: 16, color: t.accent }}>{tag.hanzi}</Text>
                <Text style={{ fontSize: 11, color: t.textSecondary, fontStyle: "italic" }}>{tag.pinyin}</Text>
              </View>
              <ToneGraphs tones={tag.tones} color={t.accent} height={16} />
              <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{tag.meaning}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function TypingIndicator() {
  const t = useMingTheme();
  const [dots] = useState(() => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]);

  useEffect(() => {
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(450 - i * 150),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }} accessibilityLabel="Ming is typing">
      <Avatar />
      <View
        style={{
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
          borderBottomLeftRadius: 4,
          paddingVertical: 15,
          paddingHorizontal: 16,
          flexDirection: "row",
          gap: 5,
        }}
      >
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: t.textMuted,
              transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
