"use client";

import { Moon, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useThemeMode } from "@/hooks/useThemeMode";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      square
      className="cf-theme-toggle"
      icon={isDark ? <SunMedium size={16} /> : <Moon size={16} />}
      onClick={toggleTheme}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    />
  );
}
