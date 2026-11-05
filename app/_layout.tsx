import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
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
import { AnimeKzLogoMark } from "@/components/animekz-logo";

function StartupBrand() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F5FAFF",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: "#B9E2FF",
          top: -170,
          right: -120,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 220,
          height: 6,
          backgroundColor: "#4BA3E8",
          opacity: 0.18,
          transform: [{ rotate: "-38deg" }],
          bottom: 110,
          left: -45,
        }}
      />
      <Animated.View
        style={{ alignItems: "center", opacity, transform: [{ scale }] }}
      >
        <AnimeKzLogoMark width={176} wordmark />
      </Animated.View>
    </View>
  );
}

/** Must render inside AppProviders — calls useQueryClient. */
function StartupPrefetcher() {
  useStartupPrefetch();
  return null;
}

// Keep the same startup path as the upstream Animekz app.
// Expo Router owns the native splash lifecycle; there is intentionally no
// custom index.js, watchdog, preventAutoHideAsync(), or manual hideAsync().
// The splash is allowed to disappear as soon as the root is ready.
const legacyTextDefaults = Text as unknown as {
  defaultProps?: { style?: unknown };
};
const legacyInputDefaults = TextInput as unknown as {
  defaultProps?: { style?: unknown };
};
legacyTextDefaults.defaultProps = {
  ...(legacyTextDefaults.defaultProps ?? {}),
  style: [
    { fontFamily: "SpaceGrotesk-Regular" },
    legacyTextDefaults.defaultProps?.style,
  ].filter(Boolean),
};
legacyInputDefaults.defaultProps = {
  ...(legacyInputDefaults.defaultProps ?? {}),
  style: [
    { fontFamily: "SpaceGrotesk-Regular" },
    legacyInputDefaults.defaultProps?.style,
  ].filter(Boolean),
};

export const unstable_settings = { anchor: "index" };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.ttf"),
    "SpaceGrotesk-Medium": require("../assets/fonts/SpaceGrotesk-Medium.ttf"),
    "SpaceGrotesk-SemiBold": require("../assets/fonts/SpaceGrotesk-SemiBold.ttf"),
    "Caveat-Bold": require("../assets/fonts/Caveat-Bold.ttf"),
    "Caveat-Medium": require("../assets/fonts/Caveat-Medium.ttf"),
    "Caveat-Regular": require("../assets/fonts/Caveat-Regular.ttf"),
    "Caveat-SemiBold": require("../assets/fonts/Caveat-SemiBold.ttf"),
    "HennyPenny-Regular": require("../assets/fonts/HennyPenny-Regular.ttf"),
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync("#F5FAFF").catch(() => {});
  }, []);

  // Render a real native-sized view while fonts load. This follows the
  // upstream Animekz startup path and avoids holding the splash with a
  // manual preventAutoHideAsync gate.
  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: "#F5FAFF" }}
      >
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <StartupBrand />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F5FAFF" }}>
      <SafeAreaProvider>
        <AppProviders>
          <StartupPrefetcher />
          <StatusBar style="dark" translucent backgroundColor="transparent" />
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: "#F5FAFF" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="anime/[id]" />
            <Stack.Screen name="watch/[id]" />
            <Stack.Screen name="search" options={{ presentation: "card" }} />
            <Stack.Screen name="auth" options={{ presentation: "modal" }} />
            <Stack.Screen name="settings" options={{ presentation: "modal" }} />
            <Stack.Screen name="support" options={{ presentation: "modal" }} />
            <Stack.Screen name="library" />
            <Stack.Screen name="legal" options={{ presentation: "modal" }} />
          </Stack>
          <ConnectivitySignal />
          <AppUpdatePrompt />
          <SupportPrompt />
          <AniListDownBanner />
          <FirstRunOnboarding onComplete={() => {}} />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        padding: 24,
        gap: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5FAFF",
      }}
    >
      <StatusBar style="dark" />
      <Text
        style={{
          color: nothing.red,
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 1,
        }}
      >
        APPLICATION STATE
      </Text>
      <Text
        style={{
          color: nothing.white,
          fontSize: 22,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        Animekz needs to restart this screen.
      </Text>
      <Text
        style={{
          color: nothing.muted,
          fontSize: 14,
          lineHeight: 20,
          textAlign: "center",
        }}
      >
        {error.message || "An unexpected state occurred."}
      </Text>
      <Pressable
        onPress={retry}
        style={{
          minHeight: 48,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#4BA3E8",
          borderRadius: 14,
        }}
      >
        <Text style={{ color: "#172B3A", fontWeight: "900" }}>Retry</Text>
      </Pressable>
    </GestureHandlerRootView>
  );
}
