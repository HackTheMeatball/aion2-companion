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
- **Brand art is original** (not game art): `public/favicon.svg`, `public/icons/*.png` and `brand/*.svg` are drawn as code
  by `tools/brand/build.py` (Daeva Companion, direction C), 2026-10-13. No NC material in them.
- **Icon provenance not recorded.** The 23 PNGs in `src/assets/icons/` are NC Corporation's art. Record where each file
  came from (site + page URL + date), so any permission request or takedown can be answered quickly. Fill in, then keep:

  | File | Source page | Retrieved |
  |---|---|---|
  | blue-off.png, blue-on.png, green-off2.png, green-on2.png, orange-off.png, orange-on.png | | |
  | daevanion-crystal.png, enhance-stone.png, wisdom-stone.png | | |
  | sk-ambush.png, sk-assault-stance.png, sk-defense-break.png, sk-exploit-weakness.png, sk-heart-gore.png | | |
  | sk-insignia-explosion.png, sk-quick-slice.png, sk-rear-smite.png, sk-savage-roar.png, sk-shadowstrike.png | | |
  | st-illusive-clone.png, st-savage-fang.png, st-swift-contract.png, st-triniels-dagger.png | | |
- Pop-out needs Document Picture-in-Picture (Chrome / Edge 116+); the button is hidden elsewhere.

## Tooling

- `tests/journey.js` logs one known `!! In my game click failed` line (it clicks the first `[data-ingame]` pill, which
  can be hidden). The runner ignores exactly that line; any other `!!` line fails the suite.
- Timing checks (`update()` median < 15 ms) trip on a busy machine (measured 10–17 ms for the same build on a 2-vCPU
  VM). Since 2026-10-15 they are the non-blocking `perf` suite (`tests/perf.js`, `npm run test:perf`, CI job `perf`
  warns only), not part of `npm test` or `ci-ok`. The runner still re-runs a failed suite once, reporting a pass on
  retry as `FLAKY` with the first run's failures.
- Tests block the web fonts (self-hosted files, the claude.ai build's inlined copies, Google Fonts for the baselines) and
  service workers, so layout checks are machine-independent; run `node tests/run.mjs --with-fonts` to check with the
  real fonts.
- Layout fitting (`fitSkills` etc.) runs in `requestAnimationFrame` and isn't re-run when the web fonts finish loading,
  so on a slow font load the Skills / Daevanion row can be sized for the fallback font (a few px). Seen while comparing
  builds in 0.1.5: the claude.ai build registers its inlined fonts before the first fit and comes out 3 px taller than
  with Google Fonts. Re-running the fit on `document.fonts.ready` would fix it (visible change, needs a test).
