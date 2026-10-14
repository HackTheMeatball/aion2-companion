import re, json, sys
F='assassin-route.html'
src=open(F,encoding='utf-8').read()
a=src.index('<style>')+7; b=src.index('</style>'); css=src[a:b]
exec(open('polish/e1/deadcss.py').read().split('# --- tiny CSS parser')[1].split('nodes,_=parse(css)')[0].split('\n',1)[1])
nodes,_=parse(css)
def emit(nodes):
    o=''
    for nd in nodes:
        if nd[0]=='raw' or nd[0]=='stmt': o+=nd[1]
        elif nd[0]=='rule': o+=nd[1]+nd[2]
        else: o+=nd[1]+'{'+emit(nd[2])+'}'
    return o
seq=[]
def walk(ns):
    for i,nd in enumerate(ns):
        if nd[0]=='rule' and not nd[1].strip().startswith('@'): seq.append((ns,i))
        elif nd[0]=='block' and nd[1].strip().startswith('@media'): walk(nd[2])
walk(nodes)
agg=json.load(open('polish/e1/noeffect.json'))
print('parser rules',len(seq),'cssom rules',len(agg))
assert len(seq)==len(agg)
norm=lambda x: re.sub(r'\s+','',x).replace('"',"'").lower()
rm=[]; mism=0
for k,v in agg.items():
    if not(v['obs'] and not v['eff'] and not v['skip']): continue
    idx=int(k.rsplit('#',1)[1]); ns,i=seq[idx]; pre=ns[i][1]
    sel=k.split(' :: ')[-1].split(' {')[0]
    if norm(sel)[:12]!=norm(pre)[:12]: mism+=1; print('MISMATCH',sel,'|',pre.strip()[:60]); continue
    if '[hidden]' in pre or 'q-snz' in pre or 'st-pick' in pre: continue
    rm.append((ns,i,pre.strip()))
print('removing',len(rm),'mismatches',mism)
for ns,i,_ in rm: ns[i]=('raw','')
newcss=re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+','\n',emit(nodes))
# drop now-empty @media blocks
newcss=re.sub(r'@media[^{]*\{\s*\}\n?','',newcss)
if len(sys.argv)>1 and sys.argv[1]=='apply':
    open(F,'w',encoding='utf-8').write(src[:a]+newcss+src[b:]); json.dump([x[2] for x in rm],open('polish/e1/noeffect-removed.json','w'),indent=0)
print('bytes',len(css),'->',len(newcss))
