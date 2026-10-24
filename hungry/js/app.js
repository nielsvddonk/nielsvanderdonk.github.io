// Router. URLs look like  #/archive?tags=pasta  or  #/r/<recipe-id>.
// Hash URLs work on any static host (GitHub Pages) without server config.
//
// Each view is a function (el, ctx) that fills `el` and may return
// { cleanup(), canLeave() } — cleanup runs when leaving, canLeave()
// returning false asks before throwing away unsaved changes.
//
// To add a page: create js/views/<name>.js and add a line to `routes`.

import * as store from './store.js';
import { esc, nav } from './lib/util.js';
import home from './views/home.js';
import archive from './views/archive.js';
import recipe from './views/recipe.js';
import editor from './views/editor.js';
import planner from './views/planner.js';
import account from './views/account.js';

const routes = [
  { re: /^\/$/, view: home, nav: 'home' },
  { re: /^\/archive$/, view: archive, nav: 'archive' },
  { re: /^\/r\/([\w-]+)$/, view: recipe },
  { re: /^\/new$/, view: editor, nav: 'new', admin: true },
  { re: /^\/edit\/([\w-]+)$/, view: editor, admin: true },
  { re: /^\/plan$/, view: planner, nav: 'plan' },
  { re: /^\/account$/, view: account, nav: 'account' },
];

const main = document.getElementById('main');
let current = null;
let lastHash = location.hash;
let ignoreNext = false;
let token = 0;

function updateChrome(admin, navKey) {
  document.body.classList.toggle('is-admin', admin);
  document.getElementById('account-link').textContent = admin ? 'Account' : 'Log in';
  document.getElementById('mode-note').textContent =
    store.mode === 'local' ? 'Local mode — recipes are saved in this browser only.' : '';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === navKey));
}

async function route() {
  if (ignoreNext) { ignoreNext = false; return; }
  if (current?.canLeave && !current.canLeave() && !confirm('You have unsaved changes. Leave anyway?')) {
    ignoreNext = true;
    location.hash = lastHash;
    return;
  }
  current?.cleanup?.();
  current = null;
  lastHash = location.hash;
  nav.count++;
  const mine = ++token;

  const raw = location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  const r = routes.find((x) => x.re.test(path));

  try {
    const [admin] = await Promise.all([store.isAdmin(), store.listRecipes()]);
    if (mine !== token) return;
    updateChrome(admin, r?.nav);
    if (r?.admin && !admin) { location.replace('#/account?next=' + encodeURIComponent(raw)); return; }

    main.className = '';
    main.innerHTML = '';
    document.title = 'Hungry';
    window.scrollTo(0, 0);
    if (!r) { main.innerHTML = '<p>Page not found. <a href="#/">Go home</a></p>'; return; }

    const ctx = { id: path.match(r.re)[1], params: new URLSearchParams(query), admin };
    const handle = (await r.view(main, ctx)) || null;
    if (mine !== token) { handle?.cleanup?.(); return; } // navigated away while loading
    current = handle;
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p class="error">Something went wrong: ${esc(err.message || err)}</p>`;
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', (e) => {
  if (current?.canLeave && !current.canLeave()) { e.preventDefault(); e.returnValue = ''; }
});
route();
