# Phone layout: audit, proposal, patch plan

Docs only (issue #81). No change to `src/`. Mockup: [`mockups/phone-layout.html`](mockups/phone-layout.html); screenshots in
[`mockups/phone/`](mockups/phone/). Builds on [`docs/audits/2026-10-mobile-a11y.md`](../audits/2026-10-mobile-a11y.md)
(P1-1, P1-2, P2-5) and ROADMAP 0.2.6.

Not covered: nothing here was checked on a real iPhone; the 195 / 260 px page-zoom widths were not re-run (see 2.4).
The mockup text is placeholder, not game data.

## 1. Method

- `npm run build` at v0.2.3 (commit `2960f77`), served from `dist/` with `scripts/serve.mjs`.
- Chromium via Playwright, 390×844, DPR 2, `isMobile` + `hasTouch` (so `pointer: coarse` matches).
- Save: `tests/fixtures/fixture-user-2026-10-14-lv39.json` (the owner's Lv 39 save) with `mode` set to `basic` or `advanced`.
- Shots: `mockups/phone/before-{basic,advanced}-full.png` plus one per card (`header.top`, Progress, Journey, Dungeons &
  Strongholds, The map (Advanced only), Skills, Daevanion, Stigmas, Next up, Confidence, Sources). Milestones and Route
  rules are not cards (`.sec`), so they only appear in the full-page shots. The Build drawer was not captured.
- Probe: every visible button, link, summary, input and select under 44 px (the `::before` hit-area extensions are not
  counted, so this overstates what a finger sees), inputs under 16 px, text under 11 px, elements past the right edge.
  The probe runs on a fresh page: a full-page screenshot on the same page changed the emulation and made the 16 px /
  11 px rules look unapplied.

## 2. Findings (390 px, Lv 39 fixture)

### 2.1 Card order (the biggest one)

| | Basic | Advanced |
|---|---|---|
| Page height | 3,300 px | 7,102 px |
| Next up starts at | 2,118 px (2.5 screens) | 3,738 px (4.4 screens) |

`aside.rail` holds Progress, Journey, Dungeons & Strongholds and The map (`src/index.html:46-116`). `#main` starts with
`.top-grid` (Skills, Daevanion, Stigmas; `src/index.html:118-170`), and only then comes Next up (`#nowStar`), then
Milestones and Route rules; Confidence and Sources close the page. The thing the user opens the site for is below
seven cards in Advanced and six in Basic (The map is hidden by `body.basic`, `app.css:996`). Same as P1-1, slightly better than in the 2026-10-13 audit (2,210 / 4,240 px). In Advanced the Journey card alone
is 963 px (the current story step with its objectives); it pushes everything else down.

### 2.2 Tap targets under 44 px

Counts are elements in the page, 390 px.

| Control | Size | Count (Basic / Advanced) | Note |
|---|---|---|---|
| Inline links (`a`) | 16 px tall | 202 / 182 | mostly Sources and prose; prose links are fine under WCAG 2.5.8 (inline exception), list-row links are not |
| Checkboxes | 20 px | 7 / 64 | Advanced: all objective, Milestone and Sealed Dungeon ticks; some inputs are 14 px (small ones in the objective sub-lists) |
| Daevanion / Shards −/+ (`numctl`) | 26×26 | 8 / 8 | |
| `.q-inl` ("In my game") | 22 px | 1 / 32 | 10.5 px mono text as well |
| `.tip` "i" | 17×17 | 4 / 19 | glyph in a fixed box |
| `a.amap` map pin | 26×26 | 5 / 5 | |
| Sync fields (`sync0`…) | 52×26 | 0 / 15 | |
| Level −/+ in Journey | visible buttons about 38 px | Advanced | |
| Stigma slot steppers (`.st-lvctl`, built at `src/main.js:1479`, Stigmas › Slots) | 14×18 | the 6 "Level down" buttons in the probe | the smallest targets on the page; their `aria-label`s are "Level down" / "Level up", the same names as the real level controls |
| Basic / Advanced switch | about 25 px tall | 1 | the most-used control on the page |
| Filter icon and × in Journey | about 20 px | | |

Already fine: Level up, the Next up action buttons and Mark spent (44 px under `pointer: coarse`).

Confidence and Sources (ROADMAP 0.2.6): the folded cards measure 63 and 53 px tall, so the summary row is not too short.
What is not verified is that the whole row is the hit area rather than only the heading text; check on a device before
writing a patch for it (the summary is a `<summary>` with an `<h2>` child, so the default is the whole row).

### 2.3 Page zoom (iPhone Safari zooms into a focused field under 16 px)

At 390 px with coarse pointer: no field is under 16 px, no overflow (`scrollWidth` 390), text under 11 px is only icon
glyphs (`.tip`, chevrons, `tipbtn`), which the 0.1.9 rule excludes on purpose. So the 0.1.9 fix holds in emulation.
Not testable here: real Safari behaviour (double-tap zoom, the focus zoom on the number inputs that are styled 18 px).
Double-tap on −/+ is covered by `touch-action: manipulation` on buttons.

### 2.4 "Remaining phone page-zoom issues" (0.2.6)

I could not reproduce these at 390 px. The audit's P2-9 cases (195 px: `.progress-row` clipping; 260 px: Daevanion −/+
overflow) need 195 / 260 / 640 px runs, which I did not do. Treat as open until someone re-runs them; step 5 below
is that re-run plus the `flex-wrap` fix.

### 2.5 Wrapping and layout (seen in the screenshots)

- Next up card (`before-basic-nowstar.png`): title wraps over two lines, the "i" button sits alone on its own line, then
  zone / level / count wrap to three lines; the action button ("Show") is small and right-aligned, 20 px below the text.
- Dungeons & Strongholds: the level-range select touches the "STRONGHOLDS" heading with no gap; locked rows are dimmed
  far enough to be hard to read (`before-basic-areas.png`).
- Basic / Advanced pill sits between the eyebrow and the page title; the title wraps to two lines.
- Journey (Advanced): Level −/+, slider and Level up are inside the card at the top of the page, so on a long scroll
  the level controls are out of reach. Objectives are a full-width stack of 6+ rows with 20 px checkboxes.
- Cards are uniform in padding (16 px, `app.css:63`) and corner radius (12 px); that part is already good.

## 3. Proposal

Tokens: the repo has no `docs/design-system.md` (HANDOFF and ROADMAP refer to it). The tokens are the `:root` block of
`src/styles/app.css`: `--bg --panel --panel-2 --line --fg --muted --accent --accent-soft --accent-text --accent-fill
--good --warn` and the three font stacks. The mockup uses those, plus the raw Level up greens from `.lvlup-btn`
(`app.css:501`) and `#fff` / `#000` / `#000a` for text on fills, the page backdrop and the scrim. No new brand colour.

**Both builds.** Every patch below applies to the site and to the claude.ai artifact build (`dist-artifact`) alike: no
web-only CSS and no web-only `<head>` dependency. The artifact runs in an iframe without `viewport-fit=cover`, so
`env(safe-area-inset-bottom)` resolves to 0 there; the tab bar and sheet must look right with that fallback (fixed
padding, safe-area as an addition only). F and H are checked at 390 px in the artifact build as well as the site build.
The header (brand row, eyebrow "· 1 → 45") and the footer with "unofficial … not affiliated with or endorsed by NCSoft"
(`tests/site.js`) are unchanged; the mockup omits them for space.

1. **Order: Next up first.** ≤ 860 px: header, sticky level bar, Next up, Journey (folded in Basic), Progress (folded in
   Basic), Skills / Daevanion / Stigmas, Milestones (unfolded, both modes), Dungeons & Strongholds, The map (Advanced),
   Route rules (Advanced; Basic hides it, `app.css:992`), Confidence, Sources. Next up lands at about 400 px instead of
   2,118. Milestones keeps its place after the gear cards, as in the app today. The Progress card (ring plus Quests /
   Dungeons / Strongholds rows, overall progress) is kept as is and moves to just after Journey; the bar does not
   replace it.
2. **Sticky level bar**: `LV 39` and **Level up** (44 px), nothing else. There is no track: the app stores only a whole
   level, no within-level progress, and the owner wants minimal visual distraction. Level up keeps its current green
   gradient (`.lvlup-btn`, `app.css:501`); no colour change. At phone widths patch F **moves the existing
   `#lvlUpBig` element** (`src/index.html:69`) into the bar: one element, one handler (`main.js:1624`), so it stays
   disabled at 45 with its "Level cap (45)" title (`main.js:807`) and keeps the `.pop` / `#lvlNum.pulse` feedback. It is
   never a second or hidden-duplicate button, so exactly one Level up is on screen at any time. Level −/+ and the
   slider stay in Journey in both modes (Basic hides only `#ahead`, `#questSubs`, `#trackWrap`, `app.css:988`); the
   intent from CLAUDE.md, that the level changes only through Level up / − / + / slider, is unchanged. While the Build
   sheet is open the scrim starts below the bar, so Level up stays visible and tappable (`after-build-sheet.png`). The sheet
   is therefore non-modal toward the bar: patch H keeps the bar outside any focus trap / `inert` region (focus order bar →
   sheet) and takes the scrim offset from the bar's height (a CSS variable, since 200 % text changes it), not a fixed 61 px.
3. **44 px targets** on touch: Basic/Advanced switch as two 44 px halves; −/+ steppers 44×44; `.q-inl` and "i" get a
   44 px hit area through the existing `::before { inset: -Npx }` pattern (visual size unchanged); list-row links and
   checkboxes get row-wide labels of at least 44 px; folded cards `min-height: 48px`.
4. **Next up on phones**: first card full width with the action(s) directly under the text (full-width, 44 px, primary =
   `--accent-fill`; no "Mark cleared" action, Next up has none today); later cards compact (number tile + title + one line); "1 of N" instead of the nested scroll stack
   (P1-2). In Basic `#nowStar .ns-head` stays hidden (`app.css:1000`), so "1 of N" shows in Advanced only unless the
   owner wants it in Basic (question below).
5. **Bottom tab bar** (Route · Gear · Build), 52 px, safe-area padding. Build opens as a bottom sheet with a scrim and
   grab handle (P2-5; `dvh`, not `vh`), replacing the 19 px side tab. Its text is 11 px under `pointer: coarse` (`app.css:1422`; 8.5 px only with a mouse at
   ≤ 600 px), so the case is the tab's size and reach, not the type size.
6. **Folded by default on phones**: Journey (Basic), Progress (Basic), Dungeons & Strongholds, Confidence, Sources, each a uniform
   48 px summary row ("Open ▾" in `--accent-text`).

Mockup frames (`mockups/phone/after-*.png`, from `phone-layout.html`; Level up is green as in the app): `after-top-basic`, `after-lower-basic`,
`after-build-sheet`. They are static HTML, not the product; labels and values are placeholders.
The frames are cropped to fit 844 px, and their spacing is not a proposal: cards use the app's values (16 px padding,
12 px radius, uniform gaps, `app.css:63`) in every frame.

## 4. Patch plan (0.2.6+)

CSS-only means `src/styles/app.css` (and at most static markup in `src/index.html`); it does not touch `src/main.js`,
`src/core/`, saves or `data/`. Those can ship in parallel with 0.3 work.

| # | Patch | Files | Serial? | Size | Visible |
|---|---|---|---|---|---|
| A | 44 px hit areas on −/+, "i", `.q-inl`, map pins, checkbox rows, stigma slot steppers (`.st-lvctl`); Basic/Advanced switch 44 px. The steppers also get distinct `aria-label`s (e.g. "Stigma level down: <name>") at `src/main.js:1479`, a one-line change | CSS + 1 line `main.js` | no | S | hit areas no; switch yes |
| B | Gap under the area select; locked-row contrast; folded-card `min-height` | CSS | no | S | yes (small) |
| C | Re-run page zoom at 195 / 640 px and fix what fails. `flex-wrap` on `.progress-row` (`app.css:71`) and `.ns-head` already exists, and `tests/a11y.js` §8 already asserts no sideways scroll at 260 px; only the 195 / 640 px cases are open | CSS (+ test) | no | S | yes |
| D | Route rules card home (F11, ROADMAP 0.2.6) | `src/index.html` markup + CSS | no, unless it needs JS to place it | S | yes, owner |
| E | Card order on phones: Next up first. Skills / Daevanion / Stigmas sit in `#main > .top-grid` and Next up comes after them, while the rail is a separate landmark. CSS `order` would need `display: contents` on `aside.rail`, `main#main` and `.top-grid` together, which flattens both landmarks (why the audit chose a JS move). So: a **`src/main.js`** move | **`src/main.js`** + CSS | **yes**, after 0.3 | M–L | yes, owner |
| F | Sticky level bar (`LV n` + Level up, no track); moves the existing `#lvlUpBig` into the bar at phone widths (one element, one handler); live level number | `src/index.html` + CSS + **`src/main.js`** | **yes** | M | yes, owner |
| G | Next up "1 of N" pager and compact later cards | **`src/main.js`** (`renderNow`) | **yes**, after 0.3 | L | yes, owner |
| H | Bottom tab bar and Build bottom sheet | **`src/main.js`** (drawer code) + CSS | **yes** | M | yes, owner |

Order: B, C, D ship as 0.2.6 (CSS-only), and A with them apart from its one-line `aria-label` change in `main.js`. E, F,
G, H touch `src/main.js` and the card code that 0.3 rewires, so they wait for 0.3 and then go one at a time in the
order E, F, G, H, each rebased on the previous one. Tests: A–E change 390 px layout expectations in `regress` / `e1`
and the 390 px touch probes and 260 px zoom check in `tests/a11y.js` (the audit noted this); the golden master is
unaffected. Run `mig1`, `mig2`, `journey` for patches that touch `main.js` (A's label change, E–H). F and H are also
checked at 390 px in the artifact build (see Both builds).

## 5. Open questions for the owner

- Basic mode: is a Next-up-only first screen what you want, with Journey folded, or should Journey stay open?
- Tab bar: Route · Gear · Build is a guess; Skills, Daevanion and Stigmas could be a single "Gear" tab or stay in the page flow.
- Basic mode is essentials only, and this plan adds permanent chrome (sticky bar plus 52 px tab bar). Acceptable? Also:
  folding Dungeons & Strongholds by default hides a core tick list; folding Journey in Basic also hides − / + / slider,
  which Basic shows today (the plan says they stay in Journey in both modes, so a folded Journey is the open point); should "1 of N" show in Basic?
- The `before-*` PNGs (about 3.6 MB; `before-advanced-full.png` is 1.3 MB) contain skill, stigma and Daevanion icons
  inside app screenshots. They are already-approved icons, not new art; OK to commit, or trim?
- Milestones stays after the gear cards, as today. In Advanced its full list pushes later cards far down; should it move
  earlier or fold on phones? Not part of this plan.
- Please check on the iPhone: whole-row tap on Confidence / Sources, and whether any field still zooms on focus.
