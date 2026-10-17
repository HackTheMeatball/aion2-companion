# 0.5 P15: Kibelisks bound from your progress, and the one-time "Bind X" row

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, docs/design/0.4-smart-next-up.md §8.1,
§8.2, §8.4 and §10, DECISIONS 2026-10-15 ("Kibelisk binding (0.4)"), the S1 mockup with the owner's answers first.
Needs P3, P9 and P12.

## Problem

Travel advice needs to know which Kibelisks the player has bound, and the player needs a nudge when the story passes
near one the rules can't count as bound.

## Result

- `bindDerived` on: the pack derives bound Kibelisks from the save (P10 `bound`), never stores them.
- `bindNudge` on: the story card gets one row, drawn as in S1, when its target point has
  `bind-radius < m ≤ nudge-radius`, the Kibelisk isn't bound, and it is the first such point in story order ("Bind
  Safe Haven on the way · 32 m from VeKauf", a tick box). Ticking writes `checks["bind:<kib id>"]` (timed, merged like
  any check), binds it and moves `whereNow`.
- The radii are read from `rule:*` records; no literal 25 or 150 in code.

## Appetite

M (100–300 lines).

## No-gos

- Story targets only (design Q2); no teleport line (P16); no stored bound list; no Kibelisk position displayed.
- `bind:` keys are written only on a tick, never derived into the save; no other save change.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Invariant 12 green (shown only in band, never for a bound Kibelisk, at most once per Kibelisk); the `bind`
      family's Galorik's state recorded as design §8.4 describes (paste).
- [ ] Save diff: ticking the row adds exactly `checks["bind:<kib id>"]` and its stamp; nothing else (paste).
- [ ] The row in Basic and Advanced at 390 and 1500 px matches S1 (shots in `docs/reviews/0.5-p15-shots/`); its tick
      box has a spoken name (paste).
- [ ] P8 term scan green (the row's kind and text live in the pack); `--explain` attributed; `golden`, `invariant`,
      `a11y`, `save` green; `npm test` green.

## Files (owns)

`src/packs/aion2/nextup.js`, `src/packs/aion2/travel.js`, `src/packs/aion2/cards/nextup-kinds.js`,
`src/styles/packs/aion2/` (one stylesheet for the row), `tests/golden/snapshots/nextup/`, `tests/invariant/**`,
`docs/reviews/0.5-p15-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: golden. Model: Opus (ranking, a new save key, golden).

After: P3, P9, P12, owner-ok-S1.

- [next] #? opus lanes:golden
