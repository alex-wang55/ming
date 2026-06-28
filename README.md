# Ming 明 — Mandarin Coach

An AI-powered Mandarin coach that learns your goal, builds a personalised plan, and teaches you through real conversations.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API key**
   ```bash
   cp .env.example .env.local
   # Open .env.local and add your Anthropic API key
   ```

3. **Run locally**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## Switching AI providers

All AI logic lives in `src/lib/ai.js`. To switch to OpenAI or Gemini, only edit that file — nothing else in the app changes. Instructions are in the comments at the bottom of that file.

## Deploy to Vercel

```bash
npm install -g vercel
vercel
# Follow the prompts — add ANTHROPIC_API_KEY as an environment variable
```

## What's next

- [ ] Google Cloud TTS for pronunciation audio
- [ ] Whisper voice input
- [ ] Supabase auth + conversation history
- [ ] Spaced repetition word tracking
