const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=19; s.quest="A New Lead"; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(500);
 console.log(await p.$eval('.ns-after', e=>e.innerText.replace(/\n/g,' | ')), await p.$$eval('.ns-chipbar span', es=>es.map(e=>e.style.width).join(',')));
 await (await p.$('#nowStar')).screenshot({path:'chips.png'});
 await b.close(); })();
