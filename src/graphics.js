/** Section name taken from a post title, or null when the title does not identify one. */

export function graphicSection(title) {
  const text = String(title || "");
  if (/full time/i.test(text)) return "Full Time";
  if (/passing networks/i.test(text)) return "Passing Networks";
  if (/attacking contribution/i.test(text)) return "Attacking Contribution";
  if (/shot maps/i.test(text)) return "Shot Maps";
  if (/deserve to win/i.test(text)) return "Deserve to Win";
  if (/duels/i.test(text)) return "Duels";
  if (/performance/i.test(text)) return "Performance";
  if (/\(\d/.test(text)) return "Score & xG";
  return null;
}

function sectionOrdinal(images, index) {
  const current = images[index];
  const section = graphicSection(current?.post?.title);
  if (!current || !section) return { section: null, ordinal: index };
  const ordinal = images
    .slice(0, index + 1)
    .filter((image) => graphicSection(image.post?.title) === section)
    .length - 1;
  return { section, ordinal };
}

/** Index of the same section and image within it, or the same index when the section is unknown. */
export function equivalentImageIndex(images, index, targetImages) {
  const count = targetImages.length;
  if (!count) return -1;
  const fallback = Math.min(Math.max(index, 0), count - 1);
  const { section, ordinal } = sectionOrdinal(images, index);
  if (!section) return fallback;
  const same = targetImages.filter((image) => graphicSection(image.post?.title) === section);
  if (!same.length) return fallback;
  const hit = same[Math.min(Math.max(ordinal, 0), same.length - 1)];
  const at = targetImages.indexOf(hit);
  return at === -1 ? fallback : at;
}
