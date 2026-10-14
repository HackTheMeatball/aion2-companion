const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:1400}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.hide=true; s.areaLv="10"; AREA_ITEMS.filter(x=>x.lv===10&&x.area==="Dredgion Crash Site").forEach(x=>s.checks[x.k]=true); delete s.regionOpen; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(300);
 const vis = () => p.evaluate(() => [...document.querySelectorAll('#areaList li.item')].filter(l=>!l.hidden).length);
 console.log('before', await vis()); await p.click('[data-region="10|Dredgion Crash Site"]'); await p.waitForTimeout(150); console.log('after', await vis());
 await b.close(); })();
