// Everything you've watched, newest first, by month.

import * as store from '../store.js';
import { esc, formatDate, plural } from '../util.js';
import { poster, perPerson, personName } from './parts.js';

const row = (m) => `
  <li>
    <a class="row" href="#/m/${m.id}">
      ${poster(m, 'w154')}
      <span class="row-text">
        <span class="row-title">${esc(m.title)}${m.year ? ` <span class="row-year">${m.year}</span>` : ''}</span>
        <span class="row-meta">${esc(`${formatDate(m.watched_on, { weekday: 'short', day: 'numeric', month: 'short' })} · added by ${personName(m.added_by)}`)}</span>
      </span>
    </a>
  </li>`;

export default function watched(el) {
  document.title = 'Watched · Movie Hat';
  const root = el.appendChild(document.createElement('div'));

  function draw() {
    const list = store.watched();
    if (!list.length) {
      root.innerHTML = '<h1>Watched</h1><p class="muted">Nothing watched yet. <a href="#/">Grab a movie</a> from the hat!</p>';
      return;
    }
    const months = new Map();
    for (const m of list) {
      const month = m.watched_on.slice(0, 7);
      months.set(month, [...(months.get(month) || []), m]);
    }
    // Series only know how long an episode is, so they don't count towards the hours.
    const minutes = list.reduce((n, m) => n + (m.kind === 'movie' ? m.runtime || 0 : 0), 0);

    root.innerHTML = `
      <h1>Watched</h1>
      <div class="list-meta">
        <span>${plural(list.length, 'movie')}${minutes >= 60 ? ` · ${Math.round(minutes / 60)} hours` : ''}</span>
        <span>Added by ${esc(perPerson(list))}</span>
      </div>
      ${[...months].map(([month, items]) => `
        <h2 class="label month">${esc(formatDate(month + '-01', { month: 'long', year: 'numeric' }))}</h2>
        <ul class="rows">${items.map(row).join('')}</ul>`).join('')}`;
  }

  draw();
  return { refresh: draw };
}
