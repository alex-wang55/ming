import { transcribeAudio } from "@/lib/ai";
import { consumeQuota, getUser, jsonError, refundQuota, SIGN_IN_AGAIN } from "@/lib/server";

// Vercel rejects request bodies over ~4.5 MB; a minute of speech is well under this.
const MAX_BYTES = 4 * 1024 * 1024;
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

    const quota = await consumeQuota(user.id, "transcribe");
    if (!quota.allowed) {
      return jsonError("You've used today's voice messages. Type in pinyin instead — tone numbers are fine.", 429, { limitReached: true });
    }

    let text;
    try {
      text = await transcribeAudio(file);
    } catch (err) {
      await refundQuota(user.id, "transcribe");
      throw err;
    }
    return Response.json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    return jsonError("Couldn't understand that recording. Try again.", 500);
  }
}
