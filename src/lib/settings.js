import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { themes } from "@/lib/theme";

// Runs before paint in the browser; plain effect on the server (where it's a no-op anyway).
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const KEY = "ming-settings";

export const DEFAULT_SETTINGS = {
  theme: "light",
  autoplay: true,
  pinyin: "always",
  pace: "adaptive",
};

const VALID = {
  theme: ["light", "dark"],
  pinyin: ["always", "new", "never"],
  pace: ["slow", "adaptive", "fast"],
};

function readSettings() {
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const base = { ...DEFAULT_SETTINGS, theme: systemDark ? "dark" : "light" };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved.pinyin === "hover") saved.pinyin = "new";
    for (const [k, options] of Object.entries(VALID)) {
      if (options.includes(saved[k])) base[k] = saved[k];
    }
    if (typeof saved.autoplay === "boolean") base.autoplay = saved.autoplay;
  } catch {}
  return base;
}

// Settings live in localStorage and save as soon as they change. The boot script
// in layout.js applies the saved theme before first paint. Saved settings are read
// after hydration (not during) so the first client render matches the server HTML.
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useIsomorphicLayoutEffect(() => {
    setSettings(readSettings());
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", themes[settings.theme].bg));
  }, [settings.theme]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return [settings, update];
}
