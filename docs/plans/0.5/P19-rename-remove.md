# 0.5 P19: Rename and remove a character

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane C). Read CLAUDE.md, the S2 mockup with the owner's answers,
and P17 / P18 first. Needs P18.

## Problem

After P18 a character's name can be set only when it is created, and a character can't be removed.

## Result

As S2 draws it: in the character list, each character can be renamed (`renameChar`) and removed (`removeChar`) after a
confirmation that names it ("Remove Zed-assassin-lvl27? Its progress is deleted from this browser."). The last
character can't be removed (the action isn't offered). Removing the current one switches to another.

## Appetite

S–M (100–200 lines).

## No-gos

- No undo beyond the confirmation; no export change (an export still holds every character).
- The no-gos of P18 on where the name may appear.
- No sync change: the PR's note repeats P17's finding (a removed slot can come back from another device until 0.6 adds
  slot tombstones).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Rename, reload: the new label shows; nothing else in the save changed (save diff; paste).
- [ ] Remove a non-current and the current character: the right slot is gone, the rest byte-identical, a reload shows
      the expected current (paste).
- [ ] With one character, no remove action is offered (paste).
- [ ] Confirmation and rename field have spoken names; Escape cancels; `a11y` green (paste).
- [ ] Shots at 390 and 1500 px in `docs/reviews/0.5-p19-shots/`; golden identical; `npm test` green.

## Files (owns)

`src/cards/characters.js`, `src/cards/characters.html`, `src/styles/cards/characters.css`, `src/main.js` (only if the
removal of the current slot needs the shell's reload), `tests/save.js`, `docs/reviews/0.5-p19-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: main.js. Model: Opus (removes saved data).

After: P18.

- [next] #? opus lanes:main.js
