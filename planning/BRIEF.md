# Project brief — Aion 2 Asmodian Assassin leveling guide (single-file web app)

App: assassin-route.html (published as a claude.ai artifact; ~380KB, HTML+CSS+JS). Backups: backup-v285-before-polish.html (current), backup-v284-before-zygor.html.
Test harness: `bash icons/map.sh` → test-icons.html (local icons); Playwright: `NODE_PATH=$(npm root -g) node script.js $PWD/test-icons.html` (chromium preinstalled; never run playwright install). State in localStorage key 'aion2-assassin-route-v4' (global `state`). Mojibake in local screenshots = charset artifact of test file, ignore.
Research data already gathered: data/story.json (story objectives + Kibelisks Lv 24–40), data/locations.json (Kibelisk/XP for dungeons and some regional quests), data/current-areas-quests.json (lists).

## The user
- Plays F2P Asmodian Assassin, character "Ishkabibble" on Azphel (global). Currently ~Lv 25–27.
- Technical/engineering person. Wants: verified data only (if a claim can't be verified by 2+ sources or in-game screens, it shouldn't appear; in-game screens are source of truth), no redundancy, consistent alignment, minimal visual distraction, no clutter, uniform card layouts. Direct, technical communication; call out assumptions.
- Happy with manual progress: ticking quests, Level up button. Does NOT want screenshot parsing or automation. No packet sniffers/memory reading (ToS risk).
- Goal NOW: the guide should be a complete, polished product that is correct for the rest of his leveling (Lv 25 → 45) without him having to flag problems as he goes.

## App structure (high level)
- Header with Basic/Advanced mode switch. Basic = essentials only.
- Left rail: Progress ring (quests/dungeons/strongholds), Journey (level −/+/Level up/slider, main story quest input with objectives + filter, "Ahead" verified unlocks), Dungeons & Strongholds card (band dropdown, two-click in-progress/cleared), map note.
- Top grid: Skills card (stones, pts, next upgrade, coming up, Sync levels), Daevanion card (crystals, next node, boards), Stigmas card (shards, next upgrade, coming up, Slots footer).
- "Next up" header + card stack (one card at a time, snap-scroll), pop-out mini window (Document PiP), hotkeys, regional quests aggregate card with checkboxes + follow-up chains (QUEST_AFTER) + map links, dungeon/stronghold pick near story step.
- Milestones (GATES) per level with steps; regional quests listed in milestones; milestones with only side quests left step back ("Side quests" tag, hidden in Basic / by Cleared filter).
- Build drawer (right edge tab): stat priority tiers, rotation (right-click stack, Q Shadowstrike, E stigma stack), key setup grid, "Coming to E".
- Confidence and Sources cards (collapsible).

## Known issues / history the user cared about
- Regional quest follow-ups: guide showed quests as available that only unlock after another quest (In the Fang Legion's Name after Blade of Vengeance; A Guardian's Sacrifice after Young Elim's Story — the latter inferred). Two more inferred from names (Invitation to the Past Part 2, Nine Wonders 2nd Leg). Need verified chain data for ALL 58 regional quests.
- Unverified content was removed from "Ahead" — same standard should apply to all milestone text, tips, stat priority, rotation order (E stack order is an inference), stigma shard costs (Metabot only), stigma upgrade priority.
- Data gaps: Kibelisk for 41/58 regional quests, all strongholds; dungeon XP for 50/60; story objectives missing before Lv 24? (check coverage A New Lead onward); Supply Request was wrong before (fixed).
- Many UI iterations; card layouts should be uniform across Skills/Daevanion/Stigmas; Next up cards should be milestone-card-like.
- Earlier bug: story change auto-set level (fixed). Earlier: Duty Quests confused with Supply Requests (fixed).
- Metabot (metabot.gg) is the main data source; reuse allowed with dofollow link attribution. Its MCP connector does NOT cover AION 2. Fetching metabot pages requires approval prompts; WebFetch requires URLs to have appeared via search first sometimes.
