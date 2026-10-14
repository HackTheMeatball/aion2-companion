const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), KEY = 'aion2-assassin-route-v4', OUT = __dirname;
async function open(width = 1500, opts = {}) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width, height: 1000 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const user = fs.readFileSync(path.join(ROOT, 'polish/qa/fixture-user-v285.json'), 'utf8');
  await p.goto('file://' + ROOT + '/qa-v285.html'); await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, user]); await p.reload(); await p.waitForTimeout(400);
  if (!opts.stayV285) { await p.goto('file://' + ROOT + '/qa-cur.html'); await p.waitForTimeout(600); }
  return { b, p, errs };
}
const dump = p => p.evaluate(() => {
  const t = e => e && e.innerText != null ? e.innerText.replace(/\s+/g, ' ').trim() : '';
  return {
    level: state.level, quest: state.quest,
    cards: [...document.querySelectorAll('#nsqWrap > .ns-card')].map(c => ({ h: t(c.querySelector('h3')), p: t(c.querySelector('.title > p')), meta: t(c.querySelector('.meta')), btns: [...c.querySelectorAll('button')].filter(x => x.offsetParent).map(x => t(x) || x.getAttribute('aria-label') || x.title), all: t(c).slice(0, 600) })),
    sp: t(document.getElementById('spCard')).slice(0, 500), dv: t(document.getElementById('dvBox') || document.getElementById('dvNextList')).slice(0, 500), st: t(document.getElementById('stCard')).slice(0, 600),
    prog: t(document.getElementById('progRows')), ring: t(document.getElementById('ringTxt')), qs: t(document.getElementById('questStatus')), subs: t(document.getElementById('questSubs')).slice(0, 600), ahead: t(document.getElementById('ahead')).slice(0, 400)
  };
});
module.exports = { open, dump, ROOT, KEY, OUT };
