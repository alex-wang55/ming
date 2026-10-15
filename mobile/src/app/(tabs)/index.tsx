import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMingTheme } from "@/lib/theme";

// Placeholder: port the web app's LearnTab here.
export default function Learn() {
  const t = useMingTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: 20, gap: 8 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: t.text }}>Learn</Text>
      <Text style={{ fontSize: 15, lineHeight: 21, color: t.textMuted }}>
        Not ported to the app yet. For now, lessons live on the web version.
      </Text>
    </SafeAreaView>
  );
}
