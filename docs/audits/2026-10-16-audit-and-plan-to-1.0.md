# Daeva Companion: audit and plan to 1.0

2026-10-16 · for the owner, Isaac Jansson. Copy of the Claude Doc "Daeva Companion: audit and plan to 1.0"
(https://claude.ai/code/artifact/37732d7b-6100-47ba-b191-fb3fe9d69f96, revision 11). The plan itself now lives in ROADMAP.md
(PR #134); this file keeps the audit's findings and evidence.

## Summary

The app is not an engine yet: the guide content lives in data, but the game itself (stigmas, Daevanion boards, Kibelisks, skill costs) is written into the code. The fix is one invisible release after 0.3 that splits the code into an engine, an AION 2 game pack and per-class content packs. That split is also what makes truly parallel work possible.

This is a proposal for after 0.3.0. Nothing here changes 0.2.6 or 0.3.0, and new feature work after 0.3.0 waits until you've read it.

- **Engine vs data (CONFIRMED, partly).** Quests, gates, builds and sources are JSON with schemas. But roughly half of the 3,313 lines of app code name AION 2 concepts, and the save key itself says `aion2-assassin`. A WoW guide would need the UI and about half the core rewritten.
- **Architecture (CONFIRMED).** Speed is fine today: a full redraw takes 6 ms, the page is 155 KB zipped. The real gap is structure: one 1,853-line page script that every feature edits, which is why the pipeline keeps a list of files only one session may touch at a time.
- **Process (CONFIRMED gaps).** We plan well but don't size work before starting it, we keep three plan documents that disagree, nothing blocks the page growing, and we measure waste only since today.
- **0.3 to 1.0.** Add an Engine release right after 0.3. Everything after it is built as a module. The eight classes then become packs that can be built two at a time, instead of one release each.
- **Planning rule.** Every 0.x.0 opens with a planning pass: shaped specs, a size budget, which modules each item touches, then work starts. Details in the last section.

## Decisions only you can make

None of these block 0.3.0, which ships first. Decided 2026-10-16: #1 yes (engine code holds no AION 2 or Assassin reference; all game data lives in packs) and #2 yes, with save slots labelled \<playername>-\<class>-lvl\<level> over a stable internal id, so a level-up renames the label, never the key. The rest follow my recommendation in bold unless you say otherwise.

| # | Question | Options | Recommendation |
| --- | --- | --- | --- |
| 1 | Insert an Engine release (invisible) right after 0.3, before Smart Next up? | Yes (Smart Next up becomes 0.5, later releases shift by one) · No, split gradually inside each release | **Yes.** Smart Next up is the next big piece of ranking code; built after the split it lands in the right place once, not twice. |
| 2 | One clean save break in the Engine release (neutral key, save shaped for several characters and games)? | Yes, once, before characters · No, keep `aion2-assassin-route-v4` and migrate | **Yes.** The pre-1.0 rule allows it, there are no real players yet, and it removes a migration we'd otherwise carry forever. |
| 3 | How to ship the seven remaining classes | One class per release (0.8 to 0.14 today) · Two class packs in parallel per release | **Two at a time.** Once classes are packs that touch only their own folder, they can be built side by side. The real limit becomes your in-game checks, not the code. |
| 4 | Phone app path | Installable web app (PWA) first, store app later · Plan the store app now | **PWA first.** Decide the store app after sync. The App Store questions (an unofficial app using NCSoft's name and icons) are legal, not technical. |
| 5 | Second game | Design the engine so a second game is possible, but build nothing for it · Also prove it with a tiny sample pack | **Possible, plus a tiny test pack.** A 20-line fake game in the tests is the only way to prove the engine has no AION 2 left in it. It ships to no one. |

## Is game data separate from the engine?

Partly. The content is separate; the game is not. Today the code could power another AION 2 class with little work, but not another game.

**What is already right (CONFIRMED).** Quests, story order, gates, builds, claims and sources live in `data/**` as JSON with JSON Schemas, compiled by `tools/gen/gen.mjs` (`docs/DATA-FORMAT-V2.md`). The requirement evaluator is game-neutral: its building blocks are only all / any / level / story / done / skill level (`src/core/evaluator.js:88-108`). Save merging (`src/core/sync.js`) and the backup reminder are generic too.

**Where the game is written into code (CONFIRMED, file:line):**

| Where | What is hard-coded |
| --- | --- |
| `src/core/state.js:9` | Save key `aion2-assassin-route-v4`: the game and the class are in the name |
| `src/core/catalog.js:53-56` | Two milestones with their guide text ("Heart Gore 10 and Urugugu Canyon") written in code, not data |
| `src/core/migrations.js:30` | One player's skill levels as a one-time fix |
| `src/data/build.js:13,45` | Skill-point cost, stigma shard cost and specialty slot levels as formulas in code |
| `src/core/requirements.js:73,79` | Named AION gates ("Lest We Forget", the Daevanion board gate) as code rules |
| `src/main.js:61-62,173,257,494` | Metabot Altgard map links built inside the page templates |
| `src/index.html` | Skills, Stigmas, Route and other cards as fixed markup (`spCard`, `stCard`, …) |

**How much (CONFIRMED count, rough meaning).** A keyword scan for AION 2 terms (stigma, Daevanion, Kibelisk, Altgard, shards, …) hits 1,608 of 3,313 lines of app JavaScript, about 48%. In `src/main.js` it is 915 of 1,853 lines. The scan over-counts a little (words like "board"), so read it as "about half", not an exact figure.

**Could it run a WoW guide (GUESS, from the above)?** Not without a rewrite. The evaluator, save merging, backup, build pipeline, schemas and test harness would carry over, roughly a quarter to a third of the code. The page script and about half the core would not, because they assume AION's systems: Daevanion boards, stigmas, Kibelisk teleports, Sealed Dungeons. A real test settles it: write a tiny fake game pack and see what breaks (decision 5).

## The from-scratch design, and how far we are

If we started over, the app would be a small engine that knows nothing about any game, with everything AION 2 plugged in as packs and modules. Each layer only talks to the one below it through a written contract, so a feature is one module and two features in different modules never touch the same file.

_(Diagram in the original doc: target architecture, engine / game packs / content packs.)_

The engine (highlighted) is the only shared part; a new class is a new content pack, a new game is a new game pack.

**Each module declares four things:** the data it reads (a schema), the part of the save it owns (its own namespaced keys), the cards it draws, and what it offers Next up. A module comes with its own tests. Adding the end-game tracker (1.1) would then mean adding a module, not editing the page script.

**For speed and the phone (CONFIRMED measurements, this container, 2026-10-16):**

| Measure | Today | Comment |
| --- | --- | --- |
| Page size | 669 KB, 155 KB zipped | Fine for one class; all eight inlined would be several times that (GUESS) |
| Full redraw after a tick | 6.4 ms median, 20.8 ms worst (45 states) | Fast enough; no rewrite needed for speed |
| Phone-speed first load (4x slower CPU, no network) | 2.6 s | Acceptable now; the first thing to watch as classes are added |
| Page elements | 4,741 | High for a phone; drawing only open cards would cut it |

So performance is not the problem today; structure is. The ideal design would still add three things for the phone: load only the current class's pack, draw only what's on screen, and save through a storage adapter so a store app can use native storage instead of browser storage, which iPhone Safari can clear after weeks without a visit.

**Gap, layer by layer:**

| Layer | Today | Distance |
| --- | --- | --- |
| Content packs (quests, builds, sources) | JSON + schemas + generator | Small: split the folders by pack, give each pack a manifest |
| Game pack (AION 2 systems, formulas, card set) | Spread across core, `build.js`, `main.js` and `index.html` | Large: this is most of the Engine release |
| Engine core (evaluator, save, merge, ranking) | Pure, tested, but about half AION-specific | Medium: move AION rules out, keep the evaluator |
| Cards (UI) | One 1,853-line script, 56 HTML string templates, one global scope | Large: one module per card, each drawing from data it is given |
| Shell (web, artifact, store app) | Two builds from one source; offline already works | Small: add a storage adapter; the store wrap is Capacitor or similar later (GUESS, not yet tested) |
| Text | English written inside templates | Medium, only if other languages are ever wanted |

## What strong teams do that we don't yet

Your painting analogy is the core of it: the best teams spend their effort shaping work before anyone builds, and limit how much runs at once. We already do a lot right: golden-master tests, a decisions log, feature switches, automatic merges on green CI. The gaps are below, most important first.

| # | Practice | Where it comes from | Our gap (CONFIRMED unless marked) | What we'd do |
| --- | --- | --- | --- | --- |
| 1 | **Shape before you build; fix the time, flex the scope** | Basecamp's Shape Up: an "appetite" (how much a problem is worth) set before work starts | Specs say what to build but not how big it may get or what is out of scope (ROADMAP "How an objective is worked") | Every item gets a written appetite (S / M / L), no-gos and known risks before it is queued |
| 2 | **Parallel only along real boundaries** | Kanban work-in-progress limits; Little's law (more items open = each one finishes later) | Parallel lanes are policed by a list of files only one session may edit (`docs/team/DISPATCH.md`, "Serial files"), because most features touch `main.js` | After the Engine release, a lane = a module. Two items in one module never run together |
| 3 | **One plan, one place** | Common practice; each extra copy drifts | ROADMAP, HANDOFF and DISPATCH disagree (DISPATCH itself notes ROADMAP vs HANDOFF on the phone layout, and still lists an Opus cap that was dropped) | ROADMAP holds the plan; issue #114 the live queue; DISPATCH becomes the lane rules only |
| 4 | **Measure delivery and rework** | DORA metrics: deployment frequency, lead time, change fail rate, recovery time, and since 2024 rework rate | Waste counting started today (#114 "Smart mode"); no number per release | Each release notes: items shipped, failed or redone runs, fixes after release |
| 5 | **A performance budget that blocks** | Google's web.dev guidance; Lighthouse CI | The only speed check is non-blocking and timing-based (`tests/perf.js`); nothing stops the page growing | Blocking checks on page size and element count (stable numbers); timing stays advisory |
| 6 | **A ready check before work starts** | Scrum's "definition of ready" | Partly done: DISPATCH has a pre-trigger checklist; specs don't name files touched or the test that proves done | The planner refuses to queue an item missing appetite, module, acceptance test |
| 7 | **A short review after each minor** | Shape Up's cool-down; retrospectives | No step for it | One page per 0.x.0: what was slow, what was redone, one rule to change |
| 8 | **Contract tests per module** | Common in plug-in systems | None, since there are no modules yet | Each pack and module passes a shared conformance suite; the fake game pack proves the engine is neutral |

**How often to do backend and performance work (recommendation):**

- **Every pull request, automatically:** the size and element budgets, the existing golden and invariant suites. Costs no model time.
- **At the start of every 0.x.0 (the planning pass):** read the budget trend and the profile; schedule a fix only if a budget is within 20% of its limit.
- **Twice, deliberately:** a full architecture and performance audit before 1.0, and another before any store app.
- **Never as a standing item:** optimising without a measured problem is the waste you're trying to avoid.

Sources (search results only; this container could not open the pages, so check before quoting): [Shape Up overview](https://juststeveking.com/articles/shape-up/), [DORA five metrics, CD Foundation](https://cd.foundation/blog/2025/10/16/dora-5-metrics/), [Kanban and Little's law, InfoQ](https://www.infoq.com/articles/how-kanban-works), [Performance budgets in the build, web.dev](https://web.dev/articles/incorporate-performance-budgets-into-your-build-tools).

## From 0.3 to 1.0

With the Engine release inserted, 1.0 comes after nine more minor releases (0.4 to 0.12) instead of the eleven planned today (0.4 to 0.14), because the seven classes ship two at a time. Every feature after 0.4 is a module on the engine.

_(Diagram in the original doc: proposed releases 0.3 to 1.1.)_

Each box opens with the planning pass below; the classes box is where the engine pays off.

1. **0.3.0 Next up correctness.** In flight, unchanged.
2. **0.4 Engine and packs (new, invisible).** In order:
   1. Pack folders with a manifest: engine, AION 2 game pack, Asmodian Assassin content pack.
   2. AION rules and formulas (costs, slot levels, named gates, the two milestones in code) move into the game pack.
   3. Storage adapter, plus the one clean save break: a neutral key and a save shaped for several characters (decision 2).
   4. A card registry, then one module per card. Once the registry exists, cards split in parallel: the first real parallel lanes.
   5. A tiny fake game in the tests and a conformance suite every pack must pass (decision 5).
   6. Blocking size and element budgets in CI.
   - Done when: golden output is identical for the Assassin, the fake game passes, and `main.js` holds no AION 2 term.
3. **0.5 Smart Next up** (today's 0.4) as a ranking module.
4. **0.6 Characters and class picker** (today's 0.5). Smaller than planned, since the save shape is already done in 0.4.
5. **0.7 Backup and sync** (today's 0.6), behind the storage adapter.
6. **0.8 New and mid-level players** (today's 0.7).
7. **0.9 to 0.12 Classes, two packs per release** (Gladiator first, per D8). Each pack touches only its own folder, so two lanes run side by side. The limit is a named tester per class for the in-game check.
8. **1.0** Architecture and performance audit, whole-app UX review, docs pass. The strict save rule returns.
9. **1.1 End-game tracker** as a new module, built on the engine with no page-script edits.

**The rule for every 0.x.0: it opens with a planning pass, and nothing in it is queued until the pass is done.**

1. Read the previous minor's one-page review: items shipped, failed or redone runs, what was slow.
2. Shape each item: problem, appetite (S / M / L), no-gos, the module(s) it touches, the test that proves it done, the model that builds it.
3. Draw the lane map: items sharing a module run in order; items in different modules may run together, at most three.
4. Check the budgets; schedule a performance item only if one is within 20% of its limit.
5. List what needs you (in-game checks, mockups, money). Only true blockers become a tracker To-do.
6. Write the result into ROADMAP and the #114 queue. One planning session writes it; a separate session that didn't write it reviews it.

By default, the planner queues only items that went through this pass. A patch release (0.x.y) needs no planning pass.

## Evidence: what was checked

All on `main` at commit `21c3fb6` (after the 0.2.6 release), 2026-10-16.

| Claim | How it was checked |
| --- | --- |
| Content is JSON with schemas | `data/**`, `data/schema/`, `tools/gen/gen.mjs`, `docs/DATA-FORMAT-V2.md` read |
| About half the code names AION 2 | Keyword scan of `src/core/*.js`, `src/main.js`, `src/data/*.js`: 1,608 of 3,313 lines |
| Hard-coded spots | Each file:line in the engine section opened and read |
| Page size | `npm run build`: `dist/index.html` 669,290 bytes, 154,736 zipped; artifact 790,763 bytes |
| Redraw speed | `tests/perf.js` over 45 states: median 6.4 ms, worst 20.8 ms (one state over the 15 ms advisory limit) |
| Phone-speed load | Playwright, 390 px, CPU throttled 4x, local file: DOMContentLoaded 2.6 s, 4,741 elements |
| Plans disagree | `docs/team/DISPATCH.md` lines 332-333 and 514 vs issue #114 and ROADMAP |
| Pipeline state | Issue #114 read; last 60 Actions runs had no failures; all \~85 pull requests so far merged |
| Practices | Web search results only; the pages themselves could not be opened from this container |

Not checked: real phones, real network speed, and how a store app would behave. Those are tests for the 1.0 audit.
