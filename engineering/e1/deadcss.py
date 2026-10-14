"""Find (and optionally remove) CSS selectors that reference classes/ids never used outside <style>.
usage: deadcss.py report|apply"""
import re, sys, json
F='assassin-route.html'
src=open(F,encoding='utf-8').read()
a=src.index('<style>')+7; b=src.index('</style>')
css=src[a:b]; rest=src[:a]+src[b:]
def used(name):
    return re.search(r'(?<![\w-])'+re.escape(name)+r'(?![\w-])', rest) is not None
# --- tiny CSS parser: returns list of nodes (kind, prelude, body/children, span)
def parse(s, i=0, end=None):
    nodes=[]; n=len(s) if end is None else end
    while i<n:
        # skip ws/comments
        m=re.compile(r'\s+|/\*.*?\*/',re.S).match(s,i)
        if m and m.end()>i: nodes.append(('raw',s[i:m.end()])); i=m.end(); continue
        if s[i]=='}': return nodes,i
        # read prelude up to { or ;
        j=i; depth=0
        while j<n and not (s[j] in '{;' and depth==0):
            if s[j]=='(': depth+=1
            elif s[j]==')': depth-=1
            elif s[j] in '"\'':
                q=s[j]; j+=1
                while s[j]!=q: j+=1
            j+=1
        pre=s[i:j]
        if j<n and s[j]==';': nodes.append(('stmt',pre+';')); i=j+1; continue
        if pre.strip().startswith('@media') or pre.strip().startswith('@supports'):
            kids,k=parse(s,j+1,n); nodes.append(('block',pre,kids)); i=k+1; continue
        # rule or keyframes: find matching }
        k=j+1; depth=1
        while depth:
            if s[k]=='{': depth+=1
            elif s[k]=='}': depth-=1
            elif s[k] in '"\'':
                q=s[k]; k+=1
                while s[k]!=q: k+=1
            k+=1
        nodes.append(('rule',pre,s[j:k])); i=k
    return nodes,i
nodes,_=parse(css)
def split_sel(pre):
    out=[];depth=0;cur=''
    for ch in pre:
        if ch=='(' : depth+=1
        if ch==')': depth-=1
        if ch==',' and depth==0: out.append(cur); cur=''
        else: cur+=ch
    out.append(cur); return out
def dead_names(sel):
    s=re.sub(r':not\([^()]*\)','',sel)          # names inside :not() don't make a selector dead
    s=re.sub(r'\[[^\]]*\]','',s)
    names=re.findall(r'\.(-?[A-Za-z_][\w-]*)',s)+re.findall(r'#([A-Za-z_][\w-]*)',s)
    return [x for x in names if not used(x)]
removed=[]; kept_partial=[]
def walk(nodes, ctx=''):
    out=[]
    for nd in nodes:
        if nd[0]=='rule' and not nd[1].strip().startswith('@'):
            sels=split_sel(nd[1]); live=[x for x in sels if not dead_names(x)]
            if not live: removed.append((ctx, nd[1].strip()[:140])); continue
            if len(live)<len(sels):
                kept_partial.append((ctx,[x.strip() for x in sels if x not in live]))
                lead=re.match(r'\s*',nd[1]).group(0)
                nd=('rule',lead+', '.join(x.strip() for x in live)+' ',nd[2])
            out.append(nd)
        elif nd[0]=='block':
            kids=walk(nd[2], nd[1].strip())
            if any(k[0] in ('rule','block','stmt') for k in kids): out.append(('block',nd[1],kids))
            else: removed.append((ctx, nd[1].strip()+' (now empty)'))
        else: out.append(nd)
    return out
def emit(nodes):
    o=''
    for nd in nodes:
        if nd[0]=='raw' or nd[0]=='stmt': o+=nd[1]
        elif nd[0]=='rule': o+=nd[1]+nd[2]
        else: o+=nd[1]+'{'+emit(nd[2])+'}'
    return o
assert emit(nodes)==css, 'parser roundtrip failed'
new=walk(nodes)
newcss=emit(new)
# collapse blank lines left behind
newcss=re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+','\n',newcss)
deadcls=sorted({x for _,p in removed for x in dead_names(p)})
if sys.argv[1]=='report':
    print('rules removed:',len(removed),' partial selector lists:',len(kept_partial))
    print('dead names:',len(deadcls)); print(' '.join(deadcls))
    for c,p in kept_partial[:80]: print('PARTIAL',c,p)
else:
    open(F,'w',encoding='utf-8').write(src[:a]+newcss+src[b:])
    json.dump({'removed':removed,'partial':kept_partial},open('polish/e1/deadcss-removed.json','w'),indent=1)
    print('removed',len(removed),'rules; bytes',len(css),'->',len(newcss))
