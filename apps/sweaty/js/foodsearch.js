// Finding foods: the built-in list (data/foods.js), your own foods, and — when you ask —
// packaged products from Open Food Facts (a free, open database of food labels).
//
// A food here: { key, name, k100, p100 (kcal and protein per 100 g/ml), portion: { name, g },
//   unit: 'g' | 'ml', source } — or, for your own foods counted per portion:
//   { kPortion, pPortion, portion: { name } } without grams.

import { foods as BUILT_IN } from '../data/foods.js';
import { fmt, num } from './util.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’'`]/g, '').replace(/[^a-z0-9%+.]+/g, ' ').trim();
const stem = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w); // apples → apple
const words = (s) => norm(s).split(' ').filter(Boolean).map(stem);

function prepare(f) {
  f.nameNorm = norm(f.name);
  f.nameWords = words(f.name);
  f.aliasList = String(f.aliases || '').split(',').map(norm).filter(Boolean);
  f.allWords = [...f.nameWords, ...words(f.aliases || '')];
  return f;
}

export const builtIn = BUILT_IN.map(([name, aliases, k, p, portion, g, unit]) => prepare({
  key: `b:${name}`, name, aliases, k100: k, p100: p,
  portion: portion ? { name: portion, g } : null, unit: unit || 'g', source: 'builtin',
}));

export const mine = (s) => (s?.myFoods || []).map((f) => prepare({ ...f, key: `m:${f.id}`, source: 'mine' }));

// The best matches for what you typed. `freq` (key → times used lately) puts your usual foods first.
export function search(query, pool, freq = new Map()) {
  const qn = norm(query);
  const qw = words(query);
  if (!qw.length) return [];
  const out = [];
  for (const f of pool) {
    if (!qw.every((t) => f.allWords.some((w) => w.startsWith(t)))) continue;
    let score = 0;
    if (f.nameNorm === qn) score += 100;
    else if (f.aliasList.includes(qn)) score += 90;
    else if (f.nameNorm.startsWith(qn)) score += 60;
    else if (f.aliasList.some((a) => a.startsWith(qn))) score += 45;
    else if (f.nameWords[0]?.startsWith(qw[0])) score += 30;
    score += Math.min(30, (freq.get(f.key) || 0) * 5);
    if (f.source === 'mine') score += 25;
    score -= f.name.length / 8;
    out.push([score, f]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 40).map(([, f]) => f);
}

// ---------- Amounts ----------

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
export function fmtCount(n) {
  const whole = Math.floor(n);
  const rest = Math.round((n - whole) * 100) / 100;
  if (FRACTIONS[rest]) return `${whole || ''}${FRACTIONS[rest]}`;
  return fmt(n, 2);
}

// "1 piece", "2 pieces", "1½ glasses", "2 × 10 pieces"
export function portionText(name, count) {
  if (count <= 1) return `${fmtCount(count)} ${name}`;
  if (/^\d/.test(name) || ['medium', 'small bar', 'whole pizza', 'half ball'].includes(name)) return `${fmtCount(count)} × ${name}`;
  const [first, ...rest] = name.split(' ');
  const many = first === 'half' ? 'halves' : /(s|sh|ch|x)$/.test(first) ? `${first}es` : `${first}s`;
  return `${fmtCount(count)} ${[many, ...rest].join(' ')}`;
}

export const perPortion = (f) => {
  if (f.portion?.g && f.k100 != null) return { kcal: (f.k100 * f.portion.g) / 100, p: ((f.p100 || 0) * f.portion.g) / 100 };
  if (f.kPortion != null) return { kcal: f.kPortion, p: f.pPortion || 0 };
  return null;
};

export const hasGrams = (f) => f.k100 != null;

// How much of a food → { kcal, p, g, count, amount: "1½ piece (270 g)" }.
// Give `count` (portions) or `grams`.
export function measure(f, { count = null, grams = null }) {
  if (grams != null && hasGrams(f)) {
    const portionCount = f.portion?.g ? grams / f.portion.g : null;
    const frac = portionCount ? Math.round((portionCount % 1) * 100) / 100 : null;
    const nice = portionCount > 0 && portionCount <= 20 && (frac === 0 || frac in FRACTIONS);
    return {
      kcal: (f.k100 * grams) / 100,
      p: ((f.p100 || 0) * grams) / 100,
      g: grams,
      count: portionCount,
      amount: nice ? `${portionText(f.portion.name, portionCount)} (${fmt(grams)} ${f.unit || 'g'})` : `${fmt(grams)} ${f.unit || 'g'}`,
    };
  }
  const per = perPortion(f) || { kcal: 0, p: 0 };
  const c = count ?? 1;
  const g = f.portion?.g ? f.portion.g * c : null;
  return {
    kcal: per.kcal * c,
    p: per.p * c,
    g,
    count: c,
    amount: `${portionText(f.portion?.name || 'portion', c)}${g ? ` (${fmt(g)} ${f.unit || 'g'})` : ''}`,
  };
}

// "52 kcal per 100 g · 1 piece = 94 kcal"
export function describe(f) {
  const bits = [];
  if (f.k100 != null) bits.push(`${fmt(f.k100)} kcal per 100 ${f.unit || 'g'}`);
  const per = perPortion(f);
  if (per && f.portion) bits.push(`1 ${f.portion.name} = ${fmt(per.kcal)} kcal`);
  return bits.join(' · ');
}

// What gets saved with a logged food, so it can be changed later even if the list changes.
export const foodInfo = (f) => ({
  k100: f.k100 ?? null, p100: f.p100 ?? null, portion: f.portion || null,
  kPortion: f.kPortion ?? null, pPortion: f.pPortion ?? null, unit: f.unit || 'g',
});

// ---------- Online: Open Food Facts ----------

function fromOpenFoodFacts(p) {
  const n = p.nutriments || {};
  let k = num(n['energy-kcal_100g']);
  if (k == null && num(n.energy_100g) != null) k = num(n.energy_100g) / 4.184; // that one is in kJ
  const name = String(p.product_name_nl || p.product_name || '').trim();
  if (k == null || !name) return null;
  const brand = String(p.brands || '').split(',')[0].trim();
  const serving = num(p.serving_quantity);
  return prepare({
    key: `off:${p.code}`, name: brand ? `${name} (${brand})` : name, aliases: '',
    k100: Math.round(k), p100: Math.round((num(n.proteins_100g) || 0) * 10) / 10,
    portion: serving && serving > 0 && serving < 2000 ? { name: 'serving', g: serving } : null,
    unit: 'g', source: 'online',
  });
}

async function openFoodFacts(query, dutchOnly) {
  const fields = 'code,product_name,product_name_nl,brands,nutriments,serving_quantity';
  // (nl.openfoodfacts.org doesn't allow apps in the browser to ask; world. does, with a country filter.)
  const country = dutchOnly ? '&tagtype_0=countries&tag_contains_0=contains&tag_0=netherlands' : '';
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=30&fields=${fields}${country}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`);
    const json = await res.json();
    const seen = new Set();
    return (json.products || []).map(fromOpenFoodFacts).filter((f) => f && !seen.has(f.key) && seen.add(f.key));
  } finally {
    clearTimeout(timer);
  }
}

// Products sold in the Netherlands, or from anywhere if none match.
// Only your search words are sent to Open Food Facts; nothing else.
export async function searchOnline(query) {
  const dutch = await openFoodFacts(query, true);
  return dutch.length ? dutch : openFoodFacts(query, false);
}
