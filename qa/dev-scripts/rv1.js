const { chromium } = require('playwright');
const file = process.argv[2];
const S = [[12,'Veiled Truth'],[18,'A New Lead'],[20,'Crossroad'],[23,'Disturbed Balance'],[26,'The High Priest Slumbers'],[30,'Dying Light'],[33,'Last Refuge'],[36,'Creion of Gribade'],[40,'Healing Herbs'],[15,'Imminent Threat'],[28,'Land of Rifts']];
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1500,height:900}});
 p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
 await p.goto('file://' + file);
 for (const mode of ['basic','advanced']) for (const [lv,q] of S) {
  await p.evaluate(([lv,q,mode]) => localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:lv, quest:q, mode})), [lv,q,mode]);
  await p.reload(); await p.waitForTimeout(300);
  const cards = await p.$$eval('#nowStar .ns-card', cs => cs.map(c => (c.querySelector('h3')||{}).innerText + ' || ' + ((c.querySelector('.title p')||{}).innerText||'') + ' || ' + ((c.querySelector('.meta')||{}).innerText||'') + ((c.querySelector('.ns-info')||{}).textContent ? ' || INFO '+c.querySelector('.ns-info').textContent : '')));
  console.log(`\n== ${mode} Lv${lv} ${q}`); cards.forEach((c,i)=>console.log(i, c.replace(/\n/g,' ')));
  const bad = await p.$eval('#nowStar', e => /undefined|null|NaN/.test(e.innerHTML)); if (bad) console.log('BAD TEXT');
 }
 await b.close(); })();
