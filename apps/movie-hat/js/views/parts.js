// Small pieces of HTML used by several pages.

import { config } from '../../config.js';
import { esc, formatRuntime, shortRuntime } from '../util.js';

export const personName = (id) => config.people.find((p) => p.id === id)?.name || id || '';

// Posters are saved at TMDB size w500; this asks for another size (w154, w342, w500, w780).
export const posterUrl = (url, size) => (url ? url.replace(/\/t\/p\/(?:w\d+|original)\//, `/t/p/${size}/`) : '');

// A poster, always 2:3. The title shows while it loads, or instead of a missing poster.
export function poster(m, size = 'w342', { lazy = true } = {}) {
  const src = posterUrl(m.poster, size);
  return `<span class="poster" aria-hidden="true"><span class="poster-title">${esc(m.title)}</span>${src
    ? `<img src="${esc(src)}" alt=""${lazy ? ' loading="lazy"' : ''} decoding="async" onerror="this.remove()">`
    : ''}</span>`;
}

// "1994 · 2 h 22 min · Drama, Crime"   or for a series: "2019 · Series · 73 min episodes · Drama"
export function meta(m, { genres = true } = {}) {
  const length = m.kind === 'tv' ? ['Series', m.runtime && `${m.runtime} min episodes`] : [formatRuntime(m.runtime)];
  return [m.year, ...length, genres && (m.genres || []).join(', ')].filter(Boolean).join(' · ');
}

// "Niels 7 · Vikki 5": how many of these each of you added.
export const perPerson = (list) =>
  config.people.map((p) => `${p.name} ${list.filter((m) => m.added_by === p.id).length}`).join(' · ');

// One poster in the grid of the hat.
export const tile = (m) => `
  <li>
    <a class="tile" href="#/m/${m.id}">
      ${poster(m)}
      <span class="tile-title">${esc(m.title)}</span>
      <span class="tile-meta">${esc([m.kind === 'tv' ? 'Series' : shortRuntime(m.runtime), personName(m.added_by)].filter(Boolean).join(' · '))}</span>
    </a>
  </li>`;
