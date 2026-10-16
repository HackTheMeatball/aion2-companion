# 0.4 P0: Engine contract (design doc: pack code, hooks, card registry, term list)

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md, ROADMAP.md "0.4" and
docs/audits/2026-10-16-audit-and-plan-to-1.0.md first. Docs only.

## Problem

The 0.4 plan moves AION 2 out of the engine, but nothing says where pack *code* lives or how the engine calls it. Some
of AION 2 can't be data: card templates (Skills, Stigmas, Daevanion), Next up producers (Cube items, skill buys, board
nodes, stigma equips), the five `KEPT_RULES` in `src/core/requirements.js:19-29`, the `GATE_CHANGES` switch lists
(record ids at 71–80, 107, 116), the stigma pick pinning in `src/core/migrations.js:45`. Without a written contract,
P2b, P2c, P4a and P5a–d would each invent one, and the reviews would send them back.

## Appetite

M, docs only (one design doc, about 200–300 lines).

## No-gos

- No code, data or test changes.
- Doesn't redesign the evaluator, the data format v2 or the save (P3c's spec holds the save v5 shape; reference it).
- No new features, no UI.

## What the doc decides (`docs/design/0.4-engine-contract.md`)

1. **Code layout:** `src/core/` = engine (no game term); `src/shell/` = web platform glue (storage adapter, service
   worker registration); `src/cards/` = engine cards; `src/packs/aion2/` = the AION 2 game pack's code (catalog, kept
   rules, Next up producers, its cards in `src/packs/aion2/cards/`); `src/main.js` = the page shell that wires a pack to
   the engine. The import rule: `src/core/` never imports `src/packs/`, `src/cards/` or `src/main.js`; `src/cards/`
   imports only `src/core/`; packs import the engine, never the reverse. Name the test that enforces it (extend
   `tests/core/purity.test.mjs`).
2. **The pack interface:** one object a pack exports (for example `definePack({ id, catalog, graphTransforms,
   nextUpProducers, cards, onLoad, rowRenderers, nowRenderers })`), with each hook's input, output and when the engine
   calls it. Map every AION 2 spot listed above to a hook. The page build stays one global scope (esbuild, no tree
   shaking; ARCHITECTURE §4), so say how names stay unique (prefix or module objects).
3. **Split lines:** for `src/core/requirements.js`, `nextup.js`, `catalog.js`, `ascension.js`, `blockers.js` and
   `src/data/*.js`, a table: each top-level function or constant → stays in the engine / moves to `src/packs/aion2/`,
   with the reason. P2b and P2c build from this table.
4. **Card registry interface** (for P4a): `registerCard({ id, slot, mount(el, ctx), update(ctx) })` or better; the
   order rule; how `render()` and `update()` call cards; how a card's static markup moves out of `src/index.html` with
   the DOM byte-identical; what `ctx` holds (state, `char(state)`, pack, `basic`).
5. **The AION 2 term list** P8 scans for: words, with exceptions that are not game terms (the product name "Daeva
   Companion" in shell text; CSS class names stay out of scope). Start from the audit's keyword scan (stigma, Daevanion,
   Kibelisk, Altgard, shards, …) and the counts in ROADMAP 0.4's audit; list false positives the scan must allow.
6. **What stays out of 0.4**, so later items don't reopen it (per-pack loading → 0.6, guide text both classes share →
   0.6, AION 2 cards made clean modules → when a feature touches them).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `docs/design/0.4-engine-contract.md` exists and covers 1–6 above, each as its own section.
- [ ] Every AION 2 spot listed under Problem appears in the hook map (point 2) with its target hook.
- [ ] The split table (point 3) lists every top-level name of the five core files and `src/data/*.js` (check: `grep -c
      "^export" ` per file equals the rows for that file).
- [ ] The term list has at least the audit's keywords and a false-positive list.
- [ ] ROADMAP 0.4 P2b, P2c, P4a, P5a–d plan files are consistent with the doc; where the doc changes one of them, the PR
      edits that plan file in `docs/plans/0.4/` too and says so.
- [ ] Only docs changed (`git diff --stat main` shows `docs/**` only); `npm test` green.

## Files

`docs/design/0.4-engine-contract.md` (new); `docs/plans/0.4/*.md` only where the design changes a later spec.

## Lanes, model, order

Lanes: none. Model: Opus (it sets the engine design). After: nothing. Before: P2b, P2c, P4a, P5a–d.

- [next] #? opus lanes:none
