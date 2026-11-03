import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/components/app-icon";
import { AnimeKzLogoMark } from "@/components/animekz-logo";
import { useTheme, lightColors, darkColors } from "@/providers/theme-provider";

/** Animekz blue entertainment design tokens */
export const nothing = {
  black: "#071426",
  surface: "#10223B",
  raised: "#172D4B",
  elevated: "#203957",
  line: "#294361",
  white: "#FFFFFF",
  muted: "#A8BBD4",
  dim: "#7890AC",
  /** Blue brand accent */
  red: "#1677FF",
  primary: "#1677FF",
  primaryDark: "#075BCB",
  accent: "#73B8FF",
  cyan: "#73B8FF",
  green: "#35D07F",
  error: "#FF4D5D",
  font: "SpaceGrotesk-Regular",
  fontMedium: "SpaceGrotesk-Medium",
  fontBold: "SpaceGrotesk-SemiBold",
  mono: "monospace" as const,
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] } as const,
  pressedSubtle: { opacity: 0.78 } as const,
  trackingTight: -0.5 as const,
  trackingNormal: 0.2 as const,
  trackingWide: 0.5 as const,
} as const;

export function useThemeColors() {
  const { isDark } = useTheme();
  const c = isDark ? darkColors : lightColors;
  return {
    black: c.background,
    background: c.background,
    surface: c.surface,
    raised: c.raised,
    line: c.line,
    white: c.text,
    text: c.text,
    muted: c.muted,
    dim: c.dim,
    red: c.accent,
    primary: c.accent,
    green: isDark ? "#48D597" : "#2E9E5A",
    cyan: isDark ? "#73B8FF" : "#1677FF",
    card: c.card,
    cardBorder: c.cardBorder,
  };
}

export function DotLabel({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "signal" | "live";
}) {
  const color =
    tone === "signal" || tone === "live" ? nothing.red : nothing.muted;
  const isDownloadLabel = children === "OFFLINE";
  if (isDownloadLabel) {
    return (
      <View style={styles.downloadLabel}>
        <AppIcon name="download" size={12} color={color} />
        <Text style={[styles.dotLabel, { color }]}>DOWNLOADS</Text>
      </View>
    );
  }
  return <Text style={[styles.dotLabel, { color }]}>{children}</Text>;
}

/** Compatibility exports now render the official SVG mark. */
export function AnirakuMark({
  size = 34,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return <AnimeKzLogoMark width={size} />;
}

export function AnimeKxLogo({ size = 28 }: { size?: number }) {
  return <AnimeKzLogoMark width={size} />;
}

export function NothingCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function NothingButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(event) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(event);
      }}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.primaryButton,
        variant === "outline" && styles.outlineButton,
        variant === "danger" && styles.dangerButton,
        disabled && styles.disabledButton,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "primary"
            ? styles.primaryButtonText
            : styles.outlineButtonText,
          variant === "danger" && { color: nothing.error },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Signal({
  label,
  tone = "live",
}: {
  label: string;
  tone?: "live" | "signal" | "muted";
}) {
  const color =
    tone === "signal" || tone === "live" ? nothing.red : nothing.muted;
  return (
    <View style={styles.signalRow}>
      <View style={[styles.signalDot, { backgroundColor: color }]} />
      <Text style={[styles.signalText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dotLabel: {
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  downloadLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  markText: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: nothing.surface,
    borderWidth: 1,
    borderColor: nothing.line,
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: nothing.red,
    borderColor: nothing.red,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderColor: nothing.line,
  },
  dangerButton: {
    backgroundColor: "rgba(255,77,93,0.12)",
    borderColor: "rgba(255,77,93,0.55)",
  },
  disabledButton: { opacity: 0.45 },
  pressed: nothing.pressed,
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  primaryButtonText: { color: nothing.white },
  outlineButtonText: { color: nothing.white },
  signalRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  signalDot: { width: 7, height: 7, borderRadius: 4 },
  signalText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});
