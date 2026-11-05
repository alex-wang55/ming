-- Atomic daily caps for chat, audio and voice. Safe to run more than once.
--
-- The chat route used to read message_count, call the AI, then write count + 1.
-- Requests sent in parallel all read the same count, so the 30-a-day cap could be
-- bypassed. Audio (/api/tts) and voice (/api/transcribe) had no cap at all.
-- consume_daily_quota() checks and increments in one statement under a row lock.

alter table public.daily_usage add column if not exists tts_count integer not null default 0;
alter table public.daily_usage add column if not exists transcribe_count integer not null default 0;

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
