# 0.4 P4e: Golden snapshots stored per card

Added after the planning pass (owner idea, 2026-10-16 6:29 PM ET: cards worked on in parallel). Read CLAUDE.md,
tests/golden/README.md and docs/ARCHITECTURE.md §2 first. Needs P4c merged.

## Problem

`tests/golden/snapshots/*.json` is sharded by state group and level band (`level-L01-05.json`, `build-L41-45.json`,
…), and each state's record holds every card's output together (`nu` Next up, `ms` milestones, …). A change that
should move only one card re-records files every other card's work also re-records, so any two card changes that
touch golden conflict, and `golden` stays a serial lane.

## Result

- Snapshots stored per card: `tests/golden/snapshots/<card>/<group>-<band>.json`, where `<card>` is each top-level key
  of a state's record (and `in` / input stays with a `_state/` shard). `tests/golden.js` writes and reads that layout;
  verify, `--record`, `--filter`, `--explain` and the diff report behave as today.
- `--record --card <name>` re-records only that card's shards and fails if any other card's output changed.
- tests/golden/README.md describes the layout and the per-card re-record.

## Appetite

M (100–300 lines; regenerated snapshot files don't count).

## No-gos

- No recorded value changes: the new shards hold exactly today's records, split (prove it below).
- No change to what is recorded (`probe.js`) or to the state generator (`states.js`).
- No change to `src/`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] A one-off script (in the PR body, not committed) merges the new per-card shards back per state and diffs them
      against `main`'s snapshots: identical for all states (paste the count).
- [ ] `node tests/golden.js` verifies green on this branch and on a branch with one planted Next up change it
      reports only `nextup/` shards (paste; not committed).
- [ ] `--record --card nu` after a planted milestone change fails, naming the `ms` card (paste; not committed).
- [ ] `npm test` green.

## Files (owns)

`tests/golden.js`, `tests/golden/snapshots/**` (re-laid out), tests/golden/README.md.

## Lanes, model, order

Lanes: golden. Model: Opus (golden re-layout). After: P4c. Runs beside P5a–P5c and P4d (wave 8) when a slot frees.
Before: R. When it merges, card behaviour changes re-record only their own snapshots.

- [next] #? opus lanes:golden
