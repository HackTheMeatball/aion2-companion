import json,sys,os
P=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'partial.json')
d=json.load(open(P)) if os.path.exists(P) else {}
new=json.load(sys.stdin)
for e in new: d[e['name']]=e
json.dump(d,open(P,'w'),indent=1,ensure_ascii=False)
print(len(d),'entries')
