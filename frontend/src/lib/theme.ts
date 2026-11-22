export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "emerald" | "ocean" | "sunset";

const MODE_KEY = "opendesk_theme_mode";
const ACCENT_KEY = "opendesk_theme_accent";

export function getSavedThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(MODE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function getSavedThemeAccent(): ThemeAccent {
  if (typeof window === "undefined") return "emerald";
  const value = window.localStorage.getItem(ACCENT_KEY);
  if (value === "emerald" || value === "ocean" || value === "sunset") return value;
  return "emerald";
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_KEY, mode);
  applyTheme(mode, getSavedThemeAccent());
}

export function setThemeAccent(accent: ThemeAccent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCENT_KEY, accent);
  applyTheme(getSavedThemeMode(), accent);
}

export function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode, accent: ThemeAccent) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-mode", resolveMode(mode));
  html.setAttribute("data-theme", accent);
}

