import json,sys,os
p=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'locations.json')
d=json.load(open(p)) if os.path.exists(p) else {"quests":{},"areas":{}}
patch=json.loads(sys.stdin.read())
for sec in patch:
    for k,v in patch[sec].items(): d[sec].setdefault(k,{}).update(v)
json.dump(d,open(p,'w'),indent=1,ensure_ascii=False)
print({s:len(d[s]) for s in d})
