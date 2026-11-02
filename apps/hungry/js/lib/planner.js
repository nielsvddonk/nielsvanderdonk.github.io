// Week planner: given what's in the veggie box, pick recipes that together use
// as much of it as possible — and don't count the same ingredient twice.
//
// It tries many slightly randomised "greedy" plans (each time picking the recipe
// that uses the most still-unused box items) and keeps the distinct results,
// best first. That way "Another combination" can show good alternatives.

import { allIngredientLines, ingredientName, matches, isStaple } from './ingredients.js';

export function planWeek(recipes, boxTerms, count, runs = 400) {
  const box = [...new Set(boxTerms.map(ingredientName).filter(Boolean))];

  const candidates = recipes.map((recipe) => {
    const lines = allIngredientLines(recipe).map((line) => ({ line, name: ingredientName(line) }));
    const hits = box.filter((t) => lines.some((l) => matches(t, l.name)));
    const extras = lines.filter((l) => l.name && !isStaple(l.name) && !box.some((t) => matches(t, l.name)));
    return { recipe, lines, hits, extraCount: extras.length };
  }).filter((c) => c.hits.length);

  const unmatched = box.filter((t) => !candidates.some((c) => c.hits.includes(t)));
  const found = new Map();

  for (let run = 0; run < runs && candidates.length; run++) {
    const jitter = run === 0 ? 0 : 6;
    const left = new Set(box);
    const chosen = new Set();
    const picks = [];

    for (let k = 0; k < count; k++) {
      let best = null;
      let bestScore = -Infinity;
      for (const c of candidates) {
        if (chosen.has(c)) continue;
        const gain = c.hits.filter((t) => left.has(t)).length;
        if (!gain) continue;
        const reused = c.hits.length - gain; // box items another recipe already claimed
        const score = gain * 10 - reused * 3 - c.extraCount * 0.5 + Math.random() * jitter;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      if (!best) break;
      const uses = best.hits.filter((t) => left.has(t));
      uses.forEach((t) => left.delete(t));
      chosen.add(best);
      // Everything this recipe needs that isn't covered by its share of the box.
      const extras = best.lines
        .filter((l) => l.name && !isStaple(l.name) && !uses.some((t) => matches(t, l.name)))
        .map((l) => l.line);
      picks.push({ recipe: best.recipe, uses, extras });
    }

    const key = picks.map((p) => p.recipe.id).sort().join('|');
    if (!picks.length || found.has(key)) continue;
    const extrasTotal = picks.reduce((n, p) => n + p.extras.length, 0);
    found.set(key, { picks, left: [...left], score: (box.length - left.size) * 10 - extrasTotal * 0.5 });
  }

  const plans = [...found.values()].sort((a, b) => b.score - a.score).slice(0, 12);
  return { box, plans, unmatched };
}
