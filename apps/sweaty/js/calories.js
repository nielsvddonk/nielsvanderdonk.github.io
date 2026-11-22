// Daily calories: what your body burns, plus your training, plus or minus your goal.
//
//   at rest   Mifflin-St Jeor: 10 × kg + 6.25 × cm − 5 × age, +5 for men, −161 for women
//   daily     at rest × how active your day is (without training)
//   running   about your body weight in kcal per km (90 kg → 90 kcal per km)
//   strength  about 3.5 × kg per hour on top of resting
//   goal      1 kg of body fat ≈ 7,700 kcal, so losing 0.5 kg a week ≈ 550 kcal a day less.
//             No deficit on long-run and race days: fuel those. Gaining is capped at 0.5 kg a week.

export const ACTIVITY = [
  [1.2, 'Mostly sitting'],
  [1.35, 'Some walking or cycling'],
  [1.5, 'On my feet a lot'],
];
export const RATES = [0.25, 0.5, 0.75];

export function bmr(body, kg) {
  const sex = body.sex === 'female' ? -161 : body.sex === 'male' ? 5 : -78;
  return 10 * kg + 6.25 * (Number(body.height) || 175) - 5 * (Number(body.age) || 35) + sex;
}

export function budget(s, kg, { runKm = 0, liftMin = 0, extraMin = 0, fuelDay = false } = {}) {
  const rest = bmr(s.body, kg);
  const daily = rest * (Number(s.body.activity) || 1.35);
  const run = runKm * kg;
  const lift = (liftMin * 3.5 * kg) / 60;
  const extra = (extraMin * 2 * kg) / 60;
  const goalKg = Number(s.goal?.weight);
  const rate = Number(s.goal?.rate) || 0.5;
  let goal = 0;
  if (goalKg && Math.abs(kg - goalKg) >= 0.3) {
    const perDay = (rate * 7700) / 7;
    goal = kg > goalKg ? (fuelDay ? 0 : -perDay) : Math.min(perDay, 550);
  }
  // Never less than 110% of what you burn at rest, whatever the goal.
  const raw = daily + run + lift + extra + goal;
  const minimum = Math.max(0, rest * 1.1 - raw);
  return {
    bmr: rest, daily, run, lift, extra, goal, fuelDay, minimum,
    total: Math.round((raw + minimum) / 10) * 10,
    protein: Math.round((kg * 1.8) / 5) * 5, // 1.8 g per kg helps you build muscle while you train
  };
}

// Weeks until the goal weight at your pace (null without a goal).
export function weeksToGoal(s, kg) {
  const goalKg = Number(s.goal?.weight);
  if (!goalKg || !kg) return null;
  const diff = Math.abs(kg - goalKg);
  if (diff < 0.3) return 0;
  const rate = Number(s.goal?.rate) || 0.5;
  return diff / (kg < goalKg ? Math.min(rate, 0.5) : rate);
}
