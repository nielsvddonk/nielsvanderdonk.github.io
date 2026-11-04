// Small helpers shared by all pages.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Browser storage that never throws (private mode, full storage, …).
function safeStorage(getStore) {
  return {
    get(key, fallback = null) {
      try { const v = getStore().getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { getStore().setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    },
    remove(key) {
      try { getStore().removeItem(key); } catch { /* ignore */ }
    },
  };
}
export const local = safeStorage(() => localStorage);
export const session = safeStorage(() => sessionStorage);

export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

// 142 → "2 h 22 min"
export function formatRuntime(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// 142 → "2 h 22" (for small spaces)
export function shortRuntime(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const m = min % 60;
  return `${Math.floor(min / 60)} h${m ? ' ' + String(m).padStart(2, '0') : ''}`;
}

const pad = (n) => String(n).padStart(2, '0');
export const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// '2026-11-04' → that day at local midnight (new Date('2026-11-04') would be UTC).
export const parseDay = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// The day a movie counts as watched. Marking it after midnight (before 5 am) is still last night.
export function today() {
  const d = new Date();
  if (d.getHours() < 5) d.setDate(d.getDate() - 1);
  return isoDay(d);
}

// '2026-11-04' (a day) or a timestamp → "4 Nov 2026"
export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDay(value) : new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', options);
}

// "Log in" goes to the apps page, which sends you back here afterwards.
export const loginHref = () => '../?next=' + encodeURIComponent(location.pathname + location.hash);
