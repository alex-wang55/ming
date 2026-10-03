-- Production fixes for the existing Ming database.
-- Safe to run more than once.

-- 1. Users could read their profile but not update it, so saving a goal or
--    skipping onboarding silently did nothing and the goal screen kept coming back.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 2. One row per word per user, plus an index for "what's due" lookups.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'words_user_id_chinese_key') then
    alter table public.words add constraint words_user_id_chinese_key unique (user_id, chinese);
  end if;
end $$;
create index if not exists words_user_next_review_idx on public.words (user_id, next_review);

-- 3. The daily message cap is written by the server only. Users could previously
--    delete or reset their own usage row from the browser and bypass the cap.
drop policy if exists "Users manage own usage" on public.daily_usage;
drop policy if exists "Users can read own usage" on public.daily_usage;
create policy "Users can read own usage" on public.daily_usage
  for select using (auth.uid() = user_id);

-- 4. Harden the signup trigger (Supabase security advisor warnings).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
