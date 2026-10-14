const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 const p = await b.newPage({viewport:{width:340,height:1600}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.areaLv="sh"; Object.keys(s.checks).filter(k=>k.startsWith('sh:')).forEach(k=>delete s.checks[k]); s.hideDone=true; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 const ticked = () => p.evaluate(()=>Object.keys(state.checks).filter(k=>k.startsWith('sh:')&&state.checks[k]));
 const y0 = await p.$eval('[data-k="sh:rubek-thieves-occupied-territory"]', e=>e.getBoundingClientRect().top);
 await p.click('[data-k="sh:graverobber-den"]'); await p.waitForTimeout(200);
 const y1 = await p.$eval('[data-k="sh:rubek-thieves-occupied-territory"]', e=>e.getBoundingClientRect().top);
 console.log('shift', y1-y0);
 await p.click('[data-k="sh:rubek-thieves-occupied-territory"]'); await p.waitForTimeout(200);
 console.log(await ticked(), await p.textContent('#collSh'));
 const el = await p.$('#areas'); await el.screenshot({path:'sh3.png'});
 // dungeon band: finish a region and check it stays open
 await p.selectOption('#areaSel', await p.evaluate(()=>String(AREA_BANDS[0]))); await p.waitForTimeout(200);
 const info = await p.evaluate(()=>{ const li=[...document.querySelectorAll('#areaList .region-h')].find(h=>!h.classList.contains('done')); return li.querySelector('button').dataset.region; });
 const boxes = await p.evaluate(rk=>{ let out=[], n=document.querySelector(`[data-region="${rk}"]`).closest('li').nextElementSibling; while(n && !n.classList.contains('region-h')){ const i=n.querySelector('input[data-k]'); if(i&&!i.checked) out.push(i.dataset.k); n=n.nextElementSibling;} return out;}, info);
 for (const k of boxes) { await p.click(`[data-k="${k}"]`); await p.waitForTimeout(150); }
 console.log('region', info, 'expanded after finish:', await p.$eval(`[data-region="${info}"]`, e=>e.getAttribute('aria-expanded')));
 await b.close(); })();
