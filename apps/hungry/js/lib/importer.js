// "Import": turns a recipe web page — or pasted recipe text — into a Hungry
// recipe, leaving out the life stories, ads and comments.
//
// 1. schema.org Recipe data (JSON-LD). Nearly every recipe site has it because
//    Google uses it — including blogs with long stories (the story isn't in it).
//    Its ingredient list is flat, so groups ("For the sauce") are recovered by
//    finding those ingredients on the page and the headings between them.
// 2. schema.org microdata (itemprop="recipeIngredient" …), used by older sites.
// 3. Otherwise: find headings like "Ingredients" and "Method" and take what's
//    below them. Pasted text (a TikTok caption, an email) goes the same way.

import { fold } from './util.js';

const parser = new DOMParser();

// ---------- Small helpers ----------

const clean = (s) => String(s ?? '')
  .replace(/[\s ]+/g, ' ')
  .replace(/\s+([,.;:!?)])/g, '$1')
  .replace(/\(\s+/g, '(')
  .trim();

const BULLET = /^[-–—•*·▢☐□✓✔▪◦+]+\s*/;
const stripBullet = (s) => s.replace(BULLET, '').trim();
// "1.", "2)", "Step 3:", "Stap 4" — but not "350 degrees".
const stripNumber = (s) => s.replace(/^(?:(?:step|stap)\s*\d+\s*[.):-]?|\d+\s*[.)]|\d+\s*[:-](?=\s))\s*/i, '').trim();
// Lines that are only hashtags/mentions (end of a social media caption).
const isTagLine = (s) => /^([#@][\p{L}\p{N}_]+\s*)+$/u.test(s);

// HTML or entity-encoded text → plain text, keeping line breaks.
function htmlToText(s) {
  let html = String(s ?? '');
  for (let i = 0; i < 2 && /[<&]/.test(html); i++) {
    html = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|div|h\d)>/gi, '\n');
    html = parser.parseFromString(html, 'text/html').body.textContent ?? '';
  }
  return html.split('\n').map(clean).filter(Boolean).join('\n');
}

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

function firstNumber(values) {
  for (const v of list(values)) {
    const m = String(v).match(/\d+/);
    if (m && Number(m[0]) > 0) return Number(m[0]);
  }
  return null;
}

// "PT1H30M" → 90. Also understands "1 hour 30 mins" / "45 minuten".
function minutes(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const iso = s.match(/^P(?:(\d+)D)?T?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
  if (iso) {
    const total = (+iso[1] || 0) * 1440 + (+iso[2] || 0) * 60 + (+iso[3] || 0) + (+iso[4] || 0) / 60;
    return Math.round(total) || null;
  }
  const h = s.match(/(\d+)\s*(?:h|hours?|hrs?|uur)\b/i);
  const m = s.match(/(\d+)\s*(?:m|mins?|minutes?|minuten)\b/i);
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) || null;
}

// Photo addresses, best first: originals before resized versions ("?resize=440,400").
function imageCandidates(image, base) {
  const urls = [];
  for (const img of list(image)) {
    const url = typeof img === 'string' ? img : img?.url || img?.contentUrl;
    try { if (url) urls.push(new URL(url, base)); } catch { /* skip */ }
  }
  const RESIZE = ['resize', 'fit', 'w', 'h', 'width', 'height', 'crop'];
  const resized = (u) => RESIZE.some((p) => u.searchParams.has(p));
  const originals = urls.map((u) => {
    const o = new URL(u);
    RESIZE.forEach((p) => o.searchParams.delete(p));
    return o.href;
  });
  return [...new Set([...urls.filter((u) => !resized(u)).map((u) => u.href), ...originals, ...urls.map((u) => u.href)])];
}

// ---------- Tag suggestions ----------

const DIETS = { VegetarianDiet: 'vegetarian', VeganDiet: 'vegan', GlutenFreeDiet: 'gluten-free' };
const DUTCH = {
  mexicaans: 'mexican', italiaans: 'italian', japans: 'japanese', indiaas: 'indian', indiase: 'indian', thais: 'thai',
  chinees: 'chinese', chinese: 'chinese', koreaans: 'korean', frans: 'french', grieks: 'greek', spaans: 'spanish',
  soep: 'soup', soepen: 'soup', salade: 'salad', salades: 'salad', nagerecht: 'dessert', nagerechten: 'dessert',
  ontbijt: 'breakfast', lunch: 'lunch', vegetarisch: 'vegetarian', vegan: 'vegan', pasta: 'pasta', rijst: 'rice',
  noedels: 'noodles', kip: 'chicken', vis: 'fish', vlees: 'meat', curry: 'curry', bakken: 'baking',
};

// Words the page uses to describe the recipe; the editor keeps only ones that are already tags.
function tagHints(recipe) {
  const words = [];
  for (const v of [...list(recipe.recipeCuisine), ...list(recipe.recipeCategory), ...list(recipe.keywords)]) {
    words.push(...String(v).split(','));
  }
  const hints = [];
  for (const w of words.map((w) => fold(w).trim()).filter((w) => w && w.length <= 30)) {
    hints.push(w);
    for (const part of w.split(/\s+/)) {
      const nl = DUTCH[part.replace(/e$/, '')] || DUTCH[part];
      if (nl) hints.push(nl);
      hints.push(part);
    }
  }
  for (const d of list(recipe.suitableForDiet)) {
    for (const part of String(d).split(',')) {
      const key = part.trim().split('/').pop();
      if (DIETS[key]) hints.push(DIETS[key]);
    }
  }
  return [...new Set(hints)];
}

// ---------- 1. JSON-LD ----------

function findRecipe(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 8) return null;
  if (Array.isArray(node)) {
    for (const n of node) { const r = findRecipe(n, depth + 1); if (r) return r; }
    return null;
  }
  if (list(node['@type']).some((t) => /(^|[:/])Recipe$/i.test(String(t)))) return node;
  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item', 'about', 'hasPart']) {
    const r = findRecipe(node[key], depth + 1);
    if (r) return r;
  }
  return null;
}

function jsonLdRecipe(doc) {
  for (const script of doc.querySelectorAll('script[type*="ld+json" i]')) {
    const text = script.textContent.replace(/^\s*(<!--|<!\[CDATA\[)|(-->|\]\]>)\s*$/g, '');
    let data;
    try { data = JSON.parse(text); } catch {
      try { data = JSON.parse(text.replace(/[\u0000-\u001f]+/g, ' ')); } catch { continue; }
    }
    const recipe = findRecipe(data);
    if (recipe) return recipe;
  }
  return null;
}

function stepsFromInstructions(instructions) {
  const steps = [];
  const add = (text, section) => {
    const t = stripNumber(stripBullet(text));
    if (t) steps.push(section ? `${section.replace(/:$/, '')}: ${t}` : t);
  };
  const walk = (item, section = '') => {
    if (!item) return;
    if (typeof item === 'string') {
      htmlToText(item).split('\n').forEach((line, i) => add(line, i === 0 ? section : ''));
      return;
    }
    if (Array.isArray(item)) { item.forEach((x, i) => walk(x, i === 0 ? section : '')); return; }
    const isSection = list(item['@type']).some((t) => /HowToSection/i.test(String(t)));
    if (isSection || (!item.text && item.itemListElement)) {
      let name = isSection ? clean(htmlToText(item.name)) : section;
      if (SECTION.method.test(name)) name = ''; // just "Method" / "Bereiding": not a real sub-section
      list(item.itemListElement).forEach((x, i) => walk(x, i === 0 ? name : ''));
      return;
    }
    // One HowToStep is one step, even if it has a few sentences or lines.
    const text = htmlToText(item.text || item.name || item.description || '').replace(/\n+/g, ' ');
    add(text, section);
  };
  walk(instructions);
  return steps;
}

// The flat ingredient list from JSON-LD, split into the groups shown on the page
// ("For the sauce"). Where the page shows the same words with better punctuation
// ("1 onion, thinly sliced" vs "1 onion thinly sliced"), the page's text is used.
function groupIngredients(doc, items) {
  const key = (s) => fold(s).replace(/[^a-z0-9]+/g, '');
  const words = (s) => fold(s).split(/[^a-z0-9]+/).filter(Boolean).join(' ');
  const wanted = items.map(key);
  const wantedWords = items.map(words);
  const nodes = [...doc.body.querySelectorAll('h2, h3, h4, h5, h6, li, [class*="group-name" i], [class*="group-title" i]')];
  const isItem = (n) => n.tagName === 'LI';
  const headingName = (n) => { const name = clean(n.textContent); return SECTION.ingredients.test(name) ? '' : name; };

  // 2 = same words, 1 = one contains the other, 0 = no match
  const match = (node, j) => {
    const t = key(node.textContent);
    if (!t) return 0;
    if (t === wanted[j] && words(node.textContent) === wantedWords[j]) return 2;
    const w = wanted[j];
    return t === w || (w.length >= 6 && t.includes(w)) || (t.length >= 6 && w.includes(t)) ? 1 : 0;
  };

  const run = (start) => {
    const before = nodes[start - 1];
    const groups = [{ name: before && !isItem(before) ? headingName(before) : '', items: [] }];
    let next = 0;
    let matched = 0;
    let pending = '';
    for (let i = start; i < nodes.length && next < items.length; i++) {
      const node = nodes[i];
      if (!isItem(node)) { pending = headingName(node); continue; }
      let k = -1;
      let how = 0;
      for (let j = next; j < Math.min(next + 3, items.length) && !how; j++) { how = match(node, j); k = j; }
      if (!how) continue;
      if (pending) {
        if (groups.at(-1).items.length) groups.push({ name: pending, items: [] });
        else groups.at(-1).name = pending;
        pending = '';
      }
      groups.at(-1).items.push(...items.slice(next, k), how === 2 ? stripBullet(clean(node.textContent)) : items[k]);
      matched++;
      next = k + 1;
    }
    groups.at(-1).items.push(...items.slice(next));
    return { groups, matched };
  };

  // Blogs often mention ingredients in the story first: try every place the list
  // could start and keep the best run (a later one wins a tie — the recipe card).
  let best = { groups: [{ name: '', items }], matched: 0 };
  nodes.forEach((node, i) => {
    if (isItem(node) && (match(node, 0) || (items.length > 1 && match(node, 1)))) {
      const r = run(i);
      if (r.matched >= best.matched) best = r;
    }
  });

  const { groups, matched } = best;
  const grouped = matched >= items.length * 0.7 && groups.length >= 2 && groups.length <= 8 &&
    groups.every((g) => g.items.length && g.name.length <= 60);
  return grouped ? groups : [{ name: '', items: groups.flatMap((g) => g.items) }];
}

function fromJsonLd(doc, pageUrl) {
  const r = jsonLdRecipe(doc);
  if (!r) return null;
  const items = list(r.recipeIngredient ?? r.ingredients)
    .flatMap((i) => htmlToText(i).split('\n'))
    .map(stripBullet)
    .filter(Boolean);
  return {
    title: htmlToText(r.name).replace(/\n/g, ' '),
    servings: firstNumber(r.recipeYield),
    time: minutes(r.totalTime) || (minutes(r.prepTime) || 0) + (minutes(r.cookTime) || 0) || null,
    images: imageCandidates(r.image, pageUrl),
    tagHints: tagHints(r),
    ingredients: items.length ? groupIngredients(doc, items) : [],
    steps: stepsFromInstructions(r.recipeInstructions),
  };
}

// ---------- 2. Microdata ----------

function fromMicrodata(doc, pageUrl) {
  const scope = doc.querySelector('[itemtype*="schema.org/Recipe" i]');
  if (!scope) return null;
  const all = (prop) => [...scope.querySelectorAll(`[itemprop~="${prop}"]`)];
  const value = (el) => el?.getAttribute('content') || el?.getAttribute('datetime') || el?.textContent || '';
  const items = [...all('recipeIngredient'), ...all('ingredients')].map((el) => stripBullet(clean(value(el)))).filter(Boolean);
  if (!items.length) return null;
  const steps = all('recipeInstructions').flatMap((el) => {
    const lis = el.querySelectorAll('li');
    return lis.length ? [...lis].map((li) => li.textContent) : htmlToText(el.innerHTML).split('\n');
  }).map((s) => stripNumber(clean(s))).filter(Boolean);
  const img = all('image')[0];
  return {
    title: clean(value(all('name')[0])),
    servings: firstNumber(value(all('recipeYield')[0])),
    time: minutes(value(all('totalTime')[0])),
    images: imageCandidates(img?.getAttribute('src') || value(img), pageUrl),
    tagHints: [],
    ingredients: [{ name: '', items }],
    steps,
  };
}

// ---------- 3. Headings: "Ingredients", "Method", … ----------

const SECTION = {
  ingredients: /^(ingredients?|ingrediënten|ingredienten|benodigdheden|boodschappen(lijst(je)?)?|what you('|’)?ll need|you('|’)?ll need|you will need|shopping list|wat heb je nodig)\b/i,
  method: /^(method|instructions?|directions?|steps?|preparation|how to make|bereiding(swijze)?|werkwijze|instructies|zo maak je (het|dit)|aan de slag)\b/i,
  notes: /^(notes?|tips?|recipe notes|opmerkingen)\b/i,
  end: /^(nutrition|voedingswaarde|faq|frequently asked|comments?|reviews?|reacties|more recipes|related|you (may|might) also|share|print|storage|bewaren|ook lekker|kookstand|cook mode)\b/i,
};
const SERVINGS = /(?:serves|servings?|portions?|porties|personen|persons?|people|voor)\D{0,12}(\d+)|(\d+)\s*(?:servings?|portions?|porties|personen|persons?|people)/i;
const SERVINGS_LINE = /^(voor\s+(\d+\s+)?person(en)?|serves\b|makes\b|yields?\b|servings?\b|\d+\s+(personen|servings|porties|people)$)/i;

function blocksFromDom(root) {
  root.querySelectorAll('script, style, noscript, nav, header, footer, aside, form, iframe, svg, button, figure').forEach((n) => n.remove());
  const blocks = [];
  for (const el of root.querySelectorAll('h1, h2, h3, h4, h5, h6, li, p')) {
    if (el.tagName === 'P' && el.closest('li')) continue;
    if (el.tagName === 'LI' && el.querySelector('ul, ol')) continue;
    const text = clean(el.textContent);
    if (!text) continue;
    const strongOnly = el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.matches('strong, b') &&
      clean(el.firstElementChild.textContent) === text && text.length <= 60;
    if (/^H\d$/.test(el.tagName) || strongOnly) blocks.push({ type: 'heading', level: strongOnly ? 6 : +el.tagName[1], text });
    else blocks.push({ type: el.tagName === 'LI' ? 'item' : 'para', text });
  }
  return blocks;
}

function blocksFromText(text) {
  return text.split(/\r?\n/).map((raw) => {
    const line = clean(raw);
    if (!line || isTagLine(line)) return null;
    const marked = BULLET.test(line) || /^(?:(?:step|stap)\s*)?\d+\s*[.):]/i.test(line);
    const plain = line.replace(/^[^\p{L}\p{N}]+/u, '');
    const heading = !marked && plain.length <= 50 &&
      (/:$/.test(plain) || Object.values(SECTION).some((re) => re.test(plain)));
    return { type: heading ? 'heading' : marked ? 'item' : 'para', level: 0, text: line };
  }).filter(Boolean);
}

function fromBlocks(blocks) {
  const groups = [{ name: '', items: [] }];
  const steps = [];
  const notes = [];
  let state = 'start';
  let level = 0;
  let title = '';
  let servings = null;
  let time = null;
  let stepPrefix = '';

  for (const b of blocks) {
    const plain = b.text.replace(/^[^\p{L}\p{N}]+/u, '').replace(/:$/, '').trim();
    const looksLikeHeading = b.type === 'heading' ||
      (b.type === 'para' && plain.length <= 40 && (SECTION.ingredients.test(plain) || SECTION.method.test(plain)));

    if (looksLikeHeading) {
      if (SECTION.ingredients.test(plain)) {
        state = 'ingredients'; level = b.level;
        servings ??= firstNumber(plain.match(SERVINGS)?.slice(1));
      } else if (SECTION.method.test(plain)) {
        state = 'method'; level = b.level;
      } else if (state !== 'start' && SECTION.notes.test(plain)) {
        state = 'notes';
        const rest = plain.replace(SECTION.notes, '').replace(/^[\s:]+/, ''); // "Tip: lekker met brood"
        if (rest) notes.push(rest);
      } else if (state !== 'start' && (SECTION.end.test(plain) || (b.level && b.level <= level))) {
        if (steps.length) break;
        state = 'skip'; // e.g. "Why you'll love this" between the lists: ignore until the next section
      } else if (state === 'ingredients') {
        groups.push({ name: plain, items: [] });
      } else if (state === 'method') {
        stepPrefix = plain;
      } else if (state === 'start' && !title && b.level <= 1) {
        title = plain;
      }
      continue;
    }

    if (state === 'start') {
      if (!title && b.level === 0 && b.text.length <= 100) title = b.text.replace(/[#@][\p{L}\p{N}_]+/gu, '').trim();
      servings ??= firstNumber(b.text.match(SERVINGS)?.slice(1));
      if (/time|tijd|ready in|klaar in/i.test(b.text)) time ??= minutes(b.text);
    } else if (state === 'ingredients') {
      const t = stripBullet(b.text);
      if (SERVINGS_LINE.test(t)) servings ??= firstNumber(t.match(SERVINGS)?.slice(1)); // "Voor 2 personen"
      else if (t && t.length <= 160) groups.at(-1).items.push(t);
    } else if (state === 'method') {
      const t = stripNumber(stripBullet(b.text));
      if (t.length > 2 && !/^advertisement$/i.test(t)) {
        steps.push(stepPrefix ? `${stepPrefix}: ${t}` : t);
        stepPrefix = '';
      }
    } else if (state === 'notes') {
      notes.push(stripBullet(b.text));
    }
  }

  const ingredients = groups.filter((g) => g.items.length);
  if (!ingredients.length && !steps.length) return null;
  return { title, servings, time, images: [], tagHints: [], ingredients, steps, notes: notes.join('\n') };
}

// Blogs can have several "Ingredients" headings (one in the story, one in the
// recipe card): try each and keep the one that looks most like a real recipe.
function fromBestBlocks(blocks) {
  const starts = blocks.flatMap((b, i) => (b.type === 'heading' && SECTION.ingredients.test(
    b.text.replace(/^[^\p{L}\p{N}]+/u, '')) ? [i] : []));
  const first = fromBlocks(blocks);
  if (starts.length < 2) return first;
  const score = (r) => (r ? r.ingredients.flatMap((g) => g.items).filter((s) => /^[\d½⅓⅔¼¾⅛]/.test(s)).length +
    Math.min(r.steps.length, 15) / 2 : -1);
  let best = first;
  for (const i of starts) {
    const r = fromBlocks(blocks.slice(i));
    if (score(r) >= score(best)) best = r;
  }
  return best && { ...best, title: first?.title || best.title };
}

// ---------- Public ----------

// Recipe cards of common recipe plugins, then the article itself.
const CONTAINERS = ['.wprm-recipe-container', '.wprm-recipe', '.tasty-recipes', '.mv-create-card', '.recipe-card',
  '[class*="recipe-card" i]', '[id*="recipe-card" i]', '[class*="recipe-container" i]', 'article', 'main'];

const pageTitle = (doc) => clean(
  doc.querySelector('meta[property="og:title"]')?.content || doc.querySelector('h1')?.textContent || doc.title,
).replace(/\s+[|–—-]\s+[^|–—-]+$/, '');

export function recipeFromHtml(html, pageUrl) {
  const doc = parser.parseFromString(html, 'text/html');
  let recipe = fromJsonLd(doc, pageUrl) || fromMicrodata(doc, pageUrl);
  if (!recipe || !recipe.ingredients.length || !recipe.steps.length) {
    // Fill in whatever the structured data is missing from the page itself,
    // preferring a recipe card over the whole article.
    const main = CONTAINERS.map((sel) => doc.querySelector(sel)).find(Boolean) || doc.body;
    const found = fromBestBlocks(blocksFromDom(main.cloneNode(true)));
    if (!recipe && !found) return null;
    recipe = recipe || { ...found, title: '', images: [] };
    if (found && !recipe.ingredients.length) recipe.ingredients = found.ingredients;
    if (found && !recipe.steps.length) recipe.steps = found.steps;
  }
  const og = doc.querySelector('meta[property="og:image"]')?.content;
  return {
    ...recipe,
    title: recipe.title || pageTitle(doc),
    images: recipe.images.length ? recipe.images : imageCandidates(og, pageUrl),
    source: pageUrl,
    notes: recipe.notes || '',
  };
}

export function recipeFromText(text) {
  const recipe = fromBestBlocks(blocksFromText(text));
  return recipe && { ...recipe, source: '' };
}

// "bbcgoodfood.com/recipes/x" or "https://…" → URL; anything else is recipe text.
export function asUrl(input) {
  const s = input.trim();
  if (/\s/.test(s)) return null;
  const withProtocol = /^https?:\/\//i.test(s) ? s : /^[\w-]+(\.[\w-]+)+\//.test(s) ? 'https://' + s : '';
  try { return withProtocol ? new URL(withProtocol).href : null; } catch { return null; }
}
