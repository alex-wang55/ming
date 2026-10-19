import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useStore } from "@/lib/store";
import { useMingTheme } from "@/lib/theme";

// Real UITabBar on iOS (Liquid Glass on iOS 26), same five tabs as the web app's phone layout.
export default function TabsLayout() {
  const t = useMingTheme();
  const { dueCount } = useStore();
  return (
    <NativeTabs tintColor={t.accent} badgeBackgroundColor={t.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book" />
      </NativeTabs.Trigger>
      {/* Chat handles its own insets so the message box can sit above the tab bar. */}
      <NativeTabs.Trigger name="chat" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="words">
        <NativeTabs.Trigger.Label>Words</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="character.book.closed" />
        {/* Same as the web nav: the number of words due for review */}
        <NativeTabs.Trigger.Badge hidden={dueCount === 0}>{String(dueCount)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
