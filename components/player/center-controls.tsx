import { memo, useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Play from "lucide-react-native/icons/play";
import Pause from "lucide-react-native/icons/pause";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import RotateCw from "lucide-react-native/icons/rotate-cw";
import { playerTheme } from "./player-theme";

const cc = StyleSheet.create({
  host: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", pointerEvents: "box-none" } as const,
  rail: { flexDirection: "row", alignItems: "center", gap: 26, pointerEvents: "box-none" } as const,
  railCompact: { gap: 20 },
  skip: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(0,0,0,0.26)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" } as const,
  skipPressed: { transform: [{ scale: 0.88 }], backgroundColor: "rgba(0,0,0,0.45)" } as const,
  play: { width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: "rgba(10,12,16,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", elevation: 6, shadowColor: "#000000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.32, shadowRadius: 9 } as const,
  playCompact: { width: 48, height: 48, borderRadius: 24 },
  playPressed: { transform: [{ scale: 0.93 }], backgroundColor: "rgba(10,12,16,0.72)" } as const,
  iconStack: { width: 26, height: 26, alignItems: "center", justifyContent: "center" } as const,
  iconLayer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" } as const,
});

/** Rotate arrow with a small numbered core — the ±10s affordance. */
function SkipTenIcon({ forward }: { forward: boolean }) {
  const Rotate = forward ? RotateCw : RotateCcw;
  return (
    <View pointerEvents="none" style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <Rotate size={22} color="#FFFFFF" strokeWidth={2.1} />
      <Text style={{ position: "absolute", color: playerTheme.textPrimary, fontSize: 7.5, fontWeight: "900", letterSpacing: 1, top: 8 }}>{forward ? "+10" : "-10"}</Text>
    </View>
  );
}

type CenterControlsProps = {
  isPlaying: boolean;
  compact?: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onForward: () => void;
};

/**
 * Center trio — rewind 10 · play/pause · forward 10 — a Netflix-style
 * translucent dark glass wheel that floats on the video and fades with the
 * rest of the chrome. The play icon crossfades into pause and the buttons
 * scale down slightly while pressed.
 */
export const CenterControls = memo(function CenterControls({ isPlaying, compact = false, onPlayPause, onRewind, onForward }: CenterControlsProps) {
  // Smooth Play ↔ Pause: pause layer rides on `fade`, play layer rides on
  // its inverse, both driven at native speed. A tiny scale pop keeps the
  // swap from reading as a cut.
  const fade = useRef(new Animated.Value(isPlaying ? 1 : 0)).current;
  useEffect(() => {
    const job = Animated.timing(fade, { toValue: isPlaying ? 1 : 0, duration: 160, useNativeDriver: Platform.OS !== "web" });
    job.start();
    return () => job.stop();
  }, [fade, isPlaying]);
  const playedScale = fade.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const pausedScale = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });

  return (
    <View style={cc.host}>
      <View style={[cc.rail, compact && cc.railCompact]}>
        <Pressable
          onPress={onRewind}
          accessibilityRole="button"
          accessibilityLabel="Back 10 seconds"
          hitSlop={8}
          style={({ pressed }) => [cc.skip, pressed && cc.skipPressed]}
        >
          <SkipTenIcon forward={false} />
        </Pressable>
        <Pressable
          onPress={onPlayPause}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          hitSlop={8}
          style={({ pressed }) => [cc.play, compact && cc.playCompact, pressed && cc.playPressed]}
        >
          <View style={cc.iconStack}>
            <Animated.View style={[cc.iconLayer, { opacity: fade, transform: [{ scale: playedScale }] }]}>
              <Pause size={26} color="#FFFFFF" />
            </Animated.View>
            <Animated.View style={[cc.iconLayer, { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: pausedScale }] }]}>
              <Play size={26} color="#FFFFFF" style={{ marginLeft: 3 }} fill="#FFFFFF" />
            </Animated.View>
          </View>
        </Pressable>
        <Pressable
          onPress={onForward}
          accessibilityRole="button"
          accessibilityLabel="Forward 10 seconds"
          hitSlop={8}
          style={({ pressed }) => [cc.skip, pressed && cc.skipPressed]}
        >
          <SkipTenIcon forward={true} />
        </Pressable>
      </View>
    </View>
  );
});
