import json,sys,os
p=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'data', 'dungeons.json')
d=json.load(open(p)) if os.path.exists(p) else []
for n in json.loads(sys.stdin.read()):
    d=[x for x in d if x['name']!=n['name']]+[n]
json.dump(d,open(p,'w'),indent=2,ensure_ascii=False)
print(len(d),'dungeons')
