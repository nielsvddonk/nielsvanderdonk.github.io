// One movie: everything about it, and "We watched it", "Put back in the hat", remove.

import * as store from '../store.js';
import { esc, formatDate, isoDay, today } from '../util.js';
import { poster, meta, personName } from './parts.js';

export default function movie(el, { id, loggedIn }) {
  const root = el.appendChild(document.createElement('div'));

  function actions(m) {
    if (!m.watched_on) {
      return loggedIn ? `
        <div class="btn-row">
          <button class="btn btn-primary" type="button" data-do="watched">We watched it</button>
          <button class="btn btn-danger" type="button" data-do="remove">Remove from the hat</button>
        </div>` : '<p class="muted">In the hat.</p>';
    }
    if (!loggedIn) return `<p>Watched on ${esc(formatDate(m.watched_on))}.</p>`;
    return `
      <label class="watched-on"><span class="label">Watched on</span>
        <input type="date" id="watched-on" value="${esc(m.watched_on)}" max="${isoDay(new Date())}" required></label>
      <div class="btn-row">
        <button class="btn" type="button" data-do="unwatch">Put back in the hat</button>
        <button class="btn btn-danger" type="button" data-do="delete">Delete</button>
      </div>`;
  }

  function draw() {
    const m = store.getMovie(id);
    if (!m) {
      root.innerHTML = '<p>This movie isn’t in the hat anymore. <a href="#/">Back to the hat</a></p>';
      return;
    }
    document.title = `${m.title} · Movie Hat`;
    const links = [
      m.tmdb_id && `<a href="https://www.themoviedb.org/${m.kind}/${m.tmdb_id}" target="_blank" rel="noopener">TMDB</a>`,
      m.imdb_id && `<a href="https://www.imdb.com/title/${esc(m.imdb_id)}/" target="_blank" rel="noopener">IMDb</a>`,
    ].filter(Boolean);
    root.innerHTML = `
      <p class="back"><a href="#/${m.watched_on ? 'watched' : ''}">← ${m.watched_on ? 'Watched' : 'The hat'}</a></p>
      <article class="movie">
        <div class="movie-poster">${poster(m, 'w500', { lazy: false })}</div>
        <div>
          <h1>${esc(m.title)}</h1>
          <p class="movie-meta">${esc(meta(m))}</p>
          ${m.director ? `<p class="small">${m.kind === 'tv' ? 'Created by' : 'Directed by'} ${esc(m.director)}</p>` : ''}
          ${m.overview ? `<p>${esc(m.overview)}</p>` : ''}
          <p class="muted small">Added by ${esc(personName(m.added_by))} on ${esc(formatDate(m.added_at))}${links.length ? ` · ${links.join(' · ')}` : ''}</p>
          <div class="state">${actions(m)}</div>
          <p class="small" id="status" role="status"></p>
        </div>
      </article>`;
  }

  const status = (text, isError = false) => {
    const el = root.querySelector('#status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('error', isError);
  };

  root.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-do]');
    const m = store.getMovie(id);
    if (!button || !m) return;
    const act = button.dataset.do;
    if (act === 'remove' && !confirm(`Take “${m.title}” out of the hat?`)) return;
    if (act === 'delete' && !confirm(`Delete “${m.title}” from your watched movies?`)) return;
    button.disabled = true;
    try {
      if (act === 'watched') await store.updateMovie(m.id, { watched_on: today() }, 'mark it watched');
      if (act === 'unwatch') await store.updateMovie(m.id, { watched_on: null }, 'put it back');
      if (act === 'remove' || act === 'delete') {
        await store.removeMovie(m.id);
        location.hash = act === 'remove' ? '#/' : '#/watched';
        return;
      }
      draw();
      status(act === 'watched' ? 'Moved to Watched.' : 'Back in the hat.');
    } catch (err) {
      button.disabled = false;
      status(err.message, true);
    }
  });

  root.addEventListener('change', async (e) => {
    if (e.target.id !== 'watched-on' || !e.target.value) return;
    try {
      await store.updateMovie(Number(id), { watched_on: e.target.value }, 'change the date');
      status('Date saved.');
    } catch (err) {
      status(err.message, true);
    }
  });

  draw();
  return { refresh: draw };
}
