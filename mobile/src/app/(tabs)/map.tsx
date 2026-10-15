import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMingTheme } from "@/lib/theme";

// Placeholder: port the web app's MapTab here.
export default function Map() {
  const t = useMingTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: 20, gap: 8 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: t.text }}>Map</Text>
      <Text style={{ fontSize: 15, lineHeight: 21, color: t.textMuted }}>
        Not ported to the app yet. For now, the regional map lives on the web version.
      </Text>
    </SafeAreaView>
  );
}
