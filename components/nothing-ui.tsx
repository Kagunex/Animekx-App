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
import { BlurView } from "expo-blur";
import { AppIcon } from "@/components/app-icon";
import { AnimeKzLogoMark } from "@/components/animekz-logo";
import { useTheme, lightColors, darkColors } from "@/providers/theme-provider";

/** Animekz blue entertainment design tokens */
export const nothing = {
  black: "#172B3A",
  surface: "#FFFFFF",
  raised: "#EAF5FF",
  elevated: "#DCEEFF",
  line: "#263746",
  white: "#172B3A",
  muted: "#71869A",
  dim: "#8CA0B1",
  /** Blue brand accent */
  red: "#4BA3E8",
  primary: "#4BA3E8",
  primaryDark: "#287DBB",
  accent: "#8CCFFF",
  cyan: "#4BA3E8",
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
    cyan: isDark ? "#8CCFFF" : "#4BA3E8",
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

/** Translucent glass panel for navigation, sheets, and floating controls. */
export function GlassSurface({
  children,
  style,
  intensity = 42,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  return (
    <View style={[styles.glassSurface, style]}>
      <BlurView
        pointerEvents="none"
        intensity={intensity}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glassTint} />
      <View pointerEvents="none" style={styles.glassReflection} />
      {children}
    </View>
  );
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
    borderColor: "rgba(38,55,70,0.22)",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#263746",
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 2,
  },
  glassSurface: {
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,255,255,0.42)",
    shadowColor: "#263746",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 9,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  glassReflection: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
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
    borderColor: "#263746",
    borderBottomWidth: 3,
  },
  outlineButton: {
    backgroundColor: "rgba(255,255,255,0.65)",
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
  primaryButtonText: { color: "#172B3A" },
  outlineButtonText: { color: "#172B3A" },
  signalRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  signalDot: { width: 7, height: 7, borderRadius: 4 },
  signalText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});
