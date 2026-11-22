// Workout mode keeps the screen awake (as Hungry's cook mode does).
// Browsers drop the lock when you switch apps, so it's taken again when you come back.

let sentinel = null;
let wanted = false;

export const supported = 'wakeLock' in navigator;

async function acquire() {
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => { sentinel = null; });
    return true;
  } catch {
    return false;
  }
}

export async function enable() {
  if (!supported) return false;
  wanted = true;
  return acquire();
}

export async function disable() {
  wanted = false;
  if (sentinel) await sentinel.release().catch(() => {});
  sentinel = null;
}

document.addEventListener('visibilitychange', () => {
  if (wanted && !sentinel && document.visibilityState === 'visible') acquire();
});
