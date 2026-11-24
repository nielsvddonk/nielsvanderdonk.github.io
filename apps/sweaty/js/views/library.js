// The Exercises tab: every exercise, by muscle, with a muscle diagram, how to do it, tips,
// a drawing, picture or video, and your history. Add your own exercises, or change any of
// them (explanation, notes, video, picture, or keep it out of your workouts) — all saved in
// your account, no files to edit.

import * as store from '../store.js';
import * as model from '../model.js';
import * as strength from '../strength.js';
import * as nav from '../nav.js';
import { GEAR, MUSCLES, PATTERNS, PATTERN_INFO, REST } from '../../data/exercises.js';
import { drawings, DRAWINGS_CREDIT as CREDIT } from '../../data/pictures.js';
import { esc, fmt, fmtKg, fmtShort, howToVideo, local, uuid } from '../util.js';
import { ICON, seg, sheet, toast, wireSegs } from './parts.js';
import { bodyMap } from './body.js';

const gearName = (g) => GEAR.find(([k]) => k === g)?.[1].toLowerCase() || g;
const muscleName = (m) => MUSCLES.find(([k]) => k === m)?.[1] || m;
const restText = (sec) => (sec >= 60 ? `${fmt(sec / 60, 1)} min` : `${sec} s`);
const MUSCLE_FILTER = 'sweaty.library.muscle';
const ONLY_MINE = 'sweaty.library.only';

// ★ Favourites: sessions pick them first, so they come up in your workouts more often.
export function toggleFavourite(id) {
  const s = model.settings();
  const favs = new Set(s.favourites || []);
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  store.saveSettings({ ...s, favourites: [...favs] });
  return favs.has(id);
}
const starButton = (id, on, cls = '') => `<button type="button" class="fav${on ? ' is-on' : ''}${cls}" data-fav="${esc(id)}" aria-pressed="${on}" aria-label="${on ? 'Favourite' : 'Make favourite'}">${on ? ICON.starFull : ICON.star}</button>`;

// Only web addresses become links (and pictures kept in this browser in local mode).
const webUrl = (u) => (/^https?:\/\/\S+$/i.test(String(u || '').trim()) ? String(u).trim() : '');
const picUrl = (u) => (/^(https?:\/\/\S+|data:image\/[\w+.-]+;base64,)/i.test(String(u || '')) ? String(u) : '');

// A YouTube link (watch?v=…, youtu.be/…, shorts/…) → the video's id.
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}

// Your own picture, or the drawings (start and end position), or nothing.
export function pictures(ex) {
  if (picUrl(ex.photo)) return { list: [ex.photo], own: true };
  return drawings[ex.id] ? { list: drawings[ex.id], own: false } : null;
}

const credit = () => `<p class="credit">Drawings: <a href="${CREDIT.authorUrl}" target="_blank" rel="noopener">${CREDIT.author}</a>,
  <a href="${CREDIT.licenseUrl}" target="_blank" rel="noopener">${CREDIT.license}</a>, via <a href="${CREDIT.sourceUrl}" target="_blank" rel="noopener">${CREDIT.source}</a></p>`;

// Everything about an exercise. Used on its own page and in workout mode (links: false).
export function exerciseInfo(s, ex, { links = true, history = true } = {}) {
  const info = PATTERN_INFO[ex.pattern] || {};
  const pics = pictures(ex);
  const yt = youtubeId(ex.video);
  const video = webUrl(ex.video);
  const easier = strength.find(s, ex.easier);
  const harder = strength.find(s, ex.harder);
  const other = (label, e) => (e ? `<li>${label}: ${links ? `<a href="#/exercises/${encodeURIComponent(e.id)}">${esc(e.name)}</a>` : esc(e.name)}</li>` : '');
  const hist = history ? model.history(ex.id).slice(0, 8) : [];
  const setText = (k) => (k.s ? `${k.s} s` : `${k.r}${k.w ? ` × ${fmtKg(k.w)} kg` : ''}`);
  return `
    <div class="ex-visual${pics ? ' has-pics' : ''}">
      <div class="ex-map">${bodyMap(ex.muscles)}</div>
      ${pics ? `<div class="ex-pics">${pics.list.map((src) => `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">`).join('')}</div>` : ''}
    </div>
    <p class="legend small"><span class="dot is-main"></span>${esc(muscleName(ex.muscles[0]))}${ex.muscles.length > 1 ? `<span class="dot is-also"></span>${esc(ex.muscles.slice(1).map(muscleName).join(', '))}` : ''}</p>
    ${pics && !pics.own ? credit() : ''}
    <h2 class="label">How to</h2>
    <p>${esc(ex.how)}</p>
    ${ex.notes ? `<h2 class="label">Your notes</h2><p class="notes">${esc(ex.notes)}</p>` : ''}
    ${info.tips ? `<h2 class="label">Tips</h2><ul class="tips">${info.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${info.why ? `<h2 class="label">Why it helps</h2><p>${esc(info.why)}</p>` : ''}
    <h2 class="label">Video</h2>
    ${yt ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(ex.name)}: video" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
      : video ? `<p><a class="btn" href="${esc(video)}" target="_blank" rel="noopener">Open your video</a></p>` : ''}
    <p><a class="btn btn-small" href="${howToVideo(ex.name)}" target="_blank" rel="noopener">${yt || video ? 'More videos' : 'Find a video'} on YouTube</a></p>
    <h2 class="label">Good to know</h2>
    <ul class="facts">
      <li>${ex.gear.length ? `You need: ${esc(ex.gear.map(gearName).join(', '))}` : 'No gear needed'}${strength.canDo(ex, strength.owned(s)) ? '' : ' (you don’t have that)'}</li>
      <li>${ex.time ? `A hold of ${ex.time[0]}–${ex.time[1]} seconds` : 'Counted in reps'}${ex.side ? ', each side' : ''}; rest ${restText(REST[ex.pattern] ?? 60)} between sets</li>
      ${other('Easier', easier)}${other('Harder', harder)}
    </ul>
    ${history ? `<h2 class="label">Your history</h2>${hist.length
      ? `<ul class="results">${hist.map((h) => `<li><div class="result"><span class="row-text"><span class="row-title">${esc(fmtShort(h.day))}</span><span class="row-meta">${esc(h.sets.map(setText).join(', '))}</span></span></div></li>`).join('')}</ul>`
      : '<p class="muted">Not done yet.</p>'}` : ''}`;
}

// ---------- The list ----------

const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function libraryView(el) {
  let muscle = local.get(MUSCLE_FILTER, '');
  let onlyMine = local.get(ONLY_MINE, true);
  let favOnly = false;
  let query = '';

  el.innerHTML = `
    <div class="lib-head">
      <h1>Exercises</h1>
      <button type="button" class="btn btn-primary btn-small" data-act="new">${ICON.plus} Add your own</button>
    </div>
    <p class="muted small" data-count></p>
    <div class="search"><input type="search" data-q placeholder="Search: squat, curl, plank…" autocomplete="off" aria-label="Search exercises"></div>
    <div class="chips" data-muscles>
      <button type="button" class="chip chip-fav" data-favonly>★ Favourites</button>
      <button type="button" class="chip" data-muscle="">All</button>
      ${MUSCLES.map(([k, label]) => `<button type="button" class="chip" data-muscle="${k}">${esc(label)}</button>`).join('')}
    </div>
    <label class="check"><input type="checkbox" data-only${onlyMine ? ' checked' : ''}> Only what I can do with my equipment</label>
    <div data-list></div>`;

  function draw() {
    const s = model.settings();
    const gear = strength.owned(s);
    const favs = strength.favourites(s);
    const words = norm(query).split(/\s+/).filter(Boolean);
    const list = strength.library(s)
      .filter((e) => !favOnly || favs.has(e.id))
      .filter((e) => !muscle || e.muscles.includes(muscle))
      .filter((e) => !onlyMine || strength.canDo(e, gear))
      .filter((e) => {
        if (!words.length) return true;
        const hay = norm(`${e.name} ${PATTERNS[e.pattern]} ${e.muscles.map(muscleName).join(' ')}`);
        return words.every((w) => hay.includes(w));
      });
    const groups = new Map();
    for (const e of list) {
      if (!groups.has(e.pattern)) groups.set(e.pattern, []);
      groups.get(e.pattern).push(e);
    }
    el.querySelectorAll('[data-muscle]').forEach((b) => b.classList.toggle('is-on', !favOnly && b.dataset.muscle === muscle));
    el.querySelector('[data-favonly]').classList.toggle('is-on', favOnly);
    el.querySelector('[data-count]').textContent = favOnly
      ? `${list.length} ${list.length === 1 ? 'favourite' : 'favourites'}. Your workouts use these first.`
      : `${list.length} ${list.length === 1 ? 'exercise' : 'exercises'}${muscle ? ` for ${muscleName(muscle).toLowerCase()}` : ''}${onlyMine ? ' you can do with your equipment' : ''}. Tap ☆ to make one a favourite: it comes up in your workouts more often.`;
    el.querySelector('[data-list]').innerHTML = [...groups.entries()].map(([pattern, items]) => `
      <h2 class="label">${esc(PATTERNS[pattern] || pattern)}</h2>
      <ul class="results">${items.map((e) => {
        const pics = pictures(e);
        const tags = [e.mine && 'yours', e.hidden && 'not used', !strength.canDo(e, gear) && 'no gear'].filter(Boolean);
        return `<li class="ex-li"><a class="result ex-row${e.hidden || !strength.canDo(e, gear) ? ' is-unavailable' : ''}" href="#/exercises/${encodeURIComponent(e.id)}">
          <span class="ex-thumb">${pics ? `<img src="${esc(pics.list[0])}" alt="" loading="lazy" onerror="this.remove()">` : bodyMap(e.muscles, { labels: false, className: 'mini' })}</span>
          <span class="row-text"><span class="row-title">${esc(e.name)}</span>
          <span class="row-meta">${esc(e.muscles.map(muscleName).join(', '))}${e.gear.length ? ` · ${esc(e.gear.map(gearName).join(', '))}` : ''}</span></span>
          ${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</a>${starButton(e.id, favs.has(e.id))}</li>`;
      }).join('')}</ul>`).join('') || `<p class="muted">${favOnly ? 'No favourites yet: tap ☆ next to an exercise.' : 'Nothing found. Try another muscle, or turn off “only what I can do”.'}</p>`;
  }

  el.addEventListener('click', (e) => {
    const star = e.target.closest('[data-fav]');
    if (star) {
      const on = toggleFavourite(star.dataset.fav);
      toast(on ? '★ Favourite: it comes up in your workouts more often' : 'Not a favourite any more');
      draw();
      return;
    }
    if (e.target.closest('[data-favonly]')) { favOnly = !favOnly; draw(); return; }
    const m = e.target.closest('[data-muscle]');
    if (m) { favOnly = false; muscle = m.dataset.muscle; local.set(MUSCLE_FILTER, muscle); draw(); return; }
    if (e.target.closest('[data-act="new"]')) exerciseForm(null, { onSave: (ex) => { location.hash = `#/exercises/${encodeURIComponent(ex.id)}`; } });
  });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-only]')) { onlyMine = e.target.checked; local.set(ONLY_MINE, onlyMine); draw(); }
  });
  let typing = null;
  el.querySelector('[data-q]').addEventListener('input', (e) => {
    query = e.target.value;
    clearTimeout(typing);
    typing = setTimeout(draw, 80);
  });
  draw();
  return { refresh: draw };
}

// ---------- One exercise ----------

export function exerciseView(el, { id }) {
  const exId = decodeURIComponent(id);

  function draw() {
    const s = model.settings();
    const ex = strength.find(s, exId);
    if (!ex) {
      el.innerHTML = '<p>That exercise isn’t in the library (any more). <a href="#/exercises">All exercises</a></p>';
      return;
    }
    const fav = strength.favourites(s).has(ex.id);
    el.innerHTML = `
      ${nav.backLink('#/exercises')}
      <p class="kicker">${esc(PATTERNS[ex.pattern] || ex.pattern)}${ex.mine ? ' · your own' : ''}</p>
      <h1>${esc(ex.name)}</h1>
      <div class="btn-row ex-actions">
        <button type="button" class="btn${fav ? ' btn-fav-on' : ''}" data-act="fav" aria-pressed="${fav}">${fav ? `${ICON.starFull} Favourite` : `${ICON.star} Favourite`}</button>
        <button type="button" class="btn" data-act="edit">Edit</button>
        <button type="button" class="btn btn-quiet" data-act="hide">${ex.hidden ? 'Use in my workouts again' : 'Don’t use in my workouts'}</button>
      </div>
      ${ex.hidden ? '<p class="box small">Sweaty doesn’t put this exercise in your workouts or offer it when you swap.</p>' : ''}
      ${exerciseInfo(s, ex)}`;
  }

  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const s = model.settings();
    const ex = strength.find(s, exId);
    if (!ex) return;
    if (act === 'fav') {
      const on = toggleFavourite(ex.id);
      toast(on ? '★ Favourite: it comes up in your workouts more often' : 'Not a favourite any more');
      draw();
    }
    if (act === 'edit') exerciseForm(ex, { onSave: draw, onDelete: () => nav.back('#/exercises') });
    if (act === 'hide') {
      saveExercise(ex, { hidden: !ex.hidden });
      toast(ex.hidden ? 'Back in your workouts' : 'Sweaty won’t use this one any more');
      draw();
    }
  });
  draw();
  return { refresh: draw };
}

// ---------- Saving your changes ----------

const EDITABLE = ['how', 'notes', 'video', 'photo', 'hidden'];

// Your own exercise: changed in place. A built-in one: your changes are kept next to it.
function saveExercise(ex, changes) {
  const s = model.settings();
  if (ex.mine) {
    const list = (s.myExercises || []).map((x) => (x.id === ex.id ? { ...x, ...changes } : x));
    store.saveSettings({ ...s, myExercises: list });
    return;
  }
  const original = ex.original || ex;
  const next = { ...(s.exerciseEdits?.[ex.id] || {}), ...changes };
  for (const k of EDITABLE) {
    if (next[k] === '' || next[k] === false || next[k] == null || (k === 'how' && next[k] === original.how)) delete next[k];
  }
  const edits = { ...(s.exerciseEdits || {}) };
  if (Object.keys(next).length) edits[ex.id] = next; else delete edits[ex.id];
  store.saveSettings({ ...s, exerciseEdits: edits });
}

// Add your own exercise (existing = null) or change one. For the built-in exercises you can
// change the explanation, add notes, a video and a picture, or keep it out of your workouts.
export function exerciseForm(existing, { onSave, onDelete } = {}) {
  const own = !existing || existing.mine;
  const x = existing || { pattern: 'core', gear: [], muscles: [] };
  let kind = x.time ? 'time' : 'reps';
  let photo = x.photo || '';
  const muscles = new Set(x.muscles);
  const gear = new Set(x.gear);
  const original = existing?.original;
  const dlg = sheet(`
    <h2>${!existing ? 'Your own exercise' : `Edit ${esc(x.name)}`}</h2>
    <form novalidate>
      ${own ? `
        <label class="field"><span class="label">Name</span><input name="name" value="${esc(x.name || '')}" placeholder="Wall push-up" required></label>
        <label class="field"><span class="label">Kind of exercise</span>
          <select name="pattern">${Object.entries(PATTERNS).map(([k, label]) => `<option value="${k}"${k === x.pattern ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>
          <span class="hint">Workouts pick exercises by kind. Yours shows up under Swap for the same kind.</span>
        </label>
        <div class="field"><span class="label">Muscles <span class="muted">(the first one you tap is the main one)</span></span><div class="chips">${MUSCLES.map(([k, label]) => `<button type="button" class="chip${muscles.has(k) ? ' is-on' : ''}" data-m="${k}">${esc(label)}</button>`).join('')}</div></div>
        <div class="field"><span class="label">Gear needed</span><div class="chips">${GEAR.map(([k, label]) => `<button type="button" class="chip${gear.has(k) ? ' is-on' : ''}" data-g="${k}">${esc(label)}</button>`).join('')}</div></div>
        <div class="field"><span class="label">You count</span>${seg('kind', kind, [['reps', 'Reps'], ['time', 'Seconds (a hold)']])}</div>
        <label class="check"><input type="checkbox" name="side"${x.side ? ' checked' : ''}> Done on each side</label>` : ''}
      <label class="field"><span class="label">How to do it</span><textarea name="how" rows="3">${esc(x.how || '')}</textarea></label>
      <label class="field"><span class="label">Your notes</span><textarea name="notes" rows="2" placeholder="Seat height 3, use the blue band, …">${esc(x.notes || '')}</textarea></label>
      <label class="field"><span class="label">Video</span><input name="video" type="url" inputmode="url" value="${esc(x.video || '')}" placeholder="A YouTube link: it plays right here">
        <span class="hint">Found a good video? Copy its link from YouTube (Share → Copy link) and paste it here.</span></label>
      <div class="field"><span class="label">Picture</span>
        <div class="photo-edit">
          <span class="photo-preview" data-preview>${picUrl(photo) ? `<img src="${esc(photo)}" alt="">` : ''}</span>
          <label class="btn btn-small">${ICON.plus} <span data-photo-label>${picUrl(photo) ? 'Change' : 'Add a picture'}</span><input type="file" accept="image/*" data-file hidden></label>
          <button type="button" class="btn btn-small btn-quiet" data-remove${picUrl(photo) ? '' : ' hidden'}>Remove</button>
        </div>
        <span class="hint" data-photo-status>${own ? '' : 'Your picture is shown instead of the drawing.'}</span>
      </div>
      <label class="check"><input type="checkbox" name="keepOut"${x.hidden ? ' checked' : ''}> Don’t use this one in my workouts</label>
      <p class="error" data-error hidden></p>
      <div class="btn-row">
        <button class="btn btn-primary">Save</button>
        ${!own && original ? '<button type="button" class="btn" data-reset>Back to the original</button>' : ''}
        ${own && existing ? '<button type="button" class="btn btn-danger" data-delete>Delete</button>' : ''}
        <button type="button" class="btn btn-quiet" data-close>Cancel</button>
      </div>
    </form>`);
  const form = dlg.querySelector('form');
  const err = dlg.querySelector('[data-error]');
  const order = [...x.muscles];
  wireSegs(form, (_n, v) => { kind = v; });

  dlg.addEventListener('click', (e) => {
    const m = e.target.closest('[data-m]');
    const g = e.target.closest('[data-g]');
    if (m) {
      const k = m.dataset.m;
      if (muscles.has(k)) { muscles.delete(k); order.splice(order.indexOf(k), 1); } else { muscles.add(k); order.push(k); }
      m.classList.toggle('is-on', muscles.has(k));
    }
    if (g) {
      const k = g.dataset.g;
      if (gear.has(k)) gear.delete(k); else gear.add(k);
      g.classList.toggle('is-on', gear.has(k));
    }
  });

  const showPhoto = () => {
    dlg.querySelector('[data-preview]').innerHTML = picUrl(photo) ? `<img src="${esc(photo)}" alt="">` : '';
    dlg.querySelector('[data-photo-label]').textContent = picUrl(photo) ? 'Change' : 'Add a picture';
    dlg.querySelector('[data-remove]').hidden = !picUrl(photo);
  };
  dlg.querySelector('[data-file]').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const status = dlg.querySelector('[data-photo-status]');
    status.textContent = 'Uploading…';
    try {
      photo = await store.uploadPhoto(file);
      status.textContent = 'Picture added. Save to keep it.';
      showPhoto();
    } catch (ex) {
      status.textContent = ex.message || 'Couldn’t add that picture.';
    }
  });
  dlg.querySelector('[data-remove]').addEventListener('click', () => { photo = ''; showPhoto(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const video = form.video.value.trim();
    if (video && !webUrl(video)) { err.textContent = 'The video should be a web link, starting with https://'; err.hidden = false; return; }
    const common = { how: form.how.value.trim(), notes: form.notes.value.trim(), video, photo, hidden: form.keepOut.checked };
    if (!own) {
      saveExercise(existing, { ...common, how: common.how || original?.how || existing.how });
      dlg.close();
      toast('Saved');
      onSave?.(strength.find(model.settings(), existing.id));
      return;
    }
    const name = form.name.value.trim();
    if (!name || !muscles.size) { err.textContent = 'Give it a name and pick at least one muscle.'; err.hidden = false; return; }
    const ex = {
      id: x.id || `my-${uuid().slice(0, 8)}`, name, pattern: form.pattern.value,
      gear: [...gear], muscles: order.filter((k) => muscles.has(k)), how: common.how || 'Your own exercise.',
      ...(kind === 'time' ? { time: x.time || [20, 45] } : {}), ...(form.side.checked ? { side: true } : {}),
      ...(common.notes ? { notes: common.notes } : {}), ...(video ? { video } : {}), ...(photo ? { photo } : {}),
      ...(common.hidden ? { hidden: true } : {}),
    };
    const s = model.settings();
    const list = (s.myExercises || []).filter((o) => o.id !== ex.id);
    store.saveSettings({ ...s, myExercises: [...list, ex] });
    dlg.close();
    toast(existing ? 'Saved' : 'Exercise added');
    onSave?.(ex);
  });

  dlg.querySelector('[data-reset]')?.addEventListener('click', () => {
    const s = model.settings();
    const edits = { ...(s.exerciseEdits || {}) };
    delete edits[existing.id];
    store.saveSettings({ ...s, exerciseEdits: edits });
    dlg.close();
    toast('Back to the original');
    onSave?.(strength.find(model.settings(), existing.id));
  });

  dlg.querySelector('[data-delete]')?.addEventListener('click', () => {
    if (!confirm(`Delete “${x.name}”? Workouts you already did keep it.`)) return;
    const s = model.settings();
    const swaps = Object.fromEntries(Object.entries(s.swaps || {}).filter(([, v]) => v !== x.id));
    store.saveSettings({ ...s, swaps, myExercises: (s.myExercises || []).filter((o) => o.id !== x.id) });
    dlg.close();
    toast('Exercise deleted');
    onDelete?.();
  });
}
