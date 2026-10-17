# 0.5 P5: Bottom tab bar and the Build sheet on phones

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/ARCHITECTURE.md §2 ("Card
registry"), docs/design/phone-layout.md §3.2, §3.5 and patch H, the audit P2-5, and the owner's answers to the
phone mockup's §5 questions first. Needs P4.

## Problem

On a phone the Build drawer (the AION 2 pack's `build` card, `src/packs/aion2/cards/build.js`, slot `drawer`) opens from
a narrow tab pinned to the right edge, and there is no quick way to jump between the route and the gear cards.

## Result

At ≤ 600 px: a bottom tab bar, 52 px plus safe-area padding, with the tabs the owner approved (recommended: Route ·
Gear · Build). Route and Gear scroll to Next up and to the top row; Build opens the drawer as a bottom sheet (scrim,
grab handle, `dvh` height) instead of the side tab. The scrim starts below P4's level bar, so Level up stays tappable
and outside any focus trap (focus order: bar, then sheet). Escape and the scrim close the sheet and focus returns to
the Build tab. Above 600 px the drawer and its tab are unchanged. Same in both builds.

## Appetite

M (100–300 lines).

## No-gos

- No change to the Build drawer's content; no new setting; no change above 600 px.
- The tab bar is shell chrome: it names no game term (P8 term scan); the "Build" label comes from the pack's card.
- No `src/core/` or save change (the drawer's remembered open state keeps its existing key).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] At 390 px: the tab bar is visible at every scroll position; each tab ≥ 44 px; Route and Gear land on their cards
      (paste).
- [ ] Build opens the sheet; Escape, the scrim and the handle close it; focus moves into the sheet and back to the
      tab; Level up in the bar works while the sheet is open (paste; a new check in `tests/a11y.js`).
- [ ] The side tab is not shown at 390 px and is unchanged at 1100 / 1500 px (style and DOM snapshots equal to
      `main` there; paste).
- [ ] At 390 px in the artifact build the bar and sheet look as in the site build (shots in `docs/reviews/0.5-p5-shots/`).
- [ ] P8 term scan green; `a11y`, `e1` (drawer), `regress` green; `npm test` green.

## Files (owns)

`src/packs/aion2/cards/build.js`, `src/packs/aion2/cards/build.html`, `src/styles/packs/aion2/build.css`, `src/main.js`
(the tab bar's mount), `src/index.html` (its markup), `src/styles/app.css` (the bar), `tests/a11y.js` (one check),
drawer expectations in `tests/e1test.js`, `docs/reviews/0.5-p5-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: main.js, app.css, a11y. Model: Sonnet (shell, pack card render and CSS; no core, save or golden).

After: P4.

- [next] #? sonnet lanes:main.js,app.css,a11y
