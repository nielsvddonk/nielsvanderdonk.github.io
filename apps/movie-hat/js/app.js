// Movie Hat: our watchlist in a hat. This file is the router and the page around it.
//
// Pages (hash URLs work on GitHub Pages without any server setup):
//   #/          the hat: "Grab Movie", and every movie still in it
//   #/add       add a movie: an IMDb link, a TMDB link or a title
//   #/m/<id>    one movie: mark it watched, put it back, remove it
//   #/watched   everything you've watched, newest first
//
// Each page is a function (el, ctx) that fills `el` and may return { refresh() },
// which is called when the movies changed somewhere else (e.g. on the other phone).

import * as store from './store.js';
import { esc, loginHref } from './util.js';
import home from './views/home.js';
import add from './views/add.js';
import movie from './views/movie.js';
import watched from './views/watched.js';

const routes = [
  { re: /^\/$/, view: home },
  { re: /^\/add$/, view: add, nav: 'add' },
  { re: /^\/watched$/, view: watched, nav: 'watched' },
  { re: /^\/m\/(\d+)$/, view: movie },
];

const main = document.getElementById('main');
const loginLink = document.getElementById('login-link');
let current = null;
let token = 0;

function chrome(loggedIn, navKey) {
  document.body.classList.toggle('is-admin', loggedIn);
  loginLink.hidden = loggedIn;
  loginLink.href = loginHref();
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === navKey));
}

async function route() {
  const mine = ++token;
  current = null;
  const raw = location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  const r = routes.find((x) => x.re.test(path));

  try {
    const loggedIn = await store.loggedIn();
    if (mine !== token) return;
    chrome(loggedIn, r?.nav);
    await store.listMovies();
    if (mine !== token) return;
    document.title = 'Movie Hat';
    main.innerHTML = '';
    window.scrollTo(0, 0);
    if (!r) {
      main.innerHTML = '<p>Page not found. <a href="#/">Back to the hat</a></p>';
      return;
    }
    const ctx = { id: path.match(r.re)[1], params: new URLSearchParams(query), loggedIn };
    const handle = await r.view(main, ctx);
    if (mine === token) current = handle || null;
  } catch (err) {
    if (mine !== token) return;
    console.error(err);
    main.innerHTML = `<p class="error">${esc(err.message || err)}</p>`;
  }
}

// Back in the app (e.g. after Vikki added a movie on her phone): load the movies again.
let refreshing = false;
async function refresh() {
  if (refreshing || document.visibilityState !== 'visible') return;
  refreshing = true;
  try {
    if (await store.reload()) current?.refresh?.();
  } catch {
    // Offline for a moment: keep showing what we have.
  }
  refreshing = false;
}

window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', refresh);
window.addEventListener('focus', refresh);
store.onLoginChange(route);
route();
