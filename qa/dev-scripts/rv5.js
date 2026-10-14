const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1500,height:900}}); const p = await ctx.newPage();
 p.on('pageerror', e => console.log('PAGEERR', e.message));
 await p.addInitScript(() => { window.documentPictureInPicture = { requestWindow: async (o) => window.open('about:blank','', 'width=400,height=280') }; });
 await p.goto('file://' + process.argv[2]);
 const seedClean = async (lv, q, extra={}) => { await p.evaluate(([lv,q,extra]) => { localStorage.setItem('aion2-assassin-route-v4', JSON.stringify({level:lv, quest:q, mode:'advanced'})); }, [lv,q,extra]); await p.reload(); await p.waitForTimeout(300);
   await p.evaluate(([lv,extra]) => { SP_STEPS.forEach(x => { if (x.req <= lv) state.checks[x.k] = true; }); GATES.forEach(g => { if (g.lv <= lv) g.items.forEach((it,j) => { if (it.kind !== 'quest') state.checks[it.k || g.id+':'+j] = true; }); }); Object.assign(state, extra); save(); }, [lv,extra]); await p.reload(); await p.waitForTimeout(400); };
 const cards = async (pg) => (await pg.$$eval('#nowStar .ns-card', cs=>cs.map(c=>(c.querySelector('h3').innerText+' | '+((c.querySelector('.title p')||{}).innerText||'')+' | '+((c.querySelector('.meta')||{}).innerText||'')).replace(/\s+/g,' '))));
 for (const [lv,q] of [[32,'Eye of the Red Tower'],[23,'Disturbed Balance'],[40,'Healing Herbs'],[19,'Broken Fang']]) { await seedClean(lv,q); console.log('\n==',lv,q); (await cards(p)).forEach(c=>console.log(' ',c)); }
 // Show button target vs pick
 await seedClean(40,'Healing Herbs');
 const sd = await p.$('#nowStar [data-now^="areas:"]'); console.log('sd show act', await sd.getAttribute('data-now'));
 await sd.click(); await p.waitForTimeout(800);
 console.log('after show: areaLv', await p.evaluate(()=>state.areaLv), 'Spider visible?', await p.evaluate(()=>{const e=[...document.querySelectorAll('#main *')].find(x=>x.children.length===0&&/Spider Cave/.test(x.textContent)&&x.offsetParent); return !!e;}));
 // hotkeys on main with story on top
 await seedClean(23,'Disturbed Balance'); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(200);
 const box = await p.$eval('#nowStar .ns-card.first', e=>{const r=e.getBoundingClientRect(); return [r.x+r.width/2, r.y+10, scrollY];});
 console.log('box', box, 'top', (await cards(p))[0]);
 await p.mouse.move(box[0], box[1]); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(600);
 console.log('Arrow scrollTop', await p.$eval('#nsqWrap', w=>w.scrollTop), 'pageY', await p.evaluate(()=>scrollY));
 await p.keyboard.press('ArrowUp'); await p.waitForTimeout(600);
 await p.keyboard.press('Enter'); await p.waitForTimeout(900);
 console.log('Enter story ->', await p.evaluate(()=>[state.level,state.quest]), (await cards(p))[0]);
 // story on top in pip at 400x280
 await seedClean(23,'Disturbed Balance');
 const [pip] = await Promise.all([ctx.waitForEvent('page'), p.click('#nowStar [data-nspop]')]);
 await pip.setViewportSize({width:400,height:280}); await p.evaluate(()=>update()); await pip.waitForTimeout(500);
 await pip.screenshot({path:'rv-pip-story.png'});
 console.log('pip story', await pip.evaluate(()=>{const w=document.querySelector('#nsqWrap'); return {w:w.offsetHeight, card:w.querySelector('.ns-card').offsetHeight, doc:document.documentElement.scrollHeight, docW: document.documentElement.scrollWidth};}));
 await pip.close();
 // layout 400
 await p.setViewportSize({width:400,height:900}); await seedClean(23,'Disturbed Balance'); 
 console.log('400 overflow', await p.evaluate(()=>document.documentElement.scrollWidth));
 const el = await p.$('#nowStar'); await el.screenshot({path:'rv-400.png'});
 await p.setViewportSize({width:1500,height:900}); await p.reload(); await p.waitForTimeout(400); await (await p.$('#nowStar')).screenshot({path:'rv-1500.png'});
 await b.close(); })();
