# 0.4 P3a: Every test save goes through one helper

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md ("Saved progress"), docs/ARCHITECTURE.md §1
and §5 first. No app change.

## Problem

The save key `aion2-assassin-route-v4` is written in 32 files under `tests/`, and the `e1`, `regress`, `journey`,
`golden`, `gates`, `a11y`, `site` suites and the shot scripts each write a v4-shaped save into `localStorage` their own
way. P3c changes the key and the shape; without one place to change, P3c would touch every suite and go far over
1,000 lines.

## Result

`tests/support/save.js` (CommonJS, usable from the `.mjs` suites too) holds:

- `SAVE_KEY`: the current build's key (read from `src/core/state.js` text or the built page, not typed again), and
  `V4_KEY` for the old baseline builds only (`tests/baselines/v285.html`, `v287.html`, used by `mig1` / `mig2`);
- `toStored(flat)`: turns a test's flat state object (today's shape: character fields at the top level) into what the
  current build stores. Today it returns its input; P3c changes only this function (fixture conversion in the tests,
  never in the app: CLAUDE.md "never read an old-shape save into new code");
- `writeSave(page, flat)`, `readSave(page)` (back to flat, so assertions stay as they are), `clearSave(page)`.

Every suite and support script writes and reads saves only through it.

**Old-shape fixtures stop relying on the app's migrations.** `tests/journey.js:21`, `tests/regress.js:152` and `:175`
and `tests/lib.js:7` load the user's save into the v285 baseline first and let today's migrations carry it into the
current build; `tests/e1test.js:98` and the fixtures `tests/golden.js` adds load pre-0.3 saves (`fixture-v285.json` and
others in `tests/fixtures/`) straight into the current page. After P3c no migration runs. So here, before the break:
for every such use (the list above is the minimum; `grep -rn "fixtures/" tests` for the rest, except `mig1` / `mig2`),
load the save the way the suite does today, take the flat state the current build stores after its load steps, commit it
as a new fixture (`tests/fixtures/*.flat.json`, with the script that made it under `tests/support/`), and seed the
suite from that fixture through `writeSave`. Each suite's result must not change.

## Appetite

M (100–300 lines across about 30 files, mostly one-line swaps).

## No-gos

- No change under `src/`, no change to `tests/baselines/`, no snapshot change, no existing fixture changed (the new
  flat fixtures are added beside them).
- No assertion removed or loosened; a check that reads the raw stored text keeps reading the raw text (through
  `readRaw(page)` if needed).
- `mig1` / `mig2` keep writing the old key into the old baseline builds; they use `V4_KEY` explicitly.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `grep -rln "aion2-assassin-route" tests/ --exclude-dir=baselines` lists only `tests/support/save.js` (paste).
- [ ] No suite calls `localStorage.setItem` / `getItem` with the save key directly (`grep -rn "localStorage" tests/`
      shows only `save.js` and checks that test storage behaviour itself, each named in the PR body).
- [ ] Golden identical, no snapshot changed; `mig1`, `mig2`, `journey`, `regress`, `e1`–`e4`, `site`, `a11y`, `gates`
      green.
- [ ] A small `core` (Node) test pins `toStored` as the identity for today's shape.
- [ ] `journey`, `regress` and `tests/lib.js` no longer open `CFG.V285`; only `mig1` / `mig2` do (paste the `grep`).
      `journey` still reaches Lv 45 with the Lv 44 edge case, and `regress` reports hard fail 0.
- [ ] Outside `mig1` / `mig2`, no suite loads a pre-0.3 fixture into the page; each now reads a `*.flat.json` (the PR
      body lists old fixture → new fixture → suites).
- [ ] `npm test` green.

## Files (owns)

`tests/support/save.js` (new), `tests/fixtures/*.flat.json` and their script (new), and the save lines of
`tests/**` (not `tests/baselines/`, not snapshots, not existing fixtures).

## Lanes, model, order

Lanes: golden, mig (it edits `tests/golden/states.js` and `tests/e2-migtest.js`). Model: Opus (golden and mig test
code; a Sonnet run would hit the routing guard, the #98 cause in the 0.3 look back). After: nothing. Before: P3c.
Wave 1, beside P1 and P3b.

- [next] #? opus lanes:golden,mig
