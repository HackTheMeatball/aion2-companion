import heapq,re,itertools,sys
G="""Speed(4) | Atk(1) | CHR(1) | . | Exploit Weakness(2) | CHR(1) | Shadow Fall(3) | . | Apply Poison(2) | Crit(1) | CDR(4)
Crit(1) | . | Heart Gore(3) | MP(1) | Def(1) | . | MP(1) | Def(1) | CHR(1) | . | MP(1)
Heightened Sixth Sense(2) | Def(1) | HP(1) | . | Crit(1) | Shadowstrike(3) | HP(1) | . | Flash Slice(3) | HP(1) | Rear Smite(2)
. | HP(1) | . | . | CHR(1) | . | Def(1) | . | Atk(1) | . | Def(1)
MP(1) | Atk(1) | Savage Roar(3) | HP(1) | MP(1) | X(1) | CHR(1) | Assault Stance(2) | MP(1) | Crit(1) | CHR(1)
Defiance(3) | . | . | Def(1) | . | S | . | Atk(1) | . | . | Storm Rampage(3)
Crit(1) | CHR(1) | HP(1) | Rear Smite(2) | Crit(1) | X(1) | HP(1) | MP(1) | Quick Slice(3) | Def(1) | HP(1)
Atk(1) | . | Def(1) | . | Atk(1) | . | Crit(1) | . | . | MP(1) | .
Assault Stance(2) | MP(1) | Infiltrate(3) | . | MP(1) | Ambush(3) | CHR(1) | . | MP(1) | Atk(1) | Exploit Weakness(2)
HP(1) | . | Crit(1) | Atk(1) | HP(1) | . | Atk(1) | HP(1) | Whirlwind Slice(3) | . | CHR(1)
CDR(4) | CHR(1) | Apply Poison(2) | . | Insignia Explosion(3) | Crit(1) | Heightened Sixth Sense(2) | . | Crit(1) | Def(1) | Speed(4)"""
g=[[c.strip() for c in r.split('|')] for r in G.splitlines()]
def cost(c):
    if c=='S':return 0
    m=re.search(r'\((\d)\)',c);return int(m.group(1)) if m else None
N=11;cells={(r,c):cost(g[r][c]) for r in range(N) for c in range(N) if cost(g[r][c]) is not None}
def nb(p):
    r,c=p
    for d in((1,0),(-1,0),(0,1),(0,-1)):
        q=(r+d[0],c+d[1])
        if q in cells:yield q
def find(n):return [k for k in cells if g[k[0]][k[1]].startswith(n)]
def steiner(T):
    T=list(T);full=(1<<len(T))-1;INF=10**9;dp={}
    for v in cells:dp[(0,v)]=0
    for m in range(1,full+1):
        if bin(m).count('1')==1:
            d={v:INF for v in cells};t=T[m.bit_length()-1];d[t]=cells[t]
        else:
            d={v:INF for v in cells};sub=(m-1)&m
            while sub:
                for v in cells:
                    a=dp[(sub,v)]+dp[(m^sub,v)]-cells[v]
                    if a<d[v]:d[v]=a
                sub=(sub-1)&m
        pq=[(x,v) for v,x in d.items() if x<INF];heapq.heapify(pq)
        while pq:
            x,v=heapq.heappop(pq)
            if x>d[v]:continue
            for q in nb(v):
                y=x+cells[q]
                if y<d[q]:d[q]=y;heapq.heappush(pq,(y,q))
        for v in cells:dp[(m,v)]=d[v]
    return dp[(full,(5,5))]
def best(groups):
    # groups: list of lists of candidate cells; pick one each (or 'all' tuples)
    b=None
    for combo in itertools.product(*groups):
        T=set();[T.update(c if isinstance(c,tuple) and isinstance(c[0],tuple) else [c]) for c in combo]
        v=steiner(T)
        if b is None or v<b[0]:b=(v,combo)
    return b
EW=tuple(find('Exploit')); AS=tuple(find('Assault'))
corner=find('CDR')+find('Speed')
sets={
 "current (HG,Amb,QS,EW2,AS2,corner)":[find('Heart Gore'),find('Ambush'),find('Quick Slice'),[EW],[AS],corner],
 "same minus corner":[find('Heart Gore'),find('Ambush'),find('Quick Slice'),[EW],[AS]],
 "HG,IE,QS,Amb,EW2,AS2,corner":[find('Heart Gore'),find('Insignia'),find('Quick Slice'),find('Ambush'),[EW],[AS],corner],
 "HG,IE,QS,EW2,AS2,corner (no Amb)":[find('Heart Gore'),find('Insignia'),find('Quick Slice'),[EW],[AS],corner],
 "HG,IE,QS,SavageRoar,EW2,AS2,corner":[find('Heart Gore'),find('Insignia'),find('Quick Slice'),find('Savage'),[EW],[AS],corner],
 "all 4 actives HG,IE,QS,Amb + SR, EW2,AS2,corner":[find('Heart Gore'),find('Insignia'),find('Quick Slice'),find('Ambush'),find('Savage'),[EW],[AS],corner],
}
for k,v in sets.items():print(k,best(v)[0])
base=[find('Heart Gore'),find('Ambush'),find('Quick Slice'),[EW],[AS],corner]
b0=best(base)[0]
for s in ['Insignia','Shadowstrike','Savage','Apply Poison']:
    print('+',s,best(base+[find(s)])[0]-b0)
print('---')
HG,AM,QS,IE,SS,SR=[find(x) for x in ['Heart Gore','Ambush','Quick Slice','Insignia','Shadowstrike','Savage']]
for name,s in {
 'current+IE+SS+SR':[HG,AM,QS,IE,SS,SR,[EW],[AS],corner],
 'consensus no Ambush (HG,QS,IE,SS,SR,EW2,AS2,corner)':[HG,QS,IE,SS,SR,[EW],[AS],corner],
 'current+IE':[HG,AM,QS,IE,[EW],[AS],corner],
 'current+IE+SS':[HG,AM,QS,IE,SS,[EW],[AS],corner],
}.items(): print(name,best(s)[0])
