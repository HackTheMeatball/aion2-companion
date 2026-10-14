const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=17; s.hideCards=false; GATES.slice(0,3).forEach(g=>g.items.forEach((it,j)=>{s.checks[it.k||g.id+':'+j]=true;})); localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(300);
 const n = () => p.evaluate(() => [document.querySelectorAll('#track li').length, [...document.querySelectorAll('details.step')].filter(d=>d.hidden).length]);
 console.log('off', await n()); await p.click('#btnHideCards'); await p.waitForTimeout(100); console.log('on', await n());
 await b.close(); })();
