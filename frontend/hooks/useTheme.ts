/**
 * useTheme Hook
 *
 * Provides theme state management with localStorage persistence
 * and system preference detection.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ThemeMode } from "@/lib/constants/theme";

const THEME_STORAGE_KEY = "theme";

interface UseThemeReturn {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return null;
}

function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-color-scheme", theme);
}

export function useTheme(): UseThemeReturn {
  const [mounted, setMounted] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Initialize theme on mount – sync with inline script and apply if needed
  useEffect(() => {
    setMounted(true);
    const stored = getStoredTheme();
    const mode = stored ?? "system";
    setThemeModeState(mode);

    const resolved: "light" | "dark" =
      mode === "system" ? getSystemTheme() : mode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === "system") {
        const newTheme = e.matches ? "dark" : "light";
        setResolvedTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);

    const resolved = mode === "system" ? getSystemTheme() : mode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = resolvedTheme === "light" ? "dark" : "light";
    setThemeMode(newMode);
  }, [resolvedTheme, setThemeMode]);

  return {
    theme: resolvedTheme,
    themeMode,
    setThemeMode,
    toggleTheme,
    mounted,
  };
}
