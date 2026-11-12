import { getUser, jsonError, refundUsage, SIGN_IN_AGAIN, takeUsage } from "@/lib/server";
// Hard daily cap per user, so worst-case TTS spend is bounded.
import { DAILY_TTS_LIMIT } from "@/lib/limits";

const MAX_CHARS = 120;

// Converts Chinese text to speech using Google Cloud TTS.
export async function POST(request) {
  const user = await getUser(request);
  if (!user) return jsonError(SIGN_IN_AGAIN, 401);

  try {
    const { text } = await request.json();
    const input = typeof text === "string" ? text.trim().slice(0, MAX_CHARS) : "";
    if (!input) return jsonError("No text provided", 400);

    // Both apps cache clips, so a learner only pays for each word once. This stops loops.
    let used;
    try {
      used = await takeUsage(user.id, "tts", DAILY_TTS_LIMIT);
    } catch (err) {
      console.error("Usage check failed:", err);
      return jsonError("Audio isn't available right now.", 503);
    }
    if (used === null) return jsonError("You've reached today's audio limit. It resets tomorrow.", 429, { limitReached: true });

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: input },
          voice: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-C" },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok || !data.audioContent) {
      console.error("TTS provider error:", data.error || response.status);
      await refundUsage(user.id, "tts");
      return jsonError("Audio isn't available right now.", 502);
    }

    return Response.json({ audio: data.audioContent });
  } catch (error) {
    console.error("TTS error:", error);
    return jsonError("Audio isn't available right now.", 500);
  }
}
