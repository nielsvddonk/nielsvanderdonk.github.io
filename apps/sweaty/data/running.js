// The numbers behind the running plan. Change them here: every week is worked out again
// from these and your settings, so nothing needs updating anywhere else.
//
// How the plan works:
//   - Counting back from your race: race week, 2 taper weeks, and before that the build-up
//     ("block") where the long run grows to its peak. Everything earlier is base: the long run
//     works up to "hold" and stays there, while you get stronger in the gym.
//   - Every 4th week is an easy week: shorter long run, lighter strength.
//   - The long run grows at most `maxStep` km a week. The other runs follow the long run.

export const races = {
  marathon: { name: 'Marathon', km: 42.195, peak: 32, block: 18, hold: 18, racePaceMax: 12 },
  half: { name: 'Half marathon', km: 21.0975, peak: 19, block: 12, hold: 14, racePaceMax: 8 },
};

export const plan = {
  maxStep: 2,          // km the long run may grow in a week
  cutback: 0.7,        // easy weeks: long run × 0.7
  taper: [0.75, 0.5],  // the long run 2 weeks and 1 week before the race: × your longest
  easy: [0.4, 0.33],   // easy runs: the first is 40% of that week's long run, the others 33% …
  easyKm: [5, 12],     // … but always between 5 and 12 km
  recoveryKm: [4, 7],  // a run the day after the long run (with 4+ runs a week)
};

// Which hard workout you get on your quality day, taking turns week by week.
export const rotation = {
  base: ['fartlek', 'intervals', 'tempo'],
  build: ['intervals', 'tempo', 'racepace'],
  peak: ['racepace', 'tempo', 'racepace', 'intervals'],
};
