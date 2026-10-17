const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const CFG = require('./config'); const ROOT = CFG.ROOT, OUT = path.join(CFG.OUT, 'journey');
const { SAVE_KEY: KEY, writeSave, flatFixture } = require('./support/save');
/* the current page with the user's v285 save, as it stored it after loading it through v285 first
   (tests/fixtures/fixture-user-v285.via-v285.flat.json) */
async function open(width = 1500) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width, height: 1000 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(CFG.CUR); await writeSave(p, flatFixture('fixture-user-v285.via-v285.flat.json')); await p.reload(); await p.waitForTimeout(600);
  return { b, p, errs };
}
const dump = p => p.evaluate(() => {
  const t = e => e && e.innerText != null ? e.innerText.replace(/\s+/g, ' ').trim() : '';
  return {
    level: char(state).level, quest: char(state).quest,
    cards: [...document.querySelectorAll('#nsqWrap > .ns-card')].map(c => ({ h: t(c.querySelector('h3')), p: t(c.querySelector('.title > p')), meta: t(c.querySelector('.meta')), btns: [...c.querySelectorAll('button')].filter(x => x.offsetParent).map(x => t(x) || x.getAttribute('aria-label') || x.title), all: t(c).slice(0, 600) })),
    sp: t(document.getElementById('spCard')).slice(0, 500), dv: t(document.getElementById('dvBox') || document.getElementById('dvNextList')).slice(0, 500), st: t(document.getElementById('stCard')).slice(0, 600),
    prog: t(document.getElementById('progRows')), ring: t(document.getElementById('ringTxt')), qs: t(document.getElementById('questStatus')), subs: t(document.getElementById('questSubs')).slice(0, 600), ahead: t(document.getElementById('ahead')).slice(0, 400)
  };
});
module.exports = { open, dump, ROOT, KEY, OUT };
