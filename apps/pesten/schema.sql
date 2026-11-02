-- Pesten Score: run once in Supabase → SQL Editor (the same project as Hungry).
--
-- One row per game won. Everyone can see the score; only logged-in users
-- (you two — sign-ups are off) can add a win or take one back.

create table if not exists public.pesten_games (
  id bigint generated always as identity primary key,
  winner text not null,                       -- a player id from config.js, e.g. 'vikki'
  created_at timestamptz not null default now()
);

alter table public.pesten_games enable row level security;

create policy "Anyone can see the score"
  on public.pesten_games for select using (true);
create policy "Logged in can add a win"
  on public.pesten_games for insert to authenticated with check (true);
create policy "Logged in can take back a win"
  on public.pesten_games for delete to authenticated using (true);

-- Live updates: a win added on one phone shows up on the other right away.
alter publication supabase_realtime add table public.pesten_games;
