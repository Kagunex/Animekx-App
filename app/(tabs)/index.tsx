import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { getHomeAnime, getHomeRailAnime } from "@/lib/anilist";
import { nsfwFilterParam, useNsfwPreference } from "@/lib/nsfw-preference";
import { animeTitle } from "@/lib/types";
import { hapticLight } from "@/lib/haptics";
import { usePrefetchAnime } from "@/lib/prefetch";
import { AnimeRail } from "@/components/anime-rail";
import { ErrorState } from "@/components/async-state";
import { nothing } from "@/components/nothing-ui";
import { SkeletonCard, SkeletonRail, SkeletonHero } from "@/components/skeleton";
import { NativeScreen, SearchAction, NotificationAction } from "@/components/screen";
import { NotificationSheet } from "@/components/notification-sheet";
import { AppIcon } from "@/components/app-icon";
import { AnimeKxHeaderLogo } from "@/components/animekx-logo";
import { InAppEpisodeAlertMonitor } from "@/hooks/use-in-app-episode-alerts";
import { useWatchHistory } from "@/hooks/use-watch-history";

function titleFacts(format?: string | null, episodes?: number | null, score?: number | null) {
  return [format, episodes ? `${episodes} EP` : null, score ? `${Math.round(score)}%` : null].filter(Boolean).join(" · ");
}

function HomeHeader({ onNotif }: { onNotif: () => void }) {
  return (
    <View style={styles.homeHeader}>
      <AnimeKxHeaderLogo width={108} />
      <View style={styles.headerActions}>
        <SearchAction />
        <NotificationAction onPress={onNotif} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil"
          onPress={() => router.push("/(tabs)/profile" as never)}
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
        >
          <AppIcon name="account" size={18} color={nothing.white} />
        </Pressable>
      </View>
    </View>
  );
}

function ContinueCard({
  entry,
}: {
  entry: {
    anime_id: number;
    episode_number: number;
    progress: number;
    duration?: number | null;
    anime_title?: string | null;
    anime_cover?: string | null;
    episode_thumbnail?: string | null;
  };
}) {
  const [failed, setFailed] = useState(false);
  const [epThumbFailed, setEpThumbFailed] = useState(false);
  const progress = entry.duration && entry.duration > 0 ? Math.min(100, (entry.progress / entry.duration) * 100) : 0;
  const epThumb = !epThumbFailed && entry.episode_thumbnail ? entry.episode_thumbnail : null;
  const cover = !failed && entry.anime_cover ? entry.anime_cover : null;
  const imageUri = epThumb || cover;
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        router.push({
          pathname: "/watch/[id]",
          params: {
            id: String(entry.anime_id),
            episode: String(entry.episode_number),
            title: entry.anime_title || "",
            image: entry.anime_cover || "",
          },
        } as never);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Lanjutkan ${entry.anime_title || "Untitled"} episode ${entry.episode_number}`}
      style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
    >
      <View style={styles.continueImageWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            recyclingKey={imageUri}
            onError={() => (epThumb ? setEpThumbFailed(true) : setFailed(true))}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.continueImageFallback}>
            <Text style={styles.continueImageFallbackText}>{(entry.anime_title || "A").charAt(0)}</Text>
          </View>
        )}
        <View style={styles.continueOverlay}>
          <View style={styles.continuePlayBadge}>
            <AppIcon name="play" size={12} color={nothing.white} />
          </View>
        </View>
        <View style={styles.continueProgress}>
          <View style={[styles.continueProgressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <View style={styles.continueInfo}>
        <Text style={styles.continueTitle} numberOfLines={1}>
          {entry.anime_title || "Untitled"}
        </Text>
        <Text style={styles.continueMeta}>
          EP {String(entry.episode_number).padStart(2, "0")}
          {progress > 0 ? ` · ${Math.round(progress)}%` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

function ContinueWatchingRail() {
  const { history } = useWatchHistory();
  if (!history.isSuccess) return null;
  if (!history.data?.length) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Lanjut Menonton</Text>
        </View>
        <View style={styles.continueEmpty}>
          <Text style={styles.continueEmptyTitle}>Belum ada riwayat</Text>
          <Text style={styles.continueEmptyText}>Mulai nonton untuk melihat progress di sini.</Text>
          <Pressable onPress={() => router.push("/catalog" as never)} style={({ pressed }) => [styles.browseBtn, pressed && styles.pressed]}>
            <Text style={styles.browseBtnText}>Jelajahi Anime</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const recent = history.data.slice(0, 10);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Lanjut Menonton</Text>
        <Pressable onPress={() => router.push("/library" as never)}>
          <Text style={styles.seeAll}>Lihat Semua</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueList}>
        {recent.map((entry) => (
          <ContinueCard key={`${entry.anime_id}:${entry.episode_number}`} entry={entry} />
        ))}
      </ScrollView>
    </View>
  );
}

function TrendingGrid({
  items,
}: {
  items: {
    id: number;
    coverImage?: { large?: string | null; extraLarge?: string | null } | null;
    bannerImage?: string | null;
    averageScore?: number | null;
    format?: string | null;
    episodes?: number | null;
    [key: string]: any;
  }[];
}) {
  const prefetch = usePrefetchAnime();
  if (!items.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Trending Minggu Ini</Text>
        <Pressable onPress={() => router.push({ pathname: "/search", params: { sort: "TRENDING_DESC", title: "Trending" } } as never)}>
          <Text style={styles.seeAll}>Lihat Semua</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
        {items.slice(0, 12).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              hapticLight();
              prefetch(item.id);
              router.push((`/anime/${item.id}`) as never);
            }}
            style={({ pressed }) => [styles.trendingCard, pressed && styles.pressed]}
          >
            <View style={styles.trendingCardImage}>
              <Image
                source={{ uri: item.coverImage?.extraLarge || item.coverImage?.large || "" }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={0}
                cachePolicy="memory-disk"
              />
              {item.averageScore ? (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>{(item.averageScore / 10).toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.trendingCardTitle} numberOfLines={2}>
              {animeTitle(item as any)}
            </Text>
            <Text style={styles.trendingCardMeta} numberOfLines={1}>
              {titleFacts(item.format, item.episodes, null)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function RailPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.section} accessibilityLabel={`Loading ${title}`}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRail key={i} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const prefetch = usePrefetchAnime();
  const nsfw = useNsfwPreference();
  const isAdultParam = nsfwFilterParam(nsfw.enabled);
  const [notifSheetVisible, setNotifSheetVisible] = useState(false);
  const home = useQuery({
    queryKey: ["home-anime", isAdultParam],
    queryFn: () => getHomeAnime(isAdultParam),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
  const rails = useQuery({
    queryKey: ["home-rails", isAdultParam],
    queryFn: () => getHomeRailAnime(isAdultParam),
    staleTime: 10 * 60_000,
    retry: 2,
    retryDelay: 1_500,
  });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([home.refetch(), rails.refetch()]);
    setRefreshing(false);
  };

  if (home.isPending) {
    return (
      <NativeScreen>
        <InAppEpisodeAlertMonitor />
        <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
        <ScrollView contentContainerStyle={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
          <SkeletonHero />
          <Text style={styles.skeletonRailLabel}>TRENDING</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRailRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRail key={i} />
            ))}
          </ScrollView>
          <Text style={styles.skeletonRailLabel}>POPULER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonRailRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </ScrollView>
        </ScrollView>
        <NotificationSheet visible={notifSheetVisible} onClose={() => setNotifSheetVisible(false)} />
      </NativeScreen>
    );
  }

  if (home.isError || !home.data) {
    return (
      <NativeScreen>
        <InAppEpisodeAlertMonitor />
        <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
        <ErrorState message={home.error?.message ?? "Gagal memuat anime."} onRetry={() => void home.refetch()} />
        <NotificationSheet visible={notifSheetVisible} onClose={() => setNotifSheetVisible(false)} />
      </NativeScreen>
    );
  }

  const hero = home.data.trending[0] ?? null;

  return (
    <NativeScreen>
      <InAppEpisodeAlertMonitor />
      <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={nothing.red} />}
        showsVerticalScrollIndicator={false}
      >
        {hero ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buka ${animeTitle(hero)}`}
            onPress={() => {
              hapticLight();
              prefetch(hero.id);
              router.push((`/anime/${hero.id}`) as never);
            }}
            style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
          >
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackText}>{animeTitle(hero).charAt(0)}</Text>
            </View>
            <Image
              source={{ uri: hero.bannerImage || hero.coverImage?.extraLarge || hero.coverImage?.large || "" }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={0}
              cachePolicy="memory-disk"
            />
            <View style={styles.heroMask} />
            <View style={styles.heroContent}>
              <View style={styles.heroBottom}>
                <View style={styles.heroGenres}>
                  {(hero.genres || []).slice(0, 3).map((g: string) => (
                    <View key={g} style={styles.genreChip}>
                      <Text style={styles.genreChipText}>{g}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {animeTitle(hero)}
                </Text>
                <Text style={styles.heroMeta}>{titleFacts(hero.format, hero.episodes, hero.averageScore)}</Text>
                {hero.description ? (
                  <Text style={styles.heroDesc} numberOfLines={2}>
                    {String(hero.description).replace(/<[^>]+>/g, "")}
                  </Text>
                ) : null}
                <View style={styles.heroActions}>
                  <Pressable
                    style={({ pressed }) => [styles.heroPlayBtn, pressed && styles.pressed]}
                    onPress={() => {
                      hapticLight();
                      prefetch(hero.id);
                      router.push((`/anime/${hero.id}`) as never);
                    }}
                  >
                    <AppIcon name="play" size={16} color={nothing.white} />
                    <Text style={styles.heroPlayText}>Tonton Sekarang</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.heroListBtn, pressed && styles.pressed]}
                    onPress={() => {
                      prefetch(hero.id);
                      router.push((`/anime/${hero.id}`) as never);
                    }}
                  >
                    <AppIcon name="bookmark" size={18} color={nothing.white} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>
        ) : null}

        <ContinueWatchingRail />
        <TrendingGrid items={home.data.trending.slice(1)} />

        {rails.data?.ongoing?.length ? (
          <AnimeRail label="" title="Top Airing" items={rails.data.ongoing} seeAllParams={{ status: "RELEASING", sort: "POPULARITY_DESC", title: "Top Airing" }} />
        ) : rails.isPending ? (
          <RailPlaceholder title="Top Airing" />
        ) : null}

        {home.data.popular.length ? (
          <AnimeRail label="" title="Anime Populer" items={home.data.popular} seeAllParams={{ sort: "POPULARITY_DESC", title: "Anime Populer" }} />
        ) : null}

        {rails.data?.topMovies?.length ? (
          <AnimeRail label="" title="Film Populer" items={rails.data.topMovies} seeAllParams={{ format: "MOVIE", sort: "SCORE_DESC", title: "Film Populer" }} />
        ) : rails.isPending ? (
          <RailPlaceholder title="Film Populer" />
        ) : null}

        {rails.data?.justFinished?.length ? (
          <AnimeRail label="" title="Baru Selesai" items={rails.data.justFinished} seeAllParams={{ status: "FINISHED", sort: "END_DATE_DESC", title: "Baru Selesai" }} />
        ) : rails.isPending ? (
          <RailPlaceholder title="Baru Selesai" />
        ) : null}

        {home.data.upcoming.length ? (
          <AnimeRail label="" title="Segera Tayang" items={home.data.upcoming} seeAllParams={{ status: "NOT_YET_RELEASED", sort: "POPULARITY_DESC", title: "Segera Tayang" }} />
        ) : null}
      </ScrollView>
      <NotificationSheet visible={notifSheetVisible} onClose={() => setNotifSheetVisible(false)} />
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingBottom: 4,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nothing.raised,
    borderWidth: 1,
    borderColor: nothing.line,
  },
  scrollContent: { gap: 22, paddingBottom: 8 },
  skeletonContainer: { gap: 18 },
  skeletonRailLabel: {
    color: nothing.muted,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  skeletonRailRow: { gap: 10 },

  hero: {
    minHeight: 380,
    marginHorizontal: -18,
    overflow: "hidden",
    backgroundColor: nothing.raised,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151923",
  },
  heroFallbackText: { color: nothing.dim, fontSize: 72, fontWeight: "800" },
  heroMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // bottom-heavy gradient simulation
  },
  heroContent: { flex: 1, justifyContent: "flex-end" },
  heroBottom: {
    gap: 8,
    padding: 18,
    paddingTop: 72,
    backgroundColor: "rgba(7,8,13,0.78)",
  },
  heroGenres: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genreChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255,122,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.35)",
  },
  genreChipText: { color: nothing.accent, fontSize: 10, fontWeight: "700" },
  heroTitle: {
    color: nothing.white,
    fontWeight: "800",
    fontSize: 26,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  heroMeta: { color: nothing.muted, fontSize: 12, fontWeight: "600" },
  heroDesc: { color: nothing.muted, fontSize: 13, lineHeight: 18 },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 6, alignItems: "center" },
  heroPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: nothing.red,
  },
  heroPlayText: { color: nothing.white, fontSize: 14, fontWeight: "700" },
  heroListBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  section: { gap: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: nothing.white, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  seeAll: { color: nothing.red, fontSize: 12, fontWeight: "700" },

  continueList: { gap: 12, paddingRight: 4 },
  continueCard: { width: 156, gap: 6 },
  continueImageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: nothing.raised,
  },
  continueImageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151923",
  },
  continueImageFallbackText: { color: nothing.dim, fontSize: 28, fontWeight: "800" },
  continueOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  continuePlayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  continueProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  continueProgressFill: { height: "100%", backgroundColor: nothing.red },
  continueInfo: { gap: 2 },
  continueTitle: { color: nothing.white, fontSize: 13, fontWeight: "700", lineHeight: 16 },
  continueMeta: { color: nothing.dim, fontSize: 11, fontWeight: "600" },

  continueEmpty: { alignItems: "flex-start", paddingVertical: 16, gap: 6 },
  continueEmptyTitle: { color: nothing.white, fontSize: 15, fontWeight: "800" },
  continueEmptyText: { color: nothing.muted, fontSize: 13, lineHeight: 18 },
  browseBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: nothing.red,
  },
  browseBtnText: { color: nothing.white, fontSize: 12, fontWeight: "700" },

  trendingList: { gap: 12, paddingRight: 4 },
  trendingCard: { width: 118, gap: 5 },
  trendingCardImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: nothing.raised,
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  ratingBadgeText: { color: nothing.accent, fontSize: 10, fontWeight: "800" },
  trendingCardTitle: { color: nothing.white, fontSize: 12, fontWeight: "700", lineHeight: 15 },
  trendingCardMeta: { color: nothing.dim, fontSize: 10, fontWeight: "600" },

  pressed: nothing.pressed,
});
