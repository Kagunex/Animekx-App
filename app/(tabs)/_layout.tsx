import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import Bookmark from "lucide-react-native/icons/bookmark";
import Compass from "lucide-react-native/icons/compass";
import House from "lucide-react-native/icons/house";
import Sparkles from "lucide-react-native/icons/sparkles";
import UserRound from "lucide-react-native/icons/user-round";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nothing } from "@/components/nothing-ui";

/**
 * Routes locked — labels aligned to Animekz streaming nav.
 * Existing: index, catalog, schedule, library, profile (+ random hidden)
 */
const tabs = [
  { name: "index", title: "Home", icon: House },
  { name: "catalog", title: "Explore", icon: Compass },
  { name: "random", title: "Discover", icon: Sparkles },
  { name: "library", title: "My List", icon: Bookmark },
  { name: "profile", title: "Profile", icon: UserRound },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#287DBB",
        tabBarInactiveTintColor: "#71869A",
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          overflow: "visible",
          position: "absolute",
          left: 16,
          right: 16,
          bottom: bottomPad,
          height: 70,
          borderRadius: 24,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 1.5,
          borderColor: "rgba(38,55,70,0.24)",
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 18,
          paddingTop: 9,
          paddingBottom: 11,
          paddingHorizontal: 7,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarBackground: () => (
          <View style={styles.glassTab} pointerEvents="none">
            <BlurView
              intensity={54}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassSheen} />
          </View>
        ),
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => {
              const TabIcon = t.icon;
              return (
                <View
                  style={[
                    styles.iconWrap,
                    t.name === "random" && styles.discoverWrap,
                    t.name !== "random" && focused && styles.iconWrapActive,
                  ]}
                >
                  <TabIcon
                    size={t.name === "random" ? 22 : 20}
                    color={t.name === "random" ? "#FFFFFF" : color}
                    strokeWidth={2}
                  />
                </View>
              );
            },
          }}
        />
      ))}
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glassTab: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  glassSheen: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
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
    backgroundColor: "#B9E2FF",
  },
  discoverWrap: {
    width: 42,
    height: 42,
    marginTop: -9,
    borderRadius: 21,
    backgroundColor: "#4BA3E8",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: "#4BA3E8",
    shadowOpacity: 0.28,
    shadowRadius: 9,
    elevation: 5,
  },
});
