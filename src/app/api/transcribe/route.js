// Transcribes user voice recordings using OpenAI Whisper
import OpenAI from "openai";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio) {
      return Response.json({ error: "No audio provided" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "zh", // hint that it's likely Chinese — improves accuracy
    });

    return Response.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}