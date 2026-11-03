import {
  createContext,
  useContext,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
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

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Light blue palette */
export const lightColors = {
  background: "#F5F8FF",
  surface: "#FFFFFF",
  raised: "#EAF3FF",
  line: "#C9DCF5",
  text: "#142B4B",
  muted: "#526985",
  dim: "#7890AC",
  accent: "#1677FF",
  card: "#FFFFFF",
  cardBorder: "#D9E7F8",
};

/** Deep navy palette */
export const darkColors = {
  background: "#071426",
  surface: "#10223B",
  raised: "#172D4B",
  line: "#294361",
  text: "#F7FAFF",
  muted: "#A8BBD4",
  dim: "#7890AC",
  accent: "#1677FF",
  card: "#141A22",
  cardBorder: "#294361",
};
