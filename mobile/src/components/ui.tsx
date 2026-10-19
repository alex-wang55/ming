import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { cnFont, radius, useMingTheme } from "@/lib/theme";

// Shared building blocks, styled after the web app's components.

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const t = useMingTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: t.accentBorder,
          backgroundColor: t.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: cnFont, fontSize: 17, color: t.accent, fontWeight: "700" }}>明</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: "600", color: t.text, letterSpacing: -0.2 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 13, color: t.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Pill({ children, color, bg, border }: { children: string; color: string; bg: string; border: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color }}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useMingTheme();
  return (
    <View style={[{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, padding: 14 }, style]}>
      {children}
    </View>
  );
}

export function Label({ children, color }: { children: string; color?: string }) {
  const t = useMingTheme();
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        color: color ?? t.textMuted,
        opacity: color ? 0.85 : 1,
        marginBottom: 7,
      }}
    >
      {children}
    </Text>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  busy,
  style,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useMingTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: t.accent,
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={t.btnText} /> : <Text style={{ color: t.btnText, fontSize: 16, fontWeight: "600" }}>{children}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({
  children,
  onPress,
  color,
  style,
}: {
  children: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useMingTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: radius.md,
          paddingVertical: 13,
          paddingHorizontal: 16,
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: color ?? t.textSecondary, fontSize: 15, fontWeight: "500" }}>{children}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const t = useMingTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", gap: 2, padding: 3, backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, borderRadius: radius.md }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.id)}
            style={{ flex: 1, paddingVertical: 7, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: active ? t.accent : "transparent", alignItems: "center" }}
          >
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "500", color: active ? t.btnText : t.textMuted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Centered({ children }: { children: ReactNode }) {
  const t = useMingTheme();
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: t.bg }}>{children}</View>;
}
