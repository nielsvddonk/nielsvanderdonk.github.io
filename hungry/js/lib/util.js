// Small helpers shared by all views.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Lowercase and strip accents, so "Crème" matches "creme".
export const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Turn plain text into paragraphs (blank line = new paragraph).
export const paragraphs = (s) =>
  esc(s.trim()).split(/\n\s*\n/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

export function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const unique = (list) => [...new Set(list)];

// Short, stable id for a piece of text (FNV-1a hash).
export function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// Browser storage that never throws (private mode, full storage, …).
function safeStorage(getStore) {
  return {
    get(key, fallback = null) {
      try { const v = getStore().getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { getStore().setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    },
    remove(key) {
      try { getStore().removeItem(key); } catch { /* ignore */ }
    },
  };
}
export const local = safeStorage(() => localStorage);
export const session = safeStorage(() => sessionStorage);

// Counts in-app navigations so "Back" knows whether history.back() stays inside Hungry.
export const nav = { count: 0 };
