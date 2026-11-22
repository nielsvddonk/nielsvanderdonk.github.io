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
// You can also add your own exercises in the app (Me → Exercises), without touching this file.

export const GEAR = [
  ['dumbbell', 'Dumbbells'],
  ['barbell', 'Barbell'],
  ['chair', 'Sturdy chair'],
  ['bench', 'Bench or sofa'],
  ['table', 'Sturdy table'],
  ['pullupbar', 'Pull-up bar'],
  ['band', 'Resistance band'],
  ['kettlebell', 'Kettlebell'],
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
  side: 'Side core', hips: 'Hips', carry: 'Carry', mobility: 'Mobility',
};

// Rest between sets, in seconds.
export const REST = {
  squat: 120, hinge: 120, lunge: 90, bridge: 90, push: 90, press: 90, row: 90, lats: 90,
  legcurl: 75, fly: 60, raise: 60, rear: 60, curl: 60, triceps: 60, carry: 60,
  calves: 45, core: 45, side: 45, hips: 45, mobility: 10,
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
  x('jump-squat', 'Jump squat', 'squat', '', 'quads glutes calves', 'Squat halfway down, then jump up as high as you can. Land softly and go straight into the next one.'),
  x('wall-sit', 'Wall sit', 'squat', '', 'quads', 'Back against a wall, slide down until your thighs are about level with the floor, and hold.', { time: [30, 60] }),

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

  // ---------- Hip hinge ----------
  x('barbell-rdl', 'Romanian deadlift', 'hinge', 'barbell', 'hamstrings glutes lowerback', 'Stand tall, bar against your thighs. Push your hips back with soft knees until you feel your hamstrings, then stand up. Back flat.', { easier: 'db-rdl' }),
  x('single-leg-rdl', 'Single-leg Romanian deadlift', 'hinge', 'dumbbell', 'hamstrings glutes core', 'A dumbbell in the opposite hand. Stand on one leg, tip forward as the other leg goes back, hips level, then stand up.', { side: true, easier: 'single-leg-reach' }),
  x('deadlift', 'Deadlift', 'hinge', 'barbell', 'hamstrings glutes lowerback back quads', 'Bar over your mid-foot, hands just outside your legs, back flat. Push the floor away to stand up, lower it the same way.'),
  x('db-rdl', 'Romanian deadlift with dumbbells', 'hinge', 'dumbbell', 'hamstrings glutes lowerback', 'A dumbbell in each hand, sliding down the front of your legs. Hips back, back flat, then stand up.'),
  x('good-morning', 'Good morning', 'hinge', 'barbell', 'hamstrings lowerback glutes', 'Bar across your upper back, soft knees. Push your hips back and tip forward with a flat back, then stand up. Keep it light.'),
  x('db-swing', 'Dumbbell swing', 'hinge', 'dumbbell', 'glutes hamstrings core', 'Hold one dumbbell with both hands. Hinge and swing it back between your legs, then snap your hips forward to swing it to chest height.'),
  x('single-leg-reach', 'Single-leg reach', 'hinge', '', 'hamstrings glutes core', 'Stand on one leg and reach your hands towards the floor as the other leg goes back. Keep your hips level.', { side: true, harder: 'single-leg-rdl' }),

  // ---------- Glute bridge ----------
  x('barbell-hip-thrust', 'Hip thrust', 'bridge', 'barbell bench', 'glutes hamstrings', 'Upper back against a sofa or bench, bar across your hips on a towel. Drive your hips up until your body is flat, squeeze, lower.'),
  x('db-hip-thrust', 'Hip thrust with a dumbbell', 'bridge', 'dumbbell bench', 'glutes hamstrings', 'Upper back against a sofa or bench, a dumbbell on your hips. Drive your hips up, squeeze, lower.'),
  x('barbell-glute-bridge', 'Glute bridge with the barbell', 'bridge', 'barbell', 'glutes hamstrings', 'On your back, knees bent, the bar across your hips on a towel. Push your hips up, squeeze for a second, lower.'),
  x('db-glute-bridge', 'Glute bridge with a dumbbell', 'bridge', 'dumbbell', 'glutes hamstrings', 'On your back, knees bent, a dumbbell on your hips. Push your hips up, squeeze for a second, lower.'),
  x('glute-bridge', 'Glute bridge', 'bridge', '', 'glutes hamstrings', 'On your back, knees bent, feet flat. Push your hips up until you are straight from knees to shoulders, squeeze, lower.', { harder: 'single-leg-glute-bridge' }),
  x('single-leg-glute-bridge', 'Single-leg glute bridge', 'bridge', '', 'glutes hamstrings', 'A glute bridge on one leg, the other knee pulled in.', { side: true, easier: 'glute-bridge' }),
  x('hip-thrust', 'Hip thrust (bodyweight)', 'bridge', 'bench', 'glutes hamstrings', 'Upper back against a sofa or bench, feet flat. Drive your hips up, squeeze, lower.', { harder: 'db-hip-thrust' }),

  // ---------- Hamstring curl ----------
  x('towel-leg-curl', 'Towel leg curl', 'legcurl', '', 'hamstrings glutes', 'On your back on a smooth floor, heels on a towel. Lift your hips, pull your heels in, then slide them out slowly.', { harder: 'single-leg-towel-curl' }),
  x('chair-hamstring-bridge', 'Hamstring bridge on a chair', 'legcurl', 'chair', 'hamstrings glutes', 'On your back with your heels on a chair seat, legs almost straight. Push your hips up and lower slowly.'),
  x('nordic-curl', 'Nordic curl', 'legcurl', 'bench', 'hamstrings', 'Kneel with your ankles hooked under a heavy sofa. Lower your body forward as slowly as you can, catch yourself with your hands, push back up.'),
  x('single-leg-towel-curl', 'Single-leg towel leg curl', 'legcurl', '', 'hamstrings glutes', 'The towel leg curl on one leg.', { side: true, easier: 'towel-leg-curl' }),

  // ---------- Calves ----------
  x('single-leg-calf-raise', 'Single-leg calf raise', 'calves', '', 'calves', 'Stand on one foot on the edge of a step (or the floor), holding a wall. Rise as high as you can, then lower slowly for 3 seconds.', { side: true, easier: 'calf-raise' }),
  x('db-calf-raise', 'Calf raise with dumbbells', 'calves', 'dumbbell', 'calves', 'A dumbbell in each hand, on the edge of a step (or the floor). Rise as high as you can and lower slowly.'),
  x('seated-calf-raise', 'Seated calf raise', 'calves', 'chair dumbbell', 'calves', 'Sit on a chair with a dumbbell on each knee. Lift your heels as high as you can, lower slowly.'),
  x('calf-raise', 'Calf raise', 'calves', '', 'calves', 'Stand on both feet, holding a wall. Rise as high as you can, lower slowly.', { harder: 'single-leg-calf-raise' }),
  x('tibialis-raise', 'Tibialis raise', 'calves', '', 'calves', 'Lean your back against a wall, feet a step forward. Lift your toes as high as you can, lower slowly. Good for your shins.'),
  x('pogo-hops', 'Pogo hops', 'calves', '', 'calves', 'Small quick bounces on the balls of your feet, knees almost straight. Springy, like a ball.', { time: [20, 30] }),

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

  // ---------- Overhead press ----------
  x('db-shoulder-press', 'Shoulder press', 'press', 'dumbbell', 'shoulders triceps', 'Dumbbells at shoulder height, standing tall. Press them straight up without leaning back, lower slowly.'),
  x('barbell-overhead-press', 'Overhead press', 'press', 'barbell', 'shoulders triceps core', 'Lift the bar to your shoulders. Squeeze your glutes and press it overhead, head through at the top.'),
  x('arnold-press', 'Arnold press', 'press', 'dumbbell', 'shoulders triceps', 'Start with the dumbbells in front of your shoulders, palms facing you. Turn your palms out as you press up.'),
  x('pike-push-up', 'Pike push-up', 'press', '', 'shoulders triceps', 'Hips high in an upside-down V. Bend your elbows to lower your head towards the floor, push back up.', { harder: 'elevated-pike-push-up' }),
  x('elevated-pike-push-up', 'Pike push-up with feet on a chair', 'press', 'chair', 'shoulders triceps', 'The pike push-up with your feet on a chair.', { easier: 'pike-push-up' }),
  x('single-arm-press', 'Single-arm shoulder press', 'press', 'dumbbell', 'shoulders triceps core', 'Press one dumbbell at a time, the other hand on your belly to stay straight.', { side: true }),

  // ---------- Row ----------
  x('db-row', 'One-arm dumbbell row', 'row', 'dumbbell chair', 'back biceps', 'One hand and knee on a chair, back flat. Pull the dumbbell up to your hip, lower slowly.', { side: true }),
  x('barbell-row', 'Bent-over row', 'row', 'barbell', 'back biceps lowerback', 'Hinge forward to about 45°, back flat. Pull the bar to your lower ribs, lower slowly.'),
  x('db-bent-over-row', 'Bent-over row with dumbbells', 'row', 'dumbbell', 'back biceps', 'Hinge forward, back flat, a dumbbell in each hand. Pull both to your hips, lower slowly.'),
  x('renegade-row', 'Renegade row', 'row', 'dumbbell', 'back core biceps', 'Push-up position on two dumbbells. Row one to your hip without twisting, then the other.', { side: true }),
  x('table-row', 'Row under a table', 'row', 'table', 'back biceps', 'Lie under a sturdy table, hold the edge, body straight. Pull your chest up to the edge.'),
  x('door-frame-row', 'Door frame row', 'row', '', 'back biceps', 'Hold both sides of an open door frame at chest height, lean back with straight arms, pull yourself in.'),

  // ---------- Lats ----------
  x('pull-up', 'Pull-up', 'lats', 'pullupbar', 'back biceps', 'Hang from the bar, hands shoulder-width, palms away. Pull your chin over the bar, lower all the way.', { easier: 'negative-pull-up' }),
  x('chin-up', 'Chin-up', 'lats', 'pullupbar', 'back biceps', 'A pull-up with your palms facing you.'),
  x('band-pulldown', 'Band pulldown', 'lats', 'band', 'back biceps', 'Anchor a band high (over a door). Pull it down to your chest, elbows down and back.'),
  x('db-pullover', 'Dumbbell pullover', 'lats', 'dumbbell', 'back chest', 'Lie on the floor, one dumbbell held in both hands above your chest. Lower it behind your head with slightly bent arms, pull it back.'),
  x('barbell-wide-row', 'Wide-grip row', 'lats', 'barbell', 'back shoulders biceps', 'A bent-over row with a wide grip, pulling the bar to your chest.'),
  x('negative-pull-up', 'Slow pull-up lowering', 'lats', 'pullupbar', 'back biceps', 'Jump to the top of a pull-up and lower yourself as slowly as you can.', { harder: 'pull-up' }),
  x('lying-lat-pull', 'Lying lat pull', 'lats', '', 'back shoulders', 'Lie face down, arms overhead and off the floor. Pull your elbows down to your sides, squeeze your shoulder blades, reach back out.'),

  // ---------- Upper back ----------
  x('db-reverse-fly', 'Reverse fly', 'rear', 'dumbbell', 'shoulders back', 'Hinge forward, light dumbbells hanging. Raise your arms out to the sides, squeeze your shoulder blades.'),
  x('ytw-raise', 'Y-T-W raise', 'rear', '', 'shoulders back', 'Lie face down. Lift your arms in a Y, then a T, then a W, thumbs up. One Y-T-W is one rep.'),
  x('reverse-snow-angel', 'Reverse snow angel', 'rear', '', 'shoulders back', 'Lie face down, arms by your sides and off the floor. Sweep them overhead and back, like a snow angel.'),
  x('band-pull-apart', 'Band pull-apart', 'rear', 'band', 'shoulders back', 'Hold a band in front of you at shoulder height. Pull it apart until it touches your chest.'),
  x('face-pull', 'Band face pull', 'rear', 'band', 'shoulders back', 'A band anchored at face height. Pull it to your forehead, elbows high and wide.'),
  x('db-shrug', 'Shrug', 'rear', 'dumbbell', 'back forearms', 'Dumbbells by your sides. Lift your shoulders to your ears, hold a second, lower.'),

  // ---------- Side shoulders ----------
  x('lateral-raise', 'Lateral raise', 'raise', 'dumbbell', 'shoulders', 'Light dumbbells by your sides. Raise your arms out to shoulder height, lower slowly.'),
  x('lean-away-lateral-raise', 'Lean-away lateral raise', 'raise', 'dumbbell', 'shoulders', 'Hold a door frame with one hand and lean away. Raise one dumbbell out to the side.', { side: true }),
  x('front-raise', 'Front raise', 'raise', 'dumbbell', 'shoulders', 'Raise the dumbbells in front of you to shoulder height, lower slowly.'),
  x('band-lateral-raise', 'Band lateral raise', 'raise', 'band', 'shoulders', 'Stand on a band and raise your arms out to the sides.'),

  // ---------- Biceps ----------
  x('db-curl', 'Biceps curl', 'curl', 'dumbbell', 'biceps forearms', 'Dumbbells by your sides, palms forward. Curl them up without swinging, lower slowly.'),
  x('hammer-curl', 'Hammer curl', 'curl', 'dumbbell', 'biceps forearms', 'A curl with your palms facing each other.'),
  x('barbell-curl', 'Barbell curl', 'curl', 'barbell', 'biceps forearms', 'Hold the bar shoulder-width, palms forward. Curl it up without swinging, lower slowly.'),
  x('concentration-curl', 'Concentration curl', 'curl', 'dumbbell chair', 'biceps', 'Sit on a chair, elbow against the inside of your thigh. Curl one dumbbell up slowly.', { side: true }),
  x('door-frame-curl', 'Door frame curl', 'curl', '', 'biceps', 'Hold a door frame with one hand at chest height, lean back, and curl yourself in with your biceps.', { side: true }),

  // ---------- Triceps ----------
  x('overhead-extension', 'Overhead triceps extension', 'triceps', 'dumbbell', 'triceps', 'Hold one dumbbell overhead with both hands. Lower it behind your head, extend back up.'),
  x('chair-dip', 'Chair dip', 'triceps', 'chair', 'triceps chest shoulders', 'Hands on the edge of a chair behind you, legs out. Bend your elbows to 90°, push back up.'),
  x('db-skull-crusher', 'Lying triceps extension', 'triceps', 'dumbbell', 'triceps', 'Lie on the floor, dumbbells above you. Bend only your elbows to lower them next to your head, then extend.'),
  x('close-grip-push-up', 'Close-grip push-up', 'triceps', '', 'triceps chest', 'A push-up with your hands close together, elbows along your body.'),
  x('barbell-skull-crusher', 'Lying triceps extension with the barbell', 'triceps', 'barbell', 'triceps', 'Lie on the floor, bar above your chest. Bend only your elbows to lower it to your forehead, then extend.'),
  x('close-grip-floor-press', 'Close-grip floor press', 'triceps', 'barbell', 'triceps chest', 'A floor press with your hands shoulder-width apart, elbows close to your body.'),
  x('kickback', 'Triceps kickback', 'triceps', 'dumbbell', 'triceps', 'Hinge forward, elbow high by your side. Straighten your arm back, squeeze, lower.', { side: true }),

  // ---------- Chest fly ----------
  x('floor-fly', 'Floor fly', 'fly', 'dumbbell', 'chest shoulders', 'Lie on the floor, dumbbells above your chest, arms slightly bent. Open your arms until your elbows touch the floor, bring them back together.'),

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

  // ---------- Side core ----------
  x('side-plank', 'Side plank', 'side', '', 'core hips', 'On one forearm and the side of your feet, body straight. Hold your hips high.', { time: [20, 45], side: true, harder: 'copenhagen-plank' }),
  x('copenhagen-plank', 'Copenhagen plank', 'side', 'chair', 'hips core', 'A side plank with your top leg on a chair seat (knee on it is easier, ankle is harder). Lift your hips and hold.', { time: [15, 30], side: true, easier: 'side-plank' }),
  x('suitcase-carry', 'Suitcase carry', 'side', 'dumbbell', 'core forearms', 'Hold one heavy dumbbell at your side and walk tall without leaning. Switch hands.', { time: [30, 45], side: true }),
  x('side-plank-dip', 'Side plank hip dip', 'side', '', 'core hips', 'In a side plank, lower your hips to the floor and lift them back up.', { side: true }),
  x('side-bend', 'Side bend', 'side', 'dumbbell', 'core', 'A dumbbell in one hand. Lean to that side and come back up using your waist.', { side: true }),
  x('pallof-press', 'Pallof press', 'side', 'band', 'core', 'A band anchored at chest height to your side. Press it straight out and hold, without letting it turn you.', { side: true }),

  // ---------- Hips ----------
  x('side-lying-leg-raise', 'Side-lying leg raise', 'hips', '', 'hips glutes', 'Lie on your side, bottom knee bent. Lift your top leg, straight and slightly back, lower slowly.', { side: true }),
  x('clamshell', 'Clamshell', 'hips', '', 'glutes hips', 'Lie on your side, knees bent, feet together. Lift your top knee without rolling back.', { side: true }),
  x('fire-hydrant', 'Fire hydrant', 'hips', '', 'glutes hips', 'On hands and knees, lift one bent knee out to the side, lower slowly.', { side: true }),
  x('single-leg-balance', 'Single-leg balance reach', 'hips', '', 'hips calves core', 'Stand on one leg. Tap the other foot lightly forward, to the side and behind you, staying balanced.', { time: [30, 45], side: true }),
  x('band-walk', 'Band side walk', 'hips', 'band', 'glutes hips', 'Band around your knees, half squat. Walk sideways with small steps.'),
  x('standing-knee-drive', 'Standing knee drive', 'hips', '', 'hips core', 'Stand tall, drive one knee up to hip height, hold a second, lower slowly.', { side: true }),

  // ---------- Carry ----------
  x('farmer-carry', 'Farmer’s carry', 'carry', 'dumbbell', 'forearms core back', 'Hold a heavy dumbbell in each hand and walk tall with short steps.', { time: [30, 60] }),

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
];
