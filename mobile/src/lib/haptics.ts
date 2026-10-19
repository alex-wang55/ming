import * as Haptics from "expo-haptics";

// Small taps of feedback. Haptics can be unavailable (simulator, web, low power),
// so every call is fire-and-forget.
const safe = (p: Promise<unknown>) => p.catch(() => {});

export const haptic = {
  tap: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => safe(Haptics.selectionAsync()),
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warn: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
