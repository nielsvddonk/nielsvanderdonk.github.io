// The Me page: everything about you that the plan and the calories are worked out from.
// Every change is saved right away. The same form, with a Start button, is the first-time setup.

import * as store from '../store.js';
import * as model from '../model.js';
import * as plan from '../plan.js';
import * as cal from '../calories.js';
import { GEAR } from '../../data/exercises.js';
import { splits, sessions } from '../../data/sessions.js';
import { defaults } from '../defaults.js';
import { DAY_NAMES, DAY_SHORT, addDays, esc, fmt, fmtDate, fmtKg, fmtPace, fmtTime, mondayOf, num, parseTime, today } from '../util.js';
import { seg, toast, wireSegs } from './parts.js';
import { foodForm } from './food-add.js';

const RECENT = [[5, '5K'], [10, '10K'], [21.0975, 'Half marathon'], [42.195, 'Marathon']];

const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys[keys.length - 1]] = value;
}

const input = (path, value, { type = 'num', unit = '', placeholder = '', mode = 'decimal' } = {}) => {
  const el = `<input data-path="${path}" data-type="${type}" ${type === 'date' ? 'type="date"' : `inputmode="${type === 'text' || type === 'time' ? 'text' : mode}"`} value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" autocomplete="off">`;
  return unit ? `<span class="with-unit">${el}<span>${unit}</span></span>` : el;
};
const select = (path, value, options) =>
  `<select data-path="${path}" data-type="selectnum">${options.map(([v, label]) => `<option value="${v}"${String(v) === String(value) ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
const field = (label, html, hint = '') => `<label class="field"><span class="label">${label}</span>${html}${hint ? `<span class="hint">${hint}</span>` : ''}</label>`;
const group = (label, html, hint = '') => `<div class="field"><span class="label">${label}</span>${html}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;

// ---------- Summaries (they update as you change things) ----------

function goalSummary(s, kg) {
  if (!kg || !s.body.sex || !s.body.age || !s.body.height) return 'Fill in the parts above and Sweaty works out your daily calories.';
  const rest = cal.budget(s, kg).total;
  const run = cal.budget(s, kg, { runKm: 10 }).total;
  const protein = cal.budget(s, kg).protein;
  const goal = Number(s.goal.weight);
  let line = `About <strong>${fmt(rest)} kcal</strong> on a rest day and <strong>${fmt(run)}</strong> on a 10 km run day, with ${fmt(protein)} g protein.`;
  const weeks = cal.weeksToGoal(s, kg);
  if (goal && weeks) {
    const when = fmtDate(addDays(today(), Math.round(weeks * 7)), { month: 'long', year: 'numeric' });
    line += ` From ${fmtKg(Math.round(kg * 10) / 10)} to ${fmtKg(goal)} kg takes about ${fmt(Math.ceil(weeks))} weeks (${esc(when)}).`;
  } else if (goal && weeks === 0) line += ' You’re at your goal: these keep you there.';
  if (goal && kg < goal) line += ' Gaining goes at most 0.5 kg a week, to keep it muscle.';
  return line;
}

function runSummary(s) {
  const p = plan.runPaces(s);
  const R = plan.raceOf(s);
  const recentSec = parseTime(s.run.recentTime, { hoursFirst: Number(s.run.recentKm) >= 15 });
  if (!recentSec) return 'Fill in the time of a recent race (like 2:00:00) to get your paces.';
  let line = `Predicted ${R.name.toLowerCase()}: <strong>${fmtTime(p.predicted)}</strong> when fully trained. Paces: easy ${fmtPace(p.easy[0])}–${fmtPace(p.easy[1])}, tempo ${fmtPace(p.tempo)}, intervals ${fmtPace(p.interval)}, race ${fmtPace(p.race)} per km.`;
  if (s.run.raceDate) {
    const weeks = plan.weekIndex(s, s.run.raceDate) - plan.weekIndex(s, today());
    if (weeks >= 0 && weeks < 10) line += ` <span class="over">Only ${weeks} weeks to the race: the build-up will be short.</span>`;
  }
  return line;
}

function weekSummary(s) {
  const runs = s.days.filter((d) => d.run).length;
  const lifts = s.days.filter((d) => d.lift).length;
  const roles = plan.runRoles(s);
  const parts = [`${runs} ${runs === 1 ? 'run' : 'runs'} and ${lifts} strength ${lifts === 1 ? 'session' : 'sessions'} a week.`];
  if (runs) {
    const names = { long: 'long run', quality: 'hard run', easy: 'easy', recovery: 'recovery' };
    parts.push(Object.entries(roles).sort(([a], [b]) => a - b).map(([k, r]) => `${DAY_SHORT[k]} ${names[r]}`).join(', ') + '.');
  }
  if (lifts) {
    const list = lifts === 1 ? splits[1] : (splits[lifts] || splits[7]).slice(0, lifts);
    const names = [...new Set(list.map((k) => sessions[k].name))];
    parts.push(lifts === 1 ? `Strength: ${names.join(', ')}, taking turns week by week.` : `Strength: ${names.join(', ')}.`);
  }
  if (runs < 3 && plan.raceOf(s).km > 40) parts.push('<span class="over">For a marathon, 3 or more runs a week is much better.</span>');
  if (runs + lifts > 0 && s.days.every((d) => d.run || d.lift)) parts.push('No rest day: try to keep at least one.');
  return parts.join(' ');
}

// ---------- The form ----------

function formHtml(s, { setup }) {
  const kg = model.weightOn(today());
  const gearOn = new Set(s.lift.gear);
  return `
    <section class="card form-card">
      <h2>You</h2>
      ${group('Sex', seg('body.sex', s.body.sex, [['male', 'Man'], ['female', 'Woman']]), 'For the calorie formula only.')}
      <div class="row2">
        ${field('Age', input('body.age', s.body.age, { type: 'int', placeholder: '34', mode: 'numeric' }))}
        ${field('Height', input('body.height', s.body.height, { type: 'int', unit: 'cm', placeholder: '185', mode: 'numeric' }))}
      </div>
      ${setup ? field('Weight', input('body.weight', s.body.weight, { unit: 'kg', placeholder: '90' }))
        : `<p class="muted small">Weight: ${kg ? `${fmtKg(Math.round(kg * 10) / 10)} kg (7-day average)` : 'not logged yet'}. <a href="#/food">Log it on the Food page</a>.</p>`}
      ${field('Your day, without training', select('body.activity', s.body.activity, cal.ACTIVITY))}
    </section>

    <section class="card form-card">
      <h2>Goal</h2>
      ${field('Goal weight', input('goal.weight', s.goal.weight, { unit: 'kg', placeholder: '85' }))}
      ${group('How fast', seg('goal.rate', s.goal.rate, cal.RATES.map((r) => [r, `${fmt(r, 2)} kg/week`])), 'Slower is easier to keep up, and better for your running and muscle.')}
      <p class="summary" data-summary="goal"></p>
    </section>

    <section class="card form-card">
      <h2>Running</h2>
      ${group('Training for', seg('run.race', s.run.race, [['marathon', 'Marathon'], ['half', 'Half marathon']]))}
      <div class="row2">
        ${field('Race date', input('run.raceDate', s.run.raceDate, { type: 'date' }))}
        ${field('Race name', input('run.raceName', s.run.raceName, { type: 'text', placeholder: 'optional' }))}
      </div>
      <p class="hint">Move the date any time: the plan builds up to it. Leave it empty to just keep fit.</p>
      <div class="row2">
        ${field('A recent race', select('run.recentKm', s.run.recentKm, RECENT))}
        ${field('Its time', input('run.recentTime', s.run.recentTime, { type: 'time', placeholder: '2:00:00' }))}
      </div>
      <div class="row2">
        ${field('Goal time', input('run.goalTime', s.run.goalTime, { type: 'time', placeholder: 'optional, 4:15:00' }))}
        ${field('Long run now', input('run.longRun', s.run.longRun, { unit: 'km', placeholder: '14' }))}
      </div>
      <p class="summary" data-summary="run"></p>
      ${setup ? '' : `<p class="muted small">Your plan started on ${esc(fmtDate(s.run.start, { day: 'numeric', month: 'long', year: 'numeric' }))}. <button type="button" class="link" data-act="restart">Start it again from this week</button></p>`}
    </section>

    <section class="card form-card">
      <h2>Your week</h2>
      <p class="muted small">Tap what you want to do on each day. Sweaty decides which run is long, hard or easy, and which strength session goes where.</p>
      <div class="rhythm">
        ${DAY_SHORT.map((d, k) => `
          <div class="rhythm-row"><span>${d}</span>
            <button type="button" class="tog${s.days[k].run ? ' is-on' : ''}" data-day="${k}" data-what="run" aria-pressed="${Boolean(s.days[k].run)}">Run</button>
            <button type="button" class="tog${s.days[k].lift ? ' is-on' : ''}" data-day="${k}" data-what="lift" aria-pressed="${Boolean(s.days[k].lift)}">Strength</button>
          </div>`).join('')}
      </div>
      ${field('Long run on', select('run.longDay', s.run.longDay, DAY_NAMES.map((n, k) => [k, n])))}
      <p class="summary" data-summary="week"></p>
    </section>

    <section class="card form-card">
      <h2>Strength</h2>
      ${group('A session takes about', seg('lift.minutes', s.lift.minutes, [[30, '30 min'], [45, '45 min'], [60, '60 min']]))}
      ${group('Equipment at home', `<div class="chips">${GEAR.map(([k, label]) => `<button type="button" class="chip${gearOn.has(k) ? ' is-on' : ''}" data-gear="${k}" aria-pressed="${gearOn.has(k)}">${esc(label)}</button>`).join('')}</div>`, 'The floor and your own body always count.')}
      <div class="row2">
        ${field('Dumbbells go up by', input('lift.step.dumbbell', s.lift.step.dumbbell, { unit: 'kg', placeholder: '2' }))}
        ${field('Barbell goes up by', input('lift.step.barbell', s.lift.step.barbell, { unit: 'kg', placeholder: '2.5' }))}
      </div>
      <p class="hint">The smallest step your weights allow: Sweaty adds this when you're ready for more.</p>
      ${setup ? '' : `<p class="small"><a href="#/library">Exercise library</a>${Object.keys(s.swaps || {}).length ? ` · <button type="button" class="link" data-act="reset-swaps">Undo your ${Object.keys(s.swaps).length} swapped exercises</button>` : ''}</p>`}
    </section>`;
}

function wireForm(root, getDraft, onChange) {
  const update = () => {
    const s = getDraft();
    const kg = num(s.body.weight) && !model.weights().length ? num(s.body.weight) : model.weightOn(today());
    root.querySelector('[data-summary="goal"]').innerHTML = goalSummary(s, kg);
    root.querySelector('[data-summary="run"]').innerHTML = runSummary(s);
    root.querySelector('[data-summary="week"]').innerHTML = weekSummary(s);
  };
  root.addEventListener('change', (e) => {
    const el = e.target.closest('[data-path]');
    if (!el) return;
    const s = getDraft();
    const t = el.dataset.type;
    let v = el.value.trim();
    if (t === 'num' || t === 'int') v = num(v);
    else if (t === 'selectnum') v = Number(v);
    else if (t === 'time') {
      if (v && !parseTime(v, { hoursFirst: true })) { toast('Write a time like 2:00:00'); el.value = getPath(s, el.dataset.path) || ''; return; }
    }
    setPath(s, el.dataset.path, v);
    onChange();
    update();
  });
  wireSegs(root, (path, value) => {
    const s = getDraft();
    setPath(s, path, ['goal.rate', 'lift.minutes'].includes(path) ? Number(value) : value);
    onChange();
    update();
  });
  root.addEventListener('click', (e) => {
    const s = getDraft();
    const tog = e.target.closest('[data-day]');
    if (tog) {
      const k = Number(tog.dataset.day);
      const what = tog.dataset.what;
      s.days[k] = { ...s.days[k], [what]: !s.days[k][what] };
      tog.classList.toggle('is-on', s.days[k][what]);
      tog.setAttribute('aria-pressed', String(s.days[k][what]));
      onChange();
      update();
      return;
    }
    const gear = e.target.closest('[data-gear]');
    if (gear) {
      const set = new Set(s.lift.gear);
      if (set.has(gear.dataset.gear)) set.delete(gear.dataset.gear); else set.add(gear.dataset.gear);
      s.lift.gear = [...set];
      gear.classList.toggle('is-on', set.has(gear.dataset.gear));
      gear.setAttribute('aria-pressed', String(set.has(gear.dataset.gear)));
      onChange();
    }
  });
  update();
}

// ---------- First time ----------

export function setupView(el) {
  const draft = defaults();
  el.innerHTML = `
    <div class="narrow">
      <h1>Welcome to Sweaty</h1>
      <p class="muted">A few things about you, so the plan and the calories fit. You can change all of it later on the Me page.</p>
      <form id="setup" novalidate>
        ${formHtml(draft, { setup: true })}
        <p class="error" id="error" hidden></p>
        <button class="btn btn-primary btn-wide btn-tall">Start</button>
      </form>
    </div>`;
  const form = el.querySelector('#setup');
  wireForm(form, () => draft, () => {});
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Take what's typed, also if the last field hasn't fired "change" yet.
    form.querySelectorAll('[data-path]').forEach((x) => x.dispatchEvent(new Event('change', { bubbles: true })));
    const missing = [];
    if (!draft.body.sex) missing.push('sex');
    if (!(draft.body.age > 10 && draft.body.age < 100)) missing.push('age');
    if (!(draft.body.height > 100 && draft.body.height < 250)) missing.push('height (cm)');
    if (!(draft.body.weight > 30 && draft.body.weight < 300)) missing.push('weight (kg)');
    if (!(draft.goal.weight > 30 && draft.goal.weight < 300)) missing.push('goal weight');
    const err = el.querySelector('#error');
    if (missing.length) {
      err.textContent = `Fill in your ${missing.join(', ')}.`;
      err.hidden = false;
      return;
    }
    draft.run.start = plan.startMonday(today());
    store.saveSettings(draft);
    store.put({ day: today(), kind: 'weight', data: { kg: draft.body.weight, at: Date.now() } });
    location.hash = '#/';
  });
}

// ---------- Me ----------

export function meView(el) {
  const draft = structuredClone(model.settings());
  let savedTimer = null;
  const user = { email: '' };
  store.user().then((u) => { user.email = u?.email || ''; const x = el.querySelector('[data-email]'); if (x) x.textContent = user.email; });

  const sync = () => {
    const { pending, problem } = store.syncState();
    const x = el.querySelector('[data-sync]');
    if (!x) return;
    x.textContent = store.isLocal ? 'Local mode: everything is kept in this browser only.'
      : problem ? `${problem} (${pending} waiting)` : pending ? 'Saving…' : 'Everything is saved.';
  };

  el.innerHTML = `
    <div class="me-head"><h1>Me</h1><span class="saved muted small" data-saved aria-live="polite"></span></div>
    <p class="muted small">Changes are saved right away, and the plan follows.</p>
    <form id="me" novalidate>${formHtml(draft, { setup: false })}</form>
    <section class="card form-card">
      <h2>Lists</h2>
      <p><a href="#/library">Exercises</a> <span class="muted small">— the library by muscle, and your own</span></p>
      <p><a href="#/me/foods">My foods</a> <span class="muted small">— ${fmt((draft.myFoods || []).length)} of your own</span></p>
    </section>
    <section class="card form-card">
      <h2>Data</h2>
      <p class="muted small" data-sync></p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="backup">Download a backup</button>
        <label class="btn">Restore a backup<input type="file" accept=".json,application/json" data-act="restore" hidden></label>
      </div>
      ${store.syncState().pending ? '<p><button type="button" class="link danger small" data-act="discard">Throw away the changes that couldn’t be saved</button></p>' : ''}
      <p class="muted small">${store.isLocal ? '' : 'Logged in as <span data-email></span>. '}<a href="../">All apps</a>${store.isLocal ? '' : ' · <button type="button" class="link" data-act="logout">Log out</button>'}</p>
    </section>`;

  const form = el.querySelector('#me');
  wireForm(form, () => draft, () => {
    store.saveSettings(structuredClone(draft));
    const x = el.querySelector('[data-saved]');
    x.textContent = 'Saved';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { x.textContent = ''; }, 1500);
  });
  sync();
  const off = store.onChange(sync);
  const rerender = () => window.dispatchEvent(new Event('sweaty:rerender'));

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'restart') {
      if (!confirm(`Start the plan again from this week, with a long run of ${fmt(draft.run.longRun || 14)} km? (Change “Long run now” first if that's not right.)`)) return;
      draft.run.start = mondayOf(today());
      store.saveSettings(structuredClone(draft));
      toast('The plan starts again this week');
      rerender();
    } else if (act === 'reset-swaps') {
      draft.swaps = {};
      store.saveSettings(structuredClone(draft));
      toast('Back to the standard exercises');
      rerender();
    } else if (act === 'backup') {
      b.disabled = true;
      try {
        const data = await store.everything();
        const blob = new Blob([JSON.stringify({ app: 'sweaty', version: 1, exported: new Date().toISOString(), ...data })], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `sweaty-backup-${today()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } catch (err) { toast(err.message); }
      b.disabled = false;
    } else if (act === 'discard') {
      if (!confirm('Throw away the changes that couldn’t be saved? They are lost.')) return;
      await store.discardUnsaved().catch(() => {});
      rerender();
    } else if (act === 'logout') {
      await store.logOut();
    }
  });

  el.querySelector('[data-act="restore"]').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup.app !== 'sweaty') throw new Error('That isn’t a Sweaty backup.');
      if (!confirm(`Restore ${fmt((backup.log || []).length)} logged things and the settings from ${backup.exported?.slice(0, 10) || 'this file'}? Things with the same id are replaced; the rest stays.`)) return;
      const n = await store.restore(backup);
      toast(`Restored ${fmt(n)} things`);
      rerender();
    } catch (err) {
      toast(err.message || 'Couldn’t read that file.');
    }
  });

  return { destroy: off };
}

// ---------- My foods ----------

export function myFoodsView(el) {
  function draw() {
    const s = model.settings();
    const list = [...(s.myFoods || [])].sort((a, b) => a.name.localeCompare(b.name));
    el.innerHTML = `
      <p class="back"><a href="#/me">‹ Me</a></p>
      <h1>My foods</h1>
      <p class="muted">Your own foods and meals, from a label or your usual portion. They come first when you search.</p>
      <p><button type="button" class="btn btn-primary" data-act="new">Create a food</button></p>
      ${list.length ? `<ul class="results">${list.map((f) => `
        <li><button type="button" class="result" data-id="${esc(f.id)}"><span class="row-text">
          <span class="row-title">${esc(f.name)}</span>
          <span class="row-meta">${f.k100 != null ? `${fmt(f.k100)} kcal per 100 g` : `${fmt(f.kPortion)} kcal per ${esc(f.portion?.name || 'portion')}`}${(f.p100 ?? f.pPortion) ? ` · ${fmt(f.p100 ?? f.pPortion, 1)} g protein` : ''}</span>
        </span></button></li>`).join('')}</ul>` : '<p class="muted">None yet. Foods you save while adding food show up here too.</p>'}`;
  }
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="new"]')) { foodForm(null, { onSave: () => { draw(); toast('Food saved'); } }); return; }
    const b = e.target.closest('[data-id]');
    if (!b) return;
    const food = (model.settings().myFoods || []).find((f) => f.id === b.dataset.id);
    if (food) foodForm(food, { onSave: () => { draw(); toast('Food saved'); }, onDelete: () => { draw(); toast('Food deleted'); } });
  });
  draw();
}

