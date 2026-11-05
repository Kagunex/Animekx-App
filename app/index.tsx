import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AccessibilityInfo, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, BadgeDollarSign, Clapperboard, Film, MonitorSmartphone, Play, Sparkles, Star, Zap, type LucideIcon } from "lucide-react-native";
import { AnimeKzHeaderLogo } from "@/components/animekz-logo";
import { AnimePosterArtwork, ChibiAnimeIllustration, HeroAnimeIllustration } from "@/components/landing-artwork";
import { Skeleton } from "@/components/skeleton";
import { EmptyState, ErrorState } from "@/components/async-state";
import { getHomeAnime } from "@/lib/anilist";
import { animeTitle, type Anime } from "@/lib/types";
import { nsfwFilterParam, useNsfwPreference } from "@/lib/nsfw-preference";
import { useAnirakuAuth } from "@/providers/auth-provider";

const features: { title: string; caption: string; icon: LucideIcon }[] = [
  { title: "Streaming Super Cepat", caption: "No Buffering", icon: Zap },
  { title: "Kualitas HD", caption: "Jernih & Tajam", icon: Clapperboard },
  { title: "100% Gratis", caption: "Tanpa Biaya", icon: BadgeDollarSign },
  { title: "Multi Device", caption: "Di Mana Saja", icon: MonitorSmartphone },
];

function useMotionPreference() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => { if (active) setReduced(false); });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { active = false; sub.remove(); };
  }, []);
  return reduced;
}

function FeatureCard({ title, caption, icon: Icon, compact, wide }: { title: string; caption: string; icon: LucideIcon; compact: boolean; wide: boolean }) {
  return (
    <View style={[styles.featureCard, compact && styles.featureCardCompact, wide && styles.featureCardWide]}>
      <View style={styles.featureIcon}><Icon size={19} color="#2583F5" strokeWidth={2.2} /></View>
      <View style={styles.featureCopy}><Text style={styles.featureTitle} numberOfLines={2}>{title}</Text><Text style={styles.featureCaption}>{caption}</Text></View>
    </View>
  );
}

function AnimeCard({ item, index, compact }: { item: Anime; index: number; compact: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Lihat ${animeTitle(item)}`} onPress={() => router.push((`/anime/${item.id}`) as never)} style={({ pressed }) => [styles.animeCard, compact && styles.animeCardCompact, pressed && styles.cardPressed]}>
      <View style={styles.posterFrame}><AnimePosterArtwork variant={index} width={compact ? 124 : 144} height={compact ? 158 : 184} /><View style={styles.posterTop}><Film size={13} color="#FFFFFF" /><Text style={styles.posterTag}>ANIMEKZ PICK</Text></View></View>
      <Text style={styles.animeTitle} numberOfLines={2}>{animeTitle(item)}</Text>
      <View style={styles.animeMeta}>
        {item.averageScore ? <View style={styles.rating}><Star size={12} color="#2583F5" fill="#2583F5" /><Text style={styles.ratingText}>{(item.averageScore / 10).toFixed(1)}</Text></View> : null}
        <Text style={styles.episodeMeta} numberOfLines={1}>{[item.format, item.episodes ? `${item.episodes} Episode` : null].filter(Boolean).join(" · ") || "Anime pilihan"}</Text>
      </View>
    </Pressable>
  );
}

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const wide = width >= 760;
  const motion = useMotionPreference();
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [aboutOffset, setAboutOffset] = useState(0);
  const nsfw = useNsfwPreference();
  const isAdultParam = nsfwFilterParam(nsfw.enabled);
  const home = useQuery({ queryKey: ["home-anime", isAdultParam], queryFn: () => getHomeAnime(isAdultParam), enabled: nsfw.ready, retry: 2, staleTime: 5 * 60_000 });
  const auth = useAnirakuAuth();
  const popular = useMemo(() => (home.data?.popular?.length ? home.data.popular : home.data?.trending ?? []).slice(0, 4), [home.data]);
  const version = Constants.expoConfig?.version || Constants.nativeAppVersion || "—";

  useEffect(() => {
    if (motion === null) return;
    if (motion) { fade.setValue(1); float.setValue(0); return; }
    const intro = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(float, { toValue: -7, duration: 2400, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])),
    ]);
    intro.start();
    return () => intro.stop();
  }, [fade, float, motion]);

  const openHome = () => router.replace("/(tabs)" as never);
  const openDemo = () => router.push("/(tabs)/catalog" as never);
  const join = () => router.push((auth.user ? "/(tabs)/profile" : "/auth") as never);
  const onAboutLayout = (event: { nativeEvent: { layout: { y: number } } }) => setAboutOffset(event.nativeEvent.layout.y);
  const scrollToAbout = () => scrollRef.current?.scrollTo({ y: Math.max(aboutOffset - 16, 0), animated: true });
  const refresh = async () => { await home.refetch(); };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page, wide && styles.pageWide]} refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => void refresh()} tintColor="#2583F5" colors={["#2583F5"]} />}>
        <Animated.View style={{ opacity: fade }}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <AnimeKzHeaderLogo width={42} />
              <View style={styles.brandCopy}><Text style={styles.brandName}>AnimeKz</Text><Text style={styles.brandTagline}>Stream Anime · Tanpa Batas</Text></View>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push((auth.user ? "/(tabs)/profile" : "/auth") as never)} style={({ pressed }) => [styles.accountButton, pressed && styles.buttonPressed]}>
              <BlurView pointerEvents="none" intensity={30} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
              <Text style={styles.accountButtonText}>{auth.user ? "Profil" : "Masuk"}</Text><ArrowRight size={15} color="#102B50" />
            </Pressable>
          </View>

          <View style={[styles.hero, wide && styles.heroWide]}>
            <View pointerEvents="none" style={styles.heroOrb} /><View pointerEvents="none" style={styles.heroRule} />
            <View style={[styles.heroBody, wide && styles.heroBodyWide]}>
              <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
                <View style={styles.premiumLabel}><Sparkles size={14} color="#2583F5" /><Text style={styles.premiumText}>Streaming Anime Premium</Text></View>
                <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>Nikmati Anime Favoritmu di <Text style={styles.heroTitleBlue}>AnimeKz!</Text></Text>
                <Text style={styles.heroDescription}>Streaming anime subtitle Indonesia dengan kualitas terbaik, gratis dan tanpa ribet!</Text>
                <View style={styles.heroActions}>
                  <Pressable accessibilityRole="button" onPress={openHome} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}><Play size={16} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.primaryButtonText}>Mulai Sekarang</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={openDemo} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}><Text style={styles.secondaryButtonText}>Lihat Demo</Text><ArrowRight size={15} color="#2583F5" /></Pressable>
                </View>
                <View style={styles.heroFootnote}><View style={styles.onlineDot} /><Text style={styles.heroFootnoteText}>Temukan cerita berikutnya untuk kamu</Text></View>
              </View>
              <Animated.View style={[styles.heroArt, wide && styles.heroArtWide, { transform: [{ translateY: float }] }]}>
                <HeroAnimeIllustration width={wide ? Math.min(390, width * 0.42) : Math.min(290, width * 0.73)} height={wide ? 430 : 300} />
                <View pointerEvents="none" style={styles.filmStrip}><View style={styles.filmHole} /><View style={styles.filmHole} /><View style={styles.filmHole} /><View style={styles.filmHole} /></View>
                <View pointerEvents="none" style={styles.artSpark}><Sparkles size={17} color="#FFFFFF" /></View>
              </Animated.View>
            </View>
            <View pointerEvents="none" style={styles.heroCorner}><Text style={styles.heroCornerText}>DISCOVER / WATCH / REPEAT</Text></View>
          </View>

          <View style={[styles.featurePanel, wide && styles.featurePanelWide]}>
            <BlurView pointerEvents="none" intensity={30} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
            {features.map((feature) => <FeatureCard key={feature.title} {...feature} compact={compact} wide={wide} />)}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>PILIHAN KOMUNITAS</Text><Text style={styles.sectionTitle}>Anime Terpopuler</Text><Text style={styles.sectionSubtitle}>Jangan lewatkan anime terbaik pilihan kami!</Text></View><Pressable accessibilityRole="button" onPress={openDemo} style={({ pressed }) => [styles.seeAllButton, pressed && styles.aboutPressed]}><Text style={styles.seeAllText}>Semua</Text><ArrowRight size={14} color="#2583F5" /></Pressable></View>
            {home.isError && !popular.length ? <View style={styles.queryState}><ErrorState message="Anime populer belum bisa dimuat." onRetry={() => void home.refetch()} /></View> : home.isPending || (!home.data && !home.isError) ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.animeRail}>{[0, 1, 2, 3].map((index) => <View key={index} style={styles.animeCard}><Skeleton style={styles.posterSkeleton} /><Skeleton style={styles.skeletonTitle} /><Skeleton style={styles.skeletonMeta} /></View>)}</ScrollView> : popular.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={styles.animeRail}>{popular.map((item, index) => <AnimeCard key={item.id} item={item} index={index} compact={compact} />)}</ScrollView> : <EmptyState label="Belum ada pilihan anime yang tersedia." />}
          </View>

          <View style={[styles.community, wide && styles.communityWide]}>
            <BlurView pointerEvents="none" intensity={28} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
            <View style={styles.communityCopy}><View style={styles.communityLabel}><Sparkles size={13} color="#2583F5" /><Text style={styles.communityLabelText}>CERITA LEBIH SERU BERSAMA</Text></View><Text style={styles.communityTitle}>Gabung Sekarang!</Text><Text style={styles.communityDescription}>Dapatkan pengalaman menonton anime yang lebih seru dan lengkap!</Text><Pressable accessibilityRole="button" onPress={join} style={({ pressed }) => [styles.communityButton, pressed && styles.buttonPressed]}><Text style={styles.communityButtonText}>{auth.user ? "Buka Profil" : "Gabung Komunitas"}</Text><ArrowRight size={15} color="#FFFFFF" /></Pressable></View>
            <View pointerEvents="none" style={styles.chibiWrap}><ChibiAnimeIllustration width={wide ? 185 : 145} height={wide ? 165 : 140} /></View>
            <View pointerEvents="none" style={styles.communityCircle} />
          </View>

          <View style={styles.finalCta}>
            <View style={styles.finalCtaCopy}><Text style={styles.finalCtaEyebrow}>MULAI PETUALANGANMU</Text><Text style={styles.finalCtaTitle}>Satu dunia anime, ada di sini.</Text></View>
            <Pressable accessibilityRole="button" onPress={openHome} style={({ pressed }) => [styles.finalButton, pressed && styles.buttonPressed]}><Play size={17} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.finalButtonText}>Mulai Sekarang</Text><ArrowRight size={16} color="#FFFFFF" /></Pressable>
            <Pressable accessibilityRole="button" onPress={scrollToAbout} style={({ pressed }) => [styles.aboutButton, pressed && styles.aboutPressed]}><Text style={styles.aboutButtonText}>Tentang AnimeKz</Text></Pressable>
          </View>

          <View onLayout={onAboutLayout} style={styles.aboutSection}><View style={styles.aboutIcon}><Film size={18} color="#2583F5" /></View><View style={styles.aboutCopy}><Text style={styles.aboutTitle}>Cerita favorit, pengalaman yang terasa dekat.</Text><Text style={styles.aboutText}>AnimeKz membantu kamu menemukan anime dan melanjutkan tontonan dari satu tempat. Jelajahi katalog, pilih episode, lalu nikmati cerita dengan subtitle Indonesia.</Text></View></View>

          <View style={styles.footer}><View style={styles.footerBrand}><AnimeKzHeaderLogo width={30} /><Text style={styles.footerName}>AnimeKz <Text style={styles.footerVersion}>v{version}</Text></Text></View><Text style={styles.footerMade}>Made with <Text style={styles.heart}>♥</Text> for Anime Lovers</Text></View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F8FF" },
  page: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 38, gap: 18 },
  pageWide: { width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: 32, gap: 24 },
  header: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 }, brandCopy: { gap: 1 }, brandName: { color: "#102B50", fontSize: 19, fontWeight: "900", letterSpacing: -0.5 }, brandTagline: { color: "#6480A3", fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
  accountButton: { minHeight: 40, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, borderWidth: 1, borderColor: "#BED9F4", backgroundColor: "rgba(255,255,255,0.72)", overflow: "hidden" }, accountButtonText: { color: "#102B50", fontSize: 12, fontWeight: "800" },
  hero: { minHeight: 520, padding: 21, justifyContent: "center", overflow: "hidden", borderRadius: 26, borderWidth: 1.4, borderColor: "#B9D6F1", backgroundColor: "#EAF5FF", shadowColor: "#153B67", shadowOffset: { width: 3, height: 5 }, shadowOpacity: 0.09, shadowRadius: 0, elevation: 2 }, heroWide: { minHeight: 500, paddingHorizontal: 34, paddingVertical: 28 },
  heroOrb: { position: "absolute", width: 280, height: 280, borderRadius: 140, top: -170, right: -50, backgroundColor: "rgba(255,255,255,0.7)" }, heroRule: { position: "absolute", width: 270, height: 1, backgroundColor: "rgba(37,131,245,0.17)", right: -20, top: 80, transform: [{ rotate: "-34deg" }] },
  heroBody: { flex: 1, justifyContent: "space-between" }, heroBodyWide: { flexDirection: "row", alignItems: "center" }, heroCopy: { zIndex: 2, gap: 13 }, heroCopyWide: { width: "55%", paddingVertical: 26 },
  premiumLabel: { alignSelf: "flex-start", minHeight: 31, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, borderWidth: 1, borderColor: "#B5D5F7", backgroundColor: "rgba(255,255,255,0.74)" }, premiumText: { color: "#2868AD", fontSize: 11, fontWeight: "800", letterSpacing: 0.25 },
  heroTitle: { maxWidth: 570, color: "#102B50", fontSize: 40, lineHeight: 46, fontWeight: "900", letterSpacing: -1.5 }, heroTitleCompact: { fontSize: 34, lineHeight: 39, letterSpacing: -1.1 }, heroTitleBlue: { color: "#2583F5" }, heroDescription: { maxWidth: 440, color: "#587496", fontSize: 14, lineHeight: 21, fontWeight: "500" },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 3 }, primaryButton: { minHeight: 48, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 15, borderWidth: 1.2, borderColor: "#105FC3", backgroundColor: "#2583F5", shadowColor: "#1358A9", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.22, shadowRadius: 0, elevation: 2 }, primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, secondaryButton: { minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 15, borderWidth: 1.2, borderColor: "#B7D5F3", backgroundColor: "rgba(255,255,255,0.75)" }, secondaryButtonText: { color: "#214369", fontSize: 13, fontWeight: "800" }, buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.88 }, cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  heroFootnote: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 1 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2583F5" }, heroFootnoteText: { color: "#6480A3", fontSize: 10, fontWeight: "700" },
  heroArt: { height: 292, marginTop: -5, alignItems: "flex-end", justifyContent: "flex-end" }, heroArtWide: { width: "47%", height: 430, marginTop: 0, alignItems: "center" }, filmStrip: { position: "absolute", right: 0, top: 35, width: 15, height: 66, paddingVertical: 6, alignItems: "center", justifyContent: "space-between", borderRadius: 5, backgroundColor: "rgba(16,43,80,0.72)" }, filmHole: { width: 6, height: 8, borderRadius: 2, backgroundColor: "#DCEEFF" }, artSpark: { position: "absolute", top: 19, left: 18, width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)", backgroundColor: "rgba(37,131,245,0.72)" }, heroCorner: { position: "absolute", right: 18, bottom: 14, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.55)" }, heroCornerText: { color: "#6480A3", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  featurePanel: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, padding: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(177,207,238,0.9)", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.68)" }, featurePanelWide: { flexWrap: "nowrap", gap: 9, padding: 12 }, featureCard: { width: "48.5%", minHeight: 82, padding: 10, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 15, borderWidth: 1, borderColor: "#D1E4F7", backgroundColor: "rgba(255,255,255,0.86)" }, featureCardCompact: { minHeight: 78, padding: 8, gap: 7 }, featureCardWide: { width: "24%", flex: 1 }, featureIcon: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#E3F1FF" }, featureCopy: { flex: 1, gap: 3 }, featureTitle: { color: "#102B50", fontSize: 11, lineHeight: 14, fontWeight: "900" }, featureCaption: { color: "#6480A3", fontSize: 10, lineHeight: 13, fontWeight: "600" },
  section: { gap: 13 }, sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }, sectionEyebrow: { color: "#2583F5", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, sectionTitle: { color: "#102B50", fontSize: 22, lineHeight: 28, fontWeight: "900", letterSpacing: -0.7 }, sectionSubtitle: { marginTop: 2, color: "#6480A3", fontSize: 12, lineHeight: 17 }, seeAllButton: { minHeight: 34, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10 }, seeAllText: { color: "#2868AD", fontSize: 11, fontWeight: "900" },
  animeRail: { gap: 11, paddingVertical: 3, paddingRight: 8 }, animeCard: { width: 160, padding: 8, borderRadius: 17, borderWidth: 1, borderColor: "#C7DDF4", backgroundColor: "#FFFFFF", shadowColor: "#17436E", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.07, shadowRadius: 0, elevation: 1 }, animeCardCompact: { width: 140 }, posterFrame: { overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#102B50" }, posterTop: { position: "absolute", left: 7, top: 7, paddingHorizontal: 7, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.58)", backgroundColor: "rgba(16,43,80,0.65)" }, posterTag: { color: "#FFFFFF", fontSize: 7, fontWeight: "900", letterSpacing: 0.6 }, animeTitle: { minHeight: 36, marginTop: 9, color: "#102B50", fontSize: 13, lineHeight: 17, fontWeight: "900" }, animeMeta: { minHeight: 19, flexDirection: "row", alignItems: "center", gap: 7 }, rating: { flexDirection: "row", alignItems: "center", gap: 3 }, ratingText: { color: "#2868AD", fontSize: 10, fontWeight: "900" }, episodeMeta: { flex: 1, color: "#6480A3", fontSize: 9, fontWeight: "700" }, posterSkeleton: { width: "100%", height: 184, borderRadius: 12 }, skeletonTitle: { width: "75%", height: 14, marginTop: 9 }, skeletonMeta: { width: "50%", height: 10, marginTop: 6 }, queryState: { padding: 12, borderWidth: 1, borderColor: "#C7DDF4", borderRadius: 16, backgroundColor: "#FFFFFF" },
  community: { minHeight: 185, padding: 17, flexDirection: "row", alignItems: "center", overflow: "hidden", borderRadius: 22, borderWidth: 1.3, borderColor: "#B7D5F2", backgroundColor: "#DFEFFF" }, communityWide: { minHeight: 205, paddingHorizontal: 25 }, communityCopy: { zIndex: 2, flex: 1, gap: 7 }, communityLabel: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5 }, communityLabelText: { color: "#3A72B1", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, communityTitle: { color: "#102B50", fontSize: 22, lineHeight: 27, fontWeight: "900", letterSpacing: -0.7 }, communityDescription: { maxWidth: 350, color: "#587496", fontSize: 11, lineHeight: 16 }, communityButton: { alignSelf: "flex-start", minHeight: 38, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, backgroundColor: "#2583F5" }, communityButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, chibiWrap: { zIndex: 1, alignSelf: "flex-end", marginLeft: -12, marginBottom: -15 }, communityCircle: { position: "absolute", width: 205, height: 205, borderRadius: 103, right: -43, bottom: -97, backgroundColor: "rgba(255,255,255,0.6)" },
  finalCta: { alignItems: "center", gap: 10, paddingVertical: 10 }, finalCtaCopy: { alignItems: "center", gap: 4 }, finalCtaEyebrow: { color: "#2583F5", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, finalCtaTitle: { color: "#102B50", fontSize: 18, fontWeight: "900", textAlign: "center" }, finalButton: { width: "100%", minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 28, backgroundColor: "#2583F5", shadowColor: "#1358A9", shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.2, shadowRadius: 0, elevation: 3 }, finalButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, aboutButton: { minHeight: 40, paddingHorizontal: 18, justifyContent: "center", borderRadius: 13 }, aboutPressed: { backgroundColor: "#E2F0FF" }, aboutButtonText: { color: "#38658E", fontSize: 12, fontWeight: "800" },
  aboutSection: { flexDirection: "row", gap: 12, padding: 15, borderRadius: 17, borderWidth: 1, borderColor: "#C5DCF4", backgroundColor: "rgba(255,255,255,0.73)" }, aboutIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#E2F0FF" }, aboutCopy: { flex: 1, gap: 5 }, aboutTitle: { color: "#102B50", fontSize: 13, lineHeight: 18, fontWeight: "900" }, aboutText: { color: "#6480A3", fontSize: 11, lineHeight: 17 },
  footer: { minHeight: 46, paddingTop: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderTopWidth: 1, borderTopColor: "#D6E6F6" }, footerBrand: { flexDirection: "row", alignItems: "center", gap: 4 }, footerName: { color: "#102B50", fontSize: 12, fontWeight: "900" }, footerVersion: { color: "#6480A3", fontSize: 10, fontWeight: "700" }, footerMade: { color: "#7189A5", fontSize: 10, fontWeight: "600" }, heart: { color: "#2583F5", fontWeight: "900" },
});
