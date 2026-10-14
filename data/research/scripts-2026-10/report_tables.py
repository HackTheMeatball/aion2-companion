import json,csv,collections,statistics as st
S='/tmp/claude-0/-home-user-daeva-companion/e25e447d-251e-5805-b703-b3ec59ecec09/scratchpad'
R='/home/user/daeva-companion/'
spots=json.load(open(S+'/spots_all.json')); fit=json.load(open(S+'/fit.json')); rows=json.load(open(S+'/kib_rows.json'))
rq=json.load(open(R+'data/rq.json')); sh=json.load(open(R+'data/strongholds.json')); dg=json.load(open(R+'data/dungeons.json'))
zone={}
for q in rq: zone[q['name']]=q.get('zone')
for h in sh: zone[h['name']]=h.get('zone')
for d in dg: zone[d['name']]=d.get('zone')
votes=collections.defaultdict(collections.Counter)
for n,sl in spots.items():
    z=zone.get(n)
    for s in sl:
        if s.get('kisk') and s['map']=='World_D_A': votes[s['kisk']['name']][z or '(story only)']+=1
def kz(k):
    v=votes.get(k)
    if not v: return '(none)'
    real=[(c,z) for z,c in v.items() if z!='(story only)']
    return max(real)[1] if real else '(story only)'
out=[]
byk={r['kib']:r for r in rows}
for r in fit:
    k=r['kib']; z=kz(k)
    if r.get('status'):
        out.append(dict(zone=z,kibelisk=k,x='',y='',n_points=r['n'],rms_m='',confidence='not recoverable (<3 single-point markers)'))
    else:
        b=byk[k]
        out.append(dict(zone=z,kibelisk=k,x=round(b['x2'] if b.get('well') else b['x1']),y=round(b['y2'] if b.get('well') else b['y1']),
            n_points=b['n'],rms_m=b['rms2'] if b.get('well') else b['rms1'],confidence=b['conf']))
out.sort(key=lambda r:(r['zone'],r['kibelisk']))
with open(R+'data/research/kibelisk-positions-metabot-2026-10.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['zone','kibelisk','x','y','n_points','rms_m','confidence','map','derivation']); w.writeheader()
    for r in out:
        r['map']='World_D_A'; r['derivation']='derived by trilateration from Metabot quest-page markers (see docs/research/2026-10-location-coverage.md); not published by Metabot'
        w.writerow(r)
md=['| Zone (our data) | Kibelisk | x | y | Markers | RMS (m) | Confidence |','|---|---|--:|--:|--:|--:|---|']
for r in out:
    md.append(f"| {r['zone']} | {r['kibelisk']} | {r['x']} | {r['y']} | {r['n_points']} | {r['rms_m']} | {r['confidence']} |")
open(S+'/kib_table.md','w').write('\n'.join(md))
print(len(out),sum(1 for r in out if r['x']!=''))
print(collections.Counter(r['confidence'] for r in out))
# scale table per zone
by=collections.defaultdict(list)
for r in rows:
    if r['well']: by[kz(r['kib'])].append((r['kib'],r['n'],r['s'],r['rms2']))
t=['| Zone | Kibelisks fitted | Markers | Ratio m/px (per Kibelisk) | Median | RMS residual (m) |','|---|--:|--:|---|--:|---|']
for z,v in sorted(by.items()):
    t.append(f"| {z} | {len(v)} | {sum(a[1] for a in v)} | {', '.join(f'{a[0]} {a[2]:.4f}' for a in v)} | {st.median([a[2] for a in v]):.4f} | {', '.join(str(a[3]) for a in v)} |")
open(S+'/scale_table.md','w').write('\n'.join(t))
print('\n'.join(t))
