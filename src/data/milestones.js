/* Milestones (GATES) and route rules (STEPS): text and item keys. Keys are permanent (docs/ARCHITECTURE.md §1).
   Moved out of src/main.js unchanged (0.2 P2). Every export is still a page global (scripts/build.mjs). */
import { ASC, I, T, dvNodes, eRow, hideouts, mapQ, stn } from "./markup.js";
export const GATES = [
  { id: "g6", lv: 6, title: "Wings and Ascension", blurb: "Two story quests around the lake. Don't delay them.", items: [
    { k: "g6:0", byStory: true, ns: `Complete "The Being Beneath the Lake"`, story: "The Being Beneath the Lake", t: `<b>Complete "The Being Beneath the Lake"</b> (unlocks wings) and <b>"Spread Your Wings"</b>. Its Ascension step is Asahr's quest "The One Who Perceives" at Dream Crossroad; finishing it completes that step.<span class="loc">Story quests in Ishalgen · Witch's Cabin · Elvida (after "Isolated Lake")</span>` },
  ]},
  { id: "g9", lv: 9, title: "Enhancement unlocks", blurb: "Save your stones; only the belt and amulet are always worth it.", items: [
    { k: "g9:0", ns: `Save your ${I("enhance")}`, t: `<b>Save your ${I("enhance")}</b> in the Cube. ${T("Enhance", "enhance")} the belt and Revelation amulet once you have them; other gear only if a boss or Sealed Dungeon actually stops you, weapon first. The first real supply is the Lv 10 Sealed Dungeons (1,250 each). Strongholds are the main source of belt enhance scrolls (2 each); both are in Dungeons & Strongholds.`, note: "The 5 stones from the Lv 7 quest were likely spent in Pelleir's tutorial, usually on your starting weapon (look for a +1). Extract that weapon once it's replaced to get them back." },
  ]},
  { id: "g10", lv: 10, title: "Altgard opens", blurb: "Extraction and pets unlock. Sealed Dungeons and Strongholds open; tick them in Dungeons & Strongholds.", items: [
    { k: "g10:0", ns: `Extract gear you've replaced`, t: `<b>${T("Extract", "extract")} gear you've replaced:</b> open the Cube, click the old piece, choose Extract and confirm. Only gear in your Cube can be extracted, not what you're wearing, so the option appears once a drop replaces something.` },
    { k: "g10:1", byStory: true, ns: `Complete "Gathering Essentials"`, story: "Gathering Essentials", t: `<b>Complete "Gathering Essentials"</b> to unlock pets, then set the ${T("pet loot filter", "petfilter")}.<span class="loc">Story quest after "Survival Supplies" · Safe Haven · ${mapQ(2102020, "VeKauf")}</span>`, note: "Pet choice: take Armadon or Tog. All three ride and give the same bonus, but Fossa can be collected later from Fossa soul drops around Lv 24." },
    { k: "g10:wisdom", ns: `Use your ${I("wisdom")}`, t: `<b>Use the ${I("wisdom")} from Sealed Dungeons and quests.</b> Each becomes 1 ${T("Skill Point", "wisdom")} only when you use it from your Cube.` },
    { k: "g10:5", ns: `Claim Daeva Pass free-track rewards`, t: `<b>Claim Daeva Pass free-track rewards</b> as you earn them.`, upsell: "Premium track costs Quna (real money). Skip it." },
    ...hideouts(["Abandoned One's Grave","Dratona Cave","Dusk Pit","Hidden Vein Cave","Lost Ruins","Old Graveyard","Ossuary of the Noble","Poisonous Plant Habitat","Smuggler's Cave","Treasure Hunter's Residence","Trickster's Den","Valka's Nest","Watcher's Temporary Outpost"], "g10h"),
  ]},
  { id: "g12", lv: 13, title: "Daevanion board", blurb: "First Daevanion board (Nezekan) opens at Lv 12; first regional quest.", items: [
    { k: "g12:0", byStory: true, ns: `Complete "Urgent Pursuit"`, story: "Urgent Pursuit", t: `<b>Complete "Urgent Pursuit"</b> to unlock the ${T("Daevanion board", "daevanion")}. Use every ${I("crystal")} from the Cube. Nodes are in the Daevanion board card at the top. Two clusters, from your board: above the centre, Heart Gore with Exploit Weakness 1 branching off its path (11 for both); below the centre, Ambush (7) and Quick Slice (6) share their first two nodes (11 for both), and Exploit Weakness 2 sits 5 past Quick Slice. All five come to 27. Where a node has two routes, take the one with Critical Hit and Attack over HP and Critical Hit resist.<span class="loc">Story quest after "Veiled Truth" · Quai Campsite · ${mapQ(2102065, "Ulgorn")}</span>`, note: "Same quest unlocks the Shugo Festival." },
    { k: "dv:hg", dv: true, board: "Nezekan", blv: 12, ty: "a", t: `Heart Gore` },
    { k: "dv:ew", dv: true, board: "Nezekan", blv: 12, ty: "p", t: `Exploit Weakness · 1 of 2`, via: "branches off the Heart Gore path" },
    { k: "dv:amb", dv: true, board: "Nezekan", blv: 12, ty: "a", t: `Ambush`, via: "shares its first two nodes with Quick Slice" },
    { k: "dv:qs", dv: true, board: "Nezekan", blv: 12, ty: "a", t: `Quick Slice`, via: "shares its first two nodes with Ambush" },
    { k: "dv:ew2", dv: true, board: "Nezekan", blv: 12, ty: "p", t: `Exploit Weakness · 2 of 2`, via: "past the Quick Slice node" },
    { k: "dv:as", dv: true, board: "Nezekan", blv: 12, ty: "p", t: `Assault Stance · 1 of 2` },
    { k: "dv:as2", dv: true, board: "Nezekan", blv: 12, ty: "p", t: `Assault Stance · 2 of 2`, via: "its path also gives Rear Smite +1 (Back Attack Damage Boost)" },
    { k: "dv:corner", dv: true, board: "Nezekan", blv: 12, ty: "c", t: `Cooldown Reduction or Combat Speed corner`, via: "corner node costs 4 (worked out from your board)" },
    { k: "dv:ie", dv: true, board: "Nezekan", blv: 20, ty: "a", t: `Insignia Explosion`, via: "bottom edge; path cost inferred, about 3–5 (GamesFuze node pick)" },
    { k: "dv:ss", dv: true, board: "Nezekan", blv: 20, ty: "a", t: `Shadowstrike`, via: "just above Start; path cost inferred, about 3–5 (GamesFuze node pick)" },
    { k: "g12:belt", ns: `Enhance the Noble Belt`, t: `<b>Noble Belt:</b> the main story hands it to you around Lv 13 (it can't be missed). Enhance it +1 each time you get a <b>Noble Belt Enhance Scroll</b> (2 per Stronghold, see Dungeons &amp; Strongholds). Each +1 also costs Enhance Stones and Kina; success is 100%.` },
  ]},
  { id: "g15", lv: 15, title: "Ring quest and skills", blurb: "Spooky Specters for a ring, plus four skill upgrades.", items: [
    ...hideouts(["Abandoned Archon Jail","Bloodsoaked Confessional","Blue Dragon's Trap","Fafnite Storage Room","Fanatics' Den","Fortuneteller's Grave","Homish's Prison Compound","Howling Den","Library of Foresight","Prison of Oblivion","Victims' Cave"]),
  ]},
  { id: "g16", lv: 16, title: "Legions", blurb: "Unlock Legions; six quests fill your accessory slots.", items: [
    { k: "g16:0", byStory: true, ns: `Complete "Buried Atrocities"`, story: "Buried Atrocities", t: `<b>Complete "Buried Atrocities"</b> to unlock ${T("Legions", "guild")}, then join one.<span class="loc">Story quest after "Dead Men Tell No Tales" · the Crypt (nearest teleport: Neglected Crematorium) · ${mapQ(2102100, "Ulgorn")}</span>` },
    { k: "g16:monolith", byStory: true, ns: `Complete "Empyrean Monolith"`, story: "Empyrean Monolith", t: `<b>Complete "Empyrean Monolith"</b>, then turn in your ${T("Empyrean Traces", "traces")} at the Monolith (Resonate).<span class="loc">Story quest right after "Buried Atrocities" · ${mapQ(2102105, "Ulgorn")}</span>` },
    { k: "g16:amulet", ns: `Enhance the Revelation Amulet`, t: `<b>Revelation Amulet:</b> the story gives it at Lv 16, just before the Monolith quest. Every Monolith level from 2 gives a <b>Revelation Amulet Enhance Scroll</b>; use each one right away (+1, plus Enhance Stones and Kina).`, note: "The belt to +10 (Rare) costs 232,000 Kina and 9,280 Enhance Stones. Substance Morph then moves it up a rarity tier." },
  ]},
  { id: "g20", lv: 20, title: "Zikel board", blurb: "Second Daevanion board and a new batch of Sealed Dungeons.", items: [
    { k: "g20:0", bo: "Zikel", ns: `Zikel board opens`, t: `<b>Zikel ${T("Daevanion board", "daevanion")} opens.</b> Use every ${I("crystal")} in your Cube, then buy its nodes from the Daevanion board card at the top.` },
    ...hideouts(["Abandoned Memorial Room","Closed Hideout","Destroyed Scriptorium","Lamnah Base","Predator's Lair","Unstable Cave","Worshiper's Underground Cave"]),
    { k: "dv:z:hg", dv: true, board: "Zikel", blv: 20, ty: "a", t: `Heart Gore` },
    { k: "dv:z:ie", dv: true, board: "Zikel", blv: 20, ty: "a", t: `Insignia Explosion` },
    { k: "dv:z:qs", dv: true, board: "Zikel", blv: 20, ty: "a", t: `Quick Slice` },
    { k: "dv:z:db", dv: true, board: "Zikel", blv: 21, ty: "p", t: `Defense Break · 1 of 2` },
    { k: "dv:z:db2", dv: true, board: "Zikel", blv: 21, ty: "p", t: `Defense Break · 2 of 2` },
    { k: "dv:z:corner", dv: true, board: "Zikel", blv: 20, ty: "c", t: `Damage Boost corner` },
  ]},
  { id: "g22", lv: 22, title: "Stigma slot 1", blurb: "Stigmas and Expeditions unlock.", items: [
    { k: "g22:0", ns: `Complete "The One Who Hears the Voice"`, story: "Daeva in a Dream", t: `<b>Complete "The One Who Hears the Voice"</b> to unlock ${T("Stigmas", "stigma")} and the Pantheon.<span class="loc">Ascension quest from Asahr. Opens once your Ascension Gauge is at 100% and the story reaches "Daeva in a Dream" (Lv 22). ${ASC}</span>` },
    { k: "g22:1", stig: 1, after: "Daeva in a Dream", t: `<b>Equip ${stn(1)}.</b> Plan: Triniel's Dagger, raised to level 10 first. Any stigma fits any slot; if you equipped another, pick it in the Stigmas card.` },
    { k: "g20:exp", ns: `Krao Cave Expedition opens`, opt: true, map: "krao-cave", story: "Daeva in a Dream", t: `<b>Krao Cave ${T("Expedition", "expedition")} (Exploration) opens</b> after the story quest "Daeva in a Dream": the first dungeon you can run with friends, 1–5 players. Needs ${T("item level", "gearscore")} 200.` },
  ]},
  { id: "g25", lv: 25, title: "Supply Requests", blurb: "Hand in spare items for Abyss Points.", items: [
    { k: "g25:0", ns: `Hand in spares to Supply Requests`, opt: true, t: `<b>Hand in spares to ${T("Supply Requests", "supply")}.</b> Only items you already have and don't need; don't buy for it while leveling. Abyss Points matter mostly at 45.` },
    ...hideouts(["Dark Root Cave","Drana Depository","High Priest's Ruins","Skurv Laborer Den","Twisted Pit"]),
  ]},
  { id: "g27", lv: 27, title: "Stigma slot 2", blurb: "Second stigma goes in.", items: [
    { k: "g27:0", stig: 2, t: `<b>Equip ${stn(2)}.</b> Plan: Illusive Clone, raised toward level 20 once Triniel's Dagger is at 10.` },
    { k: "g27:1", eput: 2, t: `<b>Put ${stn(2)} on E</b>${eRow(2)}. Open with E, then Q (Shadowstrike).` },
  ]},
  { id: "g30", lv: 30, title: "Daily dungeon and Vaizel board", blurb: "Daily dungeon unlocks; Vaizel board.", items: [
    { k: "g30:0", bo: "Vaizel", ns: `Vaizel board opens`, t: `<b>Vaizel ${T("Daevanion board", "daevanion")} opens.</b> Use every ${I("crystal")} in your Cube, then buy its nodes from the Daevanion board card at the top.` },
    { k: "g30:1", ns: `Start the daily dungeon`, t: `<b>Start the daily dungeon:</b> run Daeva Bio-Research Base for ${I("enhance")}.` },
    ...hideouts(["All-Curing Cave","Dratona Assembly Area","Final Haven","Insectoid Tunnel","Library of Patience","Library of Wisdom","Rift Fissure"]),
    ...dvNodes("Vaizel"),
  ]},
  { id: "g32", lv: 32, title: "Stigma slot 3", blurb: "Third stigma goes in.", items: [
    { k: "g32:0", stig: 3, t: `<b>Equip ${stn(3)}.</b> Plan: Swift Contract. Level 1 is enough for now.` },
    { k: "g32:1", eput: 3, t: `<b>Put ${stn(3)} on E</b>${eRow(3)}. Build tab (right edge) → Key setup shows where.` },
    { k: "g32:dreams", ns: `Ascension quest "The One Who Dreams"`, story: "A Daeva Dreaming Anew", t: `<b>Complete "The One Who Dreams"</b> (recommended Lv 32).<span class="loc">Ascension quest from Asahr at Dream Crossroad. Opens once your Ascension Gauge is at 100% and the story reaches "A Daeva Dreaming Anew" (Lv 32). ${ASC}</span>` },
  ]},
  { id: "g35", lv: 35, title: "Fire Temple", blurb: "Third party dungeon opens.", items: [
    ...hideouts(["Destruction Archons Armory","Empty Cave","Fungie Habitat","Lonely Rock Chasm","Odylium Marauder Den","Pirate's Treasure Storage","Place of Rest","Rock Cave","Scale Altar","Shulak Cave"]),
    { k: "g35:exp", ns: `Fire Temple Expedition opens`, opt: true, map: "fire-temple", t: `<b>Fire Temple ${T("Expedition", "expedition")} (Exploration) opens</b>: 1–5 players, item level 500.<span class="loc">The story quest "Mirror of Greed" (Lv 37) sends you in.</span>` },
  ]},
  { id: "g37", lv: 37, title: "Stigma slot 4", blurb: "Full rotation online; the story takes you into the Fire Temple.", items: [
    { k: "g37:0", stig: 4, t: `<b>Equip ${stn(4)}.</b> Plan: Savage Fang. Level 1 is enough for now.` },
    { k: "g37:1", eput: 4, t: `<b>Put ${stn(4)} on E${eRow(4)}, then run the full rotation on a training dummy.</b><span class="rotseq"></span>` },
    { k: "g37:2", byStory: true, ns: `"Mirror of Greed": the Fire Temple run`, story: "Mirror of Greed", t: `<b>Lv 37 story instance:</b> "Mirror of Greed" sends you into the Fire Temple. If it stops you, enhance your weapon first; otherwise keep saving.` },
  ]},
  { id: "g40", lv: 40, title: "Triniel board", blurb: "Fourth Daevanion board.", items: [
    { k: "g40:0", bo: "Triniel", ns: `Triniel board opens`, t: `<b>Triniel ${T("Daevanion board", "daevanion")} opens.</b> Use every ${I("crystal")} in your Cube, then buy its nodes from the Daevanion board card at the top.` },
    ...hideouts(["Ascetic's Cave","Den of Exiles","Kumbahum's Cave","Lagta Fafnite Storage","Spider Cave","Tayga Breeding Ground","Warriors' Rest"]),
    ...dvNodes("Triniel"),
  ]},
  { id: "g45", lv: 45, title: "Level cap", blurb: "Progression shifts from level to gear score.", items: [
    { k: "g45:0", ns: `Finish the Hero and Ascension quests`, story: "Forgotten Commander", turnedIn: "Forgotten Commander", t: `<b>Finish the remaining Hero and Ascension quests:</b> "The One Who Witnesses the Nightmare" (recommended 45) and "The One Who Swears the Oath" (recommended 49, so expect it to need gear), both from Asahr.<span class="loc">"The One Who Witnesses the Nightmare" opens after you turn in "Forgotten Commander"; the next story quest, "Daeva Trapped in a Nightmare", needs it. ${ASC}</span>` },
    { k: "g45:2", adv: true, opt: true, ns: `Azphel board opens`, t: `<b>Azphel ${T("Daevanion board", "daevanion")} opens.</b> Stat nodes only, paid with Azphel crystals (from battleground fragments or Abyss Points), not Daevanion Crystals.` },
    { k: "g45:3", adv: true, opt: true, ns: `Time your Ascension Trial`, t: `<b>Ascension Trial timing.</b> Easy needs item level 1,000, Normal 1,500. Run your 3 weekly entries late in the week, after you've raised your item level.` },
    { k: "g45:4", adv: true, opt: true, ns: `Abyss Points: Stigma Shards first`, t: `<b>Abyss Points:</b> Stigma Shards first, not a full Abyss gear set (KeenGamer's advice; one source).` },
    { k: "g45:5", adv: true, opt: true, ns: `Start Conquest`, t: `<b>Start Conquest</b> (Krao Cave tier, ${T("item level", "gearscore")} 700). Weapon first, then your weakest slots.` },
  ]},
];
export const STEPS = [
  { id: "build", title: "Build plan", blurb: "Where every Skill Point and stat goes.", tag: "Always",
    items: [
      { k: "build:0", t: `<b>Skill Points:</b> spend them at each milestone; the Skills card shows the single next upgrade between stops.` },
      { k: "build:1", t: `<b>Fill every ${T("specialty slot", "specialty")}</b> the moment it unlocks. Empty slots do nothing.` },
      { k: "build:2", t: `<b>Experiment freely.</b> ${T("Respec is free", "respec")} while you level; check its cost at 31 before you rely on it.` },
      { k: "build:3", t: `<b>Stat priority</b> for gear and Daevanion paths is in the Build tab (right edge).` },
      { k: "build:beltamulet", t: `<b>Belt and amulet are the only gear worth enhancing by default.</b> Spend each Noble Belt or Revelation Amulet Enhance Scroll as soon as you get it; you keep both pieces for the whole game.` },
    ]},
  { id: "story", title: "Story pace", blurb: "Hero quests give most of your XP to 45.", tag: "Always",
    items: [
      { k: "story:0", t: `<b>Keep the Hero quest chain moving.</b> Pause only at milestones.` },
      { k: "story:1", t: `<b>Activate every ${T("Kibelisk", "kibelisk")}</b> you pass.` },
      { k: "story:2", t: `<b>Equip better gear immediately.</b> From Lv 10, ${T("extract", "extract")} the old piece. Don't ${T("enhance", "enhance")} leveling gear unless you're stuck.` },
      { k: "story:3", t: `<b>A regional quest that isn't in the game yet:</b> click "Not in game yet" on it (Next up or its milestone). It comes back after your next Level up, or once the quest before it is turned in.` },
      { k: "story:4", t: `<b>Pick up ${T("Empyrean Traces", "traces")}</b> (feathers) you pass in Altgard; sweep the rest with the map later.` },
    ]},
  { id: "daily", title: "Daily and weekly habits", blurb: "Capped rewards; start each once its milestone unlocks it.", tag: "Daily",
    items: [
      { k: "daily:0", t: `<b>${T("Supply Requests", "supply")}</b> (Lv 25): daily Emergency and weekly hand-ins for Abyss Points. Spares only.` },
      { k: "daily:1", t: `<b>${T("Duty Quests", "duty")}</b> (Lv 45): 5 rewarded a day, shared by every character on the server, from the Journal's Duty tab (J).` },
      { k: "daily:2", t: `<b>Daily dungeon</b> (Lv 30). Daeva Bio-Research Base for ${I("enhance")}.` },
      { k: "daily:3", t: `<b>Weekly Command missions</b> from the Command Merchant in the capital: up to 12 a week per server.`, note: "No source gives an unlock level." },
    ]},
  { id: "f2p", title: "Free-to-play notes", blurb: "What's paid, so you know what to skip.", tag: "F2P",
    items: [
      { k: "f2p:0", t: `<b>Kina is your bottleneck.</b> Without a subscription you can't use the Marketplace or the Kina/Quna exchange, so you can't buy Kina (those, and the subscriber shop, need the $15/month subscription). Spend it on permanent upgrades.` },
      { k: "f2p:1", t: `<b>Cash shop is mostly cosmetic</b> (outfits, wings, pets, weapon skins); NCSoft says nothing in it affects stats. Nothing in this guide needs it.` },
      { k: "f2p:2", t: `<b>Daeva Pass:</b> claim the free track; the premium track is per character and costs Quna.`, upsell: "Premium track is paid." },
    ]},
  { id: "hold", title: "Don't spend yet", blurb: "The most common early regrets.", tag: "Until 45",
    items: [
      { k: "hold:1", t: `<b>${T("Enhancing", "enhance")} leveling gear.</b> Extraction returns the stones but not the Kina. Belt and Revelation amulet are the exceptions; anything else only when stuck.` },
      { k: "hold:2", t: `<b>Throwing away upgrade fragments.</b> You'll need large amounts; keep them all. A ${T("pet loot filter", "petfilter")} keeps junk out instead.` },
      { k: "hold:3", t: `<b>Premium materials on quest gear.</b> Save them for gear you'll keep.` },
    ]},
];
