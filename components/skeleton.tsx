import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { nothing } from "@/components/nothing-ui";

let motionPreference: boolean | null = null;
let motionSubscription: { remove: () => void } | null = null;
const motionSubscribers = new Set<(value: boolean) => void>();

function publishMotionPreference(value: boolean) {
  motionPreference = value;
  motionSubscribers.forEach((subscriber) => subscriber(value));
}

function subscribeMotionPreference(subscriber: (value: boolean) => void) {
  motionSubscribers.add(subscriber);
  if (!motionSubscription) {
    AccessibilityInfo.isReduceMotionEnabled().then(publishMotionPreference).catch(() => publishMotionPreference(false));
    motionSubscription = AccessibilityInfo.addEventListener("reduceMotionChanged", publishMotionPreference);
  }
  return () => {
    motionSubscribers.delete(subscriber);
    if (motionSubscribers.size === 0) {
      motionSubscription?.remove();
      motionSubscription = null;
    }
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState<boolean | null>(motionPreference);
  useEffect(() => subscribeMotionPreference(setReduced), []);
  return reduced;
}

function Shimmer({ width }: { width: number }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced !== false || width <= 0) { progress.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 1450, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [progress, reduced, width]);
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.45, width] });
  return <Animated.View pointerEvents="none" style={[styles.shimmer, { transform: [{ translateX }] }]} />;
}

function Surface({ style, children }: { style: StyleProp<ViewStyle>; children?: ReactNode }) {
  const [width, setWidth] = useState(0);
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.surface, style]}>{children}<Shimmer width={width} /></View>;
}

export function Skeleton({ style }: { style?: ViewStyle }) {
  return <Surface style={[styles.base, style]} />;
}

export function SkeletonCard() {
  return <View style={cardStyles.container}><Skeleton style={cardStyles.poster} /><View style={cardStyles.body}><Skeleton style={cardStyles.title} /><Skeleton style={cardStyles.subtitle} /></View></View>;
}

export function SkeletonRail() {
  return <View style={railStyles.container}><Skeleton style={railStyles.poster} /><Skeleton style={railStyles.title} /></View>;
}

export function SkeletonEpisode() {
  return <View style={epStyles.container}><Skeleton style={epStyles.thumbnail} /><View style={epStyles.body}><Skeleton style={epStyles.title} /><Skeleton style={epStyles.meta} /></View></View>;
}

export function SkeletonHero() {
  return <View style={heroStyles.container}><Skeleton style={heroStyles.image} /><View style={heroStyles.content}><Skeleton style={heroStyles.badge} /><Skeleton style={heroStyles.title} /><Skeleton style={heroStyles.meta} /><View style={heroStyles.buttons}><Skeleton style={heroStyles.playBtn} /><Skeleton style={heroStyles.listBtn} /></View></View></View>;
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return <View style={gridStyles.container}>{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}</View>;
}

export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return <View style={pageStyles.list}>{Array.from({ length: count }).map((_, i) => <View key={i} style={pageStyles.searchRow}><Skeleton style={pageStyles.searchPoster} /><View style={pageStyles.searchCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.lineShort} /><View style={pageStyles.chips}><Skeleton style={pageStyles.chip} /><Skeleton style={pageStyles.chipSmall} /></View></View></View>)}</View>;
}

export function AnimeDetailSkeleton() {
  return <View style={pageStyles.detail}><View style={pageStyles.detailHero}><Skeleton style={pageStyles.detailPoster} /><View style={pageStyles.detailCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.lineShort} /><View style={pageStyles.chips}><Skeleton style={pageStyles.chip} /><Skeleton style={pageStyles.chipSmall} /></View></View></View><View style={pageStyles.panel}><Skeleton style={pageStyles.sectionTitle} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.lineShort} /></View><SkeletonEpisode /><SkeletonEpisode /></View>;
}

export function EpisodeInfoSkeleton() {
  return <View style={pageStyles.detail}><View style={pageStyles.detailHero}><Skeleton style={pageStyles.episodePoster} /><View style={pageStyles.detailCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.lineShort} /></View></View><View style={pageStyles.panel}><Skeleton style={pageStyles.sectionTitle} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.lineShort} /></View><Skeleton style={pageStyles.action} /></View>;
}

export function LibrarySkeleton() {
  return <View style={pageStyles.list}>{Array.from({ length: 4 }).map((_, i) => <View key={i} style={pageStyles.libraryRow}><Skeleton style={pageStyles.libraryPoster} /><View style={pageStyles.searchCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.progress} /></View></View>)}</View>;
}

export function ScheduleSkeleton() {
  return <View style={pageStyles.list}>{Array.from({ length: 5 }).map((_, i) => <View key={i} style={pageStyles.scheduleRow}><Skeleton style={pageStyles.time} /><View style={pageStyles.searchCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.lineShort} /></View><Skeleton style={pageStyles.schedulePoster} /></View>)}</View>;
}

export function ProfileSkeleton() {
  return <View style={pageStyles.detail}><View style={pageStyles.profileHero}><Skeleton style={pageStyles.avatar} /><View style={pageStyles.searchCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.line} /></View></View><View style={pageStyles.panel}><Skeleton style={pageStyles.sectionTitle} /><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.line} /></View><View style={pageStyles.profileTiles}><Skeleton style={pageStyles.tile} /><Skeleton style={pageStyles.tile} /></View></View>;
}

export function AnimeDiscoverySkeleton() {
  return <View style={pageStyles.discovery}><Skeleton style={pageStyles.discoveryImage} /><View style={pageStyles.discoveryCopy}><Skeleton style={pageStyles.titleWide} /><Skeleton style={pageStyles.line} /><View style={pageStyles.chips}><Skeleton style={pageStyles.chip} /><Skeleton style={pageStyles.chipSmall} /></View><View style={pageStyles.discoveryActions}><Skeleton style={pageStyles.discoveryButton} /><Skeleton style={pageStyles.discoveryButtonSmall} /></View></View></View>;
}

export function CommentsSkeleton() {
  return <View style={pageStyles.comments}>{Array.from({ length: 3 }).map((_, i) => <View key={i} style={pageStyles.comment}><View style={pageStyles.commentHead}><Skeleton style={pageStyles.commentAvatar} /><Skeleton style={pageStyles.commentName} /></View><Skeleton style={pageStyles.line} /><Skeleton style={pageStyles.lineShort} /></View>)}</View>;
}

const baseColor = "#E4F0FC";
const styles = StyleSheet.create({
  surface: { overflow: "hidden", backgroundColor: baseColor, borderRadius: 7 },
  base: { backgroundColor: baseColor, borderRadius: 7 },
  shimmer: { position: "absolute", left: 0, top: 0, bottom: 0, width: "38%", backgroundColor: "rgba(255,255,255,0.58)" },
});
const cardStyles = StyleSheet.create({
  container: { width: 140, backgroundColor: nothing.surface, borderWidth: 1, borderColor: "#C6DDF5", borderRadius: 12, overflow: "hidden" },
  poster: { width: "100%", height: 196, borderRadius: 0 }, body: { padding: 10, gap: 7 },
  title: { width: "80%", height: 12 }, subtitle: { width: "50%", height: 10 },
});
const railStyles = StyleSheet.create({ container: { width: 110, alignItems: "flex-start", gap: 7 }, poster: { width: 110, height: 154, borderRadius: 9 }, title: { width: "70%", height: 10 } });
const epStyles = StyleSheet.create({ container: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: nothing.surface, borderWidth: 1, borderColor: "#C6DDF5", borderRadius: 12, padding: 8 }, thumbnail: { width: 64, height: 40 }, body: { flex: 1, gap: 6 }, title: { width: "75%", height: 11 }, meta: { width: "45%", height: 9 } });
const heroStyles = StyleSheet.create({ container: { minHeight: 330, marginHorizontal: -18, overflow: "hidden", backgroundColor: "#EAF5FF", borderRadius: 18 }, image: { ...StyleSheet.absoluteFillObject, backgroundColor: "#E4F0FC", borderRadius: 0 }, content: { flex: 1, justifyContent: "flex-end", padding: 16, gap: 9 }, badge: { width: 54, height: 16 }, title: { width: "80%", height: 28 }, meta: { width: "50%", height: 12 }, buttons: { flexDirection: "row", gap: 10, marginTop: 4 }, playBtn: { width: 100, height: 38, borderRadius: 20 }, listBtn: { width: 100, height: 38, borderRadius: 20 } });
const gridStyles = StyleSheet.create({ container: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" } });
const pageStyles = StyleSheet.create({
  list: { gap: 10 }, searchRow: { minHeight: 132, flexDirection: "row", gap: 12, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" },
  searchPoster: { width: 82, height: 110 }, searchCopy: { flex: 1, gap: 9, justifyContent: "center" }, titleWide: { width: "78%", height: 15 }, line: { width: "94%", height: 10 }, lineShort: { width: "58%", height: 10 }, chips: { flexDirection: "row", gap: 6, marginTop: 2 }, chip: { width: 54, height: 20, borderRadius: 10 }, chipSmall: { width: 40, height: 20, borderRadius: 10 },
  detail: { gap: 14 }, detailHero: { flexDirection: "row", gap: 14, alignItems: "center", padding: 12, borderRadius: 18, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, detailPoster: { width: 105, height: 148 }, episodePoster: { width: 122, height: 82 }, detailCopy: { flex: 1, gap: 10 }, panel: { padding: 14, gap: 10, borderRadius: 16, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, sectionTitle: { width: "44%", height: 16, marginBottom: 3 }, action: { height: 46, borderRadius: 14 },
  libraryRow: { minHeight: 102, flexDirection: "row", gap: 12, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, libraryPoster: { width: 72, height: 82 }, progress: { width: "82%", height: 5, borderRadius: 5 },
  scheduleRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 10, padding: 9, borderRadius: 15, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, time: { width: 48, height: 12 }, schedulePoster: { width: 42, height: 58 },
  profileHero: { minHeight: 96, flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 17, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, avatar: { width: 62, height: 62, borderRadius: 31 }, profileTiles: { flexDirection: "row", gap: 10 }, tile: { flex: 1, height: 96, borderRadius: 16 },
  discovery: { overflow: "hidden", borderRadius: 18, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, discoveryImage: { width: "100%", height: 220, borderRadius: 0 }, discoveryCopy: { padding: 15, gap: 10 }, discoveryActions: { flexDirection: "row", gap: 9, marginTop: 4 }, discoveryButton: { width: 124, height: 42, borderRadius: 13 }, discoveryButtonSmall: { width: 86, height: 42, borderRadius: 13 },
  comments: { gap: 10 }, comment: { padding: 13, gap: 9, borderRadius: 15, borderWidth: 1, borderColor: "#C6DDF5", backgroundColor: "#FFFFFF" }, commentHead: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 2 }, commentAvatar: { width: 30, height: 30, borderRadius: 15 }, commentName: { width: 118, height: 11 },
});
