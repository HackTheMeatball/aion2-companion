# 0.5 P6: Long cards folded by default on phones

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/ARCHITECTURE.md §1 ("State":
view settings), docs/design/phone-layout.md §3.6 and patch I, and the owner's answers to its §5 questions first.
Needs P2.

## Problem

On a phone, Journey (963 px in Advanced on the Lv 39 fixture), Progress and Dungeons & Strongholds push everything
below them down. Only Confidence and Sources fold today (`details.foldcard`, their state saved as `fold_<id>` by the
shell).

## Result

The cards the owner approved (recommended: Progress in Basic and Dungeons & Strongholds in both modes; Journey stays
open, since it holds Level − / + and the slider that Basic shows today) become
`details.foldcard` with a uniform 48 px summary row and are folded by default at ≤ 600 px. Once the user opens or
closes one, the choice is saved as `fold_<id>` (the existing pattern, a view setting in the v5 save, add-only) and wins
over the default. Above 600 px every card opens as today.

## Appetite

M (100–300 lines).

## No-gos

- No save break: same key `companion-save-v5`, new top-level `fold_<id>` view keys only on a user's toggle; no
  character field.
- No change to card content; no change above 600 px; Level − / + and the slider stay in Journey (P4 moves only Level
  up).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] At 390 px, fresh: the approved cards are folded, each summary row 48 px tall (paste).
- [ ] Open one, reload: it stays open; the stored save differs from before only by that `fold_<id>` key (paste the
      diff).
- [ ] At 1500 / 1100 px, fresh and with a save that has `fold_*` keys: every card renders open as on `main` (style
      and DOM snapshots equal; paste).
- [ ] `save`, `a11y`, `e1`, `regress` green; golden identical (its `store` field unchanged); `npm test` green.

## Files (owns)

`src/cards/journey.html`, `src/packs/aion2/cards/progress.html`, `src/packs/aion2/cards/areas.html` (the `details`
wrappers), `src/main.js` (the fold defaults), the card stylesheets of those three for the summary row, fold checks in
`tests/save.js` / `tests/e1test.js`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: main.js. Model: Opus (adds saved keys; "save code" in the routing rule).

After: P2.

- [next] #? opus lanes:main.js
