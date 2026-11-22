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

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const round = (n, step = 1) => Math.round(n / step) * step;
export const sum = (list, fn = (x) => x) => list.reduce((total, x) => total + (Number(fn(x)) || 0), 0);

// What someone typed → a number. Dutch keyboards type a comma: "8,5" → 8.5. Empty or nonsense → null.
export function num(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// 2450 → "2,450"   8.25 → "8.3" (digits = how many decimals at most)
export const fmt = (n, digits = 0) =>
  (Number(n) || 0).toLocaleString('en-GB', { maximumFractionDigits: digits });
export const fmtKm = (km) => fmt(km, 1);
export const fmtKg = (kg) => fmt(kg, 2);
export const plural = (n, one, many = one + 's') => `${fmt(n)} ${n === 1 ? one : many}`;

// ---------- Days ----------
// A day is a 'YYYY-MM-DD' string, always in local time.

const pad = (n) => String(n).padStart(2, '0');
export const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
export function addDays(s, n) {
  const d = parseDay(s);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
export const weekday = (s) => (parseDay(s).getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
export const mondayOf = (s) => addDays(s, -weekday(s));

// Today. Before 4 in the morning still counts as yesterday (that late snack belongs to the evening).
export function today() {
  const d = new Date();
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return isoDay(d);
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// '2026-11-25' → "Wednesday 25 November" (or other options)
export const fmtDate = (s, options = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  parseDay(s).toLocaleDateString('en-GB', options);
export const fmtShort = (s) => fmtDate(s, { day: 'numeric', month: 'short' });

// "Today", "Yesterday", "Tomorrow" or "Wednesday 25 November"
export function dayName(s) {
  const t = today();
  if (s === t) return 'Today';
  if (s === addDays(t, -1)) return 'Yesterday';
  if (s === addDays(t, 1)) return 'Tomorrow';
  return fmtDate(s);
}

// ---------- Times and paces ----------

// 3520 → "58:40"   7230 → "2:00:30"
export function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '';
  let s = Math.round(sec);
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Seconds per km → "5:45"
export function fmtPace(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '';
  const total = Math.round(sec);
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

// "2:00:00", "1:58:30" or "58:40" → seconds. Two parts are minutes:seconds,
// unless `hoursFirst` (then "4:15" is 4 hours 15). Nonsense → null.
export function parseTime(str, { hoursFirst = false } = {}) {
  const parts = String(str ?? '').trim().replace(/[.,]/g, ':').split(':').filter((p) => p !== '');
  if (!parts.length || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const n = parts.map(Number);
  let sec;
  if (n.length === 3) sec = n[0] * 3600 + n[1] * 60 + n[2];
  else if (n.length === 2) sec = hoursFirst ? n[0] * 3600 + n[1] * 60 : n[0] * 60 + n[1];
  else sec = hoursFirst ? n[0] * 3600 : n[0] * 60;
  return sec > 0 ? sec : null;
}

// An address on YouTube that searches for how to do an exercise.
export const howToVideo = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise how to`)}`;

// "Log in" goes to the apps page, which sends you back here afterwards.
export const loginHref = () => '../?next=' + encodeURIComponent(location.pathname + location.hash);
