import json,math,sys,collections,csv
S='/tmp/claude-0/-home-user-daeva-companion/e25e447d-251e-5805-b703-b3ec59ecec09/scratchpad'
R='/home/user/daeva-companion/'
spots=json.load(open(S+'/spots_all.json'))
# gather unique (kib, x, y, d, map) from single-point World_D_A spots
obs=collections.defaultdict(dict)
for name,sl in spots.items():
    for s in sl:
        if s['map']!='World_D_A' or not s.get('kisk') or len(s['pts'])!=1: continue
        x,y=s['pts'][0]; k=s['kisk']['name']; d=s['kisk']['d']
        obs[k][(x,y)]=d   # same point may recur with same d
def solve3(A,b):
    n=len(b); M=[A[i][:]+[b[i]] for i in range(n)]
    for i in range(n):
        p=max(range(i,n),key=lambda r:abs(M[r][i])); M[i],M[p]=M[p],M[i]
        if abs(M[i][i])<1e-12: return None
        for r in range(n):
            if r!=i:
                f=M[r][i]/M[i][i]
                for c in range(i,n+1): M[r][c]-=f*M[i][c]
    return [M[i][n]/M[i][i] for i in range(n)]
def fit(pts,free_s):
    cx=sum(p[0] for p in pts)/len(pts); cy=sum(p[1] for p in pts)/len(pts)
    # multi-start around centroid and each point (circle fits can be multimodal)
    best=None
    starts=[(cx,cy)]+[(p[0],p[1]) for p in pts]+[(cx+dx,cy+dy) for dx in(-150,150) for dy in(-150,150)]
    for (kx,ky) in starts:
        s=1.0; lam=1e-2
        def res(kx,ky,s): return [s*math.hypot(p[0]-kx,p[1]-ky)-p[2] for p in pts]
        r=res(kx,ky,s); c=sum(v*v for v in r)
        for it in range(200):
            J=[]
            for p in pts:
                dd=math.hypot(p[0]-kx,p[1]-ky) or 1e-9
                J.append([-s*(p[0]-kx)/dd,-s*(p[1]-ky)/dd,dd] if free_s else [-s*(p[0]-kx)/dd,-s*(p[1]-ky)/dd])
            m=len(J[0])
            A=[[sum(J[i][a]*J[i][b] for i in range(len(pts))) for b in range(m)] for a in range(m)]
            g=[sum(J[i][a]*r[i] for i in range(len(pts))) for a in range(m)]
            ok=False
            for _ in range(10):
                A2=[[A[a][b]+(lam*A[a][a] if a==b else 0) for b in range(m)] for a in range(m)]
                dlt=solve3(A2,[-v for v in g])
                if dlt is None: lam*=10; continue
                nk,ny=kx+dlt[0],ky+dlt[1]; ns=s+(dlt[2] if free_s else 0)
                nr=res(nk,ny,ns); nc=sum(v*v for v in nr)
                if nc<c: kx,ky,s,r,c=nk,ny,ns,nr,nc; lam=max(lam/3,1e-9); ok=True; break
                lam*=5
            if not ok or c<1e-9: break
        if best is None or c<best[0]: best=(c,kx,ky,s,r)
    return best
def spread(pts):
    # rough conditioning: need non-collinear & angular spread; use bounding box of directions from centroid
    cx=sum(p[0] for p in pts)/len(pts); cy=sum(p[1] for p in pts)/len(pts)
    xs=[p[0]-cx for p in pts]; ys=[p[1]-cy for p in pts]
    sxx=sum(v*v for v in xs); syy=sum(v*v for v in ys); sxy=sum(a*b for a,b in zip(xs,ys))
    tr=sxx+syy; det=sxx*syy-sxy*sxy
    disc=max(tr*tr/4-det,0)**.5
    l1=tr/2+disc; l2=tr/2-disc
    return math.sqrt(max(l2,0)/max(l1,1e-9))   # minor/major axis ratio
out=[]
for k,d in sorted(obs.items()):
    pts=[(x,y,dd) for (x,y),dd in d.items()]
    if len(pts)<3: out.append(dict(kib=k,n=len(pts),status='too few points')); continue
    sp=spread([(p[0],p[1]) for p in pts])
    b1=fit(pts,False)
    rec=dict(kib=k,n=len(pts),spread=round(sp,2),x1=round(b1[1],1),y1=round(b1[2],1),
             rms1=round(math.sqrt(b1[0]/len(pts)),2),maxres1=round(max(abs(v) for v in b1[4]),1),
             dmax=max(p[2] for p in pts),dmin=min(p[2] for p in pts))
    if len(pts)>=5:
        b2=fit(pts,True)
        rec.update(x2=round(b2[1],1),y2=round(b2[2],1),s=round(b2[3],4),rms2=round(math.sqrt(b2[0]/len(pts)),2),maxres2=round(max(abs(v) for v in b2[4]),1))
    out.append(rec)
json.dump(out,open(S+'/fit.json','w'),indent=1)
for r in out: print(r)
