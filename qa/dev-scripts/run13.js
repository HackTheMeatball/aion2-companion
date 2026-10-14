const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 // simulate the user's old state
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.dvTotal=28; s.dvCost={"dv:hg":9}; s.checks["dv:hg"]=true; s.dvPts=18; delete s.dvReset1; s.level=16; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 console.log(await p.evaluate(() => [document.getElementById('dvIn').value, document.getElementById('dvRemain').innerText, document.querySelector('#dvNextList .txt').innerText.replace(/\n/g,' / '), Object.keys(state.checks).filter(k=>k.startsWith('dv:')).length]));
 await b.close(); })();
