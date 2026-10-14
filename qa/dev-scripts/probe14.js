const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1100}});
 p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log('CON', m.text()));
 await p.goto('file://' + process.argv[2]);
 await p.evaluate(() => { const k='aion2-assassin-route-v4'; const s=JSON.parse(localStorage.getItem(k)); s.level=19; s.quest="A New Lead"; localStorage.setItem(k, JSON.stringify(s)); });
 await p.reload(); await p.waitForTimeout(400);
 await p.evaluate(()=>{ document.getElementById('questSubs').addEventListener('change', e=>console.log('got change', e.target.dataset.qs, typeof state, state && state.quest)); const cb=document.querySelector('[data-qs="0"]'); cb.click(); console.log('checked', cb.checked, JSON.stringify(state.qsteps)); });
 await b.close(); })();
