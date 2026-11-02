// The board: one full-height half per player, side by side. Each half's width
// is its share of all games won, so whoever leads pushes the other to the side.
// Motion in the spirit of Balatro: floating cards, juicy number pops, +1 bursts.

const MIN_SHARE = 0.22; // the trailing half stays wide enough to read and tap
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// The number jumps up big, twists, and wobbles back into place.
function pop(el) {
  el.animate([
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(1.5) rotate(-8deg)', offset: 0.22 },
    { transform: 'scale(0.88) rotate(6deg)', offset: 0.48 },
    { transform: 'scale(1.08) rotate(-3deg)', offset: 0.7 },
    { transform: 'scale(0.98) rotate(1deg)', offset: 0.86 },
    { transform: 'scale(1) rotate(0deg)' },
  ], { duration: 700, easing: 'cubic-bezier(.2, .8, .2, 1)' });
}

// The number sinks a little and bounces back.
function dip(el) {
  el.animate([
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(0.75) rotate(5deg)', offset: 0.3 },
    { transform: 'scale(1.06) rotate(-2deg)', offset: 0.65 },
    { transform: 'scale(1) rotate(0deg)' },
  ], { duration: 500, easing: 'ease-out' });
}

// "+1" pops out above the number and floats away (or "−1" drops down).
function burst(card, text, up) {
  const el = document.createElement('span');
  el.className = 'burst';
  el.textContent = text;
  card.append(el);
  el.animate([
    { transform: 'translate(-50%, 0) scale(.3) rotate(-14deg)', opacity: 0 },
    { transform: 'translate(-50%, -12px) scale(1.25) rotate(7deg)', opacity: 1, offset: 0.25 },
    { transform: 'translate(-50%, -26px) scale(1) rotate(-3deg)', opacity: 1, offset: 0.55 },
    { transform: `translate(-50%, ${up ? -80 : 60}px) scale(.85) rotate(0deg)`, opacity: 0 },
  ], { duration: 950, easing: 'cubic-bezier(.2, .8, .2, 1)' }).finished.then(() => el.remove());
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
        if (n > before) { pop(score); burst(card, '+1', true); }
        else { dip(score); burst(card, '−1', false); }
      }
      shown[p.id] = n;
    }
  };
}
