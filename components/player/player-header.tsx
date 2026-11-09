import { StyleSheet, Text, View, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import Cast from "lucide-react-native/icons/cast";
import Subtitles from "lucide-react-native/icons/captions";
import Gear from "lucide-react-native/icons/settings";
import MoreVertical from "lucide-react-native/icons/ellipsis-vertical";
import { AnimeKzLogoMark } from "@/components/animekz-logo";
import { playerGlass, playerIconColor, playerTheme } from "./player-theme";

const ph = StyleSheet.create({
  host: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 7,
    overflow: "hidden",
  },
  hostImmersive: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 54 },
  hostTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  hostHairline: { position: "absolute", left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)" },
  brandDivider: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.28)", flexShrink: 0 },
  titleBlock: { flexShrink: 1, flexGrow: 1, minWidth: 0, gap: 1 },
  animeTitle: { color: playerTheme.textPrimary, fontSize: 13, lineHeight: 17, fontWeight: "700", letterSpacing: 0.1 },
  metaLine: { color: playerTheme.textSecondary, fontSize: 10, lineHeight: 13, fontWeight: "600", letterSpacing: 0.4, fontVariant: ["tabular-nums"] },
  actions: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
});

type PlayerHeaderProps = {
  title: string;
  episode: number;
  seasonLabel?: string;
  immersive?: boolean;
  subtitlesActive?: boolean;
  settingsActive?: boolean;
  onBack: () => void;
  onCast: () => void;
  onSubtitles: () => void;
  onSettings: () => void;
  onMore: () => void;
};

/**
 * Cinematic top chrome: back · AnimeKz mark | title / season+episode —
 * cast · CC · settings · more. White icons on transparent glass, drifting
 * above the edge-to-edge video behind a black top scrim.
 */
export function PlayerHeader({
  title,
  episode,
  seasonLabel,
  immersive = false,
  subtitlesActive = false,
  settingsActive = false,
  onBack,
  onCast,
  onSubtitles,
  onSettings,
  onMore,
}: PlayerHeaderProps) {
  const metaLine = seasonLabel ? `${seasonLabel} • Episode ${episode}` : `Episode ${episode}`;
  return (
    <View style={[ph.host, immersive && ph.hostImmersive]} pointerEvents="box-none">
      <BlurView
        pointerEvents="none"
        intensity={20}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={ph.hostTint} />
      <View pointerEvents="none" style={ph.hostHairline} />
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={playerGlass.iconButton}
        hitSlop={10}
      >
        <ArrowLeft size={20} color={playerTheme.textPrimary} />
      </Pressable>
      <AnimeKzLogoMark width={16} />
      <View pointerEvents="none" style={ph.brandDivider} />
      <View style={ph.titleBlock}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={ph.animeTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={ph.metaLine}>
          {metaLine}
        </Text>
      </View>
      <View style={ph.actions}>
        <Pressable
          onPress={onCast}
          accessibilityRole="button"
          accessibilityLabel="Cast"
          style={playerGlass.iconButton}
          hitSlop={8}
        >
          <Cast size={17} color={playerTheme.textPrimary} />
        </Pressable>
        <Pressable
          onPress={onSubtitles}
          accessibilityRole="button"
          accessibilityLabel="Subtitles"
          aria-selected={subtitlesActive}
          style={[playerGlass.iconButton, subtitlesActive && playerGlass.iconButtonActive]}
          hitSlop={8}
        >
          <Subtitles size={17} color={playerIconColor(subtitlesActive)} />
        </Pressable>
        <Pressable
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          aria-selected={settingsActive}
          style={[playerGlass.iconButton, settingsActive && playerGlass.iconButtonActive]}
          hitSlop={8}
        >
          <Gear size={17} color={playerIconColor(settingsActive)} />
        </Pressable>
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={playerGlass.iconButton}
          hitSlop={8}
        >
          <MoreVertical size={17} color={playerTheme.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
