// Archive search: every word you type must appear somewhere in the recipe
// (title, cook, tags, ingredients or source). Tags filter with AND.

import { fold } from './util.js';
import { allIngredientLines } from './ingredients.js';

const hay = new WeakMap();
function haystack(r) {
  if (!hay.has(r)) {
    hay.set(r, fold([r.title, r.cook, ...(r.tags || []), ...allIngredientLines(r), r.source].join(' ')));
  }
  return hay.get(r);
}

export function searchRecipes(recipes, query, tags = new Set()) {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  return recipes.filter((r) => {
    if ([...tags].some((t) => !(r.tags || []).includes(t))) return false;
    const h = haystack(r);
    return tokens.every((t) => h.includes(t));
  });
}

export const SORTS = {
  az: { label: 'A–Z', fn: (a, b) => a.title.localeCompare(b.title) },
  new: { label: 'Newest', fn: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') },
  quick: { label: 'Quickest', fn: (a, b) => (a.time || 999) - (b.time || 999) },
};
