import json,sys,os
P='/tmp/claude-0/-home-claude/3de1c16d-f486-54fd-a3e3-19bf8a09de56/scratchpad/r1/partial.json'
d=json.load(open(P)) if os.path.exists(P) else {}
new=json.load(sys.stdin)
for e in new: d[e['name']]=e
json.dump(d,open(P,'w'),indent=1,ensure_ascii=False)
print(len(d),'entries')
