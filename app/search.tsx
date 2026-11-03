import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getAnimePage,
  isAniListRateLimitError,
  sanitizeMediaFormat,
  sanitizeMediaSortList,
  sanitizeMediaStatus,
} from "@/lib/anilist";
import { searchCommitDelayMs } from "@/lib/search-input";
import { nsfwFilterParam, useNsfwPreference } from "@/lib/nsfw-preference";
import { animeTitle } from "@/lib/types";
import { ErrorState, LoadingState, EmptyState } from "@/components/async-state";
import { AppIcon } from "@/components/app-icon";
import { DotLabel, nothing } from "@/components/nothing-ui";
import { NativeScreen } from "@/components/screen";

type HistoryEntry = { term: string; timestamp: number };
const STORAGE_KEY = "aniraku.search.recent";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function pruneOldEntries(entries: HistoryEntry[]): HistoryEntry[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return entries.filter((e) => e.timestamp > cutoff);
}

function upgradeLegacyEntries(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string")
        return { term: item, timestamp: Date.now() };
      if (
        item &&
        typeof item === "object" &&
        "term" in item &&
        "timestamp" in item
      ) {
        return item as HistoryEntry;
      }
      return null;
    })
    .filter((e): e is HistoryEntry => e !== null);
}

const QUICK_GENRES = [
  "Action",
  "Romance",
  "Comedy",
  "Fantasy",
  "Sci-Fi",
  "Horror",
];

function SearchResultRow({
  anime,
  onPress,
}: {
  anime: any;
  onPress: () => void;
}) {
  const title = animeTitle(anime);
  const image = anime.coverImage?.extraLarge || anime.coverImage?.large || "";
  const format = anime.format || "";
  const episodes = anime.episodes;
  const score = anime.averageScore;
  const meta = [
    anime.genres?.slice?.(0, 2).join(" · "),
    format,
    score ? `★ ${(score / 10).toFixed(1)}` : null,
    episodes ? `${episodes} EP` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
    >
      <View style={styles.resultThumb}>
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
        <View style={styles.resultPlayBadge}>
          <AppIcon name="play" size={14} color={"#101828"} />
        </View>
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {title}
        </Text>
        {meta ? <Text style={styles.resultMeta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{
    genre?: string;
    sort?: string | string[];
    status?: string;
    format?: string;
    season?: string;
    seasonYear?: string;
    title?: string;
  }>();
  const genreFilter =
    typeof params.genre === "string" && params.genre.trim()
      ? params.genre.trim().slice(0, 40)
      : null;
  // Rail "View all" links, shared URLs, and typed deep links all land here —
  // every enum slot is allowlisted so a stale/crafted param degrades to the
  // default browse instead of 400ing the whole screen. sanitizeMediaSortList
  // also tolerates expo-router's string[] shape (multi ?sort= params).
  const sortFilter = sanitizeMediaSortList(params.sort ?? null);
  const statusFilter = sanitizeMediaStatus(params.status);
  const formatFilter = sanitizeMediaFormat(params.format);
  const seasonFilter =
    params.season &&
    ["WINTER", "SPRING", "SUMMER", "FALL"].includes(params.season)
      ? params.season
      : null;
  const seasonYearFilter =
    params.seasonYear && /^\d{4}$/.test(params.seasonYear)
      ? Number(params.seasonYear)
      : undefined;
  const categoryTitle = params.title || null;
  const nsfw = useNsfwPreference();
  const isAdultParam = nsfwFilterParam(nsfw.enabled);
  const [input, setInput] = useState("");
  const normalizedInput = input.trim().replace(/\s+/g, " ");
  const [query, setQuery] = useState("");
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [recent, setRecent] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const entries = upgradeLegacyEntries(parsed);
            const pruned = pruneOldEntries(entries);
            setRecent(pruned);
            if (pruned.length !== entries.length) {
              void AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(pruned),
              ).catch(() => {});
            }
          } catch {
            /* ignore malformed */
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Word-boundary commit: the query fires when a word/sentence unit finishes
    // (trailing space/punctuation → quick confirm) or when typing pauses
    // mid-word. Enter still commits instantly. Cheaper than a flat debounce
    // under the temporary 30 req/min AniList cap.
    const delay = searchCommitDelayMs(normalizedInput);
    const timer = setTimeout(() => setQuery(normalizedInput), delay);
    return () => clearTimeout(timer);
  }, [normalizedInput]);

  const waitingForInput =
    normalizedInput.length > 1 && query !== normalizedInput;
  const hasCategory = Boolean(
    genreFilter || sortFilter || statusFilter || formatFilter || seasonFilter,
  );
  const isCategoryMode = hasCategory;
  const categoryLabel = categoryTitle || genreFilter || "BROWSE";
  const searchQuery = isCategoryMode ? query || " " : query;
  const results = useQuery({
    queryKey: [
      "search",
      searchQuery,
      genreFilter,
      sortFilter?.join(","),
      statusFilter,
      formatFilter,
      seasonFilter,
      seasonYearFilter,
      isAdultParam,
    ],
    queryFn: () =>
      getAnimePage({
        search: isCategoryMode && !query ? undefined : searchQuery,
        genre: genreFilter || undefined,
        sort: sortFilter || ["SEARCH_MATCH"],
        status: statusFilter || undefined,
        format: formatFilter || undefined,
        season: seasonFilter || undefined,
        seasonYear: seasonYearFilter,
        perPage: 20,
        isAdult: isAdultParam,
      }),
    enabled: isCategoryMode || query.length > 1,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    retry: (failureCount, error) =>
      !isAniListRateLimitError(error) && failureCount < 1,
    retryDelay: 1_200,
  });
  const trendingSearches = useQuery({
    queryKey: ["search-trending", isAdultParam],
    queryFn: () =>
      getAnimePage({
        perPage: 10,
        sort: ["TRENDING_DESC", "POPULARITY_DESC"],
        isAdult: isAdultParam,
      }),
    staleTime: 10 * 60_000,
    enabled: !query && !isCategoryMode,
  });
  const rateLimitError = isAniListRateLimitError(results.error)
    ? results.error
    : null;
  const retryAfterMs = rateLimitError?.retryAfterMs ?? null;

  useEffect(() => {
    if (retryAfterMs === null) {
      setRetryAt(null);
      return;
    }
    setRetryAt((current) =>
      current && current > Date.now() ? current : Date.now() + retryAfterMs,
    );
  }, [retryAfterMs]);

  useEffect(() => {
    if (!retryAt || retryAt <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= retryAt) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [retryAt]);

  const retryIsBlocked = Boolean(retryAt && now < retryAt);
  const retrySeconds = retryAt
    ? Math.max(0, Math.ceil((retryAt - now) / 1000))
    : 0;
  const retrySearch = () => {
    if (retryIsBlocked) return;
    setRetryAt(null);
    void results.refetch();
  };

  useEffect(() => {
    if (!results.isSuccess || query.length < 2) return;
    setRecent((current) => {
      const now = Date.now();
      const filtered = current.filter(
        (item) => item.term.toLowerCase() !== query.toLowerCase(),
      );
      const next = [{ term: query, timestamp: now }, ...filtered].slice(0, 6);
      const pruned = pruneOldEntries(next);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pruned)).catch(
        () => {},
      );
      return pruned;
    });
  }, [query, results.isSuccess]);

  const isIdle = !isCategoryMode && normalizedInput.length <= 1;

  return (
    <NativeScreen scroll={false} tone="light" style={styles.fill}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close search"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <AppIcon name="arrow-left" size={21} color="#142B4B" />
        </Pressable>
        <View style={styles.searchInputWrap}>
          <AppIcon name="magnify" size={18} color={"#526985"} />
          <TextInput
            autoFocus={!isCategoryMode}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => setQuery(normalizedInput)}
            placeholder={
              hasCategory ? `Search in ${categoryLabel}...` : "Search anime..."
            }
            placeholderTextColor={"#7185A5"}
            style={styles.input}
            returnKeyType="search"
          />
          {hasCategory ? (
            <Pressable onPress={() => router.back()} style={styles.genreClear}>
              <Text style={styles.genreClearText}>
                {categoryLabel.toUpperCase()}
              </Text>
              <AppIcon name="close" size={14} color={"#1677FF"} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {isIdle ? (
        <ScrollView
          style={styles.idleScroll}
          contentContainerStyle={styles.idleContent}
          showsVerticalScrollIndicator={false}
        >
          {recent.length > 0 ? (
            <View style={styles.historySection}>
              <View style={styles.historyHead}>
                <Text style={styles.historyLabel}>Recent Searches</Text>
                <Pressable
                  onPress={() => {
                    setRecent([]);
                    void AsyncStorage.removeItem(STORAGE_KEY);
                  }}
                >
                  <Text style={styles.clearBtn}>Clear All</Text>
                </Pressable>
              </View>
              <View style={styles.recentChips}>
                {recent.map((entry) => (
                  <View key={entry.term} style={styles.recentChip}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setInput(entry.term)}
                      style={styles.recentChipLabel}
                    >
                      <Text numberOfLines={1} style={styles.historyTerm}>
                        {entry.term}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${entry.term}`}
                      onPress={() =>
                        setRecent((items) => {
                          const next = items.filter(
                            (item) => item.term !== entry.term,
                          );
                          void AsyncStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(next),
                          );
                          return next;
                        })
                      }
                      style={styles.recentChipClose}
                    >
                      <AppIcon name="close" size={13} color="#7185A5" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.trendingSection}>
            <Text style={styles.historyLabel}>Trending Searches</Text>
            {(trendingSearches.data?.media || [])
              .slice(0, 5)
              .map((anime, index) => (
                <Pressable
                  key={anime.id}
                  accessibilityRole="button"
                  onPress={() => setInput(animeTitle(anime))}
                  style={styles.trendingRow}
                >
                  <Text
                    style={[
                      styles.trendingRank,
                      index < 3 && styles.trendingRankTop,
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <Text numberOfLines={1} style={styles.trendingTitle}>
                    {animeTitle(anime)}
                  </Text>
                  <AppIcon name="arrow-top-right" size={15} color="#7185A5" />
                </Pressable>
              ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/catalog" as never)}
            style={styles.promoBanner}
          >
            <View style={styles.promoCopy}>
              <Text style={styles.promoEyebrow}>ANIMEKZ PICKS</Text>
              <Text style={styles.promoTitle}>Find your favorite anime!</Text>
              <Text style={styles.promoSub}>
                A new story is one search away.
              </Text>
            </View>
            {trendingSearches.data?.media?.[0]?.coverImage?.large ? (
              <Image
                source={{
                  uri: trendingSearches.data.media[0].coverImage.large,
                }}
                style={styles.promoImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.promoArt}>
                <AppIcon name="play" size={26} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
          <View style={styles.genreSection}>
            <Text style={styles.genreLabel}>Browse by genre</Text>
            <View style={styles.genreGrid}>
              {QUICK_GENRES.map((genre) => (
                <Pressable
                  key={genre}
                  onPress={() => setInput(genre)}
                  style={({ pressed }) => [
                    styles.genreChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.genreChipText}>{genre}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : waitingForInput || results.isPending ? (
        <LoadingState
          label={
            isCategoryMode
              ? `Loading ${categoryLabel} anime`
              : `Searching for "${normalizedInput}"`
          }
        />
      ) : results.isError || !results.data ? (
        <ErrorState
          message={results.error?.message ?? "Search is unavailable."}
          onRetry={retrySearch}
          retryDisabled={retryIsBlocked}
          retryLabel={
            retryIsBlocked ? `TRY AGAIN IN ${retrySeconds}S` : "TRY AGAIN"
          }
        />
      ) : results.data.media.length === 0 ? (
        <EmptyState
          label={
            isCategoryMode
              ? `No ${categoryLabel} anime found.`
              : `No titles found for "${query}".`
          }
          action={
            !retryIsBlocked
              ? { label: "Retry", onPress: retrySearch }
              : undefined
          }
        />
      ) : (
        <View style={styles.resultsWrap}>
          <View style={styles.resultsHead}>
            <DotLabel tone="live">
              {isCategoryMode ? categoryLabel?.toUpperCase() : "TOP SEARCH"}
            </DotLabel>
          </View>
          <FlatList
            data={results.data.media}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SearchResultRow
                anime={item}
                onPress={() => router.push(`/anime/${item.id}` as never)}
              />
            )}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#EAF3FF",
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D9E7F8",
    backgroundColor: "#FFFFFF",
  },
  input: { flex: 1, minHeight: 46, color: "#101828", fontSize: 15 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9E7F8",
    alignItems: "center",
    justifyContent: "center",
  },
  genreClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255,77,77,0.12)",
  },
  genreClearText: {
    color: "#1677FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  idleScroll: { flex: 1 },
  idleContent: { paddingHorizontal: 18, paddingBottom: 126, gap: 22 },
  recentChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recentChip: {
    minHeight: 36,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E7F8",
  },
  recentChipLabel: { maxWidth: 190, paddingVertical: 7 },
  recentChipClose: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#EAF3FF",
  },
  trendingSection: { gap: 3 },
  trendingRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D9E7F8",
  },
  trendingRank: {
    width: 20,
    color: "#7185A5",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  trendingRankTop: { color: "#1677FF" },
  trendingTitle: { flex: 1, color: "#101828", fontSize: 13, fontWeight: "700" },
  promoBanner: {
    minHeight: 118,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#D9E7F8",
  },
  promoCopy: { flex: 1, paddingHorizontal: 15, paddingVertical: 13, gap: 4 },
  promoEyebrow: {
    color: "#1677FF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  promoTitle: {
    maxWidth: 200,
    color: "#142B4B",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  promoSub: { color: "#526985", fontSize: 11 },
  promoImage: { width: 78, height: "100%", minHeight: 118 },
  promoArt: {
    width: 78,
    height: "100%",
    minHeight: 118,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1677FF",
  },
  historySection: { gap: 8 },
  historyHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historyLabel: { color: "#101828", fontSize: 15, fontWeight: "800" },
  clearBtn: { color: "#1677FF", fontSize: 12, fontWeight: "800" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D9E7F8",
  },
  historyBody: { flex: 1, gap: 1 },
  historyTerm: { color: "#101828", fontSize: 14, fontWeight: "700" },
  historyTime: { color: "#7185A5", fontSize: 11, fontWeight: "600" },

  genreSection: { gap: 10 },
  genreLabel: {
    color: "#526985",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E7F8",
    backgroundColor: "#FFFFFF",
  },
  genreChipText: { color: "#101828", fontSize: 13, fontWeight: "700" },

  resultsWrap: { flex: 1 },
  resultsHead: { paddingHorizontal: 16, paddingBottom: 8 },
  resultsList: { paddingHorizontal: 16, paddingBottom: 112 },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D9E7F8",
  },
  resultThumb: {
    width: 72,
    height: 104,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EAF3FF",
  },
  resultPlayBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  resultBody: { flex: 1, gap: 4 },
  resultTitle: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },
  resultMeta: { color: "#7185A5", fontSize: 12, fontWeight: "700" },

  pressed: nothing.pressed,
});
