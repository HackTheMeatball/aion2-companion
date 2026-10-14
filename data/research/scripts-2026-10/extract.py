import sys,re,json
def flight(path):
    t=open(path,errors='ignore').read()
    parts=re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>',t,flags=re.S)
    out=''
    for p in parts:
        try: out+=json.loads('"'+p+'"')
        except Exception: out+=p.encode().decode('unicode_escape',errors='ignore')
    return out
def spots(txt):
    i=txt.find('"spots":[')
    if i<0: return None
    j=i+len('"spots":'); d=0; k=j; ins=False; esc=False
    while k<len(txt):
        c=txt[k]
        if ins:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c=='"': ins=False
        else:
            if c=='"': ins=True
            elif c=='[': d+=1
            elif c==']':
                d-=1
                if d==0: break
        k+=1
    return txt[j:k+1]
if __name__=='__main__':
    t=flight(sys.argv[1]); s=spots(t)
    print(len(t)); print(s[:3000] if s else None)
