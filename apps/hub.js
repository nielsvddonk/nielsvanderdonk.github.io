// The apps page: one login for every app on nielsvanderdonk.nl/apps.
//
// All apps use the same Supabase project (config.js), and a browser keeps the
// login per website — so logging in here, or in any app, logs you in everywhere.
// Accounts are made in Supabase → Authentication → Users (sign-ups are off).

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm';
import { config } from './config.js';
import { apps } from './apps.js';

const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
const $ = (sel) => document.querySelector(sel);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// An app can send you here to log in first: /apps/?next=/apps/budget/
const next = new URLSearchParams(location.search).get('next');
const goNext = next && /^\/apps\/[\w-]/.test(next) ? next : null;

function renderApps(user) {
  const visible = apps.filter((a) => a.public || user);
  const hidden = apps.length - visible.length;
  $('#apps').innerHTML = visible.map((a) => `
    <li>
      <a class="app" href="${esc(a.path)}">
        <img src="${esc(a.icon)}" alt="" width="52" height="52">
        <span class="app-text">
          <strong>${esc(a.name)}</strong>
          <span class="muted">${esc(a.description)}</span>
        </span>
      </a>
    </li>`).join('') + (hidden ? `<li class="muted small">Log in to see ${hidden} more.</li>` : '');
}

function renderAccount(user) {
  if (!user) {
    $('#account').innerHTML = `
      <form id="login" class="card">
        <h2>Log in</h2>
        <p class="muted small">One login for all apps on this site.</p>
        <label class="field"><span class="label">Email</span>
          <input name="email" type="email" autocomplete="username" required></label>
        <label class="field"><span class="label">Password</span>
          <input name="password" type="password" autocomplete="current-password" required></label>
        <p class="error" id="error" hidden></p>
        <button class="btn btn-primary">Log in</button>
      </form>`;
    $('#login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const button = e.target.querySelector('button');
      button.disabled = true;
      const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email').trim(), password: fd.get('password') });
      button.disabled = false;
      if (error) {
        $('#error').textContent = 'That did not work. Check your email and password.';
        $('#error').hidden = false;
      } else if (goNext) {
        location.href = goNext;
      }
    });
    return;
  }

  const name = user.user_metadata?.name || '';
  $('#account').innerHTML = `
    <div class="card">
      <p>Logged in as <strong>${esc(name || user.email)}</strong>${name ? ` <span class="muted small">(${esc(user.email)})</span>` : ''}</p>
      <form id="name" class="inline">
        <input name="name" value="${esc(name)}" placeholder="Your name, e.g. Niels" aria-label="Your name" autocomplete="given-name">
        <button class="btn">Save name</button>
      </form>
      <p class="muted small" id="name-status">Your name is used in the apps, e.g. as the cook of new recipes.</p>
      <button class="link small" id="logout">Log out</button>
    </div>`;
  $('#name').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = new FormData(e.target).get('name').trim();
    const { error } = await supabase.auth.updateUser({ data: { name: value } });
    $('#name-status').textContent = error ? 'Could not save your name.' : 'Saved.';
  });
  $('#logout').addEventListener('click', () => supabase.auth.signOut());
}

supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user ?? null;
  if (event === 'INITIAL_SESSION' && user && goNext) { location.replace(goNext); return; }
  renderAccount(user);
  renderApps(user);
});
