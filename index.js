// AnimeKx bootstrap: never allow the native splash to remain visible forever.
// This runs before Expo Router and gives the app a short, deterministic
// startup window. The normal Expo auto-hide behavior still handles the
// successful startup path.
const SplashScreen = require("expo-splash-screen");

try {
  SplashScreen.setOptions({ duration: 0, fade: false });
} catch {}

let splashReleased = false;
const releaseSplash = () => {
  if (splashReleased) return;
  splashReleased = true;
  try {
    const result = SplashScreen.hideAsync?.();
    if (result?.catch) result.catch(() => {});
  } catch {}
};

// Watchdog: even if a startup provider/module hangs, the native splash is
// released after 1500 ms instead of remaining on screen indefinitely.
setTimeout(releaseSplash, 1500);

try {
  require("expo-router/entry");
} catch (error) {
  releaseSplash();
  throw error;
}
