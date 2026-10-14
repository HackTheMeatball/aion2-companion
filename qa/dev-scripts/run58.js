const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror', e => console.log('ERR', e.message));
 await p.goto('file://' + process.argv[2]);
 const set = (lv, done) => p.evaluate(([lv,done]) => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=lv; s.dvTotal=4*(lv-11)+8; Object.keys(s.checks).filter(x=>x.startsWith('dv:')).forEach(x=>delete s.checks[x]); DV_NODES().slice(0,done).forEach(n=>s.checks[n.k]=true); localStorage.setItem(k, JSON.stringify(s)); }, [lv,done]);
 for (const [lv,done,name] of [[18,6,'mid'],[18,8,'locked'],[20,8,'new']]) { await set(lv,done); await p.reload(); await p.waitForTimeout(400); await (await p.$('#dvBox')).screenshot({path:`board-${name}.png`}); }
 await b.close(); })();
