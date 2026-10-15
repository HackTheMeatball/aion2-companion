# Data generator

`gen.mjs` compiles the v2 data (`data/**`, spec `docs/DATA-FORMAT-V2.md`) into the module the page imports as
`src/data/generated.js`. Nothing is written into `src/` and the module is not committed: `npm run build` calls
`generate()` through the esbuild plugin in `scripts/generated-data.mjs` and inlines the result.

```sh
npm run gen         # validate (validate.mjs) + cross-record checks; writes data/DATA_SOURCES.md and out/ (exit 1 on failure)
npm run validate    # JSON Schema only: every data file and every schema example (ajv 8 Ajv2020, strict, allErrors)
npm run gen:check   # the same as gen, then fails if data/DATA_SOURCES.md changed (CI runs it)
node tests/schema.mjs   # the `schema` suite: schemas, broken copies that must be rejected, checks, DATA_SOURCES.md current
```

- `gen.mjs` — `generate()` returns the module text, the compiled constants and a report; `dataSourcesMd()` the
  Sources listing. The CLI writes `out/generated.js` and `out/gen-report.json` for review (git-ignored).
- `validate.mjs` — the schema step: all schemas in `data/schema/` compile under `{ strict: true, allErrors: true }`.
- `../../data/DATA_SOURCES.md` — every source URL, the records that cite it, and its Sources-card group (committed).
- The report's `debt` lists what the data still owes: citations of the withdrawn site (aion2.th.gl) and records on the
  placeholder zone `zone:altgard-unplaced` (DATA-FORMAT-V2 §9 data task).

- `proposed` gates (0.3 audit, DATA-FORMAT-V2 §6) are validated and reference-checked but never compiled;
  `generate({ dropProposed: true })` strips them, and `tests/schema.mjs` checks the module is identical. The report's
  `proposed` lists each one (status, check, change) for the 0.3 golden-difference list.

After changing data: `npm run gen`, review `git diff data/`, then `npm test`.
