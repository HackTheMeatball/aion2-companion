# 0.5 P4: Sticky level bar on phones

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/design/phone-layout.md §3.2 and
patch F, and the owner's answers to its §5 questions first. Needs P2.

## Problem

On a phone, Level up lives inside the Journey card; once the user scrolls, the most used action is out of reach.

## Result

At ≤ 860 px a sticky bar under the header holds `LV n` and **Level up** (44 px), nothing else. The shell **moves the
existing `#lvlUpBig`** (`src/cards/journey.html`) into the bar at phone widths and back above them: one element, one
handler, still disabled at 45 with its "Level cap (45)" title, same `.pop` / pulse feedback. Level − / + and the slider
stay in Journey. The bar's height is a CSS variable (P5's sheet scrim starts below it). Same in the site and the
claude.ai build (no `env(safe-area-inset-*)` dependence; safe area only as an addition).

## Appetite

M (100–300 lines).

## No-gos

- Never a second Level up button (hidden or not); no level change except through Level up / − / + / slider (CLAUDE.md).
- No track or progress inside the bar; no colour change (Level up keeps `.lvlup-btn`).
- No change above 860 px; no `src/core/` or save change.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] At 390 px, scrolled to the page bottom: exactly one element `#lvlUpBig` in the DOM, visible, ≥ 44 px, in the bar;
      clicking it raises the level by one (paste).
- [ ] At Lv 45 it is disabled with the title "Level cap (45)" in the bar and in Journey (paste).
- [ ] Crossing 860 px both ways puts it back in Journey with its handler working (paste).
- [ ] At 390 px in the artifact build (`dist-artifact`) the bar looks the same as in the site build (shots in
      `docs/reviews/0.5-p4-shots/`).
- [ ] At 1500 and 1100 px the style and DOM snapshots compare equal to `main` (paste).
- [ ] `a11y`, `regress`, `e1`, `journey` green; `npm test` green.

## Files (owns)

`src/index.html` (the bar's markup), `src/main.js` (the move), `src/cards/journey.js` (only if the Level up handler must
not assume its parent), `src/styles/app.css` (the bar), level expectations in `tests/e1test.js`,
`docs/reviews/0.5-p4-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: main.js, app.css. Model: Sonnet (shell, markup and CSS; no core, save or golden).

After: P2.

- [next] #? sonnet lanes:main.js,app.css
