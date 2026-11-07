import { useEffect, useRef, useState, type ReactNode } from "react";
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
  TextInput,
  View,
  useWindowDimensions,
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
import { NativeScreen } from "@/components/screen";
import { NotificationSheet } from "@/components/notification-sheet";
import { AppIcon } from "@/components/app-icon";
import { AnimeKzHeaderLogo } from "@/components/animekz-logo";
import { InAppEpisodeAlertMonitor } from "@/hooks/use-in-app-episode-alerts";
import { useWatchHistory } from "@/hooks/use-watch-history";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Clapperboard,
  Compass,
  Flame,
  LayoutGrid,
  Play,
  RotateCw,
  Search,
  SlidersHorizontal,
  Star,
  UserRound,
} from "lucide-react-native";

const UI = {
  primary: "#168BFF",
  lightBlue: "#D9EEFF",
  background: "#F2F8FF",
  surface: "#FFFFFF",
  text: "#102B50",
  secondary: "#647C9B",
  border: "#D6E8FA",
} as const;

const CATEGORIES = [
  { key: "home", label: "Home" },
  { key: "anime", label: "Anime" },
  { key: "anime-movie", label: "Anime Movie" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

type AnimeFilter = "all" | "upcoming" | "updating";

const FILTERS = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "upcoming", label: "Upcoming", icon: CalendarDays },
  { key: "updating", label: "Updating", icon: RotateCw },
] as const;

function FilterBar({
  value,
  onChange,
}: {
  value: AnimeFilter;
  onChange: (next: AnimeFilter) => void;
}) {
  return (
    <View style={styles.filterRow}>
      {FILTERS.map((filter) => {
        const active = value === filter.key;
        const Icon = filter.icon;
        return (
          <Pressable
            key={filter.key}
            accessibilityRole="button"
            accessibilityLabel={filter.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              hapticLight();
              onChange(filter.key);
            }}
            style={({ pressed }) => [
              styles.filterChip,
              active && styles.filterChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              size={15}
              color={active ? UI.primary : UI.secondary}
              strokeWidth={2.3}
            />
            <Text
              style={[
                styles.filterText,
                active && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HeaderIconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerIconBtn,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function HomeHeader({ onNotif }: { onNotif: () => void }) {
  return (
    <View style={styles.homeHeader}>
      <BlurView
        pointerEvents="none"
        intensity={40}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.brandLockup}>
        <AnimeKzHeaderLogo width={34} />
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>AnimeKz</Text>
          <Text style={styles.brandTagline}>Watch. Stream. Enjoy.</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <HeaderIconButton
          label="Cari anime"
          onPress={() => router.push("/search" as never)}
        >
          <Search size={18} color={UI.primary} strokeWidth={2.4} />
        </HeaderIconButton>
        <HeaderIconButton label="Notifikasi" onPress={onNotif}>
          <Bell size={18} color={UI.text} strokeWidth={2.2} />
        </HeaderIconButton>
        <HeaderIconButton
          label="Profil"
          onPress={() => router.push("/(tabs)/profile" as never)}
        >
          <UserRound size={18} color={UI.text} strokeWidth={2.2} />
        </HeaderIconButton>
      </View>
    </View>
  );
}

function CategoryPills() {
  const openCategory = (key: CategoryKey) => {
    if (key === "home") {
      router.replace("/(tabs)" as never);
      return;
    }
    hapticLight();
    if (key === "anime") {
      router.push("/(tabs)/catalog" as never);
      return;
    }
    router.push({
      pathname: "/search",
      params: { format: "MOVIE", sort: "SCORE_DESC", title: "Anime Movie" },
    } as never);
  };

  return (
    <View style={styles.categoryRow}>
      {CATEGORIES.map((category) => {
        const active = category.key === "home";
        return (
          <Pressable
            key={category.key}
            accessibilityRole="button"
            accessibilityLabel={category.label}
            accessibilityState={{ selected: active }}
            onPress={() => openCategory(category.key)}
            style={({ pressed }) => [
              styles.categoryPill,
              active && styles.categoryPillActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                active && styles.categoryTextActive,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeSearchBar() {
  const [value, setValue] = useState("");

  const submit = () => {
    hapticLight();
    const query = value.trim();
    router.push({
      pathname: "/search",
      params: query ? { q: query } : {},
    } as never);
  };

  return (
    <View style={styles.searchBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cari anime"
        onPress={submit}
        hitSlop={8}
      >
        <Search size={19} color={UI.primary} strokeWidth={2.4} />
      </Pressable>
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        placeholder="Cari anime favoritmu..."
        placeholderTextColor={UI.secondary}
        returnKeyType="search"
        style={styles.searchInput}
        accessibilityLabel="Cari anime favoritmu"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filter pencarian"
        onPress={() => router.push("/search" as never)}
        style={({ pressed }) => [
          styles.filterBtn,
          pressed && styles.pressed,
        ]}
      >
        <SlidersHorizontal size={18} color="#FFFFFF" strokeWidth={2.3} />
      </Pressable>
    </View>
  );
}

function heroChips(anime: Anime) {
  return [
    anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null,
    anime.seasonYear ? String(anime.seasonYear) : null,
    anime.episodes ? `${anime.episodes} Episodes` : null,
  ].filter(Boolean) as string[];
}

function HeroCarousel({ items }: { items: Anime[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = Math.max(1, width - 36);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefetch = usePrefetchAnime();

  useEffect(() => {
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setTimeout(() => {
      const next = (activeIndex + 1) % items.length;
      scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
      setActiveIndex(next);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeIndex, items.length, slideWidth]);

  if (!items.length) return null;

  return (
    <View style={styles.heroSection}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        snapToInterval={slideWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        style={styles.heroScroller}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(
            event.nativeEvent.contentOffset.x / slideWidth,
          );
          if (next >= 0 && next < items.length) setActiveIndex(next);
        }}
      >
        {items.map((item, index) => {
          const image = item.bannerImage || "";
          const description = item.description
            ? String(item.description)
                .replace(/<[^>]+>/g, " ")
                .replace(/&[a-z]+;/gi, " ")
                .replace(/\s+/g, " ")
                .trim()
            : "";
          return (
            <View
              key={item.id}
              style={[styles.heroSlide, { width: slideWidth }]}
            >
              <View style={styles.heroFallback} />
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={220}
                  cachePolicy="memory-disk"
                />
              ) : null}
              <View style={styles.heroScrim} />
              <View style={styles.heroTopRow}>
                <View style={styles.trendingBadge}>
                  <Flame size={12} color="#FFFFFF" strokeWidth={2.6} />
                  <Text style={styles.trendingBadgeText}>TRENDING</Text>
                </View>
                <View style={styles.heroCounter}>
                  <Text style={styles.heroCounterText}>
                    {index + 1}/{items.length}
                  </Text>
                </View>
              </View>
              <View style={styles.heroBottom}>
                <View style={styles.heroMetaRow}>
                  {heroChips(item).map((chip, chipIndex) => (
                    <View
                      key={`${item.id}:${chipIndex}`}
                      style={styles.heroChip}
                    >
                      {chipIndex === 0 && item.averageScore ? (
                        <Star size={11} color={UI.primary} strokeWidth={2.6} />
                      ) : null}
                      <Text style={styles.heroChipText}>{chip}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {animeTitle(item)}
                </Text>
                {description ? (
                  <Text style={styles.heroDesc} numberOfLines={2}>
                    {description}
                  </Text>
                ) : null}
                <View style={styles.heroActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Tonton ${animeTitle(item)}`}
                    onPress={() => {
                      hapticLight();
                      prefetch(item.id);
                      router.push(`/anime/${item.id}` as never);
                    }}
                    style={({ pressed }) => [
                      styles.heroPlayBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Play
                      size={15}
                      color="#FFFFFF"
                      fill="#FFFFFF"
                      strokeWidth={2}
                    />
                    <Text style={styles.heroActionText}>Tonton</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Detail ${animeTitle(item)}`}
                    onPress={() => {
                      prefetch(item.id);
                      router.push(`/anime/${item.id}` as never);
                    }}
                    style={({ pressed }) => [
                      styles.heroDetailBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Bookmark size={15} color={UI.primary} strokeWidth={2.3} />
                    <Text style={styles.heroDetailText}>Bookmark</Text>
                  </Pressable>
                </View>
                <View
                  style={styles.heroIndicators}
                  accessibilityLabel="Slide banner"
                >
                  {items.map((slide, slideIndex) => (
                    <Pressable
                      key={slide.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Slide ${slideIndex + 1}: ${animeTitle(slide)}`}
                      accessibilityState={{
                        selected: activeIndex === slideIndex,
                      }}
                      onPress={() => {
                        hapticLight();
                        scrollRef.current?.scrollTo({
                          x: slideIndex * slideWidth,
                          animated: true,
                        });
                        setActiveIndex(slideIndex);
                      }}
                      style={[
                        styles.heroIndicator,
                        activeIndex === slideIndex &&
                          styles.heroIndicatorActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function QuickShortcuts() {
  const shortcuts: Array<{
    key: string;
    label: string;
    icon: typeof Flame;
    params?: Record<string, string>;
  }> = [
    { key: "genre", label: "Genre", icon: Compass },
    {
      key: "popular",
      label: "Populer",
      icon: Flame,
      params: { sort: "POPULARITY_DESC", title: "Anime Populer" },
    },
    {
      key: "top-rated",
      label: "Top Rated",
      icon: Star,
      params: { sort: "SCORE_DESC", title: "Top Rated" },
    },
    {
      key: "terbaru",
      label: "Terbaru",
      icon: CalendarDays,
      params: { status: "RELEASING", sort: "POPULARITY_DESC", title: "Terbaru" },
    },
    {
      key: "movie",
      label: "Movie",
      icon: Clapperboard,
      params: { format: "MOVIE", sort: "SCORE_DESC", title: "Anime Movie" },
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.shortcutRow}
    >
      {shortcuts.map((shortcut) => {
        const Icon = shortcut.icon;
        return (
          <Pressable
            key={shortcut.key}
            accessibilityRole="button"
            accessibilityLabel={shortcut.label}
            onPress={() => {
              hapticLight();
              if (!shortcut.params) {
                router.push("/(tabs)/catalog" as never);
                return;
              }
              router.push({
                pathname: "/search",
                params: shortcut.params,
              } as never);
            }}
            style={({ pressed }) => [
              styles.shortcutCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.shortcutIcon}>
              <Icon size={17} color={UI.primary} strokeWidth={2.3} />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={1}>
              {shortcut.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
          <Text style={styles.seeAll}>Lihat Semua</Text>
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

function RailPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.section} accessibilityLabel={`Loading ${title}`}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.skeletonRailRow}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRail key={i} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
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
  const [animeFilter, setAnimeFilter] = useState<AnimeFilter>("all");

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([home.refetch(), rails.refetch()]);
    setRefreshing(false);
  };

  if (home.isPending) {
    return (
      <NativeScreen
        scroll={false}
        tone="light"
        background={UI.background}
      >
        <InAppEpisodeAlertMonitor />
        <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
        <ScrollView
          contentContainerStyle={[styles.skeletonContainer, styles.scrollPad]}
          showsVerticalScrollIndicator={false}
        >
          <CategoryPills />
          <HomeSearchBar />
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
      <NativeScreen
        scroll={false}
        tone="light"
        background={UI.background}
        style={styles.flexPad}
      >
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

  const featured = home.data.trending
    .filter((item) => Boolean(item.bannerImage))
    .slice(0, 5);

  const topPool = [
    ...home.data.trending,
    ...home.data.popular,
    ...home.data.seasonal,
    ...home.data.upcoming,
    ...(rails.data?.ongoing ?? []),
  ];
  const seenTop = new Set<number>();
  const topItems = topPool
    .filter((item) => {
      if (seenTop.has(item.id)) return false;
      seenTop.add(item.id);
      return true;
    })
    .filter((item) => {
      if (animeFilter === "all") return true;
      return (
        item.status ===
        (animeFilter === "upcoming" ? "NOT_YET_RELEASED" : "RELEASING")
      );
    })
    .sort((a, b) => {
      const scoreDiff = (b.averageScore ?? 0) - (a.averageScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    })
    .slice(0, 10);

  const season = currentAnimeSeason();
  const topSeeAllParams =
    animeFilter === "upcoming"
      ? {
          status: "NOT_YET_RELEASED",
          sort: "POPULARITY_DESC",
          title: "Upcoming",
        }
      : animeFilter === "updating"
        ? { status: "RELEASING", sort: "POPULARITY_DESC", title: "Updating" }
        : { sort: "SCORE_DESC", title: "Pilihan Teratas" };

  return (
    <NativeScreen
      scroll={false}
      tone="light"
      background={UI.background}
    >
      <InAppEpisodeAlertMonitor />
      <HomeHeader onNotif={() => setNotifSheetVisible(true)} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, styles.scrollPad]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={UI.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <CategoryPills />
        <HomeSearchBar />
        <HeroCarousel items={featured} />
        <QuickShortcuts />
        <FilterBar value={animeFilter} onChange={setAnimeFilter} />
        {topItems.length ? (
          <AnimeRail
            label=""
            title="Pilihan Teratas"
            items={topItems}
            light
            ranked
            seeAllLabel="Lihat Semua"
            showSeeAllIcon
            seeAllParams={topSeeAllParams}
          />
        ) : (
          <View style={styles.filterEmpty}>
            <Text style={styles.filterEmptyText}>
              Tidak ada anime untuk filter ini.
            </Text>
          </View>
        )}

        {home.data.seasonal.length ? (
          <AnimeRail
            label=""
            title="Rilis Baru"
            items={home.data.seasonal}
            light
            seeAllLabel="Lihat Semua"
            showSeeAllIcon
            seeAllParams={{
              season: season.season,
              seasonYear: String(season.seasonYear),
              sort: "POPULARITY_DESC",
              title: "Rilis Baru",
            }}
          />
        ) : null}

        {home.data.popular.length ? (
          <AnimeRail
            label=""
            title="Anime Populer"
            items={home.data.popular}
            light
            seeAllLabel="Lihat Semua"
            showSeeAllIcon
            seeAllParams={{
              sort: "POPULARITY_DESC",
              title: "Anime Populer",
            }}
          />
        ) : null}

        {home.data.trending.length ? (
          <AnimeRail
            label=""
            title="Sedang Trending"
            items={home.data.trending}
            light
            seeAllLabel="Lihat Semua"
            showSeeAllIcon
            seeAllParams={{
              sort: "TRENDING_DESC",
              title: "Sedang Trending",
            }}
          />
        ) : null}

        {rails.data?.ongoing?.length ? (
          <AnimeRail
            label=""
            title="Anime Terbaru"
            items={rails.data.ongoing}
            light
            seeAllLabel="Lihat Semua"
            showSeeAllIcon
            seeAllParams={{
              status: "RELEASING",
              sort: "POPULARITY_DESC",
              title: "Anime Terbaru",
            }}
          />
        ) : rails.isPending ? (
          <RailPlaceholder title="Anime Terbaru" />
        ) : null}

        {rails.data?.topMovies?.length ? (
          <AnimeRail
            label=""
            title="Anime Movie"
            items={rails.data.topMovies}
            light
            seeAllLabel="Lihat Semua"
            showSeeAllIcon
            seeAllParams={{
              format: "MOVIE",
              sort: "SCORE_DESC",
              title: "Anime Movie",
            }}
          />
        ) : rails.isPending ? (
          <RailPlaceholder title="Anime Movie" />
        ) : null}

        <ContinueWatchingRail />
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
    minHeight: 58,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(214,232,250,0.95)",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandCopy: { gap: 1 },
  brandName: {
    color: "#102B50",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 22,
  },
  brandTagline: {
    color: "#647C9B",
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryPill: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D9EEFF",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  categoryPillActive: {
    backgroundColor: "#168BFF",
    borderColor: "#168BFF",
    shadowColor: "#168BFF",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryText: {
    color: "#647C9B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  categoryTextActive: { color: "#FFFFFF" },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterChip: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#D9EEFF",
    borderColor: "#A9D4FB",
  },
  filterText: {
    color: "#647C9B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  filterTextActive: { color: "#168BFF" },
  filterEmpty: {
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  filterEmptyText: {
    color: "#647C9B",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  searchBar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "#D9EEFF",
  },
  searchInput: {
    flex: 1,
    minHeight: 50,
    color: "#102B50",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#168BFF",
    shadowColor: "#168BFF",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  scrollContent: { gap: 20, paddingBottom: 8, backgroundColor: "#F2F8FF" },
  skeletonContainer: { gap: 18 },
  skeletonRailLabel: {
    color: nothing.muted,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  skeletonRailRow: { gap: 10 },

  heroSection: { marginTop: 2 },
  heroScroller: { borderRadius: 24, overflow: "hidden" },
  heroSlide: {
    height: 458,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#D9EEFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D9EEFF",
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16,43,80,0.18)",
  },
  heroTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#168BFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  trendingBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  heroCounter: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(214,232,250,0.95)",
  },
  heroCounterText: {
    color: "#102B50",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroBottom: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    gap: 7,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(214,232,250,0.98)",
    shadowColor: "#102B50",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTitle: {
    color: "#102B50",
    fontWeight: "900",
    fontSize: 23,
    letterSpacing: -0.6,
    lineHeight: 27,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(217,238,255,0.95)",
    borderWidth: 1,
    borderColor: "#D6E8FA",
  },
  heroChipText: {
    color: "#102B50",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroDesc: {
    color: "#647C9B",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heroPlayBtn: {
    minWidth: 96,
    minHeight: 42,
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#168BFF",
    shadowColor: "#168BFF",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  heroDetailBtn: {
    minWidth: 92,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: "#D9EEFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
  },
  heroDetailText: {
    color: "#102B50",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  heroIndicators: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 3,
  },
  heroIndicator: {
    height: 5,
    width: 5,
    borderRadius: 3,
    backgroundColor: "#BCD7F0",
  },
  heroIndicatorActive: { width: 20, backgroundColor: "#168BFF" },

  section: { gap: 12 },
  shortcutRow: { gap: 9, paddingRight: 4 },
  shortcutCard: {
    width: 84,
    alignItems: "center",
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#D9EEFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
  },
  shortcutLabel: {
    color: "#102B50",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#102B50",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  seeAll: {
    color: "#168BFF",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#D9EEFF",
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
    borderColor: "#D6E8FA",
  },
  continueImageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nothing.elevated,
  },
  continueImageFallbackText: {
    color: "#647C9B",
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
    backgroundColor: "#168BFF",
  },
  continueProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  continueProgressFill: { height: "100%", backgroundColor: "#168BFF" },
  continueInfo: { gap: 2, paddingHorizontal: 2 },
  continueTitle: {
    color: "#102B50",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  continueMeta: { color: "#647C9B", fontSize: 11, fontWeight: "600" },

  continueEmpty: { alignItems: "flex-start", paddingVertical: 16, gap: 6 },
  continueEmptyTitle: { color: "#102B50", fontSize: 15, fontWeight: "700" },
  continueEmptyText: { color: "#647C9B", fontSize: 13, lineHeight: 18 },
  browseBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#168BFF",
  },
  browseBtnText: { color: nothing.white, fontSize: 12, fontWeight: "700" },

  scrollPad: {
    paddingHorizontal: 18,
    paddingBottom: 128,
    backgroundColor: "#F2F8FF",
  },
  flexPad: {
    paddingHorizontal: 18,
    paddingBottom: 128,
    backgroundColor: "#F2F8FF",
  },
  pressed: nothing.pressed,
});
