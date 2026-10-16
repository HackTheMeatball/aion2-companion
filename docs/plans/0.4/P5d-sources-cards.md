# 0.4 P5d: Sources, Confidence and Undo cards without AION 2 terms

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md ("Data and source policy": every URL in the
Sources card), docs/ARCHITECTURE.md §2 and `docs/design/0.4-engine-contract.md` (P0: the term list) first. Needs P4c
merged.

## Problem

`src/cards/sources.js` (moved in P4a) and `src/cards/undo.js` (P4c) may still carry AION 2 wording (site names,
"Metabot" in labels, game terms in Undo messages) instead of reading it from the pack's data (`SOURCES`, `SRC_SITE`,
`CONF`).

## Result

The cards take every game- or site-specific word from the pack's compiled data or the pack's text table; the engine
card holds only the card frame and generic labels. Output identical.

## Appetite

S (under 100 lines).

## No-gos

- No visible or DOM change (P4a's DOM snapshot identical); the Sources card keeps every URL and credit exactly as now
  (CLAUDE.md: plain dofollow links, the "not affiliated with or endorsed by NCSoft" text untouched).
- No data change; don't touch `src/main.js`, other cards, `src/core/`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P0's term scan over `src/cards/sources.js` and `src/cards/undo.js`: 0 hits (paste).
- [ ] P4a's DOM snapshot: identical for every state (paste).
- [ ] `site` (licence and "not affiliated" text), `e1`–`e4`, `a11y` green; golden identical.
- [ ] `npm test` green.

## Files (owns)

`src/cards/sources.js`, `src/cards/undo.js`, a pack text table under `src/packs/aion2/` if needed.

## Lanes, model, order

Lanes: none. Model: Sonnet (render only, small; no core, save or gate code). After: P4c. Runs when a wave-8 slot frees.

- [next] #? sonnet lanes:none
