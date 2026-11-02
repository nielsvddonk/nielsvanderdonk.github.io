// Log in / log out, plus backup export & import.

import * as store from '../store.js';
import { esc } from '../lib/util.js';

async function downloadBackup() {
  const blob = new Blob([await store.exportRecipes()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hungry-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default async function account(el, { params, admin }) {
  const next = params.get('next') || '/';
  document.title = 'Account · Hungry';

  if (!admin) {
    const online = store.mode === 'supabase';
    el.innerHTML = `
      <form class="narrow" id="login">
        <h1>Log in</h1>
        <p class="muted">Only needed to add or edit recipes.${online ? ' Logs you in to all apps on this site.' : ''}</p>
        ${online ? `<label class="field"><span class="label">Email</span>
          <input name="email" type="email" autocomplete="username" required autofocus></label>` : ''}
        <label class="field"><span class="label">Password</span>
          <input name="password" type="password" autocomplete="current-password" required ${online ? '' : 'autofocus'}></label>
        <p class="error" id="error" hidden></p>
        <button class="btn btn-primary">Log in</button>
        ${store.mode === 'local' ? '<p class="hint">Local mode: the password is <code>localPassword</code> in <code>js/config.js</code>.</p>' : ''}
        <p class="hint">Want a copy of all recipes? <button type="button" class="link" id="export">Download backup</button></p>
      </form>`;

    el.querySelector('#export').addEventListener('click', downloadBackup);
    el.querySelector('#login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const error = el.querySelector('#error');
      try {
        await store.login(fd.get('email') || '', fd.get('password'));
        location.hash = '#' + next;
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
      }
    });
    return;
  }

  const me = await store.currentUser();
  el.innerHTML = `
    <div class="narrow">
      <h1>Account</h1>
      <p>${me ? `Logged in as <strong>${esc(me.name || me.email)}</strong>.` : 'You’re logged in.'}
        You can add and edit recipes.</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="#/new">+ New recipe</a>
        <button class="btn" id="logout">Log out</button>
      </div>

      <h2>Backup</h2>
      <p class="muted">Download all recipes as one file, or load recipes from such a file.
        ${store.mode === 'local' ? 'Use this to move recipes from local mode to the online version.' : ''}</p>
      <div class="btn-row">
        <button class="btn" id="export">Download backup</button>
        <button class="btn" id="import">Import backup…</button>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
      </div>
      <p id="status" class="small"></p>

      <p class="small muted">Mode: ${esc(store.mode)}</p>
    </div>`;

  const status = el.querySelector('#status');

  el.querySelector('#logout').addEventListener('click', async () => {
    await store.logout();
    location.hash = '#/';
  });

  el.querySelector('#export').addEventListener('click', downloadBackup);

  const fileInput = el.querySelector('#import-file');
  el.querySelector('#import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    status.textContent = 'Importing…';
    try {
      const n = await store.importRecipes(await file.text());
      status.textContent = `Imported ${n} recipes.`;
    } catch (err) {
      status.textContent = 'Import failed: ' + err.message;
    }
    fileInput.value = '';
  });
}
