// The board: one full-height half per player, side by side. Each half's width
// is its share of all games won, so whoever leads pushes the other to the side.
// Motion stays small: a springy push, a quick bump and a "+1" when a number changes.

const MIN_SHARE = 0.22; // the trailing half stays wide enough to read and tap
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// A quick bump: up a little for a win, down a little for a take-back.
function bump(el, up) {
  el.animate(up
    ? [{ transform: 'scale(1)' }, { transform: 'scale(1.15)', offset: 0.35 }, { transform: 'scale(.98)', offset: 0.7 }, { transform: 'scale(1)' }]
    : [{ transform: 'scale(1)' }, { transform: 'scale(.88)', offset: 0.4 }, { transform: 'scale(1)' }],
  { duration: up ? 420 : 320, easing: 'ease-out' });
}

// "+1" rises and fades out (or "−1" sinks).
function burst(card, text, up) {
  const el = document.createElement('span');
  el.className = 'burst';
  el.textContent = text;
  card.append(el);
  el.animate([
    { transform: 'translate(-50%, 0)', opacity: 0 },
    { transform: `translate(-50%, ${up ? -8 : 8}px)`, opacity: 1, offset: 0.2 },
    { transform: `translate(-50%, ${up ? -40 : 32}px)`, opacity: 0 },
  ], { duration: 800, easing: 'ease-out' }).finished.then(() => el.remove());
}

// Builds the halves once; returns update(state) to show new scores.
export function createBoard(el, players, { onWin, onUndo }) {
  el.innerHTML = players.map((p) => `
    <section class="card ${esc(p.color)}" data-id="${esc(p.id)}" aria-label="${esc(p.name)}">
      <div class="face">
        <span class="suit" aria-hidden="true">${esc(p.suit)}</span>
        <p class="score">0</p>
        <h2 class="name">${esc(p.name)}</h2>
      </div>
      <div class="controls">
        <button class="undo" type="button" aria-label="Take back ${esc(p.name)}'s last win">−</button>
        <button class="win" type="button" aria-label="${esc(p.name)} won a game">+</button>
      </div>
    </section>`).join('');

  el.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    if (e.target.closest('.win')) onWin(card.dataset.id);
    if (e.target.closest('.undo')) onUndo(card.dataset.id);
  });

  const shown = {};
  return function update({ wins, canEdit }) {
    const total = players.reduce((n, p) => n + (wins[p.id] || 0), 0);
    el.classList.toggle('can-edit', canEdit);

    for (const p of players) {
      const n = wins[p.id] || 0;
      const share = total ? n / total : 1 / players.length;
      const card = el.querySelector(`[data-id="${CSS.escape(p.id)}"]`);
      card.style.flexGrow = Math.min(Math.max(share, MIN_SHARE), 1 - MIN_SHARE);
      card.querySelector('.undo').disabled = n === 0;

      const score = card.querySelector('.score');
      score.textContent = n;
      const before = shown[p.id];
      if (before !== undefined && n !== before && !calm.matches) {
        const up = n > before;
        bump(score, up);
        burst(card, up ? '+1' : '−1', up);
      }
      shown[p.id] = n;
    }
  };
}
