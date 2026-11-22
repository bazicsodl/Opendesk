"use client";

import { useEffect } from "react";
import { applyTheme, getSavedThemeAccent, getSavedThemeMode } from "@/lib/theme";

export default function ThemeBoot() {
  useEffect(() => {
    const mode = getSavedThemeMode();
    const accent = getSavedThemeAccent();
    applyTheme(mode, accent);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(getSavedThemeMode(), getSavedThemeAccent());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}

