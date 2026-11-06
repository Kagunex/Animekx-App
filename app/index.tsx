import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/providers/theme-provider";
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Compass, Film, MessageSquare, Moon, Play, Settings, Smartphone, Star, Sun, Zap } from "lucide-react-native";
import { AnimeKzHeaderLogo } from "@/components/animekz-logo";
import { getAnimePage } from "@/lib/anilist";
import { animeTitle, type Anime } from "@/lib/types";
import { useNsfwPreference } from "@/lib/nsfw-preference";

const BLUE = "#1675F5";
const NAVY = "#102B59";
const LIGHT = "#DCEBFF";
const HERO_BANNER = require("@/assets/images/naruto-shippuden-hero.jpg");
const titles = ["Naruto Shippuden", "Naruto", "Boruto: Naruto Next Generations"];
const features = [
  { label: "Streaming Lancar", icon: Zap },
  { label: "Kualitas HD", icon: Film },
  { label: "Subtitle Indonesia", icon: MessageSquare },
  { label: "Koleksi Anime", icon: Smartphone },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => listener.remove();
  }, []);
  return reduced;
}

function AnimeCollectionCard({ anime, fallbackTitle, index, onPress }: { anime?: Anime; fallbackTitle: string; index: number; onPress: () => void }) {
  const title = anime ? animeTitle(anime) : fallbackTitle;
  const score = anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : ["9.0", "9.1", "9.2"][index];
  const episode = anime?.episodes ?? [500, 220, 293][index];
  const image = anime?.coverImage?.extraLarge ?? anime?.coverImage?.large;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Buka ${title}`} style={({ pressed }) => [styles.animeCard, pressed && styles.pressed]}>
      {image ? <Image source={{ uri: image }} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, styles.posterFallback]} />}
      <View pointerEvents="none" style={styles.posterShade} />
      <View style={styles.rating}><Star size={12} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.ratingText}>{score}</Text></View>
      <View style={styles.cardCopy}><Text numberOfLines={2} style={styles.cardTitle}>{fallbackTitle}</Text><View style={styles.cardEpisode}><Play size={11} color="#FFFFFF" fill="#FFFFFF" /><Text numberOfLines={1} style={styles.cardEpisodeText}>S1 · Episode {episode}</Text></View></View>
    </Pressable>
  );
}

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const small = width < 380;
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const float = useRef(new Animated.Value(0)).current;
  const nsfw = useNsfwPreference();
  const animeQueries = useQueries({ queries: titles.map((search) => ({ queryKey: ["landing-anime", search, nsfw.enabled], queryFn: () => getAnimePage({ search, perPage: 5, isAdult: nsfw.enabled }).then((page) => page.media), enabled: nsfw.ready, staleTime: 30 * 60_000 })) });
  const animeByTitle = useMemo(() => animeQueries.map((query, index) => {
    const list = query.data ?? [];
    const target = titles[index].toLowerCase();
    return list.find((anime) => [anime.title.english, anime.title.romaji].some((name) => name?.toLowerCase() === target))
      ?? list.find((anime) => [anime.title.english, anime.title.romaji].some((name) => name?.toLowerCase().startsWith(target)));
  }), [animeQueries]);
  const version = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  useEffect(() => {
    if (reducedMotion) { float.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -6, duration: 2300, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2300, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [float, reducedMotion]);

  const toggleTheme = () => theme.setMode(theme.isDark ? "light" : "dark");
  const openHome = () => router.replace("/(tabs)" as never);
  const openCatalog = () => router.push("/(tabs)/catalog" as never);
  const openSettings = () => router.push("/settings" as never);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}><AnimeKzHeaderLogo width={46} /><View><Text style={styles.brandName}>AnimeKz</Text><Text style={styles.tagline}>Watch. Stream. Enjoy.</Text></View></View>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Ganti tema" onPress={toggleTheme} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>{theme.isDark ? <Sun size={18} color={BLUE} /> : <Moon size={18} color={BLUE} />}</Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Pengaturan" onPress={openSettings} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}><Settings size={18} color={NAVY} /></Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <Animated.View pointerEvents="none" style={[styles.heroBackdrop, { transform: [{ translateY: reducedMotion ? 0 : float }] }]}><Image source={HERO_BANNER} contentFit="cover" contentPosition="center" transition={220} style={styles.heroImage} /></Animated.View>
          <View pointerEvents="none" style={styles.heroWash} />
          <View style={styles.heroContent}>
            <View style={styles.streamingBadge}><Text style={styles.sparkle}>✦</Text><Text style={styles.badgeText}>STREAMING ANIME</Text><View style={styles.badgeDot} /></View>
            <Text style={[styles.headline, small && styles.headlineSmall]}>Temukan{"\n"}Dunia Anime{"\n"}<Text style={styles.headlineBlue}>Favoritmu</Text></Text>
            <Text style={styles.description}>Nonton anime pilihanmu,{"\n"}kapan saja.</Text>
            <View style={styles.descriptionRule} />
            <View style={styles.heroButtons}>
              <Pressable accessibilityRole="button" onPress={openHome} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Play size={17} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.primaryButtonText}>Mulai Sekarang</Text><ChevronRight size={18} color="#FFFFFF" /></Pressable>
              <Pressable accessibilityRole="button" onPress={openCatalog} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Compass size={17} color={BLUE} /><Text style={styles.secondaryButtonText}>Jelajahi Anime</Text><ChevronRight size={18} color={BLUE} /></Pressable>
            </View>
          </View>
          <View pointerEvents="none" style={styles.energySweep} />
        </View>

        <View style={styles.featurePanel}>
          <BlurView intensity={34} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          {features.map(({ label, icon: Icon }, index) => <View key={label} style={[styles.feature, index > 0 && styles.featureDivider]}><Icon size={21} color={BLUE} strokeWidth={2.2} /><Text style={styles.featureText}>{label}</Text></View>)}
        </View>

        <View style={styles.collectionSection}>
          <View style={styles.sectionHeading}><View style={styles.headingCopy}><Text style={styles.sectionTitle}>Pilihan Uchiha</Text><Text style={styles.sectionSubtitle}>Anime terbaik untuk menemani harimu!</Text></View><Pressable onPress={openCatalog} accessibilityRole="button" style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}><Text style={styles.seeAllText}>Lihat Semua</Text><ChevronRight size={17} color={BLUE} /></Pressable></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRail}>
            {titles.map((title, index) => <AnimeCollectionCard key={title} anime={animeByTitle[index]} fallbackTitle={index === 2 ? "Boruto" : title} index={index} onPress={() => animeByTitle[index] ? router.push((`/anime/${animeByTitle[index]!.id}`) as never) : openCatalog()} />)}
          </ScrollView>
        </View>

        <Pressable accessibilityRole="button" onPress={openHome} style={({ pressed }) => [styles.bottomCta, pressed && styles.pressed]}><Play size={24} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.bottomCtaText}>Mulai Sekarang</Text><ChevronRight size={23} color="#FFFFFF" /></Pressable>

        <View style={styles.footer}><View style={styles.footerStroke} /><Text style={styles.footerText}>AnimeKz · Watch. Stream. Enjoy.</Text><View style={styles.footerStroke} /></View>
        <View pointerEvents="none" style={styles.footerArt}><View style={styles.footerBlueLeft} /><View style={styles.footerBlueRight} /></View>
        <Text style={styles.version}>v{version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F6FF" },
  page: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 24, gap: 18, overflow: "hidden" },
  header: { minHeight: 55, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 }, brandName: { color: NAVY, fontSize: 19, fontWeight: "900", letterSpacing: -0.5 }, tagline: { color: "#6480A3", fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
  headerActions: { flexDirection: "row", gap: 9 }, roundButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.95)", backgroundColor: "rgba(255,255,255,0.83)", shadowColor: NAVY, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  hero: { height: 540, borderRadius: 28, overflow: "hidden", backgroundColor: "#DCEBFF", borderWidth: 1, borderColor: "#C4D9F4", justifyContent: "center" }, heroBackdrop: { position: "absolute", top: -10, bottom: -10, left: -10, right: -10, zIndex: 0 }, heroImage: { width: "100%", height: "100%" }, heroWash: { ...StyleSheet.absoluteFillObject, width: "50%", backgroundColor: "rgba(240,246,255,0.76)" },
  heroContent: { zIndex: 2, paddingHorizontal: 19, paddingTop: 20, width: "86%", alignSelf: "flex-start" }, streamingBadge: { alignSelf: "flex-start", height: 31, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.95)", backgroundColor: "rgba(255,255,255,0.78)" }, sparkle: { color: BLUE, fontSize: 14, fontWeight: "900" }, badgeText: { color: NAVY, fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE },
  headline: { marginTop: 18, color: NAVY, fontSize: 39, lineHeight: 43, fontWeight: "900", fontStyle: "italic", letterSpacing: -1.5 }, headlineSmall: { fontSize: 35, lineHeight: 39 }, headlineBlue: { color: BLUE }, description: { marginTop: 13, color: NAVY, fontSize: 15, lineHeight: 22, fontWeight: "600" }, descriptionRule: { marginTop: 12, width: 46, height: 4, borderRadius: 2, backgroundColor: BLUE },
  heroButtons: { marginTop: 20, gap: 9, alignSelf: "flex-start", maxWidth: "100%" }, primaryButton: { minHeight: 51, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 28, borderWidth: 1, borderColor: "#0D5FCC", backgroundColor: BLUE, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, secondaryButton: { minHeight: 49, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 26, borderWidth: 1.3, borderColor: "#9FC5F4", backgroundColor: "rgba(255,255,255,0.9)" }, secondaryButtonText: { color: NAVY, fontSize: 13, fontWeight: "800" },
  energySweep: { position: "absolute", right: -48, bottom: -45, width: 270, height: 112, borderTopWidth: 3, borderColor: "rgba(22,117,245,0.65)", borderRadius: 150, transform: [{ rotate: "-18deg" }] },
  featurePanel: { minHeight: 105, flexDirection: "row", alignItems: "stretch", borderRadius: 23, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.98)", backgroundColor: "rgba(255,255,255,0.68)", overflow: "hidden", shadowColor: NAVY, shadowOpacity: 0.08, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, feature: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 3, paddingVertical: 12 }, featureDivider: { borderLeftWidth: 1, borderColor: LIGHT }, featureText: { minHeight: 28, textAlign: "center", textAlignVertical: "center", color: NAVY, fontSize: 9, lineHeight: 12, fontWeight: "800" },
  collectionSection: { gap: 14 }, sectionHeading: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 }, headingCopy: { flex: 1 }, sectionTitle: { color: NAVY, fontSize: 21, lineHeight: 27, fontWeight: "900", letterSpacing: -0.5 }, sectionSubtitle: { color: "#6480A3", fontSize: 11, lineHeight: 16, fontWeight: "500" }, seeAll: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 1, paddingHorizontal: 8 }, seeAllText: { color: BLUE, fontSize: 11, fontWeight: "800" }, cardsRail: { gap: 12, paddingVertical: 3, paddingRight: 2 },
  animeCard: { width: 187, height: 272, borderRadius: 20, overflow: "hidden", backgroundColor: LIGHT, borderWidth: 1, borderColor: "#B9D2F2", shadowColor: NAVY, shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, posterFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#18345A" }, posterShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 100, backgroundColor: "rgba(6,24,51,0.68)", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }, rating: { position: "absolute", top: 11, right: 10, height: 28, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 16, backgroundColor: BLUE, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" }, ratingText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, cardCopy: { position: "absolute", left: 12, right: 10, bottom: 12 }, cardTitle: { color: "#FFFFFF", fontSize: 17, lineHeight: 21, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 5 }, cardEpisode: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 5 }, cardEpisodeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 4 },
  bottomCta: { minHeight: 65, marginTop: 1, marginHorizontal: 3, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 13, borderRadius: 36, borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: BLUE, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 11, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, bottomCtaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  footer: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 2 }, footerStroke: { flex: 1, maxWidth: 66, height: 1, backgroundColor: "#AFCDF2" }, footerText: { color: "#6480A3", fontSize: 10, fontWeight: "700" }, footerArt: { position: "absolute", left: -18, right: -18, bottom: 0, height: 20, flexDirection: "row", justifyContent: "space-between", overflow: "hidden" }, footerBlueLeft: { width: 95, height: 38, borderTopWidth: 5, borderColor: "rgba(22,117,245,0.28)", borderRadius: 40, transform: [{ rotate: "-18deg" }] }, footerBlueRight: { width: 95, height: 38, borderTopWidth: 5, borderColor: "rgba(22,117,245,0.28)", borderRadius: 40, transform: [{ rotate: "18deg" }] }, version: { color: "#8AA2BF", fontSize: 9, textAlign: "center", marginBottom: 5 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});
