# Product Design

**Owns:** what users see and how it feels: the design system (card patterns, spacing, type, colour, icons), the brand,
UX of every visible change, accessibility and mobile quality.

**Standing checklist (every visible change)**
- Problem → sketch or mockup before build; reuse existing patterns: uniform milestone / Next up / Skills / Daevanion /
  Stigmas cards, consistent alignment, no redundancy across cards, minimal visual distraction.
- Basic mode = essentials only.
- Phone width (390 px) first-class: tap targets ≥ 44 px, no horizontal scroll, readable without zoom.
- Accessibility: contrast (WCAG AA), visible focus, keyboard reachable, labels for icon-only controls,
  `prefers-reduced-motion`.
- Original art only for branding; game art stays NC's and limited to existing in-app icons.
- Review the built result (screenshots at 1500 / 390 px, light and dark if relevant) before it goes to the owner.

**Brand:** the product is **Daeva Companion**, "Unofficial companion for AION 2" (leveling now; endgame and more later;
DECISIONS D1). Identity: direction C, **Compass Quill** (D1b): a brass and parchment compass whose needle is a red
feather, on deep teal. Sources in `brand/`, drawn by `tools/brand/build.py` (which also renders `public/favicon.svg` and
`public/icons/*.png`; `--sheet DIR` writes a contact sheet). Today only the brand uses C's colours (header lockup,
favicon, icons, manifest theme colour); the app keeps its plum palette until the owner decides on the full C theme.

## Standing notes
- The owner reads on a phone (iOS) a lot; check mobile first.
