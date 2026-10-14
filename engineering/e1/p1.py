import re, json, sys
F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:80]); s=s.replace(old,new)
# (key, unique line-start snippet, ns)
items=[
 ("g6:0",'{ story: "The Being Beneath the Lake", t:','Complete "The Being Beneath the Lake"'),
 ("g9:0",'{ t: `<b>Save your ${I("enhance")}</b>','Save your ${I("enhance")}'),
 ("g10:0",'{ t: `<b>${T("Extract", "extract")} gear','Extract gear you\'ve replaced'),
 ("g10:1",'{ story: "Gathering Essentials", t:','Complete "Gathering Essentials"'),
 ("g12:0",'{ story: "Urgent Pursuit", t:','Complete "Urgent Pursuit"'),
 ("g16:0",'{ story: "Buried Atrocities", t:','Complete "Buried Atrocities"'),
 ("g20:0",'{ t: `<b>Zikel ${T(','Zikel board opens'),
 ("g22:0",'{ story: "Daeva in a Dream", t: `<b>Complete "The One Who Hears','Complete "The One Who Hears the Voice"'),
 ("g22:1",'{ after: "Daeva in a Dream", t: `<b>Equip Triniel','Equip your first stigma'),
 ("g25:0",'{ opt: true, t: `<b>Hand in spares','Hand in spares to Supply Requests'),
 ("g27:0",'{ t: `<b>Equip Illusive Clone.','Equip your second stigma'),
 ("g27:1",'{ t: `<b>Put Illusive Clone in row 0','Put it on E'),
 ("g30:0",'{ t: `<b>Vaizel ${T(','Vaizel board opens'),
 ("g30:1",'{ t: `<b>Start the daily dungeon:','Start the daily dungeon'),
 ("g32:0",'{ t: `<b>Equip Savage Fang.','Equip your third stigma'),
 ("g32:1",'{ t: `<b>Add Savage Fang to E','Put it on E'),
 ("g37:0",'{ t: `<b>Equip Swift Contract.','Equip your fourth stigma'),
 ("g37:1",'{ t: `<b>Add Swift Contract to E','Run the full rotation on a training dummy'),
 ("g37:2",'{ t: `<b>Story dungeon around Lv 37.','Story dungeon around Lv 37'),
 ("g40:0",'{ t: `<b>Triniel ${T(','Triniel board opens'),
 ("g45:0",'{ t: `<b>Finish the remaining Hero','Finish the Hero and Ascension quests'),
 ("g45:1",'{ t: `<b>Spend your banked Shugo','Spend your banked Shugo Festival keys'),
 ("g45:2",'{ t: `<b>Azphel ${T(','Azphel board opens'),
 ("g45:3",'{ t: `<b>Ascension Trial timing.','Time your Ascension Trial'),
 ("g45:4",'{ t: `<b>Abyss Points</b>','Spend Abyss Points on upgrades'),
 ("g45:5",'{ t: `<b>Start Conquest</b>','Start Conquest'),
]
for k,snip,ns in items:
    assert snip.startswith('{ '),snip
    once(snip, '{ k: "%s", ns: `%s`, %s' % (k, ns, snip[2:]))
# items that already have k: add ns
nsk=[('{ k: "g10:wisdom", t:','Use your ${I("wisdom")}'),('{ k: "g10:5", t:','Claim Daeva Pass free-track rewards'),
 ('{ k: "g12:belt", t:','Enhance the Noble Belt'),('{ k: "g16:monolith", story:','Complete "Empyrean Monolith"'),
 ('{ k: "g16:amulet", t:','Enhance the Revelation Amulet'),('{ k: "g20:exp", opt:','Krao Cave Expedition opens'),
 ('{ k: "g32:dreams", t:','Ascension quest "The One Who Dreams"'),('{ k: "g35:exp", opt:','Fire Temple Expedition opens'),
 ('{ k: "g28:exp", opt:','Urugugu Canyon Expedition opens')]
for snip,ns in nsk:
    k=re.match(r'\{ k: "([^"]+)"',snip).group(1)
    once(snip, snip.replace('k: "%s", '%k,'k: "%s", ns: `%s`, '%(k,ns)))
# STEPS explicit keys
steps={'build':['Skill Points:','Fill every','Experiment freely','Stat priority'],'story':['Keep the Hero','Activate every','Equip better gear','A regional quest you','Pick up ${T("Empyrean'],
 'daily':['${T("Supply Requests", "supply")}</b> (Lv 25)','${T("Duty Quests"','Daily dungeon</b> (Lv 30)','Weekly Command'],'f2p':['Kina is your bottleneck','Cash shop is','Daeva Pass:</b> claim'],'hold':['${T("Shugo Festival", "shugo")}.</b>','${T("Enhancing", "enhance")} leveling','Throwing away','Premium materials']}
for sid,lst in steps.items():
    for j,sn in enumerate(lst):
        once('      { t: `<b>'+sn, '      { k: "%s:%d", t: `<b>%s'%(sid,j,sn))
open(F,'w',encoding='utf-8').write(s)
print('ok')
