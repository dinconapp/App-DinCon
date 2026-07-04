"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "dincon.theme";
const THEME_EVENT = "dincon-theme-change";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function getInitialTheme(): ThemeMode {
  return readStoredTheme() ?? getSystemTheme();
}

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyTheme(initial);

    const handleThemeChange = (event: Event) => {
      const next = (event as CustomEvent<ThemeMode>).detail;
      if (next === "light" || next === "dark") {
        setThemeState(next);
        applyTheme(next);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue !== "light" && event.newValue !== "dark") return;
      setThemeState(event.newValue);
      applyTheme(event.newValue);
    };

    window.addEventListener(THEME_EVENT, handleThemeChange as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function setTheme(next: ThemeMode) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: next }));
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
