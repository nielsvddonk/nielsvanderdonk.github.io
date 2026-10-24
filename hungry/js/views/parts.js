// Small pieces of HTML used by several views.

import { esc } from '../lib/util.js';

export const formatTime = (min) => {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export function recipeRow(r) {
  const meta = [(r.tags || []).join(' · '), r.cook, formatTime(r.time)].filter(Boolean).join('  —  ');
  return `
    <li>
      <a class="recipe-row" href="#/r/${esc(r.id)}">
        <span class="row-text">
          <span class="row-title">${esc(r.title)}</span>
          ${meta ? `<span class="row-meta">${esc(meta)}</span>` : ''}
        </span>
        ${r.image ? `<img class="thumb" src="${esc(r.image)}" alt="" loading="lazy">` : ''}
      </a>
    </li>`;
}
