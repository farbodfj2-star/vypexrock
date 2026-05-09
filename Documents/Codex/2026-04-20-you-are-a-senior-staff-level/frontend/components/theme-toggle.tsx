"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

type SiteTheme = "dark" | "light";

const STORAGE_KEY = "vypexrock-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = readTheme();
    applyTheme(saved);
    setTheme(saved);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: SiteTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:border-amber-300/20 hover:bg-amber-300/10 hover:text-white sm:px-4"
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Switch theme"}
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span className="hidden sm:inline">{mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Theme"}</span>
    </button>
  );
}

function readTheme(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function applyTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  document.body.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}
