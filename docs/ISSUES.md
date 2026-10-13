# Known issues and gaps

Open items carried over from the polish passes (E1–E4, QA2/QA3) and the move to this repo. Data gaps are left as gaps
on purpose: the guide shows nothing rather than an unverified value.

## Data gaps

- **Regional quests without prerequisite data** (10): Great Curse-Breaking Caper, Her Last Favor, Pain Unending,
  Traveling Merchant's Conundrum, Herb Pouch Heist, Lest We Forget, Shugo-of-All-Trades, Spooky Specters, Spacetime
  Rift: Unknown Species / Proof. They open at their recommended level (`noPre`); *Not in game yet* is the fallback if
  the game disagrees. The `regress` soft check "no prerequisite data (open from Lv 10)" reports these by design.
- **Kibelisks missing**: 32 regional quest givers, Fafnite Storage Room (Metabot lists only the entrance zone, Sanctum
  Outpost), the Blood Barrier turn-in.
- **Story gate semantics**: whether a story gate means "quest accepted" or "quest reached" was not re-checked against
  aion2.gaming.tools (E4 #9). Example: Fight Poison with Poison at "Preparations for Restoration" (data says it needs
  "A Collective Effort"); the *In my game* pill is the one-click override.
- **Unverified, left out**: Kibelisk and Command mission unlock levels.
- **Dungeon XP**: removed from the UI; known for only a few dungeons.
- **Inferred (labelled in the app)**: core skill-point order, right-click row order and E stack, Vaizel / Triniel
  corner stats, Daevanion path costs, stronghold level bands. **Disputed (both sides shown)**: respec cost after 31,
  expedition weekly cap, stigma slot 3/4 order, first Daevanion nodes, cash-shop scope. See the Confidence card.
- **Zone assumption**: Safe Haven → Dredgion Crash Site has no strict map majority (Hidden Vein Cave, 460 m away, votes
  Nameless Cemetery). Chosen from the Safe Haven Cliff stronghold and allthings.how's filing (E3 P1-9).
- **"Daeva Trapped in a Nightmare" is not in the story data** (0.1.3). It follows "Forgotten Commander" (Lv 45, only
  objective: complete "The One Who Witnesses the Nightmare"; th.gl q_2102810, Metabot). Adding it changes the story end
  state (`storyEnd` moves saves on, mig1's pinned diffs change), so it is left for the 0.3 requirement audit. Until
  then `g45:0` is gated on "Forgotten Commander" turned in (`turnedIn`, i.e. past it or `storyEnd`).
- C27 (optional board re-check prompt at Lv 20/30/40) not added; the board card already flags a total below the
  level formula.

## App / UX

- **Story-implied completion is display-only** (0.1.3). Next up no longer offers a `byStory` step once the story is
  past that quest, but the tick is still written only by *Turned in*, so a save whose story position was set by hand
  (Journey input, mid-level onboarding) keeps those steps unticked in their milestone (x/y count, "Missed" tag). Same
  for ascension steps the story implies (e.g. `g32:dreams` once "A Daeva Dreaming Anew" is turned in). Derived
  completion (`completesWith` in the architecture audit's target model) is planned for the 0.3 requirement audit.
- **`g45:0` story chip** says "your current quest" while "Forgotten Commander" is open; the step itself waits in Next
  up until that quest is turned in.

- **Sources card has 300 links** (collapsed per site). The `regress` soft check "<= 60 links" fails by design: `e2`
  requires every source URL to be listed.
- **Item icon names may be swapped.** The page's Wisdom Stone uses blob `7b22e1de…` and Daevanion Crystal uses
  `cf357991…`; locally those files were named `daevanion-crystal.png` and `wisdom-stone.png` respectively. The repo keeps
  the blob → file mapping exactly as it was (`scripts/artifact-blobs.json`), so the app looks the same as the claude.ai
  version, which means either the file names or the icons shown are swapped. Check in game which art is which, then
  either rename the two files (and their two references in `src/index.html` and the blob map) or swap the icons in
  `ITEMS`.
- Pop-out needs Document Picture-in-Picture (Chrome / Edge 116+); the button is hidden elsewhere.
- Fonts come from Google Fonts (privacy note in PRIVACY.md). Self-hosting them would remove the last third-party
  request; their licenses (OFL) allow it.

## Tooling

- `tests/journey.js` logs one known `!! In my game click failed` line (it clicks the first `[data-ingame]` pill, which
  can be hidden). The runner ignores exactly that line; any other `!!` line fails the suite.
- Timing checks (`update()` median < 15 ms) trip on a busy machine (measured 10–17 ms for the same build on a 2-vCPU
  VM). The runner runs half the CPU count in parallel and re-runs a failed suite once, reporting a pass on retry as
  `FLAKY` with the first run's failures. A real slowdown fails both runs.
- Tests block Google Fonts so layout checks are machine-independent; run `node tests/run.mjs --with-fonts` to check
  with the real fonts.
