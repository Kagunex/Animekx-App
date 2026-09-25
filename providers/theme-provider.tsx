import { createContext, useContext, useState, useEffect, type PropsWithChildren } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export type ThemeMode = "dark" | "light" | "system";

type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "aniraku.theme.v1";

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  isDark: true,
  setMode: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const isDark = mode === "system" ? systemScheme !== "light" : mode === "dark";

  return <ThemeContext.Provider value={{ mode, isDark, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** AnimeKx light palette (rarely used — app is dark-first) */
export const lightColors = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  raised: "#EEF0F4",
  line: "#D8DCE6",
  text: "#0D1018",
  muted: "#5A6070",
  dim: "#8A90A0",
  accent: "#FF6A00",
  card: "#FFFFFF",
  cardBorder: "#E2E6EF",
};

/** AnimeKx dark premium palette */
export const darkColors = {
  background: "#0B0F14",
  surface: "#0F141C",
  raised: "#141A22",
  line: "#243040",
  text: "#FFFFFF",
  muted: "#A0A7B3",
  dim: "#6B7380",
  accent: "#FF6A00",
  card: "#141A22",
  cardBorder: "#243040",
};
