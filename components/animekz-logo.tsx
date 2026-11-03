import Logo from "@/assets/icons/animekz_logo.svg";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  width?: number;
  style?: StyleProp<ViewStyle>;
  wordmark?: boolean;
  dark?: boolean;
};

/** Shared SVG master logo for every in-app brand touchpoint. */
export function AnimeKzLogoMark({
  width = 120,
  style,
  wordmark = false,
  dark = false,
}: Props) {
  const height = Math.round(width);
  return (
    <View style={[styles.wrap, { minHeight: height }, style]}>
      <Logo width={width} height={height} />
      {wordmark ? (
        <View style={styles.wordmark}>
          <Text style={[styles.name, dark && styles.nameDark]}>ANIMEKZ</Text>
          <Text style={styles.tagline}>Watch. Discover. Enjoy.</Text>
        </View>
      ) : null}
    </View>
  );
}

export function AnimeKzHeaderLogo({ width = 42 }: { width?: number }) {
  return <AnimeKzLogoMark width={width} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  wordmark: { alignItems: "center", gap: 3, marginTop: 10 },
  name: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 3 },
  nameDark: { color: "#142B4B" },
  tagline: {
    color: "#73B8FF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
