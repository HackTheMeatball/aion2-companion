# 0.5 P1: Basic rail height is the same on every load (#105)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/ARCHITECTURE.md §2 and issue #105
first.

## Problem

`fitRail()` (`src/main.js`, the block after `update()`) sizes the Basic rail to end where the milestone list ends. It
runs in a `requestAnimationFrame` after `update()`, on resize and on a milestone toggle, and nothing runs it again
once layout settles. At 1100 px in Basic two loads of the same build can give different rail sizes (#105: 1228 px
instead of 1173 px), a visible jump that also makes screenshot tests noisy. Lane B moves cards around next (P2), so
this is fixed first.

## Result

The cause is found and written in the PR (what `fitRail()` measured too early: fonts, the milestone list, the hero
rows, or something else; *[inferred]* web fonts arriving after the first frame is the likely one). `fitRail()` runs
again when that thing settles, so every load at the same width gives the same rail height. No other layout change.

## Appetite

S (under 100 lines).

## No-gos

- No change to what the rail holds, its order or its look; no change outside Basic's rail sizing.
- Don't touch the cards, `src/core/`, the save, `app.css` or the golden snapshots.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] The PR names the cause, with the measurement that shows it (paste).
- [ ] A new check loads the page at least 5 times at 1100 px, Basic, with web fonts allowed for that check, and
      finds the same rail height every time; it fails on `main` before the fix (paste both runs).
- [ ] At 1500 / 1100 / 390 px the rail height after load equals the height after a resize back and forth (paste).
- [ ] `regress`, `e1`, `a11y` green; `npm test` green.

## Files (owns)

`src/main.js` (the `fitRail()` block and the lines that schedule it), one check in `tests/regress.js`.

Ownership check: every acceptance line passes with these two files (checked at planning).

## Lanes, model, order

Lanes: main.js. Model: Sonnet (shell code, small; no core, save, gate, golden or generator code). First in lane B.

After: nothing.

- [next] #? sonnet lanes:main.js
