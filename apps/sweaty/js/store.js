// All saving and loading goes through this file.
//
// Everything is kept in Supabase (the same project and login as the other apps), in two tables
// from schema.sql:
//   sweaty_settings  one row per person: body, goal, race, week rhythm, equipment, own foods …
//   sweaty_log       one row per thing on a day: a run, a workout, a food, your weight,
//                    a change to the plan, a skipped session.
// Every row belongs to the person who is logged in, and only they can see or change it.
//
// A change shows right away and is saved in the background. Without a connection it waits on
// this phone ("not saved yet") and is sent as soon as the connection is back.
//
// Add ?local to the address (…/apps/sweaty/?local) to try Sweaty without logging in:
// then everything is kept in this browser only.

import { config } from '../config.js';
import { local, uuid, today, addDays } from './util.js';

export const isLocal = new URLSearchParams(location.search).has('local');

const FOOD_DAYS = 120; // food from the last 120 days is loaded at the start; older days when you open them
const PAGE = 1000;     // Supabase sends at most 1000 rows at a time

let client = null;
let userId = null;
let settings = null;
const rows = new Map();     // id → { id, day, kind, data }
let byDay = null;           // day → [rows], made when needed
let outbox = [];            // changes not saved online yet
let flushing = false;
let problem = '';           // why saving doesn't work right now, in plain words
let foodFrom = null;        // food rows are loaded from this day on
const foodDays = new Set(); // older days whose food was loaded later
const listeners = new Set();

async function sb() {
  if (!client) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
    client = createClient(config.supabaseUrl, config.supabasePublishableKey);
  }
  return client;
}

// A failed request → what went wrong, in plain words.
function explain(error, doing) {
  const code = error?.code;
  if (code === 'PGRST205' || code === '42P01') {
    return new Error('Sweaty’s tables don’t exist yet: run apps/sweaty/schema.sql in Supabase → SQL Editor.');
  }
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST303') return new Error(`Couldn’t ${doing}. Are you still logged in?`);
  if (!code) return new Error(`Couldn’t ${doing}: no connection.`);
  return new Error(`Couldn’t ${doing}: ${error.message}`);
}

function notify() {
  byDay = null;
  for (const fn of listeners) fn();
}
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------- Login ----------
// The same login as nielsvanderdonk.nl/apps: logging in there logs you in here.

export async function user() {
  if (isLocal) return { id: 'local', email: '' };
  const c = await sb();
  const { data } = await c.auth.getSession();
  return data.session?.user ?? null;
}

// Calls fn() after logging in or out (e.g. on the apps page in another tab).
export async function onLoginChange(fn) {
  if (isLocal) return;
  const c = await sb();
  let was = null;
  c.auth.onAuthStateChange((_event, session) => {
    const now = session?.user?.id ?? '';
    if (was !== null && now !== was) setTimeout(fn); // not inside the callback: Supabase advises against it
    was = now;
  });
}

export async function logOut() {
  if (!isLocal) await (await sb()).auth.signOut();
}

// ---------- Loading ----------

const outboxKey = () => `sweaty.outbox.${userId}`;
const LOCAL_SETTINGS = 'sweaty.local.settings';
const LOCAL_ROWS = 'sweaty.local.rows';

async function fetchPaged(makeQuery, doing) {
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const res = await makeQuery().range(from, from + PAGE - 1);
    if (res.error) throw explain(res.error, doing);
    out.push(...res.data);
    if (res.data.length < PAGE) return out;
  }
}

async function fetchAllOnline() {
  const c = await sb();
  const since = addDays(today(), -FOOD_DAYS);
  const [s, list] = await Promise.all([
    c.from('sweaty_settings').select('data').eq('user_id', userId).maybeSingle(),
    fetchPaged(() => c.from('sweaty_log').select('id,day,kind,data')
      .or(`kind.neq.food,day.gte.${since}`).order('day').order('id'), 'load your log'),
  ]);
  if (s.error) throw explain(s.error, 'load your settings');
  return { settings: s.data?.data ?? null, list, since };
}

// Changes that aren't online yet still show: put them on top of what was loaded.
function replayOutbox() {
  for (const op of outbox) {
    if (op.t === 'settings') settings = op.data;
    else if (op.t === 'put') rows.set(op.row.id, op.row);
    else if (op.t === 'del') rows.delete(op.id);
  }
}

export async function load() {
  const u = await user();
  userId = u?.id ?? null;
  rows.clear();
  foodDays.clear();
  if (isLocal) {
    settings = local.get(LOCAL_SETTINGS, null);
    for (const r of local.get(LOCAL_ROWS, [])) rows.set(r.id, r);
    notify();
    return;
  }
  outbox = local.get(outboxKey(), []);
  const got = await fetchAllOnline();
  settings = got.settings;
  for (const r of got.list) rows.set(r.id, r);
  foodFrom = got.since;
  replayOutbox();
  notify();
  flush();
}

// Back in the app (e.g. after logging something on the laptop): load again.
// → true if anything changed. Waits while changes from this phone are still being sent.
export async function reload() {
  if (isLocal) return false;
  await flush();
  if (outbox.length) return false;
  const before = snapshot();
  const got = await fetchAllOnline();
  const keepOld = [...rows.values()].filter((r) => r.kind === 'food' && r.day < got.since);
  settings = got.settings;
  rows.clear();
  for (const r of [...keepOld, ...got.list]) rows.set(r.id, r);
  foodFrom = got.since;
  replayOutbox();
  const changed = snapshot() !== before;
  if (changed) notify();
  return changed;
}

function snapshot() {
  return JSON.stringify([settings, [...rows.values()].sort((a, b) => (a.id < b.id ? -1 : 1))]);
}

// Food from long ago isn't loaded at the start. Opening such a day loads it.
export async function ensureFoodDay(day) {
  if (isLocal || !foodFrom || day >= foodFrom || foodDays.has(day)) return;
  const c = await sb();
  const res = await c.from('sweaty_log').select('id,day,kind,data').eq('kind', 'food').eq('day', day);
  if (res.error) throw explain(res.error, 'load that day');
  foodDays.add(day);
  for (const r of res.data) if (!rows.has(r.id)) rows.set(r.id, r);
  replayOutbox();
  notify();
}

// ---------- Reading ----------

export const getSettings = () => settings;

// Uses settings without saving them (older settings with newer parts filled in).
export function adopt(next) { settings = next; }

export function all(kind) {
  const out = [];
  for (const r of rows.values()) if (!kind || r.kind === kind) out.push(r);
  return out;
}

export function onDay(day, kind) {
  if (!byDay) {
    byDay = new Map();
    for (const r of rows.values()) {
      if (!byDay.has(r.day)) byDay.set(r.day, []);
      byDay.get(r.day).push(r);
    }
  }
  const list = byDay.get(day) || [];
  return kind ? list.filter((r) => r.kind === kind) : list;
}

export const get = (id) => rows.get(id) || null;

// ---------- Saving ----------

export function saveSettings(next) {
  settings = next;
  if (isLocal) local.set(LOCAL_SETTINGS, next);
  else queue({ t: 'settings', data: next });
  notify();
}

// Adds or replaces a row: { id?, day, kind, data } → the saved row (with its id).
export function put(row) {
  const r = { id: row.id || uuid(), day: row.day, kind: row.kind, data: row.data || {} };
  rows.set(r.id, r);
  if (isLocal) local.set(LOCAL_ROWS, [...rows.values()]);
  else queue({ t: 'put', row: r });
  notify();
  return r;
}

export function remove(id) {
  rows.delete(id);
  if (isLocal) local.set(LOCAL_ROWS, [...rows.values()]);
  else queue({ t: 'del', id });
  notify();
}

const opId = (op) => (op.t === 'settings' ? 'settings' : op.row?.id ?? op.id);

function queue(op) {
  // Only the newest version of the same thing needs sending.
  outbox = outbox.filter((o) => opId(o) !== opId(op));
  outbox.push(op);
  local.set(outboxKey(), outbox);
  flush();
}

async function flush() {
  if (isLocal || flushing || !outbox.length || !userId) return;
  flushing = true;
  try {
    const c = await sb();
    while (outbox.length) {
      const op = outbox[0];
      const at = new Date().toISOString();
      let res;
      if (op.t === 'settings') res = await c.from('sweaty_settings').upsert({ user_id: userId, data: op.data, updated_at: at });
      else if (op.t === 'put') res = await c.from('sweaty_log').upsert({ ...op.row, user_id: userId, updated_at: at });
      else res = await c.from('sweaty_log').delete().eq('id', op.id);
      if (res.error) {
        problem = explain(res.error, 'save your changes').message;
        break;
      }
      problem = '';
      outbox = outbox.filter((o) => o !== op); // (a newer version of it may have been queued meanwhile)
      local.set(outboxKey(), outbox);
    }
  } catch {
    problem = 'Couldn’t save your changes: no connection.';
  } finally {
    flushing = false;
    for (const fn of listeners) fn();
  }
}

export const retry = () => flush();
export const syncState = () => ({ pending: outbox.length, problem: outbox.length ? problem : '' });

// Throws away the changes that couldn't be saved (Me → Data, when something is stuck).
export function discardUnsaved() {
  outbox = [];
  local.set(outboxKey(), outbox);
  problem = '';
  return reload();
}

// Try again every half minute, and as soon as the phone is back online.
setInterval(() => { if (outbox.length) flush(); }, 30000);
window.addEventListener('online', () => flush());

// ---------- Pictures ----------

// A photo from your phone → the address of the saved (smaller) picture.
// In local mode it's kept inside the settings as a data address instead.
export async function uploadPhoto(file) {
  const { resizeImage, blobToDataUrl } = await import('./image.js');
  if (isLocal) return blobToDataUrl(await resizeImage(file, 700, 0.8));
  const blob = await resizeImage(file, 1200, 0.82);
  const c = await sb();
  const bucket = c.storage.from(config.imageBucket || 'recipe-images');
  const path = `sweaty/${userId}/${uuid()}.jpg`;
  const { error } = await bucket.upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error(`Couldn’t upload the picture: ${error.message || 'no connection'}.`);
  return bucket.getPublicUrl(path).data.publicUrl;
}

// ---------- Backup ----------

export async function everything() {
  if (isLocal) return { settings, log: [...rows.values()] };
  const c = await sb();
  const list = await fetchPaged(() => c.from('sweaty_log').select('id,day,kind,data').order('day').order('id'), 'load everything');
  return { settings, log: list };
}

// Puts back rows from a backup file (rows with the same id are replaced).
export async function restore(backup) {
  const list = (backup.log || []).filter((r) => r && r.id && r.day && r.kind)
    .map((r) => ({ id: r.id, day: r.day, kind: r.kind, data: r.data || {} }));
  if (isLocal) {
    for (const r of list) rows.set(r.id, r);
    local.set(LOCAL_ROWS, [...rows.values()]);
    if (backup.settings) { settings = backup.settings; local.set(LOCAL_SETTINGS, settings); }
    notify();
    return list.length;
  }
  const c = await sb();
  for (let i = 0; i < list.length; i += 500) {
    const chunk = list.slice(i, i + 500).map((r) => ({ ...r, user_id: userId }));
    const res = await c.from('sweaty_log').upsert(chunk);
    if (res.error) throw explain(res.error, 'restore the backup');
  }
  if (backup.settings) {
    const res = await c.from('sweaty_settings').upsert({ user_id: userId, data: backup.settings, updated_at: new Date().toISOString() });
    if (res.error) throw explain(res.error, 'restore the settings');
  }
  await load();
  return list.length;
}
