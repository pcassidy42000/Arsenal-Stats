# Arsenal 2026–27 · Cannon Stats

Static gallery of the post-match graphics [**@scottjwillis**](https://x.com/scottjwillis) publishes after every Arsenal **men's** match. Women's matches are not included.

The 2026–27 archive starts with 13 matches and 298 images. Originals live in `public/images/` and ~400px WebP thumbnails live in `public/thumbs/`. Pages load the thumbnails. The lightbox loads the local original. Nothing is hotlinked.

## Views

- **Fixtures** (default). One row per match, newest first. Each row shows the date, competition, opponent, home/away, Arsenal-first score with W/D/L, and xG, then that match's graphics in post order. The strips scroll sideways together, so one row's scroll moves the rest to the same offset.
- **Match gallery.** Pick a match. Graphics are grouped under the post they came from, with a link back to the source post.
- **Competition filter.** All, Community Shield, Premier League, Champions League, League Cup.

Click a thumbnail for the full-size image. Previous and next buttons, the left and right arrow keys, and a horizontal swipe move through that match. Up and down buttons, the up and down arrow keys, and a vertical swipe move to the newer or older match in the current filter, opening the same kind of graphic. The caption shows the opponent and date. Esc closes the lightbox. The footer of the lightbox links to the original image file on X and to the source post.

Scores in `data/matches.json` are stored home–away, the same way the posts are written. The site shows Arsenal's goals first, so an away win such as Villa 0–1 Arsenal is displayed as 1–0 W.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

```bash
npm test
npm run build
npm run preview
```

`npm run build` writes a static site to `dist/`.

## Add a match

Install Pillow once (used only by the image script, not by the site):

```bash
pip install -r requirements.txt
```

Save a single match as JSON. `team` must be men's. Image URLs should be `pbs.twimg.com` links; the script forces `name=orig`.

```json
{
  "date": "2026-11-01",
  "competition": "Premier League",
  "team": "Men",
  "opponent": "Palace",
  "venue": "H",
  "home": "Arsenal",
  "away": "Palace",
  "score": "2-0",
  "xg": "1.5-0.4",
  "posts": [
    {
      "url": "https://x.com/scottjwillis/status/123",
      "title": "Arsenal 2 - 0 Palace | Full Time | 1.5 - 0.4 xG",
      "posted_utc": "2026-11-01T17:00:00.000Z",
      "images": [
        {
          "file": "2026-11-01_palace_1.jpg",
          "url": "https://pbs.twimg.com/media/EXAMPLE?format=jpg&name=orig"
        }
      ]
    }
  ]
}
```

`competition` is one of `Premier League`, `Champions League`, `League Cup`, or `Community Shield`. `venue` is `H` or `A`. `score` and `xg` are home–away. Filenames must be unique across the archive.

```bash
scripts/add-match path/to/match.json
```

That appends the match to `data/matches.json` (newest date first), downloads each original into `public/images/`, and writes a 400px-wide thumbnail into `public/thumbs/`. Re-running a download for files already on disk:

### Match report

Optional. Point `report` at a Markdown file. The script copies it to `data/reports/<date>_<opponent-slug>.md` and stores that filename on the match. A file already in `data/reports/` can be named directly. Women's matches are still refused, and the report text is refused if it looks like one.

The fixture card shows a circular R on the graphics line only when `report` is set. It opens a scrollable dialog. Close, Esc, and a click on the backdrop dismiss it. The button click does not open a graphic.

Optional `highlights` is an official YouTube https URL. The card shows a circular Y directly above the R, opening the video in a new tab. Leave it out when there is no verified highlights video and the Y stays hidden.

```json
"highlights": "https://www.youtube.com/watch?v=..."
```

```json
"report": "notes/2026-11-01-palace.md"
```

Use this shape. Do not invent incidents, minutes, lineups, or quotes. Write an approximate substitution minute with a tilde, such as ~65'. If the minute is unknown, list the substitution with no minute.

```markdown
**Arsenal 2-0 Palace, Premier League, Emirates Stadium, 1 November 2026**

One short paragraph on the result.

- **How it unfolded**
  - 12': What happened, with the minute when the source gives one.
- **Arteta's comments**
  - "Quote from the manager."
- **Arsenal lineup**
  - XI: ...
  - Bench: ...
- **Subs**
  - 60': Player on for player.
  - ~75': Player on for player.
  - Player on for player.
- **Sources**
  - [Arseblog match report](https://arseblog.news/...)
```

Commit the new file under `data/reports/` with `data/matches.json`.

```bash
scripts/add-match --fetch
```

Commit `data/matches.json`, `data/image-meta.json`, and the new files under `public/images/` and `public/thumbs/`.

## Deploy on Vercel

The repo is a normal Vite static build. Vercel detects it with no extra config.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New… → Project** and import the repository.
3. Leave the defaults: Framework Preset **Vite**, build command `npm run build`, output directory `dist`. No environment variables.
4. Deploy. Later matches ship when you push the new images and JSON.

The committed originals are about 165 MB, plus about 4 MB of thumbnails. Vercel documents a static source-upload cap of 100 MB on Hobby and 1 GB on Pro for CLI deploys (`vercel` upload). Importing the Git repository is the zero-config path: Vercel detects Vite, builds on its servers, and publishes `dist/`. If a Hobby deploy is rejected because the output is over 100 MB, use a Pro project, whose cap is 1 GB.
