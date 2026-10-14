"""Remove declarations that a later rule with the exact same selector (same @media context) overrides.
usage: dupcss.py report|apply"""
import re, sys, json
sys.path.insert(0,'polish/e1')
F='assassin-route.html'
src=open(F,encoding='utf-8').read()
a=src.index('<style>')+7; b=src.index('</style>'); css=src[a:b]
exec(open('polish/e1/deadcss.py').read().split('# --- tiny CSS parser')[1].split('nodes,_=parse(css)')[0].split('\n',1)[1])
nodes,_=parse(css)
SH={'padding':['padding-top','padding-right','padding-bottom','padding-left','padding-inline','padding-block'],'margin':['margin-top','margin-right','margin-bottom','margin-left','margin-inline','margin-block'],
 'inset':['top','right','bottom','left'],'border-radius':[],'gap':['row-gap','column-gap'],'font':['font-size','font-weight','font-family','font-style','line-height'],'background':['background-color','background-image'],
 'border':['border-color','border-width','border-style'],'overflow':['overflow-x','overflow-y'],'flex':['flex-grow','flex-shrink','flex-basis']}
def decls(body):
    inner=body[1:-1]; out=[]; depth=0; cur=''
    i=0
    while i<len(inner):
        ch=inner[i]
        if ch=='(': depth+=1
        if ch==')': depth-=1
        if ch in '"\'':
            j=inner.index(ch,i+1); cur+=inner[i:j+1]; i=j+1; continue
        if ch==';' and depth==0: out.append(cur); cur=''
        else: cur+=ch
        i+=1
    if cur.strip(): out.append(cur)
    res=[]
    for d in out:
        if ':' not in d: res.append((None,d,False)); continue
        p,v=d.split(':',1); imp='!important' in v
        res.append((p.strip().lower(),d,imp))
    return res
# flatten rules with context
flat=[]
def walk(ns,ctx,parentlist):
    for idx,nd in enumerate(ns):
        if nd[0]=='rule' and not nd[1].strip().startswith('@'):
            flat.append([ctx, ' '.join(nd[1].split()), nd, parentlist, idx])
        elif nd[0]=='block': walk(nd[2], ctx+'|'+' '.join(nd[1].split()), nd[2])
walk(nodes,'',nodes)
# for each rule, find later rules with identical (ctx, selector); remove declarations overridden later
removed=0; saved=0; emptied=0
for i,(ctx,sel,nd,plist,idx) in enumerate(flat):
    later=[f for f in flat[i+1:] if f[0]==ctx and f[1]==sel]
    ds=decls(nd[2])
    # also within the same rule: earlier duplicate property
    keep=[]
    for j,(p,d,imp) in enumerate(ds):
        if p is None: keep.append(d); continue
        over=False
        laterdecls=[x for f in later for x in decls(f[2][2])]+ds[j+1:]
        for (q,_,imp2) in laterdecls:
            if q is None: continue
            if (q==p or p in SH.get(q,[])) and (imp2 or not imp): over=True; break
        if over: removed+=1; saved+=len(d)+1
        else: keep.append(d)
    if len(keep)!=len([d for d in ds]):
        if not any(k.strip() for k in keep):
            plist[idx]=('raw',''); emptied+=1
        else:
            nb='{'+';'.join(keep)+(';' if nd[2].rstrip('}').rstrip().endswith(';') else '')+'}'
            newnd=('rule',nd[1],nb); plist[idx]=newnd
            # keep flat in sync for later comparisons
            flat[i][2]=newnd
print('overridden declarations:',removed,'rules emptied:',emptied,'~bytes:',saved)
def emit(nodes):
    o=''
    for nd in nodes:
        if nd[0]=='raw' or nd[0]=='stmt': o+=nd[1]
        elif nd[0]=='rule': o+=nd[1]+nd[2]
        else: o+=nd[1]+'{'+emit(nd[2])+'}'
    return o
if sys.argv[1]=='apply':
    newcss=re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+','\n',emit(nodes))
    open(F,'w',encoding='utf-8').write(src[:a]+newcss+src[b:]); print('bytes',len(css),'->',len(newcss))
