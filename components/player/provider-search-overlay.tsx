import { memo, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Check from "lucide-react-native/icons/check";
import Layers from "lucide-react-native/icons/layers";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";

export type ProviderStepState = "done" | "active" | "pending";

const ACCENT = "#168BFF";
const PENDING = "rgba(148,170,204,0.55)";
const PENDING_LINE = "rgba(148,170,204,0.28)";

const STEPS = [
  "Initializing Player",
  "Searching Providers",
  "Checking Server Availability",
  "Connecting to Stream",
  "Stream Ready",
] as const;

const os = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 6, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,9,12,0.9)" },
  centerBlock: { alignItems: "center", paddingHorizontal: 20, maxWidth: 460, width: "100%" },
  orbitStage: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  circleWrap: { width: 78, height: 78, alignItems: "center", justifyContent: "center", borderRadius: 39, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  orbitDotHost: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  orbitDot: { position: "absolute", top: 5, left: 44, width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  title: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.2, textAlign: "center", marginTop: 16 },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 5, lineHeight: 15 },
  tracker: { flexDirection: "row", width: "100%", marginTop: 22 },
  trackCell: { flex: 1, alignItems: "center" },
  trackLineRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", height: 22 },
  trackLine: { flex: 1, height: 2, borderRadius: 1 },
  trackLinePlaceholder: { width: 12 },
  trackDotDone: { width: 20, height: 20, borderRadius: 10, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" },
  trackDotActive: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: ACCENT, alignItems: "center", justifyContent: "center" },
  trackDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  trackDotPending: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: PENDING_LINE, alignItems: "center", justifyContent: "center" },
  trackLabel: { fontSize: 8, fontWeight: "700", textAlign: "center", marginTop: 6, lineHeight: 11 },
  trackLabelDone: { color: "rgba(255,255,255,0.85)" },
  trackLabelActive: { color: ACCENT },
  trackLabelPending: { color: "rgba(148,170,204,0.75)" },
  errorNote: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 18, lineHeight: 16, paddingHorizontal: 8 },
  retryButton: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 16, minHeight: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1.5, borderColor: ACCENT, backgroundColor: "rgba(22,139,255,0.14)" },
  retryText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
});

/**
 * Center-of-video overlay while the real provider pipeline runs: discovery →
 * server probing → stream connection. Steps are passed in already resolved
 * from actual state (no fake progress lives in here). On failure it swaps to
 * an honest error card with a Retry action.
 */
export const ProviderSearchOverlay = memo(function ProviderSearchOverlay({
  steps,
  error,
  onRetry,
}: {
  steps: ProviderStepState[];
  error?: string | null;
  onRetry?: () => void;
}) {
  const erroring = Boolean(error);
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    orbitLoop.start();
    pulseLoop.start();
    return () => { orbitLoop.stop(); pulseLoop.stop(); };
  }, [orbit, pulse, erroring]);

  const orbitTransform = [{
    rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
  }];

  return (
    <View style={os.overlay} pointerEvents={erroring ? "box-none" : "none"} accessibilityRole="progressbar" accessibilityLabel="Finding streaming providers">
      <View style={os.centerBlock} pointerEvents="none">
        <Animated.View style={[os.orbitStage, { transform: [{ scale: pulse }] }]}>
          <View style={os.circleWrap}>
            <Layers size={30} color="#FFFFFF" />
          </View>
          <Animated.View style={[os.orbitDotHost, { transform: orbitTransform }]}>
            <View style={os.orbitDot} />
          </Animated.View>
        </Animated.View>
        <Text style={os.title}>{erroring ? "Stream Unavailable" : "Finding Streaming Providers"}</Text>
        <Text style={os.subtitle} numberOfLines={2}>
          {erroring ? "No working video source responded right now." : "Searching for available video sources..."}
        </Text>
        <View style={os.tracker}>
          {STEPS.map((label, index) => {
            const state = steps[index] ?? "pending";
            const previous = index > 0 ? (steps[index - 1] ?? "pending") : "done";
            return (
              <View key={label} style={os.trackCell}>
                <View style={os.trackLineRow}>
                  {index === 0
                    ? <View style={os.trackLinePlaceholder} />
                    : <View style={[os.trackLine, { backgroundColor: previous === "done" ? ACCENT : PENDING_LINE }]} />}
                  {state === "done"
                    ? <View style={os.trackDotDone}><Check size={11} color="#FFFFFF" strokeWidth={3} /></View>
                    : state === "active"
                      ? <View style={os.trackDotActive}><View style={os.trackDotInner} /></View>
                      : <View style={os.trackDotPending} />}
                  {index === STEPS.length - 1
                    ? <View style={os.trackLinePlaceholder} />
                    : <View style={[os.trackLine, { backgroundColor: state === "done" ? ACCENT : PENDING_LINE }]} />}
                </View>
                <Text style={[os.trackLabel, state === "done" ? os.trackLabelDone : state === "active" ? os.trackLabelActive : os.trackLabelPending]} numberOfLines={2}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      {erroring ? (
        <>
          <Text style={os.errorNote} numberOfLines={3} pointerEvents="none">{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry" style={({ pressed }) => [os.retryButton, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}>
              <RotateCcw size={14} color="#FFFFFF" />
              <Text style={os.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
});
