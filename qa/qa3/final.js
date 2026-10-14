const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); await p.goto('file://' + ROOT + '/qa-cur.html');
  const st = fs.readFileSync(path.join(__dirname, process.argv[2] || 'journey-state.json'), 'utf8'); await p.evaluate(s => localStorage.setItem('aion2-assassin-route-v4', s), st); await p.reload(); await p.waitForTimeout(600);
  console.log(JSON.stringify(await p.evaluate(() => {
    const open = []; GATES.forEach(g => g.items.forEach((it, j) => { if (!it.k || it.hidden || it.sub) return; if (state.checks[it.k]) return; open.push(`${g.id}(${g.lv}) ${it.k} ${it.kind || ''} ${it.opt ? 'OPT' : ''}${it.adv ? 'ADV' : ''} :: ${(it.ns || it.t || it.name || (it.q && it.q.name) || '').toString().replace(/<[^>]+>/g, '').slice(0, 90)}${it.kind === 'quest' ? ' avail=' + JSON.stringify(rqAvail(it.q, state.level)) : ''}`); }));
    const tags = [...document.querySelectorAll('#gates details.step')].map(d => d.id + ':' + ((d.querySelector('.tag, .gtag, .state') || {}).innerText || '') + ':' + (d.hidden ? 'H' : '')).join(' ');
    return { lv: state.level, quest: state.quest, storyEnd: state.storyEnd, open, tags, cards: [...document.querySelectorAll('#nsqWrap > .ns-card, #nowStar .ns-card')].map(c => c.innerText.replace(/\s+/g, ' ').slice(0, 200)), ring: document.getElementById('progRows').innerText.replace(/\s+/g, ' ') };
  }), null, 1));
  await p.screenshot({ path: path.join(__dirname, 'shots', 'final-45.png') }); await b.close(); })();
