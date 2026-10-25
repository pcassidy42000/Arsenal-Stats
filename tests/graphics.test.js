import assert from "node:assert/strict";
import test from "node:test";
import { equivalentImageIndex, graphicSection } from "../src/graphics.js";

function image(file, title, imageIndex = 0) {
  return { file, imageIndex, post: { title } };
}

const standard = [
  image("ft1", "Arsenal 2 - 0 Everton | Full Time | 1.8 - 0.4 xG", 0),
  image("ft2", "Arsenal 2 - 0 Everton | Full Time | 1.8 - 0.4 xG", 1),
  image("xg", "Arsenal 2 (1.8)-(0.4) 0 Everton", 0),
  image("pass", "Arsenal 2 - 0 Everton - Passing Networks", 0),
  image("shot1", "Arsenal 2 - 0 Everton - Shot Maps", 0),
  image("shot2", "Arsenal 2 - 0 Everton - Shot Maps", 1),
  image("shot3", "Arsenal 2 - 0 Everton - Shot Maps", 2),
];

test("titles identify the shared graphic sections", () => {
  assert.equal(graphicSection("Arsenal 2 - 1 Leeds | Full Time | 2.1 - 0.5 xG"), "Full Time");
  assert.equal(graphicSection("Arsenal 2 (2.1)-(0.5) 1 Leeds"), "Score & xG");
  assert.equal(graphicSection("Arsenal 2 - 1 Leeds - Shot Maps"), "Shot Maps");
  assert.equal(graphicSection("Notes from the match"), null);
});

test("vertical move keeps Shot Maps image 2", () => {
  const other = [
    image("a-shot1", "Forest 0 - 1 Arsenal - Shot Maps", 0),
    image("a-shot2", "Forest 0 - 1 Arsenal - Shot Maps", 1),
    image("a-ft", "Forest 0 - 1 Arsenal | Full Time | 0.8 - 0.8 xG", 0),
  ];
  assert.equal(equivalentImageIndex(standard, 5, other), 1);
});

test("a shorter section clamps to its last image", () => {
  const other = [image("only", "Brighton 3 - 0 Arsenal - Shot Maps", 0)];
  assert.equal(equivalentImageIndex(standard, 6, other), 0);
});

test("a missing section falls back to the same index, clamped", () => {
  const short = [
    image("ft", "Sunderland 0 - 2 Arsenal | Full Time | 1.8 - 1.9 xG", 0),
    image("xg", "Sunderland 0 (1.8)-(1.9) 2 Arsenal", 0),
  ];
  const withExtra = [
    ...standard,
    image("perf", "Martin Odegaard, Performance - Arsenal vs Everton", 0),
  ];
  assert.equal(equivalentImageIndex(withExtra, withExtra.length - 1, short), 1);
  assert.equal(equivalentImageIndex(standard, 2, []), -1);
});

test("an unidentified graphic uses the same index", () => {
  const from = [image("a", "Warmup", 0), image("b", "Tunnel", 0)];
  const to = [image("c", "Warmup", 0), image("d", "Tunnel", 0), image("e", "Bench", 0)];
  assert.equal(equivalentImageIndex(from, 1, to), 1);
});
