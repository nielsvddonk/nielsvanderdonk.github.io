// The settings a new person starts with (all of it can be changed on the Me page).
// Body numbers stay empty on purpose: this file is public on GitHub, so you fill those in
// the app, where only you can see them.

import { startMonday } from './plan.js';
import { today } from './util.js';

export function defaults() {
  return {
    v: 1,
    body: { sex: '', age: null, height: null, weight: null, activity: 1.35 },
    goal: { weight: null, rate: 0.5 },
    run: {
      race: 'marathon',
      raceName: '',
      raceDate: '2027-06-27', // "next summer": move it to your marathon's date
      recentKm: 21.0975,      // a recent race, for your paces
      recentTime: '2:00:00',
      goalTime: '',
      longRun: 14,            // the long run you can do now (km)
      longDay: 6,             // 0 = Monday … 6 = Sunday
      start: startMonday(today()),
    },
    // Monday first: what you do on each day of the week.
    days: [
      { run: false, lift: true },
      { run: true, lift: false },
      { run: false, lift: true },
      { run: true, lift: false },
      { run: false, lift: true },
      { run: false, lift: false },
      { run: true, lift: false },
    ],
    lift: { minutes: 45, gear: ['dumbbell', 'barbell', 'chair'], step: { dumbbell: 2, barbell: 2.5, kettlebell: 4 } },
    swaps: {},
    myFoods: [],
    myExercises: [],
  };
}

// Settings saved by an older version get the newer parts filled in.
export function complete(s) {
  const d = defaults();
  return {
    ...d, ...s,
    body: { ...d.body, ...s.body },
    goal: { ...d.goal, ...s.goal },
    run: { ...d.run, ...s.run },
    lift: { ...d.lift, ...s.lift, step: { ...d.lift.step, ...s.lift?.step } },
    days: Array.isArray(s.days) && s.days.length === 7 ? s.days : d.days,
  };
}
