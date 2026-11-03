import type { PropsWithChildren, ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";

export type ScreenTone = "light" | "dark";

/** Shared safe screen shell with consistent clearance for the floating tab bar. */
export function NativeScreen({
  children,
  scroll = true,
  style,
  tone = "dark",
}: PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  tone?: ScreenTone;
}>) {
  const backgroundColor = tone === "light" ? "#F5F8FF" : "#071426";
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, style]}>{children}</View>
  );
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor }]}
    >
      <StatusBar style={tone === "light" ? "dark" : "light"} />
      {content}
    </SafeAreaView>
  );
}

export function NativeHeader({
  eyebrow,
  title,
  action,
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  tone?: ScreenTone;
}) {
  const light = tone === "light";
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={[styles.headerTitle, light && styles.headerTitleLight]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

export function SearchAction({ tone = "dark" }: { tone?: ScreenTone }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search anime"
      onPress={() => router.push("/search" as never)}
      style={({ pressed }) => [
        styles.iconButton,
        tone === "light" && styles.iconButtonLight,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        name="magnify"
        color={tone === "light" ? "#142B4B" : nothing.white}
        size={18}
      />
    </Pressable>
  );
}

export function NotificationAction({
  onPress,
  tone = "dark",
}: {
  onPress?: () => void;
  tone?: ScreenTone;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        tone === "light" && styles.iconButtonLight,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        name="bell"
        color={tone === "light" ? "#142B4B" : nothing.white}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: nothing.black },
  scroll: { paddingHorizontal: 18, paddingBottom: 128, gap: 24 },
  fill: { flex: 1 },
  header: {
    minHeight: 52,
    paddingTop: 2,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: { gap: 2, flex: 1, paddingRight: 12 },
  eyebrow: {
    color: nothing.primary,
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  eyebrowLight: { color: "#1677FF" },
  headerTitle: {
    color: nothing.white,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  headerTitleLight: { color: "#101828" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: nothing.raised,
  },
  iconButtonLight: { borderColor: "#D9E7F8", backgroundColor: "#FFFFFF" },
  pressed: nothing.pressed,
});
