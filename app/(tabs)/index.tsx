import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  currentAnimeSeason,
  getHomeAnime,
  getHomeRailAnime,
} from "@/lib/anilist";
import { nsfwFilterParam, useNsfwPreference } from "@/lib/nsfw-preference";
import { animeTitle, type Anime } from "@/lib/types";
import { hapticLight } from "@/lib/haptics";
import { usePrefetchAnime } from "@/lib/prefetch";
import { AnimeRail } from "@/components/anime-rail";
import { ErrorState } from "@/components/async-state";
import { nothing } from "@/components/nothing-ui";
import {
  SkeletonCard,
  SkeletonRail,
  SkeletonHero,
} from "@/components/skeleton";
import {
  NativeScreen,
  SearchAction,
  NotificationAction,
} from "@/components/screen";
import { NotificationSheet } from "@/components/notification-sheet";
import { AppIcon } from "@/components/app-icon";
import { AnimeKzHeaderLogo } from "@/components/animekz-logo";
import { InAppEpisodeAlertMonitor } from "@/hooks/use-in-app-episode-alerts";
import { useWatchHistory } from "@/hooks/use-watch-history";

function titleFacts(
  format?: string | null,
  episodes?: number | null,
  score?: number | null,
) {
  return [
    format,
    episodes ? `${episodes} EP` : null,
    score ? `${Math.round(score)}%` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function HomeHeader({ onNotif }: { onNotif: () => void }) {
  return (
    <View style={styles.homeHeader}>
      <BlurView pointerEvents="none" intensity={34} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
      <View style={styles.brandLockup}>
        <AnimeKzHeaderLogo width={38} />
        <Text style={styles.brandName}>AnimeKz</Text>
      </View>
      <View style={styles.headerActions}>
        <SearchAction tone="light" />
        <NotificationAction tone="light" onPress={onNotif} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil"
          onPress={() => router.push("/(tabs)/profile" as never)}
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
        >
          <AppIcon name="account" size={18} color="#172B3A" />
        </Pressable>
      </View>
    </View>
  );
}

function HomeBentoShortcuts() {
  const actions = [
    {
      label: "Find your next series",
      caption: "Browse the catalog",
      icon: "globe",
      route: "/(tabs)/catalog",
    },
    {
      label: "Pick for me",
      caption: "Random discovery",
      icon: "shuffle",
      route: "/(tabs)/random",
    },
    {
      label: "What airs next",
      caption: "Weekly schedule",
      icon: "calendar",
      route: "/(tabs)/schedule",
    },
  ];

  return (
    <View style={styles.bentoSection}>
      <View style={styles.bentoHeading}>
        <Text style={styles.bentoEyebrow}>YOUR NEXT MOVE</Text>
        <Text style={styles.bentoTitle}>Explore Animekz</Text>
      </View>
      <View style={styles.bentoGrid}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(actions[0]!.route as never)}
          style={({ pressed }) => [
            styles.bentoCard,
            styles.bentoFeature,
            styles.bentoCardPrimary,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.bentoIcon, styles.bentoIconPrimary]}>
            <AppIcon name={actions[0]!.icon} size={20} color="#172B3A" />
          </View>
          <View style={styles.bentoCopy}>
            <Text style={styles.bentoCardTitle}>{actions[0]!.label}</Text>
            <Text style={styles.bentoCardCaption}>{actions[0]!.caption}</Text>
          </View>
          <AppIcon name="arrow-top-right" size={16} color="#287DBB" />
        </Pressable>
        <View style={styles.bentoSide}>
          {actions.slice(1).map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => [
                styles.bentoCard,
                styles.bentoSmall,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.bentoIconSmall}>
                <AppIcon name={item.icon} size={15} color="#172B3A" />
              </View>
              <View style={styles.bentoCopy}>
                <Text style={styles.bentoCardTitle}>{item.label}</Text>
                <Text style={styles.bentoCardCaption}>{item.caption}</Text>
              </View>
            </Pressable>
          ))}
        </View>
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
  const progress =
    entry.duration && entry.duration > 0
      ? Math.min(100, (entry.progress / entry.duration) * 100)
      : 0;
  const epThumb =
    !epThumbFailed && entry.episode_thumbnail ? entry.episode_thumbnail : null;
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
            <Text style={styles.continueImageFallbackText}>
              {(entry.anime_title || "A").charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.continueOverlay}>
          <View style={styles.continuePlayBadge}>
            <AppIcon name="play" size={12} color={nothing.white} />
          </View>
        </View>
        <View style={styles.continueProgress}>
          <View
            style={[styles.continueProgressFill, { width: `${progress}%` }]}
          />
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
          <Text style={styles.sectionTitle}>Continue Watching</Text>
        </View>
        <View style={styles.continueEmpty}>
          <Text style={styles.continueEmptyTitle}>No watch history yet</Text>
          <Text style={styles.continueEmptyText}>
            Start watching to see your progress here.
          </Text>
          <Pressable
            onPress={() => router.push("/catalog" as never)}
            style={({ pressed }) => [
              styles.browseBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.browseBtnText}>Explore anime</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const recent = history.data.slice(0, 10);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Continue Watching</Text>
        <Pressable onPress={() => router.push("/library" as never)}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.continueList}
      >
        {recent.map((entry) => (
          <ContinueCard
            key={`${entry.anime_id}:${entry.episode_number}`}
            entry={entry}
          />
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
        <Text style={styles.sectionTitle}>Trending Anime</Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/search",
              params: { sort: "TRENDING_DESC", title: "Trending" },
            } as never)
          }
        >
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingList}
      >
        {items.slice(0, 12).map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => {
              hapticLight();
              prefetch(item.id);
              router.push(`/anime/${item.id}` as never);
            }}
            style={({ pressed }) => [
              styles.trendingCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.trendingCardImage}>
              <Image
                source={{
                  uri:
                    item.coverImage?.extraLarge || item.coverImage?.large || "",
                }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={0}
                cachePolicy="memory-disk"
              />
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              {item.averageScore ? (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>
                    {(item.averageScore / 10).toFixed(1)}
                  </Text>
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

function SeasonalPosterGrid({ items }: { items: Anime[] }) {
  const prefetch = usePrefetchAnime();
  return <View style={styles.section}>
    <View style={styles.sectionHead}>
      <View><Text style={styles.sectionEyebrow}>IN SEASON</Text><Text style={styles.sectionTitle}>Popular This Season</Text></View>
      <Pressable onPress={() => router.push({ pathname: "/search", params: { ...currentAnimeSeason(), seasonYear: String(currentAnimeSeason().seasonYear), sort: "POPULARITY_DESC", title: "Popular This Season" } } as never)}><Text style={styles.seeAll}>See all</Text></Pressable>
    </View>
    <View style={styles.seasonGrid}>
      {items.slice(0, 9).map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open ${animeTitle(item)}`} onPress={() => { hapticLight(); prefetch(item.id); router.push(`/anime/${item.id}` as never); }} style={({ pressed }) => [styles.seasonCard, pressed && styles.pressed]}>
        <View style={styles.seasonPoster}>
          <Image source={{ uri: item.coverImage?.extraLarge || item.coverImage?.large || "" }} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} cachePolicy="memory-disk" />
          {item.averageScore ? <View style={styles.seasonScore}><Text style={styles.seasonScoreText}>★ {(item.averageScore / 10).toFixed(1)}</Text></View> : null}
        </View>
        <Text style={styles.seasonTitle} numberOfLines={2}>{animeTitle(item)}</Text>
        <Text style={styles.seasonMeta} numberOfLines={1}>{[item.format, item.episodes ? `${item.episodes} EP` : null, item.genres?.[0]].filter(Boolean).join(" · ")}</Text>
      </Pressable>)}
    </View>
  </View>;
}

function RailPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.section} accessibilityLabel={`Loading ${title}`}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingList}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRail key={i} />
        ))}
      </ScrollView>
    </View>
  );
}

function GenreQuickBrowse() {
  const genres = ["Action", "Romance", "Fantasy", "Comedy", "Adventure", "Drama"];
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Browse by mood</Text><Text style={styles.sectionEyebrow}>GENRES</Text></View>
      <View style={styles.genreBrowseGrid}>
        {genres.map((genre) => <Pressable key={genre} accessibilityRole="button" onPress={() => router.push({ pathname: "/search", params: { genre } } as never)} style={({ pressed }) => [styles.genreBrowseChip, pressed && styles.pressed]}>
          <Text style={styles.genreBrowseText}>{genre}</Text><AppIcon name="arrow-top-right" size={14} color="#3985F5" />
        </Pressable>)}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const prefetch = usePrefetchAnime();
  const nsfw = useNsfwPreference();
  const isAdultParam = nsfwFilterParam(nsfw.enabled);
  const [notifSheetVisible, setNotifSheetVisible] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
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
      <NativeScreen scroll={false} tone="light">
        <InAppEpisodeAlertMonitor />
        <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
        <ScrollView
          contentContainerStyle={[styles.skeletonContainer, styles.scrollPad]}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonHero />
          <Text style={styles.skeletonRailLabel}>TRENDING</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skeletonRailRow}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRail key={i} />
            ))}
          </ScrollView>
          <Text style={styles.skeletonRailLabel}>POPULER</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skeletonRailRow}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </ScrollView>
        </ScrollView>
        <NotificationSheet
          visible={notifSheetVisible}
          onClose={() => setNotifSheetVisible(false)}
        />
      </NativeScreen>
    );
  }

  if (home.isError || !home.data) {
    return (
      <NativeScreen scroll={false} tone="light" style={styles.flexPad}>
        <InAppEpisodeAlertMonitor />
        <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
        <ErrorState
          message={home.error?.message ?? "Could not load anime."}
          onRetry={() => void home.refetch()}
        />
        <NotificationSheet
          visible={notifSheetVisible}
          onClose={() => setNotifSheetVisible(false)}
        />
      </NativeScreen>
    );
  }

  const featured = home.data.trending.slice(0, 5);
  const hero = featured[featuredIndex] ?? featured[0] ?? null;

  return (
    <NativeScreen scroll={false} tone="light">
      <InAppEpisodeAlertMonitor />
      <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, styles.scrollPad]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3985F5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {hero ? (
          <View style={styles.hero}>
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackText}>
                {animeTitle(hero).charAt(0)}
              </Text>
            </View>
            <Image
              key={hero.id}
              source={{
                uri:
                  hero.bannerImage ||
                  hero.coverImage?.extraLarge ||
                  hero.coverImage?.large ||
                  "",
              }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={240}
              cachePolicy="memory-disk"
            />
            <View style={styles.heroMask} />
            <View style={styles.heroContent}>
              <View style={styles.heroBottom}>
                <View style={styles.trendingBadge}>
                  <AppIcon name="fire" size={13} color="#FFFFFF" />
                  <Text style={styles.trendingBadgeText}>TRENDING #{featuredIndex + 1}</Text>
                </View>
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
                <Text style={styles.heroMeta}>
                  {[
                    hero.season
                      ? `${hero.season}${hero.seasonYear ? ` ${hero.seasonYear}` : ""}`
                      : null,
                    hero.status === "RELEASING" ? "ONGOING" : hero.status === "FINISHED" ? "COMPLETED" : hero.status,
                    hero.episodes ? `${hero.episodes} Episodes` : null,
                    hero.averageScore
                      ? `${Math.round(hero.averageScore)}%`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                {hero.description ? (
                  <Text style={styles.heroDesc} numberOfLines={2}>
                    {String(hero.description).replace(/<[^>]+>/g, "")}
                  </Text>
                ) : null}
                <View style={styles.heroActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Watch now"
                    style={({ pressed }) => [
                      styles.heroPlayBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      hapticLight();
                      prefetch(hero.id);
                      // Let the anime detail screen resolve the latest
                      // available/resume episode before entering the player.
                      router.push(`/anime/${hero.id}` as never);
                    }}
                  >
                    <AppIcon name="play" size={19} color="#FFFFFF" />
                    <Text style={styles.heroActionText}>WATCH NOW</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${animeTitle(hero)}`}
                    style={({ pressed }) => [
                      styles.heroDetailBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      prefetch(hero.id);
                      router.push(`/anime/${hero.id}` as never);
                    }}
                  >
                    <AppIcon name="information" size={17} color="#172B45" />
                    <Text style={styles.heroDetailText}>DETAILS</Text>
                  </Pressable>
                </View>
                {featured.length > 1 ? <View style={styles.heroIndicators} accessibilityLabel="Featured anime">
                  {featured.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Feature ${index + 1}: ${animeTitle(item)}`} accessibilityState={{ selected: featuredIndex === index }} onPress={() => setFeaturedIndex(index)} style={[styles.heroIndicator, featuredIndex === index && styles.heroIndicatorActive]} />)}
                </View> : null}
              </View>
            </View>
          </View>
        ) : null}

        <ContinueWatchingRail />
        <GenreQuickBrowse />
        <HomeBentoShortcuts />
        <TrendingGrid items={home.data.trending} />

        {rails.data?.ongoing?.length ? (
          <AnimeRail
            label=""
            title="Top Airing"
            items={rails.data.ongoing}
            light
            seeAllParams={{
              status: "RELEASING",
              sort: "POPULARITY_DESC",
              title: "Top Airing",
            }}
          />
        ) : rails.isPending ? (
          <RailPlaceholder title="Top Airing" />
        ) : null}

        {home.data.seasonal.length ? (
          <SeasonalPosterGrid items={home.data.seasonal} />
        ) : null}

        {home.data.popular.length ? (
          <AnimeRail
            label=""
            title="Recommended Anime"
            items={home.data.popular}
            light
            seeAllParams={{
              sort: "POPULARITY_DESC",
              title: "Recommended Anime",
            }}
          />
        ) : null}

        {rails.data?.topMovies?.length ? (
          <AnimeRail
            label=""
            title="Popular Movies"
            items={rails.data.topMovies}
            light
            seeAllParams={{
              format: "MOVIE",
              sort: "SCORE_DESC",
              title: "Popular Movies",
            }}
          />
        ) : rails.isPending ? (
          <RailPlaceholder title="Popular Movies" />
        ) : null}

        {rails.data?.justFinished?.length ? (
          <AnimeRail
            label=""
            title="Recently Completed"
            items={rails.data.justFinished}
            light
            seeAllParams={{
              status: "FINISHED",
              sort: "END_DATE_DESC",
              title: "Recently Completed",
            }}
          />
        ) : rails.isPending ? (
          <RailPlaceholder title="Recently Completed" />
        ) : null}

        {home.data.upcoming.length ? (
          <AnimeRail
            label=""
            title="Coming Soon"
            items={home.data.upcoming}
            light
            seeAllParams={{
              status: "NOT_YET_RELEASED",
              sort: "POPULARITY_DESC",
              title: "Coming Soon",
            }}
          />
        ) : null}
      </ScrollView>
      <NotificationSheet
        visible={notifSheetVisible}
        onClose={() => setNotifSheetVisible(false)}
      />
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(198,221,245,0.85)",
    elevation: 3,
  },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: {
    color: "#172B45",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF5FF",
    borderWidth: 1,
    borderColor: "#C6DDF5",
  },
  scrollContent: { gap: 23, paddingBottom: 8, backgroundColor: "#F5F9FF" },
  skeletonContainer: { gap: 18 },
  skeletonRailLabel: {
    color: nothing.muted,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  skeletonRailRow: { gap: 10 },

  hero: {
    height: 350,
    minHeight: 350,
    marginHorizontal: -18,
    overflow: "hidden",
    backgroundColor: "#172B45",
    borderRadius: 24,
    marginTop: -2,
    borderWidth: 1,
    borderColor: "#C6DDF5",
    elevation: 5,
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nothing.elevated,
  },
  heroFallbackText: { color: nothing.dim, fontSize: 72, fontWeight: "800" },
  heroMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,35,62,0.28)",
  },
  heroContent: { flex: 1, justifyContent: "flex-end" },
  heroBottom: {
    gap: 8,
    padding: 18,
    paddingTop: 100,
    backgroundColor: "rgba(13,35,62,0.78)",
  },
  trendingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#3985F5",
  },
  trendingBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroGenres: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genreChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "#C6DDF5",
  },
  genreChipText: { color: "#172B45", fontSize: 10, fontWeight: "800" },
  heroTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 25,
  },
  heroMeta: { color: "#E6F1FF", fontSize: 12, fontWeight: "700" },
  heroDesc: { color: "#E6F1FF", fontSize: 13, lineHeight: 18 },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heroPlayBtn: {
    minWidth: 150,
    height: 46,
    flexDirection: "row",
    paddingHorizontal: 15,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#3985F5",
    borderWidth: 2,
    borderColor: "#172B45",
    elevation: 4,
  },
  heroActionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.55 },
  heroDetailBtn: { minWidth: 116, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1.5, borderColor: "#FFFFFF" },
  heroDetailText: { color: "#172B45", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  heroIndicators: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 },
  heroIndicator: { height: 6, width: 6, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.55)" },
  heroIndicatorActive: { width: 22, backgroundColor: "#8CCAFF" },

  section: { gap: 12 },
  sectionEyebrow: { color: "#71839A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  seasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  seasonCard: { flexBasis: "30%", flexGrow: 1, maxWidth: "32%", gap: 5, padding: 5, borderWidth: 1, borderColor: "#C6DDF5", borderRadius: 14, backgroundColor: "#FFFFFF" },
  seasonPoster: { width: "100%", aspectRatio: 3 / 4, overflow: "hidden", borderRadius: 10, backgroundColor: "#EAF5FF" },
  seasonScore: { position: "absolute", top: 5, right: 5, paddingHorizontal: 5, paddingVertical: 3, borderWidth: 1, borderColor: "#C6DDF5", borderRadius: 7, backgroundColor: "rgba(255,255,255,0.93)" },
  seasonScoreText: { color: "#172B45", fontSize: 9, fontWeight: "900" },
  seasonTitle: { color: "#172B45", fontSize: 11, fontWeight: "800", lineHeight: 14 },
  seasonMeta: { color: "#71839A", fontSize: 9, fontWeight: "600" },
  genreBrowseGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreBrowseChip: { minHeight: 40, minWidth: "30%", flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7, paddingHorizontal: 11, borderWidth: 1, borderColor: "#C6DDF5", borderRadius: 13, backgroundColor: "#FFFFFF", elevation: 1 },
  genreBrowseText: { color: "#172B45", fontSize: 12, fontWeight: "800" },
  bentoSection: { gap: 12 },
  bentoHeading: { gap: 2 },
  bentoEyebrow: {
    color: "#3985F5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  bentoTitle: {
    color: "#172B45",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.55,
  },
  bentoGrid: { flexDirection: "row", alignItems: "stretch", gap: 10 },
  bentoCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#C6DDF5",
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#172B45",
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 2,
  },
  bentoFeature: { flex: 1.08, minHeight: 178, flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between" },
  bentoSide: { flex: 0.92, justifyContent: "space-between", gap: 10 },
  bentoSmall: { flex: 1, minHeight: 82, gap: 7, padding: 8 },
  bentoCardPrimary: { backgroundColor: "#8CCAFF", borderColor: "#172B45" },
  bentoIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(38,55,70,0.16)",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  bentoIconPrimary: { width: 42, height: 42, borderRadius: 14 },
  bentoIconSmall: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.72)" },
  bentoCopy: { flex: 1, gap: 3 },
  bentoCardTitle: { color: "#172B45", fontSize: 12, fontWeight: "800", lineHeight: 15 },
  bentoCardCaption: { color: "#526C7E", fontSize: 10, fontWeight: "600" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#172B45",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAll: {
    color: "#3985F5",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#EAF5FF",
  },

  continueList: { gap: 12, paddingRight: 4 },
  continueCard: { width: 168, gap: 7 },
  continueImageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: nothing.raised,
    borderWidth: 1,
    borderColor: "#C6DDF5",
  },
  continueImageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nothing.elevated,
  },
  continueImageFallbackText: {
    color: "#71869A",
    fontSize: 28,
    fontWeight: "800",
  },
  continueOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  continuePlayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(57,133,245,0.94)",
  },
  continueProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  continueProgressFill: { height: "100%", backgroundColor: "#3985F5" },
  continueInfo: { gap: 2, paddingHorizontal: 2 },
  continueTitle: {
    color: "#172B45",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  continueMeta: { color: "#71839A", fontSize: 11, fontWeight: "600" },

  continueEmpty: { alignItems: "flex-start", paddingVertical: 16, gap: 6 },
  continueEmptyTitle: { color: "#172B45", fontSize: 15, fontWeight: "800" },
  continueEmptyText: { color: "#71839A", fontSize: 13, lineHeight: 18 },
  browseBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#3985F5",
  },
  browseBtnText: { color: nothing.white, fontSize: 12, fontWeight: "700" },

  trendingList: { gap: 12, paddingRight: 4 },
  trendingCard: { width: 136, gap: 7 },
  trendingCardImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EAF5FF",
    borderWidth: 1,
    borderColor: "#C6DDF5",
  },
  rankBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#172B45",
    borderWidth: 1,
    borderColor: "#8CCAFF",
  },
  rankBadgeText: {
    color: "#8CCAFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    fontFamily: nothing.mono,
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#C6DDF5",
  },
  ratingBadgeText: { color: "#172B45", fontSize: 10, fontWeight: "900" },
  trendingCardTitle: {
    color: "#172B45",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },
  trendingCardMeta: { color: "#71839A", fontSize: 10, fontWeight: "600" },

  scrollPad: {
    paddingHorizontal: 18,
    paddingBottom: 128,
    backgroundColor: "#F5F9FF",
  },
  flexPad: {
    paddingHorizontal: 18,
    paddingBottom: 128,
    backgroundColor: "#F5F9FF",
  },
  pressed: nothing.pressed,
});
