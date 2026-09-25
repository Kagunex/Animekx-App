import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

const LOGO = require("@/assets/images/branding/animekx-logo.png");

type Props = {
  /** Width of the logo mark. Height scales to preserve aspect ratio (~2:1). */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/** Official Animekz logo (IMAGE 2) — transparent background, no slogan. */
export function AnimeKxLogoMark({ width = 120, style }: Props) {
  const height = Math.round(width * 0.5);
  return (
    <View style={[styles.wrap, { width, height }, style]}>
      <Image source={LOGO} style={{ width, height }} contentFit="contain" transition={0} />
    </View>
  );
}

/** Compact header logo */
export function AnimeKxHeaderLogo({ width = 110 }: { width?: number }) {
  return <AnimeKxLogoMark width={width} />;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
