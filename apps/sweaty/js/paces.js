// Training paces from a recent race, with Jack Daniels' running formula ("VDOT").
//
// Your race time says how fit you are (your VDOT). Each kind of run is a share of that:
// easy runs ~62–70%, tempo ~87%, intervals ~97.5%. The same formula predicts your time
// over another distance (e.g. a marathon from your half marathon).

const cost = (v) => -4.6 + 0.182258 * v + 0.000104 * v * v; // oxygen needed at v metres per minute
const share = (min) => 0.8 + 0.1894393 * Math.exp(-0.012778 * min) + 0.2989558 * Math.exp(-0.1932605 * min); // part you can hold that long

export const vdot = (metres, sec) => cost(metres / (sec / 60)) / share(sec / 60);

const speedAt = (oxygen) => (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (oxygen + 4.6))) / (2 * 0.000104);
const paceAt = (v, part) => 60000 / speedAt(v * part); // seconds per km

// Predicted time (seconds) over a distance for a VDOT.
export function predict(v, metres) {
  let fast = (metres / 600) * 60;
  let slow = (metres / 40) * 60;
  for (let i = 0; i < 60; i++) {
    const mid = (fast + slow) / 2;
    if (vdot(metres, mid) > v) fast = mid;
    else slow = mid;
  }
  return (fast + slow) / 2;
}

// km + seconds of a recent race, the distance of your goal race, and an optional goal time.
// → paces in seconds per km.
export function paces(recentKm, recentSec, raceKm, goalSec = null) {
  const v = vdot(recentKm * 1000, recentSec);
  const predicted = predict(v, raceKm * 1000);
  const raceSec = goalSec || predicted;
  return {
    vdot: v,
    easy: [paceAt(v, 0.7), paceAt(v, 0.62)],
    tempo: paceAt(v, 0.87),
    interval: paceAt(v, 0.975),
    race: raceSec / raceKm,
    raceSec,
    predicted,
  };
}
