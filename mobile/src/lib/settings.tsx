import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// Same preferences as the web app's lib/settings.js, saved on the phone instead of
// in the browser. "system" follows the phone's light/dark setting.
export type Settings = {
  theme: "system" | "light" | "dark";
  autoplay: boolean;
  pinyin: "always" | "new" | "never";
  pace: "slow" | "adaptive" | "fast";
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  autoplay: true,
  pinyin: "always",
  pace: "adaptive",
};

const KEY = "ming-settings";
const VALID: { [K in keyof Settings]?: readonly string[] } = {
  theme: ["system", "light", "dark"],
  pinyin: ["always", "new", "never"],
  pace: ["slow", "adaptive", "fast"],
};

function sanitize(raw: unknown): Settings {
  const out = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  const saved = raw as Record<string, unknown>;
  for (const [k, options] of Object.entries(VALID)) {
    const v = saved[k];
    if (typeof v === "string" && options?.includes(v)) (out as Record<string, unknown>)[k] = v;
  }
  if (typeof saved.autoplay === "boolean") out.autoplay = saved.autoplay;
  return out;
}

type SettingsState = { settings: Settings; ready: boolean; update: (patch: Partial<Settings>) => void };
const Ctx = createContext<SettingsState>({ settings: DEFAULT_SETTINGS, ready: false, update: () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => s && setSettings(sanitize(JSON.parse(s))))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ settings, ready, update }}>{children}</Ctx.Provider>;
}
