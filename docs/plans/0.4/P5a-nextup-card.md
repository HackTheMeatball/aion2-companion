# 0.4 P5a: Next up card (and Later) without AION 2 terms

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2 ("Next up"),
`docs/design/0.4-engine-contract.md` (P0: `nowRenderers`, the term list) first. Needs P4c and P2c merged.

## Problem

After P4c the Next up card lives in `src/cards/nextup.js` (`renderNow`, `nowCard`) and Later in `src/cards/ahead.js`,
but they still render the AION 2 card kinds themselves (Cube items, skill buys, board nodes, stigma equips, Sealed
Dungeons, Kibelisk hints). The card can't show another game's Next up.

## Result

The engine card renders the parts every game has (title, why, the act button, Basic / Advanced, the 8-card cap, the
pop-out) and hands each card whose `kind` the pack owns to the pack's renderer (P0 `nowRenderers`) in
`src/packs/aion2/cards/nextup-kinds.js`. Later (`ahead.js`) the same way. Output identical.

## Appetite

M (100–300 lines).

## No-gos

- No visible or DOM change (P4a's DOM snapshot identical), no new text, no restyle.
- No ranking change (`src/core/nextup.js` is done, P2c).
- Don't touch `src/main.js`, other cards, `src/styles/app.css`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P0's term scan over `src/cards/nextup.js` and `src/cards/ahead.js`: 0 hits (paste).
- [ ] P4a's DOM snapshot: identical for every state (paste).
- [ ] Golden identical; `regress` (incl. the pop-out), `journey`, `e1`–`e4`, `a11y` green.
- [ ] `npm test` green.

## Files (owns)

`src/cards/nextup.js`, `src/cards/ahead.js`, `src/packs/aion2/cards/nextup-kinds.js` (new).

## Lanes, model, order

Lanes: none. Model: Opus (the Next up card with a pack hook). After: P4c, P2c. Runs beside P5b and P5c (wave 8).

- [next] #? opus lanes:none
