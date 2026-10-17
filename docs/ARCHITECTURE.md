# Architecture

Daeva Companion (unofficial AION 2 companion; today the Asmodian Assassin leveling guide). The app is one static HTML page with no framework and no runtime dependencies. Its source is split into a few files
(0.2 P1–P3) that `scripts/build.mjs` inlines back into one HTML file per deliverable with esbuild:

| Source | What |
|---|---|
| `src/index.html` | page shell: head, markup, `@web-only` markers, and the tags naming what is inlined |
| `src/styles/fonts.css`, `src/styles/index.css`, `src/styles/brand.css` | the styles (the `@font-face` rules; the page's styles; the brand lockup in the header and footer), inlined verbatim. Every colour, radius, spacing step and shadow is a token in the `:root` block at the top of `app.css` (`docs/design-system.md`; `tests/tokens.mjs` enforces it in every `.css` under `src/styles/`) |
| `src/styles/app.css` | the tokens, the page frame (layout, header, rail, footer, toast, export / import) and the rules several cards share (milestone-style step cards, checklist rows, the top cards' hero rows and lists, buttons, tips); first in `index.css` |
| `src/styles/cards/*.css`, `src/styles/packs/aion2/*.css` | one stylesheet per card (0.4 P4d), moved verbatim from `app.css` in their original order: the engine's cards (`journey.css`, `ahead.css`, `nextup.css` with its pop-out, `milestones.css`, `route.css`, `sources.css`, `undo.css`) and the AION 2 pack's (`progress.css`, `ascension.css`, `areas.css`, `skills.css`, `daevanion.css`, `cube.css`, `stigmas.css`, `build.css`). `index.css` `@import`s `app.css`, then these in page order; the build puts each file in place, so both builds carry one inlined stylesheet. A card file comes after all of `app.css`: a card rule that would then beat a later `app.css` rule it loses to today (same element, property and specificity) stays in `app.css` until a feature splits the pair |
| `src/main.js` | the page shell (ES module entry, ≈380 lines, still one global scope; no card of its own since 0.4 P4c): loading and saving, the pack wiring (`usePack`, the page API names the suites call, the AION 2 helpers it hands on), registering the cards, `render()` and `update()` calling them (§2), layout fitting (`fitRail`, `fitSkills`), the header (Basic / Advanced), the "i" popovers, the toast and sounds, the number steppers, export / import, *Report a problem*; it hands the cards the names they read (`aion2UsePage`, `useCardPage`) |
| `src/core/*.js` | the engine (0.2 P3; since 0.4 P2b no game term, `docs/design/0.4-engine-contract.md`): `pack.js` (`definePack`, `usePack`, `activePack`: the one pack object the engine reads a game through; `packClasses`), `state.js` (key, defaults, loading, `char(state)`, `charFields()`), `chars.js` (add, switch, rename, remove a character, 0.5 P17), `migrations.js` (load-time steps), `catalog.js` (`itemByK`, `cardRows` over the pack's catalog), `requirements.js` (the evaluator glue `gatesOf` over the pack's graph and transforms, the switches over the pack's table, done / open, the story chain, objectives, milestone counts, Next up steps), `blockers.js` (blocker-chain text), `nextup.js` (Next up ranking over the engine's and the pack's producers, 0.4 P2c), `evaluator.js` (0.3 requirement evaluator over the pack's `data.graph`), `sync.js`, `backup.js`, `storage.js` |
| `src/cards/*.js`, `src/cards/*.html` | the engine's cards (0.4 P4a): each exports its spec for the card registry (`src/core/cards.js`, §2); its markup is put into the shell by the build's `@card` line. `sources.js` / `sources.html` (Confidence, Sources; P4a); moved verbatim from `main.js` in P4c: `nextup.js` / `nextup.html` (Next up: `renderNow`, `nowCard`, the hotkeys, the pop-out), `milestones.js` / `milestones.html` (the milestone cards: `renderMilestones`, `cardHTML`, counts and tags, the rail's milestone list, the tick handler, regional quest rows, the filters), `route.js` / `route.html` (Route rules), `journey.js` / `journey.html` (Journey: the level control, `renderQuest`, `renderQuestSubs`, story chips and lines), `ahead.js` (Later, `renderAhead`, a section of Journey), `undo.js` (`renderUndo`), `characters.js` / `characters.html` (0.5 P18: the character switcher in the header; the shell hands it `onSwitch` / `onAdd`), and `page.js` (`useCardPage`: the shell's names and the pack's tables and helpers these cards still read, imported under their old names; `src/cards/` may import only `src/core/` and `src/cards/`, so the shell hands them over until P5a–d move them behind the pack object). Handlers wire in each card's `mount`, so a card module touches no DOM at import (the Node core bundle imports `src/cards/`) |
| `src/packs/aion2/*.js` | the AION 2 pack's code (0.4 P2b): `pack.js` (`aion2Pack`: data, catalog, `charFields`, `keptRules`, `gateChanges`, `graphTransforms`, story hooks, `hopName`, `locate`, `skipLocation`, `onLoad`), `rules.js` (`KEPT_RULES`, `GATE_CHANGES`, the graph transforms), `requirements.js` (regional quests, the story card's level gate, objective grammar and Kibelisks, skill points and lines, the Daevanion board, stigmas, Sealed Dungeons and strongholds, the Build drawer's keys, hop names, the last-location locator), `catalog.js` (the data finished into milestones, areas, lookups), `ascension.js` (0.3 E8: the Journey card's Ascension bar; display only), `load.js` (the stigma pick pinning), `nextup.js` (0.4 P2c: the Next up producers, the story card's "Meanwhile" and Kibelisk) |
| `src/packs/aion2/cards/*.js`, `*.html` | the AION 2 pack's cards (0.4 P4b, moved verbatim from `main.js`; each exports its spec, `aion2Pack.cards` lists them, `index.js`): `skills.js` (Skills, `renderNext`), `daevanion.js`, `stigmas.js`, `cube.js` (the Cube bars), `areas.js` (Dungeons & Strongholds), `progress.js` (Progress, `renderCollection`), `build.js` (the Build drawer: `renderRotation`, `renderStacks`), `ascension.js` (0.4 P4c: the Ascension bar under Journey's timeline, `renderAscension`; since P5c a pack section of Journey, `journey.after-timeline`, registered by `main.js`), `journey-sections.js` (0.4 P5c: the AION 2 parts of the Journey card, handed over by the Ascension section's mount), their markup (put in place by the build's `@card` lines), `maps.js` (every Metabot map link), `shared.js` (helpers only these cards use) and `page.js` (`aion2UsePage`: the shell's names they still read, `state`, `save`, `update`, …, imported under their old names until they become clean modules). Handlers wire in each card's `mount`, so a card module touches no DOM at import (the Node core bundle imports the pack) |
| `src/packs/aion2/data/*.js` | the data tables under their page names: since 0.2 step 5b mostly re-exports of the generated module, plus what stays code: `milestones.js` (GATES, STEPS: token text expanded), `build.js` (SP_SKILLS, SP_STEPS, SP_SLOTS, RMB_STACK, node types, costs), `areas.js` (NO_AREA), and `markup.js` (the pure text helpers: `I`, `T`, `seq`, `hideouts`, `expandTokens`, …) |
| `src/packs/aion2/data/generated.js` | not a file: the build compiles this module from `data/**` (data format v2) with `tools/gen/gen.mjs`, in memory |
| `src/packs/aion2/data/gate-graph.js` | not a file either: `GATE_GRAPH`, the live gates compiled by the same generator; only the pack object (`src/packs/aion2/pack.js`) imports it and hands it to the engine as `data.graph` |
| `src/packs/aion2/data/gate-proposed.js` | not a file either: `GATE_PROPOSED`, every record's `proposed` gate compiled the same way (0.3 E4); only the pack object imports it (`data.proposed`); the evaluator reads it only for the ids in its `opts.apply` |
| `src/site.js` | the standalone site's own script (storage persistence, service worker registration); `@web-only` |

`src/index.html` is not runnable by itself: `npm run build && npm run serve`. The two deliverables must behave the same:

| Build | Where | Differences |
|---|---|---|
| `dist/` | GitHub Pages, <https://daevacompanion.com/> | full `<head>`, icons at `assets/icons/*.png`, manifest, service worker |
| `dist-artifact/index.html` | claude.ai artifact (single file) | no document skeleton (claude.ai adds one), icons at `/_blob/<id>`, no SW / manifest |

Branding (Daeva Companion) lives in the shared shell (title, header lockup as inline SVG, footer), so the frozen claude.ai
build (DECISIONS D4) carries the new name too; it needs no new blob. Favicon, manifest and app icons are web-only
(`public/`), drawn by `tools/brand/build.py` from `brand/`.

## 1. Saved progress (must not break from 1.0; see the pre-1.0 exception below)

People level for weeks with their progress in `localStorage`. A broken key silently drops their ticks, and there is
no server copy. Rules:

> **Pre-1.0 exception (owner, 2026-10-16):** there are no real players yet, so a change may break saves for a better
> design. Do it cleanly: bump the storage key (`companion-save-v5` → `-v6`) so the app starts fresh, never read or
> crash on an old save, and note it in the CHANGELOG. See CLAUDE.md. 0.4 (P3c) made one such break: save v5. The rules
> below are the strict rules that return at 1.0.

- **The storage key is `companion-save-v5`** (0.4 P3c; `…:before-import` holds the state an import replaced). No
  game, class or player name in it. The 0.3 key `aion2-assassin-route-v4` is never read (not to migrate, detect or
  warn); its data stays in storage untouched. From 1.0 the key is kept forever.
- **Item keys are permanent.** A key that is removed is retired, never reused for something else (`retired.json` in
  each pack lists them: `g45:1`, `g45:0`, `hold:0`, the position keys replaced in E1, …).
- **Migrations only add** (from 1.0). They copy or tick, set a one-time flag, and leave the old data in place, so an
  older build can still read a newer save. v5 has none yet.
- **New fields must default safely** when absent: every existing save lacks them.
- **The player name and the label never leave the save unencrypted**: no name or label (`labelOf`) in a storage key,
  the export file name, a URL, the *Report a problem* link or a log; the slot id is random, never derived from the
  name, class or level (`core` purity checks, `save` and `site` suites).

### State

`state` is one JSON object, loaded at startup by `loadState(text, { now, newId })` (`src/core/state.js`): a v5 save is laid
over the defaults (`DEFAULT()`, and `CHAR_DEFAULT()` under each character); anything else (no save, unreadable text,
another shape, a pre-0.4 save) gives a new save with one empty slot (`newSave`, the id from `newId`,
`src/shell/ids.js`: `crypto.randomUUID()`, else a v4 UUID from `getRandomValues`). It is written back by `save()` after every change. Every write (`save()` and the one-time steps below) goes through `storeState()`, which shows the
"couldn't be saved" banner (`#saveWarn`, with the Export action) when the write fails and hides it after
the next write that works; what is written, and under which key, is unchanged.

**Storage adapter** (0.4 P3b). The page never calls `localStorage` itself: load, `storeState()` and Import go through a
storage object with the synchronous interface of `src/core/storage.js` (`get(key)` → text or `null`, `set(key, text)`
→ `true` / `false`, `remove(key)`). The browser one is `src/shell/storage-web.js` (the only file in `src/` that touches
`localStorage`; `set` returns false where `setItem` throws); `memoryStorage(quota)` in the core is the Node one the
`core` suite tests. Same keys, same text as before the adapter. A native store app swaps the adapter (and reads its
save into memory before start-up, so the interface stays synchronous).

The only other localStorage key is `…:before-import` (see Import below). On the standalone site the page asks
`navigator.storage.persist()` when it loaded saved progress, at most once per browser session (flag in
`sessionStorage`, so the localStorage keys stay as they are; the `golden` suite records them).

Shape (save v5):

```
{ v: 5, savedAt, current: <slot id>, chars: { <slot id>: { id, pack, class, name, created, ...charFields() } },
  mode, open, hide, hideCards, hideOpt, areaLv, …, backup }
```

A character (`chars[id]`) has its identity (`CHAR_META`: `id` (random, stable), `pack` (`aion2/asmodian/assassin`),
`class` (`assassin`), `name` (`""` = no name; set in the New character form, 0.5 P18), `created` (ms)) and its progress fields below. Its label
`labelOf(c)` = `<name>-<class>-lvl<level>` (the name part left out while empty: `assassin-lvl30`) is derived on read,
never stored; a level-up changes the label, never the id.

Characters are added, switched, renamed and removed by the pure functions of `src/core/chars.js` (0.5 P17; the header switcher, 0.5 P18, adds and switches through them):
`addChar(state, { class, name, now, id })` (the new slot becomes current), `switchChar`, `renameChar` (`cleanName`:
trimmed, white space folded, at most `NAME_MAX` code points) and `removeChar` (never the last slot; a removed current
moves `current` to the first remaining slot). Each returns a new save and leaves every other slot the same object. The
class a new character may have comes from the pack's `classes` (`packClasses`; a pack without it offers its
`character`), so only a class with a guide pack can be picked. `merge()` keeps a slot found on one side only, so a removed
character comes back from another device's save until 0.6 (sync) records removals.

| Field | Meaning |
|---|---|
| `v`, `savedAt`, `current`, `chars{id: character}` | save version (5), time of the last saved progress change (ms), the current slot, the slots |
| character: `checks{key: bool}` | every tick: milestone steps, regional quests, dungeons, strongholds, skill levels, board nodes |
| character: `started{key: 1}` / `areaRun{key: ms}` | regional quest in progress / Sealed Dungeon run started (two-click boxes) |
| character: `level`, `quest`, `storyEnd` | character level (changes only via Level up / − / + / slider), current main story quest, end-of-data marker |
| character: `qsteps{quest: [i]}`, `qsub{quest: {i: [j]}}` | story objective ticks, keyed by **quest name** |
| character: `rqSnooze{key: level}` | "Not in game yet" snoozes (cleared by Level up / prerequisite turned in) |
| character: `stLv{name: lv}`, `stShards`, `stPick{slot: name}` | stigma levels, shards, the stigma picked per slot |
| character: `stones`, `pendSt`, `pendCr`, `dvTotal`, `dvCost{key: n}`, `dvAdj`, `dvLast…` | Wisdom Stones / pending Cube items / Daevanion points and node costs |
| character: `mt` | per-item change times (see Change times below) |
| `mode` (`basic`/`advanced`), `open{id}`, `hide`, `hideCards`, `hideOpt`, `areaLv`, … | view settings (per device) |
| `backup{lastExportAt, since, nudgeAt, a2hsAt}` | 0.2.5 save safety: this browser's backup times (ms, all optional); top level, not synced (`src/core/backup.js`) |

**Character data goes through `char(state)`** (0.2 P3), which returns `state.chars[state.current]`. The character's
fields (`charFields()` in `src/core/state.js`: the engine's `ENGINE_FIELDS` plus the pack's `charFields`, each with
how `merge()` syncs it: `"map"`, `"register"` or `"local"`) are read and written only as `char(state).<field>`; the `core` suite
fails on a direct `state.<field>` for a character field anywhere in `src/`. The switcher (`src/cards/characters.js`, 0.5 P18) lists the slots and adds one with a
name; a switch or a new character is stored and the page reloads (`useSave` in `main.js`), so every card is drawn for it
from the start. Rename and remove come with P19.

### Change times and `merge()` (0.2 step 5c)

`src/core/sync.js`, spec in docs/DATA-FORMAT-V2.md §13. `mt` mirrors the character's synced fields with `[seconds, value]`
stamps (`null` = removed). Stamps are not written at each mutation: `storeState()` calls `stampSave()`, which diffs the
character against `mt` and stamps what changed with the write's time, bumped past the item's previous stamp (per-item
Lamport bump, so a device with a slow clock still wins with a newer edit), and sets `savedAt`; writes that change only
view settings leave `savedAt` alone, so a reload stores the same text. A v5 save is born with `mt` (the fresh start
stamps its defaults at time 0). `merge(local, remote)` (not used by the UI yet) works per slot id: a slot on one side
only is kept, a slot on both sides keeps the later change per item; `v` / `savedAt` take the larger; `current`, the
view settings and `backup` stay the local save's;
`lastConfirmedLocation(char)` derives the zone of the newest dated tick of a located item (the pack's `locate`), skipping
the keys the pack's `skipLocation` names (AION 2: steps with `ascensionQuest`, from `data/packs/aion2/asmodian/assassin/guide/steps.json`, emitted onto the GATES items by `tools/gen/gen.mjs`).
`whereNow(char)` (`src/core/place.js`, 0.5 P10; design `docs/design/0.4-smart-next-up.md` §4) extends it without
changing it: the newest dated stamp of `checks`, `started`, `qsteps`, `quest` and the pack's `place.fields` that the
pack's `place.at(path, value)` places, as `{ via, t, zone, pt }` (same tie-break), or `null` (no such stamp, or a pack
without `place`); `byPlace(here)` orders by zone, then same-map distance, then catalog order. The AION 2 pack's travel
code (`src/packs/aion2/travel.js`: bound Kibelisks, the "Bind X" row, teleport vs walk) derives from the save and
`TRAVEL_RULES`; nothing on the page calls either yet. The `core` suite tests both; the `save` suite tests the load / save / import path in the browser.

### Item keys

- Milestone (`GATES`) and route-rule (`STEPS`) items carry an explicit `k`. Older items keep their historical position
  key written out (`"g22:1"`, `"build:0"`); never derive a key from an array index.
- Regional quests: `rq:<quest id>` (Metabot / game id). Sealed Dungeons: `sd:<slug>` (`g10h:` kept for Lv 10).
  Strongholds: `sh:<slug>`. Skills: `sp:<skill>:<level>`; specialty slots `sp:<skill>:spec`, `:spec2`, `:spec3` (0.3 E7: open
  at effective skill level 8 / 12 / 20, the evaluator's `skillLv` atom = highest ticked line + owned plan board nodes on the
  skill; slots 2 / 3 are `SP_SLOTS`, no milestone rows, written only when ticked). Board nodes: `dv:<node>` (Nezekan), `dv:z:` / `dv:v:` /
  `dv:t:<node>` (Zikel / Vaizel / Triniel).
- Milestone step gates (read by `stepsOf` for Next up): `story: X` / `after: X` = the story has **reached** X (your
  current quest is X or later); `turnedIn: X` = X is **turned in** (current quest past X, or X is the last covered
  quest and `storyEnd` is X); `byStory` = the step *is* story quest X: ticked by *Turned in*, hidden from Next up while
  you're on X and, since 0.3 E4, done by derivation once you're past it (never written: the row shows a ticked, disabled
  box, "done in the story"; the stored tick stays as it was and counts again if the story moves back). Derived the same
  way (E4, switches in `src/packs/aion2/rules.js` `GATE_CHANGES`, the pack's `gateChanges`): "Put … on E" once its slot is equipped, `g22:0` /
  `g32:dreams` once their wrapper story quest is turned in, a regional quest once a follow-up of it is picked up or
  turned in, the Krao Cave / Fire Temple "Expedition opens" rows and the Graverobber Den stronghold once their story step
  is ticked (`storyStep` atom) or the story quest turned in (E9). A regional quest's story gate is "turned in"
  (switch `regionalTurnedIn`, off = the 0.2 "reached"). Milestone counts and tags count derived rows as done; so does
  the Progress tally of one-time clears (`clearDoneOf`, switch `clearTally`): a derived regional quest or stronghold
  counts with its clear reward. The Cube and the stone / crystal totals still only move on a tick, so the reward is
  never written or counted twice.
- Story objective ticks (`qsteps`, `qsub`) are keyed by quest name and the objective's permanent `i` (gen checks
  `i` = position, never renumbered). The objective text in `QUEST_STEPS` is parsed (sub-steps, Kibelisk, talk-only), so
  a step `note` lives in its own table `QUEST_STEP_NOTES` and is only joined on for display (`objTextOf`, switch
  `stepNotes`); a note can never change a sub-step count or a save index.
- Quests are placed into milestones **at runtime** by recommended level, so moving one between milestones never
  changes its key.

### Load-time steps (in load order)

All of them are `migrate(state, hadSave, store, now)` in `src/core/migrations.js`; the page passes its `storeState` as
`store` and its time in seconds as `now`. Save v5 (0.4 P3c) is a clean break, so there are no steps for old shapes:
`migV5` (`MIG_V5`), the player seeds `seedLv12` / `stTriniel1` / `dvReset1`, `eputSync1`, `g45Split1`, `stampV1` and
`backup1` were removed with the pre-0.4 saves they were for.

1. Fresh start (no v5 save): Lv 1 on the first story quest (the pack's `data.story.quests`), cleared milestones folded,
   `backup = { since: now }` (ms, the export nudge's baseline), the defaults stamped at time 0. Writes nothing itself.
2. The pack's load hook (`onLoad(save, c, { fresh })`, in memory only; AION 2: `src/packs/aion2/load.js`): equipped
   stigma slots without a pick are pinned to the plan name they were equipped with (plan order can change).
3. "Turned in" on the last covered quest (`storyEnd`) moves on to the next quest once the data covers more (0.3 E10: a
   save that ended at "Forgotten Commander" moves on to "Daeva Trapped in a Nightmare"). Writes the save.

**Import** accepts a v5 export only (`parseExport`): any other file, a pre-0.4 export included, gets "This file is from
a version before 0.4 and can't be loaded." and nothing changes. A v5 file replaces the state (after confirming), the
old one is kept under `:before-import`, and the file's `backup` is replaced with `{ since: now, lastExportAt: now }`
(the import counts as a backup); the steps above run on the reload. **Export** writes the save as it is to
`companion-save-<date>.json`.

Adding a load-time step (from 1.0): give it a new flag, make it idempotent and additive, run it after the existing ones
in `migrate()`, save only if `hadSave`, and add a case to `tests/core/migrations.test.mjs` (additive, idempotent, write
points) and to the `save` suite (`tests/save.js`).

## 2. Render pipeline

`src/main.js` is the shell (0.4 P4c): it draws no card itself. Every card is a module in `src/cards/` (the engine's) or
`src/packs/aion2/cards/` (the pack's) and is called through the registry (below).

- `render()` builds the static DOM: the milestone cards (`renderMilestones`, `GATES` via `cardHTML`) and Route rules
  (`renderRoute`, `STEPS`), on every call (Sync levels and Respec call `render()` again), then `mountAll` for the
  registered cards (below).
- `update()` runs after every change (≈10 ms; the non-blocking `perf` suite checks it stays under 15 ms). Inside one
  `gatesPass`, `updatePass` calls, in this order: `milestones` (counts and tags: Cleared / Missed / Now / Side quests,
  the rail's milestone list, the derived boxes), `route` (Route rules counts), `journey` (the level control), `areas`,
  `milestoneFilters` (the milestone filters and toolbar), `skills` (`renderNext`, which also draws Progress, the Build
  drawer, Journey's timeline, Later, Ascension, the story chips and lines, Daevanion and Undo), `cube`, `stigmas`,
  `fillStigmaText` and `syncQRun` (milestone row text), `nextup` (`renderNow`), then `syncExpand`. Layout fitting runs
  in `requestAnimationFrame`, not inside `update()`.

### Card registry (0.4 P4a)

`src/core/cards.js` (pure, no DOM; contract: `docs/design/0.4-engine-contract.md` §4). A card is a spec: `id` (unique),
`slot`, `order`, `root` (the DOM id of its outer element), `sections` (names other cards may fill), `mount(el, ctx)`
(once) and `update(ctx)` (every `update()`; `null` = mount only). Card modules export specs and never register at import
time; `main.js` registers them (`registerCard`) before the first `render()`.

- **Slots**, walked in this order: `rail` (`aside.rail`), `top` (`.top-grid`), `main` (`main`, after the top grid), `foot`
  (`footer.foot`), `drawer` (`aside.statdrawer`); a section slot is `"<cardId>.<section>"` and runs right after its card.
  An unknown slot, a duplicate id, a duplicate `order` in a slot or a section its card doesn't declare throws at
  registration.
- **Order rule:** `order` decides the call order within a slot (ascending, steps of 100 so a card fits between two), never
  the DOM position: the markup's place in `src/index.html` does.
- **`render()`** resolves each registered `root` with `getElementById` and calls `mountAll(els, ctx)`; a card is
  mounted once (a later `render()` mounts only cards not mounted yet). **`update()`** calls
  `updateCard(id, ctx)` for each card at the spot its old code stood (inside its `gatesPass`), so the call order stays
  the pre-0.4 one. Not `updateAll(ctx)` yet: the cards still depend on each other's DOM, and the slot order (rail, top,
  main) would run the milestone filters after Skills redraws the board rows they hide, and Next up before the milestone
  text its step titles read (`stepHTML`); `updateAll` takes over once P5a–d make the cards independent. A card another
  card draws (`renderNext` calls `renderCollection`, `renderRotation`, `renderDaevanion`, `renderQuest`, …) registers
  with `update: null`.
- **`ctx`** = `{ state, c: char(state), pack: activePack(), basic, ev }` (`cardCtx()` in `main.js`, built once per
  `render()` / `update()`; `ev` is a getter for `gatesOf(c)`).
- **Markup:** a card's static markup lives in its own file (`src/cards/<id>.html`, a pack's in
  `src/packs/<game>/cards/<id>.html`); the shell keeps the line `<!-- @card cards/<file>.html -->` (or
  `<!-- @card packs/<game>/cards/<file>.html -->`) where it stood and the build puts the file there as it is (§4).

| Slot | Order | Card | Module | Mount / update |
|---|---|---|---|---|
| `rail` | 100 | `progress` (Progress; no id) | `src/packs/aion2/cards/progress.js` | mount; drawn by `skills` |
| `rail` | 200 | `journey` (Journey; no id; sections `ahead`, `after-timeline`) | `src/cards/journey.js` | mount, update (the level control); `renderQuest` drawn by `skills` |
| `journey.ahead` | 100 | `ahead` (Later, `#ahead`) | `src/cards/ahead.js` | drawn by `journey` |
| `journey.after-timeline` | 100 | `ascension` (`#asc`) | `src/packs/aion2/cards/ascension.js` | mount (hands Journey the pack's parts, `journey-sections.js`); drawn by `skills` |
| `rail` | 300 | `areas` (`#areas`) | `src/packs/aion2/cards/areas.js` | mount, update |
| `top` | 100 | `skills` (`#spCard`) | `src/packs/aion2/cards/skills.js` | mount, update |
| `top` | 200 | `daevanion` (`#dvBox`) | `src/packs/aion2/cards/daevanion.js` | mount; drawn by `skills` |
| `top` | 300 | `cube` (no root: `#spCube`, `#dvCube`) | `src/packs/aion2/cards/cube.js` | mount, update |
| `top` | 400 | `stigmas` (`#stCard`) | `src/packs/aion2/cards/stigmas.js` | mount, update |
| `top` | 500 | `undo` (`#dvUndo`, in the Daevanion card) | `src/cards/undo.js` | mount; drawn by `daevanion` |
| `main` | 50 | `characters` (`#charCard`, in the header: no slot of its own, so it takes the first free order in `main`) | `src/cards/characters.js` | mount, update (the label) |
| `main` | 100 | `nextup` (`#nowStar`) | `src/cards/nextup.js` | mount, update |
| `main` | 200 | `milestones` (`#gates`) | `src/cards/milestones.js` | mount, update; drawn by `render()` |
| `foot` | 100 | `route` (`#routeCard`) | `src/cards/route.js` | update; drawn by `render()` |
| `foot` | 200 | `confidence` (`#confCard`) | `src/cards/sources.js` | mount only |
| `foot` | 300 | `sources` (`#srcCard`) | `src/cards/sources.js` | mount only |
| `drawer` | 100 | `build` (`#statDrawer`) | `src/packs/aion2/cards/build.js` | mount; drawn by `skills` |

Confidence and Sources draw `CONF`, `SOURCES` and `SRC_SITE`, which are the pack's data; `src/cards/` may not import a
pack, so `main.js` hands the tables to `sourcesCards(data)` until P5d moves them behind the pack object. The other engine
cards (P4c) read the pack's tables and helpers, and the shell's `state`, `save`, `update`, …, through `src/cards/page.js`
(`useCardPage`, called by `main.js` before the first `render()`), the way the pack's cards read the shell through
`aion2UsePage`. `ascension` is the pack's section of Journey (`journey.after-timeline`, 0.4 P5c); `main.js` registers
it after the engine cards, since a section's card must be registered before the section (`aion2Pack.cards` is
registered first). Its mount hands the Journey card the pack's parts (`useJourneyParts`: what a level change does
beside the level, the Level up gains, an objective's place, what a story line opens; `src/packs/aion2/cards/journey-sections.js`),
so `src/cards/journey.js` names no AION 2 term (the `core` suite scans it).

**Proving a card move:** `tests/support/dom-snapshot.mjs` writes `document.body.outerHTML` (script text emptied), the
form state (checked / value / disabled of every field) and the stored save for 20 states (fresh, Lv 13, 27, 30, 45 ×
Basic / Advanced × 390 / 1500 px; fixed clock and slot id) and compares two folders (usage in its header: `main` built in a
worktree vs the branch). A card move's PR pastes "identical" for every state. **Proving a style move:**
`tests/support/style-snapshot.mjs` (0.4 P4d) does the same for `getComputedStyle` of every element and drawn `::before` /
`::after` (136 longhands: box, font, colour, display, position, grid / flex, …; animations paused at their start) in the
same 20 states. It sees no hover, focus, pointer: coarse, reduced motion or pop-out state, so a move of rules also needs
the cascade argument: no moved rule now comes after a rule it used to lose to on the same element and property.
- **Next up**: `rankNext(state, { basic })` (`src/core/nextup.js`) ranks one-task cards. The engine makes milestone
  steps (`openSteps`: the step gates below), missed steps, the story card (the pack's `story.levelGate`, `meanwhile`,
  `cardFields`), advice and the next milestone's Later card; the pack's `nextUpProducers` (`src/packs/aion2/nextup.js`,
  0.4 P2c) make in-progress dungeon, Cube items, skill buy, board node, stigma equip / upgrade, the regional-quest card,
  Sealed Dungeon / stronghold picks and the Later skill cards. Entries are sorted by phase (P0 §2 "Next up phases"),
  then the engine applies the Basic filter and the 8-card cap. Each card is `{ kind, act, … }` data; `renderNow` turns it into HTML (`nowCard`; a step's title is its `ns`
  or the first bold phrase of its milestone row). It can live in a Document Picture-in-Picture window (`#nowStar` moves
  there).
- **Regional availability** (`rqStatus` in `src/packs/aion2/requirements.js`, page name `rqAvail`): unlock level (or recommended level for quests with no prerequisite data,
  `rqOpenLv`) + story at/after its story gate + regional prerequisites turned in. Used by Next up, tips, Progress and
  milestone dimming.
- Basic mode is mostly CSS (`body.basic`) plus a few branches in `renderNow` / `renderNext`.

## 3. Data pipeline

```
web sources ──(research sessions, by hand)──▶ data/packs/** (v2) ───tools/gen/gen.mjs──▶ module src/packs/aion2/data/generated.js (in memory, at build time)
                                                │                     ├─▶ data/DATA_SOURCES.md (committed: every URL and what it backs)
                                                │                     └─▶ tools/gen/out/ (npm run gen: gen-report.json, generated.js; not committed)
                                                └── data/schema/*.schema.json (JSON Schema 2020-12; ajv 8 Ajv2020, strict)
```

- **Format v2** (0.2 step 5b; spec `docs/DATA-FORMAT-V2.md`), in packs since 0.4 P1 (DATA-FORMAT-V2 §2.1): a folder
  below `data/packs/` with a `pack.json` (`id` = the folder, `kind`, `parent`, `uses`, `files`). The game pack
  `aion2/` (`sources.json`: sites, access, licence, use; `game-builds.json`; rules, boards, items); the class pack
  `aion2/classes/assassin/` (class, skills, stigmas, every board node); the faction pack `aion2/asmodian/` (story,
  Ascension and regional quests, Sealed Dungeons, strongholds, zones, unlocks); the guide pack
  `aion2/asmodian/assassin/` (builds, `retired.json`: keys never to be reused, and `guide/`: milestones, steps, tips,
  claims, confidence, the guide's own text; `claims-notes.md` explains the claim verdicts). The guide extends the
  faction and uses the class. One envelope per file (`schemaVersion: 2`, `collection`, records sorted by id).
- **Generator** (`tools/gen/gen.mjs`, Node, no dependency but ajv): resolves the pack chain of `--pack` (default
  `aion2/asmodian/assassin`, `tools/gen/packs.mjs`), loads exactly the files the manifests list, validates every file
  (`tools/gen/validate.mjs`), runs
  the cross-record checks (ids unique, keys unique, references resolve, story chain one path, URLs on registered sites
  and never on a banned or `mode: none` site, `verifiedAt` = latest `checkedAt`, claims ↔ `appliesTo`, retired keys,
  objective indices, …; about 8,600 checks) and compiles today's constants: `RQ`, `RQ_STATS`, `QUESTS`, `QUEST_STEPS`,
  `QUEST_LOC`, `STORY_END`, `SH_DATA`, `AREA_LOC`, `HIDEOUT_AREA`, `ZONE_TRACES`, `SD_RW`, `TIPS`, `ITEMS`,
  `VERIFIED_UNLOCKS`, the guide build's plan constants (`STIGMA_PLAN`, `ST_TARGETS`, `STAT_TIERS`, `SP_SKILLS_CORE`,
  `SP_EXTRA`, `RMB_ROWS`, `E_ORDER`, …), `SOURCES`, `SRC_SITE`, `CONF`, and `GUIDE_GATES` / `GUIDE_STEPS` (milestone
  items in their v1 shape with the text tokens left in). It compiles, it does not research: corrected values live in
  the data, a source's differing value in `conflicts`.
- **Text tokens** (`[[item:…]]`, `[[tip:…|…]]`, `[[mapq:…|…]]`, `[[stigma:N]]`, `[[erow:N]]`, `[[asc]]`, `[[rotseq]]`)
  are expanded in code (`expandTokens`, `src/packs/aion2/data/markup.js`), so their markup stays in `src/`. Build tokens
  (`[[build:stigma:N]]`, `[[build:text:…]]`, …) are expanded by the generator with the class's guide build.
- Data modules import only generated data, other data modules and `markup.js`, never `main.js`; none reads `state` or
  the DOM (they are evaluated before `main.js`).

Change data:

```sh
npm run gen          # validate + checks; writes data/DATA_SOURCES.md and tools/gen/out/ (exit 1 on any failure)
node tests/schema.mjs   # schemas, negative controls, checks, DATA_SOURCES.md current (also the `schema` suite)
npm test             # builds (the module is compiled in memory); e4 checks the page carries the generated values
npm run gen:check    # CI: fails if data/DATA_SOURCES.md is not what the generator writes
```

`tools/history/v2-convert/` holds the one-time v1 → v2 conversion script and its log (5b); `tools/history/v1-data/` the
two v1 files nothing read (`locations.json`, `current-areas-quests.json`). `tools/research/` holds the scripts that
produced the v1 files (provenance; they no longer match `data/`). `tools/history/` also has the E2 / E4 patch scripts.

## 4. Build and site

- `scripts/build.mjs` assembles the page: first each `<!-- @card cards/X.html -->` line of the shell becomes the file
  `src/cards/X.html` as it is (0.4 P4a; both builds; a missing file, an `@card` line inside a card file or a leftover
  `@card` line stops the build), then each `<link rel="stylesheet" href="styles/X.css">` line of the shell becomes a
  `<style>` with the file as it is; each `<script type="module" src="X.js"></script>` line becomes one classic `<script>`
  holding esbuild's bundle of that entry (format `esm` with no imports or exports left, so no wrapper; minified for whitespace and syntax only (0.5 P20: `minifyWhitespace` + `minifySyntax`, never
  `minifyIdentifiers`, so stack traces and tests still see the top-level names; about 84 KB raw and 8.6 KB gzip less,
  for budget headroom); no tree shaking, since names are used from inline `onclick` attributes and from tests). Every top-level name therefore
  stays a page global, as before modules. esbuild reprints the code: comments dropped, minified formatting, and
  top-level `const` / `let` emitted as `var` (it does this whenever it bundles; none of the 244 top-level names is a
  `window` property). Modules come first in import order (generated data, then the pack's data modules, the engine and
  the pack's code), then `main.js`. The generated data modules are compiled by an esbuild plugin
  (`scripts/generated-data.mjs` → `tools/gen/gen.mjs`) and resolve under `src/packs/aion2/data/`; a schema error or
  failed data check stops the build, so does a real `generated.js` there (or in the old `src/data/`), so does a top-level
  name declared in two page modules (every `.js` under `src/` but `site.js` / `sw.js`) or in a module and the generated
  data (esbuild would rename one of them), and so does a name that comes out of a bundle renamed (`X` → `X2`: a module
  used `X` without importing it). CSS is not passed through esbuild: its printer rewrites values (unquoted `url()`, one
  `unicode-range` entry per line) that the claude.ai font conversion and the test font blocker read. Instead a line
  `@import "X.css";` in an inlined stylesheet is replaced by that file as it is (0.4 P4d; path relative to the importing
  file, recursively): `src/styles/index.css` lists `app.css` and the card stylesheets that way. A missing file, a file
  imported twice, an `@import` in another form, or a `.css` file under `src/styles/` that nothing links or imports stops
  the build.
- It then checks the `<!-- @web-only -->` markers (in the shell), that every referenced icon exists and has a blob id
  (`scripts/artifact-blobs.json`; `null` = not uploaded to the artifact yet: the artifact build drops that icon's quoted path,
  so the page shows the initials square there), and that the fonts are all shipped and referenced with their OFL texts and nothing
  requests Google Fonts; then writes `dist/` (markers stripped; `public/`, icons and fonts copied; `sw.js` with the
  build id = hash of all cached files) and `dist-artifact/index.html` (web-only blocks removed before inlining, so
  `site.js` is never in it; icons → `/_blob/<id>`; the `styles/fonts.css` link replaced by a script that holds each
  font file once in base64 and registers the same faces with the FontFace API; capped at 150 KB).
- **Page budgets** (0.4 P7, about 1.3x the 0.3.0 numbers; the build prints each with its limit and % used): `dist/index.html`
  870,000 B (0.3.0: 669,290), its gzip -9 200,000 B (153,871) and `dist-artifact/index.html` 1,030,000 B (790,763) fail the
  build (`BUDGETS` in `scripts/build.mjs`); 6,200 elements in a fresh browser at 390 px (4,741) fail the `site` suite
  (`ELEMENT_MAX` in `tests/site.js`). To raise one, change that constant in the PR and say in the PR why. Timing
  (`perf`) stays advisory.
- Fonts (since 0.1.5): `src/assets/fonts/` holds the latin and latin-ext WOFF2 files Google Fonts serves for Marcellus SC,
  Figtree and JetBrains Mono, with their SIL OFL 1.1 texts. The `@font-face` rules copy Google's CSS (one face per
  weight and subset, same unicode ranges; Figtree and JetBrains Mono are variable files shared by their weights), so
  text renders exactly as before; a weight range per file would render weight 500 mono text differently. The page
  makes no third-party request.
  It also fills the placeholders `__APP_VERSION__` (from `package.json`) and `__APP_BUILD__` (`site` / `claude.ai`):
  the footer's version link and the "Report a problem" link use them, so the version is never typed into the page.
- Footer **Report a problem**: opens `.github/ISSUE_TEMPLATE/bug.yml` with its fields prefilled through the URL (field ids
  as query parameters): version, level, story quest, mode, build and user agent, and nothing else from the save. The
  `site` suite pins that list.
- `src/sw.js`: precaches the shell, icons and fonts; network-first for the page, cache-first for the rest; other
  `aion2-route-*` caches (older builds, the pre-0.1.5 Google Fonts cache) are deleted on activate. Registered only on
  https or localhost, and only in `dist/`.
- Export: `window.claude.use("downloads")` when present (claude.ai), else a Blob download.
- `scripts/serve.mjs`: static server for `dist/` (+ `/artifact/`, `/_blob/<id>`, and `/__baselines/` when started with `baselines`; no suite uses it since 0.4 P3c).

**Pure core rules** (0.2 P3; engine and pack since 0.4 P2b, `docs/design/0.4-engine-contract.md` §1–§2): `src/core/`
has no DOM, storage, timer or other browser access and imports only other core modules: never a pack, `src/cards/`,
`src/shell/` or `main.js` (no exception since 0.4 P2c). It names
no game term (P0 §5's list, code and comments; `tests/core/terms.test.mjs`) and reaches a game only through the pack
object: `main.js` calls `usePack(aion2Pack)` once, before it loads the save, and engine modules call `activePack()` inside
functions, never at module top level (modules are evaluated before `main.js` runs; values built once per pack are
memoised with `perPack`). A pack (`src/packs/<game>/`) imports the engine and itself, never another pack, `src/shell/`
or `main.js`; its data modules never read the state. `tests/core/purity.test.mjs` checks one import rule per folder,
each with a negative control. Derived facts are computed, never stored as ticks. Functions take the character
(`char(state)`) or, where a view setting changes the answer (Optional filter, talk-only objectives), the whole state.
A moved name keeps its name (every top-level name is a page global). `main.js` keeps the old global names the suites
call (`counts(g)`, `STIGMA_SLOTS()`, `rqAvail(q)`, `stNames()`, `stPlan()`, …) as one-line wrappers bound to the page's
state.

The switches (0.3 E4) work as before: the engine owns the mechanism (`setGateChanges`, `gateChangeOn`, the memoised app
graph per set of switches on), the pack owns the table (`gateChanges`) and the graph transforms (`graphTransforms`: the
three always-on ones for the kept rules and the Skills card's line levels, then one per switch's "off" form, applied in
list order); a switch the pack doesn't declare reads as on. `golden --explain` and `equiv` are unchanged.

## 5. Tests

`npm test` builds, serves `dist/` on localhost, and runs every suite except `perf` (`tests/run.mjs`); output in
`tests/out/`. CI runs the same suites in parallel shards (`--shard <name>`, `SHARDS` in `tests/run.mjs`;
docs/DEPLOY.md, "CI jobs").

| Suite | What |
|---|---|
| `site` | element budget at 390 px (§4), head, footer (version, Report a problem), export (Blob and claude.ai paths), service worker + offline, manifest, 404, artifact build, self-hosted fonts, persistent storage, save-failure banner |
| `e1`…`e4` | functional checks from each polish pass |
| `save` | save v5 (0.4 P3c) in the browser: fresh start, a v4 save present (never read: `getItem` spied, its entry byte-identical), round trip, import (v5 only; a v4 export refused), Level up (label vs slot id), the name and label in no key / link / file name, two slots |
| `regress` | Lv 25–45 × Basic/Advanced × 1500/1100/390 px × clean/messy saves, the user's save, pop-out |
| `journey` | the user's save from Lv 27 to 45 by clicking through Next up (page timers on Playwright's fake clock; `JOURNEY_REALTIME=1` for real pauses) |
| `perf` | non-blocking, not in `npm test`: `update()` median < 15 ms at e1's and regress's states (`npm run test:perf`) |
| `golden` | golden master: 2,000 generated saves (every level × story position × tick subsets × Basic/Advanced × build states, plus the fixtures) against `tests/golden/snapshots/` |
| `gates` | every story position × {quest level, 45}: no Next up step before its story gate or after the story passed it |
| `schema` | data format v2 in Node, no browser, < 3 s (`node tests/schema.mjs`, `npm run test:data`): every data file and schema example against `data/schema/` (ajv Ajv2020 strict), 15 broken copies that must be rejected, the generator's cross-record checks, `DATA_SOURCES.md` current |
| `core` | the engine and the AION 2 pack's code in Node, no browser, < 5 s (`node tests/core.mjs`, `npm run test:core`; needs no build; the bundle calls `usePack(aion2Pack)` as the page does): source rules (no DOM in `core/`, the import rule per folder, no AION 2 term in `core/`, `char(state)` only, no label or name in keys / file names), the pack holder (`definePack` checks and defaults, the engine on a pack with no hooks), state (v5 shape, `char()`, `labelOf`, fresh start, import check), load-time steps (write points, idempotent), catalog, requirements, Next up (order rules, Basic, and the `gates` sweep in Node), the 0.3 evaluator (atom rows, chains, memo, no mutation), the §8 source check (no gate decided outside the evaluator; `tests/core/gate-sources.test.mjs`), sync (change times, per-slot `merge()` algebra over generated saves, N1 import, last confirmed location) |
| `equiv` | Node, no browser, < 30 s (`node tests/equiv.mjs`, `npm run test:equiv`; CI: the `checks` shard): over the 2,000 golden states, the bare evaluator vs the frozen 0.2 gate rules (`tests/support/gates-0.2.mjs`; known differences pinned with their cause and kept rule, table in `tests/out/evaluator-equivalence.md`), and the page's gate functions (evaluator + `KEPT_RULES`) vs the same rules with no difference allowed |
| `invariant` | Node, no browser, ~65 s in CI (warns above 90 s, fails above 150 s; `node tests/invariant.mjs`, `npm run test:invariant`; CI: the `checks` shard): over 10,000 states (the golden generator's 8,000 with `--all`, ~1,800 targeted edge states, a seeded random top-up; `tests/invariant/states.mjs`), an independent oracle written from the raw v2 data (`tests/support/oracle.mjs`, not `GATE_GRAPH`) judges Next up (never offers a blocked or done node; disagreements pinned with their cause, table in `tests/out/invariant.md`) and the evaluator (same open / done / blockers on every node), plus monotonic gates and no writes on a frozen save. Seeded: `--seed`, `--state <id>` replays a state |
| `tokens` | Node, no browser, < 1 s (`node tests/tokens.mjs`; CI: the `checks` shard): in `src/styles/*.css`, no raw colour outside the custom-property declarations of a top-level `:root` rule; radius, spacing (margin / padding / gap) and shadows only through tokens; every `var(--x)` defined (or set by `main.js`, or with a fallback). `docs/design-system.md` |
| `a11y` | axe-core (pinned devDependency) at 390 / 1500 px in fresh / Lv 27 / Lv 45 × Basic / Advanced, failing on any rule outside the allowlist in `tests/a11y.js` (rules still open, each with its audit item); spoken button names; reduced motion after Level up; Escape on the "i" popovers; hit areas ≥ 24 px that never take a point from a neighbour; on touch at 390 px (since 0.1.9) fields ≥ 16 px, primary buttons ≥ 44 px, text ≥ 11 px mono / 12 px; no story connector above the first row; no sideways scroll at 260 px |

**Golden master** (`tests/golden/README.md`): records Next up, milestone headers, the Journey card, the Dungeons &
Strongholds card and the stored state after load for each generated save, and fails on any difference with a summary
grouped by kind of change. It is the acceptance test for refactors ("golden identical"). After an intended behaviour
change, run `node tests/golden.js --explain` first (0.3 E4, design §13: attributes every changed state to the smallest
set of the named changes that reproduces it; table in `tests/out/golden/explain.md` for owner approval; a stored-state
difference fails it, except a view flag `open.<milestone>` going absent ↔ true because the change moved that
milestone in or out of next / Missed, which is listed with its cause), then re-record with `node tests/golden.js --record`, review the summary and `tests/golden/KNOWN-VIOLATIONS.md`
(Next up cards whose gate isn't met, generated), and commit the snapshots with the change.

**Accessibility** (since 0.1.6, audit `docs/audits/2026-10-mobile-a11y.md`): the `a11y` suite's `ALLOW` list only
shrinks: when a rule is fixed, remove it so it can't come back. Motion follows `prefers-reduced-motion` per animation
(CSS overrides next to each animation, `SMOOTH()` for every script scroll; no blanket duration override, since
`#rwToast` clears itself on `animationend`). Small controls get their 24 px target from an invisible `::before` /
`::after` (`src/styles/app.css`, "Pointer targets"); the suite lists them in `HIT`.

Saves in the suites go through `tests/support/save.js` (`toStored(flat)` wraps a flat test state into a v5 save with
one slot; the old v285 / v287 baselines and the migration suites went with the clean break in 0.4 P3c). Web fonts are
blocked in test browsers so layouts render with fallback fonts on every machine (`tests/support/block-web-fonts.cjs`:
the self-hosted font files, the claude.ai build's inlined fonts, Google Fonts; service workers are blocked unless a context allows them, since a worker
would serve the fonts unrouted). `--with-fonts` lifts all of it.

## 6. Build and module notes

The Tech Lead's working notes on the esbuild toolchain (acceptance checks, global-scope rules, comparing renders,
timing checks) are in [docs/team/tech-lead.md](team/tech-lead.md), *Standing notes*.
