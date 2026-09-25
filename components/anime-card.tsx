import { useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { AppIcon } from "@/components/app-icon";
import type { Anime } from "@/lib/types";
import { animeTitle } from "@/lib/types";
import { usePrefetchAnime } from "@/lib/prefetch";
import { nothing } from "@/components/nothing-ui";

type ActionItem = { label: string; icon: string; onPress: () => void };

function showQuickFeedback(message: string) {
  Alert.alert("", message, [{ text: "OK" }], { cancelable: true });
}

export function AnimeCard({ anime, compact = false }: { anime: Anime; compact?: boolean }) {
  const title = animeTitle(anime);
  const artwork = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const [menuVisible, setMenuVisible] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetch = usePrefetchAnime();
  const score = anime.averageScore != null ? Math.round(anime.averageScore) : null;

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openMenu = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(true);
  };

  const actions: ActionItem[] = [
    {
      label: "Add to Library",
      icon: "bookmark",
      onPress: () => {
        showQuickFeedback(`Added "${title}" to your library`);
      },
    },
    {
      label: "Mark as Watched",
      icon: "check-circle",
      onPress: () => {
        showQuickFeedback(`"${title}" marked as watched`);
      },
    },
    {
      label: "Share",
      icon: "share",
      onPress: () => {
        showQuickFeedback(`Sharing "${title}"…`);
      },
    },
    {
      label: "Open in Browser",
      icon: "external-link",
      onPress: () => {
        const url = `https://anilist.co/anime/${anime.id}`;
        void Linking.openURL(url).catch(() => {
          showQuickFeedback("Unable to open browser");
        });
      },
    },
  ];

  const metaParts = [
    anime.format || null,
    anime.episodes ? `${anime.episodes} EP` : null,
  ].filter(Boolean);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
        accessibilityHint="Double tap to view anime details. Long press for more options."
        onPress={() => {
          cancelLongPress();
          void Haptics.selectionAsync();
          prefetch(anime.id);
          router.push((`/anime/${anime.id}`) as never);
        }}
        onPressIn={() => {
          longPressTimer.current = setTimeout(openMenu, 420);
        }}
        onPressOut={cancelLongPress}
        onLongPress={openMenu}
        style={({ pressed }) => [styles.card, compact && styles.compactCard, pressed && styles.pressed]}
      >
        <View style={[styles.media, compact && styles.compactMedia]}>
          {artwork ? (
            <Image source={{ uri: artwork }} style={styles.poster} contentFit="cover" transition={200} />
          ) : (
            <View style={styles.artFallback}>
              <Text style={styles.fallbackInitial}>{title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {score != null ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{score}%</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          {metaParts.length > 0 ? (
            <Text numberOfLines={1} style={styles.detail}>
              {metaParts.join(" · ")}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text numberOfLines={1} style={styles.sheetTitle}>
                {title}
              </Text>
            </View>
            <View style={styles.divider} />
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setMenuVisible(false);
                  setTimeout(() => action.onPress(), 150);
                }}
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
              >
                <AppIcon name={action.icon as any} size={18} color={nothing.white} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { width: 132, gap: 8 },
  compactCard: { width: 112 },
  pressed: nothing.pressed,
  media: {
    height: 188,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: nothing.raised,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  compactMedia: { height: 160 },
  artFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nothing.elevated,
  },
  fallbackInitial: { color: nothing.dim, fontSize: 42, fontWeight: "800" },
  poster: { ...StyleSheet.absoluteFillObject },
  scoreBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(7,8,13,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.35)",
  },
  scoreText: {
    color: nothing.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  meta: { gap: 3, paddingHorizontal: 2 },
  title: {
    color: nothing.white,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  detail: {
    color: nothing.dim,
    fontSize: 11,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    gap: 0,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: nothing.line,
    backgroundColor: nothing.surface,
    overflow: "hidden",
  },
  sheetHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  sheetTitle: {
    color: nothing.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  divider: { height: 1, backgroundColor: nothing.line, marginHorizontal: 12 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionPressed: { backgroundColor: nothing.raised },
  actionLabel: { color: nothing.white, fontSize: 14, fontWeight: "600" },
});
