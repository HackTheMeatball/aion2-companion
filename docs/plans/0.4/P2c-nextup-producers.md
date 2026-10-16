# 0.4 P2c: Next up: the engine ranks, the pack produces the cards

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2 ("Next up") and
`docs/design/0.4-engine-contract.md` (P0, the `nextUpProducers` hook) first. Needs P2b merged.

## Problem

`src/core/nextup.js` (`rankNext`) builds the AION 2 card kinds itself: in-progress dungeon, Cube items, skill buy,
board node, stigma equip / upgrade, regional quest, Sealed Dungeon / stronghold picks (59 of 158 lines name AION 2).
A second game's Next up would need the engine edited.

## Result

- The engine's `rankNext(state, { basic })` collects candidate cards from the engine's own producers (milestone steps,
  the story card, Later cards) and from the pack's `nextUpProducers` (P0), then applies today's order rules, the Basic
  filter and the 8-card cap. Same signature, same output.
- The AION 2 producers live in `src/packs/aion2/nextup.js`.

## Appetite

M (100–300 lines).

## No-gos

- No change to any Next up card, its order or the cap: golden identical, no re-record.
- No render change (`renderNow` / `nowCard` in `src/main.js` are P4c / P5a's).
- Don't touch `src/main.js`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P0's term scan over `src/core/` finds no AION 2 term (paste: 0 hits).
- [ ] `tests/core/nextup.test.mjs` passes unchanged in what it asserts (only import paths may change); a new test runs
      `rankNext` with no pack producers and gets only engine cards.
- [ ] Golden identical, no snapshot changed; `gates` (the sweep) and `invariant` green.
- [ ] `npm test` green.

## Files (owns)

`src/core/nextup.js`, `src/packs/aion2/nextup.js` (new), `tests/core/nextup*.mjs`.

## Lanes, model, order

Lanes: none. Model: Opus (src/core, Next up ranking). After: P2b. Runs beside P4a (wave 5). Before: P5a, P6.

- [next] #? opus lanes:none
