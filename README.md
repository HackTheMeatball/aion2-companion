# `archive` branch: pre-repo work of the Aion 2 Companion

> **2026-10-13:** the 51 in-game screenshots (`evidence/in-game/`) moved to the owner's private repository (owner
> decision D10) and were removed from this branch's history. App-feedback screenshots (our own app) remain.

This is an **orphan branch** (no shared history with `main`). It preserves the work done on the Aion 2 Asmodian Assassin
guide **before** the GitHub repo existed (10–12 Oct 2026), so it can't be lost with the container: the research and
planning notes, QA results, one-time scripts and every saved build of the app. Nothing here is deployed. `main` is the
app; this branch is its prehistory. Archived 2026-10-13 from the old working directory
(`/tmp/claude-0/-home-claude/3de1c16d-…/scratchpad`, 2,215 files / 226 MB, mostly test screenshots), plus the owner's
in-game screenshots (session uploads) and the shareable "guide pack" kit from `/home/claude/`.

- **571 files** from the scratchpad, **141 owner screenshots** (`evidence/`), **6 guide-pack files** (`guide-pack/`), plus this
  README, `MANIFEST.md`, `EXCLUDED.md`, `evidence/README.md` and `versions/localize-icons.sh`.
- `MANIFEST.md`: every archived file with size, sha256, its original path and category.
- `EXCLUDED.md`: every file left out and why (already in `main`, duplicate, disposable, or must not be public).

## Layout

| Folder | Contents | Origin in the scratchpad |
|---|---|---|
| `versions/` | 142 distinct builds of the single-file app, v63 → v291 + head fix (table below) | `bak-*.html`, `checkpoint-*.html`, `backup-*.html`, `assassin-route.html`, `polish/e1/pre-*.html` |
| `planning/` | Polish project: `BRIEF.md`, `PLAN.md` (lead review), `DECISIONS.md`, `E3-TASKS.md`, `E1`–`E4-CHANGES.txt` | `polish/*` |
| `engineering/e1`…`e4/` | Per-pass patch scripts (E1 `p1`–`p19.py`), the pass test suites and their earlier versions, generator versions (`gen.pre-E3/E4.py`), run outputs, CSS-cleanup analysis | `polish/e1`…`e4` |
| `qa/` | Lead review harness (`lead/`), QA rounds (`qa/`, `qa3/` incl. `findings.json`), test-run outputs (`rr0/`, `repo-port-run/`), the ad-hoc Playwright probes used while iterating on the UI (`dev-scripts/`) | `polish/lead`, `polish/qa*`, `rr0/`, `repo-work/clone/tests/out/`, root `*.js` |
| `research/` | Research inputs not in `main`: story batches `b1`–`b5.json` + `b5.py`/`merge.py` (they built `data/story.json`), `qsteps.json`, Sealed Dungeon slugs, quest-id list, Daevanion board path optimisers (`nez.py`, `zikel.py`), original (absolute-path) versions of the R1/R2 scripts now in `main:tools/research/` | root `*.json`/`*.py`/`ids.txt`, `r1/`, `r2/`, `tools/` |
| `repo-port/` | Scripts and logs from turning `assassin-route.html` into the repo (`mksrc.py`, `port.py`, visual-compare and perf checks) | `repo-work/` |
| `icons/` | The icon set (incl. the two pre-E3 icons `green-off`/`green-on`), the `*-src.png` crops of the in-game icons they were cut from, and the cutting scripts | `icons/` |
| `evidence/` | Screenshots the owner pasted into chat: `in-game/` (51, game UI only: skill tooltips, Daevanion board, quest tracker, journal; the source of truth for game data) and `app-feedback/` (90, the app's UI with the owner's feedback). Index in `evidence/README.md` | `/root/.claude/uploads/3de1c16d-…/` |
| `guide-pack/` | The "Aion 2 Leveling Guide Builder" kit: a prompt pack + example template for building the same guide for any class/faction. `pack/` = the shipped version (zip contents minus icons; `aion2-guide-pack` is an earlier template, HTML without extension), `first-draft/` = the earlier prompt and template | `/home/claude/aion2-guide-pack/`, `/home/claude/*.md,*.html` |

How it maps to `main`: `assassin-route.html` (= `versions/142-assassin-route.html`) became `main:src/index.html` in the
first repo commits (`/_blob/` icon URLs → `assets/icons/`, see `repo-port/mksrc.py`). `data/*.json`,
`tools/gen/`, `tools/research/`, `tools/history/` (E2/E4 patches) and the test suites were copied into `main`
unchanged or with paths made repo-relative; exact copies are not duplicated here (see `EXCLUDED.md`, category a).
Scripts here still contain absolute scratchpad paths; read them as provenance, or adjust paths before running.

## Restoring an old version

Each file in `versions/` is a complete app (HTML + CSS + JS in one file, ~100–460 KB). They were claude.ai artifacts,
so icons point at claude.ai `/_blob/<id>` URLs. To run one locally:

```sh
git clone --branch archive --single-branch https://github.com/hackthemeatball/aion2-companion.git aion2-archive
cd aion2-archive
sh versions/localize-icons.sh versions/135-v285-before-polish.html versions/local.html
# open versions/local.html in a browser (file:// works; Google Fonts load from the web)
```

Saves use the same `localStorage` key (`aion2-assassin-route-v4`) as today's app, and opening an old build in the
same browser profile as the live site **does not** share data (different origin), so it can't damage real progress.
To see an old build with your own progress, use *Export progress* on the live site and paste the JSON into
`localStorage` on the `file://` page (the *Import progress* button exists from the E1 pass on: `136-pre-css` and later). To bring an old version back into
`main`, replace `src/index.html`'s content (keep `main`'s `<head>`, icon paths and E2-GEN block conventions) and run the
migration suites (`mig1`, `mig2`, `journey`) per `CLAUDE.md`.

Version numbers (`vNN`) are claude.ai artifact version numbers. Files named `bak-<word>` were saved before the UI
change named by the word (inferred from the names; there are no other notes). "Δ lines" is relative to the row above.
Identical backups were stored once (aliases in "Original name(s)").

| # | File | Original name(s) | Saved (UTC) | Size | Lines | Δ lines | What it was |
|---:|---|---|---|---:|---:|---:|---|
| 1 | `001-v63.html` | `bak-v63.html` | 2026-10-10 21:12 | 97.9 KB | 1257 |  | claude.ai artifact version 63 (snapshot) |
| 2 | `002-v64.html` | `bak-v64.html` | 2026-10-10 21:18 | 99.7 KB | 1288 | +31 | claude.ai artifact version 64 (snapshot) |
| 3 | `003-v67.html` | `bak-v67.html` | 2026-10-10 21:42 | 101.5 KB | 1299 | +11 | claude.ai artifact version 67 (snapshot) |
| 4 | `004-v68.html` | `bak-v68.html` | 2026-10-10 21:45 | 104.7 KB | 1334 | +35 | claude.ai artifact version 68 (snapshot) |
| 5 | `005-v71.html` | `bak-v71.html` | 2026-10-10 22:11 | 112.6 KB | 1368 | +34 | claude.ai artifact version 71 (snapshot) |
| 6 | `006-v72.html` | `bak-v72.html` | 2026-10-10 22:13 | 113.7 KB | 1371 | +3 | claude.ai artifact version 72 (snapshot) |
| 7 | `007-v76.html` | `bak-v76.html` | 2026-10-10 22:31 | 116.9 KB | 1404 | +33 | claude.ai artifact version 76 (snapshot) |
| 8 | `008-v77.html` | `bak-v77.html` | 2026-10-10 22:36 | 117.9 KB | 1415 | +11 | claude.ai artifact version 77 (snapshot) |
| 9 | `009-v79.html` | `bak-v79.html` | 2026-10-10 22:41 | 121.7 KB | 1452 | +37 | claude.ai artifact version 79 (snapshot) |
| 10 | `010-v80.html` | `bak-v80.html` | 2026-10-10 22:49 | 123.2 KB | 1477 | +25 | claude.ai artifact version 80 (snapshot) |
| 11 | `011-v86.html` | `bak-v86.html` | 2026-10-10 23:10 | 125.1 KB | 1506 | +29 | claude.ai artifact version 86 (snapshot) |
| 12 | `012-v91.html` | `bak-v91.html` | 2026-10-10 23:42 | 126.5 KB | 1523 | +17 | claude.ai artifact version 91 (snapshot) |
| 13 | `013-v94.html` | `bak-v94.html` | 2026-10-10 23:53 | 129.1 KB | 1550 | +27 | claude.ai artifact version 94 (snapshot) |
| 14 | `014-v97.html` | `bak-v97.html` | 2026-10-11 00:02 | 132.4 KB | 1583 | +33 | claude.ai artifact version 97 (snapshot) |
| 15 | `015-v101.html` | `bak-v101.html` | 2026-10-11 00:10 | 133.5 KB | 1588 | +5 | claude.ai artifact version 101 (snapshot) |
| 16 | `016-v104.html` | `bak-v104.html` | 2026-10-11 00:51 | 132.0 KB | 1582 | -6 | claude.ai artifact version 104 (snapshot) |
| 17 | `017-v105.html` | `bak-v105.html` | 2026-10-11 01:10 | 132.9 KB | 1585 | +3 | claude.ai artifact version 105 (snapshot) |
| 18 | `018-v106.html` | `bak-v106.html` | 2026-10-11 02:53 | 134.4 KB | 1601 | +16 | claude.ai artifact version 106 (snapshot) |
| 19 | `019-quest3.html` | `bak-quest3.html` | 2026-10-11 02:59 | 135.1 KB | 1612 | +11 | snapshot before the "quest3" UI change (inferred from the file name) |
| 20 | `020-where.html` | `bak-where.html` | 2026-10-11 03:20 | 139.5 KB | 1666 | +54 | snapshot before the "where" UI change (inferred from the file name) |
| 21 | `021-journey.html` | `bak-journey.html` | 2026-10-11 03:23 | 143.5 KB | 1710 | +44 | snapshot before the "journey" UI change (inferred from the file name) |
| 22 | `022-tiles.html` | `bak-tiles.html` | 2026-10-11 03:26 | 144.6 KB | 1722 | +12 | snapshot before the "tiles" UI change (inferred from the file name) |
| 23 | `023-grade.html` | `bak-grade.html` | 2026-10-11 03:30 | 150.3 KB | 1794 | +72 | snapshot before the "grade" UI change (inferred from the file name) |
| 24 | `024-sh.html` | `bak-sh.html` | 2026-10-11 16:14 | 151.7 KB | 1811 | +17 | snapshot before the "sh" UI change (inferred from the file name) |
| 25 | `025-sh2.html` | `bak-sh2.html` | 2026-10-11 16:19 | 152.4 KB | 1823 | +12 | snapshot before the "sh2" UI change (inferred from the file name) |
| 26 | `026-areas.html` | `bak-areas.html` | 2026-10-11 16:22 | 153.9 KB | 1842 | +19 | snapshot before the "areas" UI change (inferred from the file name) |
| 27 | `027-4col.html` | `bak-4col.html` | 2026-10-11 16:56 | 154.2 KB | 1849 | +7 | snapshot before the "4col" UI change (inferred from the file name) |
| 28 | `028-4colwide.html` | `bak-4colwide.html` | 2026-10-11 16:58 | 157.2 KB | 1887 | +38 | snapshot before the "4colwide" UI change (inferred from the file name) |
| 29 | `029-3col.html` | `bak-3col.html` | 2026-10-11 17:01 | 158.0 KB | 1902 | +15 | snapshot before the "3col" UI change (inferred from the file name) |
| 30 | `030-compact.html` | `bak-compact.html` | 2026-10-11 17:05 | 160.6 KB | 1927 | +25 | snapshot before the "compact" UI change (inferred from the file name) |
| 31 | `031-shtog.html` | `bak-shtog.html` | 2026-10-11 17:06 | 161.4 KB | 1935 | +8 | snapshot before the "shtog" UI change (inferred from the file name) |
| 32 | `032-dvhead.html` | `bak-dvhead.html` | 2026-10-11 17:18 | 164.8 KB | 1969 | +34 | snapshot before the "dvhead" UI change (inferred from the file name) |
| 33 | `033-lvlup.html` | `bak-lvlup.html` | 2026-10-11 17:21 | 165.9 KB | 1981 | +12 | snapshot before the "lvlup" UI change (inferred from the file name) |
| 34 | `034-balance.html` | `bak-balance.html` | 2026-10-11 17:26 | 170.4 KB | 2037 | +56 | snapshot before the "balance" UI change (inferred from the file name) |
| 35 | `035-dvrow.html` | `bak-dvrow.html` | 2026-10-11 17:30 | 171.6 KB | 2052 | +15 | snapshot before the "dvrow" UI change (inferred from the file name) |
| 36 | `036-dvux.html` | `bak-dvux.html` | 2026-10-11 17:33 | 172.3 KB | 2061 | +9 | snapshot before the "dvux" UI change (inferred from the file name) |
| 37 | `037-skillsux.html` | `bak-skillsux.html` | 2026-10-11 17:38 | 174.8 KB | 2095 | +34 | snapshot before the "skillsux" UI change (inferred from the file name) |
| 38 | `038-cleared.html` | `bak-cleared.html` | 2026-10-11 17:41 | 178.6 KB | 2132 | +37 | snapshot before the "cleared" UI change (inferred from the file name) |
| 39 | `039-progress.html` | `bak-progress.html` | 2026-10-11 17:49 | 181.5 KB | 2163 | +31 | snapshot before the "progress" UI change (inferred from the file name) |
| 40 | `040-prog2.html` | `bak-prog2.html` | 2026-10-11 17:54 | 183.8 KB | 2184 | +21 | snapshot before the "prog2" UI change (inferred from the file name) |
| 41 | `041-areas2.html` | `bak-areas2.html` | 2026-10-11 17:57 | 184.1 KB | 2184 | +0 | snapshot before the "areas2" UI change (inferred from the file name) |
| 42 | `042-zones.html` | `bak-zones.html` | 2026-10-11 18:05 | 189.8 KB | 2252 | +68 | snapshot before the "zones" UI change (inferred from the file name) |
| 43 | `043-crystals.html` | `bak-crystals.html` | 2026-10-11 18:10 | 192.4 KB | 2288 | +36 | snapshot before the "crystals" UI change (inferred from the file name) |
| 44 | `044-story.html` | `bak-story.html` | 2026-10-11 18:11 | 192.5 KB | 2288 | +0 | snapshot before the "story" UI change (inferred from the file name) |
| 45 | `045-rename.html` | `bak-rename.html` | 2026-10-11 18:15 | 194.4 KB | 2310 | +22 | snapshot before the "rename" UI change (inferred from the file name) |
| 46 | `046-hideclr.html` | `bak-hideclr.html` | 2026-10-11 18:28 | 195.6 KB | 2327 | +17 | snapshot before the "hideclr" UI change (inferred from the file name) |
| 47 | `047-undo.html` | `bak-undo.html` | 2026-10-11 18:55 | 197.1 KB | 2348 | +21 | snapshot before the "undo" UI change (inferred from the file name) |
| 48 | `048-board.html` | `bak-board.html` | 2026-10-11 18:57 | 198.6 KB | 2366 | +18 | snapshot before the "board" UI change (inferred from the file name) |
| 49 | `049-nowstar.html` | `bak-nowstar.html` | 2026-10-11 19:07 | 202.0 KB | 2402 | +36 | snapshot before the "nowstar" UI change (inferred from the file name) |
| 50 | `050-nshead.html` | `bak-nshead.html` | 2026-10-11 19:10 | 207.5 KB | 2447 | +45 | snapshot before the "nshead" UI change (inferred from the file name) |
| 51 | `051-hdrux.html` | `bak-hdrux.html` | 2026-10-11 19:22 | 209.0 KB | 2466 | +19 | snapshot before the "hdrux" UI change (inferred from the file name) |
| 52 | `052-qsteps.html` | `bak-qsteps.html` | 2026-10-11 19:36 | 213.1 KB | 2513 | +47 | snapshot before the "qsteps" UI change (inferred from the file name) |
| 53 | `053-chipsmove.html` | `bak-chipsmove.html` | 2026-10-11 19:43 | 221.3 KB | 2560 | +47 | snapshot before the "chipsmove" UI change (inferred from the file name) |
| 54 | `054-filter.html` | `bak-filter.html` | 2026-10-11 19:45 | 222.5 KB | 2572 | +12 | snapshot before the "filter" UI change (inferred from the file name) |
| 55 | `055-dvround.html` | `bak-dvround.html` | 2026-10-11 19:55 | 225.5 KB | 2604 | +32 | snapshot before the "dvround" UI change (inferred from the file name) |
| 56 | `056-sync.html` | `bak-sync.html` | 2026-10-11 20:08 | 227.6 KB | 2630 | +26 | snapshot before the "sync" UI change (inferred from the file name) |
| 57 | `057-ground-1791750488.html` | `bak-ground-1791750488.html` | 2026-10-11 20:28 | 229.5 KB | 2646 | +16 | snapshot before the "ground" UI change (inferred from the file name) |
| 58 | `058-journey-1791751120.html` | `bak-journey-1791751120.html` | 2026-10-11 20:38 | 230.9 KB | 2651 | +5 | snapshot before the "journey" UI change (inferred from the file name) |
| 59 | `059-ns-1791752050.html` | `bak-ns-1791752050.html` | 2026-10-11 20:54 | 237.1 KB | 2740 | +89 | snapshot before the "ns" UI change (inferred from the file name) |
| 60 | `060-dv-1791752399.html` | `bak-dv-1791752399.html` | 2026-10-11 20:59 | 239.8 KB | 2753 | +13 | snapshot before the "dv" UI change (inferred from the file name) |
| 61 | `061-move-1791754532.html` | `bak-move-1791754532.html` | 2026-10-11 21:35 | 245.2 KB | 2818 | +65 | snapshot before the "move" UI change (inferred from the file name) |
| 62 | `062-v197-before-polish.html` | `checkpoint-v197-before-polish.html` | 2026-10-11 21:41 | 246.7 KB | 2841 | +23 | v197, before an earlier UI polish round |
| 63 | `063-v199.html` | `checkpoint-v199.html` | 2026-10-11 21:46 | 249.1 KB | 2872 | +31 | checkpoint at artifact version 199 |
| 64 | `064-v200.html` | `checkpoint-v200.html` | 2026-10-11 21:49 | 250.1 KB | 2885 | +13 | checkpoint at artifact version 200 |
| 65 | `065-v201.html` | `checkpoint-v201.html` | 2026-10-11 21:53 | 252.4 KB | 2906 | +21 | checkpoint at artifact version 201 |
| 66 | `066-v205.html` | `checkpoint-v205.html` | 2026-10-12 01:11 | 254.7 KB | 2926 | +20 | checkpoint at artifact version 205 |
| 67 | `067-v206.html` | `checkpoint-v206.html` | 2026-10-12 01:19 | 257.8 KB | 2961 | +35 | checkpoint at artifact version 206 |
| 68 | `068-v207.html` | `checkpoint-v207.html` | 2026-10-12 01:22 | 260.3 KB | 2988 | +27 | checkpoint at artifact version 207 |
| 69 | `069-v208.html` | `checkpoint-v208.html` | 2026-10-12 01:26 | 262.5 KB | 3015 | +27 | checkpoint at artifact version 208 |
| 70 | `070-v209.html` | `checkpoint-v209.html` | 2026-10-12 01:34 | 264.8 KB | 3035 | +20 | checkpoint at artifact version 209 |
| 71 | `071-v210.html` | `checkpoint-v210.html` | 2026-10-12 01:39 | 265.4 KB | 3043 | +8 | checkpoint at artifact version 210 |
| 72 | `072-v211.html` | `checkpoint-v211.html` | 2026-10-12 01:51 | 266.8 KB | 3055 | +12 | checkpoint at artifact version 211 |
| 73 | `073-v212.html` | `checkpoint-v212.html` | 2026-10-12 02:02 | 267.1 KB | 3056 | +1 | checkpoint at artifact version 212 |
| 74 | `074-v213.html` | `checkpoint-v213.html` | 2026-10-12 02:03 | 267.4 KB | 3058 | +2 | checkpoint at artifact version 213 |
| 75 | `075-v214.html` | `checkpoint-v214.html` | 2026-10-12 02:08 | 268.3 KB | 3065 | +7 | checkpoint at artifact version 214 |
| 76 | `076-v216.html` | `checkpoint-v216.html` | 2026-10-12 02:23 | 269.2 KB | 3070 | +5 | checkpoint at artifact version 216 |
| 77 | `077-v217.html` | `checkpoint-v217.html` | 2026-10-12 02:24 | 270.6 KB | 3088 | +18 | checkpoint at artifact version 217 |
| 78 | `078-v218.html` | `checkpoint-v218.html` | 2026-10-12 02:27 | 271.5 KB | 3097 | +9 | checkpoint at artifact version 218 |
| 79 | `079-v219.html` | `checkpoint-v219.html` | 2026-10-12 02:28 | 271.8 KB | 3101 | +4 | checkpoint at artifact version 219 |
| 80 | `080-v220.html` | `checkpoint-v220.html` | 2026-10-12 02:33 | 272.4 KB | 3109 | +8 | checkpoint at artifact version 220 |
| 81 | `081-v221.html` | `checkpoint-v221.html` | 2026-10-12 02:35 | 272.5 KB | 3109 | +0 | checkpoint at artifact version 221 |
| 82 | `082-v222.html` | `checkpoint-v222.html` | 2026-10-12 02:38 | 272.5 KB | 3109 | +0 | checkpoint at artifact version 222 |
| 83 | `083-v223.html` | `checkpoint-v223.html` | 2026-10-12 02:43 | 274.4 KB | 3130 | +21 | checkpoint at artifact version 223 |
| 84 | `084-v224.html` | `checkpoint-v224.html` | 2026-10-12 02:46 | 274.6 KB | 3133 | +3 | checkpoint at artifact version 224 |
| 85 | `085-v225.html` | `checkpoint-v225.html` | 2026-10-12 02:48 | 275.7 KB | 3139 | +6 | checkpoint at artifact version 225 |
| 86 | `086-v226.html` | `checkpoint-v226.html` | 2026-10-12 02:50 | 279.9 KB | 3185 | +46 | checkpoint at artifact version 226 |
| 87 | `087-v227.html` | `checkpoint-v227.html` | 2026-10-12 02:53 | 282.5 KB | 3206 | +21 | checkpoint at artifact version 227 |
| 88 | `088-v228.html` | `checkpoint-v228.html` | 2026-10-12 02:54 | 282.9 KB | 3208 | +2 | checkpoint at artifact version 228 |
| 89 | `089-v229.html` | `checkpoint-v229.html` | 2026-10-12 02:56 | 282.9 KB | 3209 | +1 | checkpoint at artifact version 229 |
| 90 | `090-v230.html` | `checkpoint-v230.html` | 2026-10-12 03:01 | 284.8 KB | 3227 | +18 | checkpoint at artifact version 230 |
| 91 | `091-v231.html` | `checkpoint-v231.html` | 2026-10-12 03:03 | 285.3 KB | 3231 | +4 | checkpoint at artifact version 231 |
| 92 | `092-v232.html` | `checkpoint-v232.html` | 2026-10-12 03:12 | 287.6 KB | 3252 | +21 | checkpoint at artifact version 232 |
| 93 | `093-v233.html` | `checkpoint-v233.html` | 2026-10-12 03:17 | 288.0 KB | 3256 | +4 | checkpoint at artifact version 233 |
| 94 | `094-v234.html` | `checkpoint-v234.html` | 2026-10-12 03:19 | 288.1 KB | 3256 | +0 | checkpoint at artifact version 234 |
| 95 | `095-v235.html` | `checkpoint-v235.html` | 2026-10-12 03:21 | 288.9 KB | 3262 | +6 | checkpoint at artifact version 235 |
| 96 | `096-v236.html` | `checkpoint-v236.html` | 2026-10-12 03:22 | 289.3 KB | 3268 | +6 | checkpoint at artifact version 236 |
| 97 | `097-v237.html` | `checkpoint-v237.html` | 2026-10-12 03:27 | 289.5 KB | 3268 | +0 | checkpoint at artifact version 237 |
| 98 | `098-v238.html` | `checkpoint-v238.html` | 2026-10-12 03:29 | 291.5 KB | 3287 | +19 | checkpoint at artifact version 238 |
| 99 | `099-v239.html` | `checkpoint-v239.html` | 2026-10-12 03:32 | 292.2 KB | 3291 | +4 | checkpoint at artifact version 239 |
| 100 | `100-v240.html` | `checkpoint-v240.html` | 2026-10-12 03:34 | 292.2 KB | 3292 | +1 | checkpoint at artifact version 240 |
| 101 | `101-v241.html` | `checkpoint-v241.html` | 2026-10-12 03:36 | 293.3 KB | 3302 | +10 | checkpoint at artifact version 241 |
| 102 | `102-v242.html` | `checkpoint-v242.html` | 2026-10-12 03:40 | 293.4 KB | 3302 | +0 | checkpoint at artifact version 242 |
| 103 | `103-v243.html` | `checkpoint-v243.html` | 2026-10-12 03:48 | 295.3 KB | 3325 | +23 | checkpoint at artifact version 243 |
| 104 | `104-v244.html` | `checkpoint-v244.html` | 2026-10-12 03:56 | 298.1 KB | 3358 | +33 | checkpoint at artifact version 244 |
| 105 | `105-v245.html` | `checkpoint-v245.html` | 2026-10-12 03:58 | 298.8 KB | 3370 | +12 | checkpoint at artifact version 245 |
| 106 | `106-v246.html` | `checkpoint-v246.html` | 2026-10-12 03:59 | 299.5 KB | 3376 | +6 | checkpoint at artifact version 246 |
| 107 | `107-v247.html` | `checkpoint-v247.html` | 2026-10-12 04:00 | 300.4 KB | 3385 | +9 | checkpoint at artifact version 247 |
| 108 | `108-v248.html` | `checkpoint-v248.html` | 2026-10-12 04:04 | 301.0 KB | 3394 | +9 | checkpoint at artifact version 248 |
| 109 | `109-v249.html` | `checkpoint-v249.html` | 2026-10-12 04:08 | 302.4 KB | 3412 | +18 | checkpoint at artifact version 249 |
| 110 | `110-v250.html` | `checkpoint-v250.html` | 2026-10-12 04:12 | 302.9 KB | 3418 | +6 | checkpoint at artifact version 250 |
| 111 | `111-v251.html` | `checkpoint-v251.html` | 2026-10-12 04:21 | 304.0 KB | 3429 | +11 | checkpoint at artifact version 251 |
| 112 | `112-v252.html` | `checkpoint-v252.html` | 2026-10-12 04:23 | 305.3 KB | 3447 | +18 | checkpoint at artifact version 252 |
| 113 | `113-v253.html` | `checkpoint-v253.html` | 2026-10-12 04:26 | 306.2 KB | 3454 | +7 | checkpoint at artifact version 253 |
| 114 | `114-v254.html` | `checkpoint-v254.html` | 2026-10-12 04:29 | 312.3 KB | 3515 | +61 | checkpoint at artifact version 254 |
| 115 | `115-v258.html` | `checkpoint-v258.html` | 2026-10-12 04:46 | 321.7 KB | 3593 | +78 | checkpoint at artifact version 258 |
| 116 | `116-v259.html` | `checkpoint-v259.html` | 2026-10-12 04:48 | 321.6 KB | 3592 | -1 | checkpoint at artifact version 259 |
| 117 | `117-v261.html` | `checkpoint-v261.html` | 2026-10-12 04:59 | 325.9 KB | 3638 | +46 | checkpoint at artifact version 261 |
| 118 | `118-v263.html` | `checkpoint-v263.html` | 2026-10-12 05:11 | 328.2 KB | 3666 | +28 | checkpoint at artifact version 263 |
| 119 | `119-v267.html` | `checkpoint-v267.html` | 2026-10-12 05:36 | 337.4 KB | 3736 | +70 | checkpoint at artifact version 267 |
| 120 | `120-v270.html` | `checkpoint-v270.html` | 2026-10-12 05:45 | 340.8 KB | 3775 | +39 | checkpoint at artifact version 270 |
| 121 | `121-v271.html` | `checkpoint-v271.html` | 2026-10-12 05:49 | 342.6 KB | 3790 | +15 | checkpoint at artifact version 271 |
| 122 | `122-v273.html` | `checkpoint-v273.html` | 2026-10-12 06:06 | 350.6 KB | 3851 | +61 | checkpoint at artifact version 273 |
| 123 | `123-v274.html` | `checkpoint-v274.html` | 2026-10-12 06:09 | 351.6 KB | 3859 | +8 | checkpoint at artifact version 274 |
| 124 | `124-v275.html` | `checkpoint-v275.html` | 2026-10-12 06:51 | 353.4 KB | 3878 | +19 | checkpoint at artifact version 275 |
| 125 | `125-v276.html` | `checkpoint-v276.html` | 2026-10-12 07:08 | 354.0 KB | 3882 | +4 | checkpoint at artifact version 276 |
| 126 | `126-v277.html` | `checkpoint-v277.html` | 2026-10-12 07:15 | 355.1 KB | 3885 | +3 | checkpoint at artifact version 277 |
| 127 | `127-v278.html` | `checkpoint-v278.html` | 2026-10-12 07:35 | 355.6 KB | 3890 | +5 | checkpoint at artifact version 278 |
| 128 | `128-v279.html` | `checkpoint-v279.html` | 2026-10-12 07:38 | 355.7 KB | 3890 | +0 | checkpoint at artifact version 279 |
| 129 | `129-v281.html` | `checkpoint-v281.html` | 2026-10-12 07:52 | 359.4 KB | 3919 | +29 | checkpoint at artifact version 281 |
| 130 | `130-v282.html` | `checkpoint-v282.html` | 2026-10-12 07:55 | 362.1 KB | 3939 | +20 | checkpoint at artifact version 282 |
| 131 | `131-v283.html` | `checkpoint-v283.html` | 2026-10-12 08:01 | 363.6 KB | 3954 | +15 | checkpoint at artifact version 283 |
| 132 | `132-v284-before-zygor.html` | `backup-v284-before-zygor.html` | 2026-10-12 08:08 | 363.7 KB | 3955 | +1 | v284, before the "Zygor-style" guide pass (per polish/BRIEF.md) |
| 133 | `133-after-engineer.html` | `checkpoint-after-engineer.html` | 2026-10-12 08:52 | 370.8 KB | 4050 | +95 | after an engineer pass (pre-polish), between v284 and the review fixes |
| 134 | `134-pre-review-fixes.html` | `checkpoint-pre-review-fixes.html` | 2026-10-12 08:59 | 402.8 KB | 4079 | +29 | before applying review fixes; last build before v285 |
| 135 | `135-v285-before-polish.html` | `backup-v285-before-polish.html`, `backup-v285-pre-E1.html` | 2026-10-12 19:06 | 404.7 KB | 4093 | +14 | v285: baseline of the polish project (PLAN.md review target; published artifact). Also main tests/baselines/v285.html; v285 (same file as backup-v285-before-polish) (identical to `main:tests/baselines/v285.html`) |
| 136 | `136-pre-css.html` | `polish/e1/pre-css.html` | 2026-10-12 19:45 | 418.7 KB | 4168 | +75 | E1 intermediate: before the dead-CSS removal step |
| 137 | `137-pre-noeffect.html` | `polish/e1/pre-noeffect.html` | 2026-10-12 20:22 | 391.3 KB | 3896 | -272 | E1 intermediate: before the no-effect-rule removal step |
| 138 | `138-v286-E1.html` | `backup-v286-E1.html`, `backup-v287-pre-E2.html` | 2026-10-12 21:40 | 386.1 KB | 3858 | -38 | v286: result of E1 (keys made explicit, MIG_V5, bug fixes, CSS cleanup). Also main tests/baselines/v287.html; v287 (same file as v286-E1; backup before E2) (identical to `main:tests/baselines/v287.html`) |
| 139 | `139-v288-pre-E3.html` | `backup-v288-pre-E3.html` | 2026-10-12 22:42 | 425.3 KB | 3805 | -53 | v288: result of E2 (data integration from data/*.json, generated E2-GEN block) |
| 140 | `140-v289-E3.html` | `backup-v289-E3.html`, `backup-v290-pre-E4.html` | 2026-10-12 23:24 | 440.0 KB | 3917 | +112 | v289: result of E3 (Next up / regional availability / icons); v290 (same file as v289-E3; backup before E4) |
| 141 | `141-v291-E4.html` | `backup-v291-E4.html`, `backup-v291b-pre-headfix.html` | 2026-10-13 00:48 | 447.1 KB | 3982 | +65 | v291: result of E4 (12 QA3 findings fixed, eputSync1 migration); v291 (same file as v291-E4; backup before the head fix) |
| 142 | `142-assassin-route.html` | `assassin-route.html` | 2026-10-13 01:04 | 448.2 KB | 3999 | +17 | v291 + head fix: final claude.ai artifact build before the repo; the source ported into main (src/index.html) |

## Not preserved here (and the private copy)

See `EXCLUDED.md`. In short: 855 app test screenshots, icon experiments, `node_modules`, build outputs, icon-remapped
test copies of backups, and files identical to `main`. The owner's in-game screenshots were not in the scratchpad but in
the session upload folder; they are in `evidence/`. No raw third-party web pages were saved during research, so there is
no copyrighted page text to withhold. Must not be public: `a2/repo/`, a clone of a third-party repo
(<https://github.com/sydname/a2>, 46 files, 561 KB incl. `.git`; re-clonable), 8 owner screenshots of GitHub / claude.ai
settings and phone screens, and the Claude Code session transcripts (`/root/.claude/projects/`, the full design history,
which contain personal information). Those are listed for a private copy only.
