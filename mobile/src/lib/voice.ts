import { AudioModule, RecordingPresets, createAudioPlayer, setAudioModeAsync, useAudioRecorder, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, postJSON } from "./api";

// Same limits as the web ChatInput: a minute max, and anything under ~0.7s is a mis-tap.
const MAX_RECORDING_MS = 60 * 1000;
const MIN_RECORDING_MS = 700;

export type MicState = "idle" | "starting" | "recording" | "transcribing";

/* ---------- Speaking to Ming: record, then send to /api/transcribe (Whisper) ---------- */

export function useMingRecorder(onText: (text: string) => void, onError: (message: string) => void) {
  // HIGH_QUALITY records AAC in an .m4a, which Whisper accepts as-is.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<MicState>("idle");
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<MicState>("idle");
  const set = (s: MicState) => {
    stateRef.current = s;
    setState(s);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const stop = useCallback(async () => {
    if (stateRef.current !== "recording") return;
    if (timer.current) clearTimeout(timer.current);
    set("transcribing");
    try {
      await recorder.stop();
      // Leaving recording mode on routes playback to the quiet earpiece on iPhone.
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      const uri = recorder.uri;
      if (!uri || Date.now() - startedAt.current < MIN_RECORDING_MS) {
        onError("That was too short. Tap the mic, speak, then tap again to send.");
        return;
      }
      const fd = new FormData();
      // Expo's fetch (the default since SDK 52) can't upload the old React Native
      // { uri, name, type } objects; it throws before sending anything. It does take an
      // expo-file-system File, which it reads and sends as recording-xxxx.m4a.
      fd.append("audio", new File(uri) as unknown as Blob);
      const res = await apiFetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      const text = typeof data.text === "string" ? data.text.trim() : "";
      if (res.ok && text) onText(text);
      else onError(data.error ?? "Couldn't hear anything. Try again a little closer to the mic.");
    } catch (e) {
      console.warn("Voice message failed:", e); // shows in the npx expo start terminal
      onError("Transcription failed. Check your connection and try again.");
    } finally {
      set("idle");
    }
  }, [recorder, onText, onError]);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") return;
    set("starting");
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        set("idle");
        onError("Microphone access is off. Turn it on in Settings > Ming to speak to Ming.");
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      set("recording");
      timer.current = setTimeout(() => stop(), MAX_RECORDING_MS);
    } catch {
      set("idle");
      onError("Couldn't start the microphone. Try again.");
    }
  }, [recorder, onError, stop]);

  return { state, start, stop };
}

/* ---------- Ming speaking: /api/tts returns base64 MP3, cached on disk ---------- */

const memo = new Map<string, string>(); // text -> local file uri
let current: { player: AudioPlayer; done: () => void } | null = null;

function fileNameFor(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `tts-${(h >>> 0).toString(36)}-${text.length}.mp3`;
}

// Plays Mandarin audio for `text`. Resolves when playback ends or another clip interrupts it.
// Clips are saved to the cache folder, so replaying a word never costs another TTS call.
export async function speak(text: string) {
  const key = text.trim();
  if (!key) return;

  let uri = memo.get(key);
  if (!uri) {
    const file = new File(Paths.cache, fileNameFor(key));
    if (!file.exists) {
      const res = await postJSON("/api/tts", { text: key });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.audio) throw new Error(data.error ?? "Audio unavailable");
      file.create({ overwrite: true });
      file.write(data.audio, { encoding: "base64" });
    }
    uri = file.uri;
    memo.set(key, uri);
  }

  if (current) {
    current.player.remove();
    current.done();
  }

  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  await new Promise<void>((resolve) => {
    const player = createAudioPlayer({ uri });
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      sub.remove();
      if (current?.player === player) current = null;
      resolve();
    };
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        player.remove();
        done();
      }
    });
    current = { player, done };
    player.play();
  });
}

// [playingText, play] for UI state, same shape as the web app's useSpeaker.
// Use useSpeak() from the store in screens: it asks for AI consent first.
export function useSpeaker() {
  const [playing, setPlaying] = useState<string | null>(null);
  const play = useCallback(async (text: string) => {
    setPlaying(text);
    try {
      await speak(text);
    } catch (err) {
      console.warn(err);
    } finally {
      setPlaying((p) => (p === text ? null : p));
    }
  }, []);
  return [playing, play] as const;
}
