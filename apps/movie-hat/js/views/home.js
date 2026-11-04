// The hat: "Grab Movie" pulls one out at random; below it, every movie still in the hat.

import * as store from '../store.js';
import { esc, local, session, today } from '../util.js';
import { poster, posterUrl, meta, perPerson, personName, tile } from './parts.js';

const PICK = 'movieHat.pick'; // the grabbed movie stays up until it's watched (on this phone)
const GENRE = 'movieHat.genre';
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const random = (list) => list[Math.floor(Math.random() * list.length)];

export default function home(el, { loggedIn }) {
  let genre = session.get(GENRE, '');
  let pick = null;
  let busy = false;

  el.innerHTML = `
    <section class="home">
      <h1 class="home-title">What are we watching?</h1>
      <div class="stage" id="stage" aria-live="polite"></div>
      <button class="btn btn-big" id="grab" type="button">Grab Movie</button>
      <div class="chips chips-center" id="genres" aria-label="Grab from"></div>
      <p class="muted small" id="note"></p>
    </section>
    <section class="hat">
      <div class="hat-head">
        <h2 class="label" id="hat-count"></h2>
        <span class="muted small" id="hat-people"></span>
      </div>
      <ul class="posters" id="posters"></ul>
    </section>`;

  const $ = (sel) => el.querySelector(sel);
  const stage = $('#stage');
  const grab = $('#grab');
  const pool = () => store.inHat().filter((m) => !genre || (m.genres || []).includes(genre));
  const canGrabAnother = () => pool().some((m) => m.id !== pick?.id);

  // The grabbed movie, if it's still in the hat.
  function syncPick() {
    pick = store.getMovie(pick?.id ?? local.get(PICK));
    if (pick?.watched_on) pick = null;
    if (!pick) local.remove(PICK);
  }

  function drawPick({ landed = false, shuffling = false } = {}) {
    if (!pick) { stage.innerHTML = ''; return; }
    stage.innerHTML = `
      <article class="pick${landed ? ' is-landed' : ''}${shuffling ? ' is-shuffling' : ''}">
        <a class="pick-poster" href="#/m/${pick.id}" tabindex="-1" aria-hidden="true">${poster(pick, 'w500', { lazy: false })}</a>
        <div class="pick-text">
          <h2 class="pick-title"><a href="#/m/${pick.id}">${esc(pick.title)}</a></h2>
          <p class="pick-meta">${esc(meta(pick))}</p>
          <p class="muted small">Added by ${esc(personName(pick.added_by))}</p>
          <div class="btn-row pick-actions">
            ${loggedIn ? '<button class="btn btn-primary" type="button" data-act="watched">We watched it</button>' : ''}
            <button class="btn" type="button" data-act="grab"${canGrabAnother() ? '' : ' disabled'}>Grab another</button>
          </div>
          <p class="error small" id="pick-error" hidden></p>
        </div>
      </article>`;
  }

  function draw() {
    const hat = store.inHat();
    const genres = [...new Set(hat.flatMap((m) => m.genres || []))].sort((a, b) => a.localeCompare(b));
    if (genre && !genres.includes(genre)) { genre = ''; session.set(GENRE, ''); }
    const n = pool().length;

    grab.hidden = Boolean(pick); // with a pick on stage, "Grab another" sits next to it
    grab.disabled = busy || !n;
    const another = stage.querySelector('[data-act="grab"]');
    if (another) another.disabled = busy || !canGrabAnother();
    $('#genres').innerHTML = genres.length > 1
      ? ['', ...genres].map((g) => `<button class="chip${g === genre ? ' is-on' : ''}" type="button" data-genre="${esc(g)}">${esc(g || 'anything')}</button>`).join('')
      : '';
    $('#note').innerHTML = !hat.length
      ? `The hat is empty.${loggedIn ? ' <a href="#/add">Add a movie</a>' : ''}`
      : genre ? esc(`${n} ${genre.toLowerCase()} ${n === 1 ? 'movie' : 'movies'} in the hat`) : '';

    $('#hat-count').textContent = `In the hat · ${hat.length}`;
    $('#hat-people').textContent = hat.length ? perPerson(hat) : '';
    $('#posters').innerHTML = hat.length ? hat.map(tile).join('') : '<li class="empty">Nothing in the hat yet.</li>';
  }

  // Pulling it out of the hat: posters flick past, slowing down, then the pick lands.
  async function shuffle() {
    const others = pool().filter((m) => m.id !== pick.id);
    if (calm.matches || !others.length) return;
    if (pick.poster) new Image().src = posterUrl(pick.poster, 'w500'); // ready by the time it lands
    drawPick({ shuffling: true });
    const frame = stage.querySelector('.poster');
    let last = null;
    for (let i = 0; i < 10; i++) {
      let m = random(others);
      if (m === last && others.length > 1) m = random(others.filter((x) => x !== last));
      last = m;
      frame.querySelector('.poster-title').textContent = m.title;
      frame.querySelector('img')?.remove();
      if (m.poster) frame.insertAdjacentHTML('beforeend', `<img src="${esc(posterUrl(m.poster, 'w342'))}" alt="" onerror="this.remove()">`);
      await wait(45 + i * i * 2.5);
    }
  }

  async function grabOne() {
    let options = pool();
    if (busy || !options.length) return;
    if (pick && options.length > 1) options = options.filter((m) => m.id !== pick.id); // never the same twice in a row
    pick = random(options);
    local.set(PICK, pick.id);
    busy = true;
    draw();
    await shuffle();
    busy = false;
    drawPick({ landed: true });
    draw();
    stage.scrollIntoView({ block: 'nearest', behavior: calm.matches ? 'auto' : 'smooth' });
  }

  async function markWatched(button) {
    button.disabled = true;
    try {
      const m = await store.updateMovie(pick.id, { watched_on: today() }, 'mark it watched');
      pick = null;
      local.remove(PICK);
      stage.innerHTML = `
        <p class="box done">Hope it was good! <strong>${esc(m.title)}</strong> moved to <a href="#/watched">Watched</a>.
          <button class="link" type="button" data-act="undo" data-id="${m.id}">Undo</button></p>`;
      draw();
    } catch (err) {
      button.disabled = false;
      const error = stage.querySelector('#pick-error');
      error.textContent = err.message;
      error.hidden = false;
    }
  }

  async function undo(id) {
    try {
      pick = await store.updateMovie(id, { watched_on: null }, 'put it back');
      local.set(PICK, pick.id);
      drawPick();
      draw();
    } catch (err) {
      stage.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  grab.addEventListener('click', grabOne);

  stage.addEventListener('click', (e) => {
    const button = e.target.closest('[data-act]');
    if (!button) return;
    if (button.dataset.act === 'grab') grabOne();
    if (button.dataset.act === 'watched') markWatched(button);
    if (button.dataset.act === 'undo') undo(Number(button.dataset.id));
  });

  $('#genres').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || busy) return;
    genre = chip.dataset.genre;
    session.set(GENRE, genre);
    draw();
  });

  syncPick();
  drawPick();
  draw();

  return {
    // Movies changed on the other phone.
    refresh() {
      if (busy) return;
      const before = pick?.id;
      syncPick();
      if (pick || before) drawPick();
      draw();
    },
  };
}
