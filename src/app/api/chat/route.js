import { getAIResponse } from "@/lib/ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const { messages, userId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Fetch due words for this user and inject into context
    let dueWordsContext = "";
    if (userId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      const { data: dueWords } = await supabase
        .from("words")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review", new Date().toISOString())
        .limit(5);

      if (dueWords && dueWords.length > 0) {
        dueWordsContext = `\n\nWORDS DUE FOR REVIEW: ${dueWords
          .map((w) => `${w.chinese} (${w.pinyin}) — ${w.meaning}`)
          .join(", ")}. Naturally weave these into the conversation opening before introducing anything new.`;
      }
    }

    const reply = await getAIResponse(messages, dueWordsContext);

    // Parse any new words Ming flagged
    let cleanReply = reply;
    let newWords = [];

    const wordMatch = reply.match(/\[WORDS:(.*?)\]/s);
    if (wordMatch) {
      try {
        newWords = JSON.parse(wordMatch[1]);
        cleanReply = reply.replace(/\[WORDS:.*?\]/s, "").trim();
      } catch {
        // If parsing fails just use the full reply
      }
    }

    // Save new words to Supabase
    if (userId && newWords.length > 0) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      for (const word of newWords) {
        await supabase.from("words").upsert({
          user_id: userId,
          chinese: word.chinese,
          pinyin: word.pinyin,
          meaning: word.meaning,
          last_seen: new Date().toISOString(),
          next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "user_id,chinese" });
      }
    }

    return Response.json({ reply: cleanReply });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}