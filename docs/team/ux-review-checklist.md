# UX review checklist

Run this on any visible change before it goes to the owner. Source: CLAUDE.md "What the user wants", `docs/team/design.md`
and `tests/a11y.js`. Answer each line yes, no or n/a. Any "no" needs a fix or a written reason.

## Setup
- [ ] Build first: `npm run build`, then `npm run serve`. The source page does not run on its own.
- [ ] Review the built result, not the diff. Use a fresh save, a Lv 27 save and a Lv 45 save.
- [ ] Look at it in **Basic** and **Advanced**, at **1500 px** (what the suites use) and **390 px**.

## Look and feel
- [ ] **Minimal distraction.** Nothing new draws the eye that does not need to. No extra colours, borders, badges or motion.
- [ ] **No redundancy across cards.** The same fact is not shown in two cards. If it is, one of them goes.
- [ ] **Alignment.** Edges, baselines, icons and numbers line up with their neighbours, at both widths.
- [ ] **Uniform card layouts.** Skills, Daevanion and Stigmas cards share one layout. Next up cards look like milestone cards.
- [ ] **Existing patterns reused.** Spacing, type, tokens and components come from `app.css`; no one-off styles.
- [ ] **Text.** Plain, short sentences. Calls the guide "unofficial". No hint of endorsement by NC or a source site.

## Behaviour
- [ ] **Manual progress.** Nothing ticks or levels up by itself. Level changes only through Level up, −, + or the slider.
- [ ] **Basic mode = essentials only.** Anything not essential is hidden in Basic, and Basic still reads complete.
- [ ] **Saved progress is safe.** Same `localStorage` key, no new or renamed item keys, nothing that reads old saves differently.
  If a change could touch saves, `mig1`, `mig2` and `journey` ran.
- [ ] **Correct to Lv 45.** The change holds at Lv 1, 27 and 45 without the user reporting a problem. Empty and full states look right.
- [ ] **Both builds identical.** Site and artifact look the same; the artifact is still one file with `/_blob/` icons and no service worker.

## Accessibility
- [ ] **Keyboard.** Every new control is reachable by Tab, in a sensible order, and works with Enter or Space. Popovers close with Escape and return focus.
- [ ] **Focus.** A visible ring on every stop, on every surface it sits on.
- [ ] **Names.** Icon-only controls have an accessible name; no button named "What is ?".
- [ ] **Contrast.** Text 4.5:1; large text and UI borders 3:1. Small text does not use plain `--accent` (use `--accent-text`).
- [ ] **Colour is not the only cue.** Done, overdue and current also differ by icon, text or shape.
- [ ] **Motion.** New animation stops under `prefers-reduced-motion`.
- [ ] **Automated.** `node tests/run.mjs --only a11y` is green (after a build). Do not add rules to the allow list to pass.

## Phone check (390 px)
- [ ] No sideways scroll, also at 260 px wide (150 % zoom).
- [ ] Tap targets are at least 24 px, and primary buttons at least 44 px tall.
- [ ] Text fields are 16 px or larger (iPhone Safari zooms below that). No text under 11 px (mono) or 12 px (body).
- [ ] Nothing is covered by the Build tab or the drawer.
- [ ] Nothing depends on hover. Hover-only hints also show on touch.
- [ ] Readable without zooming; long names wrap instead of cutting off.

## Before it ships
- [ ] `npm test` is green; no check was weakened to pass.
- [ ] Screenshots (1500 and 390, Basic and Advanced) are attached to the review, or kept private if they hold owner material.
- [ ] No new game art without the owner's OK; new icons have their source recorded in `docs/ISSUES.md`.
- [ ] Reviewer notes say what was checked, what was skipped and why.
