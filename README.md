# Ming 明 — Mandarin Coach

An AI-powered Mandarin coach that learns your goal, builds a personalised plan, and teaches you through real conversations. Works in the browser on desktop and phone, and installs like an app on both.

## Features

- **Lesson path** — 18 scenario lessons over three weeks, with a progress strip, streak, and a playable four-tones guide
- **Chat with Ming** — conversation-first teaching, tuned to your goal, deadline, and pace/pinyin preferences
- **Vocabulary + spaced repetition** — new words Ming introduces are saved automatically; review due words with flashcards
- **Pronunciation** — tap any Chinese text to hear it (Google Cloud TTS); speak back with the mic (Whisper)
- **Regional map** — accents, culture, and food for regions of China, Taiwan, and diaspora cities
- **Search** — `Ctrl/⌘ + K` (or the search button) to jump to any lesson, word, or page
- **Phone + desktop** — sidebar layout on computers, bottom tab bar on phones; installable as an app (PWA)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** — copy `.env.example` to `.env.local` and fill in:

   | Variable | Used for |
   | --- | --- |
   | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | Chat (whichever is set; see `src/lib/ai.js`) |
   | `OPENAI_API_KEY` | Voice input (Whisper) |
   | `GOOGLE_TTS_API_KEY` | Pronunciation audio |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth and data (browser) |
   | `SUPABASE_SERVICE_KEY` | API routes (server only — never expose this) |

3. **Database** — in the Supabase SQL editor:
   - New project: run `supabase/schema.sql`
   - Existing project: run the files in `supabase/migrations/` in order

4. **Supabase Auth settings** — set the Site URL to your deployed URL and add it (plus `http://localhost:3000`) to Redirect URLs, so confirmation and password-reset emails link back to the app.

5. **Run locally**
   ```bash
   npm run dev
   # http://localhost:3000
   ```

## Installing on a phone or computer

Ming is a Progressive Web App, so there's nothing to download from an app store:

- **iPhone / iPad (Safari):** Share → Add to Home Screen
- **Android (Chrome):** menu → Install app (or the install banner)
- **Desktop (Chrome / Edge):** the install icon in the address bar, or Settings → App → Install inside Ming

Installation needs HTTPS, so it works on the deployed site (and on `localhost` for testing).

## Cost and abuse controls

- Every API route (`/api/chat`, `/api/tts`, `/api/transcribe`) requires a signed-in user's token.
- Chat is capped at 30 messages per user per day (`DAILY_MESSAGE_LIMIT` in `src/app/api/chat/route.js`), enforced server-side. Users can read but not modify their usage row.
- Only the last 20 messages are sent to the model, and replies are capped at 600 tokens, so cost per message stays flat.
- Cheap model tiers by default (`claude-haiku-4-5` / `gpt-4o-mini`) — change in `src/lib/ai.js`.

## Project layout

```
src/app/page.js            data loading, chat, reviews (top-level state)
src/components/AppShell.js phone/desktop layout, tabs, search, review modal
src/app/api/*              chat, tts, transcribe (all require auth)
src/lib/ai.js              system prompt + AI provider
src/lib/review.js          spaced-repetition scheduling
src/lib/settings.js        user preferences (saved in the browser)
supabase/                  schema and migrations
public/sw.js, manifest     app install + offline page
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add every variable from the table above in the Vercel project settings.
