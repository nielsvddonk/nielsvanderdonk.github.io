// Strength sessions: which exercises, how many sets and reps, and what to do next time.

import { exercises, REST, WEIGHTED } from '../data/exercises.js';
import { sessions, routines } from '../data/sessions.js';
import { fmtKg } from './util.js';

// The library: the exercises from data/exercises.js with your own changes on top
// (Exercises → Edit: explanation, notes, video, picture, hidden), plus your own exercises.
const libraries = new WeakMap();
const builtIn = { list: exercises, byId: new Map(exercises.map((e) => [e.id, e])) };
function lib(s) {
  if (!s) return builtIn;
  let l = libraries.get(s);
  if (!l) {
    const edits = s.exerciseEdits || {};
    const list = [...exercises, ...(s.myExercises || []).map((e) => ({ ...e, mine: true }))]
      .map((e) => (edits[e.id] ? { ...e, ...edits[e.id], original: e } : e));
    l = { list, byId: new Map(list.map((e) => [e.id, e])) };
    libraries.set(s, l);
  }
  return l;
}
export const library = (s) => lib(s).list;
export const find = (s, id) => (id ? lib(s).byId.get(id) || null : null);
export const owned = (s) => new Set(s?.lift?.gear || []);
export const canDo = (ex, gear) => ex.gear.every((g) => gear.has(g));
// Can it be put in a workout: you have the gear, and you didn't hide it.
export const usable = (ex, gear) => !ex.hidden && canDo(ex, gear);
export const isWeighted = (ex) => Boolean(ex) && ex.gear.some((g) => WEIGHTED.includes(g));
export const template = (key) => sessions[key] || routines[key] || null;
export const isRoutine = (key) => Boolean(routines[key]);

// Every exercise of a pattern you have the gear for (and didn't hide), in the order of the library.
export function options(s, pattern) {
  const gear = owned(s);
  return library(s).filter((e) => e.pattern === pattern && usable(e, gear));
}

const range = (spec) => {
  const [a, b] = String(spec).split('-').map(Number);
  return [a || 8, b || a || 12];
};

// How many exercises fit in a session of 30, 45 or 60 minutes.
const LIMIT = { 30: 4, 45: 6, 60: 8 };

// A session ready to do: { key, name, routine, minutes, items: [{ slot, id, sets, target, … }] }.
// mod.early (first two weeks): at most 2 sets. mod.deload (easy weeks): one set less.
export function build(s, key, mod = {}) {
  const tpl = template(key);
  if (!tpl) return null;
  const routine = isRoutine(key);
  const limit = routine ? Infinity : LIMIT[s.lift?.minutes] || 6;
  const gear = owned(s);
  const used = new Set();
  const items = [];
  tpl.slots.forEach(([spec, sets, reps], n) => {
    if (items.length >= limit) return;
    const slot = `${key}.${n}`;
    let ex = find(s, s.swaps?.[slot]);
    if (ex && (!usable(ex, gear) || used.has(ex.id))) ex = null;
    if (!ex) {
      let pattern = null;
      let pick = 0;
      if (routine) {
        const planned = find(s, spec);
        if (planned && usable(planned, gear) && !used.has(planned.id)) ex = planned;
        else pattern = planned?.pattern;
      } else {
        const [p, v] = spec.split(':');
        pattern = p;
        pick = Number(v) || 0;
      }
      if (!ex && pattern) {
        const pool = options(s, pattern).filter((e) => !used.has(e.id));
        if (pool.length) ex = pool[pick % pool.length];
      }
    }
    if (!ex) return;
    used.add(ex.id);
    let count = sets;
    if (mod.early) count = Math.min(count, 2);
    if (mod.deload) count = Math.max(1, count - 1);
    const repRange = range(reps || '8-12');
    items.push({
      slot, id: ex.id, sets: count, reps: repRange,
      target: ex.time ? ex.time.slice() : repRange,
      time: Boolean(ex.time), side: Boolean(ex.side), rest: REST[ex.pattern] ?? 60,
    });
  });
  return { key, name: tpl.name, routine, items, minutes: estimate(items, routine) };
}

// Roughly how long it takes, in minutes (rounded to 5).
export function estimate(items, routine = false) {
  let sec = routine ? 0 : 300; // warm-up
  for (const it of items) {
    const work = it.time ? it.target[1] : 40;
    sec += it.sets * (work * (it.side ? 2 : 1) + (routine ? 15 : it.rest));
  }
  return Math.max(5, Math.round(sec / 300) * 5);
}

export function stepFor(s, ex) {
  const step = s.lift?.step || {};
  if (ex.gear.includes('barbell')) return Number(step.barbell) || 2.5;
  if (ex.gear.includes('kettlebell')) return Number(step.kettlebell) || 4;
  return Number(step.dumbbell) || 2;
}

// What to do this time, from last time ("double progression"): when every set reached the top of
// the rep range, go heavier (or to the harder version); otherwise the same, and beat it by a rep.
export function advice(s, ex, item, last) {
  const weighted = isWeighted(ex);
  if (!last || !last.sets?.length) {
    if (weighted) return { text: 'First time: pick a weight you could lift 2–3 more times than the top of the range.' };
    if (item.time) return { text: 'First time: hold it with good form, and stop when it gets shaky.' };
    return { text: 'First time: stop each set when you have 1–2 good reps left.' };
  }
  const [lo, hi] = item.target;
  const val = (st) => Number(item.time ? st.s : st.r) || 0;
  const done = last.sets.map(val);
  const allTop = last.sets.length >= item.sets && done.every((v) => v >= hi);
  const missed = done.filter((v) => v < lo).length;
  const said = `Last time: ${done.join(', ')}${item.time ? ' s' : ''}`;
  if (weighted) {
    const w = Math.max(0, ...last.sets.map((st) => Number(st.w) || 0));
    const step = stepFor(s, ex);
    if (!w) return { text: `${said}.` };
    if (allTop) return { text: `${said} at ${fmtKg(w)} kg, all at the top. Go up to ${fmtKg(w + step)} kg.`, weight: w + step, up: true };
    if (missed >= 2 && w > step) return { text: `${said} at ${fmtKg(w)} kg: too heavy. Try ${fmtKg(w - step)} kg.`, weight: w - step };
    return { text: `${said} at ${fmtKg(w)} kg. Same weight, try to beat it by a rep.`, weight: w };
  }
  if (allTop) {
    const harder = find(s, ex.harder);
    if (harder && usable(harder, owned(s))) return { text: `${said}, all at the top. Ready for the harder version?`, harder: harder.id };
    return { text: `${said}, all at the top. ${item.time ? 'Hold a bit longer' : 'Lower more slowly (3 seconds)'} to make it harder.` };
  }
  return { text: `${said}. Try to beat it.` };
}

// The sets of an exercise, filled in from last time so you only have to tick them off.
export function prefill(item, ex, last, adv) {
  const weighted = isWeighted(ex);
  return Array.from({ length: item.sets }, (_, j) => {
    const prev = last?.sets?.[j] || last?.sets?.[last.sets.length - 1] || null;
    const set = { done: false };
    if (item.time) set.s = prev?.s || item.target[0];
    else if (!prev || adv?.up) set.r = item.target[0];
    else set.r = Math.min(item.target[1], Math.max(item.target[0], Number(prev.r) || item.target[0]));
    if (weighted) set.w = adv?.weight ?? prev?.w ?? '';
    return set;
  });
}

// "3 × 8–12" or "2 × 30–45 s each side"
export function dose(item) {
  const [lo, hi] = item.target;
  const what = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return `${item.sets} × ${what}${item.time ? ' s' : ''}${item.side ? ' each side' : ''}`;
}
