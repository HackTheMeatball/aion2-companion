# 0.5 S1: Mockup: the smart Next up rows on the phone and desktop card

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lanes A and B). Read CLAUDE.md ("What the user wants"),
docs/design-system.md, docs/design/phone-layout.md §3.4 (the phone Next up card, P3), docs/design/0.4-smart-next-up.md
§6–§8 and §14, and `docs/design/mockups/phone-layout.html` (the pattern to follow) first.

## Problem

Lane A adds four things to the Next up card (level band labels, the track toggle with its drawbacks line, the "Bind
X" row, the teleport line with "I'll walk" and "Prefer running"), and the catch-up view lists more cards. ROADMAP
"How an objective is worked" step 3: the user's view is sketched and reviewed before building. The card's phone layout
changes in P3, so the rows are drawn on that layout.

## Result

`docs/design/0.5-nextup-mockup.md` and a static mockup `docs/design/mockups/0.5-nextup.html` with frames at 390 and
1500 px, Basic and Advanced: P3's phone card; band labels on a mixed-band list; the toggle shown and hidden; a Bind row
on the story card; a teleport line with "I'll walk"; where "Prefer running" lives; a catch-up state. Screenshots in
`docs/design/mockups/0.5-nextup/`. Uses the design tokens only; text marked as placeholder, not game data. The doc ends
with the owner's questions, each with a recommendation (design §14 Q1, Q3, Q4, Q5, Q7, Q11, and anything the drawing
raises).

## Appetite

M (docs and one static HTML file).

## No-gos

- No `src/`, `data/` or `tests/` change; no new colour, font or game art.
- No redundancy across cards (CLAUDE.md): the rows don't repeat what Journey or the milestone cards say.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Every lane A UI element of P14, P15 and P16 appears in at least one frame (list in the doc, frame per element).
- [ ] Frames at 390 and 1500 px, Basic and Advanced; the 390 px frames use P3's phone card as specified in
      phone-layout §3.4 (paste the frame list).
- [ ] No raw colour outside the tokens in the mockup CSS, checked with the `tokens` suite's rule (`tests/tokens.mjs`)
      applied to the mockup file (paste).
- [ ] The owner question list with one recommendation each; Q7's deviation from DECISIONS 2026-10-14 is stated.
- [ ] Only files under `docs/` changed.

## Files (owns)

`docs/design/0.5-nextup-mockup.md`, `docs/design/mockups/0.5-nextup.html`, `docs/design/mockups/0.5-nextup/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: none. Model: Sonnet (docs and a static mockup). The owner's OK on it gates P14–P16 (ROADMAP 0.5 "Owner input" 2).

After: nothing.

- [next] #? sonnet lanes:none
