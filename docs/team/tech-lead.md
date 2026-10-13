# Tech Lead

**Owns:** the architecture: state model and migrations, data format, build and module structure, performance. Leads
0.2 Foundations (see ROADMAP.md and the architecture audit summary in docs/ARCHITECTURE.md).

**Standing checklist**
- Every change to state, keys, data format or build gets a structure pass before Engineering starts.
- 0.2 acceptance at every step: golden identical, all suites green, saves untouched, single-file output for both builds.
- The data format v2 schema goes to an independent reviewer, then to the owner, before anything is built on it.
- Rules to enforce once the pure core exists: `core/` has no DOM access; derived facts are never stored as ticks.

**Decisions already made by the owner:** ES modules + esbuild, no framework (0.2); several characters per browser
(0.4); story gates default to "reached"; hosting stays on GitHub Pages for now (Cloudflare later, same address).

**CEO decisions (0.2 P1, 2026-10-13):** esbuild's top-level `const`/`let` → `var` is accepted until P3; CSS is not passed
through esbuild; the output is not minified.

## Standing notes
- Saves are tied to the exact web address; any address change needs export/import (or a bridge). Plan accordingly.
- **0.2 P1 toolchain (esbuild 0.28.2, pinned exactly).** Acceptance used for P1 and reusable for P2+: golden identical
  without re-recording; markup and CSS of `dist/` and `dist-artifact/` byte-identical to the previous build; scripts
  equal as token streams to the old script passed through the same esbuild settings (compare with
  `esbuild --minify-whitespace` on both sides); `update()` measured paired (both builds open side by side, alternating
  blocks of calls) because single-run medians on the 2-core agent machine vary ±0.3 ms.
- **Top-level names are globals.** `main.js` is still one global scope; inline `onclick` handlers, `site.js` (`KEY`,
  `hadSave`) and the suites (`state`, `update()`, `RQ_BY`, …) use them. Until P3 gives modules real imports and
  exports, keep `treeShaking: false` and keep each entry free of `export` (the build fails if an import/export
  statement survives bundling). A new module's top-level name must not collide with another module's: esbuild would
  rename one of them silently.
- **Static text checks read the built page**, which esbuild reprints: match code by value, not by its source spelling
  (`const` vs `var`, quotes, comments). e2 and e4 #11 were adapted that way in P1.
- **Comparing old and new renders:** the page is not deterministic run to run on its own: the icon sizer
  (`iconSizer`, a ResizeObserver) can settle on 47 or 56 px depending on image decode timing, and layout fitting
  depends on when fonts load. For screenshot comparisons install Playwright's fake clock, block web fonts
  (`node --require ./tests/support/block-web-fonts.cjs`), make lazy images eager and wait until every image is complete;
  compare DOM (scripts removed), computed styles (sorted per element: Chrome lists custom properties in varying order),
  stored state, then pixels, and run the same harness old-vs-old to know the noise floor.
- **Concurrent heavy jobs** (a second Playwright run, other agents' audits) make the `update() < 15 ms` check in
  `regress` fail; `origin/main` fails it too under load. Run timing-sensitive suites alone.
- Branches that edit the old one-file `src/index.html` must be ported after P1 merges: CSS lines go to
  `src/styles/app.css`, script lines to `src/main.js`, generated data via `npm run gen`.
