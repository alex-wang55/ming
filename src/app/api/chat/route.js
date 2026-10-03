import { getAIResponse } from "@/lib/ai";
import { getAdmin, getUser, jsonError, SIGN_IN_AGAIN } from "@/lib/server";
import { parseToneTags } from "@/lib/tags";

// Hard daily cap per user, so worst-case AI spend is bounded.
const DAILY_MESSAGE_LIMIT = 30;
// Only the recent conversation is sent to the model, so cost per message stays flat
// instead of growing with the length of the chat.
const HISTORY_LIMIT = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_NEW_WORDS = 8;

const PINYIN_PREFS = {
  new: "Show pinyin only for words introduced in this conversation. For words the learner already knows, write characters only.",
  never: "Do not write pinyin in your text. The learner wants to read characters. (Vocabulary tags still need pinyin.)",
};
const PACE_PREFS = {
  slow: "The learner prefers a slow pace: at most 2 new words per message, with plenty of repetition.",
  fast: "The learner wants to move fast: up to 5 new words per message and less repetition.",
};

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return jsonError(SIGN_IN_AGAIN, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request", 400);
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  // Anthropic requires the conversation to start with a user turn.
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") {
    return jsonError("Invalid messages", 400);
  }

  const db = getAdmin();
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data: usage } = await db
      .from("daily_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();
    const used = usage?.message_count || 0;

    if (used >= DAILY_MESSAGE_LIMIT) {
      return jsonError(
        "You've reached today's message limit. Come back tomorrow — or this is a good moment to review your words.",
        429,
        { limitReached: true, remaining: 0 }
      );
    }

    const context = await buildContext(db, user.id, body.preferences);

    let reply;
    try {
      reply = await getAIResponse(history, context);
    } catch (err) {
      console.error("AI provider error:", err);
      return jsonError("Ming couldn't answer just now. Try again in a moment.", 502);
    }

    await db
      .from("daily_usage")
      .upsert(
        { user_id: user.id, usage_date: today, message_count: used + 1 },
        { onConflict: "user_id,usage_date" }
      );

    const newWords = await saveNewWords(db, user.id, reply);

    return Response.json({
      reply,
      newWords,
      remaining: DAILY_MESSAGE_LIMIT - used - 1,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return jsonError("Something went wrong — try again in a moment.", 500);
  }
}

async function buildContext(db, userId, preferences = {}) {
  const [{ data: profile }, { data: dueWords }] = await Promise.all([
    db.from("profiles").select("goal_text, deadline_date").eq("id", userId).maybeSingle(),
    db
      .from("words")
      .select("chinese, pinyin, meaning")
      .eq("user_id", userId)
      .lte("next_review", new Date().toISOString())
      .order("next_review", { ascending: true })
      .limit(5),
  ]);

  const lines = [];
  if (profile?.goal_text) lines.push(`Goal: ${profile.goal_text.slice(0, 300)}`);
  if (profile?.deadline_date) {
    const days = Math.ceil((new Date(profile.deadline_date) - new Date()) / 86400000);
    lines.push(
      days >= 0
        ? `Deadline: ${profile.deadline_date} (${days} days away). Prioritise what they need by then.`
        : `Their deadline (${profile.deadline_date}) has passed. Keep building on what they learned.`
    );
  }
  if (PINYIN_PREFS[preferences.pinyin]) lines.push(PINYIN_PREFS[preferences.pinyin]);
  if (PACE_PREFS[preferences.pace]) lines.push(PACE_PREFS[preferences.pace]);
  if (dueWords?.length) {
    lines.push(
      `Words due for review: ${dueWords
        .map((w) => `${w.chinese} (${w.pinyin}) — ${w.meaning}`)
        .join(", ")}. Weave these in naturally before introducing anything new.`
    );
  }

  return lines.length ? `\n\n# LEARNER CONTEXT\n${lines.join("\n")}` : "";
}

// Saves words Ming tagged as new. Existing words are left alone so a re-mention
// doesn't reset their review schedule.
async function saveNewWords(db, userId, reply) {
  const seen = new Set();
  const tagged = parseToneTags(reply).filter((w) => {
    if (!w.hanzi || seen.has(w.hanzi)) return false;
    seen.add(w.hanzi);
    return true;
  });
  if (!tagged.length) return 0;

  try {
    const { data: existing } = await db
      .from("words")
      .select("chinese")
      .eq("user_id", userId)
      .in(
        "chinese",
        tagged.map((w) => w.hanzi)
      );
    const have = new Set((existing || []).map((w) => w.chinese));
    const fresh = tagged
      .filter((w) => !have.has(w.hanzi))
      .slice(0, MAX_NEW_WORDS)
      .map((w) => ({
        user_id: userId,
        chinese: w.hanzi.slice(0, 20),
        pinyin: w.pinyin.slice(0, 60),
        meaning: w.meaning.slice(0, 80),
      }));
    if (!fresh.length) return 0;

    const { error } = await db.from("words").insert(fresh);
    if (error) throw error;
    return fresh.length;
  } catch (err) {
    console.error("Saving words failed:", err);
    return 0;
  }
}
