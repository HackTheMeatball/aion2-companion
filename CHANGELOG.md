# Changelog

All notable changes to Daeva Companion. Versions follow [semantic versioning](https://semver.org/); 0.x releases are
beta. Each release lists only the sections that apply, in this order: Added, Changed, Fixed, Data, Accessibility,
Removed, Action required, Known issues, Saved progress. The format is checked by `scripts/release-notes.mjs`.

Saved progress has used the same `localStorage` key, `aion2-assassin-route-v4`, since before 0.1.0; every version below
loads every earlier save. Entries before 0.1.0 are the internal build numbers of the original single-file claude.ai
artifact (`vNNN`) and are kept in their original form.

## 0.2.5 — 2026-10-16

Backup line, 14-day backup reminder and iPhone home-screen tip.

### Added

- Website only: the export row shows a "Last backup" line (today, yesterday, or N days ago; amber from 14 days; "no
  backup yet" counts from your first visit on this version).
- Website only: after 14 days without a backup, one reminder card offers Export or "Not now". "Not now" hides it
  until the next 14 days have passed. It is not shown in Basic mode or while a "could not save" banner is up.
- Website only: on iPhone Safari, a one-time tip about adding the guide to the Home Screen, shown until you press
  "Got it". It is not shown on desktop, in other iPhone browsers, in in-app browsers, in the installed Home Screen
  copy, or after the 14-day reminder was shown on the same visit.

### Changed

- Importing a backup file starts the backup line from the import: the line reads "today" afterwards.
- Exporting records its time before the file is built, so the file matches what is stored in the browser.

### Saved progress

- Saves gain two backup fields: a `backup` record (first visit on this version, last export time, and the "Not now" /
  "Got it" markers) and a one-time `backup1` marker. Nothing is renamed or removed, and every earlier save loads.

## 0.2.4 — 2026-10-16

Active / Passive skill labels, specialty slots, villages, clearer lock text.

### Added

- Skills card: each skill is labelled Active or Passive.
- Skills: second and third specialty slots, opening at skill Lv 12 and Lv 20 (the first still opens at Lv 8). The
  skill level counts Daevanion node bonuses on that skill. Slot 2 names a pick only for Heart Gore and Quick Slice
  (two or more sources agree); other slots read "pick a specialty". Slot 3 is listed on the Skills card only and is
  never offered in Next up.
- Journey card: an Ascension progress bar for the four chapters up to Lv 45 (Perceives, Hears the Voice, Dreams,
  Witnesses the Nightmare), in Basic and Advanced. It is informational: it reads your story progress and ticked steps
  and writes nothing.
- Locked items say why: Later cards and skill lines read "Needs Lv N"; the Daevanion card (Advanced) reads
  `unlocks after "Urgent Pursuit" · N quests ahead`; the milestone story line says "Turn in" or "Reach" the quest a row
  is waiting for; regional quest rows show what still blocks them, and nothing once they are open.

### Changed

- Rows already done through your story progress show a ticked, disabled box named "done in the story". Your own tick is
  not changed and shows again if the story moves back. Ticking or picking up a regional quest also counts its
  prerequisite regional quests as done.
- The Journey "Quest done" button and Next up's "Turned in" wait for the quest's unlock level.
- Regional quests now follow the story as turned in: Shugo-of-All-Trades, Spooky Specters and The Great Curse-Breaking
  Caper appear after their story quest is turned in; Traveling Merchant's Conundrum after "Blood Monument"; Lest We
  Forget after "Zikel's Core". Deep Shadow (Hugo Mercenaries) needs both Canyon's Secret and Past and Present.
- Noble Belt and Amulet steps wait for "Urgent Pursuit" and "Buried Atrocities" to be turned in. A Daevanion board
  shut only by its unlock reads `opens after "Urgent Pursuit"` instead of a level countdown.
- Graverobber Den is cleared by step 4 of Cemetery Cleanup; Krao Cave and Fire Temple Expedition follow their story
  step. Some story steps carry a short note from the first run-through (Draupnir's is marked as inferred).
- Villages are zones of their own: Aldelle Village is no longer part of Ishalgen, so "near your story step" can
  differ for the Lv 2–7 quests there.

### Data

- Story quests: steps for 22 quests (A Village in the Fog through Empyrean Monolith, except Finding Nemon) and giver /
  turn-in NPC, place, Kibelisk and distance for the 10 Ishalgen quests, from the Metabot quest pages (game build
  0.0.4387.0, checked 2026-10-15). The Being Beneath the Lake starts with the Witch's Cabin Kibelisk bind (owner,
  2026-10-15).
- Aldelle Village is its own zone (Metabot start & turn-in table, 2026-10-15, and the owner's screen of 2026-10-14);
  ten story sides moved to it. The giver of "Farewells" is in Black Claw Village (Metabot).
- Owner in-game checks of 2026-10-15 and 2026-10-16: Hugo Mercenaries: Deep Shadow needs Canyon's Secret and Past and
  Present (both owner-confirmed); the two Zikel Defense Break nodes are confirmed; the Ascension openings check is
  closed, the gates stay on their Metabot sources (claim C39); Quick Slice's second specialty unlocks at skill Lv 12
  (claim C40).
- Skills: the unlock level and point costs follow the rule from the owner's screens (learn level + 3 × (level − 2);
  1, 2 or 4 points).
- Power Shards line added to the Empyrean Traces tip (claim C25); the pet note at Lv 10 was removed.
- Slot 2 and 3 specialty picks are listed only where two or more sources agree on the slot.

### Accessibility

- Derived rows are named "<row>: done in the story"; the Active / Passive label and the new Ascension bar pass the
  automated axe checks.

### Known issues

- The Daevanion card may still show the Nezekan board as opening at Lv 12; in game it opens with "Urgent Pursuit"
  (Lv 13). Planned for 0.3.
- Story levels after the first quest may still show as requirements ("Needs Lv …: level up first"). Planned for 0.3.
- At 200 % page zoom on a phone (about 195 px wide), some card headers still run past the edge of the screen.
- Phones: the longest quest names end in "…" in the quest field instead of wrapping.
- The villages Steel Hammer Workcamp, Odar's Shade, Fang Hideout, Minushan Site, Shadow Hall and Sanctum Dumpsite
  still have no zone of their own; quests there keep the placeholder zone.

### Saved progress

- Unaffected. Derived ticks are never written. Specialty slots 2 and 3 add the keys `spec2` / `spec3` to a skill only
  when you tick them; no key is renamed or removed.

## 0.2.3 — 2026-10-15

Story-quest zones for 34 more quest sides; stigma unlock cost check.

### Changed

- Next up: the "near your story step" choice (the preferred Sealed Dungeon or stronghold, and the "N near your story
  step" count on the Regional quests card) can differ for a save on a Lv 10–22 story quest whose turn-in zone is now
  known. A turn-in that is still a placeholder shows no "near your story step" area.
- Stigma unlock cost: the guide already counts 1 shard to unlock a stigma, which then starts at Lv 1; no plan or value
  changes. The owner's in-game confirmation is now recorded on the rule and a test covers it.

### Data

- Story-quest locations: 34 of 71 placeholder quest sides now have a zone, 6 verified (Metabot's Location is a zone in
  the guide's list) and 28 inferred through the camp list; giver and turn-in NPCs, places, nearest Kibelisk and
  distances were filled in where missing. All from the Metabot quest pages (game build 0.0.4387.0, checked
  2026-10-15). Quests still on the placeholder zone: 40 → 26; 37 sides stay placeholders (30 at Metabot villages the
  guide has no zone for, 4 auto-start givers, 2 Dream Crossroad turn-ins, 1 Reshanta turn-in).
- Stigma shard cost (rule:stigma-shard-cost, Lv 1–5 = 1 each): owner in-game confirmation added (inferred reference).

### Known issues

- The Daevanion card still shows the Nezekan board as opening at Lv 12; in game it opens with "Urgent Pursuit"
  (Lv 13). Planned for 0.3.
- Skills: only the first specialty slot is offered, and it unlocks at the skill's learn level + 18 instead of skill
  level 8. Planned for 0.3.
- Story levels after the first quest still show as requirements ("Needs Lv …: level up first"). Planned for 0.3.
- At 200 % page zoom on a phone (about 195 px wide), some card headers still run past the edge of the screen.
- Phones: the longest quest names end in "…" in the quest field instead of wrapping.
- The villages Steel Hammer Workcamp, Odar's Shade, Fang Hideout, Minushan Site, Shadow Hall and Sanctum Dumpsite
  still have no zone of their own; quests there keep the placeholder zone.

### Saved progress

- Unaffected.

## 0.2.2 — 2026-10-15

Daevanion cost arrow, rotation by level, and five more skill icons.

### Added

- Icons for Impact Hit, Flash Slice, Storm Rampage, Determination and Heightened Sixth Sense in the Skills card, Next
  up and on Daevanion node badges (from Metabot). The claude.ai version keeps the initials for these five.

### Fixed

- Daevanion: the up arrow in an empty node cost box set the cost to 0; it now sets 1. The down arrow still sets 0 for
  a node already bought on the way to another.
- Build drawer: the rotation and key setup listed a stigma marked equipped before its slot opens (for example
  Triniel's Dagger on E below Lv 22); they now list only skills the Skills card has unlocked at your level and
  stigmas whose slot is open.

### Known issues

- The Daevanion card still shows the Nezekan board as opening at Lv 12; in game it opens with "Urgent Pursuit"
  (Lv 13). Planned for 0.3.
- Skills: only the first specialty slot is offered, and it unlocks at the skill's learn level + 18 instead of skill
  level 8. Planned for 0.3.
- Story levels after the first quest still show as requirements ("Needs Lv …: level up first"). Planned for 0.3.
- At 200 % page zoom on a phone (about 195 px wide), some card headers still run past the edge of the screen.
- Phones: the longest quest names end in "…" in the quest field instead of wrapping.

### Saved progress

- Unaffected.

## 0.2.1 — 2026-10-15

A new player starts at level 1 on the first story quest.

### Changed

- A new browser starts at Lv 1 on the first story quest, "A Village in the Fog" (was Lv 5 with no quest picked).
  Saved progress keeps its level and quest.
- Next up no longer tells a Lv 1 character to reach Lv 2 before the first story quest: story levels are recommended
  levels, not requirements.

### Accessibility

- Touch screens: the "unlocks …" line under a story step is 12 px (was 11.5 px).

### Known issues

- The Daevanion card still shows the Nezekan board as opening at Lv 12; in game it opens with "Urgent Pursuit"
  (Lv 13). Planned for 0.3.
- Skills: only the first specialty slot is offered, and it unlocks at the skill's learn level + 18 instead of skill
  level 8. Planned for 0.3.
- Story levels after the first quest still show as requirements ("Needs Lv …: level up first"). Planned for 0.3.
- At 200 % page zoom on a phone (about 195 px wide), some card headers still run past the edge of the screen.
- Phones: the longest quest names end in "…" in the quest field instead of wrapping.

### Saved progress

- Unaffected: no save is migrated or re-defaulted. Groundwork for syncing between devices (not yet available):
  a new browser's default first quest will never override a story position saved on another device.

## 0.2.0 — 2026-10-14

Rebuilt guide data with a source for every fact, and in-game unlock corrections.

### Added

- Ahead: feature unlocks seen in game: Lv 2 Journal and Customization, Lv 3 Stats window, Lv 4 Skills window, Lv 9
  Enhancement and Achievements, Lv 10 Crafting and Extraction, and the systems that open at Lv 45.
- Journey: the next story quest says what it unlocks: "Prepare to Escape" (Shop, Closet), "The Being Beneath the Lake"
  (Wings), "Spread Your Wings" (Titles), "Gathering Essentials" (Pets), "Urgent Pursuit" (Daevanion boards, Shugo
  Festival).
- Sources: links to the page behind each story quest, Ascension quest, Sealed Dungeon entrance, specialty and item
  (about 110 more links).

### Changed

- Ishalgen is the starting map, not a story quest; "A Village in the Fog" is the first story quest. A save whose
  current quest was "Ishalgen" shows "Pick your current quest to place yourself on the story."
- Next up: stronghold distances are measured to the stronghold entrance, so most change by a few metres, some by up to
  60 m. Andsha Forward Base's nearest Kibelisk is now Steel Hammer Temporary Trading Post (466 m).
- Next up: "near your story step" and the suggested stronghold or Sealed Dungeon now use the Kibelisk of every regional
  quest (58, was 26), so the suggestion changes at some points of the story.

### Data

- Daevanion boards open when "Urgent Pursuit" (Lv 13) is completed, not at Lv 12 (in-game screens, 2026-10-14; the
  milestone text and the Daevanion tip say so).
- Sealed Dungeon distances are exact instead of rounded (Metabot Exploration quest pages): Ascetic's Cave 165 m, Closed
  Hideout 95 m, Twisted Pit 236 m, Library of Wisdom 137 m, Place of Rest 99 m, Den of Exiles 215 m. Fafnite Storage
  Room: Fang Hideout, 226 m.
- Regional quests: giver and turn-in Kibelisks for 32 more quests (Metabot quest pages).
- Specialties: every active skill has 3 specialty slots, opening at skill level 8, 12 and 20, with 5 choices (levels
  8, 8, 8, 12, 16); Daevanion nodes that raise a skill count toward its level (in-game screens; Metabot skill pages).
- aion2.th.gl is no longer cited. Its facts are now backed by aion2.gaming.tools or Metabot; the two "Hugo Mercenaries:
  Deep Shadow" requirements no other source confirms are marked for an in-game check.

### Known issues

- The Daevanion card still shows the Nezekan board as opening at Lv 12; in game it opens with "Urgent Pursuit"
  (Lv 13).
- Skills: only the first specialty slot is offered, and it unlocks at the skill's learn level + 18 instead of skill
  level 8. Planned for 0.3.
- At 200 % page zoom on a phone (about 195 px wide), some card headers still run past the edge of the screen.
- Phones: the longest quest names end in "…" in the quest field instead of wrapping.

### Saved progress

- Saves now record when each item was last changed (save schema version 1), groundwork for syncing progress between
  devices. Existing progress is kept as it is, and earlier versions still load the save.

## 0.1.9 — 2026-10-14

Touch, contrast and page-zoom fixes from the mobile and accessibility audit.

### Changed

- Phones: cleared milestone steps fold to their title; warnings, locations and rewards stay visible.
- Touch screens: a long quest name in the quest field ends in "…" instead of shrinking to fit.

### Fixed

- The story line no longer runs up into the "Main story" heading on a fresh save or at the first story quest.
- At high page zoom (layouts about 260 px wide), the Progress rows, the Skills / Daevanion / Stigmas headers and the
  milestone steps wrap instead of being cut off.

### Accessibility

- Accent-coloured text is slightly lighter (5.0:1 contrast on cards).
- White text on the accent colour (current milestone number, open "i" button, filter count, "new" tags) sits on a
  darker accent (5.1:1).
- Locked Sealed Dungeon names are easier to read (4.7:1).
- Touch screens: text fields and selects use 16 px text, so iPhone Safari no longer zooms in when one is tapped.
- Touch screens: Level up, Mark spent / equipped / upgraded and the Next up action buttons are 44 px tall.
- Touch screens: labels are at least 11 px (monospace) or 12 px (other text).
- Touch screens: no double-tap zoom on fields, links, checkbox labels and fold-outs.
- The automated accessibility check now fails on any contrast issue and checks the touch sizes, the story line and
  page zoom.

### Known issues

- At 200 % page zoom on a phone (about 195 px wide), some card headers still run past the edge of the screen.
- Phones: the longest quest names end in "…" in the quest field instead of wrapping.

### Saved progress

- No change to saved progress.

## 0.1.8 — 2026-10-14

New address: daevacompanion.com.

### Changed
- The app is now hosted at https://daevacompanion.com/.
- daevapath.com and aion2.ishkabytes.com redirect to the new address (HTTP 301; paths and query strings are kept).

### Action required
- Browsers store progress per address, so progress saved on aion2.ishkabytes.com does not appear on the new address
  automatically. On the old address, use *Export progress*; on the new address, use *Import progress*.

### Known issues
- On phones, Next up appears far down the page, below the Journey and summary cards. A phone layout is planned.
- Steps that the story implies are complete are hidden from Next up but stay unticked in their milestone when the story
  position was set by hand. Derived completion is planned for 0.3.
- 10 regional quests have no prerequisite data and open at their recommended level; *Not in game yet* hides one if the
  game disagrees.
- Story gates are not yet confirmed as "quest accepted" or "quest reached" (e.g. Fight Poison with Poison); the
  *In my game* pill overrides a gate.
- Pop-out requires Chrome or Edge 116 or later; the button is hidden in other browsers.

### Saved progress
- Unaffected.

## 0.1.7 — 2026-10-13

Rebrand to Daeva Companion.

### Changed
- New name, Daeva Companion: an unofficial companion for AION 2, starting with the Asmodian Assassin leveling guide.
- New compass-and-feather mark in the header, new favicon and new home-screen icons (separate maskable icons and an
  iPhone icon).
- The new name is used in the tab title, share previews, installed-app name ("Daeva"), footer and 404 page.
- Page colours are unchanged.

### Saved progress
- Unaffected; same address.

## 0.1.6 — 2026-10-13

Accessibility improvements with no visible change.

### Added
- Automated accessibility check (`a11y` test suite) on every test run.

### Accessibility
- Screen readers: the "i" buttons beside Strongholds, Sealed Dungeons and Regional quests have names.
- Screen readers: the Milestones and Next up headings no longer include their buttons; the filter button announces
  how many filters are on.
- Screen readers: the two side areas are named; decorative arrows and icons are skipped.
- Keyboard: Escape closes the "i" popovers; the Basic/Advanced switch and the quest field show a focus ring.
- Reduced motion (system setting): pulses and scrolling animations are off; Level up lists its gains in the toast.
- Touch: larger tap areas on small controls, no double-tap zoom delay on buttons, panel heights follow the visible
  screen on phones.

### Saved progress
- Unaffected.

## 0.1.5 — 2026-10-13

Save protection and self-hosted fonts.

### Added
- The site asks the browser for persistent storage (at most once per browser session), so Safari on iOS is less likely
  to clear progress after a week without a visit.
- A warning with an Export button appears if saving fails (private mode, full or blocked storage); it clears after the
  next successful save.

### Changed
- Fonts are served from this site instead of Google Fonts; no request goes to Google. The fonts (SIL Open Font License
  1.1) ship with their license texts; the claude.ai build embeds them.
- PRIVACY.md and LICENSE updated for the fonts.

### Saved progress
- Unaffected; no new saved data.

## 0.1.4 — 2026-10-13

App version and problem reports in the footer.

### Added
- The footer shows the app version, linked to this changelog.
- *Report a problem* in the footer opens a GitHub issue form prefilled with version, level, current story quest,
  mode, build and browser, and nothing else from the save. The form is public and editable before submitting.
- Issue forms for problems, data corrections and ideas, with labels (`bug`, `data`, `feature`, `ux`).

### Changed
- Both builds take the version from `package.json` at build time.

### Saved progress
- Unaffected.

## 0.1.3 — 2026-10-13

Ascension fixes: story gates and story steps already passed.

### Added
- Test suites: `gates` (story-gate check over every story position) and `golden` (golden master of 2,000 generated
  saves). Known Next up gate violations: 801 → 0.

### Fixed
- Next up no longer offers "The One Who Dreams" before the story reaches "A Daeva Dreaming Anew" (claim C36).
- Next up no longer offers the Lv 45 Hero and Ascension step before "Forgotten Commander" is turned in (claim C37).
- Story steps already passed (e.g. "The Being Beneath the Lake", "Urgent Pursuit") are no longer offered in Next up.
- "The Being Beneath the Lake" now ticks with its story quest.

### Data
- Story gates for the two steps above, from game-database prerequisites (aion2.th.gl).
- Ascension text: The One Who Dreams requires a full Ascension Gauge; corrected names "Dream Crossroad" and "The One Who
  Hears the Voice".
- Sources card: 291 → 300 links.

### Removed
- The disputed claim that "The One Who Perceives" grants the first wings (claim C38).

### Saved progress
- Unaffected: same storage key and item keys, no migration, nothing ticked automatically.

## 0.1.2 — 2026-10-13

Licensing and unofficial-guide wording.

### Changed
- License: code is PolyForm Strict 1.0.0 (source-available: noncommercial use, no redistribution or modified versions).
  Guide text, data selection, the project's name and branding, and its artwork are all rights reserved. Versions up to
  0.1.1 were MIT and keep that license. See LICENSE.
- Contributions: issues are welcome; code contributions require a written grant.
- The guide is described as unofficial everywhere (README, share cards, installed-app name).
- Footer: NCSoft disclaimer, a "check in game" note, copyright and a Privacy link.
- Sources card says "every sourced value"; the "verified" badge explains itself.
- PRIVACY.md: note on the claude.ai build and a Changes section.
- ROADMAP.md re-sequenced: foundations (0.2) before correctness (0.3), characters (0.4), new players (0.5), then classes.

### Saved progress
- Unaffected.

## 0.1.1 — 2026-10-13

Automatic releases and CI upkeep.

### Added
- Automatic releases: after tests and the deploy pass on `main`, CI tags each new version and publishes its GitHub
  Release from this changelog (`scripts/release-notes.mjs`). CI fails early if a version has no changelog section.
- ROADMAP.md: 1.0 scope (all classes, Asmodian), versioning, how objectives are worked, the 0.1.x and 0.2 plans.

### Changed
- GitHub Actions updated to their current major versions (Node 24 runtime); runners pinned to Ubuntu 24.04.

### Saved progress
- Unaffected; no change to the app.

## 0.1.0 — 2026-10-12

Repository and standalone site.

### Added
- Published at https://aion2.ishkabytes.com/ (GitHub Pages) alongside the claude.ai artifact. The app is unchanged
  from v291.
- Document head: charset, viewport, description, canonical URL, Open Graph, theme colour, favicon, web app manifest.
- Installable and offline on the standalone site: service worker (network-first for the page, cached icons, cache
  versioned per build). Never in the claude.ai build.
- Footer: fan-made / not affiliated with NCSoft, data credits (linked to the Sources card), Metabot credit link.
- Build (`scripts/build.mjs`) produces the site (`dist/`) and the claude.ai single file (`dist-artifact/`, icons as
  `/_blob/<id>`). The data generator and all test suites run from the repository; CI tests every push and deploys
  `main`.

### Changed
- Export progress downloads a file directly outside claude.ai; inside claude.ai it still uses the artifact's downloads
  permission. Import is unchanged.

### Saved progress
- Unaffected.

## v291 — E4 (QA3 findings) + head fix

- "Put <stigma> on E" ticks itself when the slot is marked equipped (one-time `eputSync1` migration for saves that
  already had equipped slots).
- Optional steps count only once ticked: milestones with only optional steps left show *Cleared*, not *Missed*.
- Skills past the plan: "N points spare · no sourced plan past this". Hint shows how many following upgrades your points
  cover.
- Level-gated story card suggests what to do meanwhile (Sealed Dungeons, strongholds, highest open expedition, daily
  dungeon).
- Stigma "x of y spent" total is stable (92 = all four planned stigmas to their targets).
- Last Altgard quest: Journey button marks it turned in; end state "Altgard story complete · continue in Reshanta".
- Regional card: stays while quests are snoozed ("Show again"); "+N waiting on the story" row with an *In my game*
  override. "single source" tag on single-source skill buys.
- Data: one zone fix (Nine Wonders of Altgard: 2nd Leg → Battlescar Mound); Sources card wording.
- Head fix (v291b): empty "Regional quests · Lv N" sub-headings are hidden; Export uses the claude.ai downloads
  permission.

## v290

Fixes between E3 and E4 (QA3 pass), not separately logged.

## v289 — E3

- Regional quests without any prerequisite data open at their recommended level, not Lv 10; snoozes on them survive
  Level up until then.
- Milestone quest rows: *In my game* pill on locked quests; one snooze label ("Not in game yet").
- Next up: story card always in the stack; stack height follows the visible card; byStory steps tick with the story;
  board "opens" steps replace the buy card until done; Lv 45 extras are optional and Advanced only.
- Stigma pick: plain name with "change ▾", "Other…" for any stigma; "needs 1 shard" state.
- Zones: one zone per giver camp (10 quests moved; e.g. Quai Campsite → Calderon Canyon). Unverified group in Confidence.
- Layout fixes at 390 / 1100 px; Sources card grouped per site.

## v288 — E2 (data integration)

- All 58 regional quests from verified data: giver, Kibelisk, zone, rewards, recommended and unlock level; 17 regional
  prerequisites and 43 story gates; quests placed in milestones by level.
- Main story Lv 41–45 (Daybreak Society … Forgotten Commander) and the end-of-Altgard state.
- Strongholds (zone, level range, Kibelisk); Sealed Dungeon Kibelisks; dungeon XP removed (mostly unknown).
- Build: stigma plan Triniel's Dagger, Illusive Clone, Swift Contract, Savage Fang; upgrade plan Triniel's Dagger to 10,
  then Illusive Clone toward 20; seven skills appended after the core eight; Vaizel / Triniel board nodes; Ariel removed.
- Every claim re-checked (claims.json): rewritten, dropped or labelled. Confidence and Sources cards generated from data
  (291 links).

## v287

Fixes after E1, not separately logged (the pre-E2 baseline used by the migration tests).

## v286 — E1 (stable keys, fixes, clean-up)

- Stable keys: regional quests `rq:<id>`, Sealed Dungeons `sd:<slug>`, every other item an explicit key. One-time
  migration (`migV5`) copies ticks from the old position keys; old keys are left in place.
- One Next up card per stigma equip; short titles; skills card when the plan is spent; story end handled.
- Snooze ("not yet") for regional quests; stigma pick per slot with an undo toast.
- Removed: Paid tasks filter, dead JS, ~450 unused or overridden CSS rules (CSS 136 → 107 KB). `update()` ~3× faster.
- Export / import progress; new installs start with cleared milestones folded; accessibility fixes.

## v285

Baseline before the polish passes (the migration-test baseline in `tests/baselines/v285.html`).
