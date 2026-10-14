const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.cwd() + '/test-icons.html'); await p.waitForTimeout(300);
 const info = await p.evaluate(() => { const out=[]; const names={}; GATES.forEach(g=>g.items.forEach((it,j)=>{ if(it.kind==='quest'){ const k=it.k||g.id+':'+j; out.push([g.lv,g.id,k,it.name,!!it.opt,!!it.hidden,!!QUEST_ID[it.name]]); names[it.name]=(names[it.name]||0)+1; }})); return {out, dup:Object.entries(names).filter(([n,c])=>c>1), keys:Object.keys(state)}; });
 console.log(JSON.stringify(info.dup), info.keys.join(','));
 info.out.forEach(r=>console.log(r.join(' | ')));
 await b.close(); })();
