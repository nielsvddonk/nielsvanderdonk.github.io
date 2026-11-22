// Strength sessions. Each session is a list of slots: [what, sets, reps].
//
//   what   a pattern from exercises.js ('squat', 'row', …). Sweaty fills it with the first
//          exercise of that pattern you have the gear for. 'squat:1' takes the second one, so
//          two sessions in a week don't do the same squat. (Swap in the app to pick another.)
//   sets   for the usual weeks. The first two weeks and the easy weeks get one set less.
//   reps   a range: do the top of it on every set, and next time Sweaty says go heavier.
//          Holds (planks …) use the seconds in exercises.js instead.
//
// The order counts: a 30-minute session does the first 4 slots, 45 minutes the first 6, 60 all.
// "legs" says how hard the session is on your legs (0 = not, 3 = very): legs sessions are kept
// away from the day before your long run and your hard run.

export const sessions = {
  fullA: {
    name: 'Full body A', legs: 2,
    slots: [['squat', 3, '8-12'], ['push', 3, '6-12'], ['hinge', 3, '8-12'], ['row', 3, '8-12'], ['raise', 2, '10-15'], ['core', 2, '8-12'], ['curl', 2, '10-15'], ['calves', 2, '12-20']],
  },
  fullB: {
    name: 'Full body B', legs: 2,
    slots: [['lunge', 3, '8-12'], ['press', 3, '6-12'], ['bridge', 3, '8-15'], ['lats', 3, '8-12'], ['triceps', 2, '10-15'], ['side', 2, '8-12'], ['rear', 2, '12-20'], ['hips', 2, '10-15']],
  },
  fullC: {
    name: 'Full body C', legs: 2,
    slots: [['hinge:1', 3, '6-10'], ['push:1', 3, '8-12'], ['squat:1', 3, '8-12'], ['row:1', 3, '8-12'], ['legcurl', 2, '8-12'], ['fly', 2, '10-15'], ['curl:1', 2, '10-15'], ['core:1', 2, '10-15']],
  },
  upperA: {
    name: 'Upper body A', legs: 0,
    slots: [['push', 3, '6-12'], ['row', 3, '8-12'], ['press', 3, '8-12'], ['lats', 3, '8-12'], ['raise', 3, '12-15'], ['curl', 2, '10-15'], ['triceps', 2, '10-15'], ['core', 2, '8-12']],
  },
  lowerA: {
    name: 'Lower body A', legs: 3,
    slots: [['squat', 3, '6-10'], ['hinge', 3, '8-10'], ['lunge', 3, '8-12'], ['legcurl', 2, '8-12'], ['calves', 3, '10-15'], ['side', 2, '8-12'], ['hips', 2, '10-15']],
  },
  upperB: {
    name: 'Upper body B', legs: 0,
    slots: [['press:1', 3, '6-10'], ['row:1', 3, '8-12'], ['push:1', 3, '8-12'], ['rear', 3, '12-20'], ['fly', 2, '10-15'], ['curl:1', 2, '10-15'], ['triceps:1', 2, '10-15'], ['core:1', 2, '10-15']],
  },
  lowerB: {
    name: 'Lower body B', legs: 3,
    slots: [['hinge:1', 3, '6-10'], ['lunge:1', 3, '8-12'], ['bridge', 3, '8-15'], ['squat:1', 2, '10-15'], ['calves:1', 3, '12-20'], ['core', 2, '8-12'], ['carry', 2]],
  },
  push: {
    name: 'Push', legs: 0,
    slots: [['push', 3, '6-12'], ['press', 3, '8-12'], ['push:1', 3, '8-12'], ['raise', 3, '12-15'], ['fly', 2, '10-15'], ['triceps', 3, '10-15']],
  },
  pull: {
    name: 'Pull', legs: 0,
    slots: [['row', 3, '8-12'], ['lats', 3, '8-12'], ['row:1', 3, '8-12'], ['rear', 3, '12-20'], ['curl', 3, '10-15'], ['curl:1', 2, '10-15']],
  },
  legs: {
    name: 'Legs', legs: 3,
    slots: [['squat', 3, '6-10'], ['hinge', 3, '8-10'], ['lunge', 3, '8-12'], ['bridge', 3, '10-15'], ['calves', 3, '12-20'], ['core', 2, '8-12']],
  },
};

// Which sessions you get, by how many strength days you picked on the Me page.
// With one day a week, the full body sessions take turns, week by week.
export const splits = {
  1: ['fullA', 'fullB', 'fullC'],
  2: ['fullA', 'fullB'],
  3: ['fullA', 'fullB', 'fullC'],
  4: ['upperA', 'lowerA', 'upperB', 'lowerB'],
  5: ['upperA', 'lowerA', 'push', 'pull', 'legs'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  7: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'fullA'],
};

// The short optional routines, on days without strength. Here the slots are exercise ids.
export const routines = {
  core: {
    name: 'Runner’s core',
    slots: [['dead-bug', 2, '8-10'], ['side-plank', 2], ['single-leg-glute-bridge', 2, '10-12'], ['side-lying-leg-raise', 2, '12-15'], ['single-leg-calf-raise', 2, '12-15']],
  },
  mobility: {
    name: 'Mobility',
    slots: [['leg-swings', 1, '10-15'], ['hip-flexor-stretch', 1], ['calf-stretch', 1], ['hamstring-stretch', 1], ['pigeon', 1], ['worlds-greatest-stretch', 1, '5'], ['childs-pose', 1]],
  },
};

export const warmup = '5 minutes: 1 minute of marching or jumping jacks, 10 bodyweight squats, 10 hip hinges, 10 arm circles each way and 5 easy push-ups. Then do your first exercise once with a light weight.';
