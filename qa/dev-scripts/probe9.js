const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:2400}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>AREA_ITEMS.filter(x=>x.it.kind==='stronghold').map(x=>x.it.name+'→'+x.band).join(', ')));
 for (const v of ['10','15','20','25','30','35','40','sh']) {
  await p.selectOption('#areaSel', v); await p.waitForTimeout(150);
  console.log(v, await p.evaluate(()=>{ const secs=[...document.querySelectorAll('#areaList .asec')].map(s=>s.innerText.replace(/\n/g,' ')); const sh=[...document.querySelectorAll('#areaList li.item')].filter(li=>!li.classList.contains('grouped')).map(li=>li.querySelector('b').textContent); return secs.join(' / ')+' || SH rows: '+sh.join(', '); }));
 }
 await b.close(); })();
