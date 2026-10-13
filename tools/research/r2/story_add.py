import json,sys,os
p=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'data', 'story-40-45.json')
d=json.load(open(p)) if os.path.exists(p) else {}
new=json.loads(sys.stdin.read())
d.update(new)
json.dump(d,open(p,'w'),indent=2,ensure_ascii=False)
print(len(d),'entries')
