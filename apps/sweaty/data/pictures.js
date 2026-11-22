// Drawings of the classic exercises: line drawings by Everkinetic, under the Creative Commons
// licence CC BY-SA 3.0, shown from wger.de (an open-source fitness project). Each list is the
// start and end position. Exercises without a drawing show the muscle diagram, and you can add
// your own picture or video to any exercise in the app (Exercises → an exercise → Edit).

export const DRAWINGS_CREDIT = {
  author: 'Everkinetic', authorUrl: 'https://everkinetic.com',
  license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  source: 'wger.de', sourceUrl: 'https://wger.de',
};

const w = (path) => `https://wger.de/media/exercise-images/${path}`;

export const drawings = {
  'barbell-front-squat': [w('191/Front-squat-1-857x1024.png.400x400_q85.png'), w('191/Front-squat-2-857x1024.png.400x400_q85.png')],
  'walking-lunge': [w('113/Walking-lunges-1.png.400x400_q85.jpg'), w('113/Walking-lunges-2.png.400x400_q85.jpg')],
  'good-morning': [w('1392/a02c9c7d-f42d-43e0-9946-1b99b014daee.png.400x400_q85.png'), w('1392/af848376-3db3-4b16-a056-4aa936d49da4.png.400x400_q85.png')],
  'barbell-row': [w('109/Barbell-rear-delt-row-1.png.400x400_q85.jpg'), w('109/Barbell-rear-delt-row-2.png.400x400_q85.jpg')],
  'barbell-wide-row': [w('109/Barbell-rear-delt-row-1.png.400x400_q85.jpg'), w('109/Barbell-rear-delt-row-2.png.400x400_q85.jpg')],
  'underhand-row': [w('110/Reverse-grip-bent-over-rows-1.png.400x400_q85.jpg'), w('110/Reverse-grip-bent-over-rows-2.png.400x400_q85.jpg')],
  'chin-up': [w('152/6c1a7459-266d-491a-bd50-7cbaea2bc771.png.400x400_q85.png'), w('152/b2c5a9f9-8beb-41f7-841c-9664d22a427e.png.400x400_q85.png')],
  'barbell-overhead-press': [w('119/seated-barbell-shoulder-press-large-1.png.400x400_q85.jpg'), w('119/seated-barbell-shoulder-press-large-2.png.400x400_q85.jpg')],
  'db-shoulder-press': [w('123/dumbbell-shoulder-press-large-1.png.400x400_q85.jpg'), w('123/dumbbell-shoulder-press-large-2.png.400x400_q85.jpg')],
  'db-shrug': [w('151/Dumbbell-shrugs-1.png.400x400_q85.jpg'), w('151/Dumbbell-shrugs-2.png.400x400_q85.jpg')],
  'barbell-shrug': [w('150/Barbell-shrugs-1.png.400x400_q85.png'), w('150/Barbell-shrugs-2.png.400x400_q85.png')],
  'lateral-raise': [w('148/lateral-dumbbell-raises-large-1.png.400x400_q85.jpg'), w('148/lateral-dumbbell-raises-large-2.png.400x400_q85.jpg')],
  'db-curl': [w('81/Biceps-curl-1.png.400x400_q85.png'), w('81/Biceps-curl-2.png.400x400_q85.png')],
  'hammer-curl': [w('86/Bicep-hammer-curl-1.png.400x400_q85.png'), w('86/Bicep-hammer-curl-2.png.400x400_q85.png')],
  'barbell-curl': [w('74/Bicep-curls-1.png.400x400_q85.png'), w('74/Bicep-curls-2.png.400x400_q85.png')],
  'chair-dip': [w('83/Bench-dips-1.png.400x400_q85.png'), w('83/Bench-dips-2.png.400x400_q85.png')],
  'barbell-skull-crusher': [w('84/Lying-close-grip-triceps-press-to-chin-1.png.400x400_q85.png'), w('84/Lying-close-grip-triceps-press-to-chin-2.png.400x400_q85.png')],
  'crunch': [w('91/Crunches-1.png.400x400_q85.png'), w('91/Crunches-2.png.400x400_q85.png')],
  'leg-raise': [w('125/Leg-raises-1.png.400x400_q85.png'), w('125/Leg-raises-2.png.400x400_q85.png')],
};
