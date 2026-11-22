-- Sweaty: run once in Supabase → SQL Editor (the same project as the other apps).
-- Safe to run again later.
--
-- Everything in Sweaty is private: each person can only see and change their own rows.
-- (Vikki can use Sweaty too, with her own plan, food and weight; neither of you sees the other's.)
--
-- There's no link to the user table on purpose: if a user is ever deleted, their Sweaty data
-- stays. A new account has a new id; to give it the old data, run (with the two ids from
-- Authentication → Users):
--   update public.sweaty_log set user_id = 'NEW-ID' where user_id = 'OLD-ID';
--   update public.sweaty_settings set user_id = 'NEW-ID' where user_id = 'OLD-ID';

-- One row per person: body, goal, race, week rhythm, equipment, own foods and exercises.
create table if not exists public.sweaty_settings (
  user_id    uuid primary key default auth.uid(),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per thing on a day. kind is 'run', 'workout', 'food', 'weight',
-- 'plan' (your own change to that day) or 'skip'. The details are in data.
create table if not exists public.sweaty_log (
  id         uuid primary key,
  user_id    uuid not null default auth.uid(),
  day        date not null,
  kind       text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists sweaty_log_user_day on public.sweaty_log (user_id, day);

alter table public.sweaty_settings enable row level security;
alter table public.sweaty_log enable row level security;

grant select, insert, update, delete on public.sweaty_settings to authenticated;
grant select, insert, update, delete on public.sweaty_log to authenticated;
revoke all on public.sweaty_settings from anon;
revoke all on public.sweaty_log from anon;

drop policy if exists "Own settings only" on public.sweaty_settings;
create policy "Own settings only" on public.sweaty_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Own log only" on public.sweaty_log;
create policy "Own log only" on public.sweaty_log
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
