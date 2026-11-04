// Add a movie: paste an IMDb (or TMDB) link, or type a title. Then pick who's adding it.

import * as store from '../store.js';
import * as tmdb from '../tmdb.js';
import { config } from '../../config.js';
import { esc, local, formatDate, loginHref } from '../util.js';
import { poster, meta, personName } from './parts.js';

const WHO = 'movieHat.addedBy'; // remembered per phone

export default async function add(el, ctx) {
  document.title = 'Add · Movie Hat';
  if (!ctx.loggedIn) {
    el.innerHTML = `
      <div class="narrow">
        <h1>Add a movie</h1>
        <p>Log in to put movies in the hat.</p>
        <a class="btn btn-primary" href="${esc(loginHref())}">Log in</a>
      </div>`;
    return;
  }
  if (!tmdb.hasKey()) {
    const key = await store.getSetting('tmdb_key');
    if (!key) return keyForm(el, () => finder(el, ctx));
    tmdb.setKey(key);
  }
  finder(el, ctx);
}

// First time only: the TMDB key, saved in Supabase for both of you.
function keyForm(el, done, rejected = false) {
  el.innerHTML = `
    <div class="narrow">
      <h1>One-time setup</h1>
      <p>Movie Hat gets movie info and posters from <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">TMDB</a>,
        which needs a free API key:</p>
      <ol class="setup">
        <li>Make an account on <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.</li>
        <li>In <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Settings → API</a>, request a key (Developer, personal use).</li>
        <li>Paste the <em>API Key</em> (or the long <em>API Read Access Token</em>) here.</li>
      </ol>
      <form id="key-form" class="box">
        <label class="field"><span class="label">TMDB API key</span>
          <input name="key" autocomplete="off" autocapitalize="off" spellcheck="false" required></label>
        <p class="error" id="key-error"${rejected ? '' : ' hidden'}>TMDB stopped accepting the saved key. Paste a new one.</p>
        <button class="btn btn-primary">Save key</button>
      </form>
      <p class="hint">It’s saved in your Supabase database, where only the two of you (logged in) can read it,
        not in the website’s public code.</p>
    </div>`;

  const form = el.querySelector('#key-form');
  const error = el.querySelector('#key-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = new FormData(form).get('key').trim();
    const button = form.querySelector('button');
    button.disabled = true;
    error.hidden = true;
    try {
      if (!(await tmdb.checkKey(key))) throw new Error('TMDB doesn’t accept that key. Check that you copied all of it.');
      await store.saveSetting('tmdb_key', key);
      done();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      button.disabled = false;
    }
  });
}

function finder(el, ctx) {
  let who = local.get(WHO);
  if (!config.people.some((p) => p.id === who)) who = null;
  let results = []; // the last search, to go back to
  let lookup = 0; // only the newest lookup gets shown

  el.innerHTML = `
    <div class="narrow">
      <h1>Add a movie</h1>
      <form class="find" id="find" role="search">
        <input name="q" type="search" placeholder="IMDb link or a title" aria-label="IMDb link or a title"
          autocomplete="off" enterkeyhint="search" autofocus>
        <button class="btn">Find</button>
      </form>
      <p class="hint">Paste a link from IMDb (or TMDB), or type a title to search.</p>
      <div id="out" aria-live="polite"></div>
    </div>`;

  const form = el.querySelector('#find');
  const input = form.elements.q;
  const out = el.querySelector('#out');
  const say = (html) => { out.innerHTML = html; };

  function fail(err) {
    if (err instanceof tmdb.KeyError) {
      tmdb.setKey('');
      keyForm(el, () => finder(el, ctx), true);
      return;
    }
    say(`<p class="error">${esc(err.message)}</p>`);
  }

  async function find(text) {
    const what = tmdb.parseInput(text);
    if (!text.trim()) return;
    if (what.link) {
      say('<p class="error">There’s no movie in that link. Use the link of the movie’s own page on IMDb (with /title/tt… in it), or type the title.</p>');
      return;
    }
    const mine = ++lookup;
    say('<p class="muted">Looking it up…</p>');
    try {
      if (what.query) {
        results = await tmdb.search(what.query);
        if (mine === lookup) showResults();
      } else {
        const m = what.imdb ? await tmdb.fromImdb(what.imdb) : await tmdb.details(what.kind, what.id);
        if (mine === lookup) preview(m);
      }
    } catch (err) {
      if (mine === lookup) fail(err);
    }
  }

  function showResults() {
    if (!results.length) {
      say('<p class="muted">Nothing found on TMDB. Try another spelling, or paste the IMDb link.</p>');
      return;
    }
    say(`<ul class="results">${results.map((r, i) => {
      const same = store.findSame(r);
      return `
        <li>
          <button class="result" type="button" data-i="${i}">
            ${poster(r, 'w154')}
            <span class="row-text">
              <span class="row-title">${esc(r.title)}</span>
              <span class="row-meta">${esc([r.year, r.kind === 'tv' ? 'Series' : 'Movie'].filter(Boolean).join(' · '))}</span>
            </span>
            ${same ? `<span class="tag">${same.watched_on ? 'Watched' : 'In the hat'}</span>` : ''}
          </button>
        </li>`;
    }).join('')}</ul>`);
  }

  function preview(m, { fromResults = false } = {}) {
    const same = store.findSame(m);
    say(`
      ${fromResults ? '<button class="link small back-link" type="button" data-act="back">← All results</button>' : ''}
      <article class="preview">
        ${poster(m, 'w342', { lazy: false })}
        <div>
          <h2>${esc(m.title)}</h2>
          <p class="muted">${esc(meta(m))}</p>
          ${m.director ? `<p class="small">${m.kind === 'tv' ? 'Created by' : 'Directed by'} ${esc(m.director)}</p>` : ''}
          ${m.overview ? `<p class="overview">${esc(m.overview)}</p>` : ''}
        </div>
      </article>
      ${same ? `
        <p class="box">${same.watched_on
          ? `You watched this on ${esc(formatDate(same.watched_on))}.`
          : `Already in the hat, added by ${esc(personName(same.added_by))}.`}
          <a href="#/m/${same.id}">Open it</a></p>` : `
        <div class="put">
          <div class="who">
            <span class="label">Added by</span>
            <div class="seg" role="group" aria-label="Added by">${config.people.map((p) => `
              <button type="button" data-who="${esc(p.id)}" aria-pressed="${p.id === who}"${p.id === who ? ' class="is-on"' : ''}>${esc(p.name)}</button>`).join('')}
            </div>
          </div>
          <button class="btn btn-primary" type="button" data-act="put"${who ? '' : ' disabled'}>Put it in the hat</button>
        </div>
        <p class="error" id="put-error" hidden></p>`}`);

    out.querySelector('[data-act="back"]')?.addEventListener('click', showResults);

    out.querySelector('.seg')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-who]');
      if (!b) return;
      who = b.dataset.who;
      local.set(WHO, who);
      out.querySelectorAll('[data-who]').forEach((x) => {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-pressed', x === b);
      });
      out.querySelector('[data-act="put"]').disabled = false;
    });

    out.querySelector('[data-act="put"]')?.addEventListener('click', async (e) => {
      const button = e.currentTarget;
      button.disabled = true;
      try {
        const saved = await store.addMovie({ ...m, added_by: who });
        input.value = '';
        results = [];
        say(`<p class="box">✓ <strong>${esc(saved.title)}</strong> is in the hat. <a href="#/">See the hat</a>, or add another.</p>`);
      } catch (err) {
        button.disabled = false;
        const error = out.querySelector('#put-error');
        error.textContent = err.message;
        error.hidden = false;
        store.reload().catch(() => {}); // e.g. it was just added on the other phone
      }
    });
  }

  out.addEventListener('click', async (e) => {
    const result = e.target.closest('.result');
    if (!result) return;
    const r = results[result.dataset.i];
    const mine = ++lookup;
    say('<p class="muted">Looking it up…</p>');
    try {
      const m = await tmdb.details(r.kind, r.tmdb_id);
      if (mine === lookup) preview(m, { fromResults: true });
    } catch (err) {
      if (mine === lookup) fail(err);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    input.blur(); // hides the phone keyboard, so the result is visible
    find(input.value);
  });

  // Pasting a link looks it up right away.
  input.addEventListener('paste', () => setTimeout(() => {
    if (!tmdb.parseInput(input.value).query) find(input.value);
  }));

  // #/add?q=… fills in the box (handy for a bookmark or a shortcut).
  const q = ctx.params.get('q');
  if (q) {
    input.value = q;
    find(q);
  }
}
