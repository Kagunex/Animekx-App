import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import SkipBack from "lucide-react-native/icons/skip-back";
import SkipForward from "lucide-react-native/icons/skip-forward";
import Search from "lucide-react-native/icons/search";
import Play from "lucide-react-native/icons/play";
import X from "lucide-react-native/icons/x";
import { playerTheme } from "./player-theme";
import { t } from "@/lib/i18n";

const ep = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  headerTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  headerSub: { color: playerTheme.textTertiary, fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginTop: 1, fontVariant: ["tabular-nums"] },
  prevNext: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  navBtnDisabled: { opacity: 0.35 },
  search: {
    marginHorizontal: 10,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  searchInput: { flex: 1, minWidth: 0, color: "#FFFFFF", fontSize: 12, fontWeight: "600", paddingVertical: 0 },
  list: { flex: 1 },
  listContent: { padding: 8, paddingBottom: 14, gap: 6 },
  row: {
    flexDirection: "row",
    gap: 10,
    padding: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  rowActive: {
    backgroundColor: playerTheme.accentSoft,
    borderColor: playerTheme.accentHairline,
  },
  rowPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  thumbWrap: {
    width: 118,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  thumbFill: { width: "100%", height: "100%" },
  thumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  nowBadge: {
    position: "absolute",
    left: 4,
    bottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: playerTheme.accent,
  },
  nowBadgeText: { color: "#FFFFFF", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.4 },
  progressPctBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  progressPctText: { color: "#FFFFFF", fontSize: 7.5, fontWeight: "800", fontVariant: ["tabular-nums"] },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  rowEyebrow: { color: playerTheme.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 0.5, fontVariant: ["tabular-nums"] },
  rowTitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 15, fontWeight: "700" },
  rowTitleActive: { color: playerTheme.accentBright, fontWeight: "900" },
  fillerTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  fillerText: { color: playerTheme.textTertiary, fontSize: 8, fontWeight: "800", letterSpacing: 0.4 },
  empty: { color: playerTheme.textTertiary, fontSize: 11, fontWeight: "600", textAlign: "center", paddingVertical: 18 },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 3,
    overflow: "hidden",
  },
  progressFill: { height: 3, borderRadius: 1.5, backgroundColor: playerTheme.accent },
});

type EpisodeLike = {
  number: number;
  title?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  isFiller?: boolean;
};

type EpisodePanelProps = {
  episodes: EpisodeLike[];
  activeEpisode: number;
  /** Real watch-history progress per episode: number → 0–1 fraction. */
  progressMap: Map<number, number>;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (episode: number) => void;
  onClose: () => void;
};

/**
 * Netflix-style episode selector: thumbnail rows, blue active highlight,
 * real watch-progress markers, prev/next buttons in the header. Selecting a
 * row always goes through the caller's episode navigation (the native
 * streaming pipeline), never a static swap.
 */
export const EpisodePanel = memo(function EpisodePanel({
  episodes,
  activeEpisode,
  progressMap,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onSelect,
  onClose,
}: EpisodePanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return episodes;
    return episodes.filter(
      (item) => String(item.number).includes(term) || String(item.title || "").toLowerCase().includes(term),
    );
  }, [episodes, search]);

  const renderRow = useCallback(
    ({ item }: { item: EpisodeLike }) => {
      const active = item.number === activeEpisode;
      const watched = progressMap.get(item.number) ?? 0;
      const title = String(item.title || "").trim();
      return (
        <Pressable
          onPress={() => onSelect(item.number)}
          accessibilityRole="button"
          accessibilityLabel={`Episode ${item.number}${title ? `: ${title}` : ""}`}
          accessibilityHint={active ? "Currently playing" : "Play this episode"}
          style={({ pressed }) => [ep.row, active && ep.rowActive, pressed && ep.rowPressed]}
        >
          <View style={ep.thumbWrap}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={ep.thumbFill} contentFit="cover" cachePolicy="memory-disk" transition={100} />
            ) : null}
            {active ? (
              <View style={ep.thumbPlay} pointerEvents="none">
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            ) : null}
            {active ? (
              <View style={ep.nowBadge} pointerEvents="none">
                <Text style={ep.nowBadgeText}>NOW PLAYING</Text>
              </View>
            ) : watched > 0.05 ? (
              <View style={ep.progressPctBadge} pointerEvents="none">
                <Text style={ep.progressPctText}>{Math.min(100, Math.round(watched * 100))}%</Text>
              </View>
            ) : null}
          </View>
          <View style={ep.rowCopy}>
            <Text style={ep.rowEyebrow}>{`EP ${item.number}${active ? " · NOW" : ""}`}</Text>
            {title ? <Text numberOfLines={2} style={[ep.rowTitle, active && ep.rowTitleActive]}>{title}</Text> : null}
            {item.isFiller ? (
              <View style={ep.fillerTag}>
                <Text style={ep.fillerText}>FILLER</Text>
              </View>
            ) : null}
            {watched > 0.05 && !active && !item.isFiller ? (
              <View style={ep.progressTrack}>
                <View style={[ep.progressFill, { width: `${Math.min(100, watched * 100)}%` }]} />
              </View>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [activeEpisode, progressMap, onSelect],
  );

  return (
    <>
      <View style={ep.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={ep.headerTitle}>{t("player.listOfEpisodes")}</Text>
          <Text style={ep.headerSub}>{`${filtered.length} EPISODE`}</Text>
        </View>
        <View style={ep.prevNext}>
          <Pressable
            disabled={!hasPrevious}
            onPress={onPrevious}
            accessibilityRole="button"
            accessibilityLabel="Previous episode"
            style={[ep.navBtn, !hasPrevious && ep.navBtnDisabled]}
            hitSlop={8}
          >
            <SkipBack size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable
            disabled={!hasNext}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Next episode"
            style={[ep.navBtn, !hasNext && ep.navBtnDisabled]}
            hitSlop={8}
          >
            <SkipForward size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close episode list"
            style={ep.navBtn}
            hitSlop={8}
          >
            <X size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
      <View style={ep.search}>
        <Search size={13} color={playerTheme.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari episode…"
          placeholderTextColor="#8FA2BA"
          style={ep.searchInput}
          returnKeyType="done"
        />
      </View>
      <FlatList
        style={ep.list}
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
      />
    </>
  );
});
