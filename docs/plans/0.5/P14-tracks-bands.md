# 0.5 P14: Fastest and completionist tracks, and level band labels

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, docs/design/0.4-smart-next-up.md §6,
the S1 mockup (`docs/design/0.5-nextup-mockup.md`) with the owner's answers, and DECISIONS 2026-10-14 ("0.3 default
mode") first. Needs P3 and P13.

## Problem

The owner wants a "fastest" track (default) and a "completionist" one, with level bands shown (F10). Today's labels
make them almost identical: every regional quest, Sealed Dungeon and stronghold is `core`, 0 records are `filler`, 0
milestones have `drawbacks`.

## Result

- `trackFilter` on: "fastest" drops cards whose candidates are all non-`core`, except while the story is level-gated;
  "completionist" ranks every route as `core` and offers `completionist` steps after the story (design §6). With
  today's labels, fastest equals today's output.
- `bandLabels` on: when Next up holds cards from more than one milestone band, one small band label per group
  ("Lv 20–24"), as the S1 mockup draws it.
- The track toggle (view setting `track`, per device, not synced) and the drawbacks line, drawn as in S1, and shown as
  the owner decided on S1's question (recommended: hidden while no milestone has an approved non-core label).

## Appetite

M (100–300 lines).

## No-gos

- No route label changes in this item (data proposals and the owner's approval per milestone come separately).
- No catch-up, binding or travel change; no change to the save's character fields.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Invariant 10 (tracks nest) green; with today's labels fastest = switches-off output (paste).
- [ ] Band labels: shown only with more than one band, matching S1 at 390 and 1500 px (shots in
      `docs/reviews/0.5-p14-shots/`).
- [ ] The toggle follows the owner's S1 answer; when shown it has a spoken name and stores `track` only on a click
      (save diff; paste).
- [ ] `--explain` table attributed; `store` unchanged; `golden` (re-recorded `--record --card nu`), `a11y`, `e1`
      green; `npm test` green.

## Files (owns)

`src/core/nextup.js`, `src/cards/nextup.js`, `src/styles/cards/nextup.css`, `tests/golden/snapshots/nextup/`,
`tests/invariant/**`, `docs/reviews/0.5-p14-shots/`.

Ownership check: every acceptance line passes with these files (the card writes `track` itself, as cards already call
`save()`; no `src/main.js` change).

## Lanes, model, order

Lanes: golden. Model: Opus (ranking, golden). Next up card after lane B's P3 (B first).

After: P3, P13, owner-ok-S1.

- [next] #? opus lanes:golden
