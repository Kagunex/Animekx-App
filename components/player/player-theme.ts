import { StyleSheet } from "react-native";

/**
 * AnimeKz cinematic player foundation — Netflix-inspired:
 * pitch-black stage, floating glass chrome, single #168BFF accent.
 */
export const playerTheme = {
  bg: "#000000",
  stage: "#0A0A0C",
  surface: "rgba(10,12,16,0.72)",
  surfaceStrong: "rgba(10,12,16,0.92)",
  hairline: "rgba(255,255,255,0.14)",
  scrimTop: "rgba(0,0,0,0.55)",
  scrimTopSoft: "rgba(0,0,0,0.25)",
  scrimBottom: "rgba(0,0,0,0.6)",
  scrimBottomSoft: "rgba(0,0,0,0.26)",
  accent: "#168BFF",
  accentBright: "#4DA8FF",
  accentSoft: "rgba(22,139,255,0.24)",
  accentHairline: "rgba(22,139,255,0.5)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.64)",
  textTertiary: "rgba(255,255,255,0.42)",
  glassBg: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.16)",
  glassPressed: "rgba(255,255,255,0.2)",
} as const;

/** Transparent, glass-hover icon buttons rendered on top of the video. */
export const playerGlass = StyleSheet.create({
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: playerTheme.glassBg,
    borderWidth: 1,
    borderColor: playerTheme.glassBorder,
  },
  iconButtonActive: {
    backgroundColor: playerTheme.accentSoft,
    borderColor: playerTheme.accentHairline,
  },
  iconButtonDisabled: { opacity: 0.38 },
});

export const playerIconColor = (active: boolean) =>
  active ? playerTheme.accentBright : playerTheme.textPrimary;
