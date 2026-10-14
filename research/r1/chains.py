import json
B='/tmp/claude-0/-home-claude/3de1c16d-f486-54fd-a3e3-19bf8a09de56/scratchpad/'
rq=json.load(open(B+'data/rq.json'))
GT='https://aion2.gaming.tools/quests/'; TH='https://aion2.th.gl/db/quests/q_'; MB='https://metabot.gg/en/aion-2/quests/'
AT={'fang':'https://allthings.how/?p=244377','moslan':'https://allthings.how/?p=244366','nornir':'https://allthings.how/?p=244363','imp':'https://allthings.how/aion-2-every-impetusium-square-regional-quest-and-reward-asmodian/','small':'https://allthings.how/?p=244384'}
edges=[
 ("In the Fang Legion's Name","Blade of Vengeance","source-text",[GT+"2202017 (Required Quests)",GT+"2202016 (Dependent quests)",AT['fang']+" ('picks up straight after Blade of Vengeance'; Blade turn-in Gamilla at Watcher's Tent = Fang Legion giver)"],"App QUEST_AFTER direction is CORRECT. The P0-3 reading of Metabot was a misread: Metabot shows no giver for Blade and no prerequisite either way."),
 ("In the Fang Legion's Name","Odyle Jelly Misappropriation Investigation","source-text",[GT+"2202017 (Required Quests)"],"New edge, not in app."),
 ("A Guardian's Sacrifice","Young Elim's Story","source-text",[GT+"2202036 (Required Quests)",AT['moslan']+" (Young Elim turn-in Ecco = Guardian's giver Ecco)"],"App edge was labelled inferred; now confirmed."),
 ("Sapling Hide-and-Seek","A Guardian's Sacrifice","source-text",[GT+"2202057 (Required Quests)"],"New edge."),
 ("Sapling Hide-and-Seek","Young Elim's Story","source-text",[GT+"2202057 (Required Quests)"],"New edge (redundant via A Guardian's Sacrifice)."),
 ("An Invitation to the Past: Part 2","An Invitation to the Past: Part 1","source-text",[GT+"2202022 (Required Quests)",GT+"2202021 (Dependent quests)",AT['nornir']+" ('asks you back for the final act')",MB+"an-invitation-to-the-past-part-1 (dialogue 'Please participate in the second act')"],"App edge was name-inferred; now confirmed."),
 ("Another Survivor","An Invitation to the Past: Part 2","source-text",[GT+"2202060 (Required Quests)",GT+"2202022 (Dependent quests)"],"New edge."),
 ("Nine Wonders of Altgard: 2nd Leg","Nine Wonders of Altgard: 1st Leg","source-text",[GT+"2202070 (Required Quests)",AT['small']+" ('points you to Battlescar Mound Cliff for the next wonder')",AT['imp']+" (2nd Leg pickup: Tina, Battlescar Mound Cliff)"],"App edge was name-inferred; now confirmed."),
 ("Nine Wonders of Altgard: Final Stretch","Nine Wonders of Altgard: 2nd Leg","source-text",[GT+"2202071 (Required Quests)",GT+"2202070 (Dependent quests)",AT['imp']+" ('the next leg' at the end of the Basfelt Ruins cliff)"],"New edge."),
 ("Fallout Calmed","Fallout","source-text",[GT+"2202043 (Required Quests)",GT+"2202042 (Dependent quests)"],"New edge. Metabot does not show it."),
 ("Hugo Mercenaries: Deep Shadow","Hugo Mercenaries: Past and Present","source-text",[TH+"2202011 (Prerequisites)"],"New edge."),
 ("Hugo Mercenaries: An Old Promise","Hugo Mercenaries: Deep Shadow","source-text",[GT+"2202020 (Required Quests)",TH+"2202011 (Unlocks)"],"New edge."),
 ("A Traitor Within","Hugo Mercenaries: Past and Present","source-text",[GT+"2202052 (Required Quests)"],"New edge."),
 ("A Traitor Within","Practice Makes Perfect, Nyerk!","source-text",[GT+"2202052 (Required Quests)"],"New edge."),
 ("Farewell, My Instructor","Practice Makes Perfect, Nyerk!","source-text",[GT+"2202045 (Required Quests)"],"New edge."),
 ("Another Crisis!","Creion Research Assistant","source-text",[GT+"2202047 (Required Quests)"],"New edge."),
 ("A Friend's Legacy","Missing Mount","source-text",[GT+"2202039 (Required Quests)"],"New edge."),
]
out=[{"quest":q,"after":a,"kind":"regional","basis":b,"status":"confirmed","sources":s,"note":n} for q,a,b,s,n in edges]
for o in rq:
    for st in (o['requiresStory'] or []):
        src=list(o['requiresSrc'] or [])
        if st['name']=='Forgotten Commander': src+= [GT+"2102800 (Dependent quests)",TH+"2102800 (Unlocks)"]
        out.append({"quest":o['name'],"after":st['name'],"kind":"story","storyId":st['id'],"storyLv":st['storyLv'],"basis":"source-text","status":"confirmed","sources":sorted(set(src)),
          "note":("Forgotten Commander = Episode 6 'Encountering Zikel's Core', episode quest 16/17, rec/unlock 45, follows 'Farewells' (2102781). NOT in app QUESTS (story stops at Lv 40)." if st['name']=='Forgotten Commander' else "Story quest present in app QUESTS (storyLv = app QUESTS level).")})
out.append({"quest":"Spacetime Rift series (7 quests)","after":None,"kind":"none","basis":"source-text","status":"confirmed-no-prereq","sources":[GT+"2202026",GT+"2202031",GT+"2202032",GT+"2202033",GT+"2202034"],
  "note":"No Required Quests on 5 of 7 gaming.tools pages (Unknown Species 2202030 and Proof 2202035 not reachable). Not a chain. Gate: level 45 (Metabot 'Unlocks at 45' on all 7; allthings 244366 'Level 45') plus a rift that 'opens at random spots at set times' (allthings 244371)."})
json.dump(out,open(B+'data/rq-chains.json','w'),indent=1,ensure_ascii=False)
print(len(out),'rows;', sum(1 for e in out if e['kind']=='regional'),'regional;', sum(1 for e in out if e['kind']=='story'),'story')
