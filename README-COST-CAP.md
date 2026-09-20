# Cost control changes

Two files replaced, one SQL script to run, both changes together bound your
worst-case AI spend to something tiny.

## 1. Run SETUP.sql in your Supabase SQL editor first.

Creates `daily_usage`, tracks messages sent per user per day.

## 2. Files to copy into your repo (overwrite existing):

    src/lib/ai.js              -> switched to cheap-tier models
    src/app/api/chat/route.js  -> added the 30-message/day hard cap

Everything else in your repo is untouched.

## What changed and why

- Anthropic now uses `claude-haiku-4-5-20251001` instead of a flagship model.
  OpenAI now uses `gpt-4o-mini`. Both are roughly 10-20x cheaper per token
  than the models Ming used before, with only a small quality trade-off for
  a coaching/conversation use case like this.
- Every response is capped at 600 max_tokens, which also caps cost per call
  and keeps Ming's replies from running long in the chat UI.
- The chat API now checks a `daily_usage` row before calling the AI at all.
  Once a user hits 30 messages in a day, they get a friendly "come back
  tomorrow" message instead of another paid API call. Change
  `DAILY_MESSAGE_LIMIT` in route.js to adjust the number.
- Combined, one very active user costs you well under a dollar a month in
  the worst case, and a quiet user (a friend testing it) costs closer to a
  few cents.

## Optional next step (not built here)

If you want a nicer in-app message when someone hits the cap instead of the
generic error bubble, check for `data.limitReached` in `sendMessage` inside
`page.js` and render a specific message instead of the generic fallback
text. Small change, left out here to keep this patch minimal.
