// Puts the pieces together for the pages: the plan for a day with your own changes on top,
// what you logged that day, what's done, your weight, and the calories.

import * as store from './store.js';
import * as plan from './plan.js';
import * as strength from './strength.js';
import * as cal from './calories.js';
import { addDays, sum, today } from './util.js';

export const settings = () => store.getSettings();

const byTime = (a, b) => (a.data.at || 0) - (b.data.at || 0);

export const changeRow = (date) => store.onDay(date, 'plan')[0] || null;

// Everything about one day.
export function day(date) {
  const s = settings();
  const d = plan.day(s, date, changeRow(date)?.data);
  const runs = store.onDay(date, 'run').sort(byTime);
  const workouts = store.onDay(date, 'workout').sort(byTime);
  const skips = store.onDay(date, 'skip');
  const skipRow = (item) => skips.find((r) => r.data.item === item) || null;
  const liftDone = workouts.filter((w) => !w.data.routine);
  const extraDone = workouts.filter((w) => w.data.routine);
  const t = today();
  const state = (planned, done, item) => {
    if (done) return 'done';
    if (!planned) return null;
    if (skipRow(item)) return 'skipped';
    return date < t ? 'missed' : 'todo';
  };
  return {
    ...d, runs, workouts, liftDone, extraDone, skipRow,
    status: {
      run: state(d.run, runs.length > 0, 'run'),
      lift: state(d.lift, liftDone.length > 0, 'lift'),
      extra: state(d.extra, extraDone.length > 0, 'extra'),
    },
  };
}

export function week(date) {
  const w = plan.week(settings(), date);
  const days = w.dates.map((d) => day(d));
  return {
    ...w,
    days,
    km: sum(days, (d) => d.run?.km),
    kmDone: sum(days, (d) => sum(d.runs, (r) => r.data.km)),
    lifts: days.filter((d) => d.lift).length,
    liftsDone: days.filter((d) => d.liftDone.length).length,
  };
}

// ---------- Weight ----------

export const weights = () => store.all('weight').sort((a, b) => (a.day < b.day ? -1 : 1));

// Your weight on a day: the average of the last 7 days (one weigh-in jumps around too much).
export function weightOn(date) {
  const list = weights().filter((r) => r.day <= date);
  if (!list.length) return Number(settings()?.body?.weight) || null;
  const recent = list.filter((r) => r.day > addDays(date, -7));
  const use = recent.length ? recent : [list[list.length - 1]];
  return sum(use, (r) => r.data.kg) / use.length;
}

// ---------- Food and calories ----------

export const foods = (date) => store.onDay(date, 'food').sort(byTime);

export function eaten(date) {
  const list = foods(date);
  return { kcal: sum(list, (r) => r.data.kcal), p: sum(list, (r) => r.data.p), count: list.length };
}

// The calorie budget of a day. Training counts when it's done — or, for today and later,
// when it's still planned (so you know in the morning what the day will need).
export function budget(date) {
  const s = settings();
  const kg = weightOn(date) || 80;
  const d = day(date);
  const later = date >= today();
  const runPlanned = !d.runs.length && d.status.run === 'todo' && later;
  const runKm = runPlanned ? d.run.km : sum(d.runs, (r) => r.data.km);
  const liftPlanned = !d.liftDone.length && d.status.lift === 'todo' && later;
  const liftMin = liftPlanned ? strength.build(s, d.lift.key, d.lift.mod)?.minutes || 45 : sum(d.liftDone, (w) => w.data.min);
  const extraMin = sum(d.extraDone, (w) => w.data.min);
  const fuelDay = ['long', 'race'].includes(d.run?.type) || d.runs.some((r) => ['long', 'race'].includes(r.data.type)) || d.week.phase === 'race';
  return { ...cal.budget(s, kg, { runKm, liftMin, extraMin, fuelDay }), kg, runKm, liftMin, runPlanned, liftPlanned };
}

// Foods you ate often in the last 30 days, for one-tap adding: [{ name, amount, kcal, p, …, times }]
export function usualFoods(limit = 8) {
  const from = addDays(today(), -30);
  const groups = new Map();
  for (const r of store.all('food')) {
    if (r.day < from) continue;
    const key = `${r.data.name}|${r.data.amount || ''}|${Math.round(r.data.kcal)}`;
    const g = groups.get(key) || { data: r.data, times: 0, last: 0 };
    g.times += 1;
    g.last = Math.max(g.last, r.data.at || 0);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.times - a.times || b.last - a.last).slice(0, limit);
}

// Recently logged foods, newest first, each food once.
export function recentFoods(limit = 15) {
  const seen = new Set();
  const out = [];
  const list = store.all('food').sort((a, b) => (b.data.at || 0) - (a.data.at || 0));
  for (const r of list) {
    const key = `${r.data.name}|${r.data.amount || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r.data);
    if (out.length >= limit) break;
  }
  return out;
}

// How often each food (by key) was logged in the last 60 days, to put your usual foods first.
export function foodFreq() {
  const from = addDays(today(), -60);
  const m = new Map();
  for (const r of store.all('food')) if (r.day >= from && r.data.ref) m.set(r.data.ref, (m.get(r.data.ref) || 0) + 1);
  return m;
}

// ---------- Strength history ----------

// Every time you did an exercise before `before` (a day), newest first: [{ day, sets }]
export function history(exId, before = '9999-12-31') {
  const out = [];
  for (const w of store.all('workout')) {
    if (w.day >= before) continue;
    const item = (w.data.items || []).find((i) => i.id === exId);
    if (item?.sets?.length) out.push({ day: w.day, at: w.data.at || 0, sets: item.sets, name: w.data.name });
  }
  return out.sort((a, b) => (a.day === b.day ? b.at - a.at : a.day < b.day ? 1 : -1));
}
export const lastTime = (exId, before) => history(exId, before)[0] || null;
