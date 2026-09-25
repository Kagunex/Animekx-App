import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Pressable, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProviders } from "@/providers/app-providers";
import { nothing } from "@/components/nothing-ui";
import { ConnectivitySignal } from "@/components/connectivity-signal";
import { AppUpdatePrompt } from "@/components/app-update-prompt";
import { SupportPrompt } from "@/components/support-prompt";
import { AniListDownBanner } from "@/components/anilist-down-banner";
import { FirstRunOnboarding } from "@/components/first-run-onboarding";
import { useStartupPrefetch } from "@/hooks/use-startup-prefetch";

/** Must render inside AppProviders — calls useQueryClient. */
function StartupPrefetcher() {
  useStartupPrefetch();
  return null;
}

// Do not mutate React Native Text/TextInput defaultProps.
// React Native 0.81 / React 19 no longer relies on this legacy API.
// Fonts are configured by the expo-font config plugin instead.

// Keep splash behavior simple: Expo hides the native splash automatically
// once the root is ready. A second hide call is harmless and prevents a
// configured splash from lingering after the first React commit.
SplashScreen.setOptions({ duration: 0, fade: false });

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
    void SystemUI.setBackgroundColorAsync(nothing.black).catch(() => {});
  }, []);

  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: nothing.black }}><SafeAreaProvider><AppProviders><StartupPrefetcher /><StatusBar style="light" translucent backgroundColor="transparent" /><Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: nothing.black } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="anime/[id]" /><Stack.Screen name="watch/[id]" /><Stack.Screen name="search" options={{ presentation: "card" }} /><Stack.Screen name="auth" options={{ presentation: "modal" }} /><Stack.Screen name="settings" options={{ presentation: "modal" }} /><Stack.Screen name="support" options={{ presentation: "modal" }} /><Stack.Screen name="library" /><Stack.Screen name="legal" options={{ presentation: "modal" }} /></Stack><ConnectivitySignal /><AppUpdatePrompt /><SupportPrompt /><AniListDownBanner /><FirstRunOnboarding onComplete={() => {}} /></AppProviders></SafeAreaProvider></GestureHandlerRootView>;
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <GestureHandlerRootView style={{ flex: 1, padding: 24, gap: 14, alignItems: "center", justifyContent: "center", backgroundColor: nothing.black }}><StatusBar style="light" /><Text style={{ color: nothing.red, fontFamily: "monospace", fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>APPLICATION STATE</Text><Text style={{ color: nothing.white, fontSize: 22, fontWeight: "900", textAlign: "center" }}>AnimeKx needs to restart this screen.</Text><Text style={{ color: nothing.muted, fontSize: 14, lineHeight: 20, textAlign: "center" }}>{error.message || "An unexpected state occurred."}</Text><Pressable onPress={retry} style={{ minHeight: 48, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", backgroundColor: nothing.white, borderRadius: 14 }}><Text style={{ color: nothing.black, fontWeight: "900" }}>Retry</Text></Pressable></GestureHandlerRootView>;
}
