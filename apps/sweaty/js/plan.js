// The plan: what to do on each day. None of it is stored — every week is worked out from
// your settings (Me page) and the numbers in data/running.js and data/sessions.js. Move the
// race date or change your run days and all weeks to come follow. A day you changed
// yourself ("Change this day") is saved as a change on top of the plan.

import { races, plan as P, rotation } from '../data/running.js';
import { sessions, splits } from '../data/sessions.js';
import { paces as calcPaces } from './paces.js';
import { addDays, clamp, daysBetween, fmtKm, fmtPace, fmtTime, mondayOf, parseTime, sum, weekday } from './util.js';

export const raceOf = (s) => races[s.run.race] || races.marathon;
export const PHASES = { base: 'Base', build: 'Build-up', peak: 'Peak', taper: 'Taper', race: 'Race week', recovery: 'Recovery' };
export const PHASE_INFO = {
  base: 'Building a base: steady running, the long run grows a little and then holds, and you get stronger in the gym.',
  build: 'The build-up to your race: the long run grows week by week, with some race pace in it.',
  peak: 'The hardest weeks: your longest runs and the most race pace. Sleep and eat well.',
  taper: 'Less running so you start the race fresh. It will feel too little — that’s the point.',
  race: 'Race week: short easy runs, no heavy leg work. Good luck!',
  recovery: 'After the race: easy running only, let your legs recover.',
};

// Week 0 is the week your plan started (Me → Running).
export const weekIndex = (s, date) => Math.floor(daysBetween(s.run.start, mondayOf(date)) / 7);
const raceIndex = (s) => (s.run.raceDate ? weekIndex(s, s.run.raceDate) : null);

// The phase of week i, and how many weeks before race week it is (wr).
export function phase(s, i) {
  const r = raceIndex(s);
  if (r === null) return { key: 'base', wr: null };
  const wr = r - i;
  const block = raceOf(s).block;
  if (wr < 0) return { key: wr >= -2 ? 'recovery' : 'base', wr };
  if (wr === 0) return { key: 'race', wr };
  if (wr <= 2) return { key: 'taper', wr };
  if (wr < block) return { key: wr <= Math.round(block / 3) + 2 ? 'peak' : 'build', wr };
  return { key: 'base', wr };
}

// Every 4th week is an easy week, counting back from the race (so the peak isn't one).
function isCutback(i, ph) {
  if (['race', 'taper', 'recovery'].includes(ph.key)) return false;
  if (ph.wr !== null && ph.wr > 0) return ph.wr % 4 === 0;
  return (i + 1) % 4 === 0;
}

// The long run of every week from the start up to week `upto` (km).
function longRuns(s, upto) {
  const R = raceOf(s);
  const start = clamp(Number(s.run.longRun) || 12, 5, R.peak);
  const hold = Math.max(R.hold, Math.min(start, R.peak - 6));
  const out = [];
  let last = start; // the last long run that wasn't an easy week
  let top = start;  // the longest of the build-up, for the taper
  for (let i = 0; i <= upto; i++) {
    const ph = phase(s, i);
    let km;
    if (ph.key === 'race') km = R.km;
    else if (ph.key === 'taper') km = top * (ph.wr === 2 ? P.taper[0] : P.taper[1]);
    else if (ph.key === 'recovery') km = hold * 0.5;
    else {
      const target = ph.key === 'base' ? hold : R.peak - ((ph.wr - 3) * (R.peak - hold)) / (R.block - 4);
      if (isCutback(i, ph)) km = last * P.cutback;
      else {
        km = target > last ? Math.min(target, last + P.maxStep) : target;
        if (i === 0) km = Math.min(km, start);
        last = km;
        if (ph.key === 'build' || ph.key === 'peak') top = Math.max(top, km);
      }
    }
    out.push(Math.round(km));
  }
  return out;
}

export function runPaces(s) {
  const R = raceOf(s);
  const recentKm = Number(s.run.recentKm) || 21.0975;
  const recentSec = parseTime(s.run.recentTime, { hoursFirst: recentKm >= 15 }) || 7200;
  const goal = parseTime(s.run.goalTime, { hoursFirst: true });
  return calcPaces(recentKm, recentSec, R.km, goal);
}
export const easyRange = (p) => `${fmtPace(p.easy[0])}–${fmtPace(p.easy[1])}/km`;

// The days of a week: your usual week (Me page), or this week's own days (Week → Change this week).
export const rhythmOf = (s, weekChange) => ({
  days: weekChange?.days?.length === 7 ? weekChange.days : s.days,
  longDay: weekChange?.longDay ?? s.run.longDay,
});

// Which run day does what: the long run on your long-run day, the hard run as far from it as
// possible, the rest easy (and with 4+ runs, the day after the long run is a recovery run).
export function runRoles({ days, longDay: day }) {
  const runDays = days.map((d, k) => (d.run ? k : -1)).filter((k) => k >= 0);
  const roles = {};
  if (!runDays.length) return roles;
  const longDay = Number(day);
  const long = runDays.includes(longDay) ? longDay : runDays[runDays.length - 1];
  roles[long] = 'long';
  const others = runDays.filter((k) => k !== long);
  if (!others.length) return roles;
  const gap = (k) => Math.min((k - long + 7) % 7, (long - k + 7) % 7);
  const quality = others.reduce((best, k) => (gap(k) > gap(best) ? k : best));
  for (const k of others) {
    if (k === quality && gap(k) >= 2) roles[k] = 'quality';
    else roles[k] = others.length >= 3 && (k - long + 7) % 7 === 1 ? 'recovery' : 'easy';
  }
  return roles;
}

// ---------- Runs ----------

function progress({ i, ph, cut, s }) {
  if (cut) return 0;
  if (ph.key === 'base') return Math.min(1, i / 12);
  if (ph.key === 'build' || ph.key === 'peak') return clamp(1 - (ph.wr - 3) / (raceOf(s).block - 4), 0, 1);
  return 1;
}

const WORKOUTS = {
  fartlek(t, p) {
    const n = 6 + Math.round(4 * t);
    const km = Math.round(4 + n * (60 / p.interval + 60 / p.easy[1]));
    return { title: 'Fartlek', km, detail: `2 km easy, then ${n} × 1 min fast (about ${fmtPace(p.interval)}/km) with 1 min easy jogging between, then 2 km easy.` };
  },
  intervals(t, p, { i }) {
    const long = i % 2 === 1;
    const n = long ? 4 + Math.round(2 * t) : 5 + Math.round(3 * t);
    const km = Math.round(4 + n * (long ? 1 : 0.8) + (n - 1) * 0.3);
    return { title: 'Intervals', km, detail: `2 km easy, then ${n} × ${long ? '1 km' : '800 m'} at ${fmtPace(p.interval)}/km with 2 min easy jogging between, then 2 km easy.` };
  },
  tempo(t, p) {
    const min = 15 + 5 * Math.round(3 * t);
    const km = Math.round(4 + (min * 60) / p.tempo);
    return { title: 'Tempo run', km, detail: `2 km easy, then ${min} min at tempo pace (${fmtPace(p.tempo)}/km): comfortably hard, you could still say a few words. Then 2 km easy.` };
  },
  racepace(t, p, { ph, s }) {
    const max = raceOf(s).racePaceMax;
    const n = ph.key === 'taper' ? Math.min(6, max) : Math.min(max, 5 + Math.round((max - 5) * t));
    return { title: 'Race pace run', km: n + 3, detail: `2 km easy, then ${n} km at race pace (${fmtPace(p.race)}/km), then 1 km easy.` };
  },
  tuneup(t, p) {
    return { title: 'Short tempo', km: 7, detail: `2 km easy, then 3 × 1 km at tempo pace (${fmtPace(p.tempo)}/km) with 2 min easy jogging between, then 2 km easy.` };
  },
};

function qualityRun(ctx) {
  const { i, ph, cut } = ctx;
  let kind;
  if (cut) kind = 'fartlek';
  else if (ph.key === 'taper') kind = ph.wr === 2 ? 'racepace' : 'tuneup';
  else {
    const list = rotation[ph.key] || rotation.base;
    kind = list[(ph.key === 'base' ? i : ph.wr) % list.length];
  }
  return { type: 'quality', workout: kind, ...WORKOUTS[kind](progress(ctx), ctx.p, ctx) };
}

function makeRun(ctx, role, easyNumber) {
  const { L, ph, cut, p } = ctx;
  if (role === 'quality' && ph.key !== 'recovery') return qualityRun(ctx);
  if (role === 'long') {
    if (['build', 'peak'].includes(ph.key) && !cut && ph.wr % 2 === 1 && L >= 16) {
      const n = clamp(Math.round(L * 0.2), 3, 8);
      return { type: 'long', title: 'Long run', km: L, detail: `${L} km easy, with the last ${n} km at race pace (${fmtPace(p.race)}/km).` };
    }
    return { type: 'long', title: 'Long run', km: L, detail: `${L} km at easy pace (${easyRange(p)}). Slow is fine: time on your feet is the point.` };
  }
  if (role === 'recovery') {
    const km = clamp(Math.round(L * 0.25), P.recoveryKm[0], P.recoveryKm[1]);
    return { type: 'recovery', title: 'Recovery run', km, detail: `${km} km very easy, slower than ${fmtPace(p.easy[1])}/km.` };
  }
  const share = P.easy[Math.min(easyNumber, P.easy.length - 1)];
  const km = clamp(Math.round(L * share), P.easyKm[0], P.easyKm[1]);
  const strides = easyNumber === 0 && !['taper', 'recovery'].includes(ph.key);
  return { type: 'easy', title: 'Easy run', km, detail: `${km} km at easy pace (${easyRange(p)})${strides ? ', then 6 × 20 s strides: fast but relaxed, walk back between them' : ''}.` };
}

function raceWeekRun(ctx, date, role) {
  const { s, p } = ctx;
  const R = raceOf(s);
  const raceDay = s.run.raceDate;
  if (date === raceDay) {
    return { type: 'race', title: s.run.raceName || R.name, km: R.km, detail: `Race day! Run the first 5 km a little slower than race pace (${fmtPace(p.race)}/km), then settle in. Your goal: ${fmtTime(p.raceSec)}.` };
  }
  if (date > raceDay || !role) return null;
  const left = daysBetween(date, raceDay);
  if (left === 1) return { type: 'easy', title: 'Shake-out run', km: 3, detail: '3 km very easy, with 3 short strides at the end. Then put your feet up.' };
  if (left >= 4) return { type: 'easy', title: 'Easy run', km: 6, detail: `6 km easy, with 2 km in the middle at race pace (${fmtPace(p.race)}/km).` };
  return { type: 'easy', title: 'Easy run', km: 5, detail: `5 km at easy pace (${easyRange(p)}).` };
}

// A run you set yourself in "Change this day".
export function customRun(s, type, km) {
  const p = runPaces(s);
  const k = Math.max(1, Math.round(km * 10) / 10);
  if (type === 'long') return { type, title: 'Long run', km: k, detail: `${fmtKm(k)} km at easy pace (${easyRange(p)}).`, custom: true };
  if (type === 'recovery') return { type, title: 'Recovery run', km: k, detail: `${fmtKm(k)} km very easy, slower than ${fmtPace(p.easy[1])}/km.`, custom: true };
  return { type: 'easy', title: 'Easy run', km: k, detail: `${fmtKm(k)} km at easy pace (${easyRange(p)}).`, custom: true };
}

// ---------- Strength days ----------

const legsOf = (key) => sessions[key]?.legs ?? 0;

function* permutations(list) {
  if (list.length <= 1) { yield list; return; }
  for (let j = 0; j < list.length; j++) {
    const rest = [...list.slice(0, j), ...list.slice(j + 1)];
    for (const p of permutations(rest)) yield [list[j], ...p];
  }
}

// Puts the leg-heavy sessions on the days where they hurt your running least:
// not the day before (or of) the long run or the hard run, and not two leg days in a row.
function bestOrder(list, days, roles) {
  const penalty = (k) => {
    const next = roles[(k + 1) % 7];
    const same = roles[k];
    const prev = roles[(k + 6) % 7];
    return (next === 'long' ? 3 : next === 'quality' ? 2 : 0) + (same === 'long' ? 3 : same === 'quality' ? 1 : 0) + (prev === 'long' ? 1 : 0);
  };
  const cost = (order) => {
    let c = 0;
    order.forEach((key, j) => { c += legsOf(key) * penalty(days[j]); });
    if (days.length > 1) {
      for (let j = 0; j < days.length; j++) {
        const n = (j + 1) % days.length;
        if ((days[j] + 1) % 7 === days[n] && legsOf(order[j]) >= 2 && legsOf(order[n]) >= 2) c += 2;
      }
    }
    return c;
  };
  let best = list;
  let bestCost = cost(list);
  for (const order of permutations(list)) {
    const c = cost(order);
    if (c < bestCost) { best = order; bestCost = c; }
  }
  return best;
}

const orderCache = new Map();
function liftDays(rhythm, roles, i) {
  const days = rhythm.days.map((d, k) => (d.lift ? k : -1)).filter((k) => k >= 0);
  if (!days.length) return {};
  let list = (splits[days.length] || splits[7]).slice(0, days.length);
  if (days.length === 1) list = [splits[1][i % splits[1].length]];
  const key = JSON.stringify([list, days, roles]);
  if (!orderCache.has(key)) orderCache.set(key, bestOrder(list, days, roles));
  const order = orderCache.get(key);
  return Object.fromEntries(days.map((k, j) => [k, order[j]]));
}

function liftInfo(key, { i, ph, cut }) {
  const t = sessions[key];
  if (!t) return null;
  return { key, name: t.name, legs: t.legs, mod: { early: i < 2, deload: cut || ['taper', 'recovery', 'race'].includes(ph.key) } };
}

// The strength session for a day when you pick one yourself in "Change this day".
export function liftFor(s, date, key) {
  const i = Math.max(0, weekIndex(s, date));
  const ph = phase(s, i);
  return liftInfo(key, { i, ph, cut: isCutback(i, ph) });
}

// The optional short routine: running drills before a hard run, core after an easy run,
// mobility on rest days and after the long run.
export function extraFor(day) {
  if (day.lift) return null;
  const t = day.run?.type;
  if (t === 'race') return null;
  if (!t || t === 'long') return 'mobility';
  if (t === 'easy' || t === 'recovery') return 'core';
  if (t === 'quality') return 'drills';
  return null;
}

// ---------- Weeks and days ----------

export function week(s, date, weekChange = null) {
  const monday = mondayOf(date);
  const i = weekIndex(s, monday);
  const dates = Array.from({ length: 7 }, (_, k) => addDays(monday, k));
  const r = raceIndex(s);
  const head = { index: i, number: i + 1, monday, dates, total: r !== null && r >= i ? r + 1 : null };
  if (i < 0) {
    return { ...head, before: true, phase: null, wr: null, cutback: false, longRun: 0, km: 0, days: dates.map((d) => ({ date: d, run: null, lift: null, extra: null })) };
  }
  const ph = phase(s, i);
  const cut = isCutback(i, ph);
  const L = longRuns(s, i)[i];
  const p = runPaces(s);
  const rhythm = rhythmOf(s, weekChange);
  const roles = runRoles(rhythm);
  const lifts = liftDays(rhythm, roles, i);
  const ctx = { s, i, ph, cut, L, p };
  let easyNumber = 0;
  const days = dates.map((d, k) => {
    let run = null;
    if (ph.key === 'race') run = raceWeekRun(ctx, d, roles[k]);
    else if (roles[k]) run = makeRun(ctx, roles[k], roles[k] === 'easy' ? easyNumber++ : 0);
    let lift = lifts[k] ? liftInfo(lifts[k], ctx) : null;
    if (lift && ph.key === 'race') lift = lift.legs >= 2 ? null : { ...lift, optional: true };
    const day = { date: d, run, lift };
    day.extra = extraFor(day);
    return day;
  });
  return { ...head, phase: ph.key, wr: ph.wr, cutback: cut, longRun: L, days, km: sum(days, (d) => d.run?.km), ownWeek: Boolean(weekChange?.days) };
}

// One day, with your own change for that day (if any) on top.
export function day(s, date, change, weekChange = null) {
  const w = week(s, date, weekChange);
  const d = { ...w.days[weekday(date)], week: w, changed: false };
  if (change && !w.before) {
    if ('run' in change) d.run = change.run;
    if ('lift' in change) d.lift = change.lift;
    d.changed = true;
    d.extra = extraFor(d);
  }
  return d;
}

// The Monday a new plan starts: this week, or next week from Friday on.
export function startMonday(day) {
  return weekday(day) >= 4 ? addDays(mondayOf(day), 7) : mondayOf(day);
}
