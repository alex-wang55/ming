import { useColorScheme } from "react-native";
import { themes } from "@/shared/theme";

// Same palette as the web app, following the phone's light/dark setting.
export function useMingTheme() {
  return themes[useColorScheme() === "dark" ? "dark" : "light"];
}
