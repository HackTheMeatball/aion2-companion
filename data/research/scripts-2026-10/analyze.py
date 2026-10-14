import json,math,collections,statistics as st,csv
S='/tmp/claude-0/-home-user-daeva-companion/e25e447d-251e-5805-b703-b3ec59ecec09/scratchpad'
R='/home/user/daeva-companion/'
spots=json.load(open(S+'/spots_all.json')); fit=json.load(open(S+'/fit.json'))
rq=json.load(open(R+'data/rq.json')); sh=json.load(open(R+'data/strongholds.json')); dg=json.load(open(R+'data/dungeons.json'))
zone={}
for q in rq: zone[q['name']]=q.get('zone')
for h in sh: zone[h['name']]=h.get('zone')
for d in dg: zone[d['name']]=d.get('zone')
# kib -> zone votes (from every spot citing it)
votes=collections.defaultdict(collections.Counter)
for n,sl in spots.items():
    z=zone.get(n)
    if not z: continue
    for s in sl:
        if s.get('kisk') and s['map']=='World_D_A': votes[s['kisk']['name']][z]+=1
kz={k:(v.most_common(1)[0][0] if v else None) for k,v in votes.items()}
rows=[]
for r in fit:
    if r.get('status'): continue
    well = r['n']>=5 and r['spread']>=0.2 and 's' in r
    coll = r['spread']<0.1
    r['zone']=kz.get(r['kib']) or '(story/other only)'
    r['conf']='high' if (r['n']>=5 and r['spread']>=0.2) else ('medium' if not coll else 'low (near-collinear: mirror ambiguity)')
    r['well']=well
    rows.append(r)
print(len(rows),'recovered;',sum(1 for r in rows if r['well']),'well-conditioned for scale')
byz=collections.defaultdict(list)
for r in rows:
    if r['well']: byz[r['zone']].append(r['s'])
print('scale by zone');
for z,v in sorted(byz.items()): print(' ',z,len(v),round(st.median(v),4),min(v),max(v))
allv=[r['s'] for r in rows if r['well']]
print('all',len(allv),st.mean(allv),st.median(allv),min(allv),max(allv))
json.dump(rows,open(S+'/kib_rows.json','w'),indent=1)
# unrecovered
un=[r for r in fit if r.get('status')]
print('unrecovered',len(un),[(r['kib'],r['n']) for r in un])
# distance stats over all points: giver/turnin/entrance/steps with kisk d
ds=[]; 
for n,sl in spots.items():
    for s in sl:
        if s.get('kisk'): ds.append((s['kind'],s['kisk']['d']))
def pct(v,p): v=sorted(v); return v[min(len(v)-1,int(p*len(v)))]
for kind in('start','step','end','all'):
    v=[d for k,d in ds if kind=='all' or k==kind]
    print(kind,len(v),'median',st.median(v),'p25',pct(v,.25),'p75',pct(v,.75),'p90',pct(v,.9),'max',max(v),
      '<=50',sum(1 for d in v if d<=50),'<=100',sum(1 for d in v if d<=100),'<=200',sum(1 for d in v if d<=200),'>300',sum(1 for d in v if d>300))
# hops
hop=[];
def order(sl):
    def key(s):
        if s['id']=='step-start': return -1
        if s['id']=='step-end': return 10**6
        return int(s['id'].split('-')[1])
    return sorted(sl,key=key)
for n,sl in spots.items():
    o=[s for s in order(sl) if s['map']=='World_D_A' and s['c'] and s.get('kisk')]
    for a,b in zip(o,o[1:]):
        r=math.hypot(a['c'][0]-b['c'][0],a['c'][1]-b['c'][1])
        hop.append((n,a['id'],b['id'],r,b['kisk']['d']))
print('hops',len(hop))
zero=[h for h in hop if h[3]<1]; print('same-spot hops',len(zero))
real=[h for h in hop if h[3]>=1]
print('run shorter than kib distance of target (teleport no help)',sum(1 for h in real if h[3]<=h[4]),'of',len(real))
print('run > kib dist +50:',sum(1 for h in real if h[3]>h[4]+50),' >+200:',sum(1 for h in real if h[3]>h[4]+200))
print('hop dist median',st.median([h[3] for h in real]),'p90',pct([h[3] for h in real],.9),'max',max(h[3] for h in real))
# quests: total run-all vs per-hop best (run or teleport) 
tot_run=0;tot_best=0;qs=0
for n,sl in spots.items():
    o=[s for s in order(sl) if s['map']=='World_D_A' and s['c'] and s.get('kisk')]
    if len(o)<2: continue
    qs+=1
    run=0;best=0
    for a,b in zip(o,o[1:]):
        r=math.hypot(a['c'][0]-b['c'][0],a['c'][1]-b['c'][1]); run+=r; best+=min(r,b['kisk']['d'])
    tot_run+=run; tot_best+=best
print('quests multi-point',qs,'sum run',round(tot_run),'sum best(run|tp)',round(tot_best))
json.dump(hop,open(S+'/hops.json','w'))
