import json,re
B='/tmp/claude-0/-home-claude/3de1c16d-f486-54fd-a3e3-19bf8a09de56/scratchpad/'
app=json.load(open(B+'polish/lead/app-data.json'))['quests']
P=json.load(open(B+'r1/partial.json'))
R=json.load(open(B+'r1/req.json'))
A=json.load(open(B+'r1/atl.json'))
AQ=A['quests']
MB='https://metabot.gg/en/aion-2/quests/'
GT='https://aion2.gaming.tools/quests/'
ATL={'244371':'https://allthings.how/?p=244371','244366':'https://allthings.how/?p=244366','244374':'https://allthings.how/?p=244374','244377':'https://allthings.how/?p=244377','244384':'https://allthings.how/?p=244384','244363':'https://allthings.how/?p=244363','impetusium':'https://allthings.how/aion-2-every-impetusium-square-regional-quest-and-reward-asmodian/','all':'https://allthings.how/aion-2-regional-quests-all-locations-and-rewards/'}
REGIONAL={q['name'] for q in app}
STORY_LV={'Empyrean Monolith':16,'Verdant Melody':22,'Disturbed Balance':22,'A Collective Effort':27,"Canyon's Secret":30,'Last of the Destruction Archons':32,'Scripture in the Ruins':33,'Mirror of Greed':37,'Forgotten Commander':45}  # app QUESTS levels; FC per gaming.tools

# entries built from non-Metabot sources (no Metabot page reachable)
def E(**k): return k
EXTRA={
"Sapling Hide-and-Seek":E(slug="sapling-hide-and-seek",src=GT+"2202057",rec=45,unlocksAt=10,giver={"npc":"Nana","place":"Odar's Shade","kib":None,"m":None},turnin={"npc":"Nana","place":"Odar's Shade","kib":None,"m":None},
  conflicts=["Metabot page not reachable (provenance refusal; not surfaced by search). Data from aion2.gaming.tools 2202057 + allthings.how 244366; no Kibelisk available.","App reward 'Ariel crystal' not supported: sources give Odyle x5 + Wisdom Stone + Daevanion Crystal"]),
"One Last Thing":E(slug="one-last-thing",src=GT+"2202054",rec=45,unlocksAt=10,giver={"npc":"Avent","place":"Watcher's Tent","kib":None,"m":None},
  steps=[{"text":"Recover the chests in the pond; defeat the Balaur near the pond; talk to Avent at the Watcher's Tent","kib":None,"m":None}],turnin={"npc":"Avent","place":"Watcher's Tent","kib":None,"m":None},
  rewards={"xp":3936438,"kina":100000,"wisdom":1,"crystal":1,"items":["Odyle x5","Title: Last Hurrah"]},
  conflicts=["Metabot page not reachable; data from aion2.th.gl q_2202054, aion2.gaming.tools 2202054, allthings.how 244384. No Kibelisk. (Watcher's Tent is also a Kibelisk name, but distance unknown.)","App reward 'Ariel crystal' not supported: sources give Odyle x5"]),
"Regular Altar Maintenance":E(slug="regular-altar-maintenance",src=GT+"2202061",rec=45,unlocksAt=10,giver={"npc":"Ivan","place":"Faded Stump","kib":None,"m":None},turnin={"npc":"Ivan","place":None,"kib":None,"m":None},
  conflicts=["Metabot page not reachable; data from aion2.gaming.tools 2202061 + allthings.how 244371 ('Finish the route at the Wind Altar after checking all four'). No Kibelisk."]),
"Restless Spirits":E(slug="restless-spirits",src=GT+"2202059",rec=45,unlocksAt=10,giver={"npc":"Spirit Guide Cortis","place":"Healing Spring","kib":None,"m":None},turnin={"npc":"Spirit Guide Cortis","place":"Healing Spring","kib":None,"m":None},
  conflicts=["Metabot page not reachable; data from aion2.gaming.tools 2202059 + allthings.how 244371. No Kibelisk."]),
"Nine Wonders of Altgard: Final Stretch":E(slug="nine-wonders-of-altgard-final-stretch",src=GT+"2202071",rec=45,unlocksAt=10,giver={"npc":"Tina","place":None,"kib":None,"m":None},turnin={"npc":"Tina","place":None,"kib":None,"m":None},
  conflicts=["Metabot page not reachable; data from aion2.gaming.tools 2202071. Giver place unknown: app 'Basfelt Ruins Cliff' is consistent with allthings 2nd-Leg text ('the next leg' at the end of the Basfelt Ruins cliff) but not stated as the pickup. Zone Basfelt Ruins per allthings list page.","Unlock level: allthings states 'unlocks at level 10' only for the Verteron (Elyos) Final Stretch; recorded 10 from gaming.tools header 'Level 10'"]),
"Spirit Isle, Where Time Has Stopped":E(slug="spirit-isle-where-time-has-stopped",src="https://wikily.gg/aion-2/quests/spirit-isle-where-time-has-stopped",rec=45,unlocksAt=10,giver={"npc":"Milo","place":"Basfelt Ruins Waterfall","kib":None,"m":None},turnin={"npc":"Milo","place":"Spirit Isle","kib":None,"m":None},
  conflicts=["Metabot page not reachable; data from wikily.gg (Metabot dataset family) + aion2.gaming.tools 2202069. No Kibelisk.","Turn-in place inferred from gaming.tools step 1 (talk to Milo on the Spirit Isle) — not stated as turn-in place"]),
"Farewell, My Instructor":E(slug="farewell-my-instructor",src=GT+"2202045",rec=45,unlocksAt=10,giver={"npc":"Baba","place":"Nornir Assembly","kib":None,"m":None},turnin={"npc":"Varron","place":"outside the little house by the Impetusium","kib":None,"m":None},
  rewards={"xp":3936438,"kina":100000,"wisdom":1,"crystal":1,"items":["Artwork: Quai Merchants","Title: My Instructor"]},
  conflicts=["Metabot page not reachable; data from aion2.gaming.tools 2202045 + allthings.how 244363 (Baba 'at the Assembly'). No Kibelisk, no step list."]),
"Ravenous Recluse":E(slug="ravenous-recluse",src=GT+"2202065",rec=45,unlocksAt=10,giver={"npc":"Fiona","place":"Abandoned Campsite","kib":None,"m":None},turnin={"npc":"Fiona","place":None,"kib":None,"m":None},
  conflicts=["Metabot page not reachable; data from aion2.gaming.tools 2202065 + allthings.how 244384. No Kibelisk. Zone Western Gribade Highland per allthings 244384 (missing from allthings list page)."]),
"Lest We Forget":E(slug="lest-we-forget",src="https://shugo.gg/quests/2202046",rec=45,unlocksAt=10,giver={"npc":"Nemon","place":"Collapsed Hall of Fame","kib":None,"m":None},
  steps=[{"text":"Listen to his story — Talk to Reuben's apparition","kib":None,"m":None},{"text":"Talk about the apparition's request — Talk to Nemon","kib":None,"m":None},{"text":"Listen to the last wish of Reuben's Apparition — Investigate the Destruction Archons Library","kib":None,"m":None},{"text":"Tell Reuben's Apparition the results — Talk to Reuben's Apparition","kib":None,"m":None}],
  turnin={"npc":"Nemon","place":"Collapsed Hall of Fame","kib":None,"m":None},
  rewards={"xp":3936438,"kina":100000,"wisdom":1,"crystal":1,"items":["Liberator Bracelet","Artwork: Destruction Archons High Priest Hystan","Title: Forever in Our Hearts"]},
  conflicts=["Metabot page not reachable; data from shugo.gg 2202046 + allthings.how Impetusium page. No Kibelisk.","shugo.gg shows 'Level 45' without separating unlock level; allthings says unlocks at 10. Not in Forgotten Commander's dependent list (unlike the other Impetusium Lv 45 quests); prerequisites not checked (gaming.tools page not reachable).","shugo.gg turn-in header says Nemon but step 4 says Reuben's Apparition"]),
}
for n,e in EXTRA.items():
    a=AQ.get(n,{}); r=R.get(n,{})
    e.setdefault('steps',[{"text":s,"kib":None,"m":None} for s in r.get('steps',[])] or [])
    if 'rewards' not in e:
        rw=r.get('rewards') or {"xp":a.get('xp'),"kina":a.get('kina'),"wisdom":1,"crystal":1,"items":(a.get('items') or [])+(["Title: "+a['title']] if a.get('title') else [])}
        e['rewards']=rw
    e['name']=n; e['prevText']=None
    P[n]=e

import re as _re
def story_obj(x):
    m=_re.match(r"(.*?) \(story (\d+)\)$",x)
    nm,i=(m.group(1),m.group(2)) if m else (x,'2102800' if x=='Forgotten Commander' else None)
    return {"name":nm,"id":i,"storyLv":STORY_LV.get(nm),"inAppQUESTS":nm!='Forgotten Commander'}
out=[]
for q in app:
    n=q['name']; e=P[n]; r=R.get(n,{}); a=AQ.get(n,{})
    conf=list(e.get('conflicts',[]))
    src=e.get('src') or (MB+e['slug'])
    reqs=r.get('requires')
    reqReg=[x for x in (reqs or []) if x in REGIONAL]
    reqStory=[x for x in (reqs or []) if x not in REGIONAL]
    # zone
    zone=a.get('zone'); zsrc=ATL.get(a.get('page')) if zone else None
    if zone and q['area']!=zone: conf.append(f"Zone: allthings.how says '{zone}', app QUEST_AREA/area says '{q['area']}' (app where='{q['where']}')")
    # giver cross-check vs gaming.tools / allthings
    gnpc=(e['giver'] or {}).get('npc')
    if r.get('giver') and gnpc and r['giver'].split()[-1] not in gnpc and gnpc.split()[-1] not in r['giver']:
        conf.append(f"Giver: page says {gnpc}, aion2.gaming.tools says {r['giver']}")
    if not gnpc and r.get('giver'):
        e['giver']['npc']=r['giver']; conf.append(f"Giver NPC from aion2.gaming.tools ({r['giver']}); Metabot shows none")
    if e['turnin'].get('npc') is None and r.get('turnin'):
        e['turnin']['npc']=r['turnin']; conf.append(f"Turn-in NPC from aion2.gaming.tools ({r['turnin']})")
    if e['giver'].get('place') is None and a.get('place'):
        e['giver']['place']=a['place']; conf.append(f"Giver place '{a['place']}' from allthings.how (not on Metabot)")
    if e['giver'].get('kib') is None and not any(c.startswith('Giver Kibelisk') for c in conf):
        conf.append("Giver Kibelisk: null — not shown on any fetched source")
    # unlock basis
    if reqs is None:
        conf.append("Prerequisites not checked: no aion2.gaming.tools / aion2.th.gl page reachable for this quest")
    prev=reqReg[0] if len(reqReg)==1 else (reqReg or None)
    out.append({"name":n,"id":q['id'],"slug":e['slug'],"src":src,"fetched":"2026-10-12",
      "rec":e.get('rec'),"unlocksAt":e.get('unlocksAt'),
      "requiresStory":[story_obj(x) for x in reqStory] if reqs is not None else None,
      "requiresRegional":reqReg if reqs is not None else None,
      "requiresSrc":r.get('src'),
      "zone":zone,"zoneSrc":zsrc,
      "giver":e['giver'],"steps":e.get('steps',[]),"turnin":e['turnin'],"rewards":e['rewards'],
      "prev":prev,"prevBasis":("aion2.gaming.tools/aion2.th.gl Required Quests" if reqReg else None),
      "notes":[x for x in [e.get('prevText'), a.get('text') and ('allthings.how: '+a['text'])] if x],
      "app":{"gate":q['gate'],"lv":q['lv'],"where":q['where'],"area":q['area'],"reward":q['reward'],"after":q['after'],"poi":q['poi']},
      "conflicts":conf})
json.dump(out,open(B+'data/rq.json','w'),indent=1,ensure_ascii=False)
print(len(out), 'kib', sum(1 for o in out if o['giver']['kib']), 'rec', sum(1 for o in out if o['rec']), 'unl', sum(1 for o in out if o['unlocksAt']), 'req-checked', sum(1 for o in out if o['requiresStory'] is not None), 'rewards', sum(1 for o in out if o['rewards'].get('xp')))
