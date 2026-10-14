const { chromium } = require('playwright');
const W=+process.argv[2]||1280;
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:W,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.cwd() + '/test-icons.html'); await p.waitForTimeout(300);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k));
   s.mode='advanced'; s.level=22; s.quest=(QUESTS.filter(q=>q[0]<=22).pop())[1]; s.started={'g22:3':1}; s.pendSt=0; s.pendCr=0; s.dvTotal=0;
   GATES.forEach(g=>{ if(g.lv<22) g.items.forEach((it,j)=>{ s.checks[it.k||g.id+':'+j]=true; }); }); SP_STEPS.forEach(x=>s.checks[x.k]=true);
   localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(600);
 const m = () => p.evaluate(() => { const st=document.querySelector('#nsqWrap'); const f=st.querySelector('.ns-card'); return {stackH: st.offsetHeight, styleH: st.style.height, firstH: f.offsetHeight, first: f.querySelector('h3').textContent.slice(0,40), firstCls: f.className, scrollTop: st.scrollTop, focus: document.activeElement && (document.activeElement.className+' '+document.activeElement.textContent.slice(0,20))}; });
 console.log('init', await m());
 // rq card screenshot
 await p.evaluate(()=>{const c=document.querySelector('#nowStar .ns-card:has(.ns-qgrid)'); c.parentElement.style.height='auto';});
 await (await p.$('#nowStar .ns-card:has(.ns-qgrid)')).screenshot({path:`qa_rq_${W}.png`});
 await p.reload(); await p.waitForTimeout(600);
 // complete top two (unlock steps) -> story card becomes first
 for (let i=0;i<2;i++){ await p.click('#nowStar .ns-card.first button.ns-btn'); await p.waitForTimeout(150); console.log('mid', await m()); await p.waitForTimeout(700); console.log('after', i, await m()); }
 // story card: info toggle / objectives; check story card fits
 // Tab order: focus primary button and press Tab several times
 await p.focus('#nowStar .ns-card.first button, #nowStar .ns-card.first input');
 for (let i=0;i<6;i++){ await p.keyboard.press('Tab'); const r=await p.evaluate(()=>{const a=document.activeElement; const st=document.querySelector('#nsqWrap'); const c=a.closest('.ns-card'); const rc=a.getBoundingClientRect(), rs=st.getBoundingClientRect(); return (a.tagName+' '+a.textContent.slice(0,25)).trim()+' inCard='+(c&&[...st.children].indexOf(c))+' visible='+(rc.top>=rs.top&&rc.bottom<=rs.bottom)+' scrollTop='+st.scrollTop;}); console.log('tab',r); }
 // Stronghold info toggle in stack
 await b.close(); })();
