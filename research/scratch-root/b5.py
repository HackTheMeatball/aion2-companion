import json
B="https://metabot.gg/en/aion-2/quests/"
rows=[
("Searching for Survivors","Nemon","Odar's Shade","Odar's Shade",17,"Nemon","Uruthumheim","Victorious Daeva's Statue",175,"searching-for-survivors"),
("Prison Break","Nemon","Uruthumheim","Victorious Daeva's Statue",175,"Hadala","Minushan Site","Minushan Site",34,"prison-break"),
("Finding Stolen Relics","Hadala","Minushan Site","Minushan Site",34,"Gohok","Minushan Site",None,None,"finding-stolen-relics"),
("Voice of Rage","Gohok",None,None,None,"Nemon",None,None,None,"voice-of-rage"),
("Tangled Past","Nemon",None,None,None,"Urd","Nornir Assembly",None,None,"tangled-past"),
("The High Priest Slumbers","Urd","Nornir Assembly","Nornir Assembly",164,"Urd","Nornir Assembly",None,None,"the-high-priest-slumbers"),
("Striving for Coexistence","Urd",None,"Nornir Assembly",164,"Varron",None,"Nornir Assembly",133,"striving-for-coexistence"),
("A Collective Effort","Hadala","Wind Altar","Purifying Forest Coastal Cliff",89,"Darmand","Faded Stump","Faded Stump",29,"a-collective-effort"),
]
out={}
for r in rows:
    out[r[0]]=dict(zip(["giver","giverPlace","giverKib","giverKibM","turnin","turninPlace","turninKib","turninKibM"],r[1:9]))
    out[r[0]]["src"]=B+r[9]
json.dump(out,open("b5.json","w"),indent=1)
