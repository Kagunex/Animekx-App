import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

const ANIMATION_MS = 240;

type PanelSheetProps = {
  mode: "bottom" | "side";
  style?: object;
  children: ReactNode;
};

/**
 * Shared entrance transition for player panels — bottom sheets rise, side
 * panels slide, both fade at native speed. Exit is instant: keeping the
 * close-path animation-free is the cheapest way to avoid jank on Android
 * panels that hold BlurView layers.
 */
export function PanelSheet({ mode, style, children }: PanelSheetProps) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const job = Animated.timing(t, {
      toValue: 1,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    job.start();
    return () => job.stop();
  }, [t]);

  const opacity = t;
  const translate = mode === "bottom"
    ? { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [42, 0] }) }
    : { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.body, style, { opacity, transform: [translate] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
