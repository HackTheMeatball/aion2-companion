# 0.4 P2b: AION 2 code out of the engine into `src/packs/aion2/`

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md (all) and
`docs/design/0.4-engine-contract.md` (P0) first; P0's split table and hook map are the spec for what moves. Needs P0,
P2a and P3c merged.

## Problem

About half of `src/core/` names AION 2 (keyword scan at `acf4c8e`: `requirements.js` 106 of 442 lines, `catalog.js`
37 of 118, `ascension.js` 10 of 36), and `src/data/*.js` is the AION 2 data finished for the page. The engine can't
run another game while it imports these.

## Result

- `src/core/catalog.js`, `src/core/ascension.js` and `src/data/*.js` move to `src/packs/aion2/` (renames, imports
  updated); `blockers.js` moves or stays as P0's table says.
- `src/core/requirements.js` is split along P0's table: the engine keeps the evaluator glue (`gatesOf`, the one
  evaluator per update, counts over whatever catalog the pack gives); the pack gets the `KEPT_RULES`, the
  `GATE_CHANGES` record lists and their off-variants, the regional / stigma / skill / board helpers, through P0's hooks
  (for example `graphTransforms`).
- The stigma pick pinning left in `src/core/migrations.js` after P3c moves to the pack's load hook.
- `src/main.js` imports from the new paths and hands the pack to the engine; nothing else in it changes.

## Appetite

L (300–1,000 hand-written lines; renames count once). If it heads over 1,000, stop at a file boundary, push what is
green (requirements split first), and say in the PR what is left: it becomes a follow-up item, not a bigger PR.

## No-gos

- No behaviour change anywhere: golden, `equiv`, `invariant`, `gates`, `journey` as they are, no re-record.
- `src/core/nextup.js` is P2c's; don't split it here (only its import paths change).
- No card or render change in `src/main.js` beyond imports and the wiring line(s).
- The 0.3 switches stay switchable (`golden --explain` and `equiv` keep working); they move, they aren't removed.
- No check is removed or loosened; the `GATE_CHANGES` / `KEPT_RULES` tests follow the code to its new path.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `tests/core/purity.test.mjs` (extended): no file in `src/core/` imports from `src/packs/`, `src/cards/`,
      `src/data/` or `src/main.js`; it fails on a planted import (show the negative control).
- [ ] P0's term scan over `src/core/` finds terms only in `nextup.js` (P2c's) (paste the hit list).
- [ ] `tests/core/gate-sources.test.mjs` still pins the kept rules, at their new path.
- [ ] Golden identical, no snapshot changed; `equiv`, `invariant`, `gates`, `core`, `journey` green.
- [ ] `node tests/golden.js --explain` still attributes with every switch (run it with one switch off; paste the
      summary line).
- [ ] docs/ARCHITECTURE.md's source table and §4 "Pure core rules" describe the new layout.
- [ ] `npm test` green.

## Files (owns)

`src/core/{catalog,requirements,ascension,blockers,migrations}.js`, `src/data/**` (moved), `src/packs/aion2/**`,
`src/main.js` (imports and wiring only), `tests/core/**`, `tests/equiv/**` and `tests/golden/*.js` import paths,
docs/ARCHITECTURE.md.

## Lanes, model, order

Lanes: main.js. Model: Opus (src/core, gates, L). After: P0, P2a, P3c (it shares `src/core/` and `main.js` with P3c,
so it runs after it: review note 1 on #134). Before: P2c, P4a. Runs alone in wave 4.

- [next] #? opus lanes:main.js
