# 0.4 P6: A fake game pack and the conformance check every pack passes

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"; audit decision 5). Read CLAUDE.md, docs/ARCHITECTURE.md §3 and
§5, docs/DATA-FORMAT-V2.md and `docs/design/0.4-engine-contract.md` (P0) first. Needs P2c and P3c merged.

## Problem

"The engine holds no AION 2" is only provable by running it on a game that isn't AION 2. Nothing does that today.

## Result

- `tests/fixtures/packs/fakegame/`: a game pack and one guide pack with manifests (P1 format), about 20 lines of
  records: three story quests in one chain, one milestone with two steps, one gate (a step that opens when the second
  quest is turned in), one source site of its own. It ships to no one.
- `tests/core/conformance.test.mjs` (runs in the `core` suite, so CI needs no new job) runs, for **every pack chain**
  (the AION 2 Assassin chain and the fake game):
  1. the generator (`--root`, `--pack`, P1) builds it with 0 failed checks;
  2. a fresh v5 save (P3c) through `memoryStorage` (P3b): Lv 1 on the first story quest;
  3. the engine's `rankNext` with the pack's producers (P2c): the first story step comes first; turning the quest in
     moves Next up on; the gated step stays out until its quest is turned in;
  4. save, reload, `merge()` with itself: unchanged;
  5. the fake chain loads no module from `src/packs/aion2/` (check the import graph).

## Appetite

M (100–300 lines plus the fixture data).

## No-gos

- No schema loosened for the fake game. If a schema makes an AION 2-only collection or field required, the fake pack
  leaves the collection out only where the pack manifest can declare which collections it has; any other case is a
  finding: list it in the PR and in `docs/design/0.4-engine-contract.md`, don't change the schema here.
- No page build of the fake game (Node only); no change to `src/`.
- Not a test of AION 2 data correctness (the other suites do that).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `node tests/core.mjs` runs the conformance file for both chains; paste the lines.
- [ ] A negative control: a copy of the fake pack with a broken gate reference fails step 1 (show it).
- [ ] Step 5 fails on a planted `import` of `src/packs/aion2/` in the engine (show it, then remove it).
- [ ] The fake pack is under 40 lines of records (paste `wc -l` of its data files).
- [ ] `npm test` green.

## Files (owns)

`tests/fixtures/packs/fakegame/**` (new), `tests/core/conformance.test.mjs` (new), `tests/core.mjs` if it lists files.

## Lanes, model, order

Lanes: none. Model: Opus (engine conformance; the generator is run, not changed). After: P2c, P3c. Beside P4b
(wave 6). Before: P8.

- [next] #? opus lanes:none
