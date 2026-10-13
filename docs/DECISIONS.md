# Owner decisions

Decisions the owner made, so every department works from the same answers. Newest first. Product calls belong to the
owner; the CEO records them here and in the department charters they affect.

## 2026-10-13

| # | Topic | Decision |
|---|---|---|
| — | 0.2 P1 settings | CEO: esbuild turns top-level `const` into `var` until P3 (accepted); CSS not run through esbuild; no minification in 0.2. |
| D1 | Name | **Daeva Companion** — a full game companion for AION 2 (leveling now; endgame and more features later), not just a leveling guide. Replaces the earlier "Ascend Companion" (too general). "Daeva Compass" ruled out: an active AION 2 guide site already uses it. Web address on hold; the site stays at aion2.ishkabytes.com until the owner decides (every address change needs export/import). |
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
