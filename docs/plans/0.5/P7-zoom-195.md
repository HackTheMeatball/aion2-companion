# 0.5 P7: Card headers fit at 200 % page zoom (about 195 px)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/audits/2026-10-mobile-a11y.md
(P2-9) and docs/design/phone-layout.md §2.4 and patch C first. Needs P2 (the phone order changes which headers sit
where).

## Problem

Every release since 0.1.9 lists the known issue "At 200 % page zoom on a phone (about 195 px wide), some card headers
still run past the edge of the screen". `tests/a11y.js` §8 checks 260 px only; 195 and 640 px were never re-run.

## Result

At 195, 260 and 640 px the page doesn't scroll sideways and no card header runs past its card, fixed in the card
stylesheets that need it (wrapping, `min-width: 0`). `tests/a11y.js` §8 runs at 195 and 640 px as well as 260 px.

## Appetite

S (under 100 lines).

## No-gos

- No change at 390 px and up beyond what the fix needs (style snapshot at 390 and 1500 px compared to `main`); no
  markup or JS change.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] The extended §8 check fails on `main` at 195 px, naming the headers (paste), and passes after the fix (paste).
- [ ] Style snapshot at 1500 px equal to `main`; at 390 px any difference is listed and explained (paste).
- [ ] `a11y` green; `npm test` green. The release (R) drops the known issue from the CHANGELOG.

## Files (owns)

`tests/a11y.js` (§8), `src/styles/app.css` and the card stylesheets under `src/styles/` whose headers overflow.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: app.css, a11y. Model: Sonnet (CSS and one test; small).

After: P2.

- [next] #? sonnet lanes:app.css,a11y
