import { listRecipes, allTags } from '../store.js';
import { esc, debounce } from '../lib/util.js';
import { searchRecipes, SORTS } from '../lib/search.js';
import { recipeRow } from './parts.js';

export default async function archive(el, { params }) {
  const recipes = await listRecipes();
  const tags = allTags(recipes);
  let q = params.get('q') || '';
  const active = new Set((params.get('tags') || '').split(',').filter((t) => tags.includes(t)));
  let sort = SORTS[params.get('sort')] ? params.get('sort') : 'az';

  document.title = 'Archive · Hungry';
  el.innerHTML = `
    <h1>Archive</h1>
    <input type="search" id="q" class="search-input" placeholder="Search title, ingredient, cook…"
      value="${esc(q)}" autocomplete="off" aria-label="Search">
    ${tags.length ? `<div class="chips" id="tags">
      ${tags.map((t) => `<button class="chip" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}
    </div>` : ''}
    <div class="list-meta">
      <span id="count" class="muted"></span>
      <label class="sort">Sort
        <select id="sort">${Object.entries(SORTS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('')}</select>
      </label>
    </div>
    <ul class="recipe-list" id="list"></ul>
  `;

  const list = el.querySelector('#list');
  const count = el.querySelector('#count');
  const sortSelect = el.querySelector('#sort');
  sortSelect.value = sort;

  function update() {
    const found = searchRecipes(recipes, q, active).sort(SORTS[sort].fn);
    count.textContent = `${found.length} ${found.length === 1 ? 'recipe' : 'recipes'}`;
    list.innerHTML = found.length
      ? found.map(recipeRow).join('')
      : `<li class="empty">Nothing found.${active.size || q ? ' Try fewer filters.' : ''}</li>`;
    el.querySelectorAll('#tags .chip').forEach((c) => c.classList.toggle('is-on', active.has(c.dataset.tag)));

    // Keep filters in the URL so "Back" from a recipe returns to the same view.
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (active.size) p.set('tags', [...active].join(','));
    if (sort !== 'az') p.set('sort', sort);
    history.replaceState(null, '', '#/archive' + (p.toString() ? '?' + p : ''));
  }

  el.querySelector('#q').addEventListener('input', debounce((e) => { q = e.target.value; update(); }, 120));
  el.querySelector('#tags')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const t = chip.dataset.tag;
    active.has(t) ? active.delete(t) : active.add(t);
    update();
  });
  sortSelect.addEventListener('change', () => { sort = sortSelect.value; update(); });

  update();
}
