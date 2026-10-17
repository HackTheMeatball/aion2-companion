# Tech Lead

**Owns:** the architecture: state model and migrations, data format, build and module structure, performance. Leads
0.2 Foundations (see ROADMAP.md and the architecture audit summary in docs/ARCHITECTURE.md).

**Standing checklist**
- Every change to state, keys, data format or build gets a structure pass before Engineering starts.
- 0.2 acceptance at every step: golden identical, all suites green, saves untouched, single-file output for both builds.
- The data format v2 schema goes to an independent reviewer, then to the owner, before anything is built on it.
- Rules to enforce once the pure core exists: `core/` has no DOM access; derived facts are never stored as ticks.

**Decisions already made by the owner:** ES modules + esbuild, no framework (0.2); several characters per browser
(0.5, was 0.4 before the 2026-10-15 renumber); story gates default to "reached"; hosting stays on GitHub Pages for now (Cloudflare later, same address).

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
  rename one of them silently (since P2 the build fails on that, for every declaration that starts a line).
- **Static text checks read the built page**, which esbuild reprints: match code by value, not by its source spelling
  (`const` vs `var`, quotes, comments). e2 and e4 #11 were adapted that way in P1.
- **Comparing old and new renders:** the page is not deterministic run to run on its own: card sizing
  depends on when images decode and fonts load (since 0.5 P1 the milestone icons are a fixed `2lh` and the rail and
  hero rows refit when fonts settle, but timing still moves frames in between). For screenshot comparisons install Playwright's fake clock, block web fonts
  (`node --require ./tests/support/block-web-fonts.cjs`), make lazy images eager and wait until every image is complete;
  compare DOM (scripts removed), computed styles (sorted per element: Chrome lists custom properties in varying order),
  stored state, then pixels, and run the same harness old-vs-old to know the noise floor.
- **Concurrent heavy jobs** (a second Playwright run, other agents' audits) make the `update() < 15 ms` check fail;
  `origin/main` fails it too under load. It is in the non-blocking `perf` suite (`npm run test:perf`); run it alone.
- Branches that edit the old one-file `src/index.html` must be ported after P1 merges: CSS lines go to
  `src/styles/app.css`, script lines to `src/main.js` (data tables: `src/data/*.js` since P2), generated data via
  `npm run gen`.
- **0.2 P2 data out of code.** Data modules (`src/data/*.js`) are evaluated before `main.js`, so they may import only
  generated data, other data modules and `markup.js` (pure text helpers), never read `state` or the DOM, and never
  import from `main.js` (it isn't a module others can import from until P3). Moving a table = move its statements and
  any statement that finishes building it (`SP_EXTRA` append, `Object.assign(QUEST_STEPS, …)`), add `export`, import
  where used. Proof used: the bundle's top-level names are the same set and its top-level statements the same
  multiset (each normalised with esbuild `--minify-whitespace`), only reordered; markup and CSS byte-identical.
- **Generated data (0.2 step 5b):** the build compiles the module `src/data/generated.js` from `data/**` in memory
  (`tools/gen/gen.mjs` via the esbuild plugin); nothing generated is committed except `data/DATA_SOURCES.md`, which
  `npm run gen:check` (CI `data` job) keeps current. Acceptance used for 5b, reusable: dump every export of every data
  module in Node on both trees (`src/data/*.js` + generated, functions probed at 0..50) and deep-compare; golden
  identical; the page's values equal the generator's (e4 #11).
- Render templates (`cardHTML`, the Next up view objects) are code, not data; they stay in `main.js` (P3 moved only
  the decisions).
- **0.2 P3 pure core (`src/core/`).** state (key, defaults, `loadState`, `char`, `CHAR_FIELDS`), migrations (`migrate`
  with an injected `store`), catalog (the GATES / SP_STEPS finishing that used to sit in the middle of `main.js`, areas,
  lookups), requirements, nextup (`rankNext` → card data; `main.js` `nowCard` renders). Still one global scope: core
  names are page globals too, so a core export must not reuse a `main.js` name (the build's collision check covers
  `src/core/`). Core functions take `c = char(state)` or `state` explicitly; the old page names the suites and the
  v285 / v287 baselines call (`counts`, `STIGMA_SLOTS`, `rqAvail`, `stNames`, `stPlan`, `dvLeftNow`, `checkable`,
  `itemByK`, `CLEAR_REWARD`, `DV_NODES`) stay callable with their old signatures (wrappers in `main.js`).
- **Evaluation order matters in the catalog.** AREA_ITEMS is built from the milestones as written, before the skill-only
  milestones are added and GATES is sorted; regional quests and skill lines are folded in after. The load-time steps
  now run after that finishing (they used to run before it); only `stig` / `eput` items matter to them, which the
  finishing doesn't add or reorder. Golden verified identical.
- **Next up step titles still come from the milestone row's DOM** (`stepHTML`): `.txt` minus tips, location and cost
  spans, first `<b>`. Pure title extraction would need an HTML parser or a `ns` on every step; the 0.3 engine can add
  `ns` titles and drop it.
- **`tests/core.mjs`** bundles `src/core/` with esbuild (platform `neutral`, the generated-data plugin from
  `scripts/generated-data.mjs`) and imports it from a data: URL: ≈0.1 s to bundle, ≈0.5 s in all. Prefer adding a
  rule there over a browser suite when it doesn't need layout.
