import { useState, type StyleProp, type ViewStyle } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

/**
 * Artwork renderer with loading state, failure handling, and disk/memory
 * cache. Every instance is keyed by `${kind}-${animeId}` so recycled views
 * always show the artwork that belongs to the exact anime being rendered.
 */
export function AnimeArtworkImage({
  uri,
  animeId,
  kind,
  contentFit = "cover",
  blurRadius,
  transition = 220,
  fallbackLabel,
  style,
}: {
  uri: string;
  animeId: number;
  kind: string;
  contentFit?: "cover" | "contain";
  blurRadius?: number;
  transition?: number;
  fallbackLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const valid = Boolean(uri) && !failed;

  return (
    <View style={[StyleSheet.absoluteFill, style] as StyleProp<ViewStyle>}>
      {valid ? (
        <Image
          source={{ uri: uri as string }}
          style={styles.fill}
          contentFit={contentFit}
          blurRadius={blurRadius}
          transition={transition}
          cachePolicy="memory-disk"
          recyclingKey={`${kind}-${animeId}`}
          onLoadEnd={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[styles.fill, styles.placeholder]}>
          {fallbackLabel ? (
            <Text style={styles.placeholderText}>
              {fallbackLabel.charAt(0).toUpperCase()}
            </Text>
          ) : null}
        </View>
      )}
      {valid && !loaded ? <View style={[styles.fill, styles.loading]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  loading: { backgroundColor: "#D9EEFF" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D9EEFF",
  },
  placeholderText: { color: "#647C9B", fontSize: 34, fontWeight: "800" },
});
