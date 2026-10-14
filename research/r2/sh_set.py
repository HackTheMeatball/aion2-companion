import json,sys
p='data/strongholds.json'; d=json.load(open(p))
for u in json.loads(sys.stdin.read()):
    for x in d:
        if x['name']==u['name']:
            notes=u.pop('notes',None)
            x.update(u)
            if notes: x['notes']=x['notes']+notes
json.dump(d,open(p,'w'),indent=2,ensure_ascii=False)
print(sum(1 for x in d if x['steps']),'with steps')
