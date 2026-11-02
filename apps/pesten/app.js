// Pesten Score — who's winning at pesten. Everyone can look; only the two of
// you (logged in on nielsvanderdonk.nl/apps) can change the score.
//
// Every win is one row in the Supabase table "pesten_games" (schema.sql):
// + adds a row for that player, − removes their most recent one. The score is
// the number of rows per player, and it updates live on every open screen.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm';
import { config } from './config.js';
import { createBoard } from './view.js';

const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
const games = () => supabase.from('pesten_games');
const { players } = config;

const state = {
  wins: Object.fromEntries(players.map((p) => [p.id, 0])),
  last: null, // { winner, at } of the most recent game
  canEdit: false,
  error: '', // loading failed
  flash: '', // a short message, e.g. a save that failed
};
let version = 0; // bumped on every change here, so a slower fetch can't undo it
let saving = 0;

const update = createBoard(document.getElementById('board'), players, { onWin: addWin, onUndo: takeBack });
const lastEl = document.getElementById('last');
const authLink = document.getElementById('auth-link');

// "today at 21:14", "yesterday at 09:05", "on Sat 1 Nov at 21:14"
function when(iso) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `today at ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `yesterday at ${time}`;
  const date = d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
  return `on ${date} at ${time}`;
}

function lastGame() {
  if (!state.last) return 'No games played yet.';
  const winner = players.find((p) => p.id === state.last.winner)?.name ?? state.last.winner;
  return `Last game played ${when(state.last.at)}, with ${winner} winning.`;
}

function draw() {
  update(state);
  const problem = state.flash || state.error;
  lastEl.textContent = problem || lastGame();
  lastEl.classList.toggle('error', Boolean(problem));
  authLink.textContent = state.canEdit ? 'Apps' : 'Log in';
  authLink.href = state.canEdit ? '../' : `../?next=${encodeURIComponent(location.pathname)}`;
}

let flashTimer;
function flash(message) {
  state.flash = message;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { state.flash = ''; draw(); }, 4000);
  draw();
}

// The wins per player and the most recent game, from the database.
async function load() {
  const v = version;
  // (Not count-only "head" requests: those hide a missing table.)
  const [latest, ...counts] = await Promise.all([
    games().select('winner, created_at').order('id', { ascending: false }).limit(1),
    ...players.map((p) => games().select('id', { count: 'exact' }).eq('winner', p.id).limit(1)),
  ]);
  const failed = [latest, ...counts].find((r) => r.error);
  if (failed) {
    state.error = failed.status === 404 || failed.error.code === 'PGRST205'
      ? 'The score table doesn’t exist yet: run apps/pesten/schema.sql in Supabase → SQL Editor.'
      : 'Couldn’t load the score. Check your connection.';
    draw();
    return;
  }
  if (v !== version || saving) return;
  players.forEach((p, i) => { state.wins[p.id] = counts[i].count ?? 0; });
  const row = latest.data[0];
  state.last = row ? { winner: row.winner, at: row.created_at } : null;
  state.error = '';
  draw();
}

let timer;
const loadSoon = () => { clearTimeout(timer); timer = setTimeout(load, 200); };

// Shown right away; saved in the background; then checked against the database.
async function change(id, delta, save) {
  state.wins[id] += delta;
  if (delta > 0) state.last = { winner: id, at: new Date().toISOString() };
  version++;
  saving++;
  draw();
  const { error } = await save();
  saving--;
  version++;
  if (error) flash(delta > 0 ? 'Couldn’t save that win. Try again.' : 'Couldn’t take that back. Try again.');
  loadSoon();
}

function addWin(id) {
  if (!state.canEdit) return;
  change(id, +1, () => games().insert({ winner: id }));
}

function takeBack(id) {
  if (!state.canEdit || !state.wins[id]) return;
  change(id, -1, async () => {
    const { data, error } = await games().select('id').eq('winner', id).order('id', { ascending: false }).limit(1);
    if (error || !data.length) return { error };
    return games().delete().eq('id', data[0].id);
  });
}

// One login for all apps: the same session as the apps page.
supabase.auth.onAuthStateChange((_event, session) => {
  state.canEdit = Boolean(session);
  draw();
});

// Live: a win added on the other phone shows up here too.
supabase
  .channel('pesten-games')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pesten_games' }, loadSoon)
  .subscribe((status) => { if (status === 'SUBSCRIBED') loadSoon(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadSoon(); });

draw();
load();
