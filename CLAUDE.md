# Working rules for AI sessions in this repo

Daeva Companion: an unofficial AION 2 companion app. Today the leveling guide (Asmodian Assassin, Lv 1–45; 1.0 =
all eight classes); 1.1 adds an end-game tracker (ROADMAP.md). Source in `src/` (page shell `index.html`, `styles/*.css`, ES modules
`main.js` / `data/*.js` / `site.js`); `npm run build` (esbuild) inlines it into one HTML file for the site
(daevacompanion.com) and one for the claude.ai artifact. `src/index.html` doesn't run on its own: build, then
`npm run serve`. Read `docs/ARCHITECTURE.md` before touching state, keys, data or the build.

## Saved progress (pre-1.0: clean breaks allowed)

The owner decided (2026-10-16): there are no real players yet, so until 1.0 or the first public launch (whichever
comes first) a change may break existing saves when that gives a better design. Don't write migrations for it.

- A break must be clean: bump the `localStorage` key (`companion-save-v5` → `-v6` …) so old saves are ignored
  and the app starts fresh. Never read an old-shape save into new code, and never crash on one.
- Note every save break in that release's CHANGELOG section ("Saves reset in this version").
- When a break makes `mig1`, `mig2`, `journey` or `tests/e2-migtest.js` obsolete, remove or replace those checks and
  say why in the commit. That is an intended change, not weakening a check. Keep a test that a fresh start works.
- Within one key version: item keys (`checks` etc.) are never derived from array positions. Quests are `rq:<id>`,
  Sealed Dungeons `sd:<slug>`.
- At 1.0 / public launch, restore the strict rule: never break saves, migrations only add, run once behind a flag,
  are idempotent and leave old data in place.

## Test before every commit

- `npm test` (build + all suites) must be green before committing; `node tests/run.mjs --only <suites>` while
  iterating (after `npm run build`). Don't weaken a check to make it pass; if a change is intended, update the
  expectation and say why in the commit (e.g. `E1MIG_WRITE_EXPECTED=1` for mig1's pinned diffs, then review the diff).
- Small commits with clear messages. Don't push unless asked.
- Releases: version bump + CHANGELOG section in one commit; CI tags and publishes (docs/DEPLOY.md, ROADMAP.md).
- Every minor (0.X.0) opens with a planning and audit pass (ROADMAP "How a minor is planned"); no item of that minor
  is queued before the pass is written and reviewed. Parallel work only along module boundaries.
- Locally Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH`); never run `playwright install` locally.

## Data and source policy

- Only verified data: two independent sources, game-database fields (Metabot quest/skill pages, aion2.gaming.tools),
  or the user's in-game screens (the source of truth). Otherwise leave it out, or label it "single
  source" / "inferred" / "disputed" as `data/packs/aion2/asmodian/assassin/guide/claims.json` decides.
- Data lives in `data/**` in format v2 (`docs/DATA-FORMAT-V2.md`, JSON Schemas in `data/schema/`). Change the JSON, then
  `npm run gen` (validates, runs the cross-record checks, rewrites `data/DATA_SOURCES.md`); the build compiles the module
  `src/data/generated.js` in memory, nothing generated is committed except `DATA_SOURCES.md`. `src/data/*.js` only
  re-exports and finishes compiled tables; game facts and guide text go in `data/`, never in `main.js`. Every new URL
  must end up in the Sources card (the generator does this) and `data/DATA_SOURCES.md`.
- Fetching (owner, 2026-10-14): read the terms page and robots.txt before any content page. A site that opts out of AI
  or automated access entirely (names Claude/AI agents, or bans all automated access) is never fetched; the owner
  checks it by hand. A site that only bans scraping (bulk copying) may get small spot checks to verify a fact: a few
  pages per task, at least 5 s apart, facts only, no copies kept. Always identify honestly (our User-Agent, never a
  fake browser) and never bypass a challenge or limit. Otherwise at most 12 requests/min per host, one at a time,
  cache 24 h, stop on 403 / 429 / a challenge page. **No automated reading of
  aion2.th.gl** (its robots.txt excludes AI agents). Facts sourced from th.gl are re-verified against a permitted source
  (Metabot first) and attributed to it; a fact no permitted source confirms is labelled for an owner in-game check.
- Metabot is the main source: credit with plain dofollow links to the page the data came from. thegameswiki is
  CC BY-NC-SA: take facts only, never its wording, into the app; quotes in `claims.json` stay short and credited. Don't use
  Game8. No packet sniffing, memory reading or screenshot parsing (ToS risk; the user doesn't want it).
- No new game art (screenshots, maps, logos, map tiles) without the user's OK. Standing OK (owner, 2026-10-14): skill,
  stigma and item icons may be added from approved sources (Metabot first) without asking, each with its source page,
  file URL and date recorded in docs/ISSUES.md; a missing icon with no approved source is listed for the owner.

## Licensing

- Code is PolyForm Strict 1.0.0; guide text, data selection, name and artwork are all rights reserved (LICENSE). Never add
  MIT or other license headers or files, and don't merge outside code contributions without the user's written grant.
- User-facing text calls the guide "unofficial" and keeps the phrase "not affiliated with or endorsed by NCSoft"
  (`tests/site.js`). Don't imply endorsement by NC or any source site.

## What the user wants

- Technical, direct communication; call out assumptions; propose tests rather than guess.
- Minimal visual distraction, no redundancy across cards, consistent alignment, uniform card layouts (Skills /
  Daevanion / Stigmas; Next up cards look like milestone cards).
- Manual progress is intended: ticking quests, Level up. Level changes only via Level up / − / + / slider.
- The guide must be correct and complete to Lv 45 without the user having to report problems.
- Basic mode = essentials only. Keep both builds visually identical; `dist-artifact` must stay a single file with
  `/_blob/` icons and no service worker.
