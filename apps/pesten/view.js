// The board: one playing card per player, side by side. Each card's width is
// its share of all games won, so whoever leads pushes the other to the side.

const MIN_SHARE = 0.22; // the trailing card stays wide enough to read and tap

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Builds the cards once; returns update(state) to show new scores.
export function createBoard(el, players, { onWin, onUndo }) {
  el.innerHTML = players.map((p) => `
    <section class="card ${esc(p.color)}" data-id="${esc(p.id)}" data-suit="${esc(p.suit)}" aria-label="${esc(p.name)}">
      <span class="corner top" aria-hidden="true"><b class="rank">0</b><span>${esc(p.suit)}</span></span>
      <span class="corner bottom" aria-hidden="true"><b class="rank">0</b><span>${esc(p.suit)}</span></span>
      <h2 class="name">${esc(p.name)}</h2>
      <p class="score">0</p>
      <p class="share">50%</p>
      <div class="controls">
        <button class="win" type="button" aria-label="${esc(p.name)} won a game">+</button>
        <button class="undo" type="button" aria-label="Take back ${esc(p.name)}'s last win">−</button>
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
    const best = Math.max(...players.map((p) => wins[p.id] || 0));
    const leaders = players.filter((p) => (wins[p.id] || 0) === best).length;
    el.classList.toggle('can-edit', canEdit);

    for (const p of players) {
      const n = wins[p.id] || 0;
      const share = total ? n / total : 1 / players.length;
      const card = el.querySelector(`[data-id="${CSS.escape(p.id)}"]`);
      card.style.flexGrow = Math.min(Math.max(share, MIN_SHARE), 1 - MIN_SHARE);
      card.classList.toggle('leading', total > 0 && n === best && leaders === 1);
      card.querySelectorAll('.rank').forEach((r) => { r.textContent = n; });
      card.querySelector('.share').textContent = total ? `${Math.round(share * 100)}%` : '–';
      card.querySelector('.undo').disabled = n === 0;

      const score = card.querySelector('.score');
      score.textContent = n;
      if (shown[p.id] !== undefined && n > shown[p.id]) {
        score.classList.remove('bump');
        void score.offsetWidth; // restart the animation
        score.classList.add('bump');
      }
      shown[p.id] = n;
    }
  };
}
