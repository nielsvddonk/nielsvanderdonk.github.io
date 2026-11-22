// Log a run (or change one): distance, time, what kind of run and how it felt.

import * as store from '../store.js';
import * as model from '../model.js';
import { dayName, esc, fmtKm, fmtPace, num, today } from '../util.js';
import { seg, toast, wireSegs } from './parts.js';
import { FEEL } from './day.js';

const TYPES = [['easy', 'Easy'], ['long', 'Long'], ['quality', 'Workout'], ['recovery', 'Recovery'], ['race', 'Race'], ['other', 'Other']];
const TITLES = { easy: 'Easy run', long: 'Long run', quality: 'Workout', recovery: 'Recovery run', race: 'Race', other: 'Run' };

export default function runView(el, { date, id }) {
  const row = id ? store.get(id) : null;
  const d = model.day(date);
  const planned = d.run;
  const x = row?.data || {};
  let type = x.type || planned?.type || 'easy';
  let feel = x.feel || '';
  const sec = x.sec || 0;
  const back = date === today() ? '#/' : `#/day/${date}`;

  el.innerHTML = `
    <div class="narrow">
      <p class="back"><a href="${back}">‹ ${esc(dayName(date))}</a></p>
      <h1>${row ? 'Change run' : 'Log run'}</h1>
      ${planned && !row ? `<p class="muted">Planned: ${esc(planned.title)}, ${fmtKm(planned.km)} km</p>` : ''}
      <form id="run" autocomplete="off">
        <label class="field"><span class="label">Distance</span>
          <span class="with-unit"><input name="km" inputmode="decimal" value="${x.km ?? planned?.km ?? ''}" placeholder="10" required><span>km</span></span>
        </label>
        <div class="field"><span class="label">Time</span>
          <div class="time-in">
            <input name="h" inputmode="numeric" placeholder="0" value="${sec ? Math.floor(sec / 3600) : ''}" aria-label="Hours"><span>h</span>
            <input name="m" inputmode="numeric" placeholder="00" value="${sec ? Math.floor((sec % 3600) / 60) : ''}" aria-label="Minutes"><span>min</span>
            <input name="s" inputmode="numeric" placeholder="00" value="${sec ? Math.round(sec % 60) : ''}" aria-label="Seconds"><span>s</span>
          </div>
          <span class="hint" id="pace"></span>
        </div>
        <div class="field"><span class="label">Kind of run</span>${seg('type', type, TYPES)}</div>
        <div class="field"><span class="label">How did it feel?</span>${seg('feel', feel, FEEL.slice(1).map((f, j) => [j + 1, f]))}</div>
        <label class="field"><span class="label">Note</span><textarea name="note" rows="2" placeholder="Windy, new shoes, sore calf…">${esc(x.note || '')}</textarea></label>
        <p class="error" id="error" hidden></p>
        <div class="btn-row">
          <button class="btn btn-primary">Save</button>
          ${row ? '<button type="button" class="btn btn-danger" data-act="delete">Delete</button>' : ''}
        </div>
      </form>
    </div>`;

  const form = el.querySelector('#run');
  const seconds = () => (num(form.h.value) || 0) * 3600 + (num(form.m.value) || 0) * 60 + (num(form.s.value) || 0);
  const showPace = () => {
    const km = num(form.km.value);
    const t = seconds();
    el.querySelector('#pace').textContent = km > 0 && t > 0 ? `${fmtPace(t / km)} per km` : '';
  };
  form.addEventListener('input', showPace);
  showPace();
  wireSegs(form, (name, value) => {
    if (name === 'type') type = value;
    if (name === 'feel') feel = Number(value);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const km = num(form.km.value);
    if (!km || km <= 0 || km > 300) {
      const err = el.querySelector('#error');
      err.textContent = 'How far did you run? Fill in the distance in km.';
      err.hidden = false;
      return;
    }
    const title = planned && type === planned.type && !row ? planned.title : (x.title && type === x.type ? x.title : TITLES[type]);
    store.put({
      id: row?.id, day: date, kind: 'run',
      data: { km, sec: seconds() || null, type, title, feel: feel || null, note: form.note.value.trim(), at: x.at || Date.now() },
    });
    toast(row ? 'Run saved' : 'Run logged. Nice!');
    location.hash = back;
  });

  el.querySelector('[data-act="delete"]')?.addEventListener('click', () => {
    if (!confirm('Delete this run?')) return;
    store.remove(row.id);
    toast('Run deleted');
    location.hash = back;
  });
}
