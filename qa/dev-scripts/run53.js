const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1200}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=18; s.areaLv="10"; s.areasCollapsed=false; s.areaDone=true; delete s.zoneOpen; AREA_ITEMS.filter(x=>x.lv===10).forEach(x=>delete s.checks[x.k]); AREA_ITEMS.filter(x=>x.lv===10&&x.area==="Dredgion Crash Site").forEach(x=>s.checks[x.k]=true); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 const zones = () => p.$$eval('#areaList .zone-btn', es=>es.map(e=>e.textContent+':'+e.getAttribute('aria-expanded')).join(' | '));
 console.log(await zones());
 const ks = await p.evaluate(()=>AREA_ITEMS.filter(x=>x.lv===10&&x.area==="Calderon Canyon").map(x=>x.k));
 for (const k of ks) { await p.click(`[data-k="${k}"]`); await p.waitForTimeout(100); }
 console.log('right after:', await zones());
 await p.waitForTimeout(900); console.log('after delay:', await zones());
 await p.click('[data-zone="10|Dredgion Crash Site"]'); await p.waitForTimeout(200); console.log('clicked:', await zones());
 await p.evaluate(()=>document.getElementById('areas').scrollIntoView()); await p.waitForTimeout(200);
 const r = await (await p.$('#areas')).boundingBox();
 await p.screenshot({path:'zones.png', clip:{x:r.x-10,y:Math.max(0,r.y),width:r.width+20,height:Math.min(900,r.height)}});
 await b.close(); })();
