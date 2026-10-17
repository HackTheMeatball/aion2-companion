# 0.5 P13: Catch-up: everything your level and points allow, and Later by when it opens

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, docs/design/0.4-smart-next-up.md §7
and §12, docs/feedback/2026-10-14-owner.md (F1) first. Needs P12.

## Problem

A player whose level ran ahead of their ticks (joined mid-level, forgot to tick, levelled on filler) sees at most 2
missed steps and a short skill queue, in guide order, and Later cards in a fixed order.

## Result

- `catchUp` on: when `behind(c)` (design §7: at least 3 open missed steps, or at least 2 kinds with something
  affordable now), the spend queue covers everything current points afford and all missed steps show, missed steps
  ordered by `byPlace` then catalog order. Basic keeps its rule (first card of each queue). Thresholds are named
  constants pinned by core cases.
- `etaLater` on: Later cards come from not-yet-open nodes sorted by `eta.level`, then quest position; blocker text as
  today (0.3 E6).

## Appetite

M (100–300 lines).

## No-gos

- No new mode, card kind, setting or saved field; no change to what is open.
- The pack's producers are changed only where they cap a queue; no UI work (band labels are P14).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Core cases at and around both thresholds (trigger / no trigger) and Basic (paste test names).
- [ ] `--explain` table: changes only in `behind`-family and existing behind states, all attributed; `store`
      unchanged (paste).
- [ ] Invariants green; the 8-card cap and the kept cards still hold (paste).
- [ ] Before / after shots of two `behind` states in `docs/reviews/0.5-p13-shots/`.
- [ ] `golden` (re-recorded `--record --card nu`), `invariant`, `journey`, `gates` green; `npm test` green.

## Files (owns)

`src/core/nextup.js`, `src/packs/aion2/nextup.js`, `tests/core/nextup*.test.mjs`, `tests/golden/snapshots/nextup/`,
`docs/reviews/0.5-p13-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: golden. Model: Opus (ranking, golden).

After: P12.

- [next] #? opus lanes:golden
