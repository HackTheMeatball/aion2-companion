# 0.4 P5b: Milestone and Route rules cards without AION 2 terms

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2,
`docs/design/0.4-engine-contract.md` (P0: `rowRenderers`, the term list) first. Needs P4c merged.

## Problem

After P4c the milestone cards (`cardHTML`, counts and tags: Cleared / Missed / Now / Side quests) and Route rules live
in `src/cards/milestones.js` and `src/cards/route.js`, but they branch on AION 2 row kinds (board nodes, stigma slots,
Sealed Dungeons, regional quests, skill lines) and say AION 2 words.

## Result

The engine cards draw a milestone (header, level, counts, tags, fold) and its rows; a row whose kind the pack owns is
drawn by the pack's row renderer (P0 `rowRenderers`) in `src/packs/aion2/cards/rows.js`. Route rules the same.
Output identical.

## Appetite

M (100–300 lines).

## No-gos

- No visible or DOM change (P4a's DOM snapshot identical), no restyle, no new text.
- No change to what counts as done (`src/core/` requirements are not touched).
- Don't touch `src/main.js`, other cards, `src/styles/app.css`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P0's term scan over `src/cards/milestones.js` and `src/cards/route.js`: 0 hits (paste).
- [ ] P4a's DOM snapshot: identical for every state (paste).
- [ ] Golden identical (milestone headers are in the snapshots); `regress`, `gates`, `e1`–`e4`, `a11y` green.
- [ ] `npm test` green.

## Files (owns)

`src/cards/milestones.js`, `src/cards/route.js`, `src/packs/aion2/cards/rows.js` (new).

## Lanes, model, order

Lanes: none. Model: Opus (counts and tags read the requirement engine; likely > 300 lines with the row renderers).
After: P4c. Runs beside P5a and P5c (wave 8).

- [next] #? opus lanes:none
