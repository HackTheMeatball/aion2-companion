# E3 fix list (from QA2; coordinator decisions in brackets)

F1/P1-1 Story card must always be in the Next up stack (never sliced off). Also cap the stack sensibly but keep story + regional card.
P0-1 Quests with NO prerequisite data (Great Curse-Breaking Caper, Her Last Favor, Pain Unending, Traveling Merchant's Conundrum, Herb Pouch Heist, Lest We Forget): [available from their recommended level `rec`, not unlocksAt]. Snooze for them persists until rec reached (not cleared each level-up).
P0-2 Locked regional quest rows: hide "Opens once the story reaches…" line when the quest is in progress or done; add a small visible "In my game" action on locked rows (one click marks it available/in progress — same as clicking the box). Keep wording consistent with the snooze ("Not in game yet") — use the same label everywhere for snooze.
P1-2 Next up stack: size the stack to the card currently snapped into view (or allow each card full height), so taller cards aren't clipped; keep the peek of the next card.
P1-3 Duplicates: skip milestone items whose story chip is the current quest when the story card is present ("Mirror of Greed: the Fire Temple run" vs "Story: Mirror of Greed"); "Vaizel board opens" vs board card — dedupe to one.
P1-4 Lv 45 advice items ("Time your Ascension Trial", "Abyss Points: Stigma Shards first" etc.) → optional, ranked after the story.
P1-5 Quest names in Next up regional list: wrap instead of truncating (or keep the distinguishing suffix); no identical truncations.
P1-6 Stigma slot "ready to equip" with 0 shards → show "Needs 1 shard · +1 at Lv N" and disable the equip button until shards ≥ 1 (keep Undo flow).
P1-7 Header overlap at ≤600px: fix the !important grid rule so the narrow layout applies.
P1-8 Top cards at 1100px: stigma pick dropdown not truncated; Skills "19 /4 pts" label vs button overlap; Daevanion hero name truncation; "VAIZEL BOARD✓" spacing. Ensure uniform hero rows still align across the three cards (syncHeroRows).
P1-9 Zones: derive zone from the Kibelisk's zone with a small camp→zone table (Quai Campsite→Calderon Canyon, Safe Haven→?, Nornir Assembly→?, etc. — use data/rq.json, data/locations.json, data/strongholds.json, AREA_LOC to build a consistent Kibelisk→zone map by majority; for camps that are not zones use the Altgard sub-region). No camp names as zones; same camp → one zone.
P2-1 Snooze label consistent ("Not in game yet") with a compact form in Next up.
P2-2 Stigmas card "−N" meaning: make Basic and Advanced consistent (shards short).
P2-3 Skills card wording: "82 more available at Lv 27" → count of upgrades phrased clearly (e.g. "+N more upgrades available now"); "13 /2 pts" → "13 of 2 pts"/better; "priority #2" no orphan wrap.
P2-4 "Later" cards: only show the next upgrade per skill, not jumps.
P2-5 New skills (Impact Hit etc.) missing icon → use a neutral placeholder consistent with others (initials square like stigmas) — no empty boxes.
P2-6 Daevanion "All planned nodes acquired" while Vaizel plan ahead → "All nodes open now acquired · next: Vaizel at Lv 30".
P2-7 Sources card: one row per source site with count and what it supports; full link list behind a toggle per site. Keep it collapsible and clean.
P2-8 Confidence card: fix misfiled "Not verified anywhere" under Disputed (move to Unverified group).
P2-9 Stigma pick dropdown: offer all 13 Assassin stigmas? [Only the 4 planned + "Other…" free entry is cleaner; your call — must allow recording an off-plan pick.] Make the dropdown affordance clearer but minimal.
P2-10 Regional card subline: drop the milestone level list.
P2-11 Story input: don't truncate the current quest name (allow wrap or tooltip + wider).
P2-12 "+5 from levels" next to "0 shards" → wording "5 earned from levels" (title) consistent with Skills "+86 from levels" meaning.
P2-13 Herb Pouch Heist in Lv 40 milestone → place in the milestone by rec (44 → Lv 40 is the highest gate ≤44; fine) — just make sure it doesn't appear in Next up before rec.
