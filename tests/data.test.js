import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
    if (match.highlights != null) {
      assert.match(match.highlights, /^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?v=[\w-]{11}$|^https:\/\/youtu\.be\/[\w-]{11}$/);
    }
    if (match.report != null) {
      assert.match(match.report, /^\d{4}-\d{2}-\d{2}_[a-z0-9-]+\.md$/);
      const reportPath = path.join(process.cwd(), "data", "reports", match.report);
      const report = fs.readFileSync(reportPath, "utf8");
      assert.match(report, /^\*\*Arsenal /);
      for (const heading of ["How it unfolded", "Arteta's comments", "Arsenal lineup", "Subs", "Sources"]) {
        assert.match(report, new RegExp(`\\*\\*${heading}\\*\\*`));
      }
      assert.match(report, /https:\/\/arseblog\.news\//);
      const reportBlob = report.toLowerCase();
      assert.equal(reportBlob.includes("women"), false);
      assert.equal(reportBlob.includes("wsl"), false);
    }
  }
});
