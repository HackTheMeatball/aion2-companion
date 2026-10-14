import json,sys
p='data/story.json'
d=json.load(open(p))
d.update(json.load(open(sys.argv[1])))
json.dump(d,open(p,'w'),indent=2,ensure_ascii=False)
print(len(d))
