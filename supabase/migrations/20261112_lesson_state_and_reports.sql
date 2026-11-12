-- Safe to run more than once. Run BEFORE deploying the matching web and mobile code:
-- both now read and write conversations.lesson_id.

-- 1. Which lesson a conversation belongs to, so a lesson in progress survives a reload
--    or the phone closing the app. Null for free chat and once the lesson is marked complete.
alter table public.conversations add column if not exists lesson_id text;

-- 2. "Report this reply" on AI messages (App Review asks AI chat apps for a way to flag
--    replies). Users can file a report but never read reports back, not even their own.
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists message_reports_created_idx on public.message_reports (created_at desc);

alter table public.message_reports enable row level security;

drop policy if exists "Users can file reports" on public.message_reports;
create policy "Users can file reports" on public.message_reports
  for insert to authenticated with check (auth.uid() = user_id);
