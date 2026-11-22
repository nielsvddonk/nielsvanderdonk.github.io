// A small front-and-back body diagram with the muscles an exercise trains lit up:
// the main muscle in full green, the helpers in light green.

// [muscle, shape] — muscle '' is a part that never lights up (head, hands, knees, feet).
const E = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
const R = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const P = (d) => `<path d="${d}"/>`;

// Front, centred on x = 60.
const FRONT = [
  ['', '<circle cx="60" cy="15" r="11"/>'],
  ['', R(55, 25, 10, 9, 3)],
  ['shoulders', E(39.5, 42, 8.5, 7.5, -20)], ['shoulders', E(80.5, 42, 8.5, 7.5, 20)],
  ['chest', P('M47 35h12v19c-6 2-12 1-16-3-2-7-1-13 4-16z')], ['chest', P('M73 35H61v19c6 2 12 1 16-3 2-7 1-13-4-16z')],
  ['biceps', E(33, 63, 5.5, 12, 8)], ['biceps', E(87, 63, 5.5, 12, -8)],
  ['forearms', E(28.5, 88, 4.8, 12.5, 8)], ['forearms', E(91.5, 88, 4.8, 12.5, -8)],
  ['', '<circle cx="25.5" cy="105" r="4"/>'], ['', '<circle cx="94.5" cy="105" r="4"/>'],
  ['core', R(51.5, 57, 17, 36, 6)],
  ['core', R(44, 58, 6.5, 30, 3.2)], ['core', R(69.5, 58, 6.5, 30, 3.2)],
  ['hips', P('M45 95h30l-6 14H51z')],
  ['quads', E(49.5, 131, 8.5, 21, 3)], ['quads', E(70.5, 131, 8.5, 21, -3)],
  ['hips', E(57.6, 123, 2.6, 10)], ['hips', E(62.4, 123, 2.6, 10)],
  ['', '<circle cx="50.5" cy="155" r="4.3"/>'], ['', '<circle cx="69.5" cy="155" r="4.3"/>'],
  ['calves', E(50.5, 177, 5, 15.5)], ['calves', E(69.5, 177, 5, 15.5)],
  ['', E(49.5, 197.5, 6, 3.4)], ['', E(70.5, 197.5, 6, 3.4)],
];

// Back, centred on x = 180.
const BACK = [
  ['', '<circle cx="180" cy="15" r="11"/>'],
  ['', R(175, 25, 10, 9, 3)],
  ['back', P('M180 31l17 8-6 8-11 16-11-16-6-8z')],
  ['shoulders', E(159.5, 42, 8.5, 7.5, -20)], ['shoulders', E(200.5, 42, 8.5, 7.5, 20)],
  ['back', P('M165 49l11 14-2 22-8-6c-4-9-4-20-1-30z')], ['back', P('M195 49l-11 14 2 22 8-6c4-9 4-20 1-30z')],
  ['triceps', E(153, 63, 5.5, 12, 8)], ['triceps', E(207, 63, 5.5, 12, -8)],
  ['forearms', E(148.5, 88, 4.8, 12.5, 8)], ['forearms', E(211.5, 88, 4.8, 12.5, -8)],
  ['', '<circle cx="145.5" cy="105" r="4"/>'], ['', '<circle cx="214.5" cy="105" r="4"/>'],
  ['lowerback', R(172, 70, 16, 24, 5)],
  ['hips', E(161, 101, 3.6, 8.5, 10)], ['hips', E(199, 101, 3.6, 8.5, -10)],
  ['glutes', E(170.5, 106, 10, 10.5)], ['glutes', E(189.5, 106, 10, 10.5)],
  ['hamstrings', E(169.5, 134, 8, 19, 3)], ['hamstrings', E(190.5, 134, 8, 19, -3)],
  ['', '<circle cx="170.5" cy="156" r="4.3"/>'], ['', '<circle cx="189.5" cy="156" r="4.3"/>'],
  ['calves', E(170.5, 176, 6.5, 15)], ['calves', E(189.5, 176, 6.5, 15)],
  ['', E(170, 197.5, 6, 3.4)], ['', E(190, 197.5, 6, 3.4)],
];

// muscles: ['quads', 'glutes', …] — the first is the main one.
export function bodyMap(muscles = [], { labels = true, className = '' } = {}) {
  const main = muscles[0];
  const part = ([m, shape]) => {
    const cls = !m ? 'bm-n' : m === main ? 'bm-m is-main' : muscles.includes(m) ? 'bm-m is-also' : 'bm-m';
    return shape.replace(/^<(\w+)/, `<$1 class="${cls}"`);
  };
  return `<svg class="body-map ${className}" viewBox="0 0 240 ${labels ? 218 : 204}" role="img" aria-label="Muscles: ${muscles.join(', ')}">
    ${FRONT.map(part).join('')}${BACK.map(part).join('')}
    ${labels ? '<text x="60" y="215" class="bm-t">front</text><text x="180" y="215" class="bm-t">back</text>' : ''}
  </svg>`;
}
