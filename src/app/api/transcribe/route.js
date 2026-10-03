import OpenAI from "openai";
import { getUser, jsonError, SIGN_IN_AGAIN } from "@/lib/server";

// Vercel rejects request bodies over ~4.5 MB; a minute of speech is well under this.
const MAX_BYTES = 4 * 1024 * 1024;

// Transcribes user voice recordings using OpenAI Whisper.
export async function POST(request) {
  const user = await getUser(request);
  if (!user) return jsonError(SIGN_IN_AGAIN, 401);

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || typeof audio === "string") return jsonError("No audio provided", 400);
    if (audio.size > MAX_BYTES) return jsonError("That recording is too long. Keep it under a minute.", 413);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "zh", // hint that it's likely Chinese — improves accuracy
    });

    return Response.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return jsonError("Couldn't understand that recording. Try again.", 500);
  }
}
