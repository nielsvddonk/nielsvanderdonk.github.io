// "Plan the week": type what's in the veggie box, get recipes that use it up.

import { listRecipes, allIngredientNames } from '../store.js';
import { esc, local } from '../lib/util.js';
import { ingredientName } from '../lib/ingredients.js';
import { planWeek } from '../lib/planner.js';

const KEY = 'hungry.plan';

export default async function planner(el) {
  const recipes = await listRecipes();
  const saved = local.get(KEY, { box: [], count: 3 });
  let box = saved.box;
  let count = saved.count;
  let result = null;
  let index = 0;
  const persist = () => local.set(KEY, { box, count });

  document.title = 'Plan the week · Hungry';
  el.innerHTML = `
    <h1>Plan the week</h1>
    <p class="muted">Add what's in the veggie box. Hungry picks recipes that use it up — each vegetable is only counted for one recipe.</p>

    <form class="inline-add" id="add">
      <input id="ing" list="known" placeholder="e.g. carrots, leek, kale" autocomplete="off" enterkeyhint="done" aria-label="Ingredient">
      <button class="btn">Add</button>
    </form>
    <datalist id="known">${allIngredientNames(recipes).map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="chips" id="box"></div>

    <div class="field">
      <span class="label">How many recipes?</span>
      <div class="seg" id="count">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
    </div>

    <button class="btn btn-primary" id="go">Find recipes</button>
    <div id="result" class="plan-result" aria-live="polite"></div>
  `;

  const $ = (sel) => el.querySelector(sel);

  function renderBox() {
    $('#box').innerHTML = box.length
      ? box.map((b, i) => `<span class="chip is-on">${esc(b)}<button type="button" data-remove="${i}" aria-label="Remove ${esc(b)}">×</button></span>`).join('')
        + '<button type="button" class="link small muted" id="clear">Clear all</button>'
      : '';
  }
  function renderCount() {
    $('#count').querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.n) === count));
  }

  function renderResult() {
    const out = $('#result');
    if (!result) { out.innerHTML = ''; return; }
    if (!result.plans.length) {
      out.innerHTML = '<p>No recipes in the archive use these ingredients yet.</p>';
      return;
    }
    // Show what the user typed ("Carrots") rather than the internal name ("carrot").
    const label = (name) => box.find((b) => ingredientName(b) === name) || name;
    const plan = result.plans[index];
    const missing = count - plan.picks.length;

    out.innerHTML = `
      <h2>Your week</h2>
      <ol class="plan">
        ${plan.picks.map((p) => `
          <li>
            <a class="plan-title" href="#/r/${esc(p.recipe.id)}">${esc(p.recipe.title)}</a>
            <p class="small">Uses ${p.uses.map((u) => `<strong>${esc(label(u))}</strong>`).join(', ')}</p>
            ${p.extras.length ? `
              <details>
                <summary class="small muted">Also needed (${p.extras.length})</summary>
                <ul class="small extras">${p.extras.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
              </details>` : ''}
          </li>`).join('')}
      </ol>
      ${missing > 0 ? `<p class="small muted">Only found ${plan.picks.length} recipe${plan.picks.length === 1 ? '' : 's'} that use${plan.picks.length === 1 ? 's' : ''} your box. More recipes in the archive = better plans.</p>` : ''}
      ${plan.left.length ? `<p class="small">Not used: ${plan.left.map((u) => esc(label(u))).join(', ')}</p>` : ''}
      <div class="btn-row">
        ${result.plans.length > 1 ? `<button class="btn" id="another">Another combination (${index + 1}/${result.plans.length})</button>` : ''}
        <button class="btn btn-quiet" id="copy">Copy shopping list</button>
      </div>
    `;
  }

  function run() {
    result = box.length ? planWeek(recipes, box, count) : null;
    index = 0;
    renderResult();
    if (!box.length) $('#result').innerHTML = '<p class="muted">Add a few ingredients first.</p>';
  }

  $('#add').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#ing');
    const known = new Set(box.map(ingredientName));
    for (const raw of input.value.split(/[,\n]/)) {
      const term = raw.trim();
      const name = ingredientName(term);
      if (term && name && !known.has(name)) { box.push(term); known.add(name); }
    }
    input.value = '';
    persist();
    renderBox();
    if (result) run();
  });

  $('#box').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) box.splice(Number(rm.dataset.remove), 1);
    else if (e.target.id === 'clear') box = [];
    else return;
    persist();
    renderBox();
    if (result) run();
  });

  $('#count').addEventListener('click', (e) => {
    const b = e.target.closest('[data-n]');
    if (!b) return;
    count = Number(b.dataset.n);
    persist();
    renderCount();
    if (result) run();
  });

  $('#go').addEventListener('click', run);

  $('#result').addEventListener('click', async (e) => {
    if (e.target.id === 'another') {
      index = (index + 1) % result.plans.length;
      renderResult();
    }
    if (e.target.id === 'copy') {
      const plan = result.plans[index];
      const text = plan.picks.map((p) =>
        `${p.recipe.title}\n${p.extras.map((x) => `- ${x}`).join('\n') || '- (nothing extra)'}`).join('\n\n');
      try {
        await navigator.clipboard.writeText(text);
        e.target.textContent = 'Copied!';
      } catch {
        prompt('Copy your shopping list:', text);
      }
    }
  });

  renderBox();
  renderCount();
}
