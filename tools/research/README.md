# Research scripts (provenance)

**v1 only.** Since 0.2 step 5b the data is in format v2 (`data/**`); these scripts built the v1 files, which
`tools/history/v2-convert/convert.mjs` converted (read them at commit 5a309f3). They no longer write anything current.

How `data/*.json` was built during the R1–R3 / V1 research passes (Oct 2026). Kept so every data file can be traced and
re-derived. The web research itself (Metabot, aion2.gaming.tools, aion2.th.gl, allthings.how, …) was done by hand / with
WebFetch; these scripts only assemble its results. `brief.md` is the research brief.

| Script | Writes | Inputs |
|---|---|---|
| `r1/build.py` | `data/rq.json` (58 regional quests) | `r1/partial.json` (per-quest research), `r1/req.json`, `r1/atl.json`, `r1/app-data.json` (dump of the v285 app's quest table) |
| `r1/chains.py` | `data/rq-chains.json` (17 regional edges + story gates) | `data/rq.json` + edges written in the script |
| `r1/add.py` | `r1/partial.json` (merge helper: JSON on stdin) | |
| `r2/dg_add.py`, `r2/sh_set.py`, `r2/story_add.py` | `data/dungeons.json`, `data/strongholds.json`, `data/story-40-45.json` (merge helpers: JSON on stdin) | |
| `mkbuild.py` | `data/build.json` | values in the script |
| `v1_build_claims.py <out.json>` | `data/claims.json` (pass the path) | verdicts in the script |
| `upd_locations.py` | `data/locations.json` (merge helper: JSON on stdin) | |

`r1/build.py`, `r1/chains.py`, `mkbuild.py` and `v1_build_claims.py` reproduce the committed data files byte for byte
(checked Oct 2026). Exception: claims C36–C38 (0.1.3) were added to `data/claims.json` by hand, so
`v1_build_claims.py` reproduces the file up to C28h. The merge helpers modify `data/` in place: run them only on purpose and review `git diff data/`.
Run from anywhere with `python3 -I tools/research/<script>`; then `npm run gen`.
