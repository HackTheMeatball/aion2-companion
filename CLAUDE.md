# Working rules for AI sessions in this repo

Aion 2 Asmodian Assassin leveling guide, Lv 1–45. One-file app in `src/index.html`; site at aion2.ishkabytes.com and a
claude.ai artifact build. Read `docs/ARCHITECTURE.md` before touching state, keys or data.

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
- Locally Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH`); never run `playwright install` locally.

## Data and source policy

- Only verified data: two independent sources, game-database fields (Metabot quest/skill pages, aion2.gaming.tools,
  aion2.th.gl), or the user's in-game screens (the source of truth). Otherwise leave it out, or label it "single
  source" / "inferred" / "disputed" as `data/claims.json` decides.
- Change `data/*.json`, then `npm run gen`; never hand-edit the `E2-GEN` block. Every new URL must end up in the
  Sources card (gen.py does this) and `data/DATA_SOURCES.md`.
- Metabot is the main source: credit with plain dofollow links. thegameswiki is CC BY-NC-SA (fine, non-commercial).
  Don't use Game8. No packet sniffing, memory reading or screenshot parsing (ToS risk; the user doesn't want it).

## What the user wants

- Technical, direct communication; call out assumptions; propose tests rather than guess.
- Minimal visual distraction, no redundancy across cards, consistent alignment, uniform card layouts (Skills /
  Daevanion / Stigmas; Next up cards look like milestone cards).
- Manual progress is intended: ticking quests, Level up. Level changes only via Level up / − / + / slider.
- The guide must be correct and complete to Lv 45 without the user having to report problems.
- Basic mode = essentials only. Keep both builds visually identical; `dist-artifact` must stay a single file with
  `/_blob/` icons and no service worker.
