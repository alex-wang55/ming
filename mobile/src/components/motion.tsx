import { useEffect, type ReactNode } from "react";
import { Pressable, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Ming's motion vocabulary, in one place so every screen moves the same way: things rise
// in softly, buttons give a little under the finger, and the mic breathes while it listens.
// Reanimated follows the phone's Reduce Motion setting for the entering animations.

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Rises 10px and fades in. `index` staggers a group so it reads top to bottom.
export function Rise({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380).easing(Easing.out(Easing.cubic))} style={style}>
      {children}
    </Animated.View>
  );
}

// A pressable that dips slightly while held and springs back.
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  scaleTo = 0.96,
  hitSlop,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  accessibilityHint,
}: {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hitSlop?: number;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "radio" | "tab";
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  accessibilityHint?: string;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      accessibilityHint={accessibilityHint}
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

// A soft ring that swells and fades behind something that's live (the mic while recording).
export function PulseRing({ active, color, size }: { active: boolean; color: string; size: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = active ? withRepeat(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }), -1, false) : withTiming(0, { duration: 150 });
  }, [active, p]);
  const ring = useAnimatedStyle(() => ({
    opacity: active ? 0.35 * (1 - p.value) : 0,
    transform: [{ scale: 1 + p.value * 0.9 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ring]}
    />
  );
}

// Three bars that bounce while audio is playing, in place of a static speaker icon.
export function Equalizer({ color, active }: { color: string; active: boolean }) {
  return (
    <Animated.View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 10 }}>
      {[0, 1, 2].map((i) => (
        <EqBar key={i} color={color} active={active} delay={i * 110} />
      ))}
    </Animated.View>
  );
}

function EqBar({ color, active, delay }: { color: string; active: boolean; delay: number }) {
  const h = useSharedValue(0.3);
  useEffect(() => {
    h.value = active
      ? withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(0.3, { duration: 260 })), -1, false))
      : withTiming(0.3, { duration: 120 });
  }, [active, delay, h]);
  const bar = useAnimatedStyle(() => ({ height: 10 * h.value }));
  return <Animated.View style={[{ width: 2.5, borderRadius: 2, backgroundColor: color }, bar]} />;
}
