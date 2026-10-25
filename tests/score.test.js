import assert from "node:assert/strict";
import test from "node:test";
import { arsenalView, compareMatches, ratesOf, recordOf } from "../src/score.js";

test("home win stays in Arsenal-first order", () => {
  const view = arsenalView({
    venue: "H",
    score: "3-0",
    xg: "2.1-0.8",
  });
  assert.deepEqual(view, {
    goalsFor: 3,
    goalsAgainst: 0,
    xgFor: "2.1",
    xgAgainst: "0.8",
    result: "W",
    shootout: false,
  });
});

test("away score is flipped so Arsenal is first", () => {
  const view = arsenalView({
    venue: "A",
    score: "2-4",
    xg: "0.9-1.3",
  });
  assert.equal(view.goalsFor, 4);
  assert.equal(view.goalsAgainst, 2);
  assert.equal(view.xgFor, "1.3");
  assert.equal(view.xgAgainst, "0.9");
  assert.equal(view.result, "W");
});

test("away defeat and a draw", () => {
  assert.equal(arsenalView({ venue: "A", score: "3-0", xg: "1.6-1.3" }).result, "L");
  assert.equal(arsenalView({ venue: "A", score: "2-2", xg: "2.2-1.1" }).result, "D");
});

test("record counts results", () => {
  const record = recordOf([
    { venue: "H", score: "1-0", xg: "1-0" },
    { venue: "A", score: "1-1", xg: "1-1" },
    { venue: "A", score: "2-0", xg: "1-0" },
  ]);
  assert.deepEqual(record, { P: 3, W: 1, D: 1, L: 1 });
});

test("rates use win 3, draw 1, loss 0, to two decimals", () => {
  const rates = ratesOf([
    { venue: "H", score: "1-0", xg: "1-0" },
    { venue: "A", score: "1-1", xg: "1-1" },
    { venue: "A", score: "2-0", xg: "1-0" },
  ]);
  assert.deepEqual(rates, { ppg: "1.33", gfg: "0.67", gag: "1.00" });
});

test("a penalty shootout uses the regulation score and counts as a draw", () => {
  const view = arsenalView({ venue: "A", score: "1-1 (4-3 pens)", xg: "0.8-1.2" });
  assert.equal(view.goalsFor, 1);
  assert.equal(view.goalsAgainst, 1);
  assert.equal(view.result, "D");
  assert.equal(view.shootout, true);
  const rates = ratesOf([
    { venue: "H", score: "2-1", xg: "1-0" },
    { venue: "A", score: "1-1 (4-3 pens)", xg: "1-1" },
  ]);
  assert.deepEqual(rates, { ppg: "2.00", gfg: "1.50", gag: "1.00" });
  assert.deepEqual(recordOf([{ venue: "H", score: "0-0 (5-4 p)" }]), { P: 1, W: 0, D: 1, L: 0 });
});

test("no matches yields zeroes", () => {
  assert.deepEqual(ratesOf([]), { ppg: "0.00", gfg: "0.00", gag: "0.00" });
});

test("newer dates sort first", () => {
  const ordered = [
    { date: "2026-10-24" },
    { date: "2026-08-16" },
    { date: "2026-09-12" },
  ].sort(compareMatches);
  assert.deepEqual(ordered.map((match) => match.date), ["2026-10-24", "2026-09-12", "2026-08-16"]);
});
