import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";

/** Shared screen shell — safe top edges, bottom clearance for floating tab bar */
export function NativeScreen({
  children,
  scroll = true,
  style,
}: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.scroll, style]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, style]}>{children}</View>
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      {content}
    </SafeAreaView>
  );
}

export function NativeHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

export function SearchAction() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search anime"
      onPress={() => router.push("/search" as never)}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <AppIcon name="magnify" color={nothing.white} size={18} />
    </Pressable>
  );
}

export function NotificationAction({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <AppIcon name="bell" color={nothing.white} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: nothing.black },
  scroll: { paddingHorizontal: 18, paddingBottom: 120, gap: 24 },
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
  headerTitle: {
    color: nothing.white,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: nothing.raised,
  },
  pressed: nothing.pressed,
});
