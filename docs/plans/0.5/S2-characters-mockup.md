# 0.5 S2: Mockup: character switcher, class picker and player name

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane C). Read CLAUDE.md ("What the user wants"),
docs/design-system.md, docs/ARCHITECTURE.md §1 (save v5, `labelOf`), ROADMAP 0.4 review note 5 (where the name may
never appear), docs/design/phone-layout.md §3.2 (the phone header and level bar) and
`docs/design/mockups/phone-layout.html` first.

## Problem

Lane C adds a header control, a character list, a new-character form (name, class) and rename / remove. The header
is the first thing on every screen and P4 adds a level bar under it on phones, so the control is drawn before it is
built.

## Result

`docs/design/0.5-characters-mockup.md` and a static mockup `docs/design/mockups/0.5-characters.html` with frames at 390
and 1500 px: the header with the control (label `<name>-<class>-lvl<level>`, and without a name), the open list, the
new-character form with a one-class picker, rename, the remove confirmation, and the phone header with P4's level bar.
Screenshots in `docs/design/mockups/0.5-characters/`. Tokens only; placeholder text. The doc ends with the owner's
questions, each with a recommendation (e.g. where the control sits, whether the picker shows when only one class
exists, the confirmation wording).

## Appetite

S–M (docs and one static HTML file).

## No-gos

- No `src/`, `data/` or `tests/` change; no class that has no guide pack in the picker; no new art (class icons need the
  owner's OK, CLAUDE.md).
- The header's brand and the "unofficial" wording stay as they are.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Every UI element of P18 and P19 appears in at least one frame (list in the doc).
- [ ] Frames at 390 and 1500 px, with and without a name; the 390 px header frame includes P4's level bar.
- [ ] No raw colour outside the tokens in the mockup CSS (paste).
- [ ] The doc restates where the name may never appear (storage key, file name, URL, Report a problem link, log,
      page title) and the owner question list with recommendations.
- [ ] Only files under `docs/` changed.

## Files (owns)

`docs/design/0.5-characters-mockup.md`, `docs/design/mockups/0.5-characters.html`, `docs/design/mockups/0.5-characters/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: none. Model: Sonnet (docs and a static mockup). The owner's OK on it gates P18 and P19 (ROADMAP 0.5 "Owner
input" 3).

After: nothing.

- [next] #? sonnet lanes:none
