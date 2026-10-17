# 0.5 P12: Ascension first, and equal choices nearest first

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, docs/design/0.4-smart-next-up.md §1
(goal 5), §5 and §12, DECISIONS 2026-10-14 ("Ascension quests", "Location-aware Next up") first. Needs P11.

## Problem

Next up ignores where the player is: the regional quest, Sealed Dungeon and stronghold picks prefer the story step's
zone at best. A met Ascension step isn't always first, although the owner decided it ranks first (0.3 invariant 3 is
still pending).

## Result

- `ascensionFirst` on: a met, not-done Ascension step is the first step card in every state.
- `placeRank` on: inside a phase, the pack's picks and lists use `byPlace(whereNow(c))` (P10) as design §5's table
  says (`rqFirst` and the regional list, the Sealed Dungeon pick after its band, the stronghold pick, the "near" count);
  with no dated stamp, today's order. Phases never change order.
- Every changed golden state is attributed by `--explain`; the table is in the PR for the owner.

## Appetite

M (100–300 lines).

## No-gos

- Location never changes a phase or what is open (the evaluator's); no travel text, no new card, no UI (P14–P16).
- No other switch on.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Invariants 8 (location only reorders inside a phase) and 9 (Ascension first) enforced and green; 0.3 invariant 3
      flips from pending (paste).
- [ ] Invariant 7: with every stamp's time set to 0, the output equals the switches-off output except
      `ascensionFirst` (paste).
- [ ] `--explain` table in the PR: every changed state attributed, none unattributed; `store` unchanged (paste).
- [ ] Before / after shots of three `loc` states in `docs/reviews/0.5-p12-shots/`.
- [ ] `golden` (re-recorded `--record --card nu`), `invariant`, `equiv`, `gates`, `journey` green; `npm test` green.

## Files (owns)

`src/core/nextup.js`, `src/packs/aion2/nextup.js`, `tests/golden/snapshots/nextup/`, `tests/invariant/**`,
`docs/reviews/0.5-p12-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: golden. Model: Opus (ranking, golden). Visible (order only, no new UI): needs the owner's standing approval for
0.5's visible steps (ROADMAP 0.5 "Owner input" 1).

After: P11, owner-ok-visible.

- [next] #? opus lanes:golden
