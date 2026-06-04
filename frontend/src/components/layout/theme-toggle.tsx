"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "stockflow_theme";

type ThemeToggleProps = {
  variant?: "default" | "sidebar";
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(() => initialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    storeTheme(nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  const dark = theme === "dark";

  const className =
    variant === "sidebar"
      ? "inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
      : "inline-flex h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <button
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={dark}
      className={className}
      onClick={toggleTheme}
      type="button"
    >
      {dark ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
      {dark ? "Claro" : "Escuro"}
    </button>
  );
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function initialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }
  return getStoredTheme() ?? preferredColorScheme();
}

function getStoredTheme(): Theme | null {
  try {
    const value = window.localStorage?.getItem?.(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme) {
  try {
    window.localStorage?.setItem?.(STORAGE_KEY, theme);
  } catch {
    // Theme still works for the current page when storage is unavailable.
  }
}

function preferredColorScheme(): Theme {
  if (typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
