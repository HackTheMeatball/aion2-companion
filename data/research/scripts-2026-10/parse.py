import sys,re,json,hashlib,os
sys.path.insert(0,os.path.dirname(__file__))
from extract import flight,spots
S=os.path.dirname(os.path.dirname(__file__))
def cpath(u): return f"{S}/cache/{hashlib.md5(u.encode()).hexdigest()[:16]}.html"
def parse(u):
    p=cpath(u)
    if not os.path.exists(p): return {'missing':True}
    t=flight(p)
    s=spots(t)
    sp=json.loads(s) if s else []
    out=[]
    for x in sp:
        pts=[q for g in x.get('goals',[]) for q in g.get('pts',[]) if isinstance(q,list)]
        c=x.get('center')
        if not isinstance(c,list):
            c=pts[0] if len(pts)==1 else None
        out.append({'mark':x.get('mark'),'id':x['id'],'kind':x['kind'],'map':x.get('map'),'pts':pts,'c':c,'kisk':x.get('kisk'),'npc':x.get('npc')})
    wh=re.findall(r'"children":"([^"]*?) · Nearest Kibelisk: ([^"]*?) · (\d+) m"',t)
    return {'spots':out,'where':wh,'title':(re.search(r'<title>(.*?)</title>',open(p,errors='ignore').read()) or [0,''])[1]}
if __name__=='__main__':
    print(json.dumps(parse(sys.argv[1]),indent=0)[:2500])
