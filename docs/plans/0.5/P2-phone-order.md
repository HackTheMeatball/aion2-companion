# 0.5 P2: Next up first on phones

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/ARCHITECTURE.md §2 ("Card
registry"), docs/design/phone-layout.md §2.1, §3.1, §4 patch E and the owner's answers to its §5 questions (recorded in
DECISIONS when given) first.

## Problem

At 390 px the card the user opens the site for starts 2.5 screens down in Basic and 4.4 in Advanced (phone-layout
§2.1: 2,118 / 3,738 px on the Lv 39 fixture). The rail (Progress, Journey, Dungeons & Strongholds, The map) and the
top row (Skills, Daevanion, Stigmas) come first. CSS `order` can't fix it without flattening both landmarks
(`aside.rail`, `main#main`), so it needs a move in the shell.

## Result

At ≤ 860 px the page order is phone-layout §3.1 as the owner approved it (recommended: header, Next up, Journey,
Progress, Skills / Daevanion / Stigmas, Milestones, Dungeons & Strongholds, The map, Route rules, Confidence, Sources).
The shell moves the card elements when the width crosses 860 px (one element each, never a copy), both landmarks stay,
focus order follows the visual order. Above 860 px nothing changes.

## Appetite

M (100–300 lines).

## No-gos

- No sticky bar, tab bar, folding or Next up card change (P4, P5, P6, P3).
- No card's content, text or style changes; no change above 860 px; no `src/core/` or save change.
- The card update order in `update()` stays as it is (the 0.4 P4c comment there still holds: the milestone filters run
  before the Skills card, Next up after the milestone text).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] At 390 px, fresh and the Lv 27 fixture, Basic and Advanced: Next up's top is under 500 px from the page top
      (paste the four numbers; before: about 2,100 / 3,700 px).
- [ ] At 1500 and 1100 px: `tests/support/style-snapshot.mjs` and `dom-snapshot.mjs` compare equal to `main` (paste).
- [ ] Crossing 860 px both ways (resize) gives the same DOM as a fresh load at that width (paste the check).
- [ ] `a11y` green (both landmarks present, axe clean at 390 px); keyboard focus reaches Next up before Journey at
      390 px (paste).
- [ ] Before / after shots at 390 px, Basic and Advanced, in `docs/reviews/0.5-p2-shots/` for the owner.
- [ ] Golden identical; `regress`, `e1`, `journey` green; `npm test` green.

## Files (owns)

`src/main.js` (the card placement), `src/styles/app.css` (the ≤ 860 px block), the 390 px order expectations in
`tests/regress.js` / `tests/e1test.js`, `docs/reviews/0.5-p2-shots/`.

Ownership check: every acceptance line passes with these files; the style and DOM snapshot tools are run, not changed.

## Lanes, model, order

Lanes: main.js, app.css. Model: Sonnet (shell and CSS, under 300 lines; no core, save or golden). Visible: waits for
the owner's answers on the phone mockup (ROADMAP 0.5 "Owner input" 1).

After: P1, owner-ok-phone.

- [next] #? sonnet lanes:main.js,app.css
