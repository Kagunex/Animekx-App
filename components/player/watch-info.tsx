import { memo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import Heart from "lucide-react-native/icons/heart";
import Download from "lucide-react-native/icons/download";
import Share2 from "lucide-react-native/icons/share-2";
import ListVideo from "lucide-react-native/icons/list-video";
import PlayIcon from "lucide-react-native/icons/play";
import StarIcon from "lucide-react-native/icons/star";
import CalendarIcon from "lucide-react-native/icons/calendar-days";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronUp from "lucide-react-native/icons/chevron-up";
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── AnimeKz soft-blue light palette (below-player info card) ──
const ink = {
  primary: "#168BFF",
  lightBlue: "#D9EEFF",
  bg: "#F2F8FF",
  surface: "#FFFFFF",
  text: "#102B50",
  secondary: "#647C9B",
  border: "#D6E8FA",
  banner: "#EAF4FF",
} as const;

const wi = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ink.border,
    backgroundColor: ink.surface,
    padding: 20,
    gap: 16,
    elevation: 4,
    shadowColor: "#102B50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  // ── Watching episode banner ──
  banner: {
    minHeight: 85,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#B9DCFF",
    backgroundColor: ink.banner,
    overflow: "hidden",
    paddingRight: 96,
  },
  playCircle: {
    width: 44,
    height: 44,
    marginLeft: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ink.primary,
  },
  bannerCopy: { flexShrink: 1, minWidth: 0, flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  bannerLabel: { color: ink.secondary, fontSize: 14, fontWeight: "700" },
  bannerEpisode: { color: ink.primary, fontSize: 14, fontWeight: "900" },
  bannerWaves: { position: "absolute", right: 0, top: 0, bottom: 0, width: 110 },
  // ── Details: poster + info ──
  detailsRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  poster: {
    width: 125,
    height: 185,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ink.border,
    backgroundColor: ink.lightBlue,
  },
  copy: { flex: 1, minWidth: 0, gap: 8 },
  eyebrow: { color: ink.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { color: ink.text, fontSize: 19, lineHeight: 24, fontWeight: "800", letterSpacing: -0.4 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ink.lightBlue,
    borderWidth: 1,
    borderColor: "#C7E3FF",
  },
  chipText: { color: ink.primary, fontSize: 10, fontWeight: "800" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: ink.secondary, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  // ── Synopsis ──
  synopsisBlock: { gap: 8, borderTopWidth: 1, borderTopColor: ink.border, paddingTop: 14 },
  synopsisLabel: { color: ink.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  synopsis: { color: ink.secondary, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  readMore: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 2 },
  readMoreText: { color: ink.primary, fontSize: 12, fontWeight: "800" },
  // ── Action pills ──
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    minHeight: 40,
    paddingHorizontal: 13,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: ink.bg,
    borderWidth: 1,
    borderColor: ink.border,
  },
  pillPressed: { transform: [{ scale: 0.95 }], backgroundColor: ink.lightBlue } as const,
  pillActive: { backgroundColor: ink.lightBlue, borderColor: ink.primary } as const,
  pillText: { color: ink.text, fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  pillTextActive: { color: ink.primary },
});

export type WatchActionState = {
  favorited: boolean;
  downloading: boolean;
  saved: boolean;
};

type WatchInfoProps = {
  animeId: number;
  title: string;
  posterUri: string;
  episode: number;
  seasonYear: number | null;
  genres: string[];
  synopsis: string;
  rating: number | null;
  actions: WatchActionState;
  onOpenInfo: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onShare: () => void;
  onEpisodeList: () => void;
};

/**
 * Soft-blue information card below the video: "watching" episode banner with
 * translucent wave art, live poster, dynamic genres/rating/year, and a smooth
 * read-more synopsis. All text and numbers come from the active anime data.
 */
export const WatchInfo = memo(function WatchInfo({
  animeId,
  title,
  posterUri,
  episode,
  seasonYear,
  genres,
  synopsis,
  rating,
  actions,
  onOpenInfo,
  onToggleFavorite,
  onDownload,
  onShare,
  onEpisodeList,
}: WatchInfoProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const toggleSynopsis = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSynopsisExpanded((v) => !v);
  };
  return (
    <View style={wi.card} accessibilityLabel={`About ${title} (id ${animeId})`}>
      {/* ── Watching episode banner ── */}
      <View style={wi.banner} accessibilityLabel={`You are watching episode ${episode}`}>
        <View style={wi.playCircle}>
          <PlayIcon size={18} color="#FFFFFF" fill="#FFFFFF" />
        </View>
        <View style={wi.bannerCopy}>
          <Text style={wi.bannerLabel}>You are watching&nbsp;</Text>
          <Text style={wi.bannerEpisode} numberOfLines={1}>{`Episode ${episode}`}</Text>
        </View>
        {/* Translucent blue wave decoration, right side */}
        <View pointerEvents="none" style={wi.bannerWaves}>
          <Svg width="110" height="85" viewBox="0 0 110 85" fill="none">
            <Path d="M55 0C75 22 88 30 110 34V85H55C50 62 40 26 55 0Z" fill="#168BFF" opacity={0.14} />
            <Path d="M78 0C92 20 100 26 110 28V85H78C74 60 68 22 78 0Z" fill="#168BFF" opacity={0.22} />
          </Svg>
        </View>
      </View>

      {/* ── Poster + details ── */}
      <View style={wi.detailsRow}>
        <Image source={{ uri: posterUri }} style={wi.poster} contentFit="cover" cachePolicy="memory-disk" transition={150} />
        <View style={wi.copy}>
          <Text style={wi.eyebrow}>{`NOW STREAMING · EP ${episode}`}</Text>
          <Text numberOfLines={3} ellipsizeMode="tail" style={wi.title}>{title}</Text>
          {genres.length > 0 ? (
            <View style={wi.chipsRow}>
              {genres.map((genre) => (
                <View key={genre} style={wi.chip}>
                  <Text style={wi.chipText}>{genre}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={wi.metaRow}>
            {rating != null && rating > 0 ? (
              <View style={wi.metaItem}>
                <StarIcon size={13} color={ink.primary} fill={ink.primary} />
                <Text style={wi.metaText}>{`${Math.round(rating)}%`}</Text>
              </View>
            ) : null}
            {seasonYear ? (
              <View style={wi.metaItem}>
                <CalendarIcon size={13} color={ink.primary} />
                <Text style={wi.metaText}>{seasonYear}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Synopsis ── */}
      {synopsis ? (
        <View style={wi.synopsisBlock}>
          <Text style={wi.synopsisLabel}>SYNOPSIS</Text>
          <Text numberOfLines={synopsisExpanded ? undefined : 4} style={wi.synopsis}>{synopsis}</Text>
          {synopsis.length > 160 ? (
            <Pressable
              onPress={toggleSynopsis}
              accessibilityRole="button"
              accessibilityLabel={synopsisExpanded ? "Show less synopsis" : "Read full synopsis"}
              style={wi.readMore}
            >
              <Text style={wi.readMoreText}>{synopsisExpanded ? "Read Less" : "Read More"}</Text>
              {synopsisExpanded
                ? <ChevronUp size={14} color={ink.primary} strokeWidth={2.6} />
                : <ChevronDown size={14} color={ink.primary} strokeWidth={2.6} />}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* ── Action pills ── */}
      <View style={wi.pillsRow}>
        <Pressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={actions.favorited ? "Remove from favorites" : "Add to favorites"}
          style={({ pressed }) => [wi.pill, actions.favorited && wi.pillActive, pressed && wi.pillPressed]}
        >
          <Heart size={17} color={actions.favorited ? ink.primary : ink.text} fill={actions.favorited ? ink.primary : "transparent"} />
          <Text style={[wi.pillText, actions.favorited && wi.pillTextActive]}>{actions.favorited ? "FAVORITED" : "FAVORITE"}</Text>
        </Pressable>
        <Pressable
          onPress={onDownload}
          accessibilityRole="button"
          accessibilityLabel="Download episode"
          style={({ pressed }) => [wi.pill, (actions.saved || actions.downloading) && wi.pillActive, pressed && wi.pillPressed]}
        >
          <Download size={17} color={actions.downloading ? ink.secondary : (actions.saved ? ink.primary : ink.text)} />
          <Text style={[wi.pillText, actions.saved && wi.pillTextActive, actions.downloading && { color: ink.secondary }]}>
            {actions.downloading ? "SAVING…" : actions.saved ? "SAVED" : "DOWNLOAD"}
          </Text>
        </Pressable>
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share anime" style={({ pressed }) => [wi.pill, pressed && wi.pillPressed]}>
          <Share2 size={16} color={ink.text} />
          <Text style={wi.pillText}>SHARE</Text>
        </Pressable>
        <Pressable onPress={onEpisodeList} accessibilityRole="button" accessibilityLabel="Jump to episode list" style={({ pressed }) => [wi.pill, pressed && wi.pillPressed]}>
          <ListVideo size={17} color={ink.text} />
          <Text style={wi.pillText}>EPISODES</Text>
        </Pressable>
      </View>
    </View>
  );
});
