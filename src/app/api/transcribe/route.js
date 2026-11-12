import { transcribeAudio } from "@/lib/ai";
import { getUser, jsonError, refundUsage, SIGN_IN_AGAIN, takeUsage } from "@/lib/server";
// Hard daily cap per user, so worst-case Whisper spend is bounded.
import { DAILY_TRANSCRIBE_LIMIT } from "@/lib/limits";

// Both apps stop recording at a minute, which is about 1 MB at the iPhone's 128 kbps.
// Whisper bills by the minute, so a tight size cap also limits how long a clip can be.
const MAX_BYTES = 2 * 1024 * 1024;
const AUDIO_EXT = /\.(flac|mp3|mp4|mpeg|mpga|m4a|ogg|opus|wav|webm)$/i;

// Transcribes user voice recordings with Whisper (Groq or OpenAI, see lib/ai.js).
export async function POST(request) {
  const user = await getUser(request);
  if (!user) return jsonError(SIGN_IN_AGAIN, 401);

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || typeof audio === "string") return jsonError("No audio provided", 400);
    if (audio.size > MAX_BYTES) return jsonError("That recording is too long. Keep it under a minute.", 413);

    // Whisper works out the format from the file extension, so make sure there is one.
    // (The web sends recording.webm/.mp4; the iPhone app sends recording-xxxx.m4a.)
    const file = AUDIO_EXT.test(audio.name || "") ? audio : new File([audio], "recording.m4a", { type: audio.type || "audio/mp4" });

    let used;
    try {
      used = await takeUsage(user.id, "transcribe", DAILY_TRANSCRIBE_LIMIT);
    } catch (err) {
      console.error("Usage check failed:", err);
      return jsonError("Voice input isn't available right now. Type your message instead.", 503);
    }
    if (used === null) {
      return jsonError("You've reached today's voice limit. Type your message instead; it resets tomorrow.", 429, { limitReached: true });
    }

    let text;
    try {
      text = await transcribeAudio(file);
    } catch (err) {
      await refundUsage(user.id, "transcribe");
      throw err;
    }
    return Response.json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    return jsonError("Couldn't understand that recording. Try again.", 500);
  }
}
