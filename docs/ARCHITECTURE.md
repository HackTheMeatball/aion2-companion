# Architecture

The app is one static HTML page with no framework and no runtime dependencies. Its source is split into a few files
(0.2 P1) that `scripts/build.mjs` inlines back into one HTML file per deliverable with esbuild:

| Source | What |
|---|---|
| `src/index.html` | page shell: head, markup, `@web-only` markers, and the tags naming what is inlined |
| `src/styles/fonts.css`, `src/styles/app.css` | the styles (the `@font-face` rules; everything else), inlined verbatim |
| `src/main.js` | the app script (ES module entry, ≈2,400 lines, still one global scope); imports the generated data |
| `src/data/generated.js` | the generated data block as an ES module (`npm run gen`; never edit by hand) |
| `src/site.js` | the standalone site's own script (storage persistence, service worker registration); `@web-only` |

`src/index.html` is not runnable by itself: `npm run build && npm run serve`. The two deliverables must behave the same:

| Build | Where | Differences |
|---|---|---|
| `dist/` | GitHub Pages, <https://aion2.ishkabytes.com/> | full `<head>`, icons at `assets/icons/*.png`, manifest, service worker |
| `dist-artifact/index.html` | claude.ai artifact (single file) | no document skeleton (claude.ai adds one), icons at `/_blob/<id>`, no SW / manifest |

## 1. Saved progress (the part you must not break)

People level for weeks with their progress in `localStorage`. A broken key silently drops their ticks, and there is
no server copy. Rules:

- **The storage key is `aion2-assassin-route-v4` forever.** Don't rename it, don't version it, don't move state to
  another key. (`…:before-import` holds the state an import replaced.)
- **Item keys are permanent.** A key that is removed is retired, never reused for something else (retired so far:
  `g45:1`, `hold:0`, the position keys replaced in E1). Old ticks stay in the saved state; harmless.
- **Migrations only add.** They copy or tick, set a one-time flag, and leave the old data in place, so an older build
  can still read a newer save (the migration tests load new saves back into old builds).
- **New fields must default safely** when absent: every existing save lacks them.

### State

`state` is one JSON object, loaded at startup as `Object.assign(DEFAULT(), saved)` and written back by `save()` after
every change. Every write (`save()` and the one-time steps below) goes through `storeState()`, which shows the
"couldn't be saved" banner (`#saveWarn`, with the Export action) when `localStorage.setItem` throws and hides it after
the next write that works; what is written, and under which key, is unchanged.

The only other localStorage key is `…:before-import` (see Import below). On the standalone site the page asks
`navigator.storage.persist()` when it loaded saved progress, at most once per browser session (flag in
`sessionStorage`, so the localStorage keys stay as they are; the `golden` suite records them).

| Field | Meaning |
|---|---|
| `checks{key: bool}` | every tick: milestone steps, regional quests, dungeons, strongholds, skill levels, board nodes |
| `started{key: 1}` / `areaRun{key: ms}` | regional quest in progress / Sealed Dungeon run started (two-click boxes) |
| `level`, `quest`, `storyEnd` | character level (changes only via Level up / − / + / slider), current main story quest, end-of-data marker |
| `qsteps{quest: [i]}`, `qsub{quest: {i: [j]}}` | story objective ticks, keyed by **quest name** |
| `rqSnooze{key: level}` | "Not in game yet" snoozes (cleared by Level up / prerequisite turned in) |
| `stLv{name: lv}`, `stShards`, `stPick{slot: name}` | stigma levels, shards, the stigma picked per slot |
| `stones`, `pendSt`, `pendCr`, `dvTotal`, `dvCost{key: n}`, `dvAdj`, `dvLast…` | Wisdom Stones / pending Cube items / Daevanion points and node costs |
| `mode` (`basic`/`advanced`), `open{id}`, `hide`, `hideCards`, `hideOpt`, `areaLv`, … | view settings |
| `seedLv12`, `stTriniel1`, `dvReset1`, `migV5`, `eputSync1` | one-time flags (see below) |

### Item keys

- Milestone (`GATES`) and route-rule (`STEPS`) items carry an explicit `k`. Older items keep their historical position
  key written out (`"g22:1"`, `"build:0"`); never derive a key from an array index.
- Regional quests: `rq:<quest id>` (Metabot / game id). Sealed Dungeons: `sd:<slug>` (`g10h:` kept for Lv 10).
  Strongholds: `sh:<slug>`. Skills: `sp:<skill>:<level>`. Board nodes: `dv:<node>` (Nezekan), `dv:z:` / `dv:v:` /
  `dv:t:<node>` (Zikel / Vaizel / Triniel).
- Milestone step gates (read by `stepsOf` for Next up): `story: X` / `after: X` = the story has **reached** X (your
  current quest is X or later); `turnedIn: X` = X is **turned in** (current quest past X, or X is the last covered
  quest and `storyEnd` is X); `byStory` = the step *is* story quest X: ticked by *Turned in*, hidden from Next up while
  you're on X and (display only, no tick written) once you're past it.
- Quests are placed into milestones **at runtime** by recommended level, so moving one between milestones never
  changes its key.

### Migrations and one-time steps (in load order)

1. Fresh browser (no save): the seed flags are set without running; cleared milestones start folded.
2. `migV5` (E1): `MIG_V5` copies `checks` / `started` / `areaRun` from the 105 old position keys to `rq:` / `sd:` keys.
3. `seedLv12`, `stTriniel1`, `dvReset1`: one-time player syncs from early versions (only for saves that predate them).
4. Equipped stigma slots without a pick are pinned to the plan name they were equipped with (plan order can change).
5. `eputSync1` (E4): equipped slots get their "Put X on E" step ticked.
6. Import: replaces the state (after confirming), keeps the old one under `:before-import`, marks the seeds done; the
   migrations above run on the reload.

Adding a migration: give it a new flag, make it idempotent and additive, run it after the existing ones, save only if
`hadSave`, and extend `tests/e2-migtest.js` (realistic old save → new build, reload idempotent, rollback to the old
build still works). Run `mig1` / `mig2`.

## 2. Render pipeline

- `render()` builds the static DOM once: milestone cards (`GATES`) and route rules (`STEPS`) via `cardHTML`.
- `update()` runs after every change (≈10 ms; a test keeps it under 15 ms): milestone counts and tags
  (Cleared / Missed / Now / Side quests), progress ring, then `renderQuest` (Journey), `renderNow` (Next up stack),
  `renderNext` (Skills / Daevanion / Stigmas cards), `renderAhead`, area lists. Layout fitting runs in
  `requestAnimationFrame`, not inside `update()`.
- **Next up** (`renderNow`) builds one-task cards from: in-progress dungeon, Cube items, skill buy, board node, stigma
  equip / upgrade, milestone steps, the story card, the regional-quest card, Sealed Dungeon / stronghold picks, Later
  cards; `dedupeNow` removes duplicates. It can live in a Document Picture-in-Picture window (`#nowStar` moves there).
- **Regional availability** (`rqAvail`): unlock level (or recommended level for quests with no prerequisite data,
  `rqOpenLv`) + story at/after its story gate + regional prerequisites turned in. Used by Next up, tips, Progress and
  milestone dimming.
- Basic mode is mostly CSS (`body.basic`) plus a few branches in `renderNow` / `renderNext`.

## 3. Data pipeline

```
web sources ──(tools/research/*.py, by hand)──▶ data/*.json ──tools/gen/gen.py──▶ tools/gen/gen-block.js ──apply.py──▶ src/data/generated.js
                                                                  │                (the block between /* E2-GEN START */ … /* E2-GEN END */, + export list)
                                                                  ├─▶ tools/gen/gen-report.json (405 consistency checks, warnings)
                                                                  └─▶ data/DATA_SOURCES.md (every URL and what it backs)
```

- `data/*.json` is the source of truth for regional quests (`rq.json`, `rq-chains.json`), story (`story.json`,
  `story-40-45.json`), strongholds, dungeons, build (skills / boards / stigmas) and text claims (`claims.json`, with
  verdicts verified / single-source / inferred / disputed / drop). `claims-notes.md` explains the verdicts.
- The generated block defines `RQ`, `RQ_STATS`, `QUESTS_X`, `QUEST_STEPS_X`, `QUEST_LOC_X`, `STORY_END`, `SH_DATA`,
  `AREA_LOC`, `SD_RW`, `SP_EXTRA`, `DV_BOARDS`, `SOURCES`, `SRC_SITE`, `CONF`. Never edit it by hand.
- Hand-written data still in `src/main.js`: `GATES` / `STEPS` text, `QUESTS` 1–40 and `QUEST_STEPS`, `SP_SKILLS`,
  `STAT_TIERS`, `TIPS`, `VERIFIED_UNLOCKS`, `HIDEOUT_AREA`. Text there follows `claims.json`.
- Snapshots of earlier page data the generator still reads are in `tools/gen/snapshots/`.

Regenerate after changing `data/`:

```sh
npm run gen          # = python3 -I tools/gen/gen.py && python3 -I tools/gen/apply.py; exits 1 if a check fails
git diff src/data/generated.js data/DATA_SOURCES.md   # review
npm test             # e4 checks generated.js carries the current block and the page has its values
```

`tools/research/` holds the scripts that produced `data/rq.json`, `rq-chains.json`, `build.json` and `claims.json`
(they reproduce the committed files exactly) plus small merge helpers; see its README. `tools/history/` has the
one-time E2 / E4 patch scripts, kept for provenance only.

## 4. Build and site

- `scripts/build.mjs` assembles the page: each `<link rel="stylesheet" href="styles/X.css">` line of the shell becomes a
  `<style>` with the file as it is; each `<script type="module" src="X.js"></script>` line becomes one classic `<script>`
  holding esbuild's bundle of that entry (format `esm` with no imports or exports left, so no wrapper; no minification;
  no tree shaking, since names are used from inline `onclick` attributes and from tests). Every top-level name therefore
  stays a page global, as before modules. esbuild reprints the code: comments dropped, its own formatting, and
  top-level `const` / `let` emitted as `var` (it does this whenever it bundles; none of the 239 top-level names is a
  `window` property). CSS is not passed through esbuild: its printer rewrites values (unquoted `url()`, one
  `unicode-range` entry per line) that the claude.ai font conversion and the test font blocker read.
- It then checks the `<!-- @web-only -->` markers (in the shell), that every referenced icon exists and has a blob id
  (`scripts/artifact-blobs.json`), and that the fonts are all shipped and referenced with their OFL texts and nothing
  requests Google Fonts; then writes `dist/` (markers stripped; `public/`, icons and fonts copied; `sw.js` with the
  build id = hash of all cached files) and `dist-artifact/index.html` (web-only blocks removed before inlining, so
  `site.js` is never in it; icons → `/_blob/<id>`; the `styles/fonts.css` link replaced by a script that holds each
  font file once in base64 and registers the same faces with the FontFace API; capped at 150 KB).
- Fonts (since 0.1.5): `src/assets/fonts/` holds the latin and latin-ext WOFF2 files Google Fonts serves for Marcellus SC,
  Figtree and JetBrains Mono, with their SIL OFL 1.1 texts. The `@font-face` rules copy Google's CSS (one face per
  weight and subset, same unicode ranges; Figtree and JetBrains Mono are variable files shared by their weights), so
  text renders exactly as before; a weight range per file would render weight 500 mono text differently. The page
  makes no third-party request.
  It also fills the placeholders `__APP_VERSION__` (from `package.json`) and `__APP_BUILD__` (`site` / `claude.ai`):
  the footer's version link and the "Report a problem" link use them, so the version is never typed into the page.
- Footer **Report a problem**: opens `.github/ISSUE_TEMPLATE/bug.yml` with its fields prefilled through the URL (field ids
  as query parameters): version, level, story quest, mode, build and user agent, and nothing else from the save. The
  `site` suite pins that list.
- `src/sw.js`: precaches the shell, icons and fonts; network-first for the page, cache-first for the rest; other
  `aion2-route-*` caches (older builds, the pre-0.1.5 Google Fonts cache) are deleted on activate. Registered only on
  https or localhost, and only in `dist/`.
- Export: `window.claude.use("downloads")` when present (claude.ai), else a Blob download.
- `scripts/serve.mjs`: static server for `dist/` (+ `/artifact/`, `/_blob/<id>`, and `/__baselines/` for tests).

## 5. Tests

`npm test` builds, serves `dist/` on localhost, and runs every suite (`tests/run.mjs`); output in `tests/out/`.

| Suite | What |
|---|---|
| `site` | head, footer (version, Report a problem), export (Blob and claude.ai paths), service worker + offline, manifest, 404, artifact build, self-hosted fonts, persistent storage, save-failure banner |
| `e1`…`e4` | functional checks from each polish pass |
| `mig1` | v285 save → current build (4 intended differences pinned in `tests/fixtures/e1-migtest-expected.json`), rollback |
| `mig2` | realistic v287 save → current build, idempotent, rollback |
| `regress` | Lv 25–45 × Basic/Advanced × 1500/1100/390 px × clean/messy saves, the user's save, pop-out |
| `journey` | the user's save from Lv 27 to 45 by clicking through Next up |
| `golden` | golden master: 2,000 generated saves (every level × story position × tick subsets × Basic/Advanced × build states, plus the fixtures) against `tests/golden/snapshots/` |
| `gates` | every story position × {quest level, 45}: no Next up step before its story gate or after the story passed it |
| `a11y` | axe-core (pinned devDependency) at 390 / 1500 px in fresh / Lv 27 / Lv 45 × Basic / Advanced, failing on any rule outside the allowlist in `tests/a11y.js` (rules still open until 0.1.7, each with its audit item); spoken button names; reduced motion after Level up; Escape on the "i" popovers; hit areas ≥ 24 px that never take a point from a neighbour |

**Golden master** (`tests/golden/README.md`): records Next up, milestone headers, the Journey card, the Dungeons &
Strongholds card and the stored state after load for each generated save, and fails on any difference with a summary
grouped by kind of change. It is the acceptance test for refactors ("golden identical"). After an intended behaviour
change, re-record with `node tests/golden.js --record`, review the summary and `tests/golden/KNOWN-VIOLATIONS.md`
(Next up cards whose gate isn't met, generated), and commit the snapshots with the change.

**Accessibility** (since 0.1.6, audit `docs/audits/2026-10-mobile-a11y.md`): the `a11y` suite's `ALLOW` list only
shrinks: when a rule is fixed, remove it so it can't come back. Motion follows `prefers-reduced-motion` per animation
(CSS overrides next to each animation, `SMOOTH()` for every script scroll; no blanket duration override, since
`#rwToast` clears itself on `animationend`). Small controls get their 24 px target from an invisible `::before` /
`::after` (`src/styles/app.css`, "Pointer targets"); the suite lists them in `HIT`.

Baselines (`tests/baselines/v285.html`, `v287.html`) are the old single-file builds, served from the same origin so
they share `localStorage` with the current page. Web fonts are blocked in test browsers so layouts render with
fallback fonts on every machine (`tests/support/block-web-fonts.cjs`: the self-hosted font files, the claude.ai build's
inlined fonts, Google Fonts for the baselines; service workers are blocked unless a context allows them, since a worker
would serve the fonts unrouted). `--with-fonts` lifts all of it.

## 6. Build and module notes

The Tech Lead's working notes on the esbuild toolchain (acceptance checks, global-scope rules, comparing renders,
timing checks) are in [docs/team/tech-lead.md](team/tech-lead.md), *Standing notes*.
