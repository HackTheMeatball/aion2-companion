# 0.5 P18: Character switcher, class picker and the player name

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane C). Read CLAUDE.md, docs/ARCHITECTURE.md §1 and §2 ("Card
registry"), the S2 mockup (`docs/design/0.5-characters-mockup.md`) with the owner's answers, and P17's functions first.
Needs P17.

## Problem

A player with two characters can't keep both in the app, and the save label `<name>-<class>-lvl<level>` (owner,
2026-10-16) has no name part because there is no name field.

## Result

As the S2 mockup draws it: a header control shows the current character's label; it opens a list of the characters
(label each) with "New character". New character asks for a name (optional) and a class from the pack's `classes`
(the Assassin only), adds the slot (P17 `addChar`) and switches to it; picking another character switches (`switchChar`)
and every card redraws for it. The control is an engine card (`src/cards/characters.js`), mounted through the registry.

## Appetite

M–L (300–500 lines).

## No-gos

- No rename or remove (P19); no sync; no second game or class beyond the pack's `classes`.
- The name appears only on screen and inside the save: never in a storage key, file name (the export file name stays
  as it is), URL, the Report a problem link, a log or `document.title`.
- The header's brand, the "unofficial … not affiliated with or endorsed by NCSoft" footer and the Basic / Advanced
  switch are unchanged.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Add a second character, tick a quest on it, switch back: the first character's progress is unchanged and the
      second's tick is kept after a reload (a new `save` suite check; paste).
- [ ] Fresh browser: one character, the control shows `assassin-lvl1` (no name) (paste).
- [ ] With the name "Zed": the label shows `Zed-assassin-lvl<n>`; the Report a problem URL, the export file name,
      `document.title` and the storage key don't contain "Zed" (paste).
- [ ] Keyboard and screen reader: the control and its list have spoken names, Escape closes, focus returns (paste;
      `a11y` green).
- [ ] Matches S2 at 390 and 1500 px, Basic and Advanced, both builds (shots in `docs/reviews/0.5-p18-shots/`).
- [ ] Term scan green; golden identical; `e1`, `regress`, `journey` green; `npm test` green.

## Files (owns)

`src/cards/characters.js`, `src/cards/characters.html`, `src/styles/cards/characters.css` (new), `src/index.html`
(header include), `src/main.js` (register the card, reload the state on a switch), `tests/save.js` (switch checks),
`docs/reviews/0.5-p18-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: main.js. Model: Opus (save area of the shell, over 300 lines possible). Visible: S2 approved by the owner.

After: P17, owner-ok-S2.

- [next] #? opus lanes:main.js
