// A week of the plan, and the whole plan at a glance.

import * as store from '../store.js';
import * as model from '../model.js';
import * as plan from '../plan.js';
import { DAY_NAMES, DAY_SHORT, addDays, esc, fmt, fmtDate, fmtKm, fmtPace, fmtShort, fmtTime, mondayOf, parseDay, sum, today, weekday } from '../util.js';
import { ICON, mark, sheet, toast } from './parts.js';


// "3 runs and 3 strength sessions. Long run on Sunday. Rest on Saturday."
function rhythmSummary(days, longDay) {
  const runs = days.filter((d) => d.run).length;
  const lifts = days.filter((d) => d.lift).length;
  const rest = days.map((d, k) => (!d.run && !d.lift ? DAY_NAMES[k] : null)).filter(Boolean);
  const roles = plan.runRoles({ days, longDay });
  const long = Object.keys(roles).find((k) => roles[k] === 'long');
  return `${runs} ${runs === 1 ? 'run' : 'runs'} and ${lifts} strength ${lifts === 1 ? 'session' : 'sessions'}.`
    + (long !== undefined ? ` Long run on ${DAY_NAMES[long]}.` : '')
    + (rest.length ? ` Rest on ${rest.join(', ')}.` : ' No rest day.');
}

function paceLine(s) {
  const p = plan.runPaces(s);
  return `Your paces: easy ${fmtPace(p.easy[0])}–${fmtPace(p.easy[1])} · tempo ${fmtPace(p.tempo)} · intervals ${fmtPace(p.interval)} · race ${fmtPace(p.race)} per km`;
}

export function weekView(el, { date }) {
  const t = today();
  const monday = mondayOf(date || t);

  function line(title, state) {
    return `<span class="what-line"><span>${title}</span>${mark(state)}</span>`;
  }

  function dayRow(d) {
    const isToday = d.date === t;
    const lines = [];
    if (d.run) lines.push(line(`${esc(d.run.title)} · ${fmtKm(d.run.km)} km`, d.status.run));
    else if (d.runs.length) lines.push(line(`Run · ${fmtKm(sum(d.runs, (r) => r.data.km))} km`, 'done'));
    if (d.lift) lines.push(line(esc(d.lift.name) + (d.lift.optional ? ' (optional)' : ''), d.status.lift));
    else if (d.liftDone.length) lines.push(line(esc(d.liftDone[0].data.name), 'done'));
    if (!lines.length) lines.push(`<span class="what-line muted">Rest${d.extraDone.length ? ` · ${esc(d.extraDone[0].data.name)} ✓` : ''}</span>`);
    return `
      <li><a class="day-row${isToday ? ' is-today' : ''}${d.date < t ? ' is-past' : ''}" href="${isToday ? '#/' : `#/day/${d.date}`}">
        <span class="dow"><span>${DAY_SHORT[weekday(d.date)]}</span><b>${parseDay(d.date).getDate()}</b></span>
        <span class="what">${lines.join('')}</span>
        ${d.changed ? '<span class="tag">changed</span>' : ''}
      </a></li>`;
  }

  // Different days just for this week: a different rest day, an extra run, …
  function openWeekDays() {
    const s = model.settings();
    const w = model.week(monday);
    const row = model.weekChangeRow(monday);
    const rhythm = plan.rhythmOf(s, row?.data);
    const draft = rhythm.days.map((d) => ({ run: Boolean(d.run), lift: Boolean(d.lift) }));
    const dayChanges = w.dates.filter((d) => model.changeRow(d));
    const dlg = sheet(`
      <h2>Change week ${w.number}</h2>
      <p class="muted small">Only for ${esc(fmtShort(monday))} – ${esc(fmtShort(addDays(monday, 6)))}. Your usual week stays as it is (Me page).</p>
      <div class="rhythm">
        ${DAY_SHORT.map((d, k) => `
          <div class="rhythm-row"><span>${d}</span>
            <button type="button" class="tog${draft[k].run ? ' is-on' : ''}" data-day="${k}" data-what="run" aria-pressed="${draft[k].run}">Run</button>
            <button type="button" class="tog${draft[k].lift ? ' is-on' : ''}" data-day="${k}" data-what="lift" aria-pressed="${draft[k].lift}">Strength</button>
          </div>`).join('')}
      </div>
      <label class="field"><span class="label">Long run on</span>
        <select name="longDay">${DAY_NAMES.map((n, k) => `<option value="${k}"${k === Number(rhythm.longDay) ? ' selected' : ''}>${n}</option>`).join('')}</select>
      </label>
      <p class="summary" data-sum></p>
      ${dayChanges.length ? '<p class="hint">Days you changed one by one this week go back to the plan, so the week fits together again.</p>' : ''}
      <div class="btn-row">
        <button type="button" class="btn btn-primary" data-save>Save</button>
        ${row ? '<button type="button" class="btn" data-reset>Back to my usual week</button>' : ''}
        <button type="button" class="btn btn-quiet" data-close>Cancel</button>
      </div>`);
    const longSelect = dlg.querySelector('[name="longDay"]');
    const summarize = () => { dlg.querySelector('[data-sum]').textContent = rhythmSummary(draft, Number(longSelect.value)); };
    longSelect.addEventListener('change', summarize);
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-day]');
      if (!b) return;
      const k = Number(b.dataset.day);
      draft[k][b.dataset.what] = !draft[k][b.dataset.what];
      b.classList.toggle('is-on', draft[k][b.dataset.what]);
      b.setAttribute('aria-pressed', String(draft[k][b.dataset.what]));
      summarize();
    });
    summarize();
    const clearDayChanges = () => w.dates.forEach((d) => { const r = model.changeRow(d); if (r) store.remove(r.id); });
    dlg.querySelector('[data-save]').addEventListener('click', () => {
      const longDay = Number(longSelect.value);
      const usual = JSON.stringify(s.days.map((d) => ({ run: Boolean(d.run), lift: Boolean(d.lift) }))) === JSON.stringify(draft)
        && longDay === Number(s.run.longDay);
      clearDayChanges();
      if (usual) { if (row) store.remove(row.id); }
      else store.put({ id: row?.id, day: monday, kind: 'week', data: { days: draft, longDay } });
      dlg.close();
      draw();
      toast(usual ? 'Back to your usual week' : `Week ${w.number} changed`);
    });
    dlg.querySelector('[data-reset]')?.addEventListener('click', () => {
      clearDayChanges();
      store.remove(row.id);
      dlg.close();
      draw();
      toast('Back to your usual week');
    });
  }

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="week-days"]')) openWeekDays();
  });

  function draw() {
    const s = model.settings();
    const w = model.week(monday);
    const rhythm = plan.rhythmOf(s, model.weekChangeRow(monday)?.data);
    const fed = w.days.filter((d) => model.eaten(d.date).count > 0);
    const avgEaten = fed.length ? sum(fed, (d) => model.eaten(d.date).kcal) / fed.length : 0;
    const avgBudget = fed.length ? sum(fed, (d) => model.budget(d.date).total) / fed.length : 0;
    const info = w.before ? '' : w.cutback
      ? 'A lighter week: less running and one set less in the gym, so your body can catch up and get stronger.'
      : plan.PHASE_INFO[w.phase];
    el.innerHTML = `
      <header class="page-head">
        <a class="arrow" href="#/week/${addDays(monday, -7)}" aria-label="Previous week">${ICON.left}</a>
        <div class="page-title">
          <p class="kicker">${esc(fmtShort(monday))} – ${esc(fmtShort(addDays(monday, 6)))}</p>
          <h1>${w.before ? 'Before your plan' : `Week ${w.number}${w.total ? ` <span class="muted">of ${w.total}</span>` : ''}`}</h1>
          ${w.before ? '' : `<p class="muted small"><strong>${plan.PHASES[w.phase]}${w.cutback ? ' · easy week' : ''}</strong>${w.ownWeek ? ' · your own days' : ''}</p>`}
        </div>
        <a class="arrow" href="#/week/${addDays(monday, 7)}" aria-label="Next week">${ICON.right}</a>
      </header>
      ${info ? `<p class="phase-info">${esc(info)}</p>` : ''}
      <div class="stats">
        <div class="stat"><span class="label">Running</span><b>${fmtKm(w.kmDone)}</b><span class="muted small">of ${fmtKm(w.km)} km</span></div>
        <div class="stat"><span class="label">Strength</span><b>${w.liftsDone}</b><span class="muted small">of ${w.lifts}</span></div>
        <div class="stat"><span class="label">Food</span><b>${fed.length ? fmt(avgEaten) : '–'}</b><span class="muted small">${fed.length ? `a day, of ${fmt(avgBudget)}` : 'kcal a day'}</span></div>
      </div>
      <ul class="days">${w.days.map(dayRow).join('')}</ul>
      ${w.before ? '' : `
        <div class="week-actions">
          <p class="muted small">${esc(rhythmSummary(rhythm.days, rhythm.longDay))}</p>
          <button type="button" class="btn" data-act="week-days">${w.ownWeek ? 'Change this week again' : 'Change this week’s days'}</button>
        </div>`}
      ${monday !== mondayOf(t) ? `<p><a class="btn btn-quiet" href="#/week">Back to this week</a></p>` : ''}
      <p class="muted small">${esc(paceLine(s))}</p>
      <p><a class="btn" href="#/plan">The whole plan</a></p>`;
  }

  draw();
  return { refresh: draw };
}

export function planView(el) {
  const s = model.settings();
  const R = plan.raceOf(s);
  const p = plan.runPaces(s);
  const t = today();
  const current = plan.weekIndex(s, t);
  const raceWeek = s.run.raceDate ? plan.weekIndex(s, s.run.raceDate) : null;
  const last = raceWeek !== null && raceWeek >= 0 ? raceWeek : Math.max(current + 8, 11);
  const weeks = [];
  for (let i = 0; i <= last; i++) weeks.push(model.planWeek(addDays(s.run.start, 7 * i)));
  const maxKm = Math.max(1, ...weeks.map((w) => w.km));
  const left = raceWeek !== null ? Math.max(0, raceWeek - current) : null;
  const recent = `from your ${s.run.recentTime} ${({ 5: '5K', 10: '10K', 21.0975: 'half marathon', 42.195: 'marathon' })[s.run.recentKm] || 'race'}`;

  el.innerHTML = `
    <p class="back"><a href="#/week">‹ This week</a></p>
    <h1>${esc(s.run.raceName || R.name)}</h1>
    <p class="muted">${s.run.raceDate
      ? `${esc(fmtDate(s.run.raceDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}${left !== null && raceWeek >= current ? ` · ${left === 0 ? 'this week!' : `${left} weeks to go`}` : ''}`
      : 'No race date yet: pick one on the Me page and the plan builds up to it.'}</p>
    <div class="stats">
      <div class="stat"><span class="label">Predicted</span><b>${fmtTime(p.predicted)}</b><span class="muted small">${esc(recent)}</span></div>
      <div class="stat"><span class="label">Race pace</span><b>${fmtPace(p.race)}</b><span class="muted small">per km${s.run.goalTime ? `, for your goal of ${esc(s.run.goalTime)}` : ''}</span></div>
    </div>
    <p class="muted small">${esc(paceLine(s))}. Change your race time or goal on the Me page.</p>
    <ul class="weeks">
      <li class="weeks-head muted small"><span>Week</span><span></span><span>Long run</span><span>Total</span></li>
      ${weeks.map((w) => `
        <li><a class="week-row${w.index === current ? ' is-now' : ''}${w.cutback ? ' is-easy' : ''}" href="#/week/${w.monday}">
          <span class="wk"><b>${w.number}</b> <span class="muted small">${esc(fmtShort(w.monday))}</span></span>
          <span class="ph small">${plan.PHASES[w.phase]}${w.cutback ? ' · easy' : ''}</span>
          <span class="lr">${w.phase === 'race' ? 'Race' : `${fmtKm(w.longRun)} km`}</span>
          <span class="tot">${fmtKm(Math.round(w.km))} km<i class="km-bar" style="width:${((w.km / maxKm) * 100).toFixed(0)}%"></i></span>
        </a></li>`).join('')}
    </ul>`;
}
