import { Tabs } from "expo-router";
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Bookmark from "lucide-react-native/icons/bookmark";
import Compass from "lucide-react-native/icons/compass";
import House from "lucide-react-native/icons/house";
import Sparkles from "lucide-react-native/icons/sparkles";
import UserRound from "lucide-react-native/icons/user-round";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const side = compact ? 10 : 16;
  const barHeight = compact ? 66 : 72;
  const bottomPad = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);
  const iconSize = compact ? 19 : 20;
  const discoverIconSize = compact ? 21 : 23;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#168BFF",
        tabBarInactiveTintColor: "#647C9B",
        tabBarShowLabel: true,
        tabBarAllowFontScaling: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: [
          styles.tabLabel,
          compact && styles.tabLabelCompact,
        ],
        tabBarStyle: {
          overflow: "visible",
          position: "absolute",
          left: side,
          right: side,
          bottom: bottomPad,
          height: barHeight,
          borderRadius: 28,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#D6E8FA",
          elevation: 16,
          shadowColor: "#102B50",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          paddingTop: compact ? 7 : 8,
          paddingBottom: compact ? 8 : 9,
          paddingHorizontal: compact ? 5 : 7,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarBackground: () => (
          <View style={styles.glassTab} pointerEvents="none">
            <BlurView
              intensity={60}
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
                    size={
                      t.name === "random" ? discoverIconSize : iconSize
                    }
                    color={t.name === "random" ? "#FFFFFF" : color}
                    strokeWidth={2.1}
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
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  glassSheen: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
    marginTop: 2,
  },
  tabLabelCompact: { fontSize: 9 },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 26,
    borderRadius: 13,
  },
  iconWrapActive: {
    backgroundColor: "#D9EEFF",
  },
  discoverWrap: {
    width: 46,
    height: 46,
    marginTop: -10,
    borderRadius: 23,
    backgroundColor: "#168BFF",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#168BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
