import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AnimeKzLogoMark } from "@/components/animekz-logo";
import { hapticLight } from "@/lib/haptics";

const ONBOARDING_KEY = "aniraku.onboarding.v1";

export function FirstRunOnboarding({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(false);
  const { height } = useWindowDimensions();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((seen) => {
      if (!seen) setVisible(true);
    });
  }, []);

  const finish = () => {
    hapticLight();
    AsyncStorage.setItem(ONBOARDING_KEY, "1").catch(() => {});
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <View style={[styles.diagonal, styles.diagonalOne]} />
      <View style={[styles.diagonal, styles.diagonalTwo]} />
      <View
        style={[styles.content, { paddingTop: Math.max(24, height * 0.08) }]}
      >
        <AnimeKzLogoMark width={184} wordmark />
        <View style={styles.copy}>
          <Text style={styles.title}>
            Your next favorite anime starts here.
          </Text>
          <Text style={styles.subtitle}>Watch. Discover. Enjoy.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={finish}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>Get Started →</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              finish();
              router.push("/auth" as never);
            }}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.footer}>ANIMEKZ · ANIME, YOUR WAY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 24,
  },
  diagonal: {
    position: "absolute",
    width: 460,
    height: 125,
    backgroundColor: "#1677FF",
    opacity: 0.12,
    transform: [{ rotate: "-38deg" }],
  },
  diagonalOne: { top: 74, right: -190 },
  diagonalTwo: { bottom: 106, left: -205, opacity: 0.2 },
  content: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 38,
  },
  copy: { alignItems: "center", gap: 10, maxWidth: 340 },
  title: {
    color: "#142B4B",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  subtitle: { color: "#526985", fontSize: 16, fontWeight: "600" },
  actions: { width: "100%", gap: 12, maxWidth: 420 },
  primary: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#1677FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#075BCB",
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondary: { minHeight: 50, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#142B4B", fontSize: 15, fontWeight: "700" },
  footer: {
    position: "absolute",
    bottom: 30,
    color: "#7185A5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
