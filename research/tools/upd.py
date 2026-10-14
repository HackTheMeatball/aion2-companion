import json,sys,os
p='/tmp/claude-0/-home-claude/3de1c16d-f486-54fd-a3e3-19bf8a09de56/scratchpad/data/locations.json'
d=json.load(open(p)) if os.path.exists(p) else {"quests":{},"areas":{}}
patch=json.loads(sys.stdin.read())
for sec in patch:
    for k,v in patch[sec].items(): d[sec].setdefault(k,{}).update(v)
json.dump(d,open(p,'w'),indent=1,ensure_ascii=False)
print({s:len(d[s]) for s in d})
