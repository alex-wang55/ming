import { AudioModule, RecordingPresets, createAudioPlayer, setAudioModeAsync, useAudioRecorder, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { useCallback, useState } from "react";
import { apiFetch, postJSON } from "./api";

const MAX_RECORDING_SECONDS = 60;

/* ---------- Speaking to Ming: record, then send to /api/transcribe (Whisper) ---------- */

export function useMingRecorder() {
  // HIGH_QUALITY records AAC in an .m4a, which Whisper accepts as-is.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");

  const start = useCallback(async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) throw new Error("Microphone access is off. Turn it on in Settings > Ming.");
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record({ forDuration: MAX_RECORDING_SECONDS });
    setState("recording");
  }, [recorder]);

  const stopAndTranscribe = useCallback(async (): Promise<string> => {
    await recorder.stop();
    // Leaving recording mode on routes playback to the quiet earpiece on iPhone.
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    const uri = recorder.uri;
    if (!uri) {
      setState("idle");
      return "";
    }
    setState("transcribing");
    try {
      const fd = new FormData();
      // React Native's FormData takes a { uri, name, type } file reference.
      fd.append("audio", { uri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob);
      const res = await apiFetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't understand that recording. Try again.");
      return (data.text ?? "").trim();
    } finally {
      setState("idle");
    }
  }, [recorder]);

  return { state, start, stopAndTranscribe };
}

/* ---------- Ming speaking: /api/tts returns base64 MP3, cached on disk ---------- */

const memo = new Map<string, string>(); // text -> local file uri
let current: { player: AudioPlayer; done: () => void } | null = null;

function fileNameFor(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `tts-${(h >>> 0).toString(36)}.mp3`;
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

  await new Promise<void>((resolve) => {
    const player = createAudioPlayer({ uri });
    const done = () => {
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
