import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/**
 * Vertical dark fade used over artwork (trending hero, anime detail banner)
 * so bottom-overlaid text stays readable while the top of the image keeps
 * its natural contrast.
 */
export function BottomGradient({
  opacity = 0.78,
}: {
  opacity?: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg style={styles.svg}>
        <Defs>
          <LinearGradient id="animekz-bottom-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#102B50" stopOpacity="0" />
            <Stop offset="45%" stopColor="#102B50" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#102B50" stopOpacity={opacity} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#animekz-bottom-scrim)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { flex: 1 },
});
