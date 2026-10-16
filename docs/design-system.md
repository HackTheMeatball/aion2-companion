# Design system: tokens

Every colour, radius, spacing step and shadow in `src/styles/*.css` is a CSS custom property, defined once in the `:root`
block at the top of `src/styles/app.css` (the brand colour `--brand` stays in `src/styles/brand.css`, which keeps the
brand apart from the app). Rules use the tokens only: `tests/tokens.mjs` (suite `tokens`) fails on a raw colour outside
the `:root` token definitions, on a raw length in a radius, margin, padding or gap, on a raw shadow, and on a `var()`
that names no token.

The tokens were introduced with **zero changed pixels** (issue #96): each one holds the exact value it replaced. That is
why the radius and spacing scales are named by size and still contain one-off steps (7 px, 9 px, 25 px, 62 px...).
Consolidating them, and changing any colour, is a visible change: it belongs to the colour sprint
(`docs/team/colour-sprint.md`) and the 0.2.6 / phone layout work, with screenshots and the owner's OK.

## Theme

One theme, dark, by choice (`color-scheme: dark` in `:root`, `<meta name="color-scheme" content="dark">`). There is no
light theme and no `prefers-color-scheme` rule, so there is one token set. A light theme, if the owner picks one
(colour-sprint decision sheet, row 1), becomes a second set of the colour tokens only, in one
`@media (prefers-color-scheme: light)` / theme-class block; radius, spacing and shadows stay shared.

## Colour

The plum surfaces and the rose accent are **placeholders** until the colour sprint (DECISIONS calls today's colours
placeholders; the game-inspired candidate palette is `docs/research/colors-2026-10/tokens.json`). Contrast notes are the
measured ones from the token comments; the sprint's result table (colour-sprint §5) is the place for new numbers.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#110c13` | page background |
| `--bg-glow-1`, `--bg-glow-2` | `#3a1730`, `#221a3d` | the two radial glows on the page background (top right, bottom left) |
| `--panel` | `#1a1320` | cards |
| `--panel-2` | `#22192a` | raised surfaces inside cards: inputs, chips, hover rows |
| `--panel-glow` | `#2a2235` | centre of the round glow behind a Daevanion icon |
| `--line` | `#33263c` | borders, dividers, empty bars, timeline connectors |
| `--fg` | `#ece4ee` | body text |
| `--muted` | `#9f90a8` | secondary text, labels, checkbox borders |
| `--muted-strike` | `#9f90a888` | the line through a ticked step |
| `--muted-66` | `#9f90a866` | border of the Active / Passive tag (`.sptype`) |
| `--accent` | `#d0506f` | "act now": current step border, focus ring, current dot. 4.4:1 on panels, so never small text |
| `--accent-soft` | `#d0506f26` | accent wash: pressed buttons, halo around the current dot |
| `--accent-text` | `#da5d7b` | accent as text on panels (5.0:1) |
| `--accent-fill` | `#bf3f5e` | accent behind white text (5.1:1) |
| `--on-fill` | `#fff` | text and ticks on a filled colour |
| `--good` | `#5fbf8a` | done / cleared / can buy |
| `--good-soft` | `#5fbf8a22` | the done step's number box |
| `--warn` | `#e2a64a` | overdue, short of points, warnings |
| `--warn-ink` | `#1a1206` | text on a `--warn` fill ("behind" pill) |
| `--prog` | `color-mix(in srgb, var(--fg) 45%, var(--line))` | progress bars (neutral; `--good` when complete) |
| `--gold`, `--gold-light` | `#e6b450`, `#f1d58a` | unlocks, specialties, boards in "Then", running dungeons and quests |
| `--gold-18` … `--gold-99` | `#e6b450` + alpha byte | gold washes and borders (suffix = the hex alpha byte) |
| `--go-hi`, `--go-lo` | `#3fbf78`, `#2a9a5c` | the green action button's gradient (Level up, Mark spent / equipped, Next up actions) |
| `--go-line`, `--go-edge`, `--go-ink` | `#5fdc95`, `#1d6f42`, `#06150d` | its border, the 2 px lip under it, its text |
| `--go-glow-00`, `--go-glow-66`, `--go-glow-aa` | `#3fbf78` + alpha byte | its hover glow and the Level up pop |
| `--dv-active`, `--dv-passive`, `--dv-corner` | `#6aa8ff`, `#4fd18b`, `#f0954a` | Daevanion node types (`DV_TYPE` in `src/data/build.js`) |
| `--shade-88` … `--shade-bb` | `#000` + alpha byte | shadow colours (only used inside the shadow tokens) |
| `--mask`, `--mask-25` | `#000`, `rgba(0,0,0,.25)` | `mask-image` gradients (scroll fades); only the alpha matters |
| `--brand` | `#cfa650` | brass, Daeva Companion lockup and footer name only (`brand.css`) |

### Class colours (approved, not in the CSS yet)

DECISIONS ("Class colours") approved the WoW mapping: Gladiator = Warrior, Templar = Paladin, Assassin = Rogue,
Ranger = Hunter, Sorcerer = Mage, Spiritmaster = Warlock, Cleric = Priest, Chanter = Druid. The values (WoW hex, the
app-adjusted hex, contrast and colour-blind checks) are in `docs/research/colors-2026-10/classes.json`. They become
`--class-<name>` tokens here when the second class ships (colour-sprint decision row 9); until something uses them
they are not defined, so the CSS carries no dead tokens.

### Not covered by the tokens

- `src/main.js` sets one colour inline: the Level up sparks (`"var(--good)"` or `"#e6c76a"`). It is script, not CSS, so
  this change (CSS only) leaves it; move it to a token when `main.js` is next touched there.
- The manifest / `theme-color` and the SVG art (favicon, icons, brand lockup) carry their own colours.
- `transparent` and `currentColor` are keywords, not colours, and are allowed everywhere.

## Radius

`--radius-2`, `-3`, `-4`, `-5`, `-6`, `-7`, `-8`, `-9`, `-10`, `-12` (px, by size), `--radius-bar` (`99px`: progress
tracks and small count badges), `--radius-pill` (`999px`: chips and pills), `--radius-round` (`50%`: dots, "i" buttons).
`0` stays a plain `0`. The common steps: 4 (tags, small icons), 6 (chips, inputs), 8 (buttons, rows), 10 (icon squares,
callouts), 12 (cards). `--radius-bar` and `--radius-pill` render the same on everything the app has; merging them, and
7 → 8 / 9 → 10, is for the sprint.

## Spacing

Margin, padding and gap: `--space-1` … `--space-84`, one token per size in use (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
16, 18, 20, 24, 25, 28, 44, 62, 64, 84 px). A negative step is `calc(-1 * var(--space-N))`. `0` and `auto` stay plain.
The large ones are alignment offsets, not rhythm: 44 / 62 / 84 px line a tip box or objectives list up with the text
beside a 22 / 40 / 52 px icon column. Widths, heights, insets and font sizes are not spacing and are not tokenised.

## Shadows

A whole shadow list is one token (shadows are rarely composed):

| Token | Use |
|---|---|
| `--ring-accent`, `--ring-accent-soft` | 1 px accent ring: current Next up card / active top card |
| `--ring-current` | 4 px halo around the current story dot and the next milestone dot |
| `--ring-panel` | 2 px panel-coloured ring that cuts a badge out of what is under it |
| `--ring-gold` | Daevanion cost box waiting for a cost |
| `--ring-inset-line` | pressed Basic / Advanced segment |
| `--shadow-step-current` | the current milestone card (ring + soft accent glow below) |
| `--shadow-pulse-from`, `--shadow-pulse-to` | `nsPulse` keyframes (Basic Next up card, new Rotation skill) |
| `--shadow-board-glow-from`, `--shadow-board-glow-to` | `boardGlow` keyframes |
| `--shadow-go`, `--shadow-go-rest`, `--shadow-go-hover`, `--shadow-go-pressed`, `--shadow-go-pop-from`, `--shadow-go-pop-to` | the green action button: lip, Level up at rest / hover / pressed, `lvlpop` keyframes |
| `--shadow-float` | the "+1 level" float |
| `--shadow-art` | skill art in the hero |
| `--shadow-badge` | the small skill badge on a Daevanion node |
| `--shadow-tip`, `--shadow-popover`, `--shadow-menu`, `--shadow-toast`, `--shadow-drawer` | "i" tooltip, need-more popover, filter menu, toast, Build drawer |
| `--drop-icon`, `--drop-art` | `filter: drop-shadow()` on item icons and Daevanion art |

## Adding or changing a token

1. Use an existing token if one fits; otherwise add the token to the `:root` block in `src/styles/app.css` with a comment
   and add it to the table above. Never write a colour, radius, spacing length or shadow in a rule.
2. `node tests/tokens.mjs` (also part of `npm test`).
3. A change that should not move pixels (renaming, regrouping): run the pixel check against a build of `main`,
   `node tests/support/tokens-shots.mjs` (setup in its header). A change that does move pixels: before / after screenshots
   at 390 and 1500 px, Basic and Advanced, in the PR, and the owner's OK (DECISIONS D6: anything visible).
