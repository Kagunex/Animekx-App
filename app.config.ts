import type { ExpoConfig } from "expo/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

// Expo's native icon and splash generators accept raster files only. Keep the
// required master SVG as the source of truth and derive build-only PNGs from
// it whenever Expo evaluates this config. The launcher variant scales the
// complete master mark into Android's adaptive-icon safe zone without edits.
const masterLogoPath = resolve(__dirname, "assets/icons/animekz_logo.svg");
const generatedDir = resolve(__dirname, "assets/icons/.generated");
const launcherIconPath = resolve(generatedDir, "animekz_launcher.png");
const splashLogoPath = resolve(generatedDir, "animekz_splash.png");
const masterLogoSvg = readFileSync(masterLogoPath, "utf8");
const safeZoneSvg = masterLogoSvg.replace(
  'viewBox="0 0 1024 1024"',
  'viewBox="-241 -241 1506 1506"',
);
mkdirSync(generatedDir, { recursive: true });
writeFileSync(
  launcherIconPath,
  new Resvg(safeZoneSvg, { fitTo: { mode: "width", value: 1024 } })
    .render()
    .asPng(),
);
writeFileSync(
  splashLogoPath,
  new Resvg(masterLogoSvg, { fitTo: { mode: "width", value: 1024 } })
    .render()
    .asPng(),
);

const env = {
  appName: "Animekz",
  appSlug: "aniraku",
  scheme: "aniraku",
  iosBundleId: "tech.aniraku.app",
  androidPackage: "com.animekz.app",
  easProjectId: "e96fc02e-d968-4f13-a688-0d553d855df7",
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/icons/.generated/animekz_launcher.png",
  scheme: env.scheme,
  userInterfaceStyle: "dark",
  // SDK 54 is the final Expo release that supports the proven legacy RN
  // architecture. Use it for the compatibility build after the new-architecture
  // APK terminated immediately on a Snapdragon 680 device.
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    versionCode: 67,
    adaptiveIcon: {
      backgroundColor: "#00102D",
      foregroundImage: "./assets/icons/.generated/animekz_launcher.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS", "REQUEST_INSTALL_PACKAGES"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: env.scheme, host: "auth" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: [{ scheme: env.scheme, host: "anime", pathPattern: ".*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "aniraku.tech", pathPrefix: "/anime/" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/icons/animekz_logo.svg",
  },
  plugins: [
    "expo-router",
    "expo-asset",
    "expo-audio",
    "expo-font",
    "expo-web-browser",
    ["react-native-video", { enableAndroidPictureInPicture: true }],
    ["expo-navigation-bar", { enforceContrast: false, hidden: false, style: "dark" }],
    ["expo-screen-orientation", { initialOrientation: "DEFAULT" }],
    ["expo-secure-store", { configureAndroidBackup: false }],
    ["expo-notifications", { color: "#1677FF" }],
    [
      "expo-splash-screen",
      {
        image: "./assets/icons/.generated/animekz_splash.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#071426",
        dark: { backgroundColor: "#071426" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a", "x86_64"],
          minSdkVersion: 28,
        },
      },
    ],
  ],
  // Keep file-route typing, but remove optional compiler/runtime experiments
  // from the compatibility build's startup path.
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: env.easProjectId } },
};

export default config;
