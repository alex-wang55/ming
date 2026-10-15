import { NativeTabs } from "expo-router/unstable-native-tabs";

// Real UITabBar on iOS (Liquid Glass on iOS 26), same five tabs as the web app's phone layout.
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="learn">
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="words">
        <NativeTabs.Trigger.Label>Words</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="character.book.closed" />
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
