// Converts Chinese text to speech using Google Cloud TTS
export async function POST(request) {
  try {
    const { text } = await request.json();
    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "cmn-CN",
            name: "cmn-CN-Wavenet-C", // best Mandarin voice
          },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error("No audio returned");
    }

    // Return base64 audio — frontend converts to playable audio
    return Response.json({ audio: data.audioContent });
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}