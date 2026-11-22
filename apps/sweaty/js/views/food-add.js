// Adding food: search the built-in list and your own foods as you type, tap one, pick how much.
// Not in there? Search packaged products online, type the calories yourself, or create a food.

import * as store from '../store.js';
import * as model from '../model.js';
import * as fs from '../foodsearch.js';
import { dayName, esc, fmt, num, uuid } from '../util.js';
import { ICON, seg, sheet, toast, wireSegs } from './parts.js';

// A number for inside an input: no thousands separator ("1000", not "1,000").
const plain = (n, digits = 1) => String(Math.round(n * 10 ** digits) / 10 ** digits);

// How much of a food? Count portions or type grams; shows the kcal as you go.
// onSave gets what to log: { name, kcal, p, amount, g, count, ref, food }.
export function amountSheet(food, { initial = {}, saveLabel = 'Add', onSave, onDelete } = {}) {
  const portion = food.portion;
  const grams = fs.hasGrams(food);
  let mode = initial.grams != null && grams && !(initial.count && portion) ? 'grams' : portion ? 'count' : 'grams';
  let count = initial.count ?? 1;
  let g = initial.grams ?? (portion?.g ? portion.g * count : 100);
  const unit = food.unit || 'g';
  const dlg = sheet(`
    <h2>${esc(food.name)}</h2>
    <p class="muted small">${esc(fs.describe(food))}</p>
    ${portion ? `<div class="chips">${[0.5, 1, 1.5, 2, 3].map((c) => `<button type="button" class="chip" data-count="${c}">${esc(fs.portionText(portion.name, c))}</button>`).join('')}</div>` : ''}
    <div class="amount-row">
      ${portion ? `<label class="field"><span class="label">How many</span><span class="with-unit"><input name="count" inputmode="decimal" value="${plain(count, 2)}"><span>${esc(portion.name)}</span></span></label>` : ''}
      ${grams ? `<label class="field"><span class="label">${portion ? 'Or' : 'How much'}</span><span class="with-unit"><input name="g" inputmode="decimal" value="${plain(g, 1)}"><span>${unit}</span></span></label>` : ''}
    </div>
    <p class="amount-kcal"><b data-kcal></b> kcal <span class="muted" data-prot></span></p>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" data-save>${esc(saveLabel)}</button>
      ${onDelete ? '<button type="button" class="btn btn-danger" data-delete>Delete</button>' : ''}
      <button type="button" class="btn btn-quiet" data-close>Cancel</button>
    </div>`);
  const countIn = dlg.querySelector('[name="count"]');
  const gIn = dlg.querySelector('[name="g"]');
  const current = () => fs.measure(food, mode === 'grams' ? { grams: g } : { count });
  const show = () => {
    const m = current();
    dlg.querySelector('[data-kcal]').textContent = fmt(m.kcal);
    dlg.querySelector('[data-prot]').textContent = m.p ? `· ${fmt(m.p, 1)} g protein` : '';
    dlg.querySelectorAll('[data-count]').forEach((b) => b.classList.toggle('is-on', mode === 'count' && Number(b.dataset.count) === count));
  };
  countIn?.addEventListener('input', () => {
    const c = num(countIn.value);
    if (c == null || c < 0) return;
    count = c;
    mode = 'count';
    if (gIn && portion?.g) gIn.value = plain(portion.g * c, 1);
    if (portion?.g) g = portion.g * c;
    show();
  });
  gIn?.addEventListener('input', () => {
    const v = num(gIn.value);
    if (v == null || v < 0) return;
    g = v;
    mode = 'grams';
    if (countIn && portion?.g) { count = v / portion.g; countIn.value = plain(count, 2); }
    show();
  });
  dlg.addEventListener('click', (e) => {
    const c = e.target.closest('[data-count]');
    if (c) {
      count = Number(c.dataset.count);
      mode = 'count';
      if (countIn) countIn.value = plain(count, 2);
      if (gIn && portion?.g) { g = portion.g * count; gIn.value = plain(g, 1); }
      show();
    }
  });
  dlg.querySelector('[data-save]').addEventListener('click', () => {
    const m = current();
    if (!(m.kcal >= 0) || (mode === 'grams' ? !(g > 0) : !(count > 0))) return;
    dlg.close();
    onSave({
      name: food.name, kcal: Math.round(m.kcal), p: Math.round(m.p * 10) / 10, amount: m.amount,
      g: m.g ? Math.round(m.g * 10) / 10 : null, count: m.count ? Math.round(m.count * 100) / 100 : null,
      ref: food.key || null, food: fs.foodInfo(food), by: mode,
    });
  });
  dlg.querySelector('[data-delete]')?.addEventListener('click', () => { dlg.close(); onDelete(); });
  show();
  return dlg;
}

// Just a number of calories (and maybe protein) — for a meal out, or anything not in the list.
export function manualSheet({ initial = {}, saveLabel = 'Add', onSave, onDelete } = {}) {
  const dlg = sheet(`
    <h2>${initial.name ? esc(initial.name) : 'Calories'}</h2>
    <form>
      <label class="field"><span class="label">What</span><input name="name" value="${esc(initial.name || '')}" placeholder="Lunch at work"></label>
      <div class="amount-row">
        <label class="field"><span class="label">Calories</span><span class="with-unit"><input name="kcal" inputmode="numeric" value="${initial.kcal ?? ''}" placeholder="600" required><span>kcal</span></span></label>
        <label class="field"><span class="label">Protein</span><span class="with-unit"><input name="p" inputmode="decimal" value="${initial.p || ''}" placeholder="optional"><span>g</span></span></label>
      </div>
      ${onDelete ? '' : '<label class="check"><input type="checkbox" name="keep"> Save as one of my foods, for next time</label>'}
      <p class="error" data-error hidden></p>
      <div class="btn-row">
        <button class="btn btn-primary">${esc(saveLabel)}</button>
        ${onDelete ? '<button type="button" class="btn btn-danger" data-delete>Delete</button>' : ''}
        <button type="button" class="btn btn-quiet" data-close>Cancel</button>
      </div>
    </form>`);
  const form = dlg.querySelector('form');
  form.kcal.focus();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const kcal = num(form.kcal.value);
    const name = form.name.value.trim();
    const err = dlg.querySelector('[data-error]');
    if (kcal == null || kcal < 0) { err.textContent = 'How many calories?'; err.hidden = false; return; }
    if (form.keep?.checked && !name) { err.textContent = 'Give it a name, to find it next time.'; err.hidden = false; return; }
    const p = num(form.p.value) || 0;
    let ref = null;
    if (form.keep?.checked) {
      const id = uuid();
      const s = model.settings();
      store.saveSettings({ ...s, myFoods: [...(s.myFoods || []), { id, name, kPortion: kcal, pPortion: p, portion: { name: 'portion' }, unit: 'g' }] });
      ref = `m:${id}`;
    }
    dlg.close();
    onSave({ name: name || 'Calories', kcal: Math.round(kcal), p, amount: '', g: null, count: 1, ref, food: null });
  });
  dlg.querySelector('[data-delete]')?.addEventListener('click', () => { dlg.close(); onDelete(); });
  return dlg;
}

// Create or change one of your own foods (from a label: per 100 g, or per portion).
export function foodForm(existing, { onSave, onDelete } = {}) {
  const f = existing || {};
  let per = f.kPortion != null && f.k100 == null ? 'portion' : '100';
  const dlg = sheet(`
    <h2>${f.id ? 'Change food' : 'Create a food'}</h2>
    <form>
      <label class="field"><span class="label">Name</span><input name="name" value="${esc(f.name || '')}" placeholder="My protein oats" required></label>
      <div class="field"><span class="label">Calories are</span>${seg('per', per, [['100', 'per 100 g'], ['portion', 'per portion']])}</div>
      <div class="amount-row">
        <label class="field"><span class="label">Calories</span><span class="with-unit"><input name="kcal" inputmode="decimal" value="${f.k100 ?? f.kPortion ?? ''}" required><span>kcal</span></span></label>
        <label class="field"><span class="label">Protein</span><span class="with-unit"><input name="p" inputmode="decimal" value="${f.p100 ?? f.pPortion ?? ''}" placeholder="optional"><span>g</span></span></label>
      </div>
      <div class="amount-row">
        <label class="field"><span class="label">A portion is called</span><input name="portion" value="${esc(f.portion?.name || '')}" placeholder="bowl"></label>
        <label class="field" data-grams><span class="label">and weighs</span><span class="with-unit"><input name="g" inputmode="decimal" value="${f.portion?.g ?? ''}" placeholder="optional"><span>g</span></span></label>
      </div>
      <p class="error" data-error hidden></p>
      <div class="btn-row">
        <button class="btn btn-primary">Save</button>
        ${onDelete ? '<button type="button" class="btn btn-danger" data-delete>Delete</button>' : ''}
        <button type="button" class="btn btn-quiet" data-close>Cancel</button>
      </div>
    </form>`);
  const form = dlg.querySelector('form');
  const sync = () => { dlg.querySelector('[data-grams]').hidden = per !== '100'; };
  wireSegs(form, (_name, value) => { per = value; sync(); });
  sync();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const kcal = num(form.kcal.value);
    const err = dlg.querySelector('[data-error]');
    if (!name || kcal == null || kcal < 0) { err.textContent = 'Fill in a name and the calories.'; err.hidden = false; return; }
    const p = num(form.p.value) || 0;
    const portionName = form.portion.value.trim() || (per === '100' ? '' : 'portion');
    const grams = num(form.g.value);
    const food = per === '100'
      ? { id: f.id || uuid(), name, k100: kcal, p100: p, portion: portionName ? { name: portionName, g: grams || 100 } : null, unit: 'g' }
      : { id: f.id || uuid(), name, kPortion: kcal, pPortion: p, portion: { name: portionName }, unit: 'g' };
    const s = model.settings();
    const list = (s.myFoods || []).filter((x) => x.id !== food.id);
    store.saveSettings({ ...s, myFoods: [...list, food] });
    dlg.close();
    onSave?.(food);
  });
  dlg.querySelector('[data-delete]')?.addEventListener('click', () => {
    if (!confirm(`Delete “${f.name}” from your foods? Days you already logged it stay as they are.`)) return;
    const s = model.settings();
    store.saveSettings({ ...s, myFoods: (s.myFoods || []).filter((x) => x.id !== f.id) });
    dlg.close();
    onDelete?.();
  });
  return dlg;
}

// A logged food → a food again (to log it once more, or change its amount).
export function foodFromEntry(data) {
  if (!data.food) return null;
  return { key: data.ref, name: data.name, ...data.food };
}

export default function foodAddView(el, { date }) {
  const back = `#/food/${date}`;
  let shown = new Map(); // key → food, for the rows on screen
  let online = null;     // { query, list } or { query, error } or { query, loading }
  let added = { n: 0, kcal: 0 };

  el.innerHTML = `
    <div class="add-top">
      <a class="btn btn-quiet btn-small" href="${back}">${ICON.left} ${esc(dayName(date))}</a>
      <span class="muted small" id="added" aria-live="polite"></span>
      <a class="btn btn-primary btn-small" href="${back}">Done</a>
    </div>
    <h1 class="sr">Add food</h1>
    <div class="search">
      <input id="q" type="search" placeholder="Search: apple, kwark, pasta…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Search for a food">
    </div>
    <div id="results"></div>
    <div class="add-more">
      <button type="button" class="btn" data-act="manual">Just calories</button>
      <button type="button" class="btn" data-act="create">Create a food</button>
    </div>`;
  const q = el.querySelector('#q');
  const results = el.querySelector('#results');

  function log(entry) {
    store.put({ day: date, kind: 'food', data: { ...entry, at: Date.now() } });
    added = { n: added.n + 1, kcal: added.kcal + entry.kcal };
    el.querySelector('#added').textContent = `${added.n} added · ${fmt(added.kcal)} kcal`;
    toast(`Added ${entry.name} · ${fmt(entry.kcal)} kcal`);
    q.value = '';
    online = null;
    draw();
  }

  const row = (f, extra = '') => {
    shown.set(f.key, f);
    return `<li><button type="button" class="result" data-key="${esc(f.key)}">
      <span class="row-text"><span class="row-title">${esc(f.name)}</span><span class="row-meta">${esc(extra || fs.describe(f))}</span></span>
      ${f.source === 'mine' ? '<span class="tag">mine</span>' : ''}</button></li>`;
  };

  function draw() {
    shown = new Map();
    const s = model.settings();
    const query = q.value.trim();
    const mine = fs.mine(s);
    let html = '';
    if (!query) {
      const recent = model.recentFoods(12);
      if (recent.length) {
        html += `<h2 class="label">Recent</h2><ul class="results">${recent.map((data, j) => {
          const key = `recent:${j}`;
          shown.set(key, { recent: data });
          return `<li><button type="button" class="result" data-key="${key}"><span class="row-text"><span class="row-title">${esc(data.name)}</span><span class="row-meta">${esc(data.amount || '')}${data.amount ? ' · ' : ''}${fmt(data.kcal)} kcal</span></span></button></li>`;
        }).join('')}</ul>`;
      }
      if (mine.length) html += `<h2 class="label">My foods</h2><ul class="results">${mine.map((f) => row(f)).join('')}</ul>`;
      if (!html) html = '<p class="muted">Type what you ate. Sweaty knows about 350 everyday foods, in English and Dutch.</p>';
    } else {
      const found = fs.search(query, [...mine, ...fs.builtIn], model.foodFreq());
      html += found.length ? `<ul class="results">${found.map((f) => row(f)).join('')}</ul>` : `<p class="muted">“${esc(query)}” isn’t in the list.</p>`;
      if (online?.query === query) {
        if (online.loading) html += '<p class="muted">Searching online…</p>';
        else if (online.error) html += `<p class="error">${esc(online.error)}</p>`;
        else {
          html += `<h2 class="label">Online · Open Food Facts</h2>`;
          html += online.list.length ? `<ul class="results">${online.list.map((f) => row(f)).join('')}</ul>` : '<p class="muted">Nothing found online either. Add the calories yourself.</p>';
        }
      } else {
        html += `<p><button type="button" class="btn btn-wide" data-act="online">Search “${esc(query)}” in shop products online</button></p>`;
      }
    }
    results.innerHTML = html;
  }

  async function searchOnline() {
    const query = q.value.trim();
    if (!query) return;
    online = { query, loading: true };
    draw();
    try {
      const list = await fs.searchOnline(query);
      if (q.value.trim() === query) { online = { query, list }; draw(); }
    } catch {
      if (q.value.trim() === query) { online = { query, error: 'Couldn’t reach Open Food Facts. Check your connection, or add the calories yourself.' }; draw(); }
    }
  }

  let typing = null;
  q.addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(draw, 80); });
  q.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const first = results.querySelector('[data-key]');
    if (first && !first.dataset.key.startsWith('recent:')) first.click();
    else searchOnline();
  });

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-key], [data-act]');
    if (!b) return;
    if (b.dataset.act === 'online') { searchOnline(); return; }
    if (b.dataset.act === 'manual') { manualSheet({ initial: { name: q.value.trim() }, onSave: log }); return; }
    if (b.dataset.act === 'create') {
      foodForm({ name: q.value.trim() }, { onSave: (food) => amountSheet(fs.mine({ myFoods: [food] })[0], { onSave: log }) });
      return;
    }
    const item = shown.get(b.dataset.key);
    if (!item) return;
    if (item.recent) {
      const food = foodFromEntry(item.recent);
      if (food) amountSheet(food, { initial: item.recent.by === 'grams' ? { grams: item.recent.g } : { count: item.recent.count ?? 1 }, onSave: log });
      else manualSheet({ initial: item.recent, onSave: log });
      return;
    }
    amountSheet(item, { onSave: log });
  });

  draw();
  q.focus();
}
