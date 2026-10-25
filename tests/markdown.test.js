import assert from "node:assert/strict";
import test from "node:test";
import { parseInlines, parseMarkdown } from "../src/markdown.js";

test("bold and https links parse, and markup stays text", () => {
  const inlines = parseInlines(
    'See **Arsenal** and [the report](https://arseblog.news/2026/08/report/) plus <script>alert(1)</script> and [nope](javascript:alert(1)).',
  );
  assert.deepEqual(
    inlines.map((node) => node.type),
    ["text", "strong", "text", "link", "text"],
  );
  assert.equal(inlines[1].text, "Arsenal");
  assert.equal(inlines[3].href, "https://arseblog.news/2026/08/report/");
  const tail = inlines.at(-1).text;
  assert.match(tail, /<script>alert\(1\)<\/script>/);
  assert.match(tail, /javascript:alert/);
});

test("sections are nested lists and the title is a paragraph", () => {
  const blocks = parseMarkdown(`**Arsenal 1-0 Villa, Premier League, Villa Park, 31 August 2026**

A short intro.

- **How it unfolded**
  - 60': Saka scored.
- **Sources**
  - [Arseblog match report](https://arseblog.news/example)
`);
  assert.equal(blocks[0].type, "p");
  assert.equal(blocks[0].inlines[0].type, "strong");
  assert.equal(blocks[1].type, "p");
  assert.equal(blocks[2].type, "ul");
  assert.equal(blocks[2].items.length, 2);
  assert.equal(blocks[2].items[0].children[0].type, "ul");
  assert.equal(blocks[2].items[0].children[0].items[0].inlines[0].text, "60': Saka scored.");
  assert.equal(blocks[2].items[1].children[0].items[0].inlines[0].href, "https://arseblog.news/example");
});
