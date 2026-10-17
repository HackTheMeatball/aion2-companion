# Review screenshots and the owner's Scrapbook

Every PR that changes what a player sees (a card, a row, a label, a layout, a colour) keeps before / after screenshots
here, and says in `scrapbook.json` which of them the owner should see. When the PR merges, the tracker writer copies
those into the Scrapbook on the owner's tracker. Shots that stay only in this folder never reach the owner (found
2026-10-17: 0.3 and 0.5 shots were committed here but the Scrapbook stopped at 16 Oct).

A PR whose change is meant to look exactly the same (a refactor with identical golden snapshots) needs neither; say
"No visible change" in the PR body.

## The folder

`docs/reviews/<minor>-<item>-shots/`, e.g. `0.5-p18-shots/`:

- `cases.mjs`: the states to shoot (format at the top of `tests/support/shots.mjs`).
- `<case>-before.png` / `<case>-after.png`: written by `npm run build && node tests/support/shots.mjs <folder>`. A
  screen that didn't exist before is `afterOnly` and writes `<case>.png`.
- `scrapbook.json`: the owner's cards, checked by the `scrapbook` suite.

## scrapbook.json

An array of 1 to 6 cards, the ones that best show the change to someone who doesn't read code:

```json
[
  { "case": "1-story-end-journey", "kind": "before-after", "title": "The story's last quest",
    "caption": "At level 45 the Journey card now ends on Daeva Trapped in a Nightmare and fills Ascension 4 of 4." }
]
```

- `case`: the file name without `-before.png` / `-after.png` (`before-after`) or without `.png` (`screenshot`, `mockup`).
- `kind`: `before-after` (both files must exist), `screenshot` (a new screen) or `mockup` (a design, not built yet).
- `title`: up to 40 characters, plain words, no codes ("P18", "E10") or file names.
- `caption`: up to 160 characters, one or two plain sentences on what a player now sees, naming the level or quest shown.

The writer adds the version, date and status (Live once merged, since every merge to main deploys; Approved for a mockup).
