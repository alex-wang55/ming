-- Run this in Supabase SQL editor before using the new files.

create table daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  usage_date date not null,
  message_count integer default 0,
  unique(user_id, usage_date)
);

alter table daily_usage enable row level security;
create policy "Users manage own usage" on daily_usage
  for all using (auth.uid() = user_id);
