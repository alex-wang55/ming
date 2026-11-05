-- Full Ming schema for a fresh Supabase project. Run once in the SQL editor.
-- For an existing project, run the files in supabase/migrations instead.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  goal_text text,
  deadline_date date,
  onboarding_skipped boolean default false
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create table public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  chinese text not null,
  pinyin text,
  meaning text,
  times_seen integer default 1,
  last_seen timestamptz default timezone('utc', now()),
  next_review timestamptz default (timezone('utc', now()) + interval '1 day'),
  created_at timestamptz default timezone('utc', now()),
  unique (user_id, chinese)
);
create index words_user_next_review_idx on public.words (user_id, next_review);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz default timezone('utc', now()),
  unique (user_id, lesson_id)
);

create table public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  activity_date date not null,
  session_count integer default 1,
  unique (user_id, activity_date)
);

-- Written only by the server (service key, via consume_daily_quota below) to
-- enforce the daily caps on chat, audio and voice.
create table public.daily_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  usage_date date not null,
  message_count integer default 0,
  tts_count integer not null default 0,
  transcribe_count integer not null default 0,
  unique (user_id, usage_date)
);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.words enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.daily_activity enable row level security;
alter table public.daily_usage enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can view own conversations" on public.conversations
  for all using (auth.uid() = user_id);
create policy "Users can manage own words" on public.words
  for all using (auth.uid() = user_id);
create policy "Users can manage own progress" on public.lesson_progress
  for all using (auth.uid() = user_id);
create policy "Users manage own activity" on public.daily_activity
  for all using (auth.uid() = user_id);
create policy "Users can read own usage" on public.daily_usage
  for select using (auth.uid() = user_id);

-- Create a profile row for every new account.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic daily caps (see supabase/migrations/20261103_atomic_usage_caps.sql).
-- Adds p_amount to today's (UTC) counter for p_kind and returns the new count, or
-- null if the counter is already at p_limit. A negative p_amount gives one back
-- (used when the provider fails) and is never blocked.
create or replace function public.consume_daily_quota(
  p_user_id uuid,
  p_kind text,
  p_limit integer,
  p_amount integer default 1
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_col text;
  v_today date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  v_col := case p_kind
    when 'message' then 'message_count'
    when 'tts' then 'tts_count'
    when 'transcribe' then 'transcribe_count'
  end;
  if v_col is null then
    raise exception 'unknown quota kind: %', p_kind;
  end if;

  insert into public.daily_usage (user_id, usage_date)
  values (p_user_id, v_today)
  on conflict (user_id, usage_date) do nothing;

  execute format(
    'update public.daily_usage
        set %1$I = greatest(coalesce(%1$I, 0) + $1, 0)
      where user_id = $2 and usage_date = $3
        and ($1 < 0 or coalesce(%1$I, 0) < $4)
      returning %1$I',
    v_col
  )
  into v_count
  using p_amount, p_user_id, v_today, p_limit;

  return v_count;
end;
$$;

-- Server only: a signed-in user calling this through the API could give themselves
-- quota back, so only the service role may run it.
revoke execute on function public.consume_daily_quota(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_daily_quota(uuid, text, integer, integer) to service_role;
