const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.cwd() + '/test-icons.html'); await p.waitForTimeout(300);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k));
   s.mode='advanced'; s.level=22; s.quest=QUESTS.find(q=>q[0]>23)[1]; s.started={}; s.pendSt=0; s.pendCr=0; s.dvTotal=0;
   GATES.forEach(g=>{ if(g.lv<=22) g.items.forEach((it,j)=>{ s.checks[it.k||g.id+':'+j]=true; }); }); SP_STEPS.forEach(x=>s.checks[x.k]=true);
   AREA_ITEMS.filter(x=>x.it.kind==='hideout').forEach(x=>delete s.checks[x.k]);
   localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(600);
 const m = () => p.evaluate(() => { const st=document.querySelector('#nsqWrap'); const f=st.querySelector('.ns-card'); return {stackH: st.offsetHeight, firstH: f.offsetHeight, first: f.querySelector('h3').textContent.slice(0,50), n: st.children.length, hasRQ: !!st.querySelector('.ns-qgrid')}; });
 console.log('init', await m());
 const ib = await p.$('#nowStar .ns-card.first .nsinfo'); if (ib) { await ib.click(); await p.waitForTimeout(200); console.log('info open', await m()); await (await p.$('#nowStar')).screenshot({path:'qa_info.png'}); }
 await p.setViewportSize({width:400,height:900}); await p.waitForTimeout(300); console.log('resized 400', await m());
 await b.close(); })();
