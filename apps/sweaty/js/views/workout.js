// Workout mode: one exercise at a time. Tick off each set and the rest timer starts by itself;
// the screen stays on. Stopping halfway is fine: it's kept on this phone until you finish.
//
// Can't do an exercise? Swap gives you others for the same muscles, with the gear you have.
// Away from home? "Equipment here: no gear" turns what you haven't started into bodyweight work.

import * as store from '../store.js';
import * as model from '../model.js';
import * as strength from '../strength.js';
import * as wake from '../wakelock.js';
import * as nav from '../nav.js';
import { warmup } from '../../data/sessions.js';
import { GEAR, MUSCLES, PATTERNS, REST } from '../../data/exercises.js';
import { dayName, esc, fmt, fmtKg, local, num, sum, today } from '../util.js';
import { ICON, seg, sheet, toast, wireSegs } from './parts.js';
import { exerciseInfo, toggleFavourite } from './library.js';

const muscleName = (m) => MUSCLES.find(([k]) => k === m)?.[1].toLowerCase() || m;
const gearName = (g) => GEAR.find(([k]) => k === g)?.[1].toLowerCase() || g;
const S = () => model.settings();
// In workout mode `sets` is the list of sets; the plan helpers want the number.
const asPlan = (it) => ({ ...it, sets: it.sets.length });
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

// Beeps when the rest is over (also on a silent iPhone the screen flashes).
let audio = null;
function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { /* no sound then */ }
}
function beep() {
  try {
    if (audio) {
      const now = audio.currentTime;
      [0, 0.22, 0.44].forEach((at) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.exponentialRampToValueAtTime(0.35, now + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.16);
        osc.connect(gain).connect(audio.destination);
        osc.start(now + at);
        osc.stop(now + at + 0.18);
      });
    }
  } catch { /* fine */ }
  navigator.vibrate?.([120, 80, 120]);
}

export default function workoutView(el, { date, key }) {
  const KEY = `sweaty.workout.${date}.${key}`;
  const back = date === today() ? '#/' : `#/day/${date}`;
  const backName = ['Today', 'Yesterday', 'Tomorrow'].includes(dayName(date)) ? dayName(date).toLowerCase() : dayName(date);
  let st = local.get(KEY);
  let finished = null;
  let timer = null; // { kind: 'rest' | 'hold', end, total, item, set }

  // The equipment at hand for this workout: your home gear, or none.
  const gearHere = () => (st.gear === 'none' ? new Set() : strength.owned(S()));

  function prepare(item) {
    const ex = strength.find(S(), item.id);
    const last = model.lastTime(item.id, date);
    const adv = strength.advice(S(), ex, item, last);
    return { ...item, advice: adv, sets: strength.prefill(item, ex, last, adv) };
  }

  function session(gear) {
    const d = model.day(date);
    const mod = { ...(d.lift?.key === key ? d.lift.mod || {} : {}), ...(gear === 'none' ? { gear: [] } : {}) };
    return strength.build(S(), key, mod);
  }

  function fresh() {
    const built = session('home');
    if (!built) return null;
    return { v: 1, date, key, name: built.name, routine: built.routine, gear: 'home', started: null, idx: -1, items: built.items.map(prepare) };
  }

  if (!st || st.v !== 1) st = fresh();
  if (!st) {
    el.innerHTML = `${nav.backLink(back)}<p class="error">There's no session called “${esc(key)}”.</p>`;
    return {};
  }
  const save = () => local.set(KEY, st);
  const started = (it) => it.sets.some((x) => x.done);

  // Rebuild what you haven't started for other equipment; what you did stays.
  function changeGear(gear) {
    const built = session(gear);
    const bySlot = new Map(built.items.map((it) => [it.slot, it]));
    st.items = st.items.map((it) => (started(it) || !bySlot.has(it.slot) ? it : prepare(bySlot.get(it.slot))));
    for (const it of built.items) if (!st.items.some((x) => x.slot === it.slot)) st.items.push(prepare(it));
    st.gear = gear;
    save();
    render();
    toast(gear === 'none' ? 'Changed to exercises without gear' : 'Back to your home gear');
  }

  el.innerHTML = '<div class="wo" id="wo"></div><div class="timer" id="timer" hidden><span class="timer-label"></span><b class="timer-time"></b><button type="button" class="btn btn-small" data-act="timer-stop">Skip</button></div>';
  const body = el.querySelector('#wo');
  const timerBox = el.querySelector('#timer');

  // ---------- Pages ----------

  function overview() {
    const minutes = strength.estimate(st.items.filter((it) => !it.skipped).map(asPlan), st.routine);
    const doneSets = sum(st.items, (it) => it.sets.filter((x) => x.done).length);
    body.innerHTML = `
      <div class="wo-top"><a class="btn btn-quiet btn-small" href="${back}" data-back>${ICON.left} Back</a></div>
      <h1>${esc(st.name)}</h1>
      <p class="muted">${st.items.length} exercises · about ${minutes} min${doneSets ? ` · ${doneSets} sets done` : ''}</p>
      ${st.routine ? '' : `
        <div class="field gear-here"><span class="label">Equipment here</span>${seg('gear', st.gear || 'home', [['home', 'My home gear'], ['none', 'No gear']])}
          <span class="hint">Away from home? “No gear” changes the exercises you haven’t started into ones without equipment.</span></div>
        <div class="box small"><strong>Warm up first.</strong> ${esc(warmup)}</div>`}
      <ol class="ex-list ex-list-big">
        ${st.items.map((it, j) => {
          const ex = strength.find(S(), it.id);
          const n = it.sets.filter((x) => x.done).length;
          return `<li><button type="button" class="ex-jump${it.skipped ? ' is-skipped' : ''}" data-jump="${j}">
            <span><span class="ex-name">${esc(ex?.name)}</span><span class="muted small">${it.skipped ? 'skipped today' : strength.dose(asPlan(it))}</span></span>
            ${n ? `<span class="mark is-done">${n === it.sets.length ? ICON.done : `${n}/${it.sets.length}`}</span>` : ''}
          </button></li>`;
        }).join('')}
      </ol>
      <button class="btn btn-primary btn-wide btn-tall" type="button" data-act="start">${st.started ? 'Continue' : 'Start'}</button>
      ${st.started ? `
        <button class="btn btn-wide" type="button" data-act="finish">Finish workout</button>
        <p class="center"><button class="link danger small" type="button" data-act="discard">Throw this workout away</button></p>` : ''}`;
  }

  function setRow(it, ex, set, j) {
    const weighted = strength.isWeighted(ex);
    const inputs = it.time
      ? `<input class="set-in" data-field="s" data-set="${j}" inputmode="numeric" value="${esc(set.s ?? '')}" aria-label="Seconds"><span class="unit">s</span>
         ${set.done ? '' : `<button type="button" class="btn btn-small" data-act="hold" data-set="${j}">Start</button>`}`
      : `<input class="set-in" data-field="r" data-set="${j}" inputmode="numeric" value="${esc(set.r ?? '')}" aria-label="Reps"><span class="unit">${it.side ? 'each' : 'reps'}</span>
         ${weighted ? `<input class="set-in set-kg" data-field="w" data-set="${j}" inputmode="decimal" value="${esc(set.w ?? '')}" placeholder="kg" aria-label="Kilos"><span class="unit">kg</span>` : ''}`;
    return `
      <div class="set${set.done ? ' is-done' : ''}">
        <span class="set-n">${j + 1}</span>
        ${inputs}
        <button type="button" class="tick" data-act="tick" data-set="${j}" aria-label="${set.done ? 'Not done' : 'Done'}" aria-pressed="${set.done}">${ICON.check}</button>
      </div>`;
  }

  function exercise() {
    const it = st.items[st.idx];
    const ex = strength.find(S(), it.id);
    const lastOne = st.idx === st.items.length - 1;
    const harder = it.advice?.harder ? strength.find(S(), it.advice.harder) : null;
    const fav = strength.favourites(S()).has(ex.id);
    body.innerHTML = `
      <div class="wo-top">
        <button class="btn btn-quiet btn-small" type="button" data-act="overview">${ICON.left} All exercises</button>
        <span class="muted small">${st.idx + 1} of ${st.items.length}</span>
      </div>
      <div class="bar bar-thin"><i style="width:${((st.idx + 1) / st.items.length) * 100}%"></i></div>
      <p class="kicker">${esc(PATTERNS[ex.pattern] || '')} · ${esc(ex.muscles.map(muscleName).join(', '))}</p>
      <div class="wo-title">
        <h1 class="wo-name">${esc(ex.name)}</h1>
        <button type="button" class="fav${fav ? ' is-on' : ''}" data-act="fav" aria-pressed="${fav}" aria-label="Favourite">${fav ? ICON.starFull : ICON.star}</button>
      </div>
      ${it.skipped ? `<p class="box small">Skipped today. <button type="button" class="link" data-act="unskip">Do it anyway</button></p>` : ''}
      <p class="target">${strength.dose(asPlan(it))}${it.time ? '' : ' reps'} · rest ${it.rest >= 60 ? `${fmt(it.rest / 60, 1)} min` : `${it.rest} s`}</p>
      ${it.standIn ? '<p class="hint">Stand-in: none of the usual exercises for this spot fits the gear here, so this one trains the same area.</p>' : ''}
      ${it.advice?.text ? `<p class="tip">${esc(it.advice.text)}</p>` : ''}
      ${harder ? `<p><button type="button" class="btn btn-small" data-swap-to="${harder.id}">Switch to ${esc(harder.name)}</button></p>` : ''}
      <p class="how">${esc(ex.how)} <button type="button" class="link" data-act="info">Picture, tips and video ›</button></p>
      <div class="sets">${it.sets.map((set, j) => setRow(it, ex, set, j)).join('')}</div>
      <p><button type="button" class="link small" data-act="add-set">+ Add a set</button></p>
      <div class="wo-nav">
        <button type="button" class="btn" data-act="prev" aria-label="Previous exercise"${st.idx === 0 ? ' disabled' : ''}>${ICON.left}</button>
        <button type="button" class="btn" data-act="swap">Can’t do it?</button>
        <button type="button" class="btn btn-primary" data-act="next">${lastOne ? 'Finish' : 'Next'} ${lastOne ? '' : ICON.right}</button>
      </div>`;
  }

  function summaryPage() {
    const x = finished.data;
    const sets = sum(x.items, (i) => i.sets.length);
    const volume = sum(x.items, (i) => sum(i.sets, (k) => (k.r || 0) * (k.w || 0)));
    body.innerHTML = `
      <div class="finish">
        <div class="finish-mark">${ICON.done}</div>
        <h1>Done!</h1>
        <p class="muted">${esc(x.name)} · ${x.min} min · ${sets} sets${volume ? ` · ${fmt(volume)} kg lifted` : ''}</p>
        <ul class="done-list">${x.items.map((i) => `<li>${ICON.check}<span><strong>${esc(strength.find(S(), i.id)?.name || i.id)}</strong>: ${i.sets.map((k) => (k.s ? `${k.s} s` : `${k.r}${k.w ? ` × ${fmtKg(k.w)} kg` : ''}`)).join(', ')}</span></li>`).join('')}</ul>
        <a class="btn btn-primary btn-wide" href="${back}" data-back>Back to ${esc(backName)}</a>
      </div>`;
  }

  function render() {
    if (finished) summaryPage();
    else if (st.idx < 0) overview();
    else exercise();
    window.scrollTo(0, 0);
  }

  // ---------- Timer ----------

  function startTimer(kind, seconds, extra = {}) {
    timer = { kind, end: Date.now() + seconds * 1000, total: seconds, ...extra };
    timerBox.classList.remove('is-ding');
    timerBox.querySelector('.timer-label').textContent = kind === 'rest' ? 'Rest' : 'Hold';
    timerBox.querySelector('[data-act="timer-stop"]').textContent = kind === 'rest' ? 'Skip' : 'Stop';
    timerBox.hidden = false;
    updateTimer();
  }

  function stopTimer() {
    timer = null;
    timerBox.hidden = true;
  }

  function updateTimer() {
    if (!timer) return;
    const left = Math.ceil((timer.end - Date.now()) / 1000);
    timerBox.querySelector('.timer-time').textContent = mmss(Math.max(0, left));
    if (left > 0) return;
    beep();
    if (timer.kind === 'hold') {
      const { item, set } = timer;
      const it = st.items[item];
      if (it?.sets[set]) {
        it.sets[set].done = true;
        save();
        render();
      }
      startTimer('rest', it?.rest || 45);
      return;
    }
    timerBox.classList.add('is-ding');
    timerBox.querySelector('.timer-label').textContent = 'Go!';
    timer = null;
    setTimeout(() => { if (!timer) timerBox.hidden = true; }, 4000);
  }
  const tick = setInterval(updateTimer, 250);

  // ---------- Actions ----------

  // The next (or previous) exercise you didn't skip.
  function step(dir) {
    let i = st.idx + dir;
    while (i >= 0 && i < st.items.length && st.items[i].skipped) i += dir;
    return i;
  }

  function finish() {
    const items = st.items.map((it) => {
      const ex = strength.find(S(), it.id);
      const weighted = strength.isWeighted(ex);
      const sets = it.sets.filter((x) => x.done).map((x) => {
        if (it.time) return { s: num(x.s) || it.target[0] };
        return weighted ? { r: num(x.r) || 0, w: num(x.w) || 0 } : { r: num(x.r) || 0 };
      });
      return { id: it.id, slot: it.slot, sets };
    }).filter((it) => it.sets.length);
    if (!items.length) {
      if (!confirm('Nothing is ticked off yet. Close this workout without saving?')) return;
      local.remove(KEY);
      nav.back(back);
      return;
    }
    let min = st.started ? Math.round((Date.now() - st.started) / 60000) : 0;
    if (!min || min > 180) min = strength.estimate(st.items.map(asPlan), st.routine);
    finished = store.put({ day: date, kind: 'workout', data: { routine: st.routine, key, name: st.name, min, at: Date.now(), items } });
    local.remove(KEY);
    stopTimer();
    render();
  }

  // Put another exercise in this spot. remember: also next time this session comes round.
  function swapTo(id, { remember = false } = {}) {
    const it = st.items[st.idx];
    const ex = strength.find(S(), id);
    if (!ex) return;
    const next = {
      ...it, id, sets: it.sets.length, skipped: false, standIn: false,
      target: ex.time ? ex.time.slice() : (it.reps || [8, 12]).slice(),
      time: Boolean(ex.time), side: Boolean(ex.side), rest: REST[ex.pattern] ?? it.rest,
    };
    st.items[st.idx] = prepare(next);
    save();
    if (remember) {
      const cur = S();
      store.saveSettings({ ...cur, swaps: { ...(cur.swaps || {}), [it.slot]: id } });
    }
    render();
    toast(`Switched to ${ex.name}${remember ? ', also next time' : ''}`);
  }

  function openSwap() {
    const it = st.items[st.idx];
    const ex = strength.find(S(), it.id);
    const gear = gearHere();
    const favs = strength.favourites(S());
    const inWorkout = new Set(st.items.map((x) => x.id));
    const fits = (e) => e.id !== ex.id && !inWorkout.has(e.id);
    const same = strength.options(S(), ex.pattern, gear).filter(fits);
    const related = (strength.FALLBACK[ex.pattern] || []).flatMap((p) => strength.options(S(), p, gear)).filter((e) => fits(e) && !same.includes(e));
    const favFirst = (list) => [...list.filter((e) => favs.has(e.id)), ...list.filter((e) => !favs.has(e.id))];
    const tag = (e) => (e.id === ex.easier ? 'easier' : e.id === ex.harder ? 'harder' : '');
    const row = (e) => `<li><button type="button" class="result" data-pick="${e.id}">
      <span class="row-text"><span class="row-title">${favs.has(e.id) ? '<span class="star-inline">★</span> ' : ''}${esc(e.name)}${tag(e) ? ` <span class="tag">${tag(e)}</span>` : ''}</span>
      <span class="row-meta">${esc(e.muscles.map(muscleName).join(', '))} · ${e.gear.length ? esc(e.gear.map(gearName).join(', ')) : 'no gear'}</span></span></button></li>`;
    const dlg = sheet(`
      <h2>Instead of ${esc(ex.name)}</h2>
      <p class="muted small">${st.gear === 'none' ? 'Only exercises without gear.' : 'With the gear you ticked on the Me page.'} ★ = your favourites.</p>
      ${same.length ? `<h3 class="label">Same kind</h3><ul class="results">${favFirst(same).map(row).join('')}</ul>` : ''}
      ${related.length ? `<h3 class="label">Also trains this</h3><ul class="results">${favFirst(related).map(row).join('')}</ul>` : ''}
      ${same.length || related.length ? '' : '<p class="muted">Nothing else fits the gear here.</p>'}
      <label class="check"><input type="checkbox" data-remember> Use my choice next time too</label>
      <div class="btn-row">
        <button type="button" class="btn" data-skip-it>Skip it today</button>
        <button type="button" class="btn btn-quiet" data-close>Cancel</button>
      </div>`);
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (b) {
        const remember = dlg.querySelector('[data-remember]').checked;
        dlg.close();
        swapTo(b.dataset.pick, { remember });
        return;
      }
      if (e.target.closest('[data-skip-it]')) {
        it.skipped = true;
        save();
        dlg.close();
        const next = step(1);
        st.idx = next < st.items.length ? next : -1;
        save();
        render();
        toast(`Skipped ${ex.name} today`);
      }
    });
  }

  body.addEventListener('input', (e) => {
    const input = e.target.closest('[data-field]');
    if (!input) return;
    const j = Number(input.dataset.set);
    const sets = st.items[st.idx]?.sets;
    if (!sets?.[j]) return;
    const field = input.dataset.field;
    const before = sets[j][field];
    sets[j][field] = input.value;
    // A weight you type carries over to the sets after it that still had the old (or no) weight.
    if (field === 'w') {
      for (let k = j + 1; k < sets.length; k++) {
        if (sets[k].done || !(sets[k].w === '' || sets[k].w == null || String(sets[k].w) === String(before))) continue;
        sets[k].w = input.value;
        const other = body.querySelector(`[data-field="w"][data-set="${k}"]`);
        if (other) other.value = input.value;
      }
    }
    save();
  });

  wireSegs(body, (name, value) => { if (name === 'gear' && value !== st.gear) changeGear(value); });

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act], [data-jump], [data-swap-to]');
    if (!b) return;
    unlockAudio();
    if (b.dataset.jump !== undefined) { st.idx = Number(b.dataset.jump); if (!st.started) st.started = Date.now(); save(); render(); return; }
    if (b.dataset.swapTo) { swapTo(b.dataset.swapTo, { remember: true }); return; }
    const act = b.dataset.act;
    const it = st.items[st.idx];
    if (act === 'start') {
      if (!st.started) st.started = Date.now();
      st.idx = Math.max(0, st.items.findIndex((x) => !x.skipped && x.sets.some((k) => !k.done)));
      save();
      render();
    } else if (act === 'overview') { st.idx = -1; save(); render(); }
    else if (act === 'prev') { st.idx = Math.max(0, step(-1)); save(); render(); }
    else if (act === 'next') {
      const next = step(1);
      if (next >= st.items.length) finish(); else { st.idx = next; save(); render(); }
    } else if (act === 'finish') finish();
    else if (act === 'discard') {
      if (!confirm('Throw this workout away? What you ticked off is lost.')) return;
      local.remove(KEY);
      nav.back(back);
    } else if (act === 'swap') openSwap();
    else if (act === 'unskip') { it.skipped = false; save(); render(); }
    else if (act === 'fav') {
      const on = toggleFavourite(it.id);
      toast(on ? '★ Favourite: Sweaty puts it in your workouts more often' : 'Not a favourite any more');
      render();
    } else if (act === 'info') {
      const ex = strength.find(S(), it.id);
      sheet(`<h2>${esc(ex.name)}</h2>${exerciseInfo(S(), ex, { links: false, history: false })}
        <div class="btn-row"><button type="button" class="btn btn-primary" data-close>Back to the workout</button></div>`);
    } else if (act === 'add-set') {
      const last = it.sets[it.sets.length - 1] || {};
      it.sets.push({ ...last, done: false });
      save();
      render();
    } else if (act === 'tick') {
      const set = it.sets[Number(b.dataset.set)];
      set.done = !set.done;
      if (set.done) {
        if (!st.started) st.started = Date.now();
        if (it.time && !num(set.s)) set.s = it.target[0];
        if (!it.time && !num(set.r)) set.r = it.target[0];
        const more = it.sets.some((k) => !k.done) || step(1) < st.items.length;
        if (more) startTimer('rest', it.rest);
      }
      save();
      render();
    } else if (act === 'hold') {
      const j = Number(b.dataset.set);
      const seconds = num(it.sets[j].s) || it.target[0];
      if (!st.started) st.started = Date.now();
      it.sets[j].s = seconds;
      save();
      startTimer('hold', seconds, { item: st.idx, set: j });
    } else if (act === 'timer-stop') {
      if (timer?.kind === 'hold') {
        const done = Math.max(1, Math.round(timer.total - (timer.end - Date.now()) / 1000));
        const x = st.items[timer.item]?.sets[timer.set];
        if (x) { x.s = done; x.done = true; }
        save();
        stopTimer();
        render();
        startTimer('rest', st.items[st.idx]?.rest || 45);
      } else stopTimer();
    }
  });

  wake.enable();
  render();
  return {
    destroy() {
      clearInterval(tick);
      wake.disable();
    },
  };
}
