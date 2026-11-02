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

const state = { wins: Object.fromEntries(players.map((p) => [p.id, 0])), canEdit: false };
let version = 0; // bumped on every change here, so a slower fetch can't undo it
let saving = 0;

const update = createBoard(document.getElementById('board'), players, { onWin: addWin, onUndo: takeBack });
const gamesEl = document.getElementById('games');
const authLink = document.getElementById('auth-link');
const notice = document.getElementById('notice');

function draw() {
  update(state);
  const total = Object.values(state.wins).reduce((a, b) => a + b, 0);
  gamesEl.textContent = `${total} ${total === 1 ? 'game' : 'games'}`;
  authLink.textContent = state.canEdit ? 'Apps' : 'Log in';
  authLink.href = state.canEdit ? '../' : `../?next=${encodeURIComponent(location.pathname)}`;
}

function say(message, isError = false) {
  notice.textContent = message;
  notice.hidden = !message;
  notice.classList.toggle('error', isError);
}

// Counts the wins per player in the database.
async function load() {
  const v = version;
  // (Not a count-only "head" request: those hide a missing table.)
  const results = await Promise.all(players.map((p) =>
    games().select('id', { count: 'exact' }).eq('winner', p.id).limit(1)));
  const failed = results.find((r) => r.error);
  if (failed) {
    say(failed.status === 404 || failed.error.code === 'PGRST205'
      ? 'The score table doesn’t exist yet: run apps/pesten/schema.sql in Supabase → SQL Editor.'
      : 'Couldn’t load the score. Check your connection.', true);
    return;
  }
  if (v !== version || saving) return;
  players.forEach((p, i) => { state.wins[p.id] = results[i].count ?? 0; });
  say('');
  draw();
}

let timer;
const loadSoon = () => { clearTimeout(timer); timer = setTimeout(load, 200); };

// Shown right away; saved in the background; then checked against the database.
async function change(id, delta, save) {
  state.wins[id] += delta;
  version++;
  saving++;
  draw();
  const { error } = await save();
  saving--;
  version++;
  if (error) say(delta > 0 ? 'Couldn’t save that win. Try again.' : 'Couldn’t take that back. Try again.', true);
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
