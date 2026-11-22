// One day: the run, the strength session and the optional short routine planned for it,
// what's done, and your food so far. "Today" is this page for today.

import * as store from '../store.js';
import * as model from '../model.js';
import * as plan from '../plan.js';
import * as strength from '../strength.js';
import { routines, sessions } from '../../data/sessions.js';
import { DAY_SHORT, addDays, dayName, esc, fmt, fmtDate, fmtKm, fmtPace, fmtTime, local, num, sum, today, weekday } from '../util.js';
import { ICON, bar, mark, sheet, toast } from './parts.js';

export const FEEL = ['', 'easy', 'good', 'hard', 'very hard'];
const progressKey = (date, key) => `sweaty.workout.${date}.${key}`;

// "Intervals · 9 km" / "Full body A" / "Rest"
export function summary(d) {
  const bits = [];
  if (d.run) bits.push(`${d.run.title} ${fmtKm(d.run.km)} km`);
  if (d.lift) bits.push(d.lift.name);
  return bits.join(' + ') || 'Rest';
}

// Saves your own version of a day; the same as the plan → the change is removed.
function saveChange(date, change) {
  const s = model.settings();
  const base = plan.day(s, date, null, model.weekChangeRow(date)?.data);
  const clean = { ...change };
  if ('run' in clean && JSON.stringify(clean.run) === JSON.stringify(base.run)) delete clean.run;
  if ('lift' in clean && JSON.stringify(clean.lift) === JSON.stringify(base.lift)) delete clean.lift;
  const existing = model.changeRow(date);
  if (!Object.keys(clean).length) { if (existing) store.remove(existing.id); return; }
  store.put({ id: existing?.id, day: date, kind: 'plan', data: clean });
}

export default function dayView(el, { date }) {
  const t = today();
  const isToday = date === t;
  const here = (d) => (d === t ? '#/' : `#/day/${d}`);

  function head(s, w) {
    const sub = isToday || dayName(date) !== fmtDate(date) ? fmtDate(date) : '';
    let line;
    if (w.before) line = `Your plan starts on ${esc(fmtDate(s.run.start))}.`;
    else {
      line = `Week ${w.number}${w.total ? ` of ${w.total}` : ''} · ${plan.PHASES[w.phase]}${w.cutback ? ' · easy week' : ''}`;
    }
    return `
      <header class="page-head">
        <a class="arrow" href="${here(addDays(date, -1))}" aria-label="Previous day">${ICON.left}</a>
        <div class="page-title">
          ${sub ? `<p class="kicker">${esc(sub)}</p>` : ''}
          <h1>${esc(isToday ? 'Today' : dayName(date))}</h1>
          <p class="muted small"><a href="#/week/${date}">${line}</a></p>
        </div>
        <a class="arrow" href="${here(addDays(date, 1))}" aria-label="Next day">${ICON.right}</a>
      </header>`;
  }

  function runCard(d) {
    if (!d.run && !d.runs.length) return '';
    const st = d.status.run;
    const r = d.run;
    const done = d.runs.map((row) => {
      const x = row.data;
      const pace = x.sec && x.km ? ` · ${fmtPace(x.sec / x.km)}/km` : '';
      return `<li><a href="#/run/${date}/${row.id}">${ICON.check}<span><strong>${fmtKm(x.km)} km</strong>${x.sec ? ` in ${fmtTime(x.sec)}` : ''}${pace}${x.feel ? ` · felt ${FEEL[x.feel]}` : ''}</span></a></li>`;
    }).join('');
    return `
      <section class="card${st === 'done' ? ' is-done' : ''}">
        <div class="card-top"><span class="kicker">Run${r ? ` · ${esc(r.title)}` : ''}</span>${mark(st)}</div>
        ${r ? `<p class="big">${fmtKm(r.km)} km</p><p class="detail">${esc(r.detail)}</p>` : ''}
        ${done ? `<ul class="done-list">${done}</ul>` : ''}
        ${st === 'todo' || st === 'missed' ? `
          <div class="btn-row">
            <a class="btn btn-primary" href="#/run/${date}">Log run</a>
            <button class="btn" type="button" data-act="run-planned">Done as planned</button>
            <button class="btn btn-quiet" type="button" data-act="skip" data-item="run">Skip</button>
          </div>` : ''}
        ${st === 'skipped' ? `<p class="muted small">Skipped. <button class="link" type="button" data-act="unskip" data-item="run">Undo</button></p>` : ''}
        ${st === 'done' ? `<p class="small"><a href="#/run/${date}">+ Log another run</a></p>` : ''}
      </section>`;
  }

  function liftCard(s, d) {
    if (!d.lift && !d.liftDone.length) return '';
    const st = d.status.lift;
    const l = d.lift;
    const session = l ? strength.build(s, l.key, l.mod) : null;
    const going = l && local.get(progressKey(date, l.key));
    const done = d.liftDone.map((row) => {
      const x = row.data;
      return `<li>${ICON.check}<span><strong>${esc(x.name)}</strong>: ${x.items.length} exercises, ${sum(x.items, (i) => i.sets.length)} sets in ${x.min} min</span></li>`;
    }).join('');
    const note = l?.mod?.early ? 'Your first two weeks: 2 sets of everything, to get used to it.'
      : l?.mod?.deload ? 'Easy week: one set less, so you recover and come back stronger.' : '';
    return `
      <section class="card${st === 'done' ? ' is-done' : ''}">
        <div class="card-top"><span class="kicker">Strength${session ? ` · about ${session.minutes} min` : ''}${l?.optional ? ' · optional' : ''}</span>${mark(st)}</div>
        ${session ? `
          <h2>${esc(l.name)}</h2>
          <ol class="ex-list">${session.items.map((it) => `<li><a href="#/exercises/${encodeURIComponent(it.id)}">${esc(strength.find(s, it.id)?.name)}</a><span class="muted">${strength.dose(it)}</span></li>`).join('')}</ol>
          ${note ? `<p class="hint">${note}</p>` : ''}` : ''}
        ${done ? `<ul class="done-list">${done}</ul>` : ''}
        ${st === 'todo' || st === 'missed' ? `
          <div class="btn-row">
            <a class="btn btn-primary" href="#/workout/${date}/${l.key}">${going ? 'Continue' : 'Start'}</a>
            <button class="btn btn-quiet" type="button" data-act="skip" data-item="lift">Skip</button>
          </div>` : ''}
        ${st === 'skipped' ? `<p class="muted small">Skipped. <button class="link" type="button" data-act="unskip" data-item="lift">Undo</button></p>` : ''}
      </section>`;
  }

  function extraCard(s, d) {
    if (!d.extra && !d.extraDone.length) return '';
    const st = d.status.extra;
    const session = d.extra ? strength.build(s, d.extra) : null;
    const going = d.extra && local.get(progressKey(date, d.extra));
    const done = d.extraDone.map((row) => `<li>${ICON.check}<span><strong>${esc(row.data.name)}</strong> in ${row.data.min} min</span></li>`).join('');
    return `
      <section class="card card-quiet${st === 'done' ? ' is-done' : ''}">
        <div class="card-top"><span class="kicker">Optional${session ? ` · about ${session.minutes} min` : ''}</span>${st === 'done' ? mark('done') : ''}</div>
        ${routines[d.extra]?.when && st !== 'done' ? `<p class="muted small when">Best ${esc(routines[d.extra].when)}</p>` : ''}
        ${session ? `<h2>${esc(session.name)}</h2>
          <p class="muted small">${session.items.map((it) => `<a href="#/exercises/${encodeURIComponent(it.id)}">${esc(strength.find(s, it.id)?.name)}</a>`).join(' · ')}</p>` : ''}
        ${done ? `<ul class="done-list">${done}</ul>` : ''}
        ${session && st !== 'done' ? `<a class="btn" href="#/workout/${date}/${d.extra}">${going ? 'Continue' : 'Start'}</a>` : ''}
      </section>`;
  }

  function foodCard() {
    const b = model.budget(date);
    const e = model.eaten(date);
    const left = b.total - e.kcal;
    return `
      <section class="card">
        <a class="card-top card-link" href="#/food/${date}"><span class="kicker">Food</span><span class="muted small">${fmt(e.kcal)} of ${fmt(b.total)} kcal ${ICON.right}</span></a>
        ${bar(e.kcal, b.total)}
        <p class="muted small">${left >= 0 ? `${fmt(left)} kcal left` : `<span class="over">${fmt(-left)} kcal over</span>`} · protein ${fmt(e.p)} of ${fmt(b.protein)} g</p>
        <a class="btn btn-wide" href="#/food/${date}/add">${ICON.plus} Add food</a>
      </section>`;
  }

  function draw() {
    const s = model.settings();
    const d = model.day(date);
    const w = d.week;
    const rest = !w.before && !d.run && !d.lift && !d.runs.length && !d.liftDone.length;
    el.innerHTML = `
      ${head(s, w)}
      ${w.before ? `<section class="card card-quiet"><p>Nothing planned yet: your plan starts on <strong>${esc(fmtDate(s.run.start))}</strong>.</p><p><a href="#/week/${s.run.start}">See the first week ›</a></p></section>` : ''}
      ${rest ? `<p class="rest-day"><strong>Rest day.</strong> <span class="muted">Rest is when you get fitter and stronger. A walk is fine.</span></p>` : ''}
      ${runCard(d)}
      ${liftCard(s, d)}
      ${extraCard(s, d)}
      ${foodCard()}
      ${w.before ? '' : `
        <div class="day-actions">
          <button class="btn btn-quiet" type="button" data-act="change">Change this day${d.changed ? ' (changed)' : ''}</button>
          ${!d.run && !d.runs.length ? `<a class="btn btn-quiet" href="#/run/${date}">Log a run</a>` : ''}
        </div>`}`;
  }

  function openChange() {
    const s = model.settings();
    const d = model.day(date);
    const base = plan.day(s, date, null, model.weekChangeRow(date)?.data);
    const change = model.changeRow(date)?.data || {};
    const w = model.week(date);
    let runValue = 'none';
    if (d.run) runValue = !('run' in change) ? 'plan' : d.run.custom ? d.run.type : 'current';
    let liftValue = 'none';
    if (d.lift) liftValue = !('lift' in change) ? 'plan' : d.lift.key;
    const name = dayName(date);
    const dlg = sheet(`
      <h2>Change ${esc(['Today', 'Yesterday', 'Tomorrow'].includes(name) ? name.toLowerCase() : name)}</h2>
      <form id="change">
        <label class="field"><span class="label">Run</span>
          <select name="run">
            ${base.run ? `<option value="plan">As planned: ${esc(base.run.title)}, ${fmtKm(base.run.km)} km</option>` : ''}
            ${runValue === 'current' ? `<option value="current">Keep: ${esc(d.run.title)}, ${fmtKm(d.run.km)} km</option>` : ''}
            <option value="easy">Easy run</option>
            <option value="long">Long run</option>
            <option value="recovery">Recovery run</option>
            <option value="none">No run</option>
          </select>
        </label>
        <label class="field" data-km><span class="label">Distance</span>
          <span class="with-unit"><input name="km" inputmode="decimal" value="${d.run?.km ?? ''}" placeholder="8"><span>km</span></span>
        </label>
        <label class="field"><span class="label">Strength</span>
          <select name="lift">
            ${base.lift ? `<option value="plan">As planned: ${esc(base.lift.name)}</option>` : ''}
            ${Object.entries(sessions).map(([k, tpl]) => `<option value="${k}">${esc(tpl.name)}</option>`).join('')}
            <option value="none">No strength</option>
          </select>
        </label>
        <div class="btn-row">
          <button class="btn btn-primary">Save</button>
          ${d.changed ? '<button type="button" class="btn" data-reset>Back to the plan</button>' : ''}
          <button type="button" class="btn btn-quiet" data-close>Cancel</button>
        </div>
        <p class="label swap-label">Or swap this day with</p>
        <div class="swap-list">
          ${w.days.filter((x) => x.date !== date).map((x) => `<button type="button" class="swap" data-swap="${x.date}"><b>${DAY_SHORT[weekday(x.date)]}</b> ${esc(summary(x))}</button>`).join('')}
        </div>
      </form>`);
    const form = dlg.querySelector('form');
    form.run.value = runValue;
    form.lift.value = liftValue;
    const kmField = dlg.querySelector('[data-km]');
    const syncKm = () => { kmField.hidden = !['easy', 'long', 'recovery'].includes(form.run.value); };
    form.run.addEventListener('change', syncKm);
    syncKm();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const next = {};
      const rv = form.run.value;
      if (rv === 'current') next.run = d.run;
      else if (rv === 'none') next.run = null;
      else if (rv !== 'plan') next.run = plan.customRun(s, rv, num(form.km.value) || base.run?.km || 6);
      const lv = form.lift.value;
      if (lv === 'none') next.lift = null;
      else if (lv !== 'plan') next.lift = plan.liftFor(s, date, lv);
      saveChange(date, next);
      dlg.close();
      draw();
      toast('Day changed');
    });
    dlg.querySelector('[data-reset]')?.addEventListener('click', () => {
      const row = model.changeRow(date);
      if (row) store.remove(row.id);
      dlg.close();
      draw();
      toast('Back to the plan');
    });
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-swap]');
      if (!b) return;
      const other = b.dataset.swap;
      const a = model.day(date);
      const o = model.day(other);
      saveChange(date, { run: o.run, lift: o.lift });
      saveChange(other, { run: a.run, lift: a.lift });
      dlg.close();
      draw();
      toast(`Swapped with ${dayName(other)}`);
    });
  }

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'change') { openChange(); return; }
    if (act === 'run-planned') {
      const d = model.day(date);
      store.put({ day: date, kind: 'run', data: { km: d.run.km, sec: null, type: d.run.type, title: d.run.title, at: Date.now() } });
      toast('Run logged. Nice!');
    }
    if (act === 'skip') store.put({ day: date, kind: 'skip', data: { item: b.dataset.item, at: Date.now() } });
    if (act === 'unskip') {
      const row = model.day(date).skipRow(b.dataset.item);
      if (row) store.remove(row.id);
    }
    draw();
  });

  draw();
  return { refresh: draw };
}
