# Colour sprint: checklist and decision sheet

For a future colour and contrast sprint. Docs only; nothing here changes code. Owner: Product Design, with Data & Research.
Serial-only: `src/styles/app.css` is edited by one session at a time (HANDOFF.md). Background: `docs/research/colors-2026-10/`
(report, `tokens.json`, mocks) and the brand note in `docs/team/design.md`.

## 1. What exists today

- One theme only: dark, set by choice (`color-scheme: dark`, top of `src/styles/app.css`). There is **no light theme** and no
  `prefers-color-scheme` rule. Light-mode rows below apply only if the owner picks that option on the decision sheet.
- Tokens live in `:root` in `src/styles/app.css`: `--bg`, `--panel`, `--panel-2`, `--line`, `--fg`, `--muted`, `--accent`,
  `--accent-soft`, `--accent-text`, `--accent-fill`, `--good`, `--warn`. `src/styles/brand.css` adds `--brand` (brass); only
  the header lockup and footer use it.
- Not every colour is a token. `app.css` also holds raw hex values, for example `#e6b450` (44 uses), the greens `#1d6f42`,
  `#2a9a5c`, `#3fbf78`, `#4fd18b`, `#5fdc95`, and one each of `#f0954a`, `#6aa8ff`, `#f1d58a`. The sprint must find
  these and either tokenise them or measure them.
- Two contrast fixes are already noted in the token comments: `--accent-text` (5.0:1 on panels) and `--accent-fill` (5.1:1
  behind white text). Plain `--accent` is 4.4:1 / 4.2:1, so it must not carry small text.
- Focus: a shared rule gives `button`, `input`, `summary` and `a` a 2 px `--accent` outline with a 2 px offset. Several
  components repeat it (`.prow`, `.zone-btn`, `.trk-sum`, `.modeseg button`, `.q-cb`, `#stCard .st-pick`, `.xfer-btn`). Some
  use `:focus-within`, or `outline: none` with a replacement.

## 2. What to measure

Method: sample the built page, not the CSS. Use the real foreground over the real background (the body background is a
gradient). Record each ratio in the result table (section 5).

| Area | What to measure | Pass line |
|---|---|---|
| Text tokens | `--fg`, `--muted`, `--accent-text`, `--good`, `--warn`, `--brand` on `--bg`, `--panel`, `--panel-2` | 4.5:1 (normal text), 3:1 (large text: 18 px, or 14 px bold) |
| Small text | the 11 px mono labels (`.eyebrow`, `.card h2`, `.st-lv`) in `--muted` and `--accent-text` | 4.5:1 |
| Fills with text | `--accent-fill` behind white; primary buttons; the `#e6b450` and green fills with their dark text | 4.5:1 |
| Non-text UI | `--line` borders on inputs and checkboxes, the ring track, dots (`.dot`), `--accent` on `--panel` | 3:1 where the border is the only cue |
| Focus rings | `--accent` outline against the element, the panel and the page; every component that overrides the shared rule | 3:1 against adjacent colours; ring always visible |
| State colours | done (`--good`), overdue/warning (`--warn`), current (`--accent`), disabled / "done in the story", hover, pressed (`aria-pressed`), "Not in game yet" | each state is told apart from the next without colour alone (icon, text or shape too) |
| Colour-blind | done vs overdue vs current dots; green vs amber vs plum | simulate protanopia, deuteranopia, tritanopia; states must still differ |
| Links | in-text links vs surrounding text | 3:1 against body text, plus underline or another non-colour cue |
| Inverted hover | `.dvi`, `.tipbtn` (`--fg` on `--bg` swapped on hover) | 4.5:1 for the swapped pair |
| Brand | brass `--brand` on `--bg` | 4.5:1 for text; the logo mark needs 3:1 |
| Light and dark | repeat every row above in light **only if** a light theme is chosen; otherwise write "dark only" | same lines |

## 3. How to check

1. Build: `npm run build`, then `npm run serve` (the source page does not run on its own).
2. Automated: `node tests/run.mjs --only a11y` (after a build). `tests/a11y.js` runs axe-core at 390 and 1500 px, on fresh,
   Lv 27 and Lv 45 saves, in Basic and Advanced, with the Build drawer and mini panels open. Axe's `color-contrast` rule is
   part of that run. The suite also checks hit areas, touch sizes, page zoom and derived rows. It does **not** measure
   focus-ring contrast, state-colour differences or colour-blind behaviour, so those stay manual.
3. Screenshots at **390 px** and desktop, Basic and Advanced, Lv 27 and Lv 45. The existing suites use **1500 px** for
   desktop (`tests/regress.js`, `tests/a11y.js`); use 1500 to compare with their output, and add 1280 px if the owner wants
   a laptop width. Keep screenshots out of the repo unless the owner OKs them (private repo for owner material).
4. Focus pass: tab through the page at both widths; every stop needs a visible ring on every surface it can sit on.
5. Sample pixels from the screenshots for gradient areas, and note the sample point.
6. Run a colour-blind simulator over the same screenshots.
7. Compare before and after side by side. Run `npm test` before committing. If anything other than CSS changes (it should
   not), run `mig1`, `mig2` and `journey` too.

## 4. Decision sheet (owner fills in)

Pick one option per row. The recommendation is a starting point, not a decision.

| # | Question | Options | Recommended | Owner decision |
|---|---|---|---|---|
| 1 | Theme scope | A. Dark only. B. Add a light theme (system setting plus toggle). C. Light later; get the tokens ready now | **A**, then C. One theme is less to keep correct; tokenising first makes B cheap later | |
| 2 | Palette direction | A. Keep today's plum and rose. B. Game-inspired palette from `docs/research/colors-2026-10/`. C. Brand palette (brass, teal) across the app | **B** once it has a full contrast table (DECISIONS calls today's colours placeholders until this sprint); A only as a fallback | |
| 3 | Raw hex colours | A. Move all to tokens. B. Tokenise only repeated ones (`#e6b450`, the greens). C. Leave as is | **B** first, then A | |
| 4 | `--muted` text | A. Keep. B. Lighten until small text passes 4.5:1 everywhere | **B** if any measured pair fails; otherwise A | |
| 5 | Focus ring | A. Keep 2 px `--accent`. B. Add an inner `--fg` ring for two-tone contrast. C. 3 px | **A** if every surface measures 3:1; otherwise B | |
| 6 | State colours | A. Colour only. B. Colour plus icon or text for done, overdue, current | **B** for any state shown by colour alone | |
| 7 | Brand colour in the app | A. Header and footer only (today). B. Also link hover and small accents | **A** | |
| 8 | Contrast target | A. WCAG AA. B. AA, plus AAA for body text | **A**; B for body text only if it costs nothing | |
| 9 | When to apply the class colours | WoW mapping already approved (DECISIONS, "Class colours"). A. With the second class. B. Now, for the class badge only | **A** | |
| 10 | Sprint order | A. Tokens, then measure, then change values. B. Change values as you go | **A** | |

These rows add to the owner's open approvals in `docs/research/colors-2026-10/report.md` §10, item 8 (HANDOFF lists them as the sprint's first step): (a) gold primary buttons, (b) Asmodian violet accent, (c) parchment for The map only or other lore cards, (d) grey for done / Cleared, (e) Chanter orange, (f) a `grade` field on rewards. Answer those there; this sheet does not repeat them.

Owner notes:

## 5. Result table (fill during the sprint)

| Pair | Where used | Before | After | Pass (Y/N) | Note |
|---|---|---|---|---|---|
| `--muted` on `--panel` | small labels | | | | |
| `--accent-text` on `--panel` | eyebrow, step links | 5.0:1 | | | |
| `--accent-fill` with white | primary buttons | 5.1:1 | | | |
| `--warn` on `--panel` | overdue text | | | | |
| `--good` on `--panel` | done text, dots | | | | |
| focus ring on `--panel-2` | inputs | | | | |

## 6. Done when

- Every row in section 2 has a number or "dark only", and every failing pair has a fix or an owner-accepted exception.
- `npm test` is green, including `a11y`.
- Screenshots at 390 px and desktop are reviewed for both modes and both builds (site and artifact look the same).
- `docs/team/design.md` is updated, and `docs/DECISIONS.md` too if the palette changed.
