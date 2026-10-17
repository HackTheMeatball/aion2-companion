# 0.5 P16: Teleport or walk: the travel line, "I'll walk" and "Prefer running"

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, docs/design/0.4-smart-next-up.md §8.3,
§10 and §14 (Q3–Q6, Q11), DECISIONS 2026-10-14 ("Teleport rules", "Travel model"), the S1 mockup with the owner's
answers first. Needs P15.

## Problem

The owner wants Next up to say when teleporting to a bound Kibelisk saves real distance ("Zygor-like"), without
noise when walking is fine.

## Result

- `travelAdvice` on: a card with a target point gets one line, drawn as in S1, "Teleport to Safe Haven (1 scroll), then
  32 m", when the Kibelisk is bound and teleporting saves at least `rule:teleport-gain` (design §8.3; another zone when
  the walk is unknown). The line replaces the story card's Kibelisk hint when shown (Q11).
- "I'll walk" hides the line for that target for the session (Q4: nothing stored).
- "Prefer running", a view setting `preferRun` (per device, not synced, off by default), placed as S1 draws it: no
  travel line at all.
- Basic shows the line as Advanced does (Q3 recommendation); printed metres are always the data's `m`.

## Appetite

M (100–300 lines).

## No-gos

- No scroll count or Kinah figure, no inventory; no line for an unbound Kibelisk, across maps on a distance claim, or
  on an Ascension node.
- No change to ranking.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Invariant 13 green (never with `preferRun`, never unbound, never cross-map on distance, never Ascension; metres
      equal the data) (paste).
- [ ] "I'll walk" and "Prefer running" have spoken names; `preferRun` is stored only on a click; "I'll walk" stores
      nothing (save diffs; paste).
- [ ] Line, button and setting match S1 at 390 and 1500 px, Basic and Advanced (shots in
      `docs/reviews/0.5-p16-shots/`).
- [ ] P8 term scan green; `--explain` attributed; `golden`, `invariant`, `a11y`, `e1` green; `npm test` green.

## Files (owns)

`src/packs/aion2/nextup.js`, `src/packs/aion2/travel.js`, `src/packs/aion2/cards/nextup-kinds.js`, the pack's row
stylesheet from P15, `src/cards/nextup.js` (the setting's place, if S1 puts it in the card header),
`tests/golden/snapshots/nextup/`, `tests/invariant/**`, `docs/reviews/0.5-p16-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: golden. Model: Opus (ranking, a view setting, golden).

After: P15.

- [next] #? opus lanes:golden
