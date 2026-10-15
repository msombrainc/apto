import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export const STORAGE_KEY = "apto-aims-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Pure: map persisted value to theme (invalid / missing → dark). */
export function resolveThemeFromStorageValue(stored: string | null): Theme {
  return stored === "light" ? "light" : "dark";
}

export function readStoredTheme(
  getItem: () => string | null = () => localStorage.getItem(STORAGE_KEY),
): Theme {
  try {
    return resolveThemeFromStorageValue(getItem());
  } catch {
    return "dark";
  }
}

/** Set `data-theme` on `<html>` before React paint (matches ThemeProvider default). */
export function bootstrapDocumentTheme(doc: Document = document): void {
  doc.documentElement.dataset.theme = readStoredTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
