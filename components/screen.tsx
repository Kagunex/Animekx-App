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
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";

export type ScreenTone = "light" | "dark";

/** Shared safe screen shell with consistent clearance for the floating tab bar. */
export function NativeScreen({
  children,
  scroll = true,
  style,
  tone = "light",
}: PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  tone?: ScreenTone;
}>) {
  const backgroundColor = tone === "light" ? "#F5FAFF" : "#102334";
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
  tone = "light",
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

export function SearchAction({ tone = "light" }: { tone?: ScreenTone }) {
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
      <BlurView
        pointerEvents="none"
        intensity={32}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <AppIcon
        name="magnify"
        color={tone === "light" ? "#172B3A" : "#F7FAFF"}
        size={18}
      />
    </Pressable>
  );
}

export function NotificationAction({
  onPress,
  tone = "light",
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
      <BlurView
        pointerEvents="none"
        intensity={32}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <AppIcon
        name="bell"
        color={tone === "light" ? "#172B3A" : "#F7FAFF"}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5FAFF" },
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
  eyebrowLight: { color: "#287DBB" },
  headerTitle: {
    color: nothing.white,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  headerTitleLight: { color: "#172B3A" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(38,55,70,0.2)",
    backgroundColor: "rgba(255,255,255,0.72)",
    shadowColor: "#263746",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  iconButtonLight: { borderColor: "rgba(38,55,70,0.2)", backgroundColor: "rgba(255,255,255,0.72)" },
  pressed: nothing.pressed,
});
