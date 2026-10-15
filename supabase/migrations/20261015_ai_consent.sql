-- When the learner agreed to their messages, voice and goal being sent to the
-- AI providers (Anthropic or OpenAI for chat, OpenAI Whisper for voice, Google for audio).
-- Apple's guideline 5.1.2(i) needs explicit consent before the first request.
-- Null means they haven't agreed yet. Users can set it through the existing
-- "update own profile" policy.
alter table public.profiles add column if not exists ai_consent_at timestamptz;
