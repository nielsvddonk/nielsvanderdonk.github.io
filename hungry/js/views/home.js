import { listRecipes, allTags } from '../store.js';
import { esc, session } from '../lib/util.js';
import { recipeRow } from './parts.js';

export default async function home(el) {
  const recipes = await listRecipes();
  const tags = allTags(recipes);
  const recent = [...recipes].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);
  let pickTag = session.get('hungry.randomTag', '');
  if (pickTag && !tags.includes(pickTag)) pickTag = '';

  el.innerHTML = `
    <section class="home">
      <h1 class="home-title">What are we eating?</h1>
      <button class="btn btn-big" id="random" ${recipes.length ? '' : 'disabled'}>Random recipe</button>
      ${tags.length ? `
        <div class="chips chips-center" id="random-tags" aria-label="Pick random from">
          <button class="chip" data-tag="">anything</button>
          ${tags.map((t) => `<button class="chip" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}
        </div>` : ''}
      <p class="muted small" id="random-note"></p>

      <form id="search" class="home-search" role="search">
        <input type="search" name="q" placeholder="Search recipes or ingredients" autocomplete="off" aria-label="Search">
      </form>
    </section>

    ${recent.length ? `
      <section class="home-recent">
        <h2 class="label">Recently added</h2>
        <ul class="recipe-list">${recent.map(recipeRow).join('')}</ul>
      </section>` : ''}
  `;

  const chips = el.querySelector('#random-tags');
  const note = el.querySelector('#random-note');
  const pool = () => recipes.filter((r) => !pickTag || (r.tags || []).includes(pickTag));
  const markChips = () => {
    chips?.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c.dataset.tag === pickTag));
    note.textContent = pickTag ? `${pool().length} ${pickTag} recipes` : '';
  };
  markChips();

  chips?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    pickTag = chip.dataset.tag;
    session.set('hungry.randomTag', pickTag);
    markChips();
  });

  el.querySelector('#random').addEventListener('click', () => {
    const last = session.get('hungry.lastRandom');
    let options = pool();
    if (options.length > 1) options = options.filter((r) => r.id !== last); // no repeats in a row
    const pick = options[Math.floor(Math.random() * options.length)];
    if (!pick) return;
    session.set('hungry.lastRandom', pick.id);
    location.hash = '#/r/' + pick.id;
  });

  el.querySelector('#search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get('q').trim();
    location.hash = '#/archive' + (q ? '?q=' + encodeURIComponent(q) : '');
  });
}
