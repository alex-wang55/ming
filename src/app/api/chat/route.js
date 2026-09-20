import { getAIResponse } from "@/lib/ai";
import { createClient } from "@supabase/supabase-js";

// Hard daily cap per user. Worst case cost is now bounded no matter what.
const DAILY_MESSAGE_LIMIT = 30;

export async function POST(request) {
  try {
    const { messages, userId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }

    const supabase = userId
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
      : null;

    const today = new Date().toISOString().slice(0, 10);

    // --- Usage cap check ---
    if (supabase) {
      const { data: usageRow } = await supabase
        .from("daily_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .single();

      const used = usageRow?.message_count || 0;

      if (used >= DAILY_MESSAGE_LIMIT) {
        return Response.json(
          {
            error:
              "You've reached today's message limit. Come back tomorrow, or this is a good spot to review your words instead.",
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // --- Fetch due words for spaced repetition context ---
    let dueWordsContext = "";
    if (supabase) {
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

    // --- Parse any new words Ming flagged ---
    let cleanReply = reply;
    let newWords = [];

    const wordMatch = reply.match(/\[WORDS:(.*?)\]/s);
    if (wordMatch) {
      try {
        newWords = JSON.parse(wordMatch[1]);
        cleanReply = reply.replace(/\[WORDS:.*?\]/s, "").trim();
      } catch {
        // fall through, keep full reply
      }
    }

    if (supabase && newWords.length > 0) {
      for (const word of newWords) {
        await supabase.from("words").upsert(
          {
            user_id: userId,
            chinese: word.chinese,
            pinyin: word.pinyin,
            meaning: word.meaning,
            last_seen: new Date().toISOString(),
            next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: "user_id,chinese" }
        );
      }
    }

    // --- Record usage, bumping the counter ---
    if (supabase) {
      const { data: usageRow } = await supabase
        .from("daily_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .single();

      await supabase.from("daily_usage").upsert(
        {
          user_id: userId,
          usage_date: today,
          message_count: (usageRow?.message_count || 0) + 1,
        },
        { onConflict: "user_id,usage_date" }
      );
    }

    return Response.json({ reply: cleanReply });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
