import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";

/** IMAGE 1 bottom nav: Beranda · Explore · Jadwal · Library · Profil */
const tabs = [
  { name: "index", title: "Beranda", icon: "home" },
  { name: "catalog", title: "Explore", icon: "magnify" },
  { name: "schedule", title: "Jadwal", icon: "calendar" },
  { name: "library", title: "Library", icon: "bookmark" },
  { name: "profile", title: "Profil", icon: "account" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: nothing.red,
        tabBarInactiveTintColor: nothing.dim,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.1,
          marginTop: 2,
        },
        tabBarStyle: {
          height: 58 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
          backgroundColor: nothing.black,
          borderTopColor: nothing.line,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: focused ? "rgba(255,122,0,0.14)" : "transparent",
                }}
              >
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
