import sys,json,re,csv,os
sys.path.insert(0,os.path.dirname(__file__))
from parse import parse
R='/home/user/daeva-companion/'
S=os.path.dirname(os.path.dirname(__file__))
rq=json.load(open(R+'data/rq.json')); st=json.load(open(R+'data/story.json')); st2=json.load(open(R+'data/story-40-45.json'))
dg=json.load(open(R+'data/dungeons.json')); sh=json.load(open(R+'data/strongholds.json'))
def slug(n): return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',n.lower().replace("'",""))).strip('-')
Q='https://metabot.gg/en/aion-2/quests/'
rows=[]; spots_all={}
def pt(s):
    return (s['c'] if s and s['c'] else [None,None])
def agree(dk,dm,s):
    if not s or not s['kisk']: return ''
    k=s['kisk']
    if dk is None and dm is None: return 'data has none'
    return 'yes' if (dk==k['name'] and dm==k['d']) else f"NO (data: {dk} {dm} m)"
def quest_row(typ,name,lvl,url,dat,note0=''):
    r=parse(url); notes=[note0] if note0 else []
    if r.get('missing'): return None
    sp=r['spots']; 
    g=next((s for s in sp if s['kind']=='start'),None); t=next((s for s in sp if s['kind']=='end'),None)
    steps=[s for s in sp if s['kind']=='step']
    comb = g is not None and (g.get('mark') or '')=='S·T'
    if comb: t=g
    maps={s['map'] for s in sp}
    gx,gy=pt(g); tx,ty=pt(t)
    status=[]
    if g is None: status.append('no giver point')
    if t is None: status.append('no turn-in point')
    if comb: status.append('giver = turn-in (S·T)')
    if g and len(g['pts'])>1: notes.append(f"giver has {len(g['pts'])} points, centre used")
    if t and len(t['pts'])>1: notes.append(f"turn-in has {len(t['pts'])} points, centre used")
    for s in sp: spots_all.setdefault(name,[]).append(s)
    return dict(type=typ,name=name,level=lvl,map='/'.join(sorted(m for m in maps if m)),
      giver_map=g['map'] if g else '',turnin_map=t['map'] if t else '',giver_x=gx,giver_y=gy,giver_kib=g['kisk']['name'] if g and g['kisk'] else '',giver_kib_m=g['kisk']['d'] if g and g['kisk'] else '',
      turnin_x=tx,turnin_y=ty,turnin_kib=t['kisk']['name'] if t and t['kisk'] else '',turnin_kib_m=t['kisk']['d'] if t and t['kisk'] else '',
      entrance_x='',entrance_y='',entrance_kib='',entrance_kib_m='',
      steps_with_points=len(steps),
      status='; '.join(status) or 'ok',
      our_data_giver_kib_agrees=agree(*dat[0],g) , our_data_turnin_kib_agrees=agree(*dat[1],t) if not comb else 'same point',
      page_url=url,notes=' | '.join(notes)),sp
for q in rq:
    url=q['src'] if 'metabot.gg' in q['src'] else Q+slug(q['name'])
    n='slug guessed (data cites '+q['src'].split('/')[2]+')' if url!=q['src'] else ''
    g=q.get('giver') or {}; t=q.get('turnin') or {}
    x=quest_row('regional',q['name'],q.get('rec'),url,((g.get('kib'),g.get('m')),(t.get('kib'),t.get('m'))),n)
    rows.append(x)
for d in (st,st2):
    for k,v in d.items():
        x=quest_row('story',k,v.get('lv'),v['src'],((v.get('giverKib'),v.get('giverKibM')),(v.get('turninKib'),v.get('turninKibM'))))
        rows.append(x)
def ent_row(typ,name,lvl,urlpage,qurl,dk,dm,note=''):
    r=parse(qurl)
    base=dict(type=typ,name=name,level=lvl,map='',giver_map='',turnin_map='',giver_x='',giver_y='',giver_kib='',giver_kib_m='',turnin_x='',turnin_y='',turnin_kib='',turnin_kib_m='',
      entrance_x='',entrance_y='',entrance_kib='',entrance_kib_m='',steps_with_points=0,our_data_giver_kib_agrees='',our_data_turnin_kib_agrees='',page_url=qurl,notes=note)
    s=next((s for s in r['spots'] if s['kind']=='step'),None) if not r.get('missing') else None
    if not s or not s['c']:
        base['status']='no point on page'; return base,[]
    base.update(map=s['map'],entrance_x=s['c'][0],entrance_y=s['c'][1],entrance_kib=s['kisk']['name'],entrance_kib_m=s['kisk']['d'],steps_with_points=len([z for z in r['spots'] if z['kind']=='step']),
      status='ok',our_data_giver_kib_agrees=agree(dk,dm,s))
    spots_all.setdefault(name,[]).append(s)
    return base,r['spots']
for d in dg:
    qurl=d.get('kibSrc') or Q+slug(d['name'])
    n='dungeon page ('+d['src']+') carries no coordinates; point is its Exploration quest step'
    if not d.get('kibSrc'): n+='; quest slug guessed = dungeon slug'
    b,_=ent_row('sealed_dungeon',d['name'],d.get('band'),d['src'],qurl,d.get('kib'),d.get('m'),n)
    rows.append((b,None))
for h in sh:
    b,_=ent_row('stronghold',h['name'],f"{h['lo']}-{h['hi']}",h['src'],h['src'],h.get('kib'),h.get('m'),
      f"stronghold list kib/m (data) vs quest step: data also holds step kib {h.get('stepKibM')}")
    # compare to step distance as well
    rows.append((b,None))
flat=[]
for x in rows:
    flat.append(x[0] if isinstance(x,tuple) else x)
cols=list(flat[0].keys())
out=R+'data/research/locations-metabot-2026-10.csv'
with open(out,'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
    for r in flat: w.writerow(r)
json.dump(spots_all,open(S+'/spots_all.json','w'))
print(len(flat))
