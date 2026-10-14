const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:2400}});
 await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
 const el = await p.$('#areas'); const bb = await el.boundingBox();
 await p.screenshot({path:'hideclr.png', clip:{x:bb.x-10,y:bb.y-10,width:bb.width+20,height:260}});
 await b.close(); })();
