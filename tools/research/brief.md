# Project brief — Aion 2 Asmodian Assassin leveling guide (single-file HTML artifact)

File: assassin-route.html (published as a claude.ai artifact; user views it in a browser, Basic and Advanced modes).
Player: Asmodian Assassin, F2P, currently ~Lv 27 on global server Azphel, levels 1→45. Plays through the main story; uses the guide while playing.

## What the user wants (stated, repeatedly)
- A COMPLETE, polished product that is "fixed for me moving forward" — he should NOT have to report bugs/flag issues as he levels from ~27 to 45.
- Verified data only: if a level/unlock/requirement can't be verified (official source or 2+ independent sources, or seen in game), leave it out or mark it clearly. In-game screens are the source of truth.
- Minimal visual distraction, consistent alignment, no redundancy (no duplicated info across cards), uniform card layouts.
- Manual progress tracking is fine (he likes ticking levels/quests; does NOT want screenshot sync). Level only changes when he presses Level up / −/+ / slider.
- Technical register; call out assumptions; propose tests rather than guess.

## Structure (current)
- Header with Basic/Advanced switch. Left rail: Progress (ring + Quests/Dungeons/Strongholds rows), Journey (level control, red slider, main story timeline + objectives filter, "Ahead" verified unlocks), Dungeons & Strongholds card (band dropdown, two-click in-progress/cleared boxes), Map card.
- Top grid: Skills card, Daevanion card, Stigmas card (shards, upgrade plan, Coming up list, Slots footer). Each has hero row + status box/button + Coming up list with fade.
- Next up: wide section above Milestones; header "NEXT UP" + Pop out (Document PiP) button; stack of one-task cards (snap scroll, next card peeks); card types: in-progress dungeon, Cube items, skill buy, board node, stigma equip/upgrade, milestone unlock steps, missed unlock steps, story (objectives checklist, Turned in), Regional quests aggregate card (checkbox per quest, chains via QUEST_AFTER shown "A → B", progress bar on card bottom edge), Sealed Dungeon pick, Stronghold pick, Later items. Hotkeys (Space/Enter done, arrows).
- Milestones: cards per level gate (GATES); regional quests two-click (in progress → done); milestones with only regional quests left step back ("Side quests" tag, hidden by Cleared filter / in Basic).
- Right "Build" drawer: stat priority tiers, rotation (right-click chain, Q Shadowstrike, E stigma stack derived from equipped stigmas), key setup grid, "Coming to E".

## Known open issues / history to address
- Regional quest prerequisites/chains: only 4 chains known (QUEST_AFTER); In the Fang Legion's Name and A Guardian's Sacrifice were shown as available when they weren't. Need full verified chain data for all 58 regional quests (Metabot quest pages often list previous/next quest).
- Location data gaps: Kibelisk known for 54/60 dungeons, 17/58 regional quests, 0/15 strongholds; dungeon XP for 10/60.
- Story objectives exist A New Lead → Symbol of Liberation (Lv 40); Lv 40–45 not covered.
- Unverified bits still in guide: stigma shard costs (Metabot only), E-stack order (inference), stat priority tiers (old research), slot order note.
- Data sources allowed: Metabot (credit with link), allthings.how, wikily, thegameswiki (CC BY-NC-SA), games.gg, PlayNews, GamesFuze, KeenGamer, aion2hub. Avoid game8 (no reproduction). Metabot's MCP connector does NOT cover AION 2.

## Testing
bash icons/map.sh → test-icons.html (local icons). Playwright: NODE_PATH=$(npm root -g) node script.js $PWD/test-icons.html (chromium preinstalled; never install). Seed localStorage 'aion2-assassin-route-v4' then reload. Mojibake in screenshots = charset artifact.
