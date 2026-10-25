import matchesFile from "../data/matches.json";
import imageMeta from "../data/image-meta.json";
import { arsenalView, formatPair, recordOf, resultWord } from "./score.js";
import "./style.css";

const COMP_ORDER = [
  "Community Shield",
  "Premier League",
  "Champions League",
  "League Cup",
];

const matches = [...matchesFile.matches]
  .filter((match) => match.team === "Men")
  .sort((a, b) => a.date.localeCompare(b.date));

const state = {
  view: "fixtures",
  competition: "All",
  matchDate: matches[0]?.date ?? null,
  lightbox: null,
};

const app = document.querySelector("#app");

function competitions() {
  const present = new Set(matches.map((match) => match.competition));
  return COMP_ORDER.filter((name) => present.has(name));
}

function visibleMatches() {
  if (state.competition === "All") return matches;
  return matches.filter((match) => match.competition === state.competition);
}

function flatImages(match) {
  const images = [];
  match.posts.forEach((post, postIndex) => {
    post.images.forEach((image, imageIndex) => {
      images.push({
        ...image,
        post,
        postIndex,
        imageIndex,
        globalIndex: images.length,
      });
    });
  });
  return images;
}

function formatDate(iso) {
  const date = new Date(`${iso}T12:00:00Z`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatStamp(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hourCycle: "h23",
  }) + " UTC";
}

function asset(path) {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${String(path).replace(/^\/+/, "")}`;
}

function thumbSrc(file) {
  return asset(`thumbs/${file.replace(/\.[^.]+$/, "")}.webp`);
}

function fullSrc(file) {
  return asset(`images/${file}`);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "ariaPressed") node.setAttribute("aria-pressed", String(value));
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

function thumbButton(image, match) {
  const meta = imageMeta[image.file] || {};
  const height = meta.w ? Math.round(400 * (meta.h / meta.w)) : 300;
  const img = el("img", {
    src: thumbSrc(image.file),
    alt: image.post.title || `${match.opponent} graphic`,
    width: "400",
    height: String(height),
    decoding: "async",
    // Eager on purpose. Native lazy-loading does not reliably fetch images
    // inside a horizontal overflow strip, so those frames stay blank until
    // the lightbox opens the JPEG. Thumbs are small enough to load up front.
    loading: "eager",
  });
  img.addEventListener("error", () => {
    const fallback = fullSrc(image.file);
    if (img.dataset.fallback === "1" || img.src.endsWith(fallback)) return;
    img.dataset.fallback = "1";
    img.src = fallback;
  });
  return el(
    "button",
    {
      type: "button",
      class: "thumb",
      "aria-label": `${image.post.title || "Graphic"}, image ${image.imageIndex + 1}. Open full size.`,
      onClick: () => openLightbox(match, image.globalIndex),
    },
    [img],
  );
}

function renderRecord(list) {
  const record = recordOf(list);
  const box = el("div", { class: "record", "aria-label": "Record in this filter" });
  for (const key of ["P", "W", "D", "L"]) {
    const cell = el("div", { class: key.toLowerCase() }, [
      el("b", { text: String(record[key]) }),
      el("span", { text: key === "P" ? "Pld" : key }),
    ]);
    box.append(cell);
  }
  return box;
}

function renderHeader(list) {
  const header = el("header", { class: "topbar wrap" }, [
    el("div", { class: "brand" }, [
      el("div", { class: "mark", "aria-hidden": "true", text: "A" }),
      el("div", {}, [
        el("h1", { text: "ARSENAL" }),
        el("p", {}, [
          document.createTextNode("Men's 2026–27 · graphics by "),
          el("a", {
            href: "https://x.com/scottjwillis",
            target: "_blank",
            rel: "noreferrer",
            text: "@scottjwillis",
          }),
        ]),
      ]),
    ]),
    renderRecord(list),
  ]);
  return header;
}

function renderToolbar() {
  const views = el("div", { class: "views", role: "group", "aria-label": "View" });
  for (const [id, label] of [
    ["fixtures", "Fixtures"],
    ["gallery", "Match gallery"],
  ]) {
    views.append(
      el("button", {
        type: "button",
        ariaPressed: state.view === id,
        text: label,
        onClick: () => {
          state.view = id;
          syncHash();
          render();
        },
      }),
    );
  }
  const filters = el("div", { class: "filters", role: "group", "aria-label": "Competition" });
  for (const name of ["All", ...competitions()]) {
    filters.append(
      el("button", {
        type: "button",
        ariaPressed: state.competition === name,
        text: name,
        onClick: () => {
          state.competition = name;
          const stillVisible = visibleMatches().some((match) => match.date === state.matchDate);
          if (!stillVisible) state.matchDate = visibleMatches()[0]?.date ?? null;
          syncHash();
          render();
        },
      }),
    );
  }
  return el("div", { class: "toolbar wrap" }, [views, filters]);
}

function renderFixture(match) {
  const view = arsenalView(match);
  const score = formatPair(view.goalsFor, view.goalsAgainst);
  const xg = formatPair(view.xgFor, view.xgAgainst);
  const images = flatImages(match);
  const meta = el("div", { class: "fixture-meta" }, [
    el("div", { class: "when", text: formatDate(match.date) }),
    el("div", { class: "comp", "data-comp": match.competition, text: match.competition }),
    el("h2", { class: "opponent" }, [
      document.createTextNode(match.opponent),
      el("span", { class: "venue", title: match.venue === "H" ? "Home" : "Away", text: match.venue }),
    ]),
    el("div", { class: "scoreline" }, [
      el("div", { class: "score", text: score }),
      el("div", {
        class: `result result-${view.result}`,
        title: resultWord(view.result),
        text: view.result,
      }),
    ]),
    el("div", { class: "xg" }, [
      document.createTextNode("xG "),
      el("b", { text: xg || "—" }),
    ]),
    el("div", { class: "count", text: `${images.length} graphics` }),
  ]);

  const strip = el("div", { class: "strip", tabindex: "0", "aria-label": `${match.opponent} graphics` });
  for (const post of match.posts) {
    const group = el("div", { class: "post-group" });
    for (const image of post.images) {
      const flat = images.find((item) => item.file === image.file);
      group.append(thumbButton(flat, match));
    }
    strip.append(group);
  }
  const nudge = el("button", {
    type: "button",
    class: "nudge",
    "aria-label": `Scroll ${match.opponent} graphics`,
    text: "›",
    onClick: () => {
      strip.scrollBy({ left: Math.max(240, strip.clientWidth * 0.8), behavior: "smooth" });
    },
  });
  return el("article", { class: "fixture" }, [
    meta,
    el("div", { class: "strip-wrap" }, [strip, nudge]),
  ]);
}

function renderFixtures(list) {
  const root = el("section", { class: "fixtures wrap", "aria-label": "Fixtures" });
  if (!list.length) {
    root.append(el("p", { class: "empty", text: "No matches in this competition yet." }));
    return root;
  }
  for (const match of list) root.append(renderFixture(match));
  return root;
}

function renderGallery(list) {
  const root = el("section", { class: "gallery wrap", "aria-label": "Match gallery" });
  if (!list.length) {
    root.append(el("p", { class: "empty", text: "No matches in this competition yet." }));
    return root;
  }
  const picker = el("div", { class: "picker", role: "listbox", "aria-label": "Choose a match" });
  for (const match of list) {
    const view = arsenalView(match);
    picker.append(
      el("button", {
        type: "button",
        class: "match-chip",
        role: "option",
        ariaPressed: match.date === state.matchDate,
        onClick: () => {
          state.matchDate = match.date;
          syncHash();
          render();
        },
      }, [
        el("strong", { text: match.opponent }),
        el("small", {
          text: `${formatDate(match.date)} · ${match.venue} · ${formatPair(view.goalsFor, view.goalsAgainst)} ${view.result}`,
        }),
      ]),
    );
  }
  root.append(picker);
  const match = list.find((item) => item.date === state.matchDate) || list[0];
  state.matchDate = match.date;
  const images = flatImages(match);
  for (const post of match.posts) {
    const grid = el("div", { class: "grid" });
    for (const image of post.images) {
      const flat = images.find((item) => item.file === image.file);
      grid.append(thumbButton(flat, match));
    }
    const header = el("header", {}, [
      el("div", {}, [
        el("h3", { text: post.title || "Post" }),
        post.posted_utc ? el("time", { datetime: post.posted_utc, text: formatStamp(post.posted_utc) }) : null,
      ]),
      el("a", {
        href: post.url,
        target: "_blank",
        rel: "noreferrer",
        text: "Source post",
      }),
    ]);
    root.append(el("article", { class: "post" }, [header, grid]));
  }
  return root;
}

function ensureLightbox() {
  let dialog = document.querySelector("dialog.lb");
  if (dialog) return dialog;
  dialog = el("dialog", { class: "lb", "aria-label": "Graphic" });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeLightbox();
  });
  dialog.addEventListener("close", () => {
    state.lightbox = null;
  });
  document.body.append(dialog);
  return dialog;
}

function openLightbox(match, index) {
  const images = flatImages(match);
  state.lightbox = { match, images, index };
  const dialog = ensureLightbox();
  paintLightbox();
  if (!dialog.open) dialog.showModal();
}

function closeLightbox() {
  const dialog = document.querySelector("dialog.lb");
  state.lightbox = null;
  if (dialog?.open) dialog.close();
}

function stepLightbox(delta) {
  if (!state.lightbox) return;
  const next = state.lightbox.index + delta;
  if (next < 0 || next >= state.lightbox.images.length) return;
  state.lightbox.index = next;
  paintLightbox();
}

function paintLightbox() {
  const dialog = ensureLightbox();
  const { images, index } = state.lightbox;
  const image = images[index];
  dialog.replaceChildren(
    el("div", { class: "lb-frame" }, [
      el("div", { class: "lb-top" }, [
        el("div", { class: "lb-count", text: `${index + 1} / ${images.length}` }),
        el("button", {
          type: "button",
          class: "lb-close",
          text: "Close",
          onClick: closeLightbox,
        }),
      ]),
      el("div", { class: "lb-stage" }, [
        el("button", {
          type: "button",
          class: "lb-nav prev",
          "aria-label": "Previous graphic",
          text: "‹",
          disabled: index === 0 ? "" : null,
          onClick: () => stepLightbox(-1),
        }),
        el("img", {
          src: fullSrc(image.file),
          alt: image.post.title || "Match graphic",
        }),
        el("button", {
          type: "button",
          class: "lb-nav next",
          "aria-label": "Next graphic",
          text: "›",
          disabled: index === images.length - 1 ? "" : null,
          onClick: () => stepLightbox(1),
        }),
      ]),
      el("div", { class: "lb-bottom" }, [
        el("div", { class: "lb-links" }, [
          el("a", {
            href: image.url,
            target: "_blank",
            rel: "noreferrer",
            text: "Original image",
          }),
          el("a", {
            href: image.post.url,
            target: "_blank",
            rel: "noreferrer",
            text: "Source post",
          }),
        ]),
        el("p", { class: "lb-title", text: image.post.title || "" }),
      ]),
    ]),
  );
  const next = images[index + 1];
  if (next) {
    const preload = new Image();
    preload.src = fullSrc(next.file);
  }
}

function render() {
  const list = visibleMatches();
  app.replaceChildren(
    renderHeader(list),
    renderToolbar(),
    state.view === "gallery" ? renderGallery(list) : renderFixtures(list),
    el("footer", { class: "site-footer wrap" }, [
      document.createTextNode("Images are served from this site. Source posts stay on X. "),
      document.createTextNode("Women's matches are not included."),
    ]),
  );
  requestAnimationFrame(() => {
    for (const wrap of document.querySelectorAll(".strip-wrap")) {
      const strip = wrap.querySelector(".strip");
      const nudge = wrap.querySelector(".nudge");
      if (strip && nudge && strip.scrollWidth <= strip.clientWidth + 8) nudge.hidden = true;
    }
  });
}

function syncHash() {
  const params = new URLSearchParams();
  params.set("view", state.view);
  if (state.competition !== "All") params.set("comp", state.competition);
  if (state.view === "gallery" && state.matchDate) params.set("match", state.matchDate);
  const next = `#${params.toString()}`;
  if (location.hash !== next) history.replaceState(null, "", next);
}

function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const view = params.get("view");
  if (view === "gallery" || view === "fixtures") state.view = view;
  const comp = params.get("comp");
  if (comp && (comp === "All" || competitions().includes(comp))) state.competition = comp;
  const match = params.get("match");
  if (match && matches.some((item) => item.date === match)) state.matchDate = match;
}

document.addEventListener("keydown", (event) => {
  if (!state.lightbox) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeLightbox();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    stepLightbox(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepLightbox(-1);
  }
});

let touchX = null;
document.addEventListener("touchstart", (event) => {
  if (!state.lightbox) return;
  touchX = event.changedTouches[0].clientX;
}, { passive: true });
document.addEventListener("touchend", (event) => {
  if (!state.lightbox || touchX == null) return;
  const delta = event.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(delta) < 40) return;
  stepLightbox(delta < 0 ? 1 : -1);
}, { passive: true });

readHash();
render();
window.addEventListener("hashchange", () => {
  readHash();
  render();
});
