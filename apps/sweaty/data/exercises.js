// The exercise library. Sweaty picks from this list for every strength session,
// skipping anything you don't have the gear for (Me → Equipment).
//
// To add an exercise, copy a line and change it:
//   x('id', 'Name', 'pattern', 'gear', 'muscles', 'How to do it', { options })
//
//   id       short and unique. Never change it later: your logged workouts refer to it.
//   pattern  the kind of movement (see PATTERNS below). A session asks for e.g. "a squat" and
//            gets the first squat in this list that you have the gear for — so the order
//            matters: put your favourite first.
//   gear     what you need, separated by spaces: 'dumbbell chair'. Empty ('') = just the floor.
//   muscles  separated by spaces, the main one first (see MUSCLES below).
//   options  time: [30, 60]   a hold, in seconds, instead of reps
//            side: true       done on each side
//            easier / harder  the id of an easier or harder version (Sweaty suggests it)
//
// Easier: the Exercises tab in the app. Add your own exercises there, or change any exercise
// (explanation, notes, a video, a picture, or keep it out of your workouts) without touching this file.

export const GEAR = [
  ['dumbbell', 'Dumbbells'],
  ['barbell', 'Barbell'],
  ['chair', 'Sturdy chair'],
  ['bench', 'Bench or sofa'],
  ['table', 'Sturdy table'],
  ['pullupbar', 'Pull-up bar'],
  ['band', 'Resistance band'],
  ['kettlebell', 'Kettlebell'],
  ['rope', 'Skipping rope'],
];

// Gear you add weight to, so the app asks how many kg you used.
export const WEIGHTED = ['dumbbell', 'barbell', 'kettlebell'];

export const MUSCLES = [
  ['chest', 'Chest'], ['back', 'Back'], ['shoulders', 'Shoulders'], ['biceps', 'Biceps'],
  ['triceps', 'Triceps'], ['forearms', 'Forearms'], ['core', 'Core'], ['lowerback', 'Lower back'],
  ['glutes', 'Glutes'], ['quads', 'Quads'], ['hamstrings', 'Hamstrings'], ['calves', 'Calves'], ['hips', 'Hips'],
];

export const PATTERNS = {
  squat: 'Squat', lunge: 'Single leg', hinge: 'Hip hinge', bridge: 'Glute bridge', legcurl: 'Hamstring curl',
  calves: 'Calves', push: 'Push', press: 'Overhead press', row: 'Row', lats: 'Lats', rear: 'Upper back',
  raise: 'Side shoulders', curl: 'Biceps', triceps: 'Triceps', fly: 'Chest fly', core: 'Core',
  side: 'Side core', hips: 'Hips', carry: 'Carry', plyo: 'Jumps', drills: 'Running drills', mobility: 'Mobility',
};

// Rest between sets, in seconds.
export const REST = {
  squat: 120, hinge: 120, lunge: 90, bridge: 90, push: 90, press: 90, row: 90, lats: 90,
  legcurl: 75, fly: 60, raise: 60, rear: 60, curl: 60, triceps: 60, carry: 60,
  calves: 45, core: 45, side: 45, hips: 45, plyo: 75, drills: 30, mobility: 10,
};

// What each kind of exercise is good for, and how to do it well (shown on every exercise's page).
export const PATTERN_INFO = {
  squat: { why: 'Strong quads and glutes carry you up hills and through the last kilometres of a race.', tips: ['Feet about shoulder-width, toes slightly out.', 'Knees go the same way as your toes.', 'Heels down, chest up.', 'Breathe in on the way down, out on the way up.'] },
  lunge: { why: 'One leg at a time, like running: builds balance and evens out your left and right side.', tips: ['Front knee stays over your foot, it doesn’t cave in.', 'Most of your weight on the front heel.', 'Down slowly, up firmly.', 'Start with your weaker leg.'] },
  hinge: { why: 'Hamstrings and glutes drive every stride, and a strong hinge protects your back.', tips: ['Push your hips back, as if closing a door with your bum.', 'Back flat from head to hips.', 'Keep the weight close to your legs.', 'Feel your hamstrings stretch, then stand up by squeezing your glutes.'] },
  bridge: { why: 'Your glutes are your running engine, and they keep your hips and knees stable.', tips: ['Push through your heels.', 'Squeeze your glutes at the top for a second.', 'Don’t arch your lower back: ribs down.', 'Knees stay in line with your feet.'] },
  legcurl: { why: 'Strong hamstrings help prevent strains, the most common injury when you run fast.', tips: ['Keep your hips up the whole time.', 'Slow on the way out: 3 seconds.', 'Cramp? Shake it out and go again.'] },
  calves: { why: 'Your calves take several times your body weight with every step. Strong calves and Achilles keep you running.', tips: ['Rise as high as you can.', 'Lower slowly, in 3 seconds.', 'On a step you can go lower, for a bigger stretch.', 'With a bent knee you train the soleus, which works hard when you run.'] },
  push: { why: 'Upper-body strength for posture and arm drive, and to balance out all the running.', tips: ['Hands under your shoulders.', 'Elbows about 45° from your body, not flared out.', 'Body in one line: squeeze your glutes and belly.', 'Lower all the way, under control.'] },
  press: { why: 'Strong shoulders keep you upright and running tall, also late in a race.', tips: ['Squeeze your glutes and belly so your back doesn’t arch.', 'Press straight up; move your head back, then through.', 'Lower to your shoulders under control.'] },
  row: { why: 'A strong upper back keeps you upright when you get tired, and balances out pushing.', tips: ['Pull with your elbow, not your hand.', 'Squeeze your shoulder blades together at the top.', 'Back flat, no jerking.', 'Lower slowly.'] },
  lats: { why: 'The big back muscles: better posture and a stronger arm swing.', tips: ['Start each rep with your shoulders down, away from your ears.', 'Pull your elbows down and back.', 'Full range: arms straight at the start.'] },
  rear: { why: 'The back of your shoulders and upper back: against hunching over a phone or a desk.', tips: ['Light weight, slow reps.', 'Lead with your elbows.', 'Squeeze your shoulder blades; don’t shrug.'] },
  raise: { why: 'Rounder, stronger shoulders, and healthy shoulder joints.', tips: ['Light weight, elbows slightly bent.', 'Up to shoulder height, not higher.', 'Lower in 2–3 seconds.'] },
  curl: { why: 'Bigger, stronger arms, and the grip to hold heavier weights.', tips: ['Elbows stay at your sides.', 'No swinging: if you need to swing, go lighter.', 'Lower slowly, all the way down.'] },
  triceps: { why: 'The triceps are two thirds of your upper arm: stronger arms and better pushing.', tips: ['Keep your elbows still.', 'Stretch fully, then straighten all the way.', 'Lower slowly.'] },
  fly: { why: 'Chest muscle, without needing a heavy bench press.', tips: ['Elbows slightly bent the whole time.', 'Open until you feel a stretch across your chest.', 'Bring the weights together as if hugging a tree.'] },
  core: { why: 'A strong middle holds your running form together when you’re tired, and protects your back.', tips: ['Lower back pressed down, or neutral.', 'Breathe out as you work.', 'Slow and controlled beats fast and sloppy.'] },
  side: { why: 'Side core and hips keep your pelvis level on every stride.', tips: ['Body in one straight line.', 'Push your hips up, don’t let them sag.', 'Do your weaker side first.'] },
  hips: { why: 'Small hip muscles keep your knees and hips in line. Weak ones are behind many running injuries.', tips: ['Slow and controlled, no swinging.', 'You should feel it on the side of your bum.', 'Keep your pelvis still.'] },
  carry: { why: 'Grip, core and posture in one simple, very effective exercise.', tips: ['Stand tall, shoulders down.', 'Short steps, breathe normally.', 'Don’t lean towards the weight.'] },
  plyo: { why: 'Jumping makes your muscles and tendons springy: you use less energy per step.', tips: ['Land softly and quietly, knees soft.', 'Rest enough: every jump should be good.', 'Stop when the jumps get sloppy.'] },
  drills: { why: 'Running drills practise good form: quick feet, knees up, landing under your hips.', tips: ['Do them after an easy warm-up jog, before a hard run or a race.', 'Stay tall, light and quick.', 'About 20 metres per drill; walk back.'] },
  mobility: { why: 'To move well and feel looser after running and sitting.', tips: ['Breathe slowly and relax into the stretch.', 'Never push into pain.', 'Hold still stretches for 30–60 seconds.'] },
};

const x = (id, name, pattern, gear, muscles, how, options = {}) =>
  ({ id, name, pattern, gear: gear ? gear.split(' ') : [], muscles: muscles.split(' '), how, ...options });

export const exercises = [
  // ---------- Squat ----------
  x('goblet-squat', 'Goblet squat', 'squat', 'dumbbell', 'quads glutes core', 'Hold one dumbbell upright against your chest. Sit down between your heels with your chest up, then stand up.', { easier: 'squat', harder: 'db-front-squat' }),
  x('db-front-squat', 'Dumbbell front squat', 'squat', 'dumbbell', 'quads glutes', 'Rest two dumbbells on your shoulders, elbows forward. Squat as deep as you can with a straight back, then stand up.', { easier: 'goblet-squat' }),
  x('sumo-squat', 'Sumo squat', 'squat', 'dumbbell', 'quads glutes hips', 'Stand wide with your toes out, one dumbbell hanging between your legs. Squat straight down, knees over your toes.'),
  x('zercher-squat', 'Zercher squat', 'squat', 'barbell', 'quads glutes core', 'Deadlift the bar to your thighs, then hook it in the crook of your elbows, against your body. Squat with your chest up.'),
  x('squat', 'Bodyweight squat', 'squat', '', 'quads glutes', 'Feet shoulder-width apart. Sit back and down as low as is comfortable, arms forward, then stand up.', { easier: 'chair-squat', harder: 'goblet-squat' }),
  x('chair-squat', 'Squat to a chair', 'squat', 'chair', 'quads glutes', 'Sit down onto a chair lightly and stand back up without using your hands.', { harder: 'squat' }),
  x('wall-sit', 'Wall sit', 'squat', '', 'quads', 'Back against a wall, slide down until your thighs are about level with the floor, and hold.', { time: [30, 60] }),

  x('db-squat', 'Dumbbell squat', 'squat', 'dumbbell', 'quads glutes', 'Dumbbells hanging at your sides. Sit down and back as deep as you can with your chest up, then stand up.'),
  x('heel-raised-goblet-squat', 'Heels-up goblet squat', 'squat', 'dumbbell', 'quads', 'A goblet squat with your heels on a thick book or a weight plate. Your knees travel further forward: extra work for your quads.'),
  x('barbell-front-squat', 'Front squat', 'squat', 'barbell', 'quads glutes core', 'Clean the bar to the front of your shoulders, elbows high, fingertips under the bar. Squat deep with your chest up, then stand.'),
  x('pause-squat', 'Pause squat', 'squat', '', 'quads glutes', 'A bodyweight squat with a 3-second pause at the bottom, then stand up fast. Harder than it sounds.', { easier: 'squat', harder: 'goblet-squat' }),
  x('db-thruster', 'Dumbbell thruster', 'squat', 'dumbbell', 'quads glutes shoulders', 'Dumbbells on your shoulders. Squat down, then stand up fast and use that drive to press the dumbbells overhead in one move.'),
  // ---------- Single leg ----------
  x('bulgarian-split-squat', 'Bulgarian split squat', 'lunge', 'chair', 'quads glutes', 'Stand a big step in front of a chair with your back foot on the seat. Lower your back knee towards the floor, push up through your front heel.', { side: true, easier: 'split-squat', harder: 'db-bulgarian-split-squat' }),
  x('db-reverse-lunge', 'Reverse lunge with dumbbells', 'lunge', 'dumbbell', 'quads glutes', 'A dumbbell in each hand. Step back and lower your back knee almost to the floor, then step forward again.', { side: true, easier: 'reverse-lunge' }),
  x('step-up', 'Step-up onto a chair', 'lunge', 'chair', 'quads glutes', 'Put a sturdy chair against a wall. Step up with one foot without pushing off with the other, then step down slowly.', { side: true, harder: 'db-step-up' }),
  x('db-bulgarian-split-squat', 'Bulgarian split squat with dumbbells', 'lunge', 'chair dumbbell', 'quads glutes', 'The Bulgarian split squat with a dumbbell in each hand.', { side: true, easier: 'bulgarian-split-squat' }),
  x('reverse-lunge', 'Reverse lunge', 'lunge', '', 'quads glutes', 'Step back and lower your back knee almost to the floor, then step forward again.', { side: true, harder: 'db-reverse-lunge' }),
  x('db-step-up', 'Step-up with dumbbells', 'lunge', 'chair dumbbell', 'quads glutes', 'The step-up with a dumbbell in each hand.', { side: true, easier: 'step-up' }),
  x('split-squat', 'Split squat', 'lunge', '', 'quads glutes', 'Stand in a long stride. Lower your back knee straight down towards the floor and push back up.', { side: true, harder: 'bulgarian-split-squat' }),
  x('lateral-lunge', 'Side lunge', 'lunge', '', 'quads glutes hips', 'Step wide to one side and sit into that hip, the other leg straight. Push back to standing.', { side: true }),
  x('walking-lunge', 'Walking lunge with dumbbells', 'lunge', 'dumbbell', 'quads glutes', 'A dumbbell in each hand. Lunge forward, one leg after the other, across the room.', { side: true }),
  x('chair-pistol', 'One-leg squat to a chair', 'lunge', 'chair', 'quads glutes core', 'Stand on one leg in front of a chair. Sit down slowly on that leg, then stand back up on it.', { side: true, easier: 'step-up' }),

  x('db-split-squat', 'Split squat with dumbbells', 'lunge', 'dumbbell', 'quads glutes', 'A dumbbell in each hand, long stride. Lower your back knee straight down towards the floor and push back up.', { side: true, easier: 'split-squat' }),
  x('cossack-squat', 'Cossack squat', 'lunge', '', 'quads glutes hips', 'A very wide stance. Sit down over one leg while the other stays straight, toes up. Shift across to the other side.', { side: true }),
  x('curtsy-lunge', 'Curtsy lunge', 'lunge', '', 'glutes quads hips', 'Step one leg back and across behind the other, like a curtsy, and lower down. Push back up.', { side: true }),
  x('lateral-step-down', 'Lateral step-down', 'lunge', '', 'quads glutes hips', 'Stand sideways on the bottom stair. Slowly lower the outside heel towards the floor by bending your standing knee, then push back up. Knee stays over your toes.', { side: true }),
  x('skater-squat', 'Skater squat', 'lunge', '', 'quads glutes', 'Stand on one leg, the other knee bent behind you. Lower until that back knee almost touches the floor, arms forward, then stand up.', { side: true, easier: 'reverse-lunge' }),
  x('db-side-lunge', 'Side lunge with a dumbbell', 'lunge', 'dumbbell', 'quads glutes hips', 'Hold one dumbbell at your chest. Step wide to one side and sit into that hip, the other leg straight. Push back.', { side: true, easier: 'lateral-lunge' }),
  // ---------- Hip hinge ----------
  x('barbell-rdl', 'Romanian deadlift', 'hinge', 'barbell', 'hamstrings glutes lowerback', 'Stand tall, bar against your thighs. Push your hips back with soft knees until you feel your hamstrings, then stand up. Back flat.', { easier: 'db-rdl' }),
  x('single-leg-rdl', 'Single-leg Romanian deadlift', 'hinge', 'dumbbell', 'hamstrings glutes core', 'A dumbbell in the opposite hand. Stand on one leg, tip forward as the other leg goes back, hips level, then stand up.', { side: true, easier: 'single-leg-reach' }),
  x('deadlift', 'Deadlift', 'hinge', 'barbell', 'hamstrings glutes lowerback back quads', 'Bar over your mid-foot, hands just outside your legs, back flat. Push the floor away to stand up, lower it the same way.'),
  x('db-rdl', 'Romanian deadlift with dumbbells', 'hinge', 'dumbbell', 'hamstrings glutes lowerback', 'A dumbbell in each hand, sliding down the front of your legs. Hips back, back flat, then stand up.'),
  x('good-morning', 'Good morning', 'hinge', 'barbell', 'hamstrings lowerback glutes', 'Bar across your upper back, soft knees. Push your hips back and tip forward with a flat back, then stand up. Keep it light.'),
  x('db-swing', 'Dumbbell swing', 'hinge', 'dumbbell', 'glutes hamstrings core', 'Hold one dumbbell with both hands. Hinge and swing it back between your legs, then snap your hips forward to swing it to chest height.'),
  x('single-leg-reach', 'Single-leg reach', 'hinge', '', 'hamstrings glutes core', 'Stand on one leg and reach your hands towards the floor as the other leg goes back. Keep your hips level.', { side: true, harder: 'single-leg-rdl' }),

  x('db-deadlift', 'Dumbbell deadlift', 'hinge', 'dumbbell', 'hamstrings glutes quads lowerback', 'Dumbbells beside your feet. Hips back, back flat, grab them and stand up tall. Lower them the same way.'),
  x('suitcase-deadlift', 'Suitcase deadlift', 'hinge', 'dumbbell', 'glutes hamstrings core', 'One dumbbell beside one foot. Deadlift it without leaning to the side: your core works to keep you straight.', { side: true }),
  x('kickstand-rdl', 'Kickstand Romanian deadlift', 'hinge', 'dumbbell', 'hamstrings glutes', 'Most of your weight on the front leg, the back foot only on its toes for balance. A Romanian deadlift with dumbbells: a step towards the single-leg version.', { side: true, harder: 'single-leg-rdl' }),
  x('sumo-deadlift', 'Sumo deadlift', 'hinge', 'barbell', 'glutes hamstrings quads hips', 'A very wide stance, toes out, hands inside your knees. Push your knees out, chest up, and stand up with the bar.'),
  x('db-sumo-deadlift', 'Dumbbell sumo deadlift', 'hinge', 'dumbbell', 'glutes hamstrings hips', 'A wide stance, toes out, one dumbbell held with both hands between your feet. Hips back, chest up, stand up.'),
  x('bw-good-morning', 'Bodyweight good morning', 'hinge', '', 'hamstrings lowerback glutes', 'Hands behind your head, soft knees. Push your hips back and tip forward with a flat back until you feel your hamstrings, then stand up.', { harder: 'single-leg-reach' }),
  x('db-snatch', 'Dumbbell snatch', 'hinge', 'dumbbell', 'glutes hamstrings shoulders back', 'One dumbbell between your feet. Hinge, then drive up with your hips and pull the dumbbell overhead in one fast move, arm straight at the top.', { side: true }),
  x('kettlebell-swing', 'Kettlebell swing', 'hinge', 'kettlebell', 'glutes hamstrings core', 'Hinge and hike the kettlebell back between your legs, then snap your hips forward so it floats up to chest height. Your arms are just ropes.'),
  // ---------- Glute bridge ----------
  x('barbell-hip-thrust', 'Hip thrust', 'bridge', 'barbell bench', 'glutes hamstrings', 'Upper back against a sofa or bench, bar across your hips on a towel. Drive your hips up until your body is flat, squeeze, lower.'),
  x('db-hip-thrust', 'Hip thrust with a dumbbell', 'bridge', 'dumbbell bench', 'glutes hamstrings', 'Upper back against a sofa or bench, a dumbbell on your hips. Drive your hips up, squeeze, lower.'),
  x('barbell-glute-bridge', 'Glute bridge with the barbell', 'bridge', 'barbell', 'glutes hamstrings', 'On your back, knees bent, the bar across your hips on a towel. Push your hips up, squeeze for a second, lower.'),
  x('db-glute-bridge', 'Glute bridge with a dumbbell', 'bridge', 'dumbbell', 'glutes hamstrings', 'On your back, knees bent, a dumbbell on your hips. Push your hips up, squeeze for a second, lower.'),
  x('glute-bridge', 'Glute bridge', 'bridge', '', 'glutes hamstrings', 'On your back, knees bent, feet flat. Push your hips up until you are straight from knees to shoulders, squeeze, lower.', { harder: 'single-leg-glute-bridge' }),
  x('single-leg-glute-bridge', 'Single-leg glute bridge', 'bridge', '', 'glutes hamstrings', 'A glute bridge on one leg, the other knee pulled in.', { side: true, easier: 'glute-bridge' }),
  x('hip-thrust', 'Hip thrust (bodyweight)', 'bridge', 'bench', 'glutes hamstrings', 'Upper back against a sofa or bench, feet flat. Drive your hips up, squeeze, lower.', { harder: 'db-hip-thrust' }),

  x('marching-bridge', 'Marching glute bridge', 'bridge', '', 'glutes hamstrings core', 'Hold a glute bridge and lift one foot a little off the floor, then the other, without letting your hips drop or tilt.', { harder: 'single-leg-glute-bridge' }),
  x('frog-pump', 'Frog pump', 'bridge', '', 'glutes', 'On your back with the soles of your feet together, knees out. Push your hips up and squeeze hard. Quick, lots of reps.'),
  x('single-leg-hip-thrust', 'Single-leg hip thrust', 'bridge', 'bench', 'glutes hamstrings', 'Upper back against a sofa or bench, one foot on the floor, the other leg up. Drive your hips up on one leg.', { side: true, easier: 'hip-thrust' }),
  // ---------- Hamstring curl ----------
  x('towel-leg-curl', 'Towel leg curl', 'legcurl', '', 'hamstrings glutes', 'On your back on a smooth floor, heels on a towel. Lift your hips, pull your heels in, then slide them out slowly.', { harder: 'single-leg-towel-curl' }),
  x('chair-hamstring-bridge', 'Hamstring bridge on a chair', 'legcurl', 'chair', 'hamstrings glutes', 'On your back with your heels on a chair seat, legs almost straight. Push your hips up and lower slowly.'),
  x('nordic-curl', 'Nordic curl', 'legcurl', 'bench', 'hamstrings', 'Kneel with your ankles hooked under a heavy sofa. Lower your body forward as slowly as you can, catch yourself with your hands, push back up.'),
  x('single-leg-towel-curl', 'Single-leg towel leg curl', 'legcurl', '', 'hamstrings glutes', 'The towel leg curl on one leg.', { side: true, easier: 'towel-leg-curl' }),

  x('single-leg-chair-bridge', 'Single-leg hamstring bridge', 'legcurl', 'chair', 'hamstrings glutes', 'One heel on a chair seat, the other leg up. Push your hips up and lower slowly.', { side: true, easier: 'chair-hamstring-bridge' }),
  x('hamstring-walkout', 'Hamstring walkout', 'legcurl', '', 'hamstrings glutes', 'Start in a glute bridge. Walk your heels out in small steps until your legs are almost straight, then walk back, hips up the whole time.'),
  x('db-leg-curl', 'Lying dumbbell leg curl', 'legcurl', 'dumbbell', 'hamstrings', 'Lie face down with a light dumbbell held between your feet. Curl your heels towards your bum and lower slowly. Easiest when someone puts the dumbbell in place.'),
  // ---------- Calves ----------
  x('single-leg-calf-raise', 'Single-leg calf raise', 'calves', '', 'calves', 'Stand on one foot on the edge of a step (or the floor), holding a wall. Rise as high as you can, then lower slowly for 3 seconds.', { side: true, easier: 'calf-raise' }),
  x('db-calf-raise', 'Calf raise with dumbbells', 'calves', 'dumbbell', 'calves', 'A dumbbell in each hand, on the edge of a step (or the floor). Rise as high as you can and lower slowly.'),
  x('seated-calf-raise', 'Seated calf raise', 'calves', 'chair dumbbell', 'calves', 'Sit on a chair with a dumbbell on each knee. Lift your heels as high as you can, lower slowly.'),
  x('calf-raise', 'Calf raise', 'calves', '', 'calves', 'Stand on both feet, holding a wall. Rise as high as you can, lower slowly.', { harder: 'single-leg-calf-raise' }),
  x('tibialis-raise', 'Tibialis raise', 'calves', '', 'calves', 'Lean your back against a wall, feet a step forward. Lift your toes as high as you can, lower slowly. Good for your shins.'),
  x('pogo-hops', 'Pogo hops', 'calves', '', 'calves', 'Small quick bounces on the balls of your feet, knees almost straight. Springy, like a ball.', { time: [20, 30] }),

  x('bent-knee-calf-raise', 'Bent-knee calf raise', 'calves', '', 'calves', 'Stand on one leg with the knee a little bent and keep it bent. Rise up high and lower slowly. Trains the soleus, which works hard when you run.', { side: true }),
  x('db-single-leg-calf-raise', 'Single-leg calf raise with a dumbbell', 'calves', 'dumbbell', 'calves', 'A dumbbell in the hand on the same side, the other hand on a wall. Rise as high as you can on one foot, lower in 3 seconds.', { side: true, easier: 'single-leg-calf-raise' }),
  x('barbell-calf-raise', 'Calf raise with the barbell', 'calves', 'barbell', 'calves', 'Hold the barbell at your thighs, the balls of your feet on a book or a plate. Rise high, lower slowly.'),
  // ---------- Push ----------
  x('push-up', 'Push-up', 'push', '', 'chest triceps shoulders core', 'Hands under your shoulders, body in one straight line. Lower your chest to just above the floor, push back up.', { easier: 'incline-push-up', harder: 'decline-push-up' }),
  x('db-floor-press', 'Floor press with dumbbells', 'push', 'dumbbell', 'chest triceps shoulders', 'Lie on the floor, knees bent, dumbbells above your chest. Lower until your upper arms touch the floor, press up.'),
  x('barbell-floor-press', 'Floor press with the barbell', 'push', 'barbell', 'chest triceps shoulders', 'Lie on the floor with the bar over your chest (roll it up from your hips). Lower until your elbows touch the floor, press up.'),
  x('decline-push-up', 'Decline push-up', 'push', 'chair', 'chest shoulders triceps', 'A push-up with your feet on a chair.', { easier: 'push-up' }),
  x('dumbbell-push-up', 'Deep push-up on dumbbells', 'push', 'dumbbell', 'chest triceps shoulders', 'A push-up with your hands on the dumbbell handles, so you can go deeper.', { easier: 'push-up', harder: 'decline-push-up' }),
  x('incline-push-up', 'Incline push-up', 'push', 'chair', 'chest triceps shoulders', 'A push-up with your hands on the seat of a chair that stands against a wall.', { easier: 'knee-push-up', harder: 'push-up' }),
  x('knee-push-up', 'Knee push-up', 'push', '', 'chest triceps shoulders', 'A push-up from your knees, body straight from knees to head.', { harder: 'push-up' }),
  x('wide-push-up', 'Wide push-up', 'push', '', 'chest shoulders', 'A push-up with your hands wider than your shoulders.'),
  x('archer-push-up', 'Archer push-up', 'push', '', 'chest triceps shoulders', 'A wide push-up where you lower towards one hand while the other arm stays straight.', { side: true, easier: 'wide-push-up' }),

  x('slow-push-up', 'Slow push-up', 'push', '', 'chest triceps shoulders', 'A push-up taking 3 seconds on the way down, with a short pause at the bottom.', { easier: 'push-up', harder: 'decline-push-up' }),
  x('spiderman-push-up', 'Spider-Man push-up', 'push', '', 'chest triceps core hips', 'On the way down, bring one knee towards the elbow on the same side. Alternate sides.', { side: true }),
  x('t-push-up', 'T push-up', 'push', '', 'chest shoulders core', 'Do a push-up, then rotate into a side plank with one arm up. Back down, push-up, other side.', { side: true }),
  x('hindu-push-up', 'Hindu push-up', 'push', '', 'chest shoulders triceps', 'From an upside-down V, swoop your chest down close to the floor and up into a cobra, then push your hips back up.'),
  x('clap-push-up', 'Clap push-up', 'push', '', 'chest triceps shoulders', 'Push up so fast that your hands leave the floor, clap, and land softly. For when normal push-ups are easy.', { easier: 'push-up' }),
  x('pseudo-planche-push-up', 'Pseudo planche push-up', 'push', '', 'chest shoulders triceps core', 'Hands next to your hips, fingers turned out, lean forward so your shoulders are past your hands. Push up from there. Very hard.', { easier: 'decline-push-up' }),
  x('single-arm-floor-press', 'Single-arm floor press', 'push', 'dumbbell', 'chest triceps core', 'A floor press with one dumbbell. Your body wants to roll: don’t let it.', { side: true }),
  // ---------- Overhead press ----------
  x('db-shoulder-press', 'Shoulder press', 'press', 'dumbbell', 'shoulders triceps', 'Dumbbells at shoulder height, standing tall. Press them straight up without leaning back, lower slowly.'),
  x('barbell-overhead-press', 'Overhead press', 'press', 'barbell', 'shoulders triceps core', 'Lift the bar to your shoulders. Squeeze your glutes and press it overhead, head through at the top.'),
  x('arnold-press', 'Arnold press', 'press', 'dumbbell', 'shoulders triceps', 'Start with the dumbbells in front of your shoulders, palms facing you. Turn your palms out as you press up.'),
  x('pike-push-up', 'Pike push-up', 'press', '', 'shoulders triceps', 'Hips high in an upside-down V. Bend your elbows to lower your head towards the floor, push back up.', { harder: 'elevated-pike-push-up' }),
  x('elevated-pike-push-up', 'Pike push-up with feet on a chair', 'press', 'chair', 'shoulders triceps', 'The pike push-up with your feet on a chair.', { easier: 'pike-push-up' }),
  x('single-arm-press', 'Single-arm shoulder press', 'press', 'dumbbell', 'shoulders triceps core', 'Press one dumbbell at a time, the other hand on your belly to stay straight.', { side: true }),

  x('z-press', 'Z press', 'press', 'dumbbell', 'shoulders triceps core', 'Sit on the floor with your legs straight out. Press the dumbbells overhead without leaning back: honest shoulder work.'),
  x('half-kneeling-press', 'Half-kneeling one-arm press', 'press', 'dumbbell', 'shoulders core', 'Kneel on one knee with the dumbbell on the same side as that knee. Squeeze your glute and press it overhead.', { side: true }),
  x('db-push-press', 'Push press with dumbbells', 'press', 'dumbbell', 'shoulders triceps quads', 'Dumbbells at your shoulders. Dip your knees a little, drive up and use that to press the dumbbells overhead.'),
  x('barbell-push-press', 'Push press', 'press', 'barbell', 'shoulders triceps quads', 'Bar at your shoulders. Dip your knees a little, drive up and use that to press the bar overhead. Heavier than a strict press.'),
  x('landmine-press', 'Landmine press', 'press', 'barbell', 'shoulders chest triceps core', 'Put one end of the barbell in a corner (a towel protects the wall). Hold the other end at your shoulder and press it up and forward.', { side: true }),
  x('db-clean-press', 'Dumbbell clean and press', 'press', 'dumbbell', 'shoulders glutes hamstrings', 'Dumbbells at your sides. Hinge, pull them to your shoulders in one move, then press them overhead.'),
  x('wall-handstand', 'Wall handstand hold', 'press', '', 'shoulders triceps core', 'Walk your feet up a wall until you’re upside down on your hands, chest towards the wall, and hold. Come down the same way.', { time: [15, 40], easier: 'elevated-pike-push-up' }),
  // ---------- Row ----------
  x('db-row', 'One-arm dumbbell row', 'row', 'dumbbell chair', 'back biceps', 'One hand and knee on a chair, back flat. Pull the dumbbell up to your hip, lower slowly.', { side: true }),
  x('barbell-row', 'Bent-over row', 'row', 'barbell', 'back biceps lowerback', 'Hinge forward to about 45°, back flat. Pull the bar to your lower ribs, lower slowly.'),
  x('db-bent-over-row', 'Bent-over row with dumbbells', 'row', 'dumbbell', 'back biceps', 'Hinge forward, back flat, a dumbbell in each hand. Pull both to your hips, lower slowly.'),
  x('renegade-row', 'Renegade row', 'row', 'dumbbell', 'back core biceps', 'Push-up position on two dumbbells. Row one to your hip without twisting, then the other.', { side: true }),
  x('table-row', 'Row under a table', 'row', 'table', 'back biceps', 'Lie under a sturdy table, hold the edge, body straight. Pull your chest up to the edge.'),
  x('door-frame-row', 'Door frame row', 'row', '', 'back biceps', 'Hold both sides of an open door frame at chest height, lean back with straight arms, pull yourself in.'),

  x('underhand-row', 'Underhand bent-over row', 'row', 'barbell', 'back biceps', 'A bent-over row with your palms facing up, pulling the bar to your belly button.'),
  x('pendlay-row', 'Pendlay row', 'row', 'barbell', 'back lowerback biceps', 'Back flat, almost parallel to the floor. Row the bar from the floor to your chest, fast, and put it back down every rep.'),
  x('gorilla-row', 'Gorilla row', 'row', 'dumbbell', 'back biceps core', 'Two dumbbells on the floor between your feet, in a deep hinge. Row one up, lower it, row the other.', { side: true }),
  x('landmine-row', 'Landmine row', 'row', 'barbell', 'back biceps', 'One end of the bar in a corner. Stand over the other end, hinge forward and row it to your chest with both hands.'),
  x('meadows-row', 'Meadows row', 'row', 'barbell', 'back biceps', 'Stand side-on to a bar in a corner, hinge, and row the end of the bar up with one hand.', { side: true }),
  // ---------- Lats ----------
  x('pull-up', 'Pull-up', 'lats', 'pullupbar', 'back biceps', 'Hang from the bar, hands shoulder-width, palms away. Pull your chin over the bar, lower all the way.', { easier: 'negative-pull-up' }),
  x('chin-up', 'Chin-up', 'lats', 'pullupbar', 'back biceps', 'A pull-up with your palms facing you.'),
  x('band-pulldown', 'Band pulldown', 'lats', 'band', 'back biceps', 'Anchor a band high (over a door). Pull it down to your chest, elbows down and back.'),
  x('db-pullover', 'Dumbbell pullover', 'lats', 'dumbbell', 'back chest', 'Lie on the floor, one dumbbell held in both hands above your chest. Lower it behind your head with slightly bent arms, pull it back.'),
  x('barbell-wide-row', 'Wide-grip row', 'lats', 'barbell', 'back shoulders biceps', 'A bent-over row with a wide grip, pulling the bar to your chest.'),
  x('negative-pull-up', 'Slow pull-up lowering', 'lats', 'pullupbar', 'back biceps', 'Jump to the top of a pull-up and lower yourself as slowly as you can.', { harder: 'pull-up' }),
  x('lying-lat-pull', 'Lying lat pull', 'lats', '', 'back shoulders', 'Lie face down, arms overhead and off the floor. Pull your elbows down to your sides, squeeze your shoulder blades, reach back out.'),

  x('band-straight-arm-pulldown', 'Band straight-arm pulldown', 'lats', 'band', 'back', 'Band anchored high. With straight arms, pull it down to your thighs, squeeze your lats, let it back up slowly.'),
  x('dead-hang', 'Dead hang', 'lats', 'pullupbar', 'forearms back shoulders', 'Hang from the bar with straight arms and active shoulders, and breathe.', { time: [20, 45] }),
  x('scapula-pull-up', 'Scapula pull-up', 'lats', 'pullupbar', 'back', 'Hang from the bar and, without bending your arms, pull your shoulders down and back so you rise a few centimetres.', { harder: 'negative-pull-up' }),
  // ---------- Upper back ----------
  x('db-reverse-fly', 'Reverse fly', 'rear', 'dumbbell', 'shoulders back', 'Hinge forward, light dumbbells hanging. Raise your arms out to the sides, squeeze your shoulder blades.'),
  x('ytw-raise', 'Y-T-W raise', 'rear', '', 'shoulders back', 'Lie face down. Lift your arms in a Y, then a T, then a W, thumbs up. One Y-T-W is one rep.'),
  x('reverse-snow-angel', 'Reverse snow angel', 'rear', '', 'shoulders back', 'Lie face down, arms by your sides and off the floor. Sweep them overhead and back, like a snow angel.'),
  x('band-pull-apart', 'Band pull-apart', 'rear', 'band', 'shoulders back', 'Hold a band in front of you at shoulder height. Pull it apart until it touches your chest.'),
  x('face-pull', 'Band face pull', 'rear', 'band', 'shoulders back', 'A band anchored at face height. Pull it to your forehead, elbows high and wide.'),
  x('db-shrug', 'Shrug', 'rear', 'dumbbell', 'back forearms', 'Dumbbells by your sides. Lift your shoulders to your ears, hold a second, lower.'),

  x('db-rear-delt-row', 'Rear-delt row', 'rear', 'dumbbell', 'shoulders back', 'Hinge forward, palms facing back. Row the dumbbells with your elbows going wide, out to the sides.'),
  x('bent-over-y-raise', 'Bent-over Y raise', 'rear', 'dumbbell', 'shoulders back', 'Hinge forward with very light dumbbells. Raise your arms forward and out into a Y, thumbs up.'),
  x('cuban-press', 'Cuban press', 'rear', 'dumbbell', 'shoulders', 'Light dumbbells. Upright row to chest height, turn your forearms up so the weights point at the ceiling, press them up. Reverse it all the way down.'),
  x('side-lying-external-rotation', 'Side-lying external rotation', 'rear', 'dumbbell', 'shoulders', 'Lie on your side, top elbow pinned to your side at 90°. Rotate the light dumbbell up and lower slowly. Keeps your shoulders healthy.', { side: true }),
  x('barbell-shrug', 'Barbell shrug', 'rear', 'barbell', 'back forearms', 'Bar at your thighs. Lift your shoulders to your ears, hold a second, lower.'),
  // ---------- Side shoulders ----------
  x('lateral-raise', 'Lateral raise', 'raise', 'dumbbell', 'shoulders', 'Light dumbbells by your sides. Raise your arms out to shoulder height, lower slowly.'),
  x('lean-away-lateral-raise', 'Lean-away lateral raise', 'raise', 'dumbbell', 'shoulders', 'Hold a door frame with one hand and lean away. Raise one dumbbell out to the side.', { side: true }),
  x('front-raise', 'Front raise', 'raise', 'dumbbell', 'shoulders', 'Raise the dumbbells in front of you to shoulder height, lower slowly.'),
  x('band-lateral-raise', 'Band lateral raise', 'raise', 'band', 'shoulders', 'Stand on a band and raise your arms out to the sides.'),

  x('upright-row', 'Upright row', 'raise', 'dumbbell', 'shoulders back', 'Dumbbells in front of your thighs. Pull them up along your body to chest height, elbows leading and wide.'),
  x('seated-lateral-raise', 'Seated lateral raise', 'raise', 'dumbbell chair', 'shoulders', 'A lateral raise sitting on a chair: no swinging possible.'),
  x('plate-front-raise', 'Plate front raise', 'raise', 'barbell', 'shoulders', 'Hold a weight plate with both hands and raise it straight in front of you to eye height, lower slowly.'),
  // ---------- Biceps ----------
  x('db-curl', 'Biceps curl', 'curl', 'dumbbell', 'biceps forearms', 'Dumbbells by your sides, palms forward. Curl them up without swinging, lower slowly.'),
  x('hammer-curl', 'Hammer curl', 'curl', 'dumbbell', 'biceps forearms', 'A curl with your palms facing each other.'),
  x('barbell-curl', 'Barbell curl', 'curl', 'barbell', 'biceps forearms', 'Hold the bar shoulder-width, palms forward. Curl it up without swinging, lower slowly.'),
  x('concentration-curl', 'Concentration curl', 'curl', 'dumbbell chair', 'biceps', 'Sit on a chair, elbow against the inside of your thigh. Curl one dumbbell up slowly.', { side: true }),
  x('door-frame-curl', 'Door frame curl', 'curl', '', 'biceps', 'Hold a door frame with one hand at chest height, lean back, and curl yourself in with your biceps.', { side: true }),

  x('zottman-curl', 'Zottman curl', 'curl', 'dumbbell', 'biceps forearms', 'Curl up with your palms up, turn your palms down at the top, and lower slowly like that.'),
  x('cross-body-curl', 'Cross-body hammer curl', 'curl', 'dumbbell', 'biceps forearms', 'Curl one dumbbell up and across your body towards the other shoulder, palm facing in.', { side: true }),
  x('reverse-curl', 'Reverse curl', 'curl', 'barbell', 'forearms biceps', 'A barbell curl with your palms facing down. Great for your forearms.'),
  x('drag-curl', 'Drag curl', 'curl', 'barbell', 'biceps', 'Curl the bar up while keeping it against your body, elbows moving back.'),
  x('towel-curl', 'Towel curl', 'curl', '', 'biceps forearms', 'Stand on the middle of a towel with one foot and hold both ends. Curl up hard while your leg pushes back a little: slow up, slow down. Works anywhere.'),
  // ---------- Triceps ----------
  x('overhead-extension', 'Overhead triceps extension', 'triceps', 'dumbbell', 'triceps', 'Hold one dumbbell overhead with both hands. Lower it behind your head, extend back up.'),
  x('chair-dip', 'Chair dip', 'triceps', 'chair', 'triceps chest shoulders', 'Hands on the edge of a chair behind you, legs out. Bend your elbows to 90°, push back up.'),
  x('db-skull-crusher', 'Lying triceps extension', 'triceps', 'dumbbell', 'triceps', 'Lie on the floor, dumbbells above you. Bend only your elbows to lower them next to your head, then extend.'),
  x('close-grip-push-up', 'Close-grip push-up', 'triceps', '', 'triceps chest', 'A push-up with your hands close together, elbows along your body.'),
  x('barbell-skull-crusher', 'Lying triceps extension with the barbell', 'triceps', 'barbell', 'triceps', 'Lie on the floor, bar above your chest. Bend only your elbows to lower it to your forehead, then extend.'),
  x('close-grip-floor-press', 'Close-grip floor press', 'triceps', 'barbell', 'triceps chest', 'A floor press with your hands shoulder-width apart, elbows close to your body.'),
  x('kickback', 'Triceps kickback', 'triceps', 'dumbbell', 'triceps', 'Hinge forward, elbow high by your side. Straighten your arm back, squeeze, lower.', { side: true }),

  x('tate-press', 'Tate press', 'triceps', 'dumbbell', 'triceps', 'On your back, dumbbells above your chest with the ends touching. Bend your elbows out so the dumbbells lower to your chest, then press back up.'),
  x('one-arm-overhead-extension', 'One-arm overhead extension', 'triceps', 'dumbbell', 'triceps', 'One dumbbell overhead. Lower it behind your head, elbow pointing up, then straighten your arm.', { side: true }),
  x('chair-triceps-extension', 'Bodyweight triceps extension', 'triceps', 'chair', 'triceps', 'Kneel in front of a chair with your hands on the seat edge. Bend your elbows to lower your forehead towards your hands, then straighten.'),
  // ---------- Chest fly ----------
  x('floor-fly', 'Floor fly', 'fly', 'dumbbell', 'chest shoulders', 'Lie on the floor, dumbbells above your chest, arms slightly bent. Open your arms until your elbows touch the floor, bring them back together.'),

  x('squeeze-press', 'Squeeze press', 'fly', 'dumbbell', 'chest triceps', 'On the floor, press two dumbbells up while squeezing them together the whole time.'),
  x('svend-press', 'Svend press', 'fly', 'barbell', 'chest shoulders', 'Squeeze a weight plate between your palms at your chest and press it straight out, still squeezing, and back.'),
  x('band-fly', 'Band chest fly', 'fly', 'band', 'chest', 'Band anchored behind you at chest height. Bring your arms together in front of you, slightly bent, like a hug.'),
  // ---------- Core ----------
  x('dead-bug', 'Dead bug', 'core', '', 'core', 'On your back, arms up, knees above your hips. Lower the opposite arm and leg slowly, keeping your lower back on the floor.', { side: true }),
  x('reverse-crunch', 'Reverse crunch', 'core', '', 'core', 'On your back, knees bent up. Curl your hips off the floor towards your chest, lower slowly.'),
  x('plank', 'Plank', 'core', '', 'core shoulders', 'Forearms under your shoulders, body in one straight line. Squeeze your glutes and belly.', { time: [30, 60] }),
  x('hollow-hold', 'Hollow hold', 'core', '', 'core', 'On your back, press your lower back down, lift your shoulders and legs a little, and hold.', { time: [20, 40] }),
  x('leg-raise', 'Lying leg raise', 'core', '', 'core hips', 'On your back, legs straight. Raise them to vertical and lower slowly, without your back arching.'),
  x('bird-dog', 'Bird dog', 'core', '', 'core lowerback glutes', 'On hands and knees, stretch out the opposite arm and leg, hold a second, switch.', { side: true }),
  x('mountain-climber', 'Mountain climbers', 'core', '', 'core shoulders hips', 'In push-up position, drive your knees to your chest one after the other.', { time: [30, 45] }),
  x('russian-twist', 'Russian twist', 'core', 'dumbbell', 'core', 'Sit leaning back, a dumbbell in both hands. Turn it to one side, then the other.'),
  x('shoulder-tap', 'Plank shoulder tap', 'core', '', 'core shoulders', 'In push-up position, tap one shoulder with the opposite hand without rocking your hips.', { side: true }),
  x('barbell-rollout', 'Barbell rollout', 'core', 'barbell', 'core shoulders', 'Kneel holding a barbell with round plates. Roll it forward as far as you can with a flat back, pull it back.'),
  x('superman', 'Superman', 'core', '', 'lowerback glutes', 'Lie face down. Lift your arms, chest and legs off the floor, hold a second, lower.'),

  x('crunch', 'Crunch', 'core', '', 'core', 'On your back, knees bent. Curl your shoulders off the floor towards your hips, lower slowly. Hands lightly at your head: don’t pull.'),
  x('bicycle-crunch', 'Bicycle crunch', 'core', '', 'core', 'Crunch and bring one elbow towards the opposite knee while the other leg stretches out. Alternate slowly.', { side: true }),
  x('flutter-kicks', 'Flutter kicks', 'core', '', 'core hips', 'On your back, lower back pressed down, legs straight and a little off the floor. Kick small and fast.', { time: [20, 40] }),
  x('bear-plank', 'Bear plank', 'core', '', 'core shoulders quads', 'On hands and toes, knees bent and hovering a few centimetres off the floor. Hold it with a flat back.', { time: [20, 45] }),
  x('bear-crawl', 'Bear crawl', 'core', '', 'core shoulders quads', 'From a bear plank, crawl forward and back with small steps, knees low, hips steady.', { time: [20, 40] }),
  x('plank-up-down', 'Plank up-down', 'core', '', 'core shoulders triceps', 'From a forearm plank, push up onto one hand, then the other, then back down to your forearms. Hips stay still.'),
  x('v-up', 'V-up', 'core', '', 'core hips', 'On your back, arms overhead. Lift your legs and upper body at the same time to touch your toes, lower slowly.', { easier: 'reverse-crunch' }),
  x('hanging-knee-raise', 'Hanging knee raise', 'core', 'pullupbar', 'core hips forearms', 'Hang from the bar and pull your knees up to your chest without swinging, lower slowly.'),
  x('l-sit', 'L-sit between two chairs', 'core', 'chair', 'core triceps hips', 'Two sturdy chairs side by side, hands on the seats. Push yourself up, lift your legs (bent or straight) and hold.', { time: [10, 30] }),
  x('turkish-get-up', 'Turkish get-up', 'core', 'dumbbell', 'core shoulders glutes', 'From lying on your back with a dumbbell straight up in one hand, stand up step by step while the arm stays straight up, then lie back down. Learn it light.', { side: true }),
  // ---------- Side core ----------
  x('side-plank', 'Side plank', 'side', '', 'core hips', 'On one forearm and the side of your feet, body straight. Hold your hips high.', { time: [20, 45], side: true, harder: 'copenhagen-plank' }),
  x('copenhagen-plank', 'Copenhagen plank', 'side', 'chair', 'hips core', 'A side plank with your top leg on a chair seat (knee on it is easier, ankle is harder). Lift your hips and hold.', { time: [15, 30], side: true, easier: 'side-plank' }),
  x('suitcase-carry', 'Suitcase carry', 'side', 'dumbbell', 'core forearms', 'Hold one heavy dumbbell at your side and walk tall without leaning. Switch hands.', { time: [30, 45], side: true }),
  x('side-plank-dip', 'Side plank hip dip', 'side', '', 'core hips', 'In a side plank, lower your hips to the floor and lift them back up.', { side: true }),
  x('side-bend', 'Side bend', 'side', 'dumbbell', 'core', 'A dumbbell in one hand. Lean to that side and come back up using your waist.', { side: true }),
  x('pallof-press', 'Pallof press', 'side', 'band', 'core', 'A band anchored at chest height to your side. Press it straight out and hold, without letting it turn you.', { side: true }),

  x('side-plank-reach', 'Side plank reach-through', 'side', '', 'core', 'In a side plank, reach your top arm under your body and back up to the ceiling. Hips stay high.', { side: true }),
  x('side-plank-leg-lift', 'Side plank with leg lift', 'side', '', 'core hips glutes', 'In a side plank, lift your top leg and hold. Hard on the side of your hip: great for runners.', { time: [15, 30], side: true, easier: 'side-plank' }),
  x('woodchop', 'Dumbbell woodchop', 'side', 'dumbbell', 'core shoulders', 'One dumbbell in both hands by one hip. Rotate and lift it diagonally across your body to above the other shoulder, pivoting on your feet.', { side: true }),
  // ---------- Hips ----------
  x('side-lying-leg-raise', 'Side-lying leg raise', 'hips', '', 'hips glutes', 'Lie on your side, bottom knee bent. Lift your top leg, straight and slightly back, lower slowly.', { side: true }),
  x('clamshell', 'Clamshell', 'hips', '', 'glutes hips', 'Lie on your side, knees bent, feet together. Lift your top knee without rolling back.', { side: true }),
  x('fire-hydrant', 'Fire hydrant', 'hips', '', 'glutes hips', 'On hands and knees, lift one bent knee out to the side, lower slowly.', { side: true }),
  x('single-leg-balance', 'Single-leg balance reach', 'hips', '', 'hips calves core', 'Stand on one leg. Tap the other foot lightly forward, to the side and behind you, staying balanced.', { time: [30, 45], side: true }),
  x('band-walk', 'Band side walk', 'hips', 'band', 'glutes hips', 'Band around your knees, half squat. Walk sideways with small steps.'),
  x('standing-knee-drive', 'Standing knee drive', 'hips', '', 'hips core', 'Stand tall, drive one knee up to hip height, hold a second, lower slowly.', { side: true }),

  x('hip-hike', 'Hip hike', 'hips', '', 'hips glutes', 'Stand on one leg on the bottom stair, the other foot hanging. Let that hip drop, then lift it using the side of your standing hip. A small move with a big effect for runners.', { side: true }),
  x('donkey-kick', 'Donkey kick', 'hips', '', 'glutes', 'On hands and knees, kick one foot up to the ceiling with the knee bent, squeeze your glute, lower slowly.', { side: true }),
  x('inner-thigh-raise', 'Side-lying inner thigh raise', 'hips', '', 'hips', 'Lie on your side with your top foot on the floor in front of you. Lift the straight bottom leg up and down.', { side: true }),
  x('standing-hip-abduction', 'Standing side leg raise', 'hips', '', 'hips glutes', 'Hold a wall and lift one straight leg out to the side without leaning, lower slowly.', { side: true }),
  x('monster-walk', 'Band monster walk', 'hips', 'band', 'glutes hips', 'Band around your ankles or knees, half squat. Walk forward and backward with wide steps.'),
  x('hip-airplane', 'Hip airplane', 'hips', '', 'hips glutes core', 'Stand on one leg, tipped forward as in a single-leg deadlift. Slowly rotate your hips open and closed. Hold a wall if you need to.', { side: true }),
  // ---------- Carry ----------
  x('farmer-carry', 'Farmer’s carry', 'carry', 'dumbbell', 'forearms core back', 'Hold a heavy dumbbell in each hand and walk tall with short steps.', { time: [30, 60] }),

  x('overhead-carry', 'Overhead carry', 'carry', 'dumbbell', 'shoulders core', 'Hold a dumbbell straight overhead (or one in each hand) and walk tall, ribs down.', { time: [20, 40] }),

  // ---------- Jumps ----------
  x('jump-squat', 'Jump squat', 'plyo', '', 'quads glutes calves', 'Squat halfway down, then jump up as high as you can. Land softly and go straight into the next one.'),
  x('jump-lunge', 'Jumping lunge', 'plyo', '', 'quads glutes calves', 'From a lunge, jump up and switch legs in the air, then land softly in a lunge on the other side.', { side: true }),
  x('skater-jump', 'Skater jumps', 'plyo', '', 'glutes quads hips calves', 'Jump sideways from one leg to the other like a speed skater, land softly and hold for a moment.', { side: true }),
  x('broad-jump', 'Broad jump', 'plyo', '', 'glutes quads hamstrings', 'Swing your arms and jump forward as far as you can, landing softly on both feet. Walk back, repeat.'),
  x('tuck-jump', 'Tuck jump', 'plyo', '', 'quads calves core', 'Jump straight up and pull your knees towards your chest, land softly.'),
  x('single-leg-hops', 'Single-leg hops', 'plyo', '', 'calves hips', 'Small, quick hops on one foot, staying on the ball of your foot. Builds springy ankles for running.', { time: [15, 25], side: true }),
  x('burpee', 'Burpee', 'plyo', '', 'quads chest shoulders core', 'Squat down, jump your feet back to a push-up position, jump them back in and jump up with your arms overhead.'),
  x('jumping-jacks', 'Jumping jacks', 'plyo', '', 'calves shoulders', 'Jump your feet out wide while your arms go overhead, and back. A good warm-up.', { time: [30, 60] }),
  x('jump-rope', 'Skipping rope', 'plyo', 'rope', 'calves shoulders', 'Small, quick jumps on the balls of your feet while your wrists turn the rope. Great for a runner’s feet and calves.', { time: [30, 90] }),

  // ---------- Running drills ----------
  x('a-skip', 'A-skip', 'drills', '', 'hips calves', 'Skip forward, driving one knee up to hip height while the other foot pushes off. Land under your hips, arms like running.', { time: [15, 20] }),
  x('b-skip', 'B-skip', 'drills', '', 'hamstrings hips calves', 'Like the A-skip, but kick the raised leg out and paw it back down under you, as if pulling the ground back.', { time: [15, 20] }),
  x('high-knees', 'High knees', 'drills', '', 'hips calves core', 'Run on the spot (or slowly forward) with fast, short steps and your knees up to hip height.', { time: [15, 20] }),
  x('butt-kicks', 'Butt kicks', 'drills', '', 'hamstrings calves', 'Run slowly forward while your heels flick up towards your bum. Quick feet.', { time: [15, 20] }),
  x('carioca', 'Carioca', 'drills', '', 'hips calves core', 'Move sideways, the back foot crossing alternately in front of and behind the other, hips turning. Then the other way.', { time: [15, 20], side: true }),
  x('straight-leg-bounds', 'Straight-leg bounds', 'drills', '', 'hamstrings glutes calves', 'Move forward with nearly straight legs, pulling each foot down under your hip. Quick and springy.', { time: [15, 20] }),

  // ---------- Mobility ----------
  x('leg-swings', 'Leg swings', 'mobility', '', 'hips hamstrings', 'Hold a wall and swing one leg forward and back, then side to side. Relaxed, a bit bigger every time.', { side: true }),
  x('hip-flexor-stretch', 'Kneeling hip flexor stretch', 'mobility', '', 'hips quads', 'Kneel on one knee, the other foot in front. Squeeze the glute of your back leg and shift forward gently.', { time: [30, 45], side: true }),
  x('calf-stretch', 'Calf stretch', 'mobility', '', 'calves', 'Hands on a wall, one leg back with the heel down and the knee straight. Lean in. Then bend that knee a little.', { time: [30, 45], side: true }),
  x('hamstring-stretch', 'Hamstring stretch', 'mobility', '', 'hamstrings', 'On your back, pull one straight leg towards you with a towel around your foot.', { time: [30, 45], side: true }),
  x('pigeon', 'Pigeon stretch', 'mobility', '', 'glutes hips', 'From hands and knees, bring one shin forward across your body and slide the other leg back. Sink your hips down.', { time: [30, 60], side: true }),
  x('worlds-greatest-stretch', 'World’s greatest stretch', 'mobility', '', 'hips hamstrings back', 'Lunge forward, put the hand on the side of your back leg on the floor, then turn the other arm up to the ceiling.', { side: true }),
  x('childs-pose', 'Child’s pose', 'mobility', '', 'back hips', 'Kneel, sit back on your heels and reach your arms forward on the floor. Breathe slowly.', { time: [30, 60] }),
  x('figure-four', 'Figure-four stretch', 'mobility', '', 'glutes hips', 'On your back, one ankle over the other knee. Pull that leg towards you.', { time: [30, 45], side: true }),
  x('cat-cow', 'Cat-cow', 'mobility', '', 'back core', 'On hands and knees, round your back up, then let it sink and look up. Slowly.'),
  x('open-book', 'Open book', 'mobility', '', 'back shoulders', 'Lie on your side, knees bent, arms together in front. Open the top arm to the other side, following it with your eyes.', { side: true }),
  x('couch-stretch', 'Couch stretch', 'mobility', '', 'quads hips', 'Knee on the floor against a wall or sofa, shin up against it, the other foot in front. Sit up tall.', { time: [30, 60], side: true }),
  x('ankle-rocks', 'Knee-to-wall ankle rocks', 'mobility', '', 'calves', 'Foot a hand’s width from a wall. Push your knee towards the wall, heel down.', { side: true }),
  x('butterfly', 'Butterfly stretch', 'mobility', '', 'hips', 'Sit with the soles of your feet together, knees out. Let your knees sink and lean forward a little.', { time: [30, 45] }),
  x('downward-dog', 'Downward dog', 'mobility', '', 'calves hamstrings shoulders', 'Hands and feet on the floor, hips high. Pedal your heels down one after the other.', { time: [30, 45] }),
  x('inchworm', 'Inchworm', 'mobility', '', 'hamstrings shoulders core', 'From standing, bend down, walk your hands out to a push-up position, then walk your feet up to your hands. Repeat.'),
  x('hip-circles', 'Hip circles', 'mobility', '', 'hips', 'On hands and knees (or standing, holding a wall), draw big slow circles with one knee.', { side: true }),
  x('90-90-switch', '90/90 hip switches', 'mobility', '', 'hips glutes', 'Sit with both knees bent at 90°, one in front and one to the side. Rotate both knees over to the other side and back, back tall.'),
  x('thread-the-needle', 'Thread the needle', 'mobility', '', 'back shoulders', 'On hands and knees, slide one arm under your body along the floor so your upper back turns, then open it up towards the ceiling.', { side: true }),
  x('frog-stretch', 'Frog stretch', 'mobility', '', 'hips', 'On your knees and forearms with your knees wide and feet out. Rock your hips back gently.', { time: [30, 60] }),
  x('cobra', 'Cobra', 'mobility', '', 'core back', 'Lie face down, hands under your shoulders. Push your chest up while your hips stay on the floor.', { time: [20, 40] }),
  x('doorway-chest-stretch', 'Doorway chest stretch', 'mobility', '', 'chest shoulders', 'Forearm against a door frame at shoulder height. Step forward until you feel a stretch across your chest.', { time: [30, 45], side: true }),
  x('lat-stretch', 'Lat stretch', 'mobility', '', 'back', 'Hold a door frame or a table with both hands, step back and push your hips back so your arms and sides stretch.', { time: [30, 45] }),
  x('quad-stretch', 'Standing quad stretch', 'mobility', '', 'quads hips', 'Stand on one leg and pull the other heel to your bum, knees together, hips forward.', { time: [30, 45], side: true }),
  x('forward-fold', 'Seated forward fold', 'mobility', '', 'hamstrings back', 'Sit with your legs straight and reach for your toes with a long back. Breathe and relax.', { time: [30, 60] }),
];
