// Movie info and posters from TMDB (themoviedb.org): practically every movie and series,
// with genres and runtime, and every poster is 2:3. Browsers may call its API directly.
//
// You can paste an IMDb link (TMDB finds it by its IMDb id), a TMDB link, or type a title.
// The API key is kept in Supabase (see store.js), not in this public code.

const API = 'https://api.themoviedb.org/3';
const IMAGES = 'https://image.tmdb.org/t/p/';

let key = '';
export const setKey = (k) => { key = (k || '').trim(); };
export const hasKey = () => Boolean(key);

export class KeyError extends Error {}

async function get(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries({ language: 'en-US', ...params })) url.searchParams.set(k, v);
  // TMDB gives two keys and both work: the long "API Read Access Token" goes in a header,
  // the short "API Key" in the address.
  const headers = {};
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  else url.searchParams.set('api_key', key);

  let res;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new Error('Couldn’t reach TMDB. Check your connection.');
  }
  if (res.status === 401) throw new KeyError('TMDB didn’t accept the API key.');
  if (res.status === 404) throw new Error('TMDB doesn’t know that one.');
  if (!res.ok) throw new Error(`TMDB isn’t answering properly (error ${res.status}). Try again in a moment.`);
  return res.json();
}

// Does TMDB accept this key? Keeps it if so.
export async function checkKey(k) {
  const before = key;
  setKey(k);
  try {
    await get('/configuration');
    return true;
  } catch (err) {
    key = before;
    if (err instanceof KeyError) return false;
    throw err;
  }
}

// What was typed or pasted?
//   'https://www.imdb.com/title/tt0111161/?ref_=…' or 'tt0111161'  → { imdb: 'tt0111161' }
//   'https://www.themoviedb.org/movie/278-the-shawshank-redemption' → { kind: 'movie', id: 278 }
//   another link → { link }      anything else → { query }
export function parseInput(text) {
  const s = text.trim();
  const imdb = s.match(/\btt\d{7,10}\b/);
  if (imdb) return { imdb: imdb[0] };
  const tmdb = s.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
  if (tmdb) return { kind: tmdb[1].toLowerCase(), id: Number(tmdb[2]) };
  if (/^(https?:\/\/|www\.)/i.test(s)) return { link: s };
  return { query: s };
}

const poster = (path) => (path ? IMAGES + 'w500' + path : null);
const yearOf = (date) => Number(String(date || '').slice(0, 4)) || null;
const names = (people = []) => people.map((p) => p.name).join(', ') || null;

// Everything about one movie or series, ready to put in the hat.
export async function details(kind, id) {
  if (kind === 'tv') {
    const d = await get(`/tv/${id}`, { append_to_response: 'external_ids' });
    return {
      kind: 'tv',
      tmdb_id: d.id,
      imdb_id: d.external_ids?.imdb_id || null,
      title: d.name,
      year: yearOf(d.first_air_date),
      runtime: d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || null, // per episode
      genres: (d.genres || []).map((g) => g.name),
      poster: poster(d.poster_path),
      overview: d.overview || null,
      director: names(d.created_by),
    };
  }
  const d = await get(`/movie/${id}`, { append_to_response: 'credits' });
  return {
    kind: 'movie',
    tmdb_id: d.id,
    imdb_id: d.imdb_id || null,
    title: d.title,
    year: yearOf(d.release_date),
    runtime: d.runtime || null,
    genres: (d.genres || []).map((g) => g.name),
    poster: poster(d.poster_path),
    overview: d.overview || null,
    director: names((d.credits?.crew || []).filter((c) => c.job === 'Director')),
  };
}

// An IMDb id → everything about it. (A link to an episode gives its series.)
export async function fromImdb(imdbId) {
  const d = await get(`/find/${imdbId}`, { external_source: 'imdb_id' });
  const movie = d.movie_results?.[0];
  if (movie) return details('movie', movie.id);
  const showId = d.tv_results?.[0]?.id || d.tv_episode_results?.[0]?.show_id || d.tv_season_results?.[0]?.show_id;
  if (showId) return details('tv', showId);
  throw new Error('TMDB doesn’t have that IMDb title. Try typing its name instead.');
}

// A title → up to 8 movies and series, best match first.
export async function search(query) {
  const d = await get('/search/multi', { query, include_adult: 'false' });
  return (d.results || [])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 8)
    .map((r) => ({
      kind: r.media_type,
      tmdb_id: r.id,
      title: r.title || r.name,
      year: yearOf(r.release_date || r.first_air_date),
      poster: poster(r.poster_path),
    }));
}
