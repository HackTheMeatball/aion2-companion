const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const [w,mode] of [[1440,'one'],[1440,'many'],[420,'one']]) { const p = await b.newPage({viewport:{width:w,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate((mode) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=18; s.quest="A New Lead"; s.hide=true; s.hideCards=true;
   if (mode==='one') { s.stones=0; SP_STEPS.filter(x=>x.req<=18).forEach(x=>s.checks[x.k]=true); GATES.forEach(g=>g.items.forEach((it,j)=>{ if(g.lv<=19) s.checks[it.k||g.id+':'+j]=true; })); DV_NODES().slice(0,8).forEach(n=>s.checks[n.k]=true); s.dvTotal=40; } else { s.dvTotal=66; }
   localStorage.setItem(k, JSON.stringify(s)); }, mode);
 await p.reload(); await p.waitForTimeout(500);
 const hb = await (await p.$('header.top')).boundingBox();
 await p.screenshot({path:`hdr-${w}-${mode}.png`, clip:{x:0,y:0,width:w,height:Math.min(900,hb.y+hb.height+16)}}); await p.close(); }
 await b.close(); })();
