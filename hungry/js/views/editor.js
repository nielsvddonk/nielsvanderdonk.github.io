// Add / edit a recipe. Used for both #/new and #/edit/<id>.

import { listRecipes, saveRecipe, deleteRecipe, uploadImage, allTags, allCooks, fetchPage, fetchImage } from '../store.js';
import { esc, unique } from '../lib/util.js';
import { recipeFromHtml, recipeFromText, asUrl } from '../lib/importer.js';

const DEFAULT_TAGS = ['pasta', 'rice', 'noodles', 'soup', 'curry', 'salad', 'meat', 'chicken', 'fish',
  'vegetarian', 'vegan', 'breakfast', 'lunch', 'dessert', 'baking', 'snack', 'quick',
  'japanese', 'italian', 'indian', 'thai', 'mexican', 'korean', 'chinese'];

const toInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : null; };

function autogrow(t) {
  t.style.height = 'auto';
  t.style.height = t.scrollHeight + 2 + 'px';
}

export default async function editor(el, { id }) {
  const recipes = await listRecipes();
  const existing = id ? recipes.find((r) => r.id === id) : null;
  if (id && !existing) {
    el.innerHTML = '<p>Recipe not found. <a href="#/archive">Back to the archive</a></p>';
    return;
  }

  const r = existing ? structuredClone(existing) : {};
  const groups = r.ingredients?.length ? r.ingredients.map((g) => ({ name: g.name || '', text: (g.items || []).join('\n') })) : [{ name: '', text: '' }];
  const steps = r.steps?.length ? [...r.steps] : [''];
  const tags = new Set(r.tags || []);
  const tagOptions = () => unique([...DEFAULT_TAGS, ...allTags(recipes), ...tags]).sort();
  let image = r.image || '';
  let imageFile = null;
  let previewUrl = '';
  let dirty = false;

  document.title = (existing ? 'Edit' : 'New recipe') + ' · Hungry';
  el.innerHTML = `
    <form class="editor" id="form" novalidate>
      <h1>${existing ? 'Edit recipe' : 'New recipe'}</h1>

      ${existing ? '' : `
        <div class="field import-box">
          <span class="label">Import <span class="muted">— paste a link, or the recipe text itself</span></span>
          <div class="inline-add">
            <textarea id="import-input" rows="1" placeholder="https://www.bbcgoodfood.com/recipes/…" autocomplete="off"></textarea>
            <button type="button" class="btn" id="import-btn">Import</button>
          </div>
          <p class="hint" id="import-status" hidden></p>
        </div>`}

      <label class="field">
        <span class="label">Title</span>
        <input name="title" value="${esc(r.title)}" placeholder="e.g. Miso aubergine" autocomplete="off">
      </label>

      <div class="field-row">
        <label class="field">
          <span class="label">Cook</span>
          <input name="cook" list="cooks" value="${esc(r.cook)}" placeholder="Who makes this?" autocomplete="off">
        </label>
        <label class="field field-small">
          <span class="label">Servings</span>
          <input name="servings" type="number" min="1" inputmode="numeric" value="${r.servings ?? ''}">
        </label>
        <label class="field field-small">
          <span class="label">Time (min)</span>
          <input name="time" type="number" min="0" inputmode="numeric" value="${r.time ?? ''}">
        </label>
      </div>
      <datalist id="cooks">${allCooks(recipes).map((c) => `<option value="${esc(c)}">`).join('')}</datalist>

      <label class="field">
        <span class="label">Source <span class="muted">— link or book, optional</span></span>
        <input name="source" value="${esc(r.source)}" placeholder="https://… or Ottolenghi Simple, p. 42" autocomplete="off">
      </label>

      <div class="field">
        <span class="label">Tags <span class="muted">— used for the filters</span></span>
        <div class="chips" id="tag-chips"></div>
        <div class="inline-add">
          <input id="new-tag" placeholder="New tag" autocomplete="off" enterkeyhint="done">
          <button type="button" class="btn" id="add-tag">Add</button>
        </div>
      </div>

      <div class="field">
        <span class="label">Photo <span class="muted">— optional</span></span>
        <div id="image-box"></div>
        <input type="file" accept="image/*" id="image-input" hidden>
      </div>

      <div class="field">
        <span class="label">Ingredients</span>
        <p class="hint">One per line, like “2 carrots” or “200 g spaghetti”. Add a group for things like a sauce or marinade.</p>
        <div id="groups"></div>
        <button type="button" class="btn" id="add-group">+ Add group</button>
      </div>

      <div class="field">
        <span class="label">Steps</span>
        <ol class="step-edit" id="steps"></ol>
        <div class="btn-row">
          <button type="button" class="btn" id="add-step">+ Add step</button>
          <button type="button" class="btn btn-quiet" id="paste-toggle">Paste many at once</button>
        </div>
        <div class="paste-box" id="paste-box" hidden>
          <textarea id="paste-text" rows="6" placeholder="Paste the method here. Every line becomes a step; numbers like “1.” are removed."></textarea>
          <div class="btn-row">
            <button type="button" class="btn" id="paste-apply">Add as steps</button>
            <button type="button" class="btn btn-quiet" id="paste-cancel">Cancel</button>
          </div>
        </div>
      </div>

      <label class="field">
        <span class="label">Notes <span class="muted">— optional</span></span>
        <textarea name="notes" rows="3" placeholder="Tips, variations, what we'd change next time…">${esc(r.notes)}</textarea>
      </label>

      <p class="error" id="error" hidden></p>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" id="save">Save recipe</button>
        <a class="btn btn-quiet" href="${existing ? '#/r/' + esc(id) : '#/'}">Cancel</a>
        ${existing ? '<button type="button" class="btn btn-danger" id="delete">Delete</button>' : ''}
      </div>
    </form>
  `;

  const form = el.querySelector('#form');
  const $ = (sel) => el.querySelector(sel);

  // ----- Tags -----
  function renderTags() {
    $('#tag-chips').innerHTML = tagOptions().map((t) =>
      `<button type="button" class="chip${tags.has(t) ? ' is-on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
  }
  function addTag() {
    const input = $('#new-tag');
    const t = input.value.trim().toLowerCase();
    if (t) { tags.add(t); dirty = true; renderTags(); }
    input.value = '';
  }
  $('#tag-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const t = chip.dataset.tag;
    tags.has(t) ? tags.delete(t) : tags.add(t);
    chip.classList.toggle('is-on', tags.has(t));
    dirty = true;
  });
  $('#add-tag').addEventListener('click', addTag);
  $('#new-tag').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });

  // ----- Photo -----
  function renderImage() {
    const src = previewUrl || image;
    $('#image-box').innerHTML = src
      ? `<img class="image-preview" src="${esc(src)}" alt="">
         <div class="btn-row">
           <button type="button" class="btn" data-pick>Change photo</button>
           <button type="button" class="btn btn-quiet" data-remove-image>Remove</button>
         </div>`
      : '<button type="button" class="btn" data-pick>+ Add a photo</button>';
  }
  $('#image-box').addEventListener('click', (e) => {
    if (e.target.closest('[data-pick]')) $('#image-input').click();
    if (e.target.closest('[data-remove-image]')) {
      image = ''; imageFile = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = '';
      dirty = true;
      renderImage();
    }
  });
  function setPhoto(file) {
    imageFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    dirty = true;
    renderImage();
  }
  $('#image-input').addEventListener('change', (e) => {
    if (e.target.files[0]) setPhoto(e.target.files[0]);
    e.target.value = '';
  });

  // ----- Import from a link or pasted text -----
  const importInput = $('#import-input');
  const importStatus = $('#import-status');
  const showImportStatus = (msg, isError = false) => {
    importStatus.textContent = msg;
    importStatus.hidden = !msg;
    importStatus.classList.toggle('error', isError);
  };

  function fill(d) {
    const f = form.elements;
    if (d.title) f.title.value = d.title;
    if (d.servings) f.servings.value = d.servings;
    if (d.time) f.time.value = d.time;
    if (d.source) f.source.value = d.source;
    if (d.notes) f.notes.value = d.notes;
    const known = new Set(tagOptions());
    d.tagHints.filter((t) => known.has(t)).forEach((t) => tags.add(t)); // only tags you already use
    if (d.ingredients.length) groups.splice(0, groups.length, ...d.ingredients.map((g) => ({ name: g.name, text: g.items.join('\n') })));
    if (d.steps.length) steps.splice(0, steps.length, ...d.steps);
    renderTags();
    renderGroups();
    renderSteps();
    form.querySelectorAll('textarea').forEach(autogrow);
    dirty = true;
  }

  async function runImport() {
    const input = importInput.value.trim();
    if (!input) return;
    const url = asUrl(input);
    $('#import-btn').disabled = true;
    showImportStatus(url ? 'Fetching the recipe…' : 'Reading the text…');
    try {
      let draft;
      if (url) {
        const page = await fetchPage(url);
        draft = recipeFromHtml(page.html, page.url || url);
      } else {
        draft = recipeFromText(input);
      }
      if (!draft || (!draft.ingredients.length && !draft.steps.length)) {
        throw new Error(url
          ? 'Couldn’t find a recipe on that page. Copy the recipe text and paste it here instead.'
          : 'Couldn’t find ingredients or steps. Put them under headings like “Ingredients” and “Method”.');
      }
      fill(draft);
      const count = draft.ingredients.reduce((n, g) => n + g.items.length, 0);
      const from = url ? ` from ${new URL(draft.source).hostname.replace(/^www\./, '')}` : '';
      showImportStatus(`Imported${from}: ${count} ingredients, ${draft.steps.length} steps. Check everything, then save.`);
      importInput.value = '';
      autogrow(importInput);
      loadImportedPhoto(draft.images);
    } catch (err) {
      showImportStatus(err.message || String(err), true);
    } finally {
      $('#import-btn').disabled = false;
    }
  }

  // Photos are fetched after the text, original size first, then smaller versions.
  async function loadImportedPhoto(candidates) {
    for (const src of candidates.slice(0, 4)) {
      if (imageFile || image) return; // you picked one yourself meanwhile
      try { setPhoto(await fetchImage(src)); return; } catch { /* try the next one */ }
    }
  }

  if (importInput) {
    $('#import-btn').addEventListener('click', runImport);
    // Pasting a link is enough: import right away.
    importInput.addEventListener('paste', () => setTimeout(() => { if (asUrl(importInput.value)) runImport(); }));
  }

  // ----- Ingredient groups -----
  function renderGroups() {
    $('#groups').innerHTML = groups.map((g, i) => `
      <div class="group">
        <div class="group-head">
          <input class="group-title" data-g="${i}" value="${esc(g.name)}" autocomplete="off"
            placeholder="${i === 0 ? 'Group name (optional)' : 'Group name, e.g. Sauce or Marinade'}">
          ${groups.length > 1 ? `<button type="button" class="icon-btn" data-remove-group="${i}" aria-label="Remove group">×</button>` : ''}
        </div>
        <textarea class="group-items" data-g="${i}" rows="4" placeholder="2 carrots\n1 onion\n200 g rice">${esc(g.text)}</textarea>
      </div>`).join('');
    $('#groups').querySelectorAll('textarea').forEach(autogrow);
  }
  $('#add-group').addEventListener('click', () => {
    groups.push({ name: '', text: '' });
    renderGroups();
    $(`#groups .group:last-child .group-title`).focus();
  });
  $('#groups').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-group]');
    if (!btn) return;
    const i = Number(btn.dataset.removeGroup);
    if (groups[i].text.trim() && !confirm('Remove this group and its ingredients?')) return;
    groups.splice(i, 1);
    dirty = true;
    renderGroups();
  });

  // ----- Steps -----
  function renderSteps(focus = -1) {
    $('#steps').innerHTML = steps.map((s, i) => `
      <li class="step-item">
        <span class="step-num">${i + 1}</span>
        <textarea data-s="${i}" rows="2" placeholder="${i === 0 ? 'First, …' : 'Then…'}">${esc(s)}</textarea>
        <div class="step-tools">
          <button type="button" class="icon-btn" data-move="${i}" data-dir="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="icon-btn" data-move="${i}" data-dir="1" aria-label="Move down" ${i === steps.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="icon-btn" data-remove-step="${i}" aria-label="Remove step">×</button>
        </div>
      </li>`).join('');
    $('#steps').querySelectorAll('textarea').forEach(autogrow);
    if (focus >= 0) $(`#steps textarea[data-s="${focus}"]`)?.focus();
  }
  function addStep() {
    steps.push('');
    renderSteps(steps.length - 1);
  }
  $('#add-step').addEventListener('click', addStep);
  $('#steps').addEventListener('click', (e) => {
    const move = e.target.closest('[data-move]');
    const remove = e.target.closest('[data-remove-step]');
    if (move) {
      const i = Number(move.dataset.move);
      const j = i + Number(move.dataset.dir);
      [steps[i], steps[j]] = [steps[j], steps[i]];
      dirty = true;
      renderSteps();
    }
    if (remove) {
      const i = Number(remove.dataset.removeStep);
      if (steps[i].trim() && !confirm('Remove this step?')) return;
      steps.splice(i, 1);
      if (!steps.length) steps.push('');
      dirty = true;
      renderSteps();
    }
  });
  // Ctrl/Cmd + Enter in a step adds the next one.
  $('#steps').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addStep(); }
  });

  $('#paste-toggle').addEventListener('click', () => {
    $('#paste-box').hidden = false;
    $('#paste-text').focus();
  });
  $('#paste-cancel').addEventListener('click', () => { $('#paste-box').hidden = true; });
  $('#paste-apply').addEventListener('click', () => {
    const lines = $('#paste-text').value.split('\n')
      .map((l) => l.replace(/^\s*(step\s*)?\d+\s*[.):-]?\s*/i, '').trim())
      .filter(Boolean);
    if (!lines.length) return;
    if (steps.length === 1 && !steps[0].trim()) steps.length = 0;
    steps.push(...lines);
    $('#paste-text').value = '';
    $('#paste-box').hidden = true;
    dirty = true;
    renderSteps();
  });

  // ----- Typing anywhere -----
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'import-input') { autogrow(t); return; }
    if (t.id === 'paste-text' || t.id === 'new-tag') return;
    dirty = true;
    if (t.tagName === 'TEXTAREA') autogrow(t);
    if (t.dataset.s !== undefined) steps[Number(t.dataset.s)] = t.value;
    else if (t.classList.contains('group-title')) groups[Number(t.dataset.g)].name = t.value;
    else if (t.classList.contains('group-items')) groups[Number(t.dataset.g)].text = t.value;
  });
  // Don't submit by accident when pressing Enter in a text field (e.g. "Go" on a phone keyboard).
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'import-input' && asUrl(e.target.value)) {
      e.preventDefault();
      runImport();
    }
  });

  // ----- Save / delete -----
  const errorEl = $('#error');
  const showError = (msg) => { errorEl.textContent = msg; errorEl.hidden = !msg; if (msg) errorEl.scrollIntoView({ block: 'center' }); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = fd.get('title').trim();
    if (!title) { showError('Give the recipe a title.'); form.elements.title.focus(); return; }
    showError('');
    const saveBtn = $('#save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      if (imageFile) image = await uploadImage(imageFile);
      const saved = await saveRecipe({
        ...existing, // keeps any fields this form doesn't know about
        title,
        cook: fd.get('cook').trim(),
        servings: toInt(fd.get('servings')),
        time: toInt(fd.get('time')),
        source: fd.get('source').trim(),
        tags: [...tags].sort(),
        image,
        ingredients: groups
          .map((g) => ({ name: g.name.trim(), items: g.text.split('\n').map((s) => s.trim()).filter(Boolean) }))
          .filter((g) => g.items.length),
        steps: steps.map((s) => s.trim()).filter(Boolean),
        notes: fd.get('notes').trim(),
      });
      dirty = false;
      location.hash = '#/r/' + saved.id;
    } catch (err) {
      console.error(err);
      showError('Could not save: ' + (err.message || err));
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save recipe';
    }
  });

  $('#delete')?.addEventListener('click', async () => {
    if (!confirm(`Delete “${existing.title}”? This cannot be undone.`)) return;
    try {
      await deleteRecipe(existing.id);
      dirty = false;
      location.hash = '#/archive';
    } catch (err) {
      showError('Could not delete: ' + (err.message || err));
    }
  });

  renderTags();
  renderImage();
  renderGroups();
  renderSteps();
  form.querySelectorAll('textarea').forEach(autogrow);
  if (!existing) form.elements.title.focus();

  return {
    canLeave: () => !dirty,
    cleanup: () => { if (previewUrl) URL.revokeObjectURL(previewUrl); },
  };
}
