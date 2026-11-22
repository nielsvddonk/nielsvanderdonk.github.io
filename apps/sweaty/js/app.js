// Sweaty: a running plan, home strength workouts and a calorie counter, in one small app.
// This file is the router and the page around it.
//
// Pages (hash URLs work on GitHub Pages without any server setup):
//   #/                     today
//   #/day/2026-11-25       any other day
//   #/week, #/week/<day>   a week of the plan          #/plan   the whole plan
//   #/workout/<day>/<key>  workout mode (key: fullA, upperB, core, mobility, …)
//   #/run/<day>[/<id>]     log or change a run
//   #/food[/<day>]         food and weight             #/food/<day>/add   add food
//   #/me                   settings                    #/me/foods         your own foods
//   #/library[/<id>]       the exercise library
//   #/setup                the first time
//
// Each page is a function (el, args) that fills `el` and may return { refresh(), destroy() }.

import * as store from './store.js';
import { complete } from './defaults.js';
import { esc, loginHref, today } from './util.js';
import dayView from './views/day.js';
import { weekView, planView } from './views/week.js';
import workoutView from './views/workout.js';
import runView from './views/run.js';
import foodView from './views/food.js';
import foodAddView from './views/food-add.js';
import { meView, setupView, myFoodsView } from './views/me.js';
import { libraryView, exerciseView } from './views/library.js';

const DAY = '(\\d{4}-\\d{2}-\\d{2})';
const routes = [
  { re: /^\/$/, view: dayView, tab: 'today', args: () => ({ date: today() }) },
  { re: new RegExp(`^/day/${DAY}$`), view: dayView, tab: 'today', args: (m) => ({ date: m[1] }) },
  { re: new RegExp(`^/week(?:/${DAY})?$`), view: weekView, tab: 'week', args: (m) => ({ date: m[1] }) },
  { re: /^\/plan$/, view: planView, tab: 'week' },
  { re: new RegExp(`^/workout/${DAY}/([\\w-]+)$`), view: workoutView, focus: true, args: (m) => ({ date: m[1], key: m[2] }) },
  { re: new RegExp(`^/run/${DAY}(?:/([\\w-]+))?$`), view: runView, tab: 'today', args: (m) => ({ date: m[1], id: m[2] }) },
  { re: new RegExp(`^/food(?:/${DAY})?$`), view: foodView, tab: 'food', args: (m) => ({ date: m[1] || today() }) },
  { re: new RegExp(`^/food/${DAY}/add$`), view: foodAddView, tab: 'food', args: (m) => ({ date: m[1] }) },
  { re: /^\/me$/, view: meView, tab: 'me' },
  { re: /^\/me\/foods$/, view: myFoodsView, tab: 'me' },
  { re: /^\/library$/, view: libraryView, tab: 'me' },
  { re: /^\/library\/([\w%-]+)$/, view: exerciseView, tab: 'me', args: (m) => ({ id: m[1] }) },
  { re: /^\/setup$/, view: setupView, focus: true },
];

const main = document.getElementById('main');
const syncBar = document.getElementById('sync');
let current = null;
let token = 0;
let ready = false;
let shownDay = today();

function chrome(r) {
  document.body.classList.toggle('is-focus', Boolean(r?.focus));
  document.querySelectorAll('[data-tab]').forEach((a) => {
    const on = a.dataset.tab === r?.tab;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.getElementById('mode').textContent = store.isLocal ? 'Local mode: saved in this browser only' : '';
}

async function route() {
  if (!ready) return;
  const mine = ++token;
  current?.destroy?.();
  current = null;
  const path = (location.hash.slice(1) || '/').split('?')[0];
  const hasSettings = Boolean(store.getSettings());
  if (!hasSettings && path !== '/setup') { location.replace('#/setup'); return; }
  if (hasSettings && path === '/setup') { location.replace('#/'); return; }
  const r = routes.find((x) => x.re.test(path));
  chrome(r);
  shownDay = today();
  // Every page gets a fresh element, so nothing of the last page keeps listening.
  const el = document.createElement('div');
  el.className = 'page';
  main.replaceChildren(el);
  window.scrollTo(0, 0);
  if (!r) {
    el.innerHTML = '<p>Page not found. <a href="#/">Back to today</a></p>';
    return;
  }
  try {
    const handle = await r.view(el, r.args ? r.args(path.match(r.re)) : {});
    if (mine === token) current = handle || null;
    else handle?.destroy?.();
  } catch (err) {
    console.error(err);
    if (mine === token) el.innerHTML = `<p class="error">${esc(err.message || err)}</p><p><a href="#/">Back to today</a></p>`;
  }
}

function showSync() {
  const { pending, problem } = store.syncState();
  syncBar.hidden = !problem;
  if (problem) {
    syncBar.innerHTML = `<span>${esc(problem)} ${pending === 1 ? 'One change waits' : `${pending} changes wait`} on this phone.</span> <button type="button" class="link" data-retry>Try again</button>`;
  }
}
syncBar.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) store.retry(); });

function showLogin() {
  chrome({ focus: true });
  main.innerHTML = `
    <div class="page narrow login">
      <img src="./icon.svg" alt="" width="72" height="72">
      <h1>Sweaty</h1>
      <p>Your running plan, home workouts and calories.</p>
      <p class="muted">It’s private: log in with the same account as the other apps on this site.</p>
      <p><a class="btn btn-primary btn-tall" href="${loginHref()}">Log in</a></p>
      <p class="muted small">Just looking around? <a href="./?local#/">Try it without logging in</a> (everything stays in this browser).</p>
    </div>`;
}

async function boot() {
  try {
    const u = await store.user();
    if (!u) { showLogin(); return; }
    await store.load();
    const s = store.getSettings();
    if (s) store.adopt(complete(s));
    ready = true;
    route();
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="page"><p class="error">${esc(err.message || err)}</p><p><button class="btn" type="button" onclick="location.reload()">Try again</button></p></div>`;
  }
}

// Back in the app (e.g. after logging something on the laptop): load again.
let refreshing = false;
async function refresh() {
  if (!ready || refreshing || document.visibilityState !== 'visible') return;
  if (shownDay !== today() && (location.hash === '' || location.hash === '#/')) { route(); return; } // past midnight
  refreshing = true;
  try {
    if (await store.reload()) {
      const s = store.getSettings();
      if (s) store.adopt(complete(s));
      current?.refresh?.();
    }
  } catch { /* offline for a moment: keep showing what we have */ }
  refreshing = false;
}

window.addEventListener('hashchange', route);
window.addEventListener('sweaty:rerender', route);
document.addEventListener('visibilitychange', refresh);
window.addEventListener('focus', refresh);
store.onChange(showSync);
store.onLoginChange(() => location.reload());
boot();
