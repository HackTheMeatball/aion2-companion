# Working rules for AI sessions in this repo

Aion 2 Asmodian Assassin leveling guide, Lv 1–45. Source in `src/` (page shell `index.html`, `styles/*.css`, ES modules
`main.js` / `data/generated.js` / `site.js`); `npm run build` (esbuild) inlines it into one HTML file for the site
(aion2.ishkabytes.com) and one for the claude.ai artifact. `src/index.html` doesn't run on its own: build, then
`npm run serve`. Read `docs/ARCHITECTURE.md` before touching state, keys, data or the build.

## Never break saved progress

- `localStorage` key stays `aion2-assassin-route-v4`. Never rename, version or split it.
- Item keys (`checks` etc.) are permanent; a removed key is retired, never reused. Never derive keys from array
  positions. Quests are `rq:<id>`, Sealed Dungeons `sd:<slug>`.
- Migrations only add (copy / tick), run once behind a new flag, are idempotent, and leave old data in place.
- Any change that could touch saves: run `mig1`, `mig2` and `journey`, and extend `tests/e2-migtest.js` if you add a
  migration.

## Test before every commit

- `npm test` (build + all suites) must be green before committing; `node tests/run.mjs --only <suites>` while
  iterating (after `npm run build`). Don't weaken a check to make it pass; if a change is intended, update the
  expectation and say why in the commit (e.g. `E1MIG_WRITE_EXPECTED=1` for mig1's pinned diffs, then review the diff).
- Small commits with clear messages. Don't push unless asked.
- Releases: version bump + CHANGELOG section in one commit; CI tags and publishes (docs/DEPLOY.md, ROADMAP.md).
- Locally Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH`); never run `playwright install` locally.

## Data and source policy

- Only verified data: two independent sources, game-database fields (Metabot quest/skill pages, aion2.gaming.tools,
  aion2.th.gl), or the user's in-game screens (the source of truth). Otherwise leave it out, or label it "single
  source" / "inferred" / "disputed" as `data/claims.json` decides.
- Change `data/*.json`, then `npm run gen`; never hand-edit `src/data/generated.js` (the `E2-GEN` block). Every new URL must end up in the
  Sources card (gen.py does this) and `data/DATA_SOURCES.md`.
- Metabot is the main source: credit with plain dofollow links to the page the data came from. thegameswiki is
  CC BY-NC-SA: take facts only, never its wording, into the app; quotes in `claims.json` stay short and credited. Don't use
  Game8. No packet sniffing, memory reading or screenshot parsing (ToS risk; the user doesn't want it).
- No new game art (icons, screenshots, maps, logos) without the user's OK; record each icon's source in docs/ISSUES.md.

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
