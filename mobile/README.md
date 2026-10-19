# Ming for iOS

The native app for Ming, built with Expo (SDK 57) and Expo Router. It's a new frontend only: it uses the same Supabase project as the web app and calls the same `/api/chat`, `/api/transcribe`, `/api/tts` and `/api/account` routes on Vercel, sending the Supabase token as a Bearer header. Progress, words and chats stay in sync with the website.

## Setup

```bash
cd mobile
npm install
cp .env.example .env.local   # fill in the Supabase URL and anon key
npx expo start               # scan the QR code with Expo Go
```

Expo Go on iPhone needs you signed in to the same Expo account in the app and in the terminal (`npx expo login`).

## What's in the app

Every tab from the web app's phone layout, ported screen by screen:

- **Learn** (`src/app/(tabs)/index.tsx`): progress strip, the 18-lesson path with done/next/locked states, the four tones guide, word of the day, days to your deadline, the 5-week streak calendar and course progress. Tap a lesson to start it in Chat. Pull to refresh.
- **Chat** (`chat.tsx`): picks up your latest conversation, the welcome message, tappable Chinese, new-word cards with tone contours, voice input, autoplay, the daily message counter, and the lesson banner with "Mark complete" (every third lesson opens a quick check).
- **Words** (`words.tsx`): all words or just the due ones, search by characters, pinyin or meaning, tap to hear, and "Review" opens flashcards (`src/app/review.tsx`) using the same spaced repetition as the web.
- **Map** (`map.tsx`): the parchment map with the same regions, plus a row of region chips since Beijing and Shanghai are tiny on a phone. Province shapes are bundled in `src/data/china-map.ts`, so the map works offline.
- **Settings** (`settings.tsx`): theme (system/light/dark), goal and deadline, autoplay, pinyin, pace, AI sharing, change password, sign out, delete account.
- **Sign in** and **goal setup** match the web flows. Confirmation and password reset emails open the website.

### App Store pieces

- `src/app/consent.tsx` is the App Review 5.1.2(i) screen. Anything that sends data to an AI provider (chat, lessons, the mic, tap-to-hear) goes through `withConsent()` in `src/lib/store.tsx`: without consent the action waits, this screen opens, and it runs right after you agree. `CHAT_PROVIDER` should match the key set on Vercel (Anthropic).
- Account deletion calls `/api/account` (5.1.1(v)).
- The mic permission string is in `app.json`, and `usesNonExemptEncryption: false` skips the export compliance question.

## Code layout

- `src/lib/store.tsx`: the app's data and actions, a port of the web `page.js` (same tables, queries and rules).
- `src/lib/session.tsx`, `settings.tsx`, `theme.ts`: auth + profile, saved preferences, the web palette.
- `src/lib/voice.ts`: recording with expo-audio and uploading to Whisper, and TTS playback cached on disk.
- `src/components/`: shared UI (message bubbles, tone graphs, lesson rows, the map, icons).
- `src/shared/`: copied unchanged from the web app's `src/lib` (tags, review, lessons, regions, dates, theme), plus `streak.js` (the streak rule from `page.js`). Keep them in sync until they move to a shared package.

## Still to do

- A privacy policy page (Apple requires the link). It can live on the web app at `/privacy`.
- Replace `assets/images/icon.png` with a crisp 1024x1024 export. It's currently the 512px web icon upscaled.
- Review reminders with `expo-notifications` plus a Vercel cron, like Pinky's.
- Android tab icons (the tab bar uses SF Symbols, which are iOS-only).

## Shipping

No Mac needed. EAS builds in the cloud on the current Xcode.

```bash
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios
```

That lands in TestFlight. Check `ios.bundleIdentifier` in `app.json` before the first build, since it can't change once the app is on the App Store.
