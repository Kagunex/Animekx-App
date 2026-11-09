import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useWatchHistory } from "@/hooks/use-watch-history";
import { EmptyState, ErrorState } from "@/components/async-state";
import { LibrarySkeleton } from "@/components/skeleton";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";
import { NativeScreen } from "@/components/screen";
import { useAnirakuAuth } from "@/providers/auth-provider";
import {
  libraryErrorMessage,
  refreshLibrarySession,
} from "@/lib/library-diagnostics";

type LibraryTab = "continue" | "list" | "history";

function LibrarySettings() {
  const items = [
    { label: "Account", icon: "account", route: "/(tabs)/profile" },
    { label: "Notifications", icon: "bell", route: "/settings" },
    { label: "App Settings", icon: "cog-outline", route: "/settings" },
    { label: "About AnimeKz", icon: "information", route: "/settings" },
  ];
  return (
    <View style={styles.librarySettings}>
      <Text style={styles.settingsTitle}>Settings</Text>
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => router.push(item.route as never)}
          style={({ pressed }) => [
            styles.settingsRow,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name={item.icon} size={18} color="#4BA3E8" />
          <Text style={styles.settingsLabel}>{item.label}</Text>
          <AppIcon name="chevron-right" size={18} color="#71869A" />
        </Pressable>
      ))}
    </View>
  );
}

const TABS: { key: LibraryTab; label: string }[] = [
  { key: "continue", label: "Continue Watching" },
  { key: "list", label: "My List" },
  { key: "history", label: "History" },
];

export default function LibraryTabScreen() {
  const auth = useAnirakuAuth();
  const queryClient = useQueryClient();
  const history = useWatchHistory();
  const bookmarks = useBookmarks();
  const [tab, setTab] = useState<LibraryTab>("continue");

  const continueData = history.history;
  const listData = bookmarks.bookmarks;

  const active = tab === "list" ? listData : continueData;
  const activeKey =
    tab === "list"
      ? (["bookmarks", auth.user?.id] as const)
      : (["watch-history", auth.user?.id] as const);

  // "Coba Lagi" must not repeat a failing request against a stale session:
  // refresh the auth token first, invalidate the cached failure, then refetch.
  const retryLibrary = () => {
    void (async () => {
      await refreshLibrarySession();
      await queryClient.invalidateQueries({ queryKey: [...activeKey] });
      void active.refetch();
    })();
  };
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
    <NativeScreen scroll={false} tone="light" style={styles.fill}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>My List</Text>
          <Text style={styles.pageSubtitle}>Your collection</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() => router.push("/search" as never)}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <AppIcon name="magnify" size={20} color={"#172B3A"} />
        </Pressable>
      </View>

      <View style={styles.collectionCards}>
        <Pressable
          onPress={() => setTab("history")}
          style={[
            styles.collectionCard,
            tab === "history" && styles.collectionCardActive,
          ]}
        >
          <View style={styles.collectionIcon}>
            <AppIcon name="history" size={18} color="#4BA3E8" />
          </View>
          <Text style={styles.collectionTitle}>Watch History</Text>
          <Text style={styles.collectionCount}>
            {history.history.data?.length ?? 0} titles
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("list")}
          style={[
            styles.collectionCard,
            tab === "list" && styles.collectionCardActive,
          ]}
        >
          <View style={styles.collectionIcon}>
            <AppIcon name="bookmark" size={18} color="#4BA3E8" />
          </View>
          <Text style={styles.collectionTitle}>My List</Text>
          <Text style={styles.collectionCount}>
            {bookmarks.bookmarks.data?.length ?? 0} saved
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("continue")}
          style={[
            styles.collectionCard,
            tab === "continue" && styles.collectionCardActive,
          ]}
        >
          <View style={styles.collectionIcon}>
            <AppIcon name="play-circle" size={18} color="#4BA3E8" />
          </View>
          <Text style={styles.collectionTitle}>Continue</Text>
          <Text style={styles.collectionCount}>
            {continueData.data?.length ?? 0} titles
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setTab(item.key)}
            style={[styles.tab, tab === item.key && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === item.key && styles.tabTextActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {!auth.user ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emptyContent}
        >
          <EmptyState
            label={
              tab === "list"
                ? "Sign in to see your saved list."
                : tab === "continue"
                  ? "Sign in to continue watching across devices."
                  : "Sign in to see your watch history."
            }
            action={{ label: "Masuk", onPress: () => router.push("/auth" as never) }}
          />
          <LibrarySettings />
        </ScrollView>
      ) : active.isPending ? (
        <LibrarySkeleton />
      ) : active.isError ? (
        <ErrorState message={libraryErrorMessage(active.error)} onRetry={retryLibrary} />
      ) : filtered.length === 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emptyContent}
        >
          <EmptyState
            label={
              tab === "list"
                ? "Your list is empty."
                : tab === "continue"
                  ? "No anime in progress."
                  : "Your watch history is empty."
            }
          />
          <LibrarySettings />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) =>
            item.id ?? `${item.anime_id}:${item.episode_number ?? 0}`
          }
          contentContainerStyle={styles.list}
          ListFooterComponent={LibrarySettings}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) =>
            tab === "list" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/anime/${item.anime_id}` as never)}
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
                <AppIcon name="chevron-right" size={18} color={"#71869A"} />
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
                  source={{
                    uri:
                      item.episode_thumbnail ||
                      item.anime_image ||
                      item.anime_cover ||
                      "",
                  }}
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
                    {item.updated_at
                      ? ` · ${new Date(item.updated_at).toLocaleDateString()}`
                      : ""}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progress,
                        {
                          width: `${Math.min(
                            100,
                            Math.round(
                              (item.progress /
                                Math.max(item.duration || 1, 1)) *
                                100,
                            ),
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <AppIcon name="chevron-right" size={18} color={"#71869A"} />
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
  pageTitle: {
    color: "#172B3A",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  pageSubtitle: { color: "#71869A", fontSize: 13, marginTop: 2 },
  collectionCards: { flexDirection: "row", gap: 8, paddingVertical: 9 },
  collectionCard: {
    flex: 1,
    minHeight: 104,
    padding: 10,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E7F5",
    shadowColor: "#172B3A",
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },
  collectionCardActive: { borderColor: "#4BA3E8", backgroundColor: "#F6FAFF" },
  collectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF5FF",
    marginBottom: 7,
  },
  collectionTitle: { color: "#172B3A", fontSize: 11, fontWeight: "800" },
  collectionCount: { color: "#71869A", fontSize: 10, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF5FF",
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
    backgroundColor: "#EAF5FF",
  },
  tabActive: { backgroundColor: nothing.primary },
  tabText: { color: "#71869A", fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: "#172B3A" },
  list: { paddingTop: 4, paddingBottom: 132 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E7F5",
  },
  thumb: {
    width: 48,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#EAF5FF",
  },
  thumbWide: {
    width: 96,
    height: 54,
    borderRadius: 10,
    backgroundColor: "#EAF5FF",
  },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: {
    color: "#172B3A",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  rowMeta: { color: "#71869A", fontSize: 12, fontWeight: "600" },
  progressTrack: {
    height: 3,
    backgroundColor: "#D5E7F5",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  progress: {
    height: "100%",
    backgroundColor: nothing.primary,
    borderRadius: 2,
  },
  pressed: nothing.pressed,
  emptyContent: { flexGrow: 1, paddingBottom: 132, gap: 26 },
  librarySettings: { gap: 2, paddingBottom: 14 },
  settingsTitle: {
    marginBottom: 6,
    color: "#172B3A",
    fontSize: 17,
    fontWeight: "900",
  },
  settingsRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E7F5",
  },
  settingsLabel: { flex: 1, color: "#172B3A", fontSize: 13, fontWeight: "700" },
});
