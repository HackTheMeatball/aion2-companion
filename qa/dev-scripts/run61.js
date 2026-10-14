const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const w of [1440, 1100, 420]) { const p = await b.newPage({viewport:{width:w,height:900}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=18; s.quest="A New Lead"; s.stones=8; s.dvTotal=66; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(500);
 const hb = await (await p.$('header.top')).boundingBox(); console.log(w, 'header h', Math.round(hb.height));
 await p.screenshot({path:`hdr${w}.png`, clip:{x:0,y:0,width:w,height:Math.min(900, hb.y+hb.height+20)}}); await p.close(); }
 await b.close(); })();
