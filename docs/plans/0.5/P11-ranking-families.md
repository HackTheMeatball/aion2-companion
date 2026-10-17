# 0.5 P11: Test states, oracle and invariants for smart Next up (every switch off)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, tests/golden/README.md,
docs/design/0.4-smart-next-up.md §11 and §12, and docs/design/0.3-requirement-engine.md §13 (the switch mechanism)
first. Needs P10.

## Problem

The golden master's 2,000 states and the invariant suite's 10,000 carry no dated change times, so every
location-aware rule is a no-op on them; nothing could show a ranking change before it ships.

## Result

- **State families** in `tests/golden/states.js`: `loc` (dated stamps per band and zone × Basic / Advanced), `behind`
  (level 5–15 above the ticks, at and around the catch-up thresholds), `bind` (story positions × {no ticks, all
  objective ticks}, including the Galorik's Inspection Area state of design §8.4). Recorded once with every switch off.
- **Switch table**: the engine's `RANK_CHANGES` (`ascensionFirst`, `placeRank`, `trackFilter`, `bandLabels`, `catchUp`,
  `etaLater`) in `src/core/nextup.js`, the pack's (`bindDerived`, `bindNudge`, `travelAdvice`) in
  `src/packs/aion2/nextup.js`, all off; `--explain` attributes a changed state to the smallest set of switches.
- **Oracle**: an independent `whereNow` / `bound` in `tests/support/oracle.mjs`, from the raw JSON.
- **Invariants** 7, 11, 12, 14, 15 of design §11 in the `invariant` suite.

## Appetite

M–L (300–500 lines).

## No-gos

- Every switch off: Next up, milestones, Journey and the Dungeons card unchanged for every existing state.
- No `src/cards/` or page change; the existing golden states and their snapshots unchanged (only new states are added).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Golden verify on `main`'s states: identical; the re-record only adds the new families (paste the summary per
      card).
- [ ] `--explain` runs with the switch table and reports no switch on (paste).
- [ ] `invariant` green with the new invariants, under 30 s (paste the time); a planted bug per invariant fails it
      (negative controls, not committed; paste).
- [ ] `equiv`, `core`, `golden` green; `npm test` green.

## Files (owns)

`tests/golden/states.js`, `tests/golden/explain.js`, `tests/golden/snapshots/**` (new states only),
`tests/support/oracle.mjs`, `tests/invariant.mjs`, `tests/invariant/**`, `src/core/nextup.js` (the switch table only),
`src/packs/aion2/nextup.js` (its switch table only).

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: golden. Model: Opus (golden, invariants, core).

After: P10.

- [next] #? opus lanes:golden
