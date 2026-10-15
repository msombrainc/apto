export type Theme = "light" | "dark";

export const STORAGE_KEY = "apto-aims-theme";

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
