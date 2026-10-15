# Ming for iOS

The native app for Ming, built with Expo (SDK 57) and Expo Router. It's a new frontend only: it uses the same Supabase project as the web app and calls the same `/api/chat`, `/api/transcribe` and `/api/tts` routes on Vercel, sending the Supabase token as a Bearer header.

## Setup

```bash
cd mobile
npm install
npx expo install --fix   # lines package versions up with SDK 57
cp .env.example .env.local   # fill in the Supabase URL and anon key
npx expo start
```

Before the first build, run `supabase/migrations/20261015_ai_consent.sql` from the repo root on the Supabase project. The app reads `profiles.ai_consent_at`.

## What's where

- `src/app/_layout.tsx`: auth gate. Signed out goes to `sign-in`, signed in goes to the tabs.
- `src/app/consent.tsx`: the App Review 5.1.2(i) screen. Chat and the mic send people here until they agree. Set `CHAT_PROVIDER` to whichever key is set on Vercel.
- `src/app/(tabs)/`: native iOS tab bar with Learn, Chat, Words, Map, Settings.
- `src/lib/api.ts`: `apiFetch` / `postJSON`, same as the web app plus a base URL.
- `src/lib/voice.ts`: recording with expo-audio and uploading to Whisper, plus TTS playback cached on disk.
- `src/shared/`: copied unchanged from the web app's `src/lib` (tags, review, lessons, regions, dates, theme). Keep them in sync until they move to a shared package.

## Still to do

- Port the rest of `sendMessage` into `chat.tsx`: `saveConversation()` and `recordActivity()` work unchanged.
- Build out Learn, Words and Map (placeholders now). Map and ToneContour need `react-native-svg`. Gate tap-to-hear in Words behind consent like chat is.
- Settings: theme, autoplay, pinyin and pace in AsyncStorage, then pass pinyin and pace to `/api/chat`.
- Move the streak calculation out of the web app's `page.js` into `src/shared/` so both apps use it.
- Replace `assets/images/icon.png` with a crisp 1024x1024 export. It's currently the 512px web icon upscaled.
- Review reminders with `expo-notifications` plus a Vercel cron.

## Shipping

No Mac needed. EAS builds in the cloud on the current Xcode.

```bash
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios
```

That lands in TestFlight. Check `ios.bundleIdentifier` in `app.json` before the first build, since it can't change once the app is on the App Store.
