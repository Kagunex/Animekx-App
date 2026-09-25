import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useWatchHistory } from "@/hooks/use-watch-history";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";
import { NativeScreen } from "@/components/screen";

type LibraryTab = "continue" | "list" | "history";

const TABS: { key: LibraryTab; label: string }[] = [
  { key: "continue", label: "Lanjut Nonton" },
  { key: "list", label: "Daftar Saya" },
  { key: "history", label: "Riwayat" },
];

export default function LibraryTabScreen() {
  const history = useWatchHistory();
  const bookmarks = useBookmarks();
  const [tab, setTab] = useState<LibraryTab>("continue");

  const continueData = history.history;
  const historyData = history.history;
  const listData = bookmarks.bookmarks;

  const active =
    tab === "list" ? listData : continueData;
  const records = active.data ?? [];

  // Continue = items with incomplete progress; History = all
  const filtered =
    tab === "continue"
      ? records.filter((item: any) => {
          const pct = item.progress / Math.max(item.duration || 1, 1);
          return pct < 0.95;
        })
      : tab === "history"
        ? records
        : records;

  return (
    <NativeScreen scroll={false} style={styles.fill}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Library</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cari"
          onPress={() => router.push("/search" as never)}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <AppIcon name="magnify" size={20} color={nothing.white} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setTab(item.key)}
            style={[styles.tab, tab === item.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {active.isPending ? (
        <LoadingState label="Memuat library..." />
      ) : active.isError ? (
        <ErrorState message="Gagal memuat library." onRetry={() => void active.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          label={
            tab === "list"
              ? "Belum ada anime di daftar kamu."
              : tab === "continue"
                ? "Belum ada yang sedang ditonton."
                : "Belum ada riwayat tontonan."
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id ?? `${item.anime_id}:${item.episode_number ?? 0}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) =>
            tab === "list" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push((`/anime/${item.anime_id}`) as never)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Image
                  source={{ uri: item.image || "" }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={0}
                  cachePolicy="memory-disk"
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.anime_title || "Anime"}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {item.format || "Anime"}
                    {item.episodes ? ` · ${item.episodes} EP` : ""}
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={18} color={nothing.dim} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/watch/[id]",
                    params: {
                      id: String(item.anime_id),
                      episode: String(item.episode_number),
                      title: item.anime_title ?? "Anime",
                      image: item.anime_image ?? item.anime_cover ?? "",
                    },
                  } as never)
                }
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Image
                  source={{ uri: (item.episode_thumbnail || item.anime_image || item.anime_cover) || "" }}
                  style={styles.thumbWide}
                  contentFit="cover"
                  transition={0}
                  cachePolicy="memory-disk"
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.anime_title || "Anime"}
                  </Text>
                  <Text style={styles.rowMeta}>
                    S1 · E{item.episode_number}
                    {item.duration
                      ? ` · ${Math.round((item.progress / Math.max(item.duration, 1)) * 100)}%`
                      : ""}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progress,
                        {
                          width: `${Math.min(
                            100,
                            Math.round((item.progress / Math.max(item.duration || 1, 1)) * 100),
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <AppIcon name="chevron-right" size={18} color={nothing.dim} />
              </Pressable>
            )
          }
        />
      )}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingBottom: 4,
  },
  pageTitle: { color: nothing.white, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nothing.raised,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: nothing.raised,
  },
  tabActive: { backgroundColor: nothing.primary },
  tabText: { color: nothing.muted, fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: nothing.white },
  list: { paddingTop: 4, paddingBottom: 112 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: nothing.line,
  },
  thumb: { width: 48, height: 68, borderRadius: 10, backgroundColor: nothing.raised },
  thumbWide: { width: 96, height: 54, borderRadius: 10, backgroundColor: nothing.raised },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { color: nothing.white, fontSize: 14, fontWeight: "700", lineHeight: 18 },
  rowMeta: { color: nothing.dim, fontSize: 12, fontWeight: "600" },
  progressTrack: { height: 3, backgroundColor: nothing.line, borderRadius: 2, overflow: "hidden", marginTop: 2 },
  progress: { height: "100%", backgroundColor: nothing.primary, borderRadius: 2 },
  pressed: nothing.pressed,
});
