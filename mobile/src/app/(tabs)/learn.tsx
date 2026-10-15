import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMingTheme } from "@/lib/theme";

// Placeholder: port LearnTab from the web app here.
export default function Learn() {
  const t = useMingTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: t.text }}>Learn</Text>
    </SafeAreaView>
  );
}
