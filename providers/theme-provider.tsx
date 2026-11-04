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
  mode: "light",
  isDark: false,
  setMode: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light");

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
  primary: "#8CCFFF",
  secondary: "#FFFFFF",
  background: "#F5FAFF",
  surface: "#FFFFFF",
  raised: "#EAF5FF",
  line: "#263746",
  text: "#172B3A",
  muted: "#71869A",
  dim: "#8CA0B1",
  accent: "#4BA3E8",
  card: "#FFFFFF",
  cardBorder: "#D5E7F5",
};

/** Deep navy palette */
export const darkColors = {
  primary: "#8CCFFF",
  secondary: "#FFFFFF",
  background: "#102334",
  surface: "#18344A",
  raised: "#21435D",
  line: "#456176",
  text: "#F7FAFF",
  muted: "#B2C5D4",
  dim: "#91A8BA",
  accent: "#8CCFFF",
  card: "#18344A",
  cardBorder: "#456176",
};
