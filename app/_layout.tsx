import { useEffect } from "react";
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

// Set Space Grotesk as the global default font (Nothing OS system font).
// Text and TextInput are class components in RN so defaultProps works at runtime.
// @ts-expect-error — defaultProps is removed from RN 0.81 types but still functions
Text.defaultProps = { ...(Text.defaultProps ?? {}), style: [{ fontFamily: "SpaceGrotesk-Regular" }, Text.defaultProps?.style].filter(Boolean) };
// @ts-expect-error — same as above
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), style: [{ fontFamily: "SpaceGrotesk-Regular" }, TextInput.defaultProps?.style].filter(Boolean) };

// Splash is intentionally left to Expo's native auto-hide behavior.
// Fonts are embedded by the expo-font config plugin, so startup does not wait
// for an asynchronous font load and the native splash cannot be held by JS.

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(nothing.black).catch(() => {});
  }, []);

  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: nothing.black }}><SafeAreaProvider><AppProviders><StartupPrefetcher /><StatusBar style="light" translucent backgroundColor="transparent" /><Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: nothing.black } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="anime/[id]" /><Stack.Screen name="watch/[id]" /><Stack.Screen name="search" options={{ presentation: "card" }} /><Stack.Screen name="auth" options={{ presentation: "modal" }} /><Stack.Screen name="settings" options={{ presentation: "modal" }} /><Stack.Screen name="support" options={{ presentation: "modal" }} /><Stack.Screen name="library" /><Stack.Screen name="legal" options={{ presentation: "modal" }} /></Stack><ConnectivitySignal /><AppUpdatePrompt /><SupportPrompt /><AniListDownBanner /><FirstRunOnboarding onComplete={() => {}} /></AppProviders></SafeAreaProvider></GestureHandlerRootView>;
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <GestureHandlerRootView style={{ flex: 1, padding: 24, gap: 14, alignItems: "center", justifyContent: "center", backgroundColor: nothing.black }}><StatusBar style="light" /><Text style={{ color: nothing.red, fontFamily: "monospace", fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>APPLICATION STATE</Text><Text style={{ color: nothing.white, fontSize: 22, fontWeight: "900", textAlign: "center" }}>AnimeKx needs to restart this screen.</Text><Text style={{ color: nothing.muted, fontSize: 14, lineHeight: 20, textAlign: "center" }}>{error.message || "An unexpected state occurred."}</Text><Pressable onPress={retry} style={{ minHeight: 48, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", backgroundColor: nothing.white, borderRadius: 14 }}><Text style={{ color: nothing.black, fontWeight: "900" }}>Retry</Text></Pressable></GestureHandlerRootView>;
}
