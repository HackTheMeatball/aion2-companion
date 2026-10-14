import heapq,itertools
G="""Damage Tolerance(4) | Crit(1) | MP(1) | CHR(1) | Storm Rampage(3) | Def(1) | Impact Hit(2) | Atk(1) | Insignia Explosion(3) | Def(1) | Damage Boost(4)
Atk(1) | . | Determination(2) | . | HP(1) | . | . | MP(1) | . | . | Crit(1)
Quick Slice(3) | HP(1) | Def(1) | . | Atk(1) | MP(1) | Shadowstrike(3) | CHR(1) | MP(1) | Revitalization Contract(2) | Atk(1)
Crit(1) | . | MP(1) | CHR(1) | Defense Break(2) | . | Crit(1) | . | Crit(1) | . | CHR(1)
Def(1) | HP(1) | Ambush(3) | . | Crit(1) | . | MP(1) | Ambush Stance(2) | HP(1) | Atk(1) | Savage Roar(3)
. | Atk(1) | . | . | X(1) | S | X(1) | . | . | Def(1) | .
Flash Slice(3) | Def(1) | MP(1) | Revitalization Contract(2) | HP(1) | . | CHR(1) | . | Shadow Fall(3) | MP(1) | Atk(1)
Crit(1) | . | CHR(1) | . | CHR(1) | . | Determination(2) | Crit(1) | HP(1) | . | CHR(1)
Def(1) | Ambush Stance(2) | HP(1) | Crit(1) | Infiltrate(3) | HP(1) | Def(1) | . | Atk(1) | MP(1) | Whirlwind Slice(3)
CHR(1) | . | . | MP(1) | . | . | MP(1) | . | Defense Break(2) | . | Def(1)
Damage Boost(4) | Atk(1) | Heart Gore(3) | Def(1) | Impact Hit(2) | Atk(1) | Defiance(3) | Crit(1) | HP(1) | CHR(1) | Damage Tolerance(4)"""
g=[[c.strip() for c in r.split('|')] for r in G.splitlines()]
import re
def cost(c):
    if c=='S':return 0
    m=re.search(r'\((\d)\)',c);return int(m.group(1)) if m else None
N=11;cells={(r,c):cost(g[r][c]) for r in range(N) for c in range(N) if cost(g[r][c]) is not None}
targets={k for k,v in cells.items() if any(n in g[k[0]][k[1]] for n in ['Heart Gore','Insignia','Quick Slice','Defense Break','Damage Boost'])}
# Steiner tree via Dreyfus-Wagner-ish DP over subsets (targets small)
T=sorted(targets);idx={t:i for i,t in enumerate(T)}
def nb(p):
    r,c=p
    for d in((1,0),(-1,0),(0,1),(0,-1)):
        q=(r+d[0],c+d[1])
        if q in cells:yield q
INF=10**9;full=(1<<len(T))-1
dp={}
for v in cells:dp[(0,v)]=0
for i,t in enumerate(T):
    for v in cells:dp[(1<<i,v)]=INF
for m in range(1,full+1):
    d={v:dp.get((m,v),INF) for v in cells}
    if bin(m).count('1')==1:
        i=bin(m)[::-1].index('1');d={v:INF for v in cells};d[T[i]]=cells[T[i]]
    sub=(m-1)&m
    while sub:
        for v in cells:
            a=dp.get((sub,v),INF)+dp.get((m^sub,v),INF)-cells[v]
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
print("targets",[(t,g[t[0]][t[1]]) for t in T])
print("min Steiner cost incl targets, from S:",dp[(full,(5,5))])
# also each single-target shortest cost from S
for i,t in enumerate(T):print(g[t[0]][t[1]],t,dp[(1<<i,(5,5))])
