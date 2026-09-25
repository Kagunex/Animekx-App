import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";

/**
 * Routes locked — labels aligned to Animekz streaming nav.
 * Existing: index, catalog, schedule, library, profile (+ random hidden)
 */
const tabs = [
  { name: "index", title: "Beranda", icon: "home" },
  { name: "catalog", title: "Anime", icon: "view-grid-outline" },
  { name: "schedule", title: "Jadwal", icon: "calendar" },
  { name: "library", title: "Library", icon: "bookmark" },
  { name: "profile", title: "Profil", icon: "account" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: nothing.primary,
        tabBarInactiveTintColor: nothing.dim,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: bottomPad,
          height: 64,
          borderRadius: 24,
          backgroundColor: "rgba(15, 20, 28, 0.96)",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.07)",
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 6,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarBackground: () => (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 24,
                backgroundColor: "rgba(15, 20, 28, 0.96)",
                overflow: "hidden",
              },
            ]}
          />
        ),
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <AppIcon name={t.icon} size={20} color={color} />
              </View>
            ),
          }}
        />
      ))}
      <Tabs.Screen name="random" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 28,
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: "rgba(255, 106, 0, 0.18)",
  },
});
