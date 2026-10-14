
const seq = (arr) => '<span class="seq">' + arr.map(s => `<span>${s}</span>`).join('<i>→</i>') + '</span>';

/* Plain-language explainers, opened with the "i" buttons. Only what sources state; unknown UI locations are called out. */
const TIPS = {
  extract: { h: "Extraction (getting rid of old gear)", b: `
    <p><b>Unlocks at Lv 10.</b> Gear can't be sold to vendors in Aion 2. When you replace a piece, you <b>extract</b> it instead: it's destroyed and you get upgrade materials (like Enhance Stones) back, plus its look as a cosmetic skin. Each extraction costs a little Kina.</p>
    <p>Only unequipped gear in your Cube can be extracted; potions, scrolls and other items can't.</p>
    <ol><li>Open your inventory (called <b>the Cube</b>).</li><li>Click the old gear piece.</li><li>In its description panel, click the <b>beaker/flask icon</b> at the bottom right and choose <b>Extract</b>.</li><li>Check what you lose and gain, then <b>Confirm</b>.</li></ol>
    <p><b>Auto-extract</b> extracts gear automatically as it drops (from loot and monster cubes), so your Cube doesn't fill with old pieces. To set it up:</p>
    <ol><li>Open <b>the Cube</b>.</li><li>Click <b>Extract</b>.</li><li>Click <b>Settings</b> and turn auto-extraction on.</li><li>Review what it's set to include before saving, especially item grades. Only include grades you'd never equip.</li></ol>
    <p>Each extraction costs Kina, and auto-extract stops when your Kina runs low. Extracted items are gone; NCSoft only restores mistakes once per account per year, and not guaranteed.</p>
    <p class="muted">The menu path is from the Korean patch notes that added the feature; the Global client should match, but the exact option names in Settings aren't documented.</p>`,
    src: "VGC, MeinMMO, KR patch notes (25 Mar 2026) via AION2HUB, NCSoft notice via PositionIsEverything" },
  wisdom: { h: "Where Skill Points come from", b: `<p>Two sources: <b>character levels</b> grant points automatically, and <b>Wisdom Stone</b> items (from hideouts, regional quests and drops) give 1 point each, but only once you use them from the Cube.</p>
    <p>The skill window's points breakdown lists both sources under "Points Earned", and what you've spent under "Points Used" (shown as Mastery). Earned minus used is what you can spend now.</p>
    <p><b>Daevanion Crystals</b> work the same way: use them from the Cube to get Daevanion Points for the board.</p>`, src: "Metabot item pages; points breakdown confirmed in game" },
  traces: { h: "Empyrean Traces (feathers)", b: `<p>Collectibles scattered across your faction's main zones, from Altgard onward (none in the starting zone). Altgard has 560. They're marked on the world map.</p>
    <p>You can carry them from the start, but you can only use them after the Lv 16 story quest "Empyrean Monolith." Then go to a Monolith (Safe Haven or Nornir Assembly), interact and press <b>Resonate</b>. That raises the Monolith's Resonance level (up to 30) for Amulet Enhance Scrolls, Amplify Stone fragments, titles and Soul Codex resets. At Resonance 30, extra feathers convert to Power Shards.</p>
    <p>Collected feathers stay on the map. To hide them: map <b>Filters</b> (bottom right) → <b>Content</b> → untick <b>Empyrean Trace</b>.</p>`, src: "PlayNews, Selphie1999, allthings.how map" },
  petfilter: { h: "Pet loot filter", b: `<p>Pets unlock with the story quest "Gathering Essentials" (around Lv 10). Once you have a pet, it picks up loot for you. Its loot filter decides what it grabs and what it leaves, so gray junk stays out of your Cube. No source documents where the menu is; look in your pet's settings once you have one.</p>`, src: "MeinMMO" },
  kibelisk: { h: "Kibelisk", b: `<p>A travel point. Interact with one to register it, and you can teleport back to it later instead of walking. Activate every one you pass in towns and camps.</p>`, src: "KeenGamer" },
  guild: { h: "Legion (guild)", b: `<p>Guilds are called <b>Legions</b>. Asmodians unlock them with the quest <b>"Buried Atrocities"</b> (available from Lv 10, recommended Lv 16). Then open the Legion menu, browse groups, check their description and recruitment settings, and join. Joining is free; after leaving one there's a 24-hour wait before joining another.</p>
    <p>Pick an active group whose play times match yours over a big, quiet roster. Sources disagree on perks: MeinMMO says passive buffs and weekly guild coins, GamesFuze says no bonuses yet. The reliable benefit is people to group with.</p>`, src: "GamesFuze, MeinMMO" },
  specialty: { h: "Specialty slots", b: `<p>Each active skill gets specialty slots as <b>that skill</b> levels up (not your character): slot 1 at skill level 8, slot 2 at 12, slot 3 at 20. Each slot holds one bonus effect. Unlocking a slot isn't enough: open the skill, click the slot and choose an effect, or you get nothing.</p>`, src: "gameplay.tips, Skycoach, MeinMMO" },
  respec: { h: "Free respec", b: `<p>The reset button beside your skill point counter refunds every Skill Point you've spent (Daevanion, Arcana and gear levels aren't refunded) and turns off your specialty effects, so re-pick those after a reset.</p>
    <p>It's free at least until level 31. MeinMMO says it costs Kina after that; allthings.how says it's free and unlimited. Check the button's cost when you reach 31.</p>`, src: "MeinMMO, allthings.how" },
  daevanion: { h: "Daevanion board", b: `<p>A talent board unlocked by the story quest "Urgent Pursuit" (around Lv 12). You spend <b>Daevanion Crystals</b> (from hideouts and regional quests) on nodes. The best nodes give +1 level to a skill you use. More boards open as you level.</p>`, src: "AION2HUB, KeenGamer" },
  stigma: { h: "Stigma", b: `<p>Extra skills that go into special slots, separate from your normal skills. Slots open at 22, 27, 32 and 37, four in total. Level 22's slot unlocks through the quest "One Who Hears the Voice."</p>`, src: "Metabot, PlayNews" },
  hideout: { h: "Hideouts (Sealed Dungeons)", b: `<p>Small caves you walk into straight from the open world; the game calls them Sealed Dungeons and marks them on the Altgard map. The first clear of each pays a one-time reward: 15,000 Kina, 1,250 Enhance Stones, 2 Daevanion Crystals, 2 Wisdom Stones, wing materials, statue scraps and a title. Repeat clears don't pay it again.</p>
    <p>Click a hideout's name to see where it is on a map, with the nearest teleport statue. The level shown is a recommendation; try one early, and come back if it's too hard.</p>`, src: "AION2HUB, allthings.how map" },
  stronghold: { h: "Strongholds", b: `<p>Open-world enemy camps in Altgard, fought outside any instance. Each is a one-time clear: break in, defeat its named commander, then open the treasure chest. That pays 2 Noble Belt Enhance Scrolls and 15,000 Kina (some add a title). Belt scrolls come from nowhere else, and the belt is permanent, so clear every one.</p>
    <p>Altgard has 13 (allthings.how; a Korean-data wiki says 15). Four are named in sources and listed in the Areas card: Detlef Thieves Camp (Western Gribade Highland), Granach's Hideout (Eastern Gribade Highland), Flauke Legion Outpost (Basfelt Ruins) and Sanctum Outskirts Watch (area not stated). Tick those there. For any other stronghold you clear, use the + button in One-time clears, and tell Claude its name and area so it can be added. No source gives stronghold levels.</p>`, src: "allthings.how, AION2HUB, KeenGamer" },
  regional: { h: "Regional quests", b: `<p>Optional side quests (green markers) in Altgard, picked up from the NPC listed. Each pays XP, Kina, a Daevanion Crystal and often an accessory. Do them at their recommended level.</p>`, src: "Allthings.how, Selphie1999" },
  shugo: { h: "Shugo Festival", b: `<p>An hourly set of minigames (races, jumping, memory tiles). Rewards scale with your level, and claiming one uses a limited key that recharges only once a day. Keys are worth far more at 45, so skip it while leveling.</p>`, src: "MeinMMO" },
  duty: { h: "Duty Quests", b: `<p>Unlock level not documented; probably the "Supply Request" feature that opens at Lv 25. A daily list of tasks; you can only do a few per day. Each shows possible random rewards, and the ones further left are more likely. Pick tasks that can drop Hidden Cube keys or Ariel's Trace fragments.</p>`, src: "MeinMMO" },
  enhance: { h: "Enhancing gear", b: `<p><b>Unlocks at Lv 9</b> (the Lv 7 story quest has you try it once early). Spend Enhance Stones and Kina to raise a gear piece by +1. Higher levels cost more and fail more often.</p>
    <p><b>Where your stones are:</b> in the Cube with your other items, and the Enhance screen's materials section shows the same count.</p>
    <p>While leveling you replace gear often. Extracting old gear gives the stones back but not the Kina, so enhancing it mostly burns Kina. Enhance the belt and Revelation amulet (you keep both for good); enhance anything else only when a boss or dungeon actually stops you, weapon first.</p>`, src: "MeinMMO, Metabot; stone location confirmed in game" },
  macro: { h: "Macro", b: `<p>A single button that fires several skills in order. Build it in the game's macro editor, then put it on your hotbar.</p>`, src: "GamesFuze" },
  gearscore: { h: "Gear score / item level", b: `<p>A number summarizing your equipped gear. Content like Krao Cave has a minimum (700 for Normal). Separate from combat power, which also counts skills, boards and collections.</p>`, src: "MeinMMO, AION2HUB" },
};
/* Item names link to their Metabot database page, which shows the in-game icon. */
/* Item icons are stored in this artifact (uploaded by the player). Any item line that names one
   shows the icon large on its right. Items without an icon yet still link to their database page. */
const ITEMS = {
  enhance: ["Enhance Stones", "enhance-stone", "/_blob/53059021070720d8838773f7bcf14fa0", "Enhance Stone"],
  wisdom: ["Wisdom Stones", "wisdom-stone-bound", "/_blob/7b22e1dee717bb285c342d83e33a01ae", "Wisdom Stone"],
  crystal: ["Daevanion Crystals", "daevanion-crystal-bound", "/_blob/cf35799132bfb46fdb6dfadf4d05140f", "Daevanion Crystal"],
  cubekey: ["Hidden Cube keys", "key-hidden-cube", "", "Key: Hidden Cube"],
};
const EYE = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;
const I = (key, label) => {
  const [name, slug] = ITEMS[key];
  return `<a class="itm" data-ico="${key}" href="https://metabot.gg/en/aion-2/items/${slug}" target="_blank" rel="noopener" title="Open in the item database">${label || name}${EYE}</a>`;
};
/* Big icons for every item named in a line, shown on its right. */
const icons = html => {
  const keys = [...new Set([...html.matchAll(/data-ico="(\w+)"/g)].map(m => m[1]))].filter(k => ITEMS[k][2]);
  return keys.length ? `<span class="icos">${keys.map(k => `<img src="${ITEMS[k][2]}" alt="${ITEMS[k][3]}" title="${ITEMS[k][3]}" loading="lazy" onerror="this.remove()">`).join("")}</span>` : "";
};
const T = (label, key) => `<span class="term">${label}<button type="button" class="tip" data-tip="${key}" aria-expanded="false" aria-label="What is ${label.replace(/<[^>]+>/g, "")}?">i</button></span>`;

const DAEVA = `<b>Use your ${I("crystal")}</b> from the Cube, then spend the points on +1 skill-level nodes for Heart Gore and Insignia Explosion.`;
const sub = (label, note) => ({ sub: label, subNote: note });
/* Each hideout name links to its allthings.how map page (location and nearest teleport). */
const mapSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hideouts = (names, keyPrefix) => [{ ...sub("Hideouts"), group: "hideout" },
  ...names.map(n => ({ kind: "hideout", name: n, k: keyPrefix ? `${keyPrefix}:${mapSlug(n)}` : undefined, t: `<a class="itm" href="https://allthings.how/aion-2/map/${mapSlug(n)}/" target="_blank" rel="noopener" title="Location on the map"><b>${n}</b>${EYE}</a>`, cell: true }))];
const quests = (label, list) => [{ ...sub(label), group: "quest" }, ...list.map(([n, where, r]) => ({ kind: "quest", name: n, lv: parseInt(label.replace(/^\D+/, ""), 10), where, reward: r, t:`<b>${n}</b><span class="loc">${where}${r ? ` · <em>${r}</em>` : ""}</span>`, cell: true }))];

const GATES = [
  { id: "g6", lv: 6, title: "Wings and Ascension", blurb: "Two story quests around the lake. Don't delay them.", items: [
    { t: `<b>Complete "The Being Beneath the Lake"</b> (unlocks wings) and <b>"Spread Your Wings"</b> with Asahr (Ascension).` },
  ]},
  { id: "g9", lv: 9, title: "Enhancement unlocks", blurb: "Save your stones; only the belt and amulet are always worth it.", items: [
    { t: `<b>Save your ${I("enhance")}</b> in the Cube. ${T("Enhance", "enhance")} the belt and Revelation amulet once you have them; other gear only if a boss or hideout actually stops you, weapon first. The first real supply is the Lv 10 hideouts.`, note: "The 5 stones from the Lv 7 quest were likely spent in Pelleir's tutorial, usually on your starting weapon (look for a +1). Extract that weapon once it's replaced to get them back." },
  ]},
  { id: "g10", lv: 10, title: "Altgard opens", blurb: "Extraction, pets, hideouts and Strongholds all start here.", items: [
    { t: `<b>${T("Extract", "extract")} gear you've replaced:</b> open the Cube, click the old piece, choose Extract and confirm. Only gear in your Cube can be extracted, not what you're wearing, so the option appears once a drop replaces something.` },
    { t: `<b>Complete "Gathering Essentials"</b> to unlock pets, then set the ${T("pet loot filter", "petfilter")}.`, note: "Pet choice: take Armadon or Tog. All three ride and give the same bonus, but Fossa can be collected later from Fossa soul drops around Lv 24." },
    { k: "g10:wisdom", t: `<b>Use the ${I("wisdom")} from hideouts and quests.</b> Each becomes 1 ${T("Skill Point", "wisdom")} only when you use it from your Cube.` },
    { k: "g10:5", t: `<b>Claim Daeva Pass free-track rewards</b> as you earn them.`, upsell: "Premium track costs Quna (real money). Skip it." },
    ...hideouts(["Abandoned One's Grave","Dratona Cave","Dusk Pit","Hidden Vein Cave","Lost Ruins","Old Graveyard","Ossuary of the Noble","Poisonous Plant Habitat","Smuggler's Cave","Treasure Hunter's Residence","Trickster's Den","Valka's Nest","Watcher's Temporary Outpost"], "g10h"),
  ]},
  { id: "g12", lv: 13, title: "Daevanion board", blurb: "Board opens via the story; first regional quest.", items: [
    { t: `<b>Complete "Urgent Pursuit"</b> to unlock the ${T("Daevanion board", "daevanion")}. Use your ${I("crystal")} from the Cube, then spend the points on +1 skill-level nodes for Heart Gore and Insignia Explosion.`, note: "Same quest unlocks the Shugo Festival. Leave the festival alone." },
    ...quests("Lv 12", [["Shugo-of-All-Trades: Asmodian", "Dredgion Crash Site · Dari", "Cube Expansion Voucher"]]),
  ]},
  { id: "g15", lv: 15, title: "Hideouts, batch 2", blurb: "11 hideouts plus one regional quest.", items: [
    ...hideouts(["Abandoned Archon Jail","Bloodsoaked Confessional","Blue Dragon's Trap","Fafnite Storage Room","Fanatics' Den","Fortuneteller's Grave","Homish's Prison Compound","Howling Den","Library of Foresight","Prison of Oblivion","Victims' Cave"]),
    ...quests("Lv 14", [["Spooky Specters", "Nameless Cemetery · Rizel", "ring"]]),
    sub("After"),
    { t: DAEVA },
  ]},
  { id: "g16", lv: 16, title: "Legion and first accessory set", blurb: "Unlock Legions; six quests fill every accessory slot.", items: [
    { t: `<b>Complete "Buried Atrocities"</b> to unlock ${T("Legions", "guild")}, then join one.`, note: "Available from Lv 10; pick it up early if you see it." },
    { k: "g16:monolith", t: `<b>Complete "Empyrean Monolith"</b>, then turn in your ${T("Empyrean Traces", "traces")} at the Monolith (Resonate).` },
    ...quests("Lv 16", [
      ["Hugo Mercenaries: Past and Present", "Safe Haven", "earrings"],
      ["Missing Mount", "Safe Haven", "earrings"],
      ["Creion Research Assistant", "Dredgion Crash Site · Benekt", "bracelet"],
      ["Odyle Jelly Misappropriation Investigation", "Safe Haven · VeKauf", "bracelet"],
      ["The Great Curse-Breaking Caper", "Nameless Cemetery · Tagar", "ring"],
      ["Practice Makes Perfect, Nyerk!", "Quai Campsite · Baba", "necklace"],
    ]),
  ]},
  { id: "g20", lv: 20, title: "Hideouts, batch 3", blurb: "7 hideouts recommended at Lv 20.", items: [
    ...hideouts(["Abandoned Memorial Room","Closed Hideout","Destroyed Scriptorium","Lamnah Base","Predator's Lair","Unstable Cave","Worshiper's Underground Cave"]),
    sub("After"),
    { t: DAEVA },
  ]},
  { id: "g22", lv: 22, title: "Stigma slot 1", blurb: "Stigmas unlock; second accessory set.", items: [
    { t: `<b>Complete "The One Who Hears the Voice"</b> to unlock ${T("Stigmas", "stigma")} and the Pantheon.` },
    { t: `<b>Equip Triniel's Dagger.</b> Long-term target is skill level 10.` },
    ...quests("Lv 22", [
      ["Blade of Vengeance", "Sanctum Outpost", "earrings"],
      ["In the Fang Legion's Name", "Sanctum Outpost", "bracelet · Statue: Selvis"],
      ["Young Elim's Story", "Moslan Forest · Lulu", "necklace"],
      ["A Guardian's Sacrifice", "Moslan Forest · Ecco", "ring"],
      ["Nine Wonders of Altgard: 1st Leg", "Tranein Highland · Tina", "Life Crystal ×5"],
    ]),
  ]},
  { id: "g25", lv: 25, title: "Hideouts, batch 4", blurb: "5 hideouts; Supply Requests unlock.", items: [
    { t: `<b>Check what Supply Request is.</b> It unlocks at Lv 25 and is likely the ${T("Duty Quest", "duty")} system. If it is, start picking tasks that can drop Hidden Cube keys or Ariel's Trace fragments.`, note: "Name match is unconfirmed; tell me what it turns out to be." },
    ...hideouts(["Dark Root Cave","Drana Depository","High Priest's Ruins","Skurv Laborer Den","Twisted Pit"]),
    sub("After"),
    { t: DAEVA },
  ]},
  { id: "g27", lv: 27, title: "Stigma slot 2", blurb: "Illusive Clone goes in.", items: [
    { t: `<b>Equip Illusive Clone.</b> Long-term target is skill level 20.` },
    { t: `<b>Start the opener:</b> Illusive Clone, then Shadowstrike to get behind the target.` },
    ...quests("Lv 27", [["Fight Poison with Poison", "Purifying Forest", "ring"]]),
  ]},
  { id: "g30", lv: 30, title: "Daily dungeon and batch 5", blurb: "Daily dungeons unlock; 7 hideouts; third accessory set.", items: [
    { t: `<b>Start the daily dungeon:</b> run Daeva Bio-Research Base for ${I("enhance")}, not the Kinah or pet-fragment dungeons.` },
    ...hideouts(["All-Curing Cave","Dratona Assembly Area","Final Haven","Insectoid Tunnel","Library of Patience","Library of Wisdom","Rift Fissure"]),
    ...quests("Lv 30", [
      ["Hugo Mercenaries: Deep Shadow", "Nornir Assembly", "necklace"],
      ["Her Last Favor", "Purifying Forest", "bracelet"],
      ["An Invitation to the Past: Part 1", "Nornir Assembly", "bracelet · Statue: Urd"],
      ["An Invitation to the Past: Part 2", "Nornir Assembly", "bracelet · Statue: Urd"],
      ["The Future Within the Past", "Uruthumheim · Harald", "Clash Rune Chest"],
    ]),
    sub("After"),
    { t: DAEVA },
  ]},
  { id: "g32", lv: 32, title: "Stigma slot 3", blurb: "Savage Fang, the macro, and five quests.", items: [
    { t: `<b>Equip Savage Fang.</b> Level 1 is enough for now.` },
    { t: `<b>Build the ${T("macro", "macro")}.</b>` + seq(["Savage Fang","Insignia Explosion","Heart Gore","Savage Roar"]) },
    ...quests("Lv 32", [
      ["Hugo Mercenaries: An Old Promise", "Dranactus · Hadala", "Clash Rune Chest"],
      ["Pain Unending", "Battlescar Mound · Bekrin", "bracelet"],
      ["Nine Wonders of Altgard: 2nd Leg", "Impetusium Square", "Hidden Cube key"],
    ]),
    ...quests("Lv 33", [
      ["Traveling Merchant's Conundrum", "Basfelt Ruins", "earrings"],
      ["Finders Keepers", "Basfelt Ruins", "ring"],
    ]),
  ]},
  { id: "g35", lv: 35, title: "Hideouts, batch 6", blurb: "10 hideouts recommended at Lv 35.", items: [
    ...hideouts(["Destruction Archons Armory","Empty Cave","Fungie Habitat","Lonely Rock Chasm","Odylium Marauder Den","Pirate's Treasure Storage","Place of Rest","Rock Cave","Scale Altar","Shulak Cave"]),
    sub("After"),
    { t: DAEVA },
  ]},
  { id: "g37", lv: 37, title: "Stigma slot 4", blurb: "Full rotation online; story dungeon nearby.", items: [
    { t: `<b>Equip Swift Contract.</b> Level 1 is enough for now.` },
    { t: `<b>Run the full rotation on a training dummy.</b>` + seq(["Illusive Clone + Swift Contract","Shadowstrike","Triniel's Dagger","Macro"]) },
    { t: `<b>Story dungeon around Lv 37.</b> If it stops you, enhance your weapon first; otherwise keep saving.` },
    ...quests("Lv 37", [
      ["A Friend's Legacy", "Mahindel River · Sculkhi", "bracelet"],
      ["Bloodstained Rose", "Western Gribade Highland · Pordhet", "necklace"],
    ]),
  ]},
  { id: "g40", lv: 40, title: "Hideouts, batch 7", blurb: "Last batch and the Stronghold sweep.", items: [
    ...hideouts(["Ascetic's Cave","Den of Exiles","Kumbahum's Cave","Lagta Fafnite Storage","Spider Cave","Tayga Breeding Ground","Warriors' Rest"]),
    sub("Then"),
    { t: DAEVA },
  ]},
  { id: "g45", lv: 45, title: "Level cap", blurb: "Progression shifts from level to gear score.", items: [
    { t: `<b>Finish the remaining Hero and Ascension quests.</b>` },
    { t: `<b>Spend your banked Shugo Festival keys.</b>` },
    { t: `<b>Ascension Trial timing.</b> Days before reset: reach item level 1,500 first. Reset close: run it at 1,000 rather than waste the week.` },
    { t: `<b>Abyss Points</b> on Potential Stones, Stigma Shards and Daevanion resources, not a shop gear set.` },
    { t: `<b>Start Conquest</b> (Krao Cave tier, ${T("gear score", "gearscore")} 700). Weapon first, then your weakest slots.` },
    ...quests("Lv 44", [["Herb Pouch Heist", "Black Claw Village · Kunpata", "earrings"]]),
    ...quests("Lv 45 · accessories", [
      ["A Comrade's Fate", "Impetusium Square", "bracelet"],
      ["Lest We Forget", "Impetusium Square", "bracelet · Artwork"],
      ["A Perfect Wedding", "Southern Gribade Highland · Romi", "ring"],
      ["Restoration Materials", "Uruthumheim · Keronis", "ring"],
      ["Lost Memories", "Moslan Forest · Oliver", "earrings"],
      ["I'm a Believer!", "Safe Haven", "necklace"],
    ]),
    ...quests("Lv 45 · crystals, runes and upgrades", [
      ["Fallout Calmed", "Eastern Gribade Highland · Lakiba", "Ariel crystal ×2"],
      ["Putting a Friend to Rest", "Impetusium Square", "Ariel crystal"],
      ["Sapling Hide-and-Seek", "Moslan Forest · Nana", "Ariel crystal"],
      ["One Last Thing", "Tranein Highland · Avent", "Ariel crystal"],
      ["Another Survivor", "Nornir Assembly", "Clash Rune Chest"],
      ["Fallout", "Southern Gribade Highland · Karumba", "Clash Rune Chest"],
      ["A Traitor Within", "Quai Campsite · Baba", "Rare Theostone Chest"],
      ["Regular Altar Maintenance", "Purifying Forest", "Rare Theostone Chest"],
      ["Restless Spirits", "Purifying Forest", "Rare Theostone Chest"],
      ["Nine Wonders of Altgard: Final Stretch", "Basfelt Ruins", "Cube Expansion Voucher"],
      ["Immortal Isle's Distinct Ecology", "Sanctum Outpost", "Soul Codex: Reset"],
      ["Spirit Isle, Where Time Has Stopped", "Basfelt Ruins", "Soul Codex: Reset"],
      ["Farewell, My Instructor", "Nornir Assembly", "Artwork"],
    ]),
    ...quests("Lv 45 · Kina and materials", [
      ["Mind Your Own Business", "Sanctum Outpost", "50k Kina chest"],
      ["Reality Bites", "Briskwind Shelter · Bekrin", "50k Kina chest"],
      ["Workplace Misunderstanding", "Steel Hammer Merchants HQ · Merikiki", "50k Kina chest"],
      ["Ravenous Recluse", "Abandoned Campsite · Fiona", "50k Kina chest"],
      ["Another Crisis!", "Steel Hammer Merchants HQ · Snotra", "Odyle ×5"],
    ]),
    ...quests("Lv 45 · Spacetime Rift", [
      ["Spacetime Rift: Asmodian", "Moslan Forest · Uru", "2k Abyss Points · ring"],
      ["Spacetime Rift: Unknown Species", "Moslan Forest · Uru", "2k AP · earrings · personal Kisk"],
      ["Spacetime Rift: Unfamiliar Material", "Moslan Forest · Uru", "2k AP · bracelet"],
      ["Spacetime Rift: Developing Travel Goods", "Purifying Forest", "2k AP · earrings · party Kisk"],
      ["Spacetime Rift: Difference Between Here and There", "Purifying Forest", "2k AP · ring"],
      ["Spacetime Rift: An Honest Shugo", "Basfelt Ruins", "2k AP · ring"],
      ["Spacetime Rift: Proof", "Basfelt Ruins", "2k AP · earrings · legion Kisk"],
    ]),
  ]},
];

const STEPS = [
  { id: "build", title: "Build plan", blurb: "Where every Skill Point and stat goes.", tag: "Always",
    items: [
      { t: `<b>Skill Points:</b> spend them at each stop point; the left panel shows the single next upgrade between stops.` },
      { t: `<b>Fill every ${T("specialty slot", "specialty")}</b> the moment it unlocks. Empty slots do nothing.` },
      { t: `<b>Experiment freely until 31.</b> ${T("Respec is free", "respec")} until then; lock in the build by 31.` },
      { t: `<b>Gear stat priority.</b>` + seq(["Critical Hit","Damage Boost","Attack Power","Double Chance"]) },
    ]},
  { id: "story", title: "Story pace", blurb: "Hero quests are ~99% of Asmodian XP to 45.", tag: "Always",
    items: [
      { t: `<b>Keep the Hero quest chain moving.</b> Stop only at stop points.` },
      { t: `<b>Activate every ${T("Kibelisk", "kibelisk")}</b> you pass.` },
      { t: `<b>Equip better gear immediately.</b> From Lv 10, ${T("extract", "extract")} the old piece. Don't ${T("enhance", "enhance")} leveling gear unless you're stuck.` },
      { t: `<b>A regional quest you can't solo at its level</b> stays unticked; it turns amber so you catch it later.` },
      { t: `<b>Pick up ${T("Empyrean Traces", "traces")}</b> (feathers) you pass in Altgard; sweep the rest with the map later.` },
    ]},
  { id: "daily", title: "Daily and weekly habits", blurb: "Capped rewards; start each once its stop point unlocks it.", tag: "Daily",
    items: [
      { t: `<b>${T("Duty Quests", "duty")}</b> (likely Supply Request, Lv 25). Pick ones that can drop ${I("cubekey")} or Ariel's Trace fragments.` },
      { t: `<b>Daily dungeon</b> (Lv 30). Daeva Bio-Research Base for ${I("enhance")}.` },
      { t: `<b>Weekly Command scrolls</b> from the capital's Command vendor once you find it. Reroll if rewards lack keys or fragments.`, note: "No source gives an unlock level." },
    ]},
  { id: "f2p", title: "Free-to-play notes", blurb: "What's paid, so you know what to skip.", tag: "F2P",
    items: [
      { t: `<b>Kina is your bottleneck.</b> Without a subscription you can't use the Marketplace or the Kina/Quna exchange, so you can't buy Kina (those, and the subscriber shop, need the $15/month subscription). Spend it on permanent upgrades.` },
      { t: `<b>Cash shop is cosmetic</b> (outfits, wings, pets, weapon skins); NCSoft says no stats. Nothing in this guide needs it.` },
      { t: `<b>Daeva Pass:</b> claim the free track; the premium track is per character and costs Quna.`, upsell: "Premium track is paid." },
    ]},
  { id: "hold", title: "Don't spend yet", blurb: "The most common early regrets.", tag: "Until 45",
    items: [
      { t: `<b>${T("Shugo Festival", "shugo")}.</b> Rewards scale with level and keys are limited. Bank them.` },
      { t: `<b>${T("Enhancing", "enhance")} leveling gear.</b> Extraction returns the stones but not the Kina. Belt and Revelation amulet are the exceptions; anything else only when stuck.` },
      { t: `<b>Throwing away upgrade fragments.</b> You'll need large amounts; keep them all. A ${T("pet loot filter", "petfilter")} keeps junk out instead.` },
      { t: `<b>Premium materials on quest gear.</b> Save them for gear you'll keep.` },
    ]},
];

const KEY = "aion2-assassin-route-v4";
const DEFAULT = () => ({ checks: {}, level: 5, hide: false, open: {}, quest: "" });
let state = DEFAULT();
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) state = Object.assign(state, s); } catch (e) {}
/* PLAYER-SEED-START: one-time sync to skill levels reported in game (Oct 10, Lv 12). Runs once per browser. */
if (!state.seedLv12) {
  const lv = { "Quick Slice": 4, "Savage Roar": 5, "Shadowstrike": 5, "Ambush": 5, "Heart Gore": 3, "Exploit Weakness": 4, "Rear Smite": 2, "Insignia Explosion": 1 };
  Object.entries(lv).forEach(([n, v]) => { for (let L = 2; L <= 10; L++) state.checks[`sp:${n}:${L}`] = L <= v; });
  state.stones = 2; state.level = Math.max(state.level || 1, 12); state.seedLv12 = true;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}
/* PLAYER-SEED-END */
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

const mainEl = document.getElementById("main");
const layoutEl = document.querySelector(".layout");
const gatesEl = document.getElementById("gates");
const stepsEl = document.getElementById("steps");
const chev = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
/* Any step carrying a Paid tag is a paid step: with "Hide paid steps" on it disappears and stops counting
   toward its stop point, the progress ring and the "missed" check. */
/* "paid" = the step itself needs real money (hidden by the filter). "upsell" = a free step that mentions an optional paid upgrade (never hidden). */
const isPaid = it => !!it.paid;
const checkable = s => s.items.map((it, j) => ({ it, k: it.k || s.id + ":" + j })).filter(x => !x.it.sub && !(state.hidePaid && isPaid(x.it)));

const cardHTML = (s, num, cls) => `
  <details class="step ${cls}" id="${s.id}">
    <summary>
      <div class="num">${num}</div>
      <div class="title"><h3>${s.title}</h3><p>${s.blurb}</p></div>
      <div class="meta"><span class="tag">${s.tag || ""}</span><span class="count"></span>${chev}</div>
    </summary>
    <div class="bar"><span></span></div>
    <ul class="items">
      ${(() => { const seen = {}; return s.items.map((it, j) => {
        /* Hideouts and regional quests live in the Areas card; the stop point shows one summary line per kind. */
        const kind = it.kind || it.group;
        if (kind === "hideout" || kind === "quest") {
          if (seen[kind]) return ""; seen[kind] = true;
          return `<li class="sum-row" data-sum="${s.id}|${kind}"></li>`;
        }
        if (it.sub) { const ic = icons(it.subNote || ""); return `<li class="sub-h${ic ? " has-ico" : ""}"><span class="sub-txt">${it.sub}${it.subNote ? `<span>${it.subNote}</span>` : ""}</span>${ic}</li>`; }
        const k = it.k || s.id + ":" + j;
        const ic = icons(it.t);
        return `<li class="item${it.cell ? " cell" : ""}${ic ? " has-ico" : ""}${isPaid(it) ? " paid-only" : ""}"><label><input type="checkbox" data-k="${k}" ${state.checks[k] ? "checked" : ""}>${ic}<span class="txt">${it.t}${it.note ? `<span class="note">${it.note}</span>` : ""}${it.paid ? `<span class="paid"><span class="paid-tag">Paid</span>${it.paid}</span>` : ""}${it.upsell ? `<span class="upsell"><span class="paid-tag opt">Paid option</span>${it.upsell}</span>` : ""}</span></label></li>`;
      }).join(""); })()}
    </ul>
  </details>`;

/* Size each item icon to the height of the text beside it. Re-runs when a card opens or text rewraps. */
const iconSizer = typeof ResizeObserver === "function" ? new ResizeObserver(entries => {
  entries.forEach(e => {
    const row = e.target.closest(".has-ico"); if (!row) return;
    /* Capped so a wide icon can't narrow the text, rewrap it taller, and grow the icon again. */
    const h = Math.min(56, Math.round(e.target.getBoundingClientRect().height));
    if (!h) return;
    row.querySelectorAll(".icos img").forEach(img => { img.style.height = h + "px"; img.style.width = h + "px"; });
  });
}) : null;
function watchIcons() {
  if (!iconSizer) return;
  iconSizer.disconnect();
  mainEl.querySelectorAll(".has-ico .txt, .has-ico .sub-txt").forEach(el => iconSizer.observe(el));
}

/* ---------- Areas ---------- */
/* Hideout areas: allthings.how map pages (spot-checked). Quest areas: allthings.how regional quest list. */
const HIDEOUT_AREA = {
  "Abandoned One's Grave": "Nameless Cemetery", "Dratona Cave": "Dredgion Crash Site", "Dusk Pit": "Calderon Canyon",
  "Hidden Vein Cave": "Nameless Cemetery", "Old Graveyard": "Nameless Cemetery", "Ossuary of the Noble": "Nameless Cemetery",
  "Poisonous Plant Habitat": "Nameless Cemetery", "Smuggler's Cave": "Calderon Canyon", "Treasure Hunter's Residence": "Dredgion Crash Site",
  "Trickster's Den": "Dredgion Crash Site", "Valka's Nest": "Dredgion Crash Site", "Watcher's Temporary Outpost": "Calderon Canyon",
  "Abandoned Archon Jail": "Moslan Forest", "Bloodsoaked Confessional": "Moslan Forest", "Blue Dragon's Trap": "Sanctum Outpost",
  "Fanatics' Den": "Sanctum Outpost", "Fortuneteller's Grave": "Moslan Forest", "Homish's Prison Compound": "Sanctum Outpost",
  "Howling Den": "Moslan Forest", "Library of Foresight": "Moslan Forest", "Prison of Oblivion": "Moslan Forest", "Victims' Cave": "Moslan Forest",
  "Abandoned Memorial Room": "Uruthumheim", "Closed Hideout": "Uruthumheim", "Destroyed Scriptorium": "Purifying Forest",
  "Lamnah Base": "Purifying Forest", "Predator's Lair": "Purifying Forest", "Unstable Cave": "Purifying Forest", "Worshiper's Underground Cave": "Uruthumheim",
  "Dark Root Cave": "Dranactus", "Drana Depository": "Dranactus", "High Priest's Ruins": "Dranactus", "Skurv Laborer Den": "Dranactus", "Twisted Pit": "Dranactus",
  "All-Curing Cave": "Battlescar Mound", "Dratona Assembly Area": "Basfelt Ruins", "Final Haven": "Battlescar Mound", "Insectoid Tunnel": "Basfelt Ruins",
  "Library of Patience": "Basfelt Ruins", "Library of Wisdom": "Basfelt Ruins", "Rift Fissure": "Battlescar Mound",
  "Destruction Archons Armory": "Eastern Gribade Highland", "Empty Cave": "Western Gribade Highland", "Fungie Habitat": "Eastern Gribade Highland",
  "Lonely Rock Chasm": "Western Gribade Highland", "Odylium Marauder Den": "Eastern Gribade Highland", "Pirate's Treasure Storage": "Idun's Lake",
  "Place of Rest": "Black Claw Village", "Rock Cave": "Eastern Gribade Highland", "Scale Altar": "Western Gribade Highland", "Shulak Cave": "Western Gribade Highland",
  "Ascetic's Cave": "Impetusium Square", "Den of Exiles": "Black Claw Village", "Kumbahum's Cave": "Black Claw Village", "Lagta Fafnite Storage": "Lagta Fortress",
  "Spider Cave": "Fafnite Deposit", "Tayga Breeding Ground": "Black Claw Village", "Warriors' Rest": "Impetusium Square",
};
const QUEST_AREA = {
  "Shugo-of-All-Trades: Asmodian": "Dredgion Crash Site", "Spooky Specters": "Nameless Cemetery",
  "Hugo Mercenaries: Past and Present": "Safe Haven", "Missing Mount": "Safe Haven", "Creion Research Assistant": "Dredgion Crash Site",
  "Odyle Jelly Misappropriation Investigation": "Dredgion Crash Site", "The Great Curse-Breaking Caper": "Nameless Cemetery",
  "Practice Makes Perfect, Nyerk!": "Calderon Canyon", "Blade of Vengeance": "Sanctum Outpost", "In the Fang Legion's Name": "Sanctum Outpost",
  "Young Elim's Story": "Moslan Forest", "A Guardian's Sacrifice": "Moslan Forest", "Nine Wonders of Altgard: 1st Leg": "Tranein Highland",
  "Fight Poison with Poison": "Purifying Forest", "Hugo Mercenaries: Deep Shadow": "Nornir Assembly", "Her Last Favor": "Purifying Forest",
  "An Invitation to the Past: Part 1": "Nornir Assembly", "An Invitation to the Past: Part 2": "Nornir Assembly", "The Future Within the Past": "Uruthumheim",
  "Hugo Mercenaries: An Old Promise": "Dranactus", "Pain Unending": "Battlescar Mound", "Nine Wonders of Altgard: 2nd Leg": "Impetusium Square",
  "Traveling Merchant's Conundrum": "Basfelt Ruins", "Finders Keepers": "Basfelt Ruins", "A Friend's Legacy": "Mahindel River",
  "Bloodstained Rose": "Western Gribade Highland", "Herb Pouch Heist": "Black Claw Village",
  "A Comrade's Fate": "Impetusium Square", "Lest We Forget": "Impetusium Square", "A Perfect Wedding": "Southern Gribade Highland",
  "Restoration Materials": "Uruthumheim", "Lost Memories": "Moslan Forest", "I'm a Believer!": "Safe Haven",
  "Fallout Calmed": "Eastern Gribade Highland", "Putting a Friend to Rest": "Impetusium Square", "Sapling Hide-and-Seek": "Moslan Forest",
  "One Last Thing": "Tranein Highland", "Another Survivor": "Nornir Assembly", "Fallout": "Southern Gribade Highland", "A Traitor Within": "Calderon Canyon",
  "Regular Altar Maintenance": "Purifying Forest", "Restless Spirits": "Purifying Forest", "Nine Wonders of Altgard: Final Stretch": "Basfelt Ruins",
  "Immortal Isle's Distinct Ecology": "Sanctum Outpost", "Spirit Isle, Where Time Has Stopped": "Basfelt Ruins", "Farewell, My Instructor": "Nornir Assembly",
  "Mind Your Own Business": "Sanctum Outpost", "Reality Bites": "Battlescar Mound", "Workplace Misunderstanding": "Fafnite Deposit",
  "Ravenous Recluse": "Western Gribade Highland", "Another Crisis!": "Fafnite Deposit",
  "Spacetime Rift: Asmodian": "Moslan Forest", "Spacetime Rift: Unknown Species": "Moslan Forest", "Spacetime Rift: Unfamiliar Material": "Moslan Forest",
  "Spacetime Rift: Developing Travel Goods": "Purifying Forest", "Spacetime Rift: Difference Between Here and There": "Purifying Forest",
  "Spacetime Rift: An Honest Shugo": "Basfelt Ruins", "Spacetime Rift: Proof": "Basfelt Ruins",
};
const NO_AREA = "Area not documented yet";
/* Every hideout/quest item with its key, level and area, in stop-point order. */
const AREA_ITEMS = [];
GATES.forEach(g => g.items.forEach((it, j) => {
  if (it.kind !== "hideout" && it.kind !== "quest") return;
  const lv = it.kind === "hideout" ? g.lv : (it.lv || g.lv);
  const area = (it.kind === "hideout" ? HIDEOUT_AREA[it.name] : QUEST_AREA[it.name]) || NO_AREA;
  AREA_ITEMS.push({ it, g, k: it.k || g.id + ":" + j, lv, area });
}));
/* Strongholds: only these are named in any source (allthings.how area guides); no levels published. */
const STRONGHOLDS = [
  ["Detlef Thieves Camp", "Western Gribade Highland"],
  ["Granach's Hideout", "Eastern Gribade Highland"],
  ["Flauke Legion Outpost", "Basfelt Ruins"],
  ["Sanctum Outskirts Watch", NO_AREA],
];
STRONGHOLDS.forEach(([n, area]) => AREA_ITEMS.push({ it: { kind: "stronghold", name: n }, g: null, k: "sh:" + mapSlug(n), lv: null, area }));
const AREAS = [...new Set(AREA_ITEMS.map(x => x.area))].sort((a, b) => {
  if (a === NO_AREA) return 1; if (b === NO_AREA) return -1;
  const m = n => Math.min(...AREA_ITEMS.filter(x => x.area === n && x.lv != null).map(x => x.lv));
  return m(a) - m(b) || a.localeCompare(b);
});
const areaSel = document.getElementById("areaSel");
function pickDefaultArea() {
  const open = AREA_ITEMS.filter(x => !state.checks[x.k] && x.lv != null && x.lv <= state.level).sort((a, b) => a.lv - b.lv);
  return (open[0] || AREA_ITEMS.filter(x => !state.checks[x.k]).sort((a, b) => a.lv - b.lv)[0] || AREA_ITEMS[0]).area;
}
function renderAreas() {
  if (!state.area || !AREAS.includes(state.area)) state.area = pickDefaultArea();
  areaSel.innerHTML = AREAS.map(a => {
    const xs = AREA_ITEMS.filter(x => x.area === a);
    const left = xs.filter(x => !state.checks[x.k]).length;
    const lvs = xs.filter(x => x.lv != null).map(x => x.lv);
    const lo = Math.min(...lvs), hi = Math.max(...lvs);
    return `<option value="${a}"${a === state.area ? " selected" : ""}>${a}${lvs.length ? ` · Lv ${lo}${hi > lo ? "–" + hi : ""}` : ""} · ${left ? left + " left" : "done"}</option>`;
  }).join("");
  const xs = AREA_ITEMS.filter(x => x.area === state.area).sort((a, b) => (a.lv ?? 99) - (b.lv ?? 99));
  const row = x => {
    const it = x.it, locked = x.lv != null && x.lv > state.level;
    const name = it.kind === "hideout" ? it.t
      : it.kind === "stronghold" ? `<b>${it.name}</b>`
      : `<b>${it.name}</b><span class="loc">${it.where}${it.reward ? ` · <em>${it.reward}</em>` : ""}</span>`;
    return `<li class="item${locked ? " locked" : ""}"><label><input type="checkbox" data-k="${x.k}" ${state.checks[x.k] ? "checked" : ""}><span class="txt">${name}</span><span class="lvb">${x.lv != null ? "Lv " + x.lv : ""}</span></label></li>`;
  };
  const h = xs.filter(x => x.it.kind === "hideout"), q = xs.filter(x => x.it.kind === "quest"), sh = xs.filter(x => x.it.kind === "stronghold");
  document.getElementById("areaList").innerHTML =
    (sh.length ? `<li class="sub-h">Strongholds ${T("", "stronghold")}<span>one-time · 2 belt scrolls each · level not published</span></li>` + sh.map(row).join("") : "") +
    (h.length ? `<li class="sub-h">Hideouts ${T("", "hideout")}<span>one-time · 1,250 Enhance Stones + 2 Daevanion Crystals each</span></li>` + h.map(row).join("") : "") +
    (q.length ? `<li class="sub-h">Regional quests ${T("", "regional")}</li>` + q.map(row).join("") : "");
}
areaSel.addEventListener("change", () => { state.area = areaSel.value; save(); update(); });
/* Stop-point summary lines: count that stop point's hideouts/quests and offer a jump to the area. */
function renderSummaries() {
  mainEl.querySelectorAll("[data-sum]").forEach(el => {
    const [gid, kind] = el.dataset.sum.split("|");
    const xs = AREA_ITEMS.filter(x => x.g.id === gid && x.it.kind === kind);
    const d = xs.filter(x => state.checks[x.k]).length;
    const lv = [...new Set(xs.map(x => x.lv))].join(" / ");
    const areas = [...new Set(xs.filter(x => !state.checks[x.k]).map(x => x.area))];
    el.classList.toggle("done", d === xs.length);
    el.innerHTML = `<span>${kind === "hideout" ? "Hideouts" : "Regional quests"} (Lv ${lv}): <b>${d} / ${xs.length}</b> cleared${areas.length ? ` · ${areas.slice(0, 3).join(", ")}${areas.length > 3 ? "…" : ""}` : ""}</span>` +
      (d < xs.length ? `<button type="button" data-goarea="${areas[0]}">Show in Areas</button>` : "");
  });
}
mainEl.addEventListener("click", e => {
  const b = e.target.closest("[data-goarea]"); if (!b) return;
  e.preventDefault();
  state.area = b.dataset.goarea; save(); update();
  document.getElementById("areas").scrollIntoView({ behavior: "smooth", block: "start" });
});

function render() {
  gatesEl.innerHTML = GATES.map(g => cardHTML(g, `<span><small>LV</small>${g.lv}</span>`, "gate")).join("");
  stepsEl.innerHTML = STEPS.map((s, i) => cardHTML(s, i + 1, "")).join("");
  mainEl.querySelectorAll("details.step").forEach(d => {
    d.addEventListener("toggle", () => { state.open[d.id] = d.open; save(); });
  });
  watchIcons();
}
layoutEl.addEventListener("click", e => {
  const btn = e.target.closest(".tip"); if (!btn || btn.closest(".coll")) return;
  e.preventDefault(); e.stopPropagation();
  const li = btn.closest("li");
  const open = btn.getAttribute("aria-expanded") === "true";
  layoutEl.querySelectorAll("li.tipbox").forEach(b => b.remove());
  layoutEl.querySelectorAll('li .tip[aria-expanded="true"]').forEach(b => b.setAttribute("aria-expanded", "false"));
  if (open) return;
  const tip = TIPS[btn.dataset.tip]; if (!tip) return;
  const box = document.createElement("li");
  box.className = "tipbox" + (li.classList.contains("sub-h") ? " wide" : "");
  box.innerHTML = `<h4>${tip.h}</h4>${tip.b}<p class="src muted">Source: ${tip.src}</p>`;
  li.after(box);
  btn.setAttribute("aria-expanded", "true");
});
layoutEl.addEventListener("change", e => {
  const k = e.target.dataset.k; if (!k) return;
  state.checks[k] = e.target.checked; save(); update();
});

const counts = s => { const c = checkable(s); return [c.filter(x => state.checks[x.k]).length, c.length]; };

function update() {
  const lv = state.level;
  let total = 0, done = 0;
  const upcoming = GATES.find(g => { const [c, n] = counts(g); return g.lv >= lv && c < n; });

  GATES.forEach(g => {
    const d = document.getElementById(g.id), [c, n] = counts(g);
    total += n; done += c;
    const complete = c === n, overdue = !complete && g.lv < lv, isNext = g === upcoming;
    d.querySelector(".count").textContent = `${c}/${n}`;
    d.querySelector(".bar span").style.width = (c / n * 100) + "%";
    d.classList.toggle("done", complete);
    d.classList.toggle("overdue", overdue);
    d.classList.toggle("current", isNext);
    const tag = d.querySelector(".tag");
    tag.className = "tag" + (overdue ? " warn" : isNext ? " now" : "");
    tag.textContent = complete ? "Cleared" : overdue ? "Missed" : isNext ? (g.lv === lv ? "Now" : `${g.lv - lv} to go`) : "Later";
    d.open = state.open[g.id] !== undefined ? state.open[g.id] : (isNext || overdue);
  });
  STEPS.forEach(s => {
    const d = document.getElementById(s.id), [c, n] = counts(s);
    total += n; done += c;
    d.querySelector(".count").textContent = `${c}/${n}`;
    d.querySelector(".bar span").style.width = (c / n * 100) + "%";
    d.classList.toggle("done", c === n);
    if (state.open[s.id] !== undefined) d.open = state.open[s.id];
  });

  const pct = total ? Math.round(done / total * 100) : 0;
  const C = 2 * Math.PI * 32, fg = document.getElementById("ringFg");
  fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C * (1 - pct / 100);
  document.getElementById("ringTxt").textContent = pct + "%";
  document.getElementById("progBig").textContent = `${done} / ${total}`;

  document.getElementById("track").innerHTML = GATES.map(g => {
    const [c, n] = counts(g), complete = c === n;
    const cls = complete ? "cleared" : (g.lv < lv ? "overdue" : (g === upcoming ? "next" : ""));
    return `<li class="${cls}"><span class="lv">${g.lv}</span><span class="dot"></span><a class="what" href="#${g.id}">${g.title}</a></li>`;
  }).join("");

  document.getElementById("gateHint").textContent = upcoming
    ? (upcoming.lv === lv ? `stop now: Lv ${lv}` : `next stop at Lv ${upcoming.lv}`)
    : "all checkpoints cleared";
  document.getElementById("lvlNum").value = lv;
  document.getElementById("lvlRange").value = lv;
  mainEl.classList.toggle("hide-done", state.hide);
  /* Hide ticked items, and whole cleared cards, when "Hide completed" is on. */
  renderAreas(); renderSummaries();
  layoutEl.querySelectorAll("li.item").forEach(li => {
    const cb = li.querySelector("input[type=checkbox]");
    li.hidden = (state.hide && !!(cb && cb.checked)) || (!!state.hidePaid && li.classList.contains("paid-only"));
  });
  mainEl.querySelectorAll(".paid").forEach(p => { p.hidden = !!state.hidePaid; });
  const hp = document.getElementById("btnHidePaid");
  hp.textContent = state.hidePaid ? "Show paid steps" : "Hide paid steps";
  hp.setAttribute("aria-pressed", String(!!state.hidePaid));
  mainEl.querySelectorAll("details.step").forEach(d => { d.hidden = !!state.hideCards && d.classList.contains("done"); });
  document.getElementById("btnHide").textContent = state.hide ? "Show ticked items" : "Hide ticked items";
  const hc = document.getElementById("btnHideCards");
  hc.textContent = state.hideCards ? "Show cleared stop points" : "Hide cleared stop points";
  hc.setAttribute("aria-pressed", String(!!state.hideCards));
  document.getElementById("btnHide").setAttribute("aria-pressed", String(state.hide));
  renderNext();
}

/* Skill point plan: leveling priority (GamerBlurb, Global). Gating/costs per Metabot skill pages. */
const SP_SKILLS = [
  { n: "Quick Slice", learn: 1, spec: "+50% Multi-Hit on hit" },
  { n: "Savage Roar", learn: 1, spec: "+20% Skill Speed" },
  { n: "Shadowstrike", learn: 1, spec: "+20% Critical Damage Boost for 10s on hit" },
  { n: "Heart Gore", learn: 4, spec: "Up to +20% Critical Hit when fewer targets are hit" },
  { n: "Exploit Weakness", learn: 6, passive: true },
  { n: "Insignia Explosion", learn: 14, spec: "+50% Multi-Hit on hit" },
  { n: "Rear Smite", learn: 11, passive: true },
  { n: "Ambush", learn: 3, spec: "Engraves 2 Insignias when it lands as a Back attack" },
];
/* Total skill points granted by character level (Wikily leveling table; matches the game at Lv 12 = 24, Lv 13 = 28, max 203). */
const LEVEL_POINTS = [0, 0, 0, 0, 1, 3, 5, 7, 10, 13, 16, 20, 24, 28, 32, 36, 41, 46, 51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 117, 123, 129, 135, 141, 147, 153, 159, 165, 171, 177, 183, 189, 196, 203];
const spCost = L => L <= 4 ? 1 : L <= 7 ? 2 : 4;
const SP_STEPS = [];
SP_SKILLS.forEach((s, rank) => {
  for (let L = 2; L <= 10; L++) {
    SP_STEPS.push({ k: `sp:${s.n}:${L}`, s, rank, L, req: s.learn + 3 * (L - 2), cost: spCost(L) });
    if (L === 8 && !s.passive) SP_STEPS.push({ k: `sp:${s.n}:spec`, s, rank, L: 8.5, req: s.learn + 18, cost: 0, spec: true });
  }
});
SP_STEPS.sort((a, b) => a.rank - b.rank || a.L - b.L);
const spLabel = x => x.spec ? `<b>${x.s.n}: pick specialty</b>` : `<b>${x.s.n} → ${x.L}</b>`;
const spCostTxt = x => x.spec ? "free" : x.cost + " pt" + (x.cost > 1 ? "s" : "");

/* Skill-only stop points where the gap would otherwise delay key tiers. */
GATES.push(
  { id: "g19", lv: 19, title: "Skill tier: level 8", blurb: "Quick Slice, Savage Roar and Shadowstrike reach skill level 8.", items: [] },
  { id: "g28", lv: 28, title: "Skill tier: Heart Gore 10", blurb: "Heart Gore reaches its point cap.", items: [] },
);
GATES.sort((a, b) => a.lv - b.lv);

/* Fold each skill upgrade into the first stop point at or after its unlock level. */
GATES.forEach((g, i) => {
  const prev = i ? GATES[i - 1].lv : 0;
  const steps = SP_STEPS.filter(x => x.req > prev && x.req <= g.lv);
  steps.forEach((x, j) => { x.gi = i; x.gj = j; });
  if (!steps.length) return;
  steps.forEach(x => g.items.push({
    k: x.k,
    t: `<span class="cost">${spCostTxt(x)}</span>${spLabel(x)}${x.spec ? `<span class="loc"><em>${x.s.spec}</em></span>` : (x.L === 8 && !x.s.passive ? `<span class="loc">opens first ${T("specialty slot", "specialty")}</span>` : "")}`,
  }));
});

/* Asmodian Hero (main story) quests by level: AION2HUB 1–40, cross-checked 2–9 with allthings.how. */
const QUESTS = [
  [1,"Ishalgen"],[2,"A Village in the Fog"],[2,"Prepare to Escape"],[3,"Shadow Forest"],[4,"Isolated Lake"],[5,"The Being Beneath the Lake"],
  [6,"Spread Your Wings"],[6,"Signs of a Crash Landing"],[7,"Prison Compound Infiltration Plan"],[7,"Brigade Prison Compound Infiltration Operation"],
  [9,"The Longest Night"],[10,"Finding Nemon"],[10,"Survival Supplies"],[10,"Gathering Essentials"],[11,"Crash Site Rendezvous"],[11,"Contaminated Area"],
  [12,"Express Daeva Delivery"],[12,"Veiled Truth"],[13,"Urgent Pursuit"],[13,"Cemetery Cleanup"],[14,"Back on the Scent"],[15,"Dead Men Tell No Tales"],
  [16,"Buried Atrocities"],[16,"Empyrean Monolith"],[18,"A New Lead"],[18,"Malice Laid Bare"],[19,"Broken Fang"],[19,"Watchful Eyes"],
  [20,"Imminent Threat"],[20,"Crossroad"],[21,"Creeping Shadow"],[21,"Children of the Elim"],[21,"In the Elims' Name"],[22,"Verdant Melody"],
  [22,"Daeva in a Dream"],[22,"Disturbed Balance"],[24,"Searching for Survivors"],[24,"Prison Break"],[24,"Finding Stolen Relics"],[25,"Voice of Rage"],
  [25,"Tangled Past"],[26,"The High Priest Slumbers"],[26,"Striving for Coexistence"],[27,"Preparations for Restoration"],[27,"A Collective Effort"],
  [29,"Land of Rifts"],[30,"Dying Light"],[30,"Contaminated Sacred Tree"],[30,"The Past Revealed"],[30,"Canyon's Secret"],[32,"Bitter Reality"],
  [32,"Eye of the Red Tower"],[32,"The Survivors"],[32,"Rescue Operation"],[32,"Last of the Destruction Archons"],[32,"A Daeva Dreaming Anew"],
  [33,"Last Refuge"],[33,"Scripture in the Ruins"],[33,"Blood Monument"],[34,"Impending Threat"],[34,"Visible Trap"],
  [34,"Destruction Archon Underground Fortress"],[35,"Enemy Territory"],[35,"Powder of Death"],[36,"Creion of Gribade"],[36,"Frozen Fafnite"],
  [37,"Inevitable Encounter"],[37,"Unveiling the Truth"],[37,"Lake of Confrontation"],[37,"An Ill Fate's Resolution"],[37,"Mirror of Greed"],
  [40,"Fafnite's Whereabouts"],[40,"Exiled Ritualist"],[40,"Healing Herbs"],[40,"Treatment"],[40,"Symbol of Liberation"],
];
const qInput = document.getElementById("questIn");
document.getElementById("questList").innerHTML = QUESTS.map(([l, n]) => `<option value="${n}">Lv ${l}</option>`).join("");
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function findQuest(txt) {
  const t = norm(txt); if (!t) return null;
  const exact = QUESTS.findIndex(([, n]) => norm(n) === t);
  if (exact >= 0) return exact;
  const hits = QUESTS.map((q, i) => [i, norm(q[1]).includes(t)]).filter(x => x[1]);
  return hits.length === 1 ? hits[0][0] : (hits.length > 1 ? -2 : -1);
}
function renderQuest() {
  const st = document.getElementById("questStatus");
  st.className = "qstatus";
  if (!state.quest) { st.innerHTML = "Pick your quest to place yourself; it sets your level."; return; }
  const i = QUESTS.findIndex(([, n]) => n === state.quest);
  if (i < 0) { st.innerHTML = ""; return; }
  const nxt = QUESTS[i + 1];
  st.innerHTML = `<b>Lv ${QUESTS[i][0]}</b> quest${nxt ? ` · next: ${nxt[1]} (Lv ${nxt[0]})` : ""}`;
  if (qInput.value !== state.quest) qInput.value = state.quest;
}
qInput.addEventListener("change", () => {
  const i = findQuest(qInput.value);
  const st = document.getElementById("questStatus");
  if (i === null) { state.quest = ""; save(); renderQuest(); return; }
  if (i < 0) {
    st.className = "qstatus warn";
    st.textContent = i === -2 ? "Several quests match; pick one from the list." : "Not in the list. Levels 40–45 aren't covered yet; set your level below.";
    return;
  }
  state.quest = QUESTS[i][1]; save();
  setLevel(Math.max(QUESTS[i][0], 1));
});

/* Rotation by level. Stigma-era rotation is GamesFuze's; earlier phases are built from the same principles (get behind, build then spend Insignias, Quick Slice as filler). */
const ROT = [
  { lv: 1, seq: ["Shadowstrike", "Savage Roar", "Quick Slice ×N"], note: "Shadowstrike gets you behind the target; Quick Slice is your filler." },
  { lv: 3, seq: ["Shadowstrike", "Ambush (from behind)", "Savage Roar", "Quick Slice ×N"], note: "Ambush needs you at the target's back." },
  { lv: 4, seq: ["Shadowstrike", "Ambush", "Heart Gore", "Savage Roar", "Quick Slice ×N"], note: "Fire Heart Gore whenever it's off cooldown." },
  { lv: 14, seq: ["Shadowstrike", "Ambush", "Savage Roar", "Insignia Explosion", "Heart Gore", "Quick Slice ×N"], note: "Build Insignias, then spend them with Insignia Explosion." },
  { lv: 22, seq: ["Shadowstrike", "Triniel's Dagger*", "Ambush", "Savage Roar", "Insignia Explosion", "Heart Gore", "Quick Slice ×N"], note: "Triniel's Dagger cuts active cooldowns 10% once you're in position." },
  { lv: 27, seq: ["Illusive Clone*", "Shadowstrike", "Triniel's Dagger*", "Savage Roar", "Insignia Explosion", "Heart Gore", "Quick Slice ×N"], note: "Open with Illusive Clone." },
  { lv: 32, seq: ["Illusive Clone*", "Shadowstrike", "Triniel's Dagger*", "Macro: Savage Fang* → Insignia Explosion → Heart Gore → Savage Roar"], note: "Build the macro at this stop point." },
  { lv: 37, seq: ["Illusive Clone* + Swift Contract*", "Shadowstrike", "Triniel's Dagger*", "Macro"], note: "Full build rotation. Repeat, staying at the target's back." },
];
function renderRotation() {
  const lv = state.level;
  const r = [...ROT].reverse().find(x => lv >= x.lv);
  document.getElementById("rotLv").textContent = `at Lv ${lv}`;
  document.getElementById("rotSeq").innerHTML = r.seq.map(s => `<span class="${s.includes("*") ? "stig" : ""}">${s.replace("*", "")}</span>`).join("<i>→</i>");
  document.getElementById("rotNote").textContent = r.note + (lv >= 22 ? " Outlined = stigma." : " Early order is inferred from the build's principles, not a source.");
}

/* One-time clears: hideouts and regional quests are counted from the same checkboxes as the stop points;
   strongholds have no published list, so they're a manual counter. */
const SH_TOTAL = 13;
function collect(kind) {
  let d = 0, n = 0;
  GATES.forEach(g => g.items.forEach((it, j) => {
    if (it.kind !== kind) return;
    n++; if (state.checks[it.k || g.id + ":" + j]) d++;
  }));
  return [d, n];
}
function renderCollection() {
  const setRow = (id, d, n) => {
    document.getElementById(id).textContent = `${d} / ${n}`;
    document.getElementById(id + "Bar").style.width = (n ? d / n * 100 : 0) + "%";
  };
  setRow("collHide", ...collect("hideout"));
  setRow("collQuest", ...collect("quest"));
  const named = AREA_ITEMS.filter(x => x.it.kind === "stronghold" && state.checks[x.k]).length;
  setRow("collSh", Math.min(SH_TOTAL, named + (state.strongholds || 0)), SH_TOTAL);
}
/* +/− counts strongholds that aren't named in the Areas card; named ones are ticked there. */
const SH_UNNAMED = SH_TOTAL - STRONGHOLDS.length;
const bumpSh = d => { state.strongholds = Math.max(0, Math.min(SH_UNNAMED, (state.strongholds || 0) + d)); save(); renderCollection(); };
document.getElementById("shPlus").addEventListener("click", () => bumpSh(1));
document.getElementById("shMinus").addEventListener("click", () => bumpSh(-1));
document.querySelector(".coll .tip").addEventListener("click", e => {
  const btn = e.currentTarget, box = document.getElementById("shTip");
  const open = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!open));
  const tip = TIPS.stronghold;
  box.innerHTML = open ? "" : `<div class="tipbox"><h4>${tip.h}</h4>${tip.b}<p class="src muted">Source: ${tip.src}</p></div>`;
});

function renderNext() {
  renderCollection();
  renderRotation();
  renderQuest();
  const lv = state.level;
  /* Same order as the stop points: by stop point, then by position inside it. */
  const open = SP_STEPS.filter(x => !state.checks[x.k]).sort((a, b) => a.gi - b.gi || a.gj - b.gj);
  const now = open.filter(x => x.req <= lv);
  const box = document.getElementById("spNextBox"), row = document.getElementById("spNextRow");
  const next = now[0];
  const soon = open.filter(x => x.req > lv).sort((a, b) => a.req - b.req || a.rank - b.rank)[0];
  /* Available points = points from character level (table) + Wisdom Stones used
     − cost of every ticked skill line. Off-plan skill purchases aren't tracked here. */
  const fromLevels = LEVEL_POINTS[Math.min(45, Math.max(0, lv))] || 0, stones = state.stones || 0;
  const spent = SP_STEPS.filter(x => state.checks[x.k]).reduce((a, x) => a + x.cost, 0);
  const pts = Math.max(0, fromLevels + stones - spent);
  /* Ticked lines costing more than you've earned means the ticks don't match the game. */
  const overTicked = spent > fromLevels + stones;
  const ptsTxt = n => `${n} point${n === 1 ? "" : "s"}`;
  const soonTxt = soon ? `${soon.s.n} ${soon.spec ? "specialty" : "→ " + soon.L} at Lv ${soon.req}${soon.spec ? "" : ` (${spCostTxt(soon)})`}` : "";
  let verdict = "";
  if (next) {
    /* Tickable only when you can actually buy it now (or it's a free specialty pick). */
    const affordable = next.spec || pts >= next.cost;
    row.classList.toggle("solo", !affordable);
    box.hidden = !affordable; box.checked = false; box.dataset.sp = next.k;
    if (!next.spec) {
      verdict = affordable
        ? `<span class="verdict buy">Buy it: you have ${ptsTxt(pts)}.</span>`
        : `<span class="verdict save">Needs ${next.cost}; you have ${ptsTxt(pts)}. Buy it once you earn more.</span>`;
    }
    document.getElementById("spNext").innerHTML = `${spLabel(next)} <span class="cost">${spCostTxt(next)}</span>` +
      (next.spec ? `<small class="spec">${next.s.spec}</small>` : `<small>${now.length - 1} more available at Lv ${lv}</small>`) + verdict;
    document.getElementById("spAfter").innerHTML = soon ? `Next unlock: ${soonTxt}` : "";
  } else {
    row.classList.add("solo");
    box.hidden = true;
    const head = `<b>Everything unlocked at Lv ${lv} is bought.</b>`;
    if (pts && soon) verdict = `<span class="verdict save">Save your ${ptsTxt(pts)} for ${soonTxt}.</span>`;
    document.getElementById("spNext").innerHTML = head + verdict;
    document.getElementById("spAfter").innerHTML = soon && !(pts && soon) ? `Next unlock: ${soonTxt}` : "";
  }
  if (overTicked) {
    document.getElementById("spNext").innerHTML += `<span class="verdict save">Your ticked skill lines cost ${spent} points but you've earned ${fromLevels + stones}. Use "Match my skill levels to the game" below to fix the ticks.</span>`;
  }
  const ptsIn = document.getElementById("spPts");
  if (document.activeElement !== ptsIn) ptsIn.value = stones;
}
/* Sync: set each plan skill's level from the game; ticks lines up to that level and unticks the rest.
   Specialty picks are left as they are. Points are not changed (the game's own counter is the truth). */
const syncGrid = document.getElementById("syncGrid");
syncGrid.innerHTML = SP_SKILLS.map((s, i) => `<label for="sync${i}">${s.n}<input id="sync${i}" type="number" min="1" max="10" inputmode="numeric"></label>`).join("");
document.getElementById("syncBox").addEventListener("toggle", e => {
  if (!e.target.open) return;
  SP_SKILLS.forEach((s, i) => {
    let lvl = 1;
    for (let L = 2; L <= 10; L++) if (state.checks[`sp:${s.n}:${L}`]) lvl = L;
    document.getElementById("sync" + i).value = lvl;
  });
  document.getElementById("syncMsg").textContent = "";
});
document.getElementById("syncApply").addEventListener("click", () => {
  let changed = 0;
  SP_SKILLS.forEach((s, i) => {
    const v = parseInt(document.getElementById("sync" + i).value, 10);
    if (!Number.isFinite(v)) return;
    for (let L = 2; L <= 10; L++) {
      const k = `sp:${s.n}:${L}`, want = L <= v;
      if (!!state.checks[k] !== want) { state.checks[k] = want; changed++; }
    }
  });
  save(); render(); update();
  document.getElementById("syncMsg").textContent = changed ? `Updated ${changed} line${changed === 1 ? "" : "s"}.` : "Already matched.";
});
document.getElementById("spPts").addEventListener("input", e => {
  const v = e.target.value.trim();
  state.stones = Math.max(0, parseInt(v, 10) || 0);
  save(); renderNext();
});
document.getElementById("spNextBox").addEventListener("change", e => {
  const k = e.target.dataset.sp; if (!k || !e.target.checked) return;
  state.checks[k] = true; save();
  const cb = mainEl.querySelector(`input[data-k="${k}"]`); if (cb) cb.checked = true;
  update();
});

function setLevel(v) {
  v = Math.max(1, Math.min(45, parseInt(v, 10) || 1));
  state.level = v;
  GATES.forEach(g => delete state.open[g.id]);
  save(); update();
}
document.getElementById("lvlNum").addEventListener("change", e => setLevel(e.target.value));
document.getElementById("lvlRange").addEventListener("input", e => setLevel(e.target.value));
document.getElementById("btnHide").addEventListener("click", () => { state.hide = !state.hide; save(); update(); });
document.getElementById("btnHideCards").addEventListener("click", () => { state.hideCards = !state.hideCards; save(); update(); });
document.getElementById("btnHidePaid").addEventListener("click", () => { state.hidePaid = !state.hidePaid; save(); update(); });
const btnExpand = document.getElementById("btnExpand");
btnExpand.addEventListener("click", () => {
  const all = [...mainEl.querySelectorAll("details.step")];
  const open = !all.every(d => d.open);
  all.forEach(d => { d.open = open; state.open[d.id] = open; });
  btnExpand.textContent = open ? "Collapse all" : "Expand all"; save();
});
let resetArmed = false;
const btnReset = document.getElementById("btnReset");
btnReset.addEventListener("click", () => {
  if (!resetArmed) { resetArmed = true; btnReset.textContent = "Click again to clear"; setTimeout(() => { resetArmed = false; btnReset.textContent = "Reset"; }, 3000); return; }
  state = DEFAULT(); save(); render(); update();
  resetArmed = false; btnReset.textContent = "Reset";
});

render(); update();
