import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { getAnimeById, getRecommendations } from "@/lib/anilist";
import { parseRouteId } from "@/lib/route-params";
import { getEpisodes } from "@/lib/aniraku-api";
import { enrichEpisodesWithTmdb } from "@/lib/tmdb-episodes";
import { groupAnimeRelations } from "@/lib/anime-relations";
import { animeTitle } from "@/lib/types";
import { chooseResumeEpisode } from "@/lib/watch-progress";
import { episodePageCount, episodePageSlice } from "@/lib/watch-engine";
import { isWideLayout } from "@/lib/up-next";
import { useAnirakuAuth } from "@/providers/auth-provider";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useEpisodeRatings } from "@/hooks/use-episode-ratings";
import { useNotifyMe } from "@/hooks/use-notify-me";
import { useWatchHistory } from "@/hooks/use-watch-history";
import { AnimeComments } from "@/components/anime-comments";
import { ErrorState } from "@/components/async-state";
import { AnimeDetailSkeleton, SkeletonEpisode } from "@/components/skeleton";
import { AppIcon } from "@/components/app-icon";
import { AiringSchedule } from "@/components/airing-schedule";
import { DotLabel, NothingButton, nothing } from "@/components/nothing-ui";
import { NativeHeader, NativeScreen } from "@/components/screen";

export default function AnimeDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  // Malformed deep links used to hang on the loading skeleton forever:
  // disabled queries never leave `isPending`. -1 keeps query keys typed
  // while every query stays disabled; the invalid branch below renders.
  const id = parseRouteId(params.id) ?? -1;
  const invalidId = id <= 0;
  const auth = useAnirakuAuth();
  const anime = useQuery({
    queryKey: ["anime", id],
    queryFn: () => getAnimeById(id),
    enabled: !invalidId,
  });
  const episodes = useQuery({
    queryKey: ["episodes", id],
    queryFn: () => getEpisodes(id),
    enabled: !invalidId,
  });
  const canonicalEpisodeRows = useMemo(
    () => episodes.data ?? [],
    [episodes.data],
  );
  const episodeSignature = useMemo(
    () =>
      canonicalEpisodeRows
        .map(
          (item) =>
            `${item.number}:${item.title ?? ""}:${item.thumbnail ?? ""}`,
        )
        .join("|"),
    [canonicalEpisodeRows],
  );
  const fallbackThumbnail =
    anime.data?.bannerImage ||
    anime.data?.coverImage?.extraLarge ||
    anime.data?.coverImage?.large ||
    "";
  const fallbackTitle = anime.data ? animeTitle(anime.data) : "";
  const tmdbEpisodes = useQuery({
    queryKey: [
      "tmdb-episode-display",
      id,
      episodeSignature,
      fallbackThumbnail,
      fallbackTitle,
      anime.data?.format,
    ],
    queryFn: () =>
      enrichEpisodesWithTmdb(id, canonicalEpisodeRows, {
        fallbackThumbnail,
        fallbackTitle,
        isMovie: anime.data?.format === "MOVIE",
      }),
    enabled:
      Number.isFinite(id) &&
      id > 0 &&
      episodes.isSuccess &&
      canonicalEpisodeRows.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const history = useWatchHistory();
  const bookmarks = useBookmarks();
  const ratings = useEpisodeRatings(id);
  const notifyMe = useNotifyMe(id);
  const [episodePage, setEpisodePage] = useState(0);
  const [detailTab, setDetailTab] = useState<"episodes" | "details">(
    "episodes",
  );
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const { width, height } = useWindowDimensions();
  const recommendations = useQuery({
    queryKey: ["recommendations", id],
    queryFn: () => getRecommendations(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 10 * 60_000,
  });
  // Responsive breakpoint stub: >=900dp uses a two-column episode rhythm.
  // A full list+episodes two-pane is deferred — this keeps the existing
  // single-scroll composition intact on tablets and landscape.
  const twoPane = isWideLayout(width);
  // Match the main Animekz detail page: preserve the whole canonical backend
  // episode list instead of silently truncating Watch entry points after 24.
  const episodeRows = useMemo(() => {
    const base = tmdbEpisodes.data ?? canonicalEpisodeRows;
    const term = episodeSearch.trim().toLowerCase();
    if (!term) return base;
    return base.filter(
      (ep) =>
        String(ep.number).includes(term) ||
        (ep.title || "").toLowerCase().includes(term),
    );
  }, [canonicalEpisodeRows, tmdbEpisodes.data, episodeSearch]);
  const totalEpisodePages = episodePageCount(episodeRows.length);
  const safeEpisodePage = Math.min(episodePage, totalEpisodePages - 1);
  const pagedEpisodeRows = useMemo(
    () => episodePageSlice(episodeRows, safeEpisodePage),
    [episodeRows, safeEpisodePage],
  );
  const episodePageStart = episodeRows.length ? safeEpisodePage * 50 + 1 : 0;
  const episodePageEnd = Math.min(
    episodeRows.length,
    (safeEpisodePage + 1) * 50,
  );
  const animeHistory = useMemo(
    () => history.history.data?.filter((entry) => entry.anime_id === id) ?? [],
    [history.history.data, id],
  );
  const resumeEpisode = useMemo(
    () => chooseResumeEpisode(animeHistory),
    [animeHistory],
  );
  // This hook must run on loading, error, and success renders alike. Reading from
  // query data keeps the relationship list empty until the detail payload exists.
  const relationGroups = useMemo(
    () => groupAnimeRelations(anime.data?.relations?.edges),
    [anime.data?.relations?.edges],
  );

  useEffect(() => {
    setEpisodePage((current) => Math.min(current, totalEpisodePages - 1));
  }, [totalEpisodePages]);

  if (invalidId)
    return (
      <NativeScreen>
        <NativeHeader eyebrow="ANIME" title="Anime" />
        <ErrorState
          message="This anime link is invalid."
          onRetry={() => router.back()}
          retryLabel="GO BACK"
        />
      </NativeScreen>
    );
  if (anime.isPending)
    return (
      <NativeScreen>
        <NativeHeader eyebrow="ANIME" title="Anime" />
        <AnimeDetailSkeleton />
      </NativeScreen>
    );
  if (anime.isError || !anime.data)
    return (
      <NativeScreen>
        <NativeHeader eyebrow="ANIME" title="Anime" />
        <ErrorState
          message={anime.error?.message ?? "We could not load this anime."}
          onRetry={() => void anime.refetch()}
        />
      </NativeScreen>
    );
  const data = anime.data;
  const title = animeTitle(data);
  const bannerImage = data.bannerImage || "";
  const posterImage = data.coverImage?.extraLarge || data.coverImage?.large || "";
  const altTitle =
    data.title.native && data.title.native !== title
      ? data.title.native
      : data.title.english && data.title.english !== title
        ? data.title.english
        : "";
  const statusLabel =
    data.status === "RELEASING"
      ? "ONGOING"
      : data.status === "FINISHED"
        ? "COMPLETED"
        : (data.status || "ANIME").replace(/_/g, " ");
  const statusDetailedLabel = statusLabel.charAt(0) + statusLabel.slice(1).toLowerCase();
  const seasonLabel = data.season
    ? `${data.season.charAt(0)}${data.season.slice(1).toLowerCase()}`
    : "";
  const romajiTitle =
    data.title.romaji && data.title.romaji !== title ? data.title.romaji : "";
  const nativeTitle =
    data.title.native && data.title.native !== title ? data.title.native : "";
  const studioNames = (data.studios?.nodes ?? [])
    .map((node) => node.name)
    .filter(Boolean)
    .join(", ");
  const detailRows: Array<{ label: string; value: string }> = [
    { label: "Title", value: title },
    { label: "Alternative", value: romajiTitle },
    { label: "Japanese", value: nativeTitle },
    { label: "Type", value: data.format ? data.format.replace(/_/g, " ") : "" },
    { label: "Status", value: data.status ? statusDetailedLabel : "" },
    { label: "Year", value: data.seasonYear ? String(data.seasonYear) : "" },
    { label: "Season", value: seasonLabel },
    { label: "Studio", value: studioNames },
    {
      label: "Rating",
      value: data.averageScore ? `${(data.averageScore / 10).toFixed(1)} / 10` : "",
    },
    { label: "Episodes", value: data.episodes ? String(data.episodes) : "" },
    {
      label: "Duration",
      value: data.duration ? `${data.duration} min per ep` : "",
    },
    { label: "Genres", value: (data.genres ?? []).join(", ") },
  ].filter((row) => Boolean(row.value));
  const genrePills = (data.genres ?? []).slice(0, 4);
  const compact = width < 380;
  const heroHeight = Math.min(
    480,
    Math.max(430, Math.round(height * 0.58)),
  );
  const openEpisode = (episode: number) =>
    router.push({
      pathname: "/watch/[id]",
      params: {
        id: String(id),
        episode: String(episode),
        title,
        image: data.coverImage?.extraLarge || data.coverImage?.large || "",
      },
    } as never);
  const lastAvailableEpisode =
    episodeRows.at(-1)?.number ?? Math.max(data.episodes ?? 1, 1);
  const displayedResume = Math.min(resumeEpisode, lastAvailableEpisode);

  const synopsis = (data.description || "No synopsis available.").replace(
    /<[^>]+>/g,
    "",
  );
  const synopsisShort =
    synopsis.length > 260 && !synopsisExpanded
      ? `${synopsis.slice(0, 260).trimEnd()}…`
      : synopsis;

  return (
    <NativeScreen tone="light" background="#F2F8FF">
      <View style={styles.heroSection}>
        <View style={[styles.heroBanner, { height: heroHeight }]}>
          {bannerImage ? (
            <Image
              source={{ uri: bannerImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={0}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.heroFallbackBase} />
              <View style={styles.heroFallbackBlob} />
              <View style={[styles.heroFallbackBlob, styles.heroFallbackBlob2]} />
              <View style={[styles.heroFallbackBlob, styles.heroFallbackBlob3]} />
            </View>
          )}
          <View style={styles.heroScrim} />
          <View style={styles.heroTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.heroIcon,
                pressed && styles.heroIconPressed,
              ]}
            >
              <BlurView pointerEvents="none" intensity={34} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
              <AppIcon name="arrow-left" size={19} color="#102B50" />
            </Pressable>
            <View style={styles.heroTopActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  bookmarks.isBookmarked(id) ? "Remove from list" : "Add to list"
                }
                onPress={() =>
                  auth.user
                    ? bookmarks.toggle.mutate(data)
                    : router.push("/auth" as never)
                }
                style={({ pressed }) => [
                  styles.heroIcon,
                  bookmarks.isBookmarked(id) && styles.heroIconActive,
                  pressed && styles.heroIconPressed,
                ]}
              >
                <BlurView pointerEvents="none" intensity={34} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
                <AppIcon
                  name={bookmarks.isBookmarked(id) ? "bookmark-multiple-outline" : "bookmark"}
                  size={18}
                  color={bookmarks.isBookmarked(id) ? "#168BFF" : "#102B50"}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share anime"
                onPress={() =>
                  Share.share({
                    title,
                    message: `Watch ${title} on Animekz`,
                  }).catch(() => {})
                }
                style={({ pressed }) => [
                  styles.heroIcon,
                  pressed && styles.heroIconPressed,
                ]}
              >
                <BlurView pointerEvents="none" intensity={34} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
                <AppIcon name="share-2" size={18} color="#102B50" />
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.infoCard}>
          <View style={[styles.infoIntro, compact && styles.infoIntroCompact]}>
            <Image
              source={{ uri: posterImage }}
              style={[styles.poster, compact && styles.posterCompact]}
              contentFit="cover"
              transition={120}
              cachePolicy="memory-disk"
            />
            <View style={styles.infoBody}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
              <Text
                style={[styles.title, compact && styles.titleCompact]}
                numberOfLines={3}
              >
                {title}
              </Text>
              {altTitle ? (
                <Text style={styles.altTitle} numberOfLines={1}>
                  {altTitle}
                </Text>
              ) : null}
              <View style={styles.detailFacts}>
                {data.averageScore ? (
                  <View style={styles.ratingFact}>
                    <AppIcon name="star" size={14} color="#168BFF" />
                    <Text style={styles.ratingText}>
                      {(data.averageScore / 10).toFixed(1)}
                    </Text>
                  </View>
                ) : null}
                {data.seasonYear ? (
                  <Text style={styles.factText}>{data.seasonYear}</Text>
                ) : null}
                {data.episodes ? (
                  <Text style={styles.factText}>{`${data.episodes} ${
                    data.episodes === 1 ? "Episode" : "Episodes"
                  }`}</Text>
                ) : data.format && data.format !== "MOVIE" ? (
                  <Text style={styles.factText}>{data.format}</Text>
                ) : null}
                {data.season ? (
                  <Text style={styles.factText}>{seasonLabel}</Text>
                ) : null}
              </View>
            </View>
          </View>
          {genrePills.length ? (
            <View style={styles.genreRow}>
              {genrePills.map((genre) => (
                <Pressable
                  key={genre}
                  onPress={() =>
                    router.push({
                      pathname: "/search",
                      params: { genre },
                    } as never)
                  }
                  style={({ pressed }) => [
                    styles.genrePill,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.genrePillText}>{genre}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.actions, compact && styles.actionsCompact]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Watch episode ${displayedResume}`}
          onPress={() => openEpisode(displayedResume)}
          style={({ pressed }) => [
            styles.watchNow,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="play" size={16} color="#FFFFFF" />
          <Text style={styles.watchNowText} numberOfLines={1}>
            {animeHistory.length
              ? `Watch Now · EP ${displayedResume}`
              : "Watch Now"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            bookmarks.isBookmarked(id) ? "Remove from list" : "Add to list"
          }
          onPress={() =>
            auth.user
              ? bookmarks.toggle.mutate(data)
              : router.push("/auth" as never)
          }
          style={({ pressed }) => [
            styles.addList,
            bookmarks.isBookmarked(id) && styles.addListActive,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon
            name={
              bookmarks.isBookmarked(id)
                ? "bookmark-multiple-outline"
                : "bookmark"
            }
            size={16}
            color={bookmarks.isBookmarked(id) ? "#168BFF" : "#102B50"}
          />
          {!compact ? (
            <Text
              style={[
                styles.addListText,
                bookmarks.isBookmarked(id) && styles.addListTextActive,
              ]}
              numberOfLines={1}
            >
              {bookmarks.isBookmarked(id) ? "SAVED" : "ADD TO LIST"}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle notifications"
          onPress={() =>
            auth.user ? notifyMe.toggle() : router.push("/auth" as never)
          }
          style={({ pressed }) => [
            styles.roundAction,
            notifyMe.enabled && styles.roundActionActive,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon
            name={notifyMe.enabled ? "bell" : "bell-outline"}
            size={17}
            color={notifyMe.enabled ? "#168BFF" : "#102B50"}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share anime"
          onPress={() => {
            const deepLink = `animekz://anime/${id}`;
            const webUrl = `https://aniraku.tech/anime/${id}`;
            Share.share({
              title,
              message: `Watch ${title} on Animekz\n${deepLink}`,
              url: Platform.OS === "ios" ? deepLink : webUrl,
            }).catch(() => {});
          }}
          style={({ pressed }) => [
            styles.roundAction,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="share-2" size={17} color="#102B50" />
        </Pressable>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryEyebrow}>SYNOPSIS</Text>
        </View>
        <Text style={styles.copy}>{synopsisShort}</Text>
        {synopsis.length > 260 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              synopsisExpanded ? "Collapse synopsis" : "Expand synopsis"
            }
            onPress={() => setSynopsisExpanded((value) => !value)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.readMore}>
              {synopsisExpanded ? "Close" : "Read more"}
            </Text>
          </Pressable>
        ) : null}
        {data.genres && data.genres.length > 4 ? <View style={styles.genreRow}>
          {data.genres.slice(4).map((genre) => <Pressable key={genre} onPress={() => router.push({ pathname: "/search", params: { genre } } as never)} style={({ pressed }) => [styles.genreChip, pressed && styles.pressed]}>
            <Text style={styles.genreChipText}>{genre}</Text>
          </Pressable>)}
        </View> : null}
      </View>
      <View style={styles.detailTabs}>
        <Pressable
          onPress={() => setDetailTab("episodes")}
          style={[
            styles.detailTab,
            detailTab === "episodes" && styles.detailTabActive,
          ]}
        >
          <Text
            style={[
              styles.detailTabText,
              detailTab === "episodes" && styles.detailTabTextActive,
            ]}
          >
            Episodes
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDetailTab("details")}
          style={[
            styles.detailTab,
            detailTab === "details" && styles.detailTabActive,
          ]}
        >
          <Text
            style={[
              styles.detailTabText,
              detailTab === "details" && styles.detailTabTextActive,
            ]}
          >
            Details
          </Text>
        </Pressable>
      </View>
      {detailTab === "details" ? (
        <>
          <View style={styles.detailInfoCard}>
            <DotLabel>INFORMATION</DotLabel>
            {detailRows.map((row, index) => (
              <View
                key={`${row.label}:${row.value}`}
                style={[
                  styles.detailInfoRow,
                  index < detailRows.length - 1 &&
                    styles.detailInfoRowDivider,
                ]}
              >
                <Text style={styles.detailInfoLabel}>{row.label}</Text>
                <Text style={styles.detailInfoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <AiringSchedule
            nextAiringEpisode={data.nextAiringEpisode}
            totalEpisodes={data.episodes}
          />
          {animeHistory.length ? (
            <View style={styles.continueRow}>
              <View style={styles.continueRule} />
              <Text style={styles.continueText}>
                Continue from episode {displayedResume}.
              </Text>
            </View>
          ) : null}
          {relationGroups.length ? (
            <View style={styles.relationsSection}>
              <View style={styles.relationsHeading}>
                <View>
                  <DotLabel>RELATIONSHIPS</DotLabel>
                  <Text style={styles.heading}>Explore this universe</Text>
                </View>
                <Text style={styles.count}>
                  {String(
                    relationGroups.reduce(
                      (count, group) => count + group.relations.length,
                      0,
                    ),
                  ).padStart(2, "0")}
                </Text>
              </View>
              {relationGroups.map((group) => (
                <View key={group.key} style={styles.relationGroup}>
                  <View style={styles.relationGroupHeading}>
                    <View style={styles.relationGroupCopy}>
                      <Text style={styles.relationGroupTitle}>
                        {group.title}
                      </Text>
                      <Text style={styles.relationGroupSubtitle}>
                        {group.subtitle}
                      </Text>
                    </View>
                    <Text style={styles.relationGroupCount}>
                      {String(group.relations.length).padStart(2, "0")}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relationRailContent}
                    accessibilityLabel={`${group.title}: ${group.subtitle}`}
                  >
                    {group.relations.map((relation) => {
                      const relationTitle = animeTitle(relation.anime);
                      const cover =
                        relation.anime.coverImage?.large ||
                        relation.anime.coverImage?.extraLarge ||
                        "";
                      return (
                        <Pressable
                          key={relation.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${relation.label}: ${relationTitle}`}
                          onPress={() =>
                            router.push({
                              pathname: "/anime/[id]",
                              params: { id: String(relation.id) },
                            } as never)
                          }
                          style={({ pressed }) => [
                            styles.relationTile,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={styles.relationPoster}>
                            {cover ? (
                              <Image
                                source={{ uri: cover }}
                                recyclingKey={`rel-${relation.id}`}
                                style={StyleSheet.absoluteFill}
                                contentFit="cover"
                                transition={0}
                                cachePolicy="memory-disk"
                              />
                            ) : (
                              <Text style={styles.relationPosterFallback}>
                                ANIME
                              </Text>
                            )}
                          </View>
                          <View style={styles.relationTileBody}>
                            <Text style={styles.relationLabel}>
                              {relation.label}
                            </Text>
                            <Text
                              style={styles.relationTitle}
                              numberOfLines={2}
                            >
                              {relationTitle}
                            </Text>
                            <Text style={styles.relationMeta} numberOfLines={1}>
                              {[
                                relation.anime.format,
                                relation.anime.episodes
                                  ? `${relation.anime.episodes} EP`
                                  : null,
                                relation.anime.status,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "OPEN DETAILS"}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
          ) : null}
          {recommendations.data?.length ? (
            <View style={styles.recommendationsSection}>
              <View style={styles.recommendationsHeading}>
                <View>
                  <DotLabel tone="signal">RECOMMENDATIONS</DotLabel>
                  <Text style={styles.heading}>Similar Anime</Text>
                </View>
                <Text style={styles.count}>
                  {String(recommendations.data.length).padStart(2, "0")}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsRail}
              >
                {recommendations.data.map((rec) => {
                  const recTitle = animeTitle(rec);
                  const cover =
                    rec.coverImage?.extraLarge || rec.coverImage?.large || "";
                  return (
                    <Pressable
                      key={rec.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open recommended: ${recTitle}`}
                      onPress={() =>
                        router.push({
                          pathname: "/anime/[id]",
                          params: { id: String(rec.id) },
                        } as never)
                      }
                      style={({ pressed }) => [
                        styles.recCard,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.recPoster}>
                        {cover ? (
                          <Image
                            source={{ uri: cover }}
                            recyclingKey={`rec-${rec.id}`}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={0}
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <Text style={styles.recPosterFallback}>ANIME</Text>
                        )}
                        {rec.averageScore ? (
                          <View style={styles.recRating}>
                            <AppIcon name="star" size={11} color="#168BFF" />
                            <Text style={styles.recRatingText}>
                              {(rec.averageScore / 10).toFixed(1)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.recTitle} numberOfLines={2}>
                        {recTitle}
                      </Text>
                      <Text style={styles.recMeta}>
                        {[
                          rec.format,
                          rec.episodes ? `${rec.episodes} EP` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
          <AnimeComments animeId={id} />
        </>
      ) : (
        <>
          <View style={styles.episodeHeading}>
            <View>
              <DotLabel>EPISODES</DotLabel>
              <Text style={styles.heading}>Episode List</Text>
            </View>
            <Text style={styles.count}>
              {episodes.isPending
                ? "…"
                : `${String(episodeRows.length).padStart(2, "0")} EP`}
            </Text>
          </View>
          <View style={styles.epSearch}>
            <AppIcon name="magnify" size={14} color={nothing.muted} />
            <TextInput
              value={episodeSearch}
              onChangeText={setEpisodeSearch}
              placeholder="Search episode..."
              placeholderTextColor={nothing.dim}
              style={styles.epSearchInput}
              returnKeyType="done"
            />
          </View>
          {episodes.isPending ? (
            <View style={styles.episodeLoadingSkeleton}><SkeletonEpisode /><SkeletonEpisode /></View>
          ) : episodes.isError ? (
            <ErrorState
              message={
                episodes.error?.message ||
                "We could not load episodes right now."
              }
              onRetry={() => void episodes.refetch()}
            />
          ) : !episodeRows.length ? (
            <View style={styles.emptyEpisodes}>
              <DotLabel tone="muted">NO EPISODES YET</DotLabel>
              <Text style={styles.copy}>No episodes yet. Check back soon.</Text>
              <NothingButton
                label="CHECK AGAIN"
                variant="outline"
                onPress={() => void episodes.refetch()}
              />
            </View>
          ) : (
            <>
              <View style={styles.episodePageBar}>
                <Text
                  style={styles.episodePageText}
                >{`EPISODE ${String(episodePageStart).padStart(2, "0")}–${String(episodePageEnd).padStart(2, "0")} · PAGE ${safeEpisodePage + 1}/${totalEpisodePages}`}</Text>
                {totalEpisodePages > 1 ? (
                  <View style={styles.episodePager}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous episode page"
                      disabled={safeEpisodePage === 0}
                      onPress={() =>
                        setEpisodePage((value) => Math.max(0, value - 1))
                      }
                      style={[
                        styles.episodePageButton,
                        safeEpisodePage === 0 &&
                          styles.episodePageButtonDisabled,
                      ]}
                    >
                      <Text style={styles.episodePageButtonText}>PREV</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next episode page"
                      disabled={safeEpisodePage >= totalEpisodePages - 1}
                      onPress={() =>
                        setEpisodePage((value) =>
                          Math.min(totalEpisodePages - 1, value + 1),
                        )
                      }
                      style={[
                        styles.episodePageButton,
                        safeEpisodePage >= totalEpisodePages - 1 &&
                          styles.episodePageButtonDisabled,
                      ]}
                    >
                      <Text style={styles.episodePageButtonText}>NEXT</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
              <View
                style={[styles.episodeList, twoPane && styles.episodeListWide]}
              >
                {pagedEpisodeRows.map((episode) => {
                  const score = ratings.scoreFor(episode.number);
                  const seen = animeHistory.find(
                    (entry) => entry.episode_number === episode.number,
                  );
                  const progress = seen
                    ? Math.min(
                        100,
                        Math.round(
                          (seen.progress / Math.max(seen.duration, 1)) * 100,
                        ),
                      )
                    : 0;
                  return (
                    <View
                      key={episode.number}
                      style={[styles.episode, twoPane && styles.twoPaneEpisode]}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Watch episode ${episode.number}: ${episode.title || "Untitled"}`}
                        onPress={() => openEpisode(episode.number)}
                        style={({ pressed }) => [
                          styles.episodeMain,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.episodeVisual}>
                          <Image
                            source={{ uri: episode.thumbnail || "" }}
                            recyclingKey={`ep-${id}-${episode.number}`}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={0}
                            cachePolicy="memory-disk"
                          />
                          <View style={styles.episodeVisualMask} />
                          <Text style={styles.episodeNumber}>
                            {String(episode.number).padStart(2, "0")}
                          </Text>
                        </View>
                        <View style={styles.episodeBody}>
                          <Text style={styles.episodeTitle} numberOfLines={2}>
                            {episode.title || `Episode ${episode.number}`}
                          </Text>
                          <View style={styles.episodeStatus}>
                            <Text
                              style={[
                                styles.episodeMeta,
                                episode.isFiller && styles.fillerMeta,
                              ]}
                            >
                              {seen
                                ? `${progress}% Watched${episode.isFiller ? " · Filler" : ""}`
                                : episode.isFiller
                                  ? "Filler"
                                  : "Available"}
                            </Text>
                            {seen ? (
                              <View style={styles.progressTrack}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    { width: `${progress}%` },
                                  ]}
                                />
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Rate episode ${episode.number}`}
                        onPress={(event) => {
                          event.stopPropagation();
                          if (!auth.user) {
                            router.push("/auth" as never);
                            return;
                          }
                          ratings.setRating.mutate({
                            episode: episode.number,
                            score: score ? (score % 10) + 1 : 8,
                          });
                        }}
                        style={({ pressed }) => [
                          styles.rating,
                          score && styles.ratingActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ratingCellText,
                            score && styles.ratingCellTextActive,
                          ]}
                        >
                          {score ? `${score}/10` : "Rate"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  heroSection: { marginHorizontal: -18, marginTop: -8, marginBottom: 4 },
  heroBanner: {
    overflow: "hidden",
    backgroundColor: "#D9EEFF",
  },
  heroFallbackBase: { ...StyleSheet.absoluteFillObject, backgroundColor: "#D9EEFF" },
  heroFallbackBlob: {
    position: "absolute",
    top: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  heroFallbackBlob2: {
    top: "auto",
    bottom: -90,
    right: undefined,
    left: -70,
    backgroundColor: "rgba(22,139,255,0.16)",
  },
  heroFallbackBlob3: {
    top: 150,
    left: 90,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16,43,80,0.22)",
  },
  heroTop: {
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  heroTopActions: { flexDirection: "row", gap: 10 },
  heroIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  heroIconActive: { borderColor: "rgba(22,139,255,0.45)" },
  heroIconPressed: { opacity: 0.72, transform: [{ scale: 0.95 }] },
  infoCard: {
    marginTop: -56,
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 6,
  },
  infoIntro: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  infoIntroCompact: { gap: 10 },
  poster: {
    width: 112,
    height: 158,
    borderRadius: 14,
    backgroundColor: "#D9EEFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  posterCompact: { width: 92, height: 130 },
  infoBody: { flex: 1, minWidth: 0, gap: 8 },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#168BFF",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  title: {
    color: "#102B50",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 29,
    letterSpacing: -0.6,
  },
  titleCompact: { fontSize: 20, lineHeight: 25 },
  altTitle: { color: "#647C9B", fontSize: 12, fontWeight: "600" },
  detailFacts: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 6,
    gap: 10,
  },
  ratingFact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#D9EEFF",
  },
  ratingText: { color: "#102B50", fontSize: 11, fontWeight: "800" },
  factText: { color: "#647C9B", fontSize: 11.5, fontWeight: "600" },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  genrePill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#D9EEFF",
  },
  genrePillText: { color: "#168BFF", fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionsCompact: { gap: 6 },
  watchNow: {
    flex: 1.7,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#168BFF",
    shadowColor: "#168BFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  watchNowText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  addList: {
    flex: 1,
    minWidth: 46,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9EEFF",
  },
  addListActive: { backgroundColor: "#D9EEFF", borderColor: "#BFE0FF" },
  addListText: {
    color: "#102B50",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.7,
  },
  addListTextActive: { color: "#168BFF" },
  roundAction: {
    width: 46,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  roundActionActive: {
    borderColor: "#D9EEFF",
    backgroundColor: "#D9EEFF",
  },
  pressed: nothing.pressed,
  continueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D6E8FA",
  },
  continueRule: { width: 18, height: 2, backgroundColor: "#168BFF" },
  continueText: { flex: 1, color: "#647C9B", fontSize: 13, lineHeight: 19 },
  summary: {
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryEyebrow: { color: "#168BFF", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  readMore: { color: "#168BFF", fontSize: 13, fontWeight: "800" },
  detailTabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E8FA",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  detailTab: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  detailTabActive: { backgroundColor: "#168BFF" },
  detailTabText: { color: "#102B50", fontSize: 13, fontWeight: "700" },
  detailTabTextActive: { color: "#FFFFFF" },
  relationsSection: { gap: 15, padding: 14, borderWidth: 1.5, borderColor: "#D6E8FA", borderRadius: 20, backgroundColor: "#FFFFFF" },
  relationsHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  relationGroup: { gap: 8 },
  relationGroupHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  relationGroupCopy: { flex: 1, gap: 2 },
  relationGroupTitle: {
    color: "#102B50",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  relationGroupSubtitle: { color: nothing.dim, fontSize: 10, lineHeight: 14 },
  relationGroupCount: {
    color: nothing.red,
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  relationRailContent: { gap: 10, paddingRight: 8 },
  relationTile: { width: 148, gap: 8, padding: 8, borderWidth: 1, borderColor: "#D6E8FA", borderRadius: 16, backgroundColor: "#FFFFFF" },
  relationPoster: {
    width: "100%",
    height: 144,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#D9EEFF",
  },
  relationPosterFallback: {
    color: "#647C9B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.55,
  },
  relationTileBody: { flex: 1, gap: 4 },
  relationLabel: {
    color: "#168BFF",
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  relationTitle: {
    color: "#102B50",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
  relationMeta: {
    color: "#647C9B",
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.45,
  },
  detailInfoCard: {
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  detailInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  detailInfoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E9F3FE",
  },
  detailInfoLabel: {
    width: 104,
    color: "#647C9B",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  detailInfoValue: {
    flex: 1,
    minWidth: 0,
    color: "#102B50",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  recommendationsSection: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  recommendationsHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  recommendationsRail: { gap: 10, paddingRight: 8 },
  recCard: {
    width: 124,
    gap: 7,
    padding: 7,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  recPoster: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#D9EEFF",
  },
  recRating: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  recRatingText: { color: "#102B50", fontSize: 10, fontWeight: "800" },
  recPosterFallback: {
    color: "#647C9B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.55,
  },
  recTitle: {
    color: "#102B50",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  recMeta: {
    color: "#647C9B",
    fontFamily: nothing.mono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.35,
  },
  copy: { color: "#3D577B", fontSize: 14, lineHeight: 22 },
  genreChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#D9EEFF",
  },
  genreChipText: { color: "#168BFF", fontSize: 11, fontWeight: "700" },
  episodeLoadingSkeleton: { gap: 9 },
  episodeHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  heading: {
    color: "#102B50",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: -0.4,
  },
  count: {
    color: "#647C9B",
    fontFamily: nothing.mono,
    fontSize: 12,
    fontWeight: "700",
  },
  epSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "#FFFFFF",
  },
  epSearchInput: { flex: 1, minHeight: 40, color: "#102B50", fontSize: 13 },
  episodeList: { gap: 9 },
  episodeListWide: { flexDirection: "row", flexWrap: "wrap" },
  twoPaneEpisode: { flexBasis: "48%", flexGrow: 1 },
  episodePageBar: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
    paddingVertical: 6,
  },
  episodePageText: {
    flex: 1,
    color: "#647C9B",
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.35,
  },
  episodePager: { flexDirection: "row", gap: 8 },
  episodePageButton: {
    minWidth: 56,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "#FFFFFF",
  },
  episodePageButtonDisabled: { opacity: 0.35 },
  episodePageButtonText: {
    color: "#168BFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  emptyEpisodes: { gap: 10, paddingVertical: 12 },
  episode: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  episodeMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  episodeVisual: {
    width: 88,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D9EEFF",
  },
  episodeVisualMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16,43,80,0.32)",
  },
  episodeNumber: {
    zIndex: 1,
    color: "#FFFFFF",
    fontFamily: nothing.mono,
    fontWeight: "800",
    fontSize: 15,
  },
  episodeBody: { flex: 1, gap: 5 },
  episodeTitle: {
    color: "#102B50",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  episodeStatus: { flexDirection: "row", alignItems: "center", gap: 7 },
  episodeMeta: {
    color: "#647C9B",
    fontFamily: nothing.mono,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.35,
  },
  fillerMeta: { color: "#F59E0B" },
  progressTrack: {
    flex: 1,
    maxWidth: 64,
    height: 3,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "#DCEBFA",
  },
  progressFill: { height: "100%", backgroundColor: "#168BFF" },
  rating: {
    minWidth: 50,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E8FA",
    backgroundColor: "#FFFFFF",
  },
  ratingActive: { borderColor: "#BFE0FF", backgroundColor: "#D9EEFF" },
  ratingCellText: { color: "#647C9B", fontWeight: "800", fontSize: 10 },
  ratingCellTextActive: { color: "#168BFF" },
});
