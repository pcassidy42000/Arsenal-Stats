/** Arsenal-first scoreline. Stored scores and xG are home–away. */

const SHOOTOUT = /\b(?:pens?|penalties|pso)\b|\(\s*p\s*\)/i;

/** Regulation (90/120-minute) score. A penalty shootout is noted but not counted as goals. */
export function regulationScore(score) {
  const raw = String(score ?? "").trim();
  const head = raw.split("(")[0];
  const pair = head.match(/(\d+)\s*[-–]\s*(\d+)/);
  return {
    homeGoals: pair ? Number(pair[1]) : NaN,
    awayGoals: pair ? Number(pair[2]) : NaN,
    shootout: SHOOTOUT.test(raw),
  };
}

export function arsenalView(match) {
  const { homeGoals, awayGoals, shootout } = regulationScore(match.score);
  const xgParts = match.xg ? String(match.xg).split("-") : [null, null];
  const atHome = match.venue === "H";
  const goalsFor = atHome ? homeGoals : awayGoals;
  const goalsAgainst = atHome ? awayGoals : homeGoals;
  const xgFor = atHome ? xgParts[0] : xgParts[1];
  const xgAgainst = atHome ? xgParts[1] : xgParts[0];
  let result = "D";
  if (!shootout) {
    if (goalsFor > goalsAgainst) result = "W";
    else if (goalsFor < goalsAgainst) result = "L";
  }
  return { goalsFor, goalsAgainst, xgFor, xgAgainst, result, shootout };
}

export function resultWord(result) {
  if (result === "W") return "Win";
  if (result === "L") return "Loss";
  return "Draw";
}

export function recordOf(matches) {
  const record = { P: matches.length, W: 0, D: 0, L: 0 };
  for (const match of matches) record[arsenalView(match).result] += 1;
  return record;
}

function pointsFor(result) {
  if (result === "W") return 3;
  if (result === "D") return 1;
  return 0;
}

/** PPG, goals for per game, and goals against per game. A shootout is a draw. */
export function ratesOf(matches) {
  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const match of matches) {
    const view = arsenalView(match);
    points += pointsFor(view.result);
    goalsFor += view.goalsFor;
    goalsAgainst += view.goalsAgainst;
  }
  const games = matches.length;
  const rate = (total) => (games ? total / games : 0).toFixed(2);
  return { ppg: rate(points), gfg: rate(goalsFor), gag: rate(goalsAgainst) };
}

/** Newest match first. Later dates sort ahead of earlier ones. */
export function compareMatches(a, b) {
  return String(b.date).localeCompare(String(a.date));
}

export function formatPair(left, right) {
  if (left == null || right == null || left === "" || right === "") return null;
  return `${left}–${right}`;
}
