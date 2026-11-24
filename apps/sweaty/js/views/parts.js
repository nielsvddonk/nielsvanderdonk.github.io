// Small pieces of HTML and behaviour used by several pages.

import { esc } from '../util.js';

const svg = (path, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${path}</svg>`;
const line = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

export const ICON = {
  check: svg(line('M5 12.5l4.5 4.5L19 7.5')),
  circle: svg('<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/>'),
  done: svg('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="var(--bg)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  skip: svg(`<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/>${line('M8.5 12h7')}`),
  left: svg(line('M14.5 6l-6 6 6 6')),
  right: svg(line('M9.5 6l6 6-6 6')),
  plus: svg(line('M12 5v14M5 12h14')),
  close: svg(line('M6 6l12 12M18 6L6 18')),
  today: svg(`<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>${line('M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8')}`),
  week: svg(`<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>${line('M3.5 10h17M8 3v4M16 3v4')}`),
  food: svg(line('M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4.5-3.5 8h3.5')),
  me: svg(`<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>${line('M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5')}`),
  star: svg('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
  starFull: svg('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
};

// The ✓ / ○ / – next to a planned thing.
export function mark(state) {
  if (state === 'done') return `<span class="mark is-done" title="Done">${ICON.done}<span class="sr">Done</span></span>`;
  if (state === 'skipped') return `<span class="mark is-skipped" title="Skipped">${ICON.skip}<span class="sr">Skipped</span></span>`;
  if (state === 'missed') return `<span class="mark is-missed" title="Not done">${ICON.circle}<span class="sr">Not done</span></span>`;
  if (state === 'todo') return `<span class="mark" title="To do">${ICON.circle}<span class="sr">To do</span></span>`;
  return '';
}

// A progress bar. Over the max, it turns orange.
export function bar(value, max, cls = '') {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return `<div class="bar ${cls}${max > 0 && value > max * 1.02 ? ' is-over' : ''}"><i style="width:${pct.toFixed(1)}%"></i></div>`;
}

// A short message at the bottom of the screen.
let toastTimer = null;
export function toast(text, { action, onAction } = {}) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(text)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').addEventListener('click', () => { el.remove(); onAction?.(); });
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), action ? 5000 : 2600);
}

// A sheet that slides up (a <dialog>). Returns the dialog element; it removes itself when closed.
export function sheet(html, { className = '' } = {}) {
  const d = document.createElement('dialog');
  d.className = `sheet ${className}`;
  d.innerHTML = `<div class="sheet-inner">${html}</div>`;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // tap next to it closes it
  d.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => d.close()));
  d.showModal();
  return d;
}

// Two or more buttons, one chosen: <div class="seg">…</div>
export const seg = (name, value, options) =>
  `<div class="seg" role="radiogroup" data-seg="${esc(name)}">${options.map(([v, label]) =>
    `<button type="button" role="radio" aria-checked="${String(v) === String(value)}" data-value="${esc(v)}" class="${String(v) === String(value) ? 'is-on' : ''}">${esc(label)}</button>`).join('')}</div>`;

// Makes the .seg groups inside `root` clickable; onPick(name, value).
export function wireSegs(root, onPick) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.seg button');
    if (!b || !root.contains(b)) return;
    const group = b.closest('.seg');
    group.querySelectorAll('button').forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-checked', String(on));
    });
    onPick(group.dataset.seg, b.dataset.value);
  });
}
