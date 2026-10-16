# 0.4 P1: Pack folders with manifests; the generator builds a pack chain

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §3,
docs/DATA-FORMAT-V2.md and tools/gen/README.md first.

## Problem

`data/` has no pack boundaries: game rules (`data/shared/`), Asmodian content (`data/shared/asmodian/`), the Assassin
class (`data/classes/assassin/`) and the Assassin guide (`data/shared/asmodian/guide/`, `builds.json`) sit in folders
named by history, and the generator reads them as one set. A second class or game has nowhere defined to go.

## Result

```
data/schema/                              formats (engine), plus pack.schema.json
data/packs/aion2/                         game pack: pack.json, sources.json, game-builds.json, rules.json, boards.json, items.json
data/packs/aion2/classes/assassin/        class pack: pack.json, class.json, skills.json, stigmas.json, board-nodes.json
data/packs/aion2/asmodian/                faction pack: pack.json, story-quests, regional-quests, sealed-dungeons,
                                          strongholds, zones, unlocks, ascension-quests (.json)
data/packs/aion2/asmodian/assassin/       guide pack (the Asmodian Assassin guide): pack.json, builds.json, retired.json,
                                          guide/{milestones,steps,tips,claims,confidence}.json, claims-notes.md
data/DATA_SOURCES.md, data/research/      stay where they are
```

Each `pack.json`: `schemaVersion`, `id` (`aion2`, `aion2/classes/assassin`, `aion2/asmodian`, `aion2/asmodian/assassin`),
`kind` (`game` · `class` · `faction` · `guide`), `name`, `parent` (the pack it extends; none for a game), `uses` (other
packs it reads, e.g. the guide uses `aion2/classes/assassin`) and `files` (every data file of the pack, explicitly).
Don't name a field `requires`, `completesWith` or `is` (those are gate fields; kickoff reads them as the `gates` lane).

`tools/gen/gen.mjs` takes `--pack <id>` (default `aion2/asmodian/assassin`) and `--root <dir>` (default `data/packs`),
resolves the chain (parents and `uses`), loads exactly the listed files, and runs the same checks as today. P6 uses
`--root` for its fake game.

## Appetite

M (100–300 hand-written lines; file moves are renames and don't count).

## No-gos

- No record changes: not one value, id, key or text in any data file. Moves only (`git mv`).
- No change to the compiled module or the page (see Acceptance).
- Don't split the guide text between the class and the faction (0.6, with the Gladiator pack).
- No per-pack loading in the page (0.6).
- Don't touch `src/` except a path in a comment.

## Steps (commit and push after each)

1. `data/schema/pack.schema.json` + one example per pack kind in `data/schema/examples/`; the schema suite validates
   manifests.
2. `git mv` every file into the layout above; move `data/schema/examples/**` to mirror it.
3. The generator: chain resolution, `--pack`, `--root`, manifest checks (listed file missing, a JSON file in a pack
   folder not listed, unknown `parent` / `uses`, a cycle), and the rest unchanged.
4. Paths in tests (`tests/support/oracle.mjs`, `tests/equiv/evaluator-equivalence.test.mjs`, `tests/golden/explain.js`,
   `tests/invariant/states.mjs`, `tests/schema.mjs`), in the generator's text (`gen.mjs:556`) and in docs (CLAUDE.md's
   `claims.json` path, ARCHITECTURE §3, DATA-FORMAT-V2, tools/gen/README.md). `npm run gen` rewrites
   `data/DATA_SOURCES.md`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] The compiled module is byte-identical: `tools/gen/out/generated.js` from `main` and from this branch have the same
      sha256 (paste both).
- [ ] `dist/index.html` and `dist-artifact/index.html` are byte-identical to `main`'s build (paste sizes and sha256).
- [ ] `git diff -M --stat main` shows every data file as a rename with 0 changed lines (`R100`).
- [ ] `data/DATA_SOURCES.md` differs from `main` only in file paths (paste `git diff --word-diff` summary).
- [ ] Three new broken copies in `tests/schema.mjs` are rejected: a manifest without `id`, a listed file that doesn't
      exist, a pack-folder JSON file that isn't listed.
- [ ] `node tools/gen/gen.mjs --pack aion2/asmodian/assassin` and the default run give the same output.
- [ ] Golden identical without re-record (`golden` suite green; no snapshot file changed).
- [ ] No `data/shared` or `data/classes` path left outside `tools/history/`, `docs/reviews/`, `docs/research/` and
      CHANGELOG (paste the `grep -rn` result).
- [ ] `npm test` green.

## Files (owns)

`data/**` (moves, manifests), `data/schema/pack.schema.json`, `data/schema/examples/**`, `tools/gen/**`,
`tests/schema.mjs`, the test path lines named in step 4, CLAUDE.md (one path), docs named in step 4.

## Lanes, model, order

Lanes: gen, gates (moved data files carry gate fields). Model: Opus (generator, schema). After: nothing. Before: P2a,
P3c, P6. Wave 1, beside P3a and P3b.

- [next] #? opus lanes:gen,gates
