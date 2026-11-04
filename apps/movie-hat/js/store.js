// All reading and writing goes through this file. The movies live in the Supabase
// table "movies" (schema.sql): the same project, and the same login, as the other apps.
//
// A movie looks like:
// {
//   id, tmdb_id, kind: 'movie' | 'tv', imdb_id: 'tt0111161',
//   title, year, runtime (minutes), genres: ['Drama'], poster: 'https://image.tmdb.org/…',
//   overview, director, added_by: 'niels' | 'vikki', added_at,
//   watched_on: '2026-11-04', or null while it's still in the hat
// }

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm';
import { config } from '../config.js';

const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
const movies = () => supabase.from('movies');
const settings = () => supabase.from('movie_hat_settings');

// A failed request → what went wrong, in plain words.
function problem({ error, status }, doing) {
  const code = error?.code;
  if (status === 404 || code === 'PGRST205' || code === '42P01') {
    return new Error('Movie Hat’s tables don’t exist yet: run apps/movie-hat/schema.sql in Supabase → SQL Editor.');
  }
  if (code === '23505') return new Error('That one is already in the hat.');
  if (code === '42501') return new Error(`Couldn’t ${doing}. Are you still logged in?`);
  if (code === 'PGRST116') return new Error(`Couldn’t ${doing}. Maybe it was just removed on the other phone, or you’re logged out.`);
  if (!code) return new Error(`Couldn’t ${doing}. Check your connection.`);
  return new Error(`Couldn’t ${doing}: ${error.message}`);
}

// ---------- Movies ----------
// All of them (in the hat and watched) are loaded once and kept in memory.

let cache = null;
let snapshot = '';
function keep(list) {
  cache = list;
  snapshot = JSON.stringify(list);
}

async function fetchAll() {
  const res = await movies().select('*').order('added_at', { ascending: false }).order('id', { ascending: false });
  if (res.error) throw problem(res, 'load the movies');
  return res.data;
}

export async function listMovies() {
  if (!cache) keep(await fetchAll());
  return cache;
}

// Loads the movies again, e.g. after something was added on the other phone. → true if anything changed.
export async function reload() {
  const before = snapshot;
  keep(await fetchAll());
  return snapshot !== before;
}

export const getMovie = (id) => (cache || []).find((m) => m.id === Number(id)) || null;
export const inHat = () => (cache || []).filter((m) => !m.watched_on); // newest first
export const watched = () => (cache || []).filter((m) => m.watched_on)
  .sort((a, b) => b.watched_on.localeCompare(a.watched_on) || b.id - a.id);

// The same movie, if it's already in the hat (or was watched).
export const findSame = ({ kind, tmdb_id }) =>
  (cache || []).find((m) => m.kind === kind && m.tmdb_id === tmdb_id) || null;

export async function addMovie(movie) {
  const res = await movies().insert(movie).select().single();
  if (res.error) throw problem(res, 'put it in the hat');
  keep([res.data, ...(cache || [])]);
  return res.data;
}

export async function updateMovie(id, changes, doing = 'save that') {
  const res = await movies().update(changes).eq('id', id).select().single();
  if (res.error) throw problem(res, doing);
  keep(cache.map((m) => (m.id === id ? res.data : m)));
  return res.data;
}

export async function removeMovie(id) {
  const res = await movies().delete().eq('id', id).select('id');
  if (res.error) throw problem(res, 'remove it');
  if (!res.data.length) throw problem({ error: { code: 'PGRST116' } }, 'remove it');
  keep(cache.filter((m) => m.id !== id));
}

// ---------- Settings (the TMDB key) ----------

export async function getSetting(key) {
  const res = await settings().select('value').eq('key', key).maybeSingle();
  if (res.error) throw problem(res, 'load the settings');
  return res.data?.value || '';
}

export async function saveSetting(key, value) {
  const res = await settings().upsert({ key, value });
  if (res.error) throw problem(res, 'save that');
}

// ---------- Login ----------
// The same login as nielsvanderdonk.nl/apps: logging in there logs you in here.

export async function loggedIn() {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

// Calls fn() after logging in or out (e.g. on the apps page in another tab).
export function onLoginChange(fn) {
  let was = null;
  supabase.auth.onAuthStateChange((_event, session) => {
    const now = Boolean(session);
    if (was !== null && now !== was) setTimeout(fn); // not inside the callback: Supabase advises against it
    was = now;
  });
}
