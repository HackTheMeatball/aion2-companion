const { chromium } = require('playwright');
const W = +process.argv[2]||1280, MODE=process.argv[3]||'advanced', SC=process.argv[4]||'A';
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:W,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.cwd() + '/test-icons.html'); await p.waitForTimeout(300);
 await p.evaluate(([MODE,SC]) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k));
   s.mode=MODE; s.level=22; s.quest=(QUESTS.filter(q=>q[0]<=22).pop()||QUESTS[0])[1]; if(SC==='G'){s.quest=QUESTS.find(q=>q[0]>23)[1];} s.checks=s.checks||{}; s.started={}; s.pendSt=0; s.pendCr=0;
   GATES.forEach(g=>{ if(g.lv<22) g.items.forEach((it,j)=>{ s.checks[it.k||g.id+':'+j]=true; }); });
   Object.keys(s.checks).filter(x=>/^(sp|dv):/.test(x)).forEach(x=>delete s.checks[x]); s.dvTotal=0;
   // mark all SP done to avoid skill cards
   SP_STEPS.forEach(x=>s.checks[x.k]=true);
   if(SC==='A'){ s.started['g22:3']=1; s.started['g22:5']=1; s.started['g22:7']=1; }
   if(SC==='B'){ s.checks['g22:3']=true; s.started['g22:5']=1; }       // Blade turned in
   if(SC==='C'){ ['g22:3','g22:4','g22:5','g22:6','g22:7'].forEach(x=>s.checks[x]=true); }
   if(SC==='D'){ s.level=30; ['g22:3','g22:4','g22:5','g22:6','g22:7'].forEach(x=>delete s.checks[x]); GATES.forEach(g=>{ if(g.lv>22&&g.lv<=30) g.items.forEach((it,j)=>{ if(it.kind!=='quest') s.checks[it.k||g.id+':'+j]=true; }); }); }
   if(SC==='E'){ s.started['g22:4']=1; } // follow-up marked in progress though Blade not done
   localStorage.setItem(k, JSON.stringify(s)); }, [MODE,SC]);
 await p.reload(); await p.waitForTimeout(600);
 const r = await p.evaluate(() => { const st=document.querySelector('#nsqWrap'); const cards=[...document.querySelectorAll('#nowStar .ns-card')].map(c=>c.querySelector('h3').textContent.trim().slice(0,50)+' | '+(c.querySelector('.title p')||{}).textContent+' | '+c.offsetHeight);
   const q=[...document.querySelectorAll('#nowStar .ns-qgrid li')].map(l=>l.textContent);
   return {stackH: st&&st.offsetHeight, scrollH: st&&st.scrollHeight, cards, q, docW: document.documentElement.scrollWidth, bar: (document.querySelector('#nowStar .nsq-barl')||{}).textContent,
    trunc:[...document.querySelectorAll('#nowStar .ql')].filter(e=>e.scrollWidth>e.clientWidth).map(e=>e.textContent)}; });
 console.log(JSON.stringify(r,null,1));
 await (await p.$('#nowStar')).screenshot({path:`qa_${SC}_${MODE}_${W}.png`});
 // Show button
 const show = await p.$('#nowStar .ns-card:has(.ns-qgrid) .ns-go'); if (show) { await show.click(); await p.waitForTimeout(2500);
   await p.screenshot({path:'qa_show_'+W+'_'+MODE+'.png'}); console.log('after show', await p.evaluate(() => { const d=[...document.querySelectorAll('#gates details.step')].find(d=>{const r=d.getBoundingClientRect(); return r.top>-5&&r.top<200;}); return {y:scrollY, inView: d&&d.id, g22: (()=>{const g=document.getElementById('g22'); const r=g.getBoundingClientRect(); return [g.open, Math.round(r.top), getComputedStyle(g).display];})()}; })); }
 await b.close(); })();
