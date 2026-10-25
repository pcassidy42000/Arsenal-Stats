import assert from "node:assert/strict";
import test from "node:test";
import matches from "../data/matches.json" with { type: "json" };

test("archive is men's matches only", () => {
  assert.ok(matches.matches.length >= 13);
  for (const match of matches.matches) {
    assert.equal(match.team, "Men");
    const blob = JSON.stringify(match).toLowerCase();
    assert.equal(blob.includes("women"), false);
    assert.equal(blob.includes("wsl"), false);
    const images = match.posts.reduce((sum, post) => sum + post.images.length, 0);
    assert.equal(images, match.image_count);
    for (const post of match.posts) {
      for (const image of post.images) {
        assert.match(image.url, /name=orig/);
        assert.match(image.file, /\.jpg$/);
      }
    }
  }
});
