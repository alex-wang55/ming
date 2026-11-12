-- Atomic per-user daily limits for chat, audio (TTS) and voice (Whisper).
-- Safe to run more than once. Run this BEFORE deploying the matching API routes:
-- they refuse requests (503) if bump_usage is missing, rather than run uncapped.

alter table public.daily_usage add column if not exists tts_count integer not null default 0;
alter table public.daily_usage add column if not exists transcribe_count integer not null default 0;

-- "on conflict" below needs one row per user per day.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_usage'::regclass and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (user_id, usage_date)'
  ) then
    alter table public.daily_usage add constraint daily_usage_user_id_usage_date_key unique (user_id, usage_date);
  end if;
end $$;

-- Takes one unit of today's allowance in a single statement, so parallel requests
-- can't all read the same count and slip past the cap. Returns the new count, or
-- null when the limit is already reached.
create or replace function public.bump_usage(p_user_id uuid, p_kind text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  if p_limit < 1 then
    return null;
  end if;

  if p_kind = 'chat' then
    insert into public.daily_usage as u (user_id, usage_date, message_count)
    values (p_user_id, v_today, 1)
    on conflict (user_id, usage_date) do update
      set message_count = coalesce(u.message_count, 0) + 1
      where coalesce(u.message_count, 0) < p_limit
    returning u.message_count into v_count;
  elsif p_kind = 'tts' then
    insert into public.daily_usage as u (user_id, usage_date, tts_count)
    values (p_user_id, v_today, 1)
    on conflict (user_id, usage_date) do update
      set tts_count = u.tts_count + 1
      where u.tts_count < p_limit
    returning u.tts_count into v_count;
  elsif p_kind = 'transcribe' then
    insert into public.daily_usage as u (user_id, usage_date, transcribe_count)
    values (p_user_id, v_today, 1)
    on conflict (user_id, usage_date) do update
      set transcribe_count = u.transcribe_count + 1
      where u.transcribe_count < p_limit
    returning u.transcribe_count into v_count;
  else
    raise exception 'unknown usage kind: %', p_kind;
  end if;

  return v_count;
end;
$$;

-- Gives a unit back when the provider failed, so an outage doesn't eat the allowance.
create or replace function public.refund_usage(p_user_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  if p_kind = 'chat' then
    update public.daily_usage set message_count = greatest(coalesce(message_count, 0) - 1, 0)
    where user_id = p_user_id and usage_date = v_today;
  elsif p_kind = 'tts' then
    update public.daily_usage set tts_count = greatest(tts_count - 1, 0)
    where user_id = p_user_id and usage_date = v_today;
  elsif p_kind = 'transcribe' then
    update public.daily_usage set transcribe_count = greatest(transcribe_count - 1, 0)
    where user_id = p_user_id and usage_date = v_today;
  end if;
end;
$$;

-- Server only: the API routes call these with the service key.
revoke execute on function public.bump_usage(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.refund_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.bump_usage(uuid, text, integer) to service_role;
grant execute on function public.refund_usage(uuid, text) to service_role;
