// The exercise library: every exercise by muscle, what you can do with your gear,
// how to do it, and your history with it. You can add your own exercises here.

import * as store from '../store.js';
import * as model from '../model.js';
import * as strength from '../strength.js';
import { GEAR, MUSCLES, PATTERNS } from '../../data/exercises.js';
import { esc, fmtKg, fmtShort, howToVideo, local, uuid } from '../util.js';
import { seg, sheet, toast, wireSegs } from './parts.js';

const gearName = (g) => GEAR.find(([k]) => k === g)?.[1].toLowerCase() || g;
const muscleName = (m) => MUSCLES.find(([k]) => k === m)?.[1] || m;
const FILTER = 'sweaty.library.muscle';

export function libraryView(el) {
  let muscle = local.get(FILTER, '');
  let onlyMine = true;

  function draw() {
    const s = model.settings();
    const gear = strength.owned(s);
    const list = strength.library(s)
      .filter((e) => !muscle || e.muscles.includes(muscle))
      .filter((e) => !onlyMine || strength.canDo(e, gear));
    const groups = new Map();
    for (const e of list) {
      if (!groups.has(e.pattern)) groups.set(e.pattern, []);
      groups.get(e.pattern).push(e);
    }
    el.innerHTML = `
      <p class="back"><a href="#/me">‹ Me</a></p>
      <h1>Exercises</h1>
      <p class="muted">${list.length} exercises${muscle ? ` for ${esc(muscleName(muscle).toLowerCase())}` : ''}${onlyMine ? ' you can do with your equipment' : ''}. Tap one to see how.</p>
      <div class="chips">
        <button type="button" class="chip${!muscle ? ' is-on' : ''}" data-muscle="">All</button>
        ${MUSCLES.map(([k, label]) => `<button type="button" class="chip${muscle === k ? ' is-on' : ''}" data-muscle="${k}">${esc(label)}</button>`).join('')}
      </div>
      <label class="check"><input type="checkbox" data-only${onlyMine ? ' checked' : ''}> Only what I can do with my equipment</label>
      ${[...groups.entries()].map(([pattern, items]) => `
        <h2 class="label">${esc(PATTERNS[pattern] || pattern)}</h2>
        <ul class="results">${items.map((e) => {
          const ok = strength.canDo(e, gear);
          return `<li><a class="result${ok ? '' : ' is-unavailable'}" href="#/library/${encodeURIComponent(e.id)}">
            <span class="row-text"><span class="row-title">${esc(e.name)}</span>
            <span class="row-meta">${esc(e.muscles.map(muscleName).join(', '))}${e.gear.length ? ` · ${esc(e.gear.map(gearName).join(', '))}` : ' · no gear'}${ok ? '' : ' · you don’t have this'}</span></span>
            ${e.mine ? '<span class="tag">mine</span>' : ''}</a></li>`;
        }).join('')}</ul>`).join('') || '<p class="muted">Nothing here with your equipment.</p>'}
      <p><button type="button" class="btn" data-act="new">Add your own exercise</button></p>`;
  }

  el.addEventListener('click', (e) => {
    const m = e.target.closest('[data-muscle]');
    if (m) { muscle = m.dataset.muscle; local.set(FILTER, muscle); draw(); return; }
    if (e.target.closest('[data-act="new"]')) exerciseForm(null, { onSave: (ex) => { location.hash = `#/library/${ex.id}`; } });
  });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-only]')) { onlyMine = e.target.checked; draw(); }
  });
  draw();
}

export function exerciseView(el, { id }) {
  const s = model.settings();
  const ex = strength.find(s, decodeURIComponent(id));
  if (!ex) {
    el.innerHTML = '<p>That exercise isn’t in the library. <a href="#/library">All exercises</a></p>';
    return;
  }
  const gear = strength.owned(s);
  const ok = strength.canDo(ex, gear);
  const easier = strength.find(s, ex.easier);
  const harder = strength.find(s, ex.harder);
  const hist = model.history(ex.id).slice(0, 10);
  const setText = (k) => (k.s ? `${k.s} s` : `${k.r}${k.w ? ` × ${fmtKg(k.w)} kg` : ''}`);
  el.innerHTML = `
    <p class="back"><a href="#/library">‹ Exercises</a></p>
    <p class="kicker">${esc(PATTERNS[ex.pattern] || ex.pattern)}</p>
    <h1>${esc(ex.name)}</h1>
    <p class="muted">${esc(ex.muscles.map(muscleName).join(', '))} · ${ex.gear.length ? esc(ex.gear.map(gearName).join(', ')) : 'no gear needed'}${ex.time ? ` · a hold of ${ex.time[0]}–${ex.time[1]} s` : ''}${ex.side ? ' · each side' : ''}</p>
    ${ok ? '' : `<p class="box small">You don’t have the gear for this one. Tick it on the Me page if you do.</p>`}
    <p>${esc(ex.how)}</p>
    <p><a class="btn" href="${howToVideo(ex.name)}" target="_blank" rel="noopener">Watch how on YouTube</a></p>
    ${easier || harder ? `<p class="small">${easier ? `Easier: <a href="#/library/${easier.id}">${esc(easier.name)}</a>` : ''}${easier && harder ? ' · ' : ''}${harder ? `Harder: <a href="#/library/${harder.id}">${esc(harder.name)}</a>` : ''}</p>` : ''}
    <h2 class="label">Your history</h2>
    ${hist.length ? `<ul class="results">${hist.map((h) => `<li><div class="result"><span class="row-text"><span class="row-title">${esc(fmtShort(h.day))}</span><span class="row-meta">${esc(h.sets.map(setText).join(', '))}</span></span></div></li>`).join('')}</ul>`
      : '<p class="muted">Not done yet.</p>'}
    ${ex.mine ? '<p class="btn-row"><button type="button" class="btn" data-act="edit">Change</button><button type="button" class="btn btn-danger" data-act="delete">Delete</button></p>' : ''}`;

  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'edit') exerciseForm(ex, { onSave: () => window.dispatchEvent(new Event('sweaty:rerender')) });
    if (act === 'delete') {
      if (!confirm(`Delete “${ex.name}”? Workouts you already did keep it.`)) return;
      const cur = model.settings();
      const swaps = Object.fromEntries(Object.entries(cur.swaps || {}).filter(([, v]) => v !== ex.id));
      store.saveSettings({ ...cur, swaps, myExercises: (cur.myExercises || []).filter((x) => x.id !== ex.id) });
      toast('Exercise deleted');
      location.hash = '#/library';
    }
  });
}

// Add or change your own exercise.
export function exerciseForm(existing, { onSave } = {}) {
  const x = existing || { pattern: 'core', gear: [], muscles: [] };
  let kind = x.time ? 'time' : 'reps';
  const muscles = new Set(x.muscles);
  const gear = new Set(x.gear);
  const dlg = sheet(`
    <h2>${existing ? 'Change exercise' : 'Your own exercise'}</h2>
    <form>
      <label class="field"><span class="label">Name</span><input name="name" value="${esc(x.name || '')}" placeholder="Wall push-up" required></label>
      <label class="field"><span class="label">Kind of exercise</span>
        <select name="pattern">${Object.entries(PATTERNS).map(([k, label]) => `<option value="${k}"${k === x.pattern ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>
        <span class="hint">Sessions pick exercises by this. Yours shows up under Swap for the same kind.</span>
      </label>
      <div class="field"><span class="label">Muscles</span><div class="chips">${MUSCLES.map(([k, label]) => `<button type="button" class="chip${muscles.has(k) ? ' is-on' : ''}" data-m="${k}">${esc(label)}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Gear needed</span><div class="chips">${GEAR.map(([k, label]) => `<button type="button" class="chip${gear.has(k) ? ' is-on' : ''}" data-g="${k}">${esc(label)}</button>`).join('')}</div></div>
      <div class="field"><span class="label">You count</span>${seg('kind', kind, [['reps', 'Reps'], ['time', 'Seconds (a hold)']])}</div>
      <label class="check"><input type="checkbox" name="side"${x.side ? ' checked' : ''}> Done on each side</label>
      <label class="field"><span class="label">How to do it</span><textarea name="how" rows="3">${esc(x.how || '')}</textarea></label>
      <p class="error" data-error hidden></p>
      <div class="btn-row"><button class="btn btn-primary">Save</button><button type="button" class="btn btn-quiet" data-close>Cancel</button></div>
    </form>`);
  const form = dlg.querySelector('form');
  wireSegs(form, (_n, v) => { kind = v; });
  dlg.addEventListener('click', (e) => {
    const m = e.target.closest('[data-m]');
    const g = e.target.closest('[data-g]');
    const b = m || g;
    if (!b) return;
    const set = m ? muscles : gear;
    const key = m ? m.dataset.m : g.dataset.g;
    if (set.has(key)) set.delete(key); else set.add(key);
    b.classList.toggle('is-on', set.has(key));
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name || !muscles.size) {
      const err = dlg.querySelector('[data-error]');
      err.textContent = 'Give it a name and pick at least one muscle.';
      err.hidden = false;
      return;
    }
    const ex = {
      id: x.id || `my-${uuid().slice(0, 8)}`, name, pattern: form.pattern.value,
      gear: [...gear], muscles: [...muscles], how: form.how.value.trim() || 'Your own exercise.', mine: true,
      ...(kind === 'time' ? { time: [20, 45] } : {}), ...(form.side.checked ? { side: true } : {}),
    };
    const cur = model.settings();
    const list = (cur.myExercises || []).filter((o) => o.id !== ex.id);
    store.saveSettings({ ...cur, myExercises: [...list, ex] });
    dlg.close();
    toast('Exercise saved');
    onSave?.(ex);
  });
}
