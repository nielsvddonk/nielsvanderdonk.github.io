// "Back" in Sweaty works like a browser's back button: it returns to the page you came from.
// (An app on your home screen has no back button of its own, so the pages have one.)
// When there's no earlier Sweaty page to return to, it goes to a sensible page instead.
//
// Every page in the browser's history gets a number: how many steps into Sweaty it is.

const KEY = 'sweatyDepth';
let last = -1;

export const depth = () => (typeof history.state?.[KEY] === 'number' ? history.state[KEY] : 0);
export const canGoBack = () => depth() > 0;

// Called by the router on every page change.
export function stamp() {
  if (typeof history.state?.[KEY] !== 'number') history.replaceState({ ...(history.state || {}), [KEY]: last + 1 }, '');
  last = depth();
}

// Go to a page. replace: true adds no step to the history (redirects, the ‹ › day arrows,
// returning after saving), so Back skips it.
export function go(hash, { replace = false } = {}) {
  if (!replace) { location.hash = hash; return; }
  history.replaceState({ [KEY]: depth() }, '', hash);
  window.dispatchEvent(new Event('sweaty:rerender'));
}

export function back(fallback = '#/') {
  if (canGoBack()) history.back();
  else go(fallback, { replace: true });
}

// The "‹ Back" link at the top of a page. `fallback`: where it goes if you opened the page directly.
export const backLink = (fallback) => `<p class="back"><a href="${fallback}" data-back>‹ Back</a></p>`;
