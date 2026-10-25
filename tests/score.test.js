import assert from "node:assert/strict";
import test from "node:test";
import { arsenalView, recordOf } from "../src/score.js";

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
