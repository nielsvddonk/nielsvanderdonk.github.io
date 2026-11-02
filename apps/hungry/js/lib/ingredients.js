// Understanding ingredient lines like "2 carrots, diced" or "200 g spaghetti".
// Used to scale servings and to match ingredients in the week planner,
// where "2 large carrots, diced" should simply count as "carrot".
// Knows common English and Dutch units.

import { fold } from './util.js';

const FRACTIONS = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8 };
const FR = Object.keys(FRACTIONS).join('');
const NUM = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?(?:\\s?[${FR}])?|[${FR}])`;
// "2", "1 1/2", "0,5", "½", "2-3", "2 to 3"
const QTY_RE = new RegExp(`^\\s*(${NUM})(?:\\s*(?:-|–|to|tot)\\s*(${NUM}))?\\s*`, 'i');

const words = (s) => new Set(s.split(/\s+/));

const UNITS = words(`
  g gr gram grams kg kilo mg ml cl dl l lt liter liters litre litres cm mm inch
  tbsp tbsps tbs tbl tablespoon tablespoons tsp tsps teaspoon teaspoons
  el tl eetlepel eetlepels theelepel theelepels
  cup cups kop kopje kopjes oz ounce ounces lb lbs pound pounds
  clove cloves teen teentje teentjes tenen head heads
  can cans tin tins blik blikje blikjes blikken jar jars pot potje potjes
  pinch pinches snufje snuf handful handfuls handje bunch bunches bos bosje bosjes
  stuk stuks stukje stukjes piece pieces slice slices plak plakken plakje plakjes
  sprig sprigs takje takjes stick sticks stalk stalks stengel stengels knob
  dash dashes scheut scheutje splash packet packets pack pak pakje zak zakje bag bags
  sheet sheets vel vellen drop drops druppel druppels`);
const METRIC = words('g gr gram grams kg kilo mg ml cl dl l lt liter liters litre litres');

// Words that say how an ingredient is prepared, not what it is.
const DESCRIPTORS = words(`
  fresh freshly chopped finely roughly coarsely diced minced sliced thinly thickly grated
  peeled crushed large small medium big ripe whole dried cooked uncooked raw frozen
  optional about approximately extra virgin organic boneless skinless halved quartered
  cubed shredded softened melted good quality drained rinsed
  vers verse grote groot kleine klein middelgrote fijngehakt fijngesneden gesneden geraspt
  gepeld rijpe gedroogd gedroogde gekookt gekookte bevroren ongeveer biologische halve hele`);
const FILLER = words('of van the de het een and en or to taste for voor serving serve garnish naar smaak plus a an');

// Ignored when building shopping lists — you probably have these.
const STAPLES = new Set(['salt', 'pepper', 'black pepper', 'salt pepper', 'oil', 'olive oil', 'vegetable oil',
  'sunflower oil', 'neutral oil', 'water', 'sugar', 'zout', 'peper', 'zwarte peper', 'zout peper', 'olie',
  'olijfolie', 'zonnebloemolie', 'suiker']);

const isUnit = (w) => UNITS.has(fold(w).replace(/\.$/, ''));

function parseNum(s) {
  let total = 0;
  s = s.replace(new RegExp(`[${FR}]`), (ch) => { total += FRACTIONS[ch]; return ''; }).trim();
  for (const part of s ? s.split(/\s+/) : []) {
    if (part.includes('/')) {
      const [a, b] = part.split('/').map(Number);
      total += b ? a / b : 0;
    } else {
      total += parseFloat(part.replace(',', '.')) || 0;
    }
  }
  return total;
}

function formatNum(n, metric) {
  if (metric) {
    if (n >= 100) return String(Math.round(n / 5) * 5);
    if (n >= 10) return String(Math.round(n));
    return String(Math.round(n * 10) / 10);
  }
  if (n >= 10) return String(Math.round(n));
  const whole = Math.floor(n);
  const frac = n - whole;
  const options = [[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
  const [value, symbol] = options.reduce((best, o) => (Math.abs(frac - o[0]) < Math.abs(frac - best[0]) ? o : best));
  if (Math.abs(frac - value) < 0.05) {
    const w = whole + (value === 1 ? 1 : 0);
    if (!symbol) return String(w);
    return w ? `${w}${symbol}` : symbol;
  }
  return String(Math.round(n * 10) / 10);
}

// "2 tbsp soy sauce" → { qty: 2, qtyMax: null, unit: 'tbsp', amount: '2 tbsp', name: 'soy sauce' }
export function parseLine(line) {
  const text = String(line ?? '').trim();
  const m = text.match(QTY_RE);
  if (!m) return { qty: null, qtyMax: null, unit: '', amount: '', name: text };
  let rest = text.slice(m[0].length);
  let unit = '';
  const u = rest.match(/^(\p{L}+\.?)(?=\s|$)\s*/u);
  if (u && isUnit(u[1])) { unit = u[1]; rest = rest.slice(u[0].length); }
  return {
    qty: parseNum(m[1]),
    qtyMax: m[2] ? parseNum(m[2]) : null,
    unit,
    amount: text.slice(0, text.length - rest.length).trim(),
    name: rest.trim(),
  };
}

// Splits a line into amount + name for display, scaled by `factor`.
export function displayLine(line, factor = 1) {
  const p = parseLine(line);
  if (p.qty === null) return { amount: '', name: p.name };
  if (factor === 1) return { amount: p.amount, name: p.name };
  const metric = METRIC.has(fold(p.unit).replace(/\.$/, ''));
  let amount = formatNum(p.qty * factor, metric);
  if (p.qtyMax !== null) amount += '–' + formatNum(p.qtyMax * factor, metric);
  if (p.unit) amount += ' ' + p.unit;
  return { amount, name: p.name };
}

function singular(w) {
  if (w.length <= 3) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('oes')) return w.slice(0, -2);
  if (/(ch|sh|ss|x)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

// The "what is it" part of a line: "2 large carrots, diced" → "carrot".
export function ingredientName(line) {
  let s = fold(line).replace(/\([^)]*\)/g, ' ');
  s = s.split(/[,;]| - | – /)[0];
  let list = parseLine(s).name
    .replace(/[^\p{L}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && w !== '-' && !DESCRIPTORS.has(w) && !FILLER.has(w));
  while (list.length > 1 && isUnit(list[0])) list.shift(); // "pinch salt" → "salt"
  return list.map(singular).join(' ');
}

// Words that only say which kind: a "red onion" still works where a recipe says "onion",
// but a "spring onion" does not.
const VARIETY = words(`red white yellow green black brown purple orange sweet baby cherry plum young
  wild winter summer new rode witte gele groene zwarte paarse zoete jonge`);

// Does a box item match a recipe ingredient? Both already passed through ingredientName().
//   "onion"     → "red onion"   yes (recipe is more specific)
//   "red onion" → "onion"       yes (only a variety word extra)
//   "spring onion" → "onion"    no
export function matches(box, ing) {
  if (!box || !ing) return false;
  const bw = box.split(' ');
  const iw = ing.split(' ');
  if (bw.every((w) => iw.includes(w))) return true;
  return iw.every((w) => bw.includes(w)) && bw.every((w) => iw.includes(w) || VARIETY.has(w));
}

export const isStaple = (name) => STAPLES.has(name);

export const allIngredientLines = (recipe) =>
  (recipe.ingredients || []).flatMap((g) => g.items || []).filter((s) => s && s.trim());
