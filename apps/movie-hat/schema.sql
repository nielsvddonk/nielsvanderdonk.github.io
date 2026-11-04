-- Movie Hat: run once in Supabase → SQL Editor (the same project as the other apps).
-- Safe to run again later.
--
-- One row per movie. A movie is "in the hat" until it gets a watched_on date;
-- after that it stays in the table as your log of everything you've watched.
-- Everyone can look; only logged-in users (you two — sign-ups are off) can change things.

create table if not exists public.movies (
  id          bigint generated always as identity primary key,
  tmdb_id     integer,                          -- themoviedb.org id
  kind        text not null default 'movie',    -- 'movie' or 'tv'
  imdb_id     text,                             -- e.g. 'tt0111161'
  title       text not null,
  year        smallint,
  runtime     smallint,                         -- minutes
  genres      text[] not null default '{}',
  poster      text,                             -- image address (TMDB posters are all 2:3)
  overview    text,
  director    text,                             -- for series: who created it
  added_by    text not null,                    -- a person id from config.js: 'niels' or 'vikki'
  added_at    timestamptz not null default now(),
  watched_on  date,                             -- empty = still in the hat
  unique (kind, tmdb_id)                        -- the same movie can't go in twice
);

alter table public.movies enable row level security;
grant select on public.movies to anon, authenticated; -- Supabase usually does this itself; here to be sure
grant insert, update, delete on public.movies to authenticated;

drop policy if exists "Anyone can see the hat" on public.movies;
create policy "Anyone can see the hat"
  on public.movies for select using (true);
drop policy if exists "Logged in can add movies" on public.movies;
create policy "Logged in can add movies"
  on public.movies for insert to authenticated with check (true);
drop policy if exists "Logged in can change movies" on public.movies;
create policy "Logged in can change movies"
  on public.movies for update to authenticated using (true) with check (true);
drop policy if exists "Logged in can remove movies" on public.movies;
create policy "Logged in can remove movies"
  on public.movies for delete to authenticated using (true);


-- Settings, for now only the TMDB API key (pasted in the app the first time you add
-- a movie). Only readable when logged in, so the key isn't public like the code on GitHub.

create table if not exists public.movie_hat_settings (
  key   text primary key,
  value text not null
);

alter table public.movie_hat_settings enable row level security;
grant select, insert, update on public.movie_hat_settings to authenticated;

drop policy if exists "Logged in can read settings" on public.movie_hat_settings;
create policy "Logged in can read settings"
  on public.movie_hat_settings for select to authenticated using (true);
drop policy if exists "Logged in can add settings" on public.movie_hat_settings;
create policy "Logged in can add settings"
  on public.movie_hat_settings for insert to authenticated with check (true);
drop policy if exists "Logged in can change settings" on public.movie_hat_settings;
create policy "Logged in can change settings"
  on public.movie_hat_settings for update to authenticated using (true) with check (true);
