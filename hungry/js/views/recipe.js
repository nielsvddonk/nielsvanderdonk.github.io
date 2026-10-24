import { getRecipe, loadTicks, setTick, clearTicks, watchTicks, ticksAreShared } from '../store.js';
import { esc, paragraphs, nav, hash, debounce } from '../lib/util.js';
import { displayLine } from '../lib/ingredients.js';
import * as wake from '../lib/wakelock.js';
import { formatTime, formatDate } from './parts.js';

// Ticks are keyed by the text they belong to, so editing a recipe doesn't shuffle them.
const ingKey = (group, line) => 'i' + hash(group + '\n' + line);
const stepKey = (text) => 's' + hash(text);

function sourceHtml(source) {
  if (!source) return '';
  if (/^https?:\/\//i.test(source)) {
    let host = source;
    try { host = new URL(source).hostname.replace(/^www\./, ''); } catch { /* keep as is */ }
    return `<a href="${esc(source)}" target="_blank" rel="noopener">${esc(host)}</a>`;
  }
  return esc(source);
}

export default async function recipeView(el, { id, admin }) {
  const r = await getRecipe(id);
  if (!r) {
    el.innerHTML = '<p>Recipe not found. <a href="#/archive">Back to the archive</a></p>';
    return;
  }
  document.title = `${r.title} · Hungry`;
  el.classList.add('wide');

  const base = r.servings || 0;
  let servings = base;
  const added = formatDate(r.createdAt);
  const meta = [r.cook && `by ${esc(r.cook)}`, esc(formatTime(r.time)), sourceHtml(r.source), added && `added ${added}`]
    .filter(Boolean);

  el.innerHTML = `
    <article class="recipe" id="recipe">
      <div class="recipe-top">
        <button class="link" id="back">← Back</button>
        ${admin ? `<a class="link" href="#/edit/${esc(r.id)}">Edit</a>` : ''}
      </div>

      <header class="recipe-head">
        <h1>${esc(r.title)}</h1>
        ${meta.length ? `<p class="recipe-meta">${meta.join('<span class="dot">·</span>')}</p>` : ''}
        ${(r.tags || []).length ? `<p class="recipe-tags">${r.tags.map((t) =>
          `<a class="chip chip-small" href="#/archive?tags=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</p>` : ''}
      </header>

      ${r.image ? `<img class="recipe-image" src="${esc(r.image)}" alt="">` : ''}

      <div class="cook-bar">
        <label class="switch">
          <input type="checkbox" id="cook" role="switch">
          <span class="track" aria-hidden="true"></span>
          <span><strong>Cook mode</strong> <span class="muted small" id="cook-note">keeps your screen on</span></span>
        </label>
        ${base ? `
          <div class="servings" aria-label="Servings">
            <button class="icon-btn" id="less" aria-label="Fewer servings">−</button>
            <span id="serv"></span>
            <button class="icon-btn" id="more" aria-label="More servings">+</button>
          </div>` : ''}
      </div>

      <div class="recipe-body">
        <section class="ingredients-col">
          <div class="col-head">
            <h2 class="label">Ingredients</h2>
            <span class="col-tools small muted">
              <span id="tick-status"></span>
              <button class="link" id="clear" hidden>Clear ticks</button>
            </span>
          </div>
          <div id="ings"></div>
        </section>
        <section class="steps-col">
          <h2 class="label">Steps</h2>
          <ol class="steps" id="steps"></ol>
          ${r.notes ? `<h2 class="label">Notes</h2><div class="notes">${paragraphs(r.notes)}</div>` : ''}
        </section>
      </div>
    </article>
  `;

  const $ = (sel) => el.querySelector(sel);
  const article = $('#recipe');
  const ingsEl = $('#ings');
  const stepsEl = $('#steps');
  const clearBtn = $('#clear');
  const statusEl = $('#tick-status');

  // ---------- Ticks ----------
  // Shown instantly, saved in the background, and kept in sync with the other device.
  // If there's no signal (supermarket!) they stay ticked here and are saved later.
  let ticks = new Set();
  let shared = false;          // true when logged in online → ticks are shared live
  const unsaved = new Map();   // key → ticked?, waiting to be saved
  let version = 0;             // bumped on every change, so a slow fetch can't undo it
  let saving = false;
  let closed = false;          // left this page; pending saves still finish

  function applyTicks() {
    article.querySelectorAll('[data-key]').forEach((node) => {
      const on = ticks.has(node.dataset.key);
      if (node.type === 'checkbox') {
        node.checked = on;
        node.closest('.ing').classList.toggle('is-done', on);
      } else {
        node.classList.toggle('is-done', on);
      }
    });
    clearBtn.hidden = !article.querySelector('.is-done');
  }

  function showStatus(ok) {
    if (shared) statusEl.textContent = ok ? 'synced' : 'offline — will sync';
  }

  async function refresh() {
    if (closed) return;
    const v = version;
    let fresh;
    try { fresh = await loadTicks(r.id); } catch { showStatus(false); return; }
    if (closed || v !== version) return;
    ticks = new Set(fresh);
    for (const [key, on] of unsaved) on ? ticks.add(key) : ticks.delete(key);
    applyTicks();
    if (!unsaved.size) showStatus(true);
  }
  const refreshSoon = debounce(refresh, 250);

  async function save() {
    if (saving) return;
    saving = true;
    try {
      while (unsaved.size) {
        const [key, on] = unsaved.entries().next().value;
        await setTick(r.id, key, on);
        if (unsaved.get(key) === on) unsaved.delete(key);
        version++;
      }
      showStatus(true);
      if (shared) refreshSoon(); // pick up anything the other person ticked meanwhile
    } catch (err) {
      console.warn('Tick not saved yet:', err);
      showStatus(false);
    } finally {
      saving = false;
    }
  }

  function tick(key, on) {
    on ? ticks.add(key) : ticks.delete(key);
    unsaved.set(key, on);
    version++;
    applyTicks();
    save();
  }

  // ---------- Rendering ----------
  function renderIngredients() {
    const factor = base ? servings / base : 1;
    ingsEl.innerHTML = (r.ingredients || []).map((g) => `
      ${g.name ? `<h3 class="group-name">${esc(g.name)}</h3>` : ''}
      <ul class="ingredients">
        ${(g.items || []).map((line) => {
          const { amount, name } = displayLine(line, factor);
          return `<li><label class="ing">
            <input type="checkbox" data-key="${ingKey(g.name || '', line)}">
            <span class="ing-text">${amount ? `<span class="qty">${esc(amount)}</span> ` : ''}${esc(name)}</span>
          </label></li>`;
        }).join('')}
      </ul>`).join('') || '<p class="muted">No ingredients.</p>';
    const servEl = $('#serv');
    if (servEl) servEl.textContent = `${servings} ${servings === 1 ? 'serving' : 'servings'}`;
    applyTicks();
  }

  stepsEl.innerHTML = (r.steps || []).map((s, i) => `
    <li class="step" data-key="${stepKey(s)}" tabindex="0">
      <span class="step-num">${i + 1}</span>
      <div class="step-text">${paragraphs(s)}</div>
    </li>`).join('');
  renderIngredients();

  // ---------- Events ----------
  ingsEl.addEventListener('change', (e) => {
    if (e.target.dataset.key) tick(e.target.dataset.key, e.target.checked);
  });

  const toggleStep = (li) => tick(li.dataset.key, !ticks.has(li.dataset.key));
  stepsEl.addEventListener('click', (e) => {
    const li = e.target.closest('.step');
    if (li && !e.target.closest('a')) toggleStep(li);
  });
  stepsEl.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.step')) { e.preventDefault(); toggleStep(e.target); }
  });

  clearBtn.addEventListener('click', async () => {
    ticks.clear();
    unsaved.clear();
    version++;
    applyTicks();
    try { await clearTicks(r.id); showStatus(true); } catch { showStatus(false); }
  });

  $('#less')?.addEventListener('click', () => { if (servings > 1) { servings--; renderIngredients(); } });
  $('#more')?.addEventListener('click', () => { servings++; renderIngredients(); });

  $('#back').addEventListener('click', () => {
    if (nav.count > 1) history.back(); else location.hash = '#/archive';
  });

  const cook = $('#cook');
  const cookNote = $('#cook-note');
  if (!wake.supported) cookNote.textContent = 'not supported in this browser';
  cook.addEventListener('change', async () => {
    if (cook.checked) {
      const ok = await wake.enable();
      if (!ok) cookNote.textContent = 'could not keep the screen on in this browser';
      article.classList.add('cook-mode');
    } else {
      await wake.disable();
      article.classList.remove('cook-mode');
    }
  });

  // ---------- Stay in sync ----------
  ticksAreShared().then((s) => { shared = s; refresh(); });

  let stopWatching = () => {};
  watchTicks(r.id, refreshSoon)
    .then((stop) => { if (closed) stop(); else stopWatching = stop; })
    .catch((err) => console.warn('Live ticks unavailable:', err));

  // Phones drop live connections in the background: catch up when you come back.
  const onReturn = () => {
    if (document.visibilityState !== 'visible') return;
    save();
    refreshSoon();
  };
  document.addEventListener('visibilitychange', onReturn);
  window.addEventListener('online', onReturn);

  return {
    cleanup() {
      closed = true;
      stopWatching();
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('online', onReturn);
      wake.disable();
    },
  };
}
