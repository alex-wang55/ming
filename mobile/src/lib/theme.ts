import { Platform, useColorScheme } from "react-native";
import { themes } from "@/shared/theme";
import { useSettings } from "./settings";

export type Theme = (typeof themes)["light"];

// Same palette as the web app. Follows the Settings choice, or the phone when it's "system".
export function useMingTheme(): Theme & { dark: boolean } {
  const { settings } = useSettings();
  const system = useColorScheme();
  const dark = settings.theme === "dark" || (settings.theme === "system" && system === "dark");
  return { ...themes[dark ? "dark" : "light"], dark };
}

// The web app uses Noto Serif SC for Chinese. iOS ships Songti SC, a serif Chinese face,
// so characters keep the same feel without bundling a 10 MB font.
export const cnFont = Platform.select({
  ios: "Songti SC",
  android: "serif",
  default: "'Noto Serif SC', 'Songti SC', serif",
});

export const serifFont = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, full: 999 };
