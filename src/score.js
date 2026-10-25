/** Arsenal-first scoreline. Stored scores and xG are home–away. */

export function arsenalView(match) {
  const [homeGoals, awayGoals] = String(match.score)
    .split("-")
    .map((part) => Number(part));
  const xgParts = match.xg ? String(match.xg).split("-") : [null, null];
  const atHome = match.venue === "H";
  const goalsFor = atHome ? homeGoals : awayGoals;
  const goalsAgainst = atHome ? awayGoals : homeGoals;
  const xgFor = atHome ? xgParts[0] : xgParts[1];
  const xgAgainst = atHome ? xgParts[1] : xgParts[0];
  let result = "D";
  if (goalsFor > goalsAgainst) result = "W";
  else if (goalsFor < goalsAgainst) result = "L";
  return { goalsFor, goalsAgainst, xgFor, xgAgainst, result };
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

export function formatPair(left, right) {
  if (left == null || right == null || left === "" || right === "") return null;
  return `${left}–${right}`;
}
