const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const w of [1280, 340]) {
 const p = await b.newPage({viewport:{width:w,height:1600}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.areaLv="10"; AREA_ITEMS.filter(x=>x.lv===10).slice(0,2).forEach(x=>s.checks[x.k]=true); s.checks["sh:graverobber-den"]=true; s.checks["sh:rubek-thieves-occupied-territory"]=true; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 if (w===1280) {
  console.log(await p.$eval('#areaSel', e=>[...e.options].map(o=>o.textContent).join(' | ')));
  console.log(await p.evaluate(()=>AREA_ITEMS.filter(x=>x.it.kind==='stronghold').map(x=>x.it.name+'→'+x.band).join(', ')));
  const keys = await p.$$eval('#areaList input[data-k]', es=>es.map(e=>e.dataset.k));
  const y0 = await p.$eval(`[data-k="${keys[keys.length-1]}"]`, e=>e.getBoundingClientRect().top);
  await p.click(`[data-k="${keys[0]}"]`); await p.waitForTimeout(200);
  const y1 = await p.$eval(`[data-k="${keys[keys.length-1]}"]`, e=>e.getBoundingClientRect().top);
  console.log('shift', y1-y0, 'collSh', await p.textContent('#collSh'));
  await p.click(`[data-k="${keys[0]}"]`); await p.waitForTimeout(200);
 }
 await (await p.$('#areas')).screenshot({path:`ar${w}.png`});
 await p.close(); }
 await b.close(); })();
