# Data generator

`gen.mjs` compiles the v2 data (the packs in `data/packs/`, spec `docs/DATA-FORMAT-V2.md`) into the module the page imports as
`src/data/generated.js`. Nothing is written into `src/` and the module is not committed: `npm run build` calls
`generate()` through the esbuild plugin in `scripts/generated-data.mjs` and inlines the result.

```sh
npm run gen         # validate (validate.mjs) + cross-record checks; writes data/DATA_SOURCES.md and out/ (exit 1 on failure)
node tools/gen/gen.mjs --pack <id> --root <dir>   # another pack / packs root (defaults: aion2/asmodian/assassin, data/packs);
                    # not the default: its DATA_SOURCES.md goes to out/, data/DATA_SOURCES.md is left alone
npm run validate    # JSON Schema only: every data file and every schema example (ajv 8 Ajv2020, strict, allErrors)
npm run gen:check   # the same as gen, then fails if data/DATA_SOURCES.md changed (CI runs it)
node tests/schema.mjs   # the `schema` suite: schemas, broken copies that must be rejected, checks, DATA_SOURCES.md current
```

- `gen.mjs` — `generate()` returns the module text, the compiled constants and a report; `dataSourcesMd()` the
  Sources listing. The CLI writes `out/generated.js`, `out/gate-graph.js` and `out/gen-report.json` for review (git-ignored).
- `GATE_GRAPH` (0.3 E1, docs/design/0.3-requirement-engine.md §3): every trackable record's live `requires` /
  `completesWith` compiled for `src/core/evaluator.js` (skill lines from `rule:skill-level-gate`), with checks that every
  `done` edge resolves to a node and there is no cycle. It is a second module, `src/data/gate-graph.js` (`gateModule`),
  so the page carries none of it until the evaluator is wired in (E2).
- `packs.mjs` — `resolvePacks({ root, pack })`: reads each `pack.json` (`data/schema/pack.schema.json`), resolves the
  chain (parent, then `uses`, then the pack; depth first, each pack once) and returns the listed files in load order.
  Fails on a manifest that fails its schema or names another folder, an unknown `parent` / `uses`, a cycle, a listed
  file that is missing and a JSON file in a pack folder that no manifest lists (DATA-FORMAT-V2 §2.1).
  `generate({ root, pack })` passes them through; `tests/schema.mjs` checks broken copies of `data/packs` are rejected.
- Checks (0.4 P6a): `generate()` runs the engine checks for every pack (schema, id and save-key uniqueness, references,
  source/URL policy, claims, story chain shape, milestones and steps, gate atoms, objective `i`, place/zone, GATE_GRAPH),
  then each `checks` module the pack chain's manifests name (`pack.schema.json`), as `checks(ctx, check)` with the same
  `check(name, ok, detail)`. AION 2's is `data/packs/aion2/checks.mjs` (fixed counts, named quests and rules, specialties,
  build, strongholds, Sealed Dungeons, regional quests, camps, Daevanion gate). A manifest chain without one gets engine
  checks only. The module is loaded with `require` (Node >= 22.12) so `generate()` stays synchronous.
- `validate.mjs` — the schema step (pack manifests included): all schemas in `data/schema/` compile under `{ strict: true, allErrors: true }`.
- `../../data/DATA_SOURCES.md` — every source URL, the records that cite it, and its Sources-card group (committed).
- The report's `debt` lists what the data still owes: citations of the withdrawn site (aion2.th.gl) and records on the
  placeholder zone `zone:altgard-unplaced` (DATA-FORMAT-V2 §9 data task).

- `proposed` gates (0.3 audit, DATA-FORMAT-V2 §6) are validated and reference-checked but never compiled;
  `generate({ dropProposed: true })` strips them, and `tests/schema.mjs` checks both modules are identical. The report's
  `proposed` lists each one (status, check, change) for the 0.3 golden-difference list.

After changing data: `npm run gen`, review `git diff data/`, then `npm test`.
