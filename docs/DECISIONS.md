# Owner decisions

Decisions the owner made, so every department works from the same answers. Newest first. Product calls belong to the
owner; the CEO records them here and in the department charters they affect.

## 2026-10-14

| # | Topic | Decision |
|---|---|---|
| — | Data fetching | Approved: robots.txt and AI opt-outs respected; 12 req/min/host, one at a time, 24 h cache, stop on any block (data-research.md). |
| — | aion2.th.gl | Not used by sessions (its robots.txt excludes AI agents); removed from the Default environment; no outreach for now. th.gl-sourced facts are re-verified against a permitted source (Metabot first) and attributed to it, or labelled for an owner check. |
| — | Metabot terms | The site is non-commercial today and qualifies; permission is needed before any change to that. |
| — | Environments | Research sessions: "Research (open web)" (Full network). Code sessions: Default (custom list). |
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
