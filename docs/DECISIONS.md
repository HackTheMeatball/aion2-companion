# Owner decisions

Decisions the owner made, so every department works from the same answers. Newest first. Product calls belong to the
owner; the CEO records them here and in the department charters they affect.

## 2026-10-15

| # | Topic | Decision |
|---|---|---|
| — | How 0.3 ships | Owner (2026-10-15, 19:43 ET) followed the CEO recommendation: every push to `main` deploys, so each 0.3 step goes live when merged once the owner has approved it (E4 went live 19:10 ET). "0.3.0" is the version bump and CHANGELOG at the end, not a holding branch. Visible steps still wait for the owner's approval with a list of who is affected and before/after screenshots. |
| — | Story runs of strongholds / Expeditions | Owner (19:37–19:40 ET): Cemetery Cleanup clears Graverobber Den (map shows it cleared). Disturbed Balance, Canyon's Secret and Mirror of Greed are the first runs of Krao Cave, Urugugu Canyon and Fire Temple ("they do match"). Forgotten Commander → Draupnir stays inferred. Records: `sh:graverobber-den` and the Expedition "opens" rows (`g20:exp` and the Urugugu Canyon / Fire Temple rows). They are derived done, never written (#69). Derivation only marks them done; the item-level atoms still gate when they open, and Krao Cave check 2 stays open. |
| — | Kibelisk binding (0.4) | Owner (19:20 ET), refines "Teleport rules": binding happens near the Kibelisk, observed at about 30–40 m. 0.4 assumes "bound" only within 25 m of a quest step; 25–150 m gets a one-time "Bind X" nudge; beyond that, nothing. Teleport works from the first bind and costs a Return Scroll. |
| — | Regional gate semantics | Owner (19:10 ET, "flip the 45"): regional-quest story gates mean "turned in", not "reached". Evidence: in game, Shugo-of-All-Trades appeared only after Contaminated Area was turned in, and Spooky Specters only after Cemetery Cleanup was turned in (owner screens, alt character, 2026-10-15). The Lv 16 Empyrean Monolith check is confirmation. **Supersedes D9 and design Q1 for regional-quest story gates.** Applied in #69 (E9 part 1). |
| — | Reward choices | Owner (18:44 ET): a quest's reward choice gets a guide note only when one option is clearly better or can't be obtained again. The Gathering Essentials pet note is removed: all three pets are Common, show no stats, and share item sources (owner screens). |
| — | Villages as zones | Owner (2026-10-15, 12:56): villages (Odar's Shade, Fang Hideout, …) become zones of their own, following the data (Metabot first). Planned for 0.2.4. |
| — | New character level | Owner screens (2026-10-15): turning in "A Village in the Fog" (Aldelle Village chief) takes a new character from Lv 1 to Lv 2 (basic rewards 100% EXP and 1.4K; additional reward Life Potion (Bound) ×50). A new character is Lv 2 before "Prepare to Escape". Screens are kept by the owner (private material, not copied into this repo). |
| — | Story-card edge case | Owner (2026-10-15, 13:05) followed the CEO recommendation: the Lv 44 all-ticked case (Forgotten Commander offers "Turned in" at Lv 44) is fixed inside 0.3 step E4 and shown to the owner with that step's before/after screenshots. |
| — | Fresh browser | A new browser starts at Lv 1 on the first story quest ("A Village in the Fog"), not Lv 5 with no quest (owner request). Saves are never re-defaulted. Ships as 0.2.1. |
| — | Patches before 0.3 | Owner followed the CEO's recommendation: more, smaller 0.2.x patches before 0.3.0 (sequence in ROADMAP "0.2.x"); invisible work lands between them. |
| — | Smart Next up | Owner followed the CEO's recommendation: location-aware Next up, fastest / completionist and catch-up (F1, F9, F10, F15) are their own minor, 0.4, after 0.3 correctness. Later minors move up by one (see the renumber note in ROADMAP; older rows here keep their numbers, e.g. D7 characters "0.4" is now 0.5). |
| — | Autonomous 0.2 → 0.3 cycle | Owner (00:31): the CEO runs the cycle overnight and merges itself, starting its own sessions. Rules: merge only with green CI, a sign-off from a separate reviewer that didn't write the work, and save tests passing; saves only ever added to; screenshots of visible changes kept for the owner to check afterwards (undo by a follow-up patch). Held for the owner: 0.3's intended Next up behaviour changes, anything risky or hard to undo, new game art beyond the icon OK, money / accounts / legal. Includes merging and releasing 0.2.x patch versions (live on daevacompanion.com); the 0.3.0 release waits for the owner. "Save tests" means `npm test` green including `mig1`, `mig2` and `journey` (CLAUDE.md). Applies to this cycle only; the normal merge rule returns after 0.3.0 unless the owner says otherwise. Source: owner in the CEO chat, 2026-10-15 00:31 and 01:52–01:53 America/New_York ("automate merges for this"; "hold all for my review, but get all the way there", where "all" is 0.3: its Next up behaviour changes and the 0.3.0 release, confirmed at 02:12: "you're running the show from here on out til right before 0.3 where i review everything"), https://claude.ai/code/session_01E2AXg7RLHKGrneMvZ2rgmJ. |

## 2026-10-14

| # | Topic | Decision |
|---|---|---|
| — | Daevanion board gate (#38 §3) | Owner followed the CEO recommendation: the Daevanion card gates the Nezekan board on completing "Urgent Pursuit" (Lv 13), built in 0.3 with the requirement evaluator, not as a 0.2.x patch. Listed as a 0.2.0 known issue until then. |
| — | Teleport rules (0.3 design) | Owner: a Kibelisk unlocks by walking near it; a teleport costs one scroll (~1,000 Kinah; many come from leveling and rewards). Unlocked Kibelisks are derived from ticks (nearest Kibelisk of completed items), never stored; a manual override can be added later. Scrolls are not tracked. A teleport is suggested only when it saves real distance (threshold tuned in game, e.g. ~400 m), shows its cost ("1 scroll"), and each card has an "I'll walk" override; an optional "Prefer running" setting, off by default. |
| — | Icons | Standing OK: sessions add skill, stigma and item icons from approved sources (Metabot first; served from metabot.gg, no new domain) with provenance in docs/ISSUES.md. Other game art still needs the owner's OK. |
| — | Ascension quests | No map location (they unlock and the player teleports in). Excluded from location tie-breaks; ticking one doesn't move the last confirmed location. Ascension steps whose prerequisites are met rank first in Next up. |
| — | Browser automation on no-bot sites | Not used: an AI-driven browser is still automated access. Tier-1 sites get an owner hand-check sheet instead. |
| — | Sources (#32) | dbaion2.ru / .online rejected for sessions (terms ban bots; owner hand checks only). aion2hub.com approved for spot checks as weak corroboration ("single source, pre-launch client" unless confirmed); added to the "Daeva Companion" environment. Metabot quest/dungeon/stronghold coordinates and nearest-Kibelisk distances may be used, with page links, without asking first (non-commercial, credited). Coverage measurement (L1–L3) approved. |
| — | Travel model | Next up can weigh "teleport to Kibelisk X, then run N m" against running (Zygor-like), from Metabot coordinates and Kibelisk distances; designed in 0.3. |
| — | Stigma unlock | Owner recalls Lv 22 (matches Metabot and our data); aion2hub's Lv 23 treated as wrong. Owner recollection, not a screen. |
| — | Data format v2 review (#30) | Owner approved all recommendations: un-ticks survive sync (per-item change time); view settings don't sync; owner screens outrank databases (disagreement kept, screens cited by short code with game version); per class one guide build + up to two credited alternatives (choices only, two agreeing sources or "single source"); custom builds start from a listed build, saved per character and in Export, never silently dropped; fastest/completionist labels proposed by the team and approved per milestone in 0.3; English names stay as save labels; no per-item "checked on" dates; "Daeva Trapped in a Nightmare" added after the owner's check. |
| — | Location-aware Next up | Goal: always recommend the next best thing (Zygor-like) for both tracks. Tie-break equal choices by distance from the player's last confirmed location, inferred from the most recently ticked item that has a location (no live tracking). Show confirmed drawbacks of the "fastest" track. Whether two tracks make sense is re-evaluated in the 0.3 design. |
| — | Data fetching | Approved: robots.txt and AI opt-outs respected; 12 req/min/host, one at a time, 24 h cache, stop on any block (data-research.md). |
| — | aion2.th.gl | Not used by sessions (its robots.txt excludes AI agents); removed from the "Daeva Companion" environment; no outreach for now. th.gl-sourced facts are re-verified against a permitted source (Metabot first) and attributed to it, or labelled for an owner check. |
| — | Metabot terms | The site is non-commercial today and qualifies; permission is needed before any change to that. |
| — | Environments | Research sessions: "Research (open web)" (Full network). Code, review and docs sessions: "Daeva Companion" (custom allowed sites). "Default" is unused. |
| — | 0.3 default mode | Next up defaults to "fastest", with a "completionist" toggle. |
| — | Merging | Until branch protection with a required `ci-ok` check is on, nothing merges without the owner's OK. After that the CEO merges invisible changes when green; visible changes always wait for the owner. |
| — | Work plan | Department plan adopted (ROADMAP, HANDOFF "Now and next"); wave 1 runs six parallel sessions. |
| D8 | Next class | Rule: a class the owner or a tester will level to 45 first, then best data coverage (classes-and-gaps report), then most shared with Assassin (default Gladiator). Picked when the report lands. |
| — | Changelog | Structured, neutral changelog in a fixed section order (qa-release.md, "Changelog format"), checked by `scripts/release-notes.mjs`; 0.1.0–0.1.8 rewritten; CI keeps every published GitHub Release title and notes in sync with CHANGELOG.md. QA & Release owns it. |
| — | Colours | Not now: current colours are placeholders while the foundations are built. Before any colour work, the CEO goes through the research with the owner. |
| D1c | Address | The owner bought daevacompanion.com and daevapath.com (Cloudflare). The app moves to **https://daevacompanion.com/**; daevapath.com and aion2.ishkabytes.com forward there. Saved progress is per address: users Export on the old address and Import on the new one. |

## 2026-10-13

| # | Topic | Decision |
|---|---|---|
| — | 0.2 P1 settings | CEO: esbuild turns top-level `const` into `var` until P3 (accepted); CSS not run through esbuild; no minification in 0.2. |
| D1 | Name | **Daeva Companion** — a full game companion for AION 2 (leveling now; endgame and more features later), not just a leveling guide. Replaces the earlier "Ascend Companion" (too general). "Daeva Compass" ruled out: an active AION 2 guide site already uses it. Web address on hold; the site stays at aion2.ishkabytes.com until the owner decides (every address change needs export/import). |
| — | Rebrand | Approved and shipped (0.1.7): Daeva Companion name, Compass Quill mark and icons; app palette unchanged. |
| — | Colours | Game-inspired palette researched (docs/research/colors-2026-10); applying it is a later sprint. In-game checks happen in one session once the direction is chosen. |
| — | Class colours | Approved: WoW-mapped (Gladiator=Warrior, Templar=Paladin, Assassin=Rogue, Ranger=Hunter, Sorcerer=Mage, Spiritmaster=Warlock, Cleric=Priest, Chanter=Druid). Global has 8 classes; Brawler is KR/TW-only for now. |
| D1b | Brand | Direction **C, Compass Quill**: a brass and parchment compass whose needle is a red feather, on deep teal. Original art only. |
| D2 | Hosting | Stay on GitHub Pages for now; move to Cloudflare Pages (same address, PR previews) when convenient. |
| D3 | Private history | Session transcripts and personal screenshots go to a private repo the owner creates. |
| D4 | claude.ai version | Owner moves his progress to the site (Export → Import); the artifact is then frozen with a "moved" notice. |
| D5 | 0.2 Foundations | Approved: ES modules + esbuild, no framework, output identical; data format v2 reviewed by the owner before it is built. |
| D6 | Merging | The team merges fixes, docs, tests and invisible changes when CI is green; the owner approves anything visible. |
| D7 | Characters | Several characters per browser (0.4); the existing save stays character 1. |
| D8 | Next class | Decided later. |
| D9 | Story gates | Default meaning stays "story has reached X"; "turned in" is a separate gate where needed. |
| D10 | Archive screenshots | In-game screenshots move from the public `archive` branch to the private repo. |
| D12 | Footer | Approved as shipped in 0.1.5. |
| A1 | Item icons | Confirmed in game: leaf gem = Wisdom Stone, square arch tile = Daevanion Crystal (file names fixed). |
| I2 | MIT versions | v0.1.0 and v0.1.1 stay as they are (MIT for those versions only). |
| — | Accounts / sign-in | Per the consultant's recommendation (the owner delegated the call): no accounts for now; 0.5 adds an anonymous, end-to-end encrypted sync code; later minors shift by one. |
| — | Team | In-house departments: Engineering, QA & Release, Tech Lead, Product Design, Data & Research, Support (docs/team). One-off projects: brand identity, mobile & accessibility audit, data-format second opinion. |
