# Golden master

A safety net for refactoring (architecture audit, phase P0). It loads the built page (`dist/index.html`) with 2,000
generated save states and records what the app decides for each one. Any later change to that behaviour shows up as a
diff, grouped by kind of change, so a refactor that should change nothing can prove it, and a fix that should change
something shows exactly where.

| File | What |
|---|---|
| `tests/golden.js` | the runner: record / verify, diff summary |
| `tests/golden/states.js` | the state generator (deterministic) and the catalog it reads from the page |
| `tests/golden/probe.js` | what is recorded per state (runs in the page) |
| `tests/golden/violations.js` | the known-violations check and report |
| `tests/golden/snapshots/*.json` | the recorded snapshots (committed), one file per group and level band |
| `tests/golden/KNOWN-VIOLATIONS.md` | generated: Next up cards whose gate isn't met |

## Running it

```sh
npm run build
node tests/golden.js                 # verify (also suite `golden` in npm test / tests/run.mjs)
node tests/golden.js --record        # re-record snapshots + KNOWN-VIOLATIONS.md
node tests/golden.js --filter 'L3[0-4]-'   # only matching state ids, while iterating (verify only)
node tests/golden.js --all           # + 6,000 extended random states (see "Extended set")
node tests/golden.js --explain       # which 0.3 change makes which difference (tests/golden/explain.js; table in tests/out/golden/explain.md)
```

Options: `--jobs N` parallel pages (default 3), `--limit N`, `--render` (see "How a state is recorded").
On a difference, verify prints a summary and writes `tests/out/golden/diff.md` (by kind, then per state) and
`diff.json` (before/after for every changed state). `--record` prints the same summary against the old snapshots
before it overwrites them, so a re-record is reviewable from its own output too.

## What a state is

Ids describe the recipe: `level/L32-q49-before-A` = Lv 32, story at `QUESTS[49]`, the `before` tick rule, Advanced
(`B` = Basic), and an optional build variant suffix.

| Group | States | What |
|---|---|---|
| `story/` | ≈ 520 | every story position at its own level, one level below (story level-gated) and at Lv 45; no ticks (the audit's sweep) and "kept up" ticks; Basic at the quest's level |
| `level/` | ≈ 580 | every level 1–45, story on track / not set / one ahead / three behind; tick rules `none`, `before`, `lvonly`, `rnd1p50`, `rnd2p85`; both modes |
| `build/` | 198 | at Lv 10–45: stigma slots empty / ready / all equipped, unspent skill points, Cube items + dungeon in progress, board crystals, regional quests in progress / snoozed, story objectives, view filters |
| `random/` | the rest up to 2,000 | recipes from a seeded PRNG, anything combined (story anywhere, any tick rule) |
| `special/` | 6 | no save, a v5 save with an empty character, two texts that aren't a v5 save (`{}`, a pre-0.4 flat save: both start fresh), story end, unknown quest name |
| `fixture/` | 2 | the v285 saves as the 0.3 build stored them after loading them (`tests/fixtures/fixture-v285.flat.json`, `fixture-user-v285.flat.json`; 0.4 P3a, frozen since P3c), written as v5 saves by `tests/support/save.js` |

Tick rules: `before` = what a player who kept up has done (lower milestones, regional quests below the level whose
story gate is reached, dungeons/strongholds below, skills 2 levels behind, earlier boards); `lvonly` = the same by level
only, ignoring the story; `all`; `rnd<seed>p<percent>` = each key ticked iff a hash of seed + key is below the percent.

Determinism and stability: no `Math.random`, no time. Random subsets are decided per key, so adding a key never
changes the other keys' ticks; ids come from recipes, never from list positions; snapshot files are split by group and
level band, so a new state never moves others between files. The catalog (QUESTS, GATES, …) is read from the page under
test, so a rule like `before` covers new steps automatically; the state's input hash (`in`) then changes, and the
summary reports it as "input: generated save changed".

## How a state is recorded

Each worker page (one browser, `--jobs` contexts, recycled every 150 states) sets `localStorage` to exactly the
state (under the save key, `SAVE_KEY` in `tests/support/save.js`, as `storedText()` writes it; nothing else is
written) and reloads. An init script takes the snapshot at
`DOMContentLoaded`, which is right after the app's synchronous start-up (`render(); update();`, migrations included):
that is the "idle" point, with no sleeps. The clock is fixed (`2026-10-01T12:00Z`), so is a fresh save's slot id
(`crypto.randomUUID`), fonts are blocked, the service worker is blocked.

The page root is `display: none` from the start, so the browser never does style, layout or paint work; that halves
the cost per state. It is safe because the app's start-up never reads layout (only its `requestAnimationFrame` fitting
does: card heights, font shrinking), and text is read with a text-node walk, not `innerText`. `--render` turns the
hiding off: the snapshots must be identical, which proves they don't depend on layout (checked when this was built).
Basic mode hides things with CSS; the snapshot records the mode and the classes CSS keys on (`upnext`, `overdue`).

Recorded per state:

| Field | What |
|---|---|
| `in` | hash of the input save (detects generator / catalog changes) |
| `nu` | Next up, in rank order: title `t`, subline `s`, control `c` (`primary "Done" tick:g6:0`, `go "Show" areas:30`, `tag "Later"`), `f` later, `i` info line, `x` regional quest rows, `o` story objectives |
| `ms` | milestone headers: `id \| tag \| count \| classes [\| open] [\| hidden]` (tags: Now, Missed, Cleared, Side quests, Later, N to go) |
| `rt` | route rules (STEPS): counts, open |
| `jr` | Journey: previous / current / next story quest, milestone hint, Ahead rows, milestone track, ring, progress rows, objectives summary |
| `reg` | Dungeons & Strongholds card: band options (selected `*`), section and zone headers, rows with done / running / locked |
| `store` | the stored state after load vs the input: only changed paths, `[before, after]` (key order ignored); `mt` (5c change times) as a summary: stamp count, count per time, FNV-1a hash |
| `keys`, `err`, `mode` | other localStorage keys written, page errors, the mode the page ended up in |

## When the snapshots change

**Verify fails, and the change wasn't intended** (a refactor, P1–P3): the summary says what moved. Fix the code; don't
re-record.

**The change is intended** (a gate fix, new data, a wording change):

1. `npm run build && node tests/golden.js` and read the summary (`tests/out/golden/diff.md` has every state, `diff.json`
   the before/after). It has two sections:
   - **behaviour changes (same input)**: the same save now renders differently. Every kind must be explained by the
     change. Typical kinds: `Next up: card removed: …` / `card added: …`, `Next up: top card changed from …`,
     `same cards, new order`, `milestone g32 tag: Missed -> Later`, `milestone g45 count changed`, `Journey: next changed`,
     `stored state after load: checks.<key> written differently`. The last one means **a migration or seed now writes
     something**: review it against the save rules in CLAUDE.md (additive, flagged, idempotent) before anything else.
   - **generated saves added / removed / changed**: the catalog changed (a new step key, a new `story` gate, a new
     quest), so the tick rules now produce different saves for some states (`input: generated save changed`), and
     everything that differs in those states is listed with a `(new input)` prefix. Expected with data or gate changes;
     check that the states involved are the ones the change touches.
2. `node tests/golden.js --record`. It prints the same summary, then the violation count (`… · 600 violations in 500
   states (was 743 violations in 626 states)`). Review `git diff tests/golden/KNOWN-VIOLATIONS.md`: fixed steps leave
   the table; nothing new should appear.
3. Commit the snapshots and KNOWN-VIOLATIONS.md with the change, and put the behaviour-change kinds with their state
   counts in the commit message or PR.

Example (simulated while building this: `g32:dreams` given `story: "A Daeva Dreaming Anew"`, run on the Lv 32–45
states):

```
golden: 130 of 800 states differ · 10 kinds of change (most states first):
  -- behaviour changes (same input):
     28  Next up: card removed: Ascension quest "The One Who Dreams"
     18  Next up: top card changed from Ascension quest "The One Who Dreams"
      2  Next up: card added: Buy Rear Smite # → #
  -- generated saves added / removed / changed (their other changes follow from the new input):
    102  (new input) milestone g32 count changed
    102  input: generated save changed (catalog or generator)
     92  (new input) milestone g32 tag: Side quests -> Missed
     …
```

(Each line also prints example state ids and one before/after.) Reading it: the card is gone in 28 states, all at
Lv 32 with the story before the gate (check the examples); in 2 of them the 8-card cap lets a skill card in. The
`before` tick rule now leaves `g32:dreams` unticked for players whose story isn't there yet, so 102 generated saves
changed and their g32 milestone shows it as missed: consistent with the new gate.

Two changes landing at once (e.g. the Ascension gate fix and a refactor): re-record on the branch that changes
behaviour; the other branch rebases, rebuilds and must verify clean against the new snapshots. If both changed
snapshots, resolve by re-recording after the merge, never by merging the JSON by hand.

## Known violations

`KNOWN-VIOLATIONS.md` lists every state where Next up offers an actionable step (primary button) whose gate isn't met,
judged independently of the app's own filtering (`violations.js`):

- `level-gate`: the milestone or skill step is above the level;
- `story-gate`: the step's story quest isn't reached;
- `done-by-story`: "complete story quest X" with the story already past X (the app only ticks these from its own
  "Turned in" click);
- `oracle-gate`: a gate from the gate table (`ORACLE` in `violations.js`), checked whether or not the app models it:
  `g32:dreams` once the story reaches "A Daeva Dreaming Anew", `g45:witness` (`g45:0` until 0.3 E10) once "Forgotten Commander" is turned in (story
  past it, or on it with `storyEnd` set), as the ascension hotfix implements them (claims C36, C37). Update the table
  when a gate is decided differently.

Verify fails when the file is out of date, so it can't drift from the snapshots.

## Extended set

`--all` adds 6,000 random states (group `xrandom/`, separate PRNG seed). Their snapshot files
(`snapshots/xrandom-*.json`) are git-ignored (size, ~22 MB), and a plain `--record` leaves them alone. To use them
across a change, record on the base commit and verify on the change:

```sh
git stash                                   # or check out the base commit
npm run build && node tests/golden.js --all --record
git checkout tests/golden/ && git stash pop # keep only the local xrandom files
npm run build && node tests/golden.js --all
```

## Cost

Measured on the 2-vCPU dev VM (Chromium headless shell, 3 pages), Oct 2026:

| Run | Wall | Notes |
|---|---:|---|
| verify, 2,000 states, quiet machine | 111 s | ≈ 200 CPU-seconds in all (≈ 0.1 per state: the browser parsing the 450 KB page and running its start-up) |
| verify, 2,000 states, machine busy with other test runs | 150–204 s | three runs, all identical |
| inside `npm test` (suites run one at a time on 2 vCPUs) | 153 s | |
| `--all`, 8,000 states | 560 s | |
| `--render`, 371 states | 76 s | ≈ 3× the CPU per state; identical snapshots |

The cheap parts are deliberate: no layout or paint (hidden root), images and fonts off, no request interception, a
snapshot at DOMContentLoaded instead of a sleep, and a fresh browser context every 150 states (a renderer that reloads
the page hundreds of times grows by gigabytes).
