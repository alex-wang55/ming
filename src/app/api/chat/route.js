// app/api/chat/route.js
import { getAIResponse } from "@/lib/ai";

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }

    const reply = await getAIResponse(messages);

    return Response.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
