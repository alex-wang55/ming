import { useState, useCallback } from "react";
import { postJSON } from "@/lib/api";

const cache = new Map();
const MAX_CACHED = 100;
let current = null;

// Plays Mandarin TTS for `text`. Resolves when playback ends or is interrupted.
export async function speak(text) {
  const key = text.trim();
  if (!key) return;

  let src = cache.get(key);
  if (!src) {
    const res = await postJSON("/api/tts", { text: key });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.audio) throw new Error(data.error || "Audio unavailable");
    src = `data:audio/mp3;base64,${data.audio}`;
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value);
    cache.set(key, src);
  }

  if (current) current.pause();
  const audio = new Audio(src);
  current = audio;
  await new Promise((resolve, reject) => {
    audio.onended = resolve;
    audio.onpause = resolve;
    audio.onerror = () => reject(new Error("Playback failed"));
    audio.play().catch(reject);
  });
}

// [playingText, play] — tracks which text is currently playing for UI state.
export function useSpeaker() {
  const [playing, setPlaying] = useState(null);
  const play = useCallback(async (text) => {
    setPlaying(text);
    try {
      await speak(text);
    } catch (err) {
      console.warn(err);
    } finally {
      setPlaying((p) => (p === text ? null : p));
    }
  }, []);
  return [playing, play];
}
