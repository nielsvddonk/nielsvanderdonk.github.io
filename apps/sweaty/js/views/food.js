// Food for one day: what you ate, what the day allows (and why), and your weight.

import * as store from '../store.js';
import * as model from '../model.js';
import * as cal from '../calories.js';
import * as nav from '../nav.js';
import { addDays, dayName, daysBetween, esc, fmt, fmtDate, fmtKg, fmtShort, num, today } from '../util.js';
import { ICON, bar, toast } from './parts.js';
import { amountSheet, foodFromEntry, manualSheet } from './food-add.js';

function weightChart(list, goal) {
  const pts = list.slice(-60);
  if (pts.length < 2) return '';
  const span = Math.max(1, daysBetween(pts[0].day, pts[pts.length - 1].day));
  const vals = pts.map((r) => r.data.kg);
  const lo = Math.min(...vals, goal || Infinity) - 0.5;
  const hi = Math.max(...vals, goal || -Infinity) + 0.5;
  const W = 300;
  const H = 90;
  const x = (day) => ((daysBetween(pts[0].day, day) / span) * W).toFixed(1);
  const y = (v) => (H - ((v - lo) / (hi - lo)) * H).toFixed(1);
  const path = pts.map((r, i) => `${i ? 'L' : 'M'}${x(r.day)},${y(r.data.kg)}`).join('');
  // The 7-day average: the line that matters.
  const avg = pts.map((r) => {
    const near = pts.filter((o) => o.day <= r.day && o.day > addDays(r.day, -7));
    return [r.day, near.reduce((a, o) => a + o.data.kg, 0) / near.length];
  });
  const avgPath = avg.map(([day, v], i) => `${i ? 'L' : 'M'}${x(day)},${y(v)}`).join('');
  return `
    <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Your weight since ${esc(fmtShort(pts[0].day))}">
      ${goal ? `<line x1="0" x2="${W}" y1="${y(goal)}" y2="${y(goal)}" class="spark-goal" vector-effect="non-scaling-stroke"/>` : ''}
      <path d="${path}" class="spark-day" vector-effect="non-scaling-stroke"/>
      <path d="${avgPath}" class="spark-avg" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="spark-axis muted small"><span>${esc(fmtShort(pts[0].day))}</span>${goal ? `<span>dashed: goal ${fmtKg(goal)} kg</span>` : ''}<span>${esc(fmtShort(pts[pts.length - 1].day))}</span></div>`;
}

export default async function foodView(el, { date }) {
  await store.ensureFoodDay(date);
  const t = today();

  function explain(b, s) {
    const row = (label, value) => `<tr><td>${label}</td><td>${value}</td></tr>`;
    const activity = cal.ACTIVITY.find(([v]) => v === Number(s.body.activity))?.[1].toLowerCase() || 'your day';
    const rate = Number(s.goal.rate) || 0.5;
    const losing = Number(s.goal.weight) && b.kg > Number(s.goal.weight);
    return `
      <details class="explain">
        <summary>How is ${fmt(b.total)} worked out?</summary>
        <table class="calc">
          ${row(`Your body: ${fmt(b.bmr)} at rest, ${esc(activity)}`, fmt(b.daily))}
          ${b.run ? row(`Running ${fmt(b.runKm, 1)} km${b.runPlanned ? ' (planned)' : ''}`, `+${fmt(b.run)}`) : ''}
          ${b.lift ? row(`Strength ${fmt(b.liftMin)} min${b.liftPlanned ? ' (planned)' : ''}`, `+${fmt(b.lift)}`) : ''}
          ${b.extra ? row('Core and mobility', `+${fmt(b.extra)}`) : ''}
          ${b.goal ? row(`Goal: ${b.goal < 0 ? 'lose' : 'gain'} ${fmt(b.goal < 0 ? rate : Math.min(rate, 0.5), 2)} kg a week`, `${b.goal < 0 ? '−' : '+'}${fmt(Math.abs(b.goal))}`) : ''}
          ${!b.goal && losing && b.fuelDay ? row('Long run or race: no deficit today, fuel up', '0') : ''}
          ${b.minimum >= 5 ? row('Safety minimum: never below 110% of your resting burn', `+${fmt(b.minimum)}`) : ''}
          <tr class="calc-total"><td>${esc(date === t ? 'Today' : dayName(date))}</td><td>${fmt(b.total)} kcal</td></tr>
        </table>
        <p class="muted small">Based on ${fmtKg(Math.round(b.kg * 10) / 10)} kg (your 7-day average). Planned training counts until the day is over; skipped training doesn't.</p>
      </details>`;
  }

  function weightCard(s) {
    const list = model.weights();
    const mine = list.find((r) => r.day === date);
    const avg = model.weightOn(date);
    const goal = Number(s.goal.weight) || null;
    const weeks = avg ? cal.weeksToGoal(s, avg) : null;
    let eta = '';
    if (goal && weeks === 0) eta = 'You’re at your goal weight. Nice.';
    else if (goal && weeks) {
      const when = fmtDate(addDays(t, Math.round(weeks * 7)), { day: 'numeric', month: 'long' });
      eta = `${fmtKg(Math.round(Math.abs(avg - goal) * 10) / 10)} kg to go: about ${fmt(Math.ceil(weeks))} weeks at your pace (around ${esc(when)}).`;
    }
    return `
      <section class="card">
        <div class="card-top"><span class="kicker">Weight${date === t ? ' today' : ` on ${esc(fmtShort(date))}`}</span>${goal ? `<span class="muted small">goal ${fmtKg(goal)} kg</span>` : ''}</div>
        <form class="inline" id="weight">
          <span class="with-unit"><input name="kg" inputmode="decimal" value="${mine ? String(mine.data.kg) : ''}" placeholder="${avg ? fmtKg(Math.round(avg * 10) / 10) : '80'}" aria-label="Weight in kg"><span>kg</span></span>
          <button class="btn">Save</button>
        </form>
        ${avg ? `<p class="muted small">7-day average ${fmtKg(Math.round(avg * 10) / 10)} kg. ${eta}</p>` : '<p class="muted small">Weigh yourself in the morning, a few times a week. Sweaty uses the 7-day average, so one heavy day doesn’t matter.</p>'}
        ${weightChart(list.filter((r) => r.day <= date || date === t), goal)}
      </section>`;
  }

  function draw() {
    const s = model.settings();
    const b = model.budget(date);
    const e = model.eaten(date);
    const list = model.foods(date);
    const usual = model.usualFoods(8);
    const left = b.total - e.kcal;
    el.innerHTML = `
      ${location.hash.startsWith('#/food/') ? nav.backLink('#/food') : ''}
      <header class="page-head">
        <a class="arrow" href="#/food/${addDays(date, -1)}" data-replace aria-label="Previous day">${ICON.left}</a>
        <div class="page-title">
          <p class="kicker">Food</p>
          <h1>${esc(dayName(date))}</h1>
        </div>
        <a class="arrow" href="#/food/${addDays(date, 1)}" data-replace aria-label="Next day">${ICON.right}</a>
      </header>
      <section class="kcal">
        <p class="kcal-main"><b>${fmt(e.kcal)}</b> <span class="muted">of ${fmt(b.total)} kcal</span></p>
        ${bar(e.kcal, b.total, 'bar-big')}
        <p class="kcal-left">${left >= 0 ? `${fmt(left)} kcal left` : `<span class="over">${fmt(-left)} kcal over</span>`}${b.fuelDay ? ' · long run day: eat up' : ''}</p>
        <div class="protein"><span class="small">Protein ${fmt(e.p)} of ${fmt(b.protein)} g</span>${bar(e.p, b.protein, 'bar-thin bar-protein')}</div>
        ${explain(b, s)}
      </section>
      <a class="btn btn-primary btn-wide btn-tall" href="#/food/${date}/add">${ICON.plus} Add food</a>
      ${usual.length ? `<div class="chips quick" aria-label="Add again">${usual.map((u, j) => `<button type="button" class="chip" data-quick="${j}">${esc(u.data.name)} <span class="muted">${fmt(u.data.kcal)}</span></button>`).join('')}</div>` : ''}
      ${list.length ? `<ul class="entries">${list.map((r) => `
        <li><button type="button" class="entry" data-entry="${r.id}">
          <span class="row-text"><span class="row-title">${esc(r.data.name)}</span><span class="row-meta">${esc(r.data.amount || '')}${r.data.p ? `${r.data.amount ? ' · ' : ''}${fmt(r.data.p, 1)} g protein` : ''}</span></span>
          <span class="entry-kcal">${fmt(r.data.kcal)}</span>
        </button></li>`).join('')}</ul>` : '<p class="muted empty">Nothing logged yet.</p>'}
      ${weightCard(s)}`;

    el.querySelector('#weight').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const kg = num(ev.target.kg.value);
      const existing = model.weights().find((r) => r.day === date);
      if (kg == null) {
        if (existing) { store.remove(existing.id); toast('Weight removed'); draw(); }
        return;
      }
      if (kg < 30 || kg > 300) { toast('That doesn’t look like a weight in kg'); return; }
      store.put({ id: existing?.id, day: date, kind: 'weight', data: { kg, at: Date.now() } });
      toast('Weight saved');
      draw();
    });
  }

  el.addEventListener('click', (ev) => {
    const quick = ev.target.closest('[data-quick]');
    if (quick) {
      const u = model.usualFoods(8)[Number(quick.dataset.quick)];
      if (!u) return;
      const row = store.put({ day: date, kind: 'food', data: { ...u.data, at: Date.now() } });
      toast(`Added ${u.data.name} · ${fmt(u.data.kcal)} kcal`, { action: 'Undo', onAction: () => { store.remove(row.id); draw(); } });
      draw();
      return;
    }
    const entry = ev.target.closest('[data-entry]');
    if (!entry) return;
    const row = store.get(entry.dataset.entry);
    if (!row) return;
    const remove = () => {
      store.remove(row.id);
      toast(`Removed ${row.data.name}`, { action: 'Undo', onAction: () => { store.put(row); draw(); } });
      draw();
    };
    const update = (data) => { store.put({ ...row, data: { ...row.data, ...data, at: row.data.at } }); draw(); };
    const food = foodFromEntry(row.data);
    if (food) {
      amountSheet(food, {
        initial: row.data.by === 'grams' ? { grams: row.data.g } : { count: row.data.count ?? 1 },
        saveLabel: 'Save', onSave: update, onDelete: remove,
      });
    } else {
      manualSheet({ initial: row.data, saveLabel: 'Save', onSave: update, onDelete: remove });
    }
  });

  draw();
  return { refresh: draw };
}
