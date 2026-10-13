/* Accessibility checks (0.1.6, audit docs/audits/2026-10-mobile-a11y.md). node tests/a11y.js  (page at AION_BASE; see tests/config.js)

   1. axe-core (devDependency, pinned) at 390 and 1500 px in fresh / Lv 27 (the user's save) / Lv 45 × Basic / Advanced,
      with the Build drawer and the card "mini" panels open so their content is checked too. Fails on any violated rule
      that isn't in ALLOW below; allowed rules are still counted in the output, so they stay visible until fixed.
   2. Spoken names: no button is named "What is ?" (the "i" buttons beside section titles), no unnamed button.
   3. Reduced motion: shortly after Level up no animation is running except the toast's fade in place (rwToastFade, no
      movement), the toast spells out the gains, and SMOOTH() is "auto". Without reduced motion Level up does animate
      (so the check can see animations at all).
   4. "i" popovers: aria-expanded / aria-controls, Escape closes them and returns focus (milestone tip, card tip,
      Next up info).
   5. Hit areas (P1-3): each control with an invisible ::before / ::after hit area (HIT) is at least 24 × 24 px with it,
      and the extension never takes a point from a neighbouring control: for points just inside every control that the
      extension reaches, document.elementFromPoint is compared with the control's pseudo-elements left out of hit
      testing and with them in; a point the neighbour had and lost is a failure. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const CFG = require('./config');
const KEY = 'aion2-assassin-route-v4';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'regress.js'), 'utf8'); const buildFixture = eval('(' + src.match(/function buildFixture[\s\S]*?\n}\n/)[0] + ')');
const USER = JSON.parse(fs.readFileSync(path.join(CFG.FIX, 'fixture-user-v285.json'), 'utf8'));
let fail = 0; const ok = (n, c, d) => { console.log((c ? 'ok   ' : 'FAIL ') + n + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 700) : '')); if (!c) fail++; };
const info = (n, d) => console.log('info ' + n + (d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 700) : ''));

/* Rules still expected until they are fixed (each with the audit item that fixes it). Anything else fails. */
const ALLOW = {
  'color-contrast': 'P2-1 (0.1.7, visible): accent text, .num fill, locked dungeon names',
  'scrollable-region-focusable': 'P3-5 (0.1.7): #spSoon / #dvThen / #stSoon scroll without keyboard focus',
};

/* the controls given a hit area in 0.1.6 (src/styles/app.css, "Pointer targets of at least 24 px") and before */
const HIT = ['.tip', '.tipbtn', '#nowStar .q-cb', '#stCard .st-lvctl button', '.modeseg button', '.sec .ns-pop', '.sd-close',
  '.zone-btn', '.ms-name', '.nsinfo', '#nowStar .ns-pin', '.trk-sum',
  '#nowStar .rq-wait > summary', '.jfilt-btn', '.jfilt-x', '.dvi', '#stCard .st-chg .st-pick'];

const STATES = {
  fresh: () => null,
  lv27: () => ({ ...USER }),
  lv45: 'fixture',
};

async function load(p, state, mode) {
  await p.goto(CFG.CUR);
  if (state === 'fixture') await p.evaluate(buildFixture, { L: 45, mode, fx: 'clean' });
  else await p.evaluate(([k, s]) => { localStorage.clear(); if (s) localStorage.setItem(k, JSON.stringify(s)); }, [KEY, state && { ...state, mode }]);
  await p.reload(); await p.waitForTimeout(400);
  if (!state) await p.evaluate(m => { if (document.body.classList.contains('basic') !== (m === 'basic')) document.querySelector(`.modeseg [data-mode="${m}"]`).click(); }, mode);
  await p.waitForTimeout(150);
}

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const page = async (width, opts = {}) => { const ctx = await b.newContext({ viewport: { width, height: 1000 }, ...opts }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); return { ctx, p }; };

  /* ---------- 1. axe, 2. names, 5. hit areas ---------- */
  const seen = {};
  for (const width of [390, 1500]) for (const [sn, sf] of Object.entries(STATES)) for (const mode of ['basic', 'advanced']) {
    const id = `${sn} ${mode} ${width}px`;
    const { ctx, p } = await page(width);
    await load(p, typeof sf === 'function' ? sf() : sf, mode);
    /* open the drawer and the folded panels so what they hold is checked as well */
    await p.evaluate(() => { const d = document.getElementById('statDrawer'); if (d && !d.classList.contains('open')) document.getElementById('sdTab').click();
      document.querySelectorAll('details.mini, details.foldcard').forEach(x => { x.open = true; }); });
    await p.waitForTimeout(250);
    await p.addScriptTag({ content: AXE });
    const res = await p.evaluate(async () => { const r = await axe.run(document, { resultTypes: ['violations'] });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, first: v.nodes.slice(0, 3).map(x => x.target.join(' ')) })); });
    const bad = res.filter(v => !ALLOW[v.id]);
    ok(`axe ${id}: no violations outside the allowlist`, !bad.length, bad);
    res.filter(v => ALLOW[v.id]).forEach(v => { seen[v.id] = (seen[v.id] || 0) + v.n; });
    const names = await p.evaluate(() => [...document.querySelectorAll('button')].map(x => ({ n: (x.getAttribute('aria-label') || x.textContent || x.title || '').replace(/\s+/g, ' ').trim(), c: x.className })));
    ok(`names ${id}: no "What is ?" button, every button named`, !names.some(x => /What is\s*\?/.test(x.n)) && names.every(x => x.n), names.filter(x => !x.n || /What is\s*\?/.test(x.n)));
    if (mode === 'advanced' || width === 390) {
      await p.addStyleTag({ content: '.a11y-nohit::before, .a11y-nohit::after { pointer-events: none !important; } #stCard .st-chg .st-pick.a11y-nohit { inset: 0 !important; width: 100% !important; height: 100% !important; }' });
      const hit = await p.evaluate(async HIT => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
        const ext = e => { /* the control's box grown by its hit-area pseudo-element (the larger of ::before / ::after) */
          const r = e.getBoundingClientRect(); let o = { l: r.left, t: r.top, r: r.right, b: r.bottom };
          for (const ps of ['::before', '::after']) { const cs = getComputedStyle(e, ps); if (cs.content === 'none' || cs.position !== 'absolute') continue;
            const px = v => /px$/.test(v) ? parseFloat(v) : 0;
            o = { l: Math.min(o.l, r.left + px(cs.left)), t: Math.min(o.t, r.top + px(cs.top)), r: Math.max(o.r, r.right - px(cs.right)), b: Math.max(o.b, r.bottom - px(cs.bottom)) }; }
          if (e.matches('#stCard .st-chg .st-pick')) o = { l: r.left, t: r.top, r: r.right, b: r.bottom };
          return o; };
        const CTL = 'button, a[href], input:not([type=hidden]), select, summary, label, [tabindex="0"]';
        const small = [], steal = [];
        const els = [...new Set(HIT.flatMap(s => [...document.querySelectorAll(s)]))].filter(vis);
        for (const e of els) {
          e.scrollIntoView({ block: 'center', inline: 'nearest' });
          const x = ext(e), w = x.r - x.l, h = x.b - x.t;
          const desc = el => (el.parentElement ? (el.parentElement.id ? '#' + el.parentElement.id : el.parentElement.classList[0] ? '.' + el.parentElement.classList[0] : el.parentElement.tagName.toLowerCase()) + ' > ' : '') + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '');
          /* inline links / summaries in running text and the sliver Build tab are out of scope (see docs) */
          if (Math.round(w) < 24 || Math.round(h) < 24) small.push(`${desc(e)} ${Math.round(w)}x${Math.round(h)}`);
          const near = [...document.querySelectorAll(CTL)].filter(n => n !== e && !n.contains(e) && !e.contains(n) && vis(n) && !(n.tagName === 'LABEL' && n.contains(e)) && !(e.tagName === 'LABEL' && e.contains(n)))
            .filter(n => { const r = n.getBoundingClientRect(); return r.left < x.r && r.right > x.l && r.top < x.b && r.bottom > x.t; });
          for (const n of near) {
            const r = n.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
            for (const [px, py] of [[cx, cy], [r.left + 1.5, cy], [r.right - 1.5, cy], [cx, r.top + 1.5], [cx, r.bottom - 1.5]]) {
              if (px < x.l || px > x.r || py < x.t || py > x.b) continue; /* only points the extension could reach */
              /* the same point with the control's pseudo-elements left out of hit testing: a steal is a point the
                 neighbour gets without the extension and loses with it */
              e.classList.add('a11y-nohit'); const before = document.elementFromPoint(px, py); e.classList.remove('a11y-nohit');
              const after = document.elementFromPoint(px, py);
              if (before && n.contains(before) && after && !n.contains(after) && (after === e || e.contains(after))) steal.push(`${desc(e)} takes ${desc(n)} at ${Math.round(px - r.left)},${Math.round(py - r.top)}`);
            }
          }
        }
        return { n: els.length, small: [...new Set(small)], steal: [...new Set(steal)] };
      }, HIT);
      ok(`hit areas ${id}: ${hit.n} controls at least 24 x 24 px`, !hit.small.length, hit.small);
      ok(`hit areas ${id}: no control's hit area takes a point of a neighbour`, !hit.steal.length, hit.steal);
    }
    await ctx.close();
  }
  info('allowed axe rules still violated (node count over all runs)', seen);

  /* ---------- 3. reduced motion ---------- */
  for (const motion of ['reduce', 'no-preference']) {
    const { ctx, p } = await page(1500, { reducedMotion: motion });
    await load(p, { ...USER }, 'advanced');
    await p.click('#lvlUpBig'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ anims: document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName || a.constructor.name),
      toast: (document.getElementById('rwToast') || {}).textContent || '', smooth: SMOOTH(), lv: state.level }));
    if (motion === 'reduce') {
      ok('reduced motion: nothing moves after Level up (only the toast fades in place)', r.anims.every(a => a === 'rwToastFade') && r.anims.length === 1, r);
      ok('reduced motion: the toast spells out the Level up gains', /Lv 28/.test(r.toast) && /skill pts/.test(r.toast), r);
      ok('reduced motion: script scrolls are instant (SMOOTH() = "auto")', r.smooth === 'auto', r);
      await p.waitForTimeout(2800);
      const left = await p.evaluate(() => ({ html: document.getElementById('rwToast').innerHTML, show: document.getElementById('rwToast').classList.contains('show') }));
      ok('reduced motion: the toast still clears on animationend', left.html === '', left);
    } else {
      ok('motion allowed: Level up animates (the check above can see animations)', r.anims.some(a => /lvlpop|lvlpulse|lvlspark|lvlfloat/.test(a)) && r.smooth === 'smooth' && !/Lv 28/.test(r.toast), r);
    }
    await ctx.close();
  }

  /* ---------- 4. "i" popovers and Escape ---------- */
  {
    const { ctx, p } = await page(1500);
    await load(p, { ...USER }, 'advanced');
    /* milestone tip (T()): opens a tip box below its row */
    const tip = await p.evaluateHandle(() => [...document.querySelectorAll('#gates .tip, #areaList .tip')].find(x => x.getBoundingClientRect().width));
    ok('popover: a milestone / section "i" is visible', !!(await tip.evaluate(x => !!x)));
    await tip.evaluate(x => x.scrollIntoView({ block: 'center' })); await tip.click();
    let r = await tip.evaluate(x => ({ exp: x.getAttribute('aria-expanded'), ctl: x.getAttribute('aria-controls'), box: !!document.getElementById(x.getAttribute('aria-controls') || '-') }));
    ok('popover: the "i" sets aria-expanded and aria-controls points at the open tip', r.exp === 'true' && r.box, r);
    await p.keyboard.press('Escape'); await p.waitForTimeout(50);
    r = await tip.evaluate(x => ({ exp: x.getAttribute('aria-expanded'), boxes: document.querySelectorAll('li.tipbox').length, focus: document.activeElement === x }));
    ok('popover: Escape closes the tip and focus returns to its button', r.exp === 'false' && !r.boxes && r.focus, r);
    /* card tip (.tipwrap): shown beside a "need more" status; Lv 35 with 10 crystals leaves the Daevanion card short */
    await load(p, { ...USER, level: 35, stones: 0, dvTotal: 10 }, 'advanced');
    await p.evaluate(() => { const w = document.querySelector('.tipwrap .tipbtn'); if (w) w.scrollIntoView({ block: 'center' }); });
    const tb = await p.$('.tipwrap .tipbtn');
    ok('popover: a card "i" is shown (Daevanion short of crystals)', !!(tb && await tb.isVisible()));
    if (tb && await tb.isVisible()) {
      await tb.click();
      r = await tb.evaluate(x => ({ open: x.parentElement.classList.contains('open'), exp: x.getAttribute('aria-expanded'), pop: !!document.getElementById(x.getAttribute('aria-controls') || '-') }));
      ok('popover: card "i" opens with aria-expanded and a controlled popover', r.open && r.exp === 'true' && r.pop, r);
      await p.keyboard.press('Escape'); await p.waitForTimeout(50);
      r = await tb.evaluate(x => ({ open: x.parentElement.classList.contains('open'), exp: x.getAttribute('aria-expanded'), focus: document.activeElement === x }));
      ok('popover: Escape closes the card popover', !r.open && r.exp === 'false' && r.focus, r);
    }
    await load(p, { ...USER }, 'advanced');
    const nb = await p.$('#nowStar .nsinfo');
    ok('popover: a Next up "i" is shown (Lv 27 save)', !!(nb && await nb.isVisible()));
    if (nb && await nb.isVisible()) {
      await nb.click();
      r = await nb.evaluate(x => ({ show: !!x.closest('.show-info'), exp: x.getAttribute('aria-expanded'), ctl: !!document.getElementById(x.getAttribute('aria-controls') || '-') }));
      ok('popover: Next up "i" shows its info with aria-expanded / aria-controls', r.show && r.exp === 'true' && r.ctl, r);
      await p.keyboard.press('Escape'); await p.waitForTimeout(50);
      r = await nb.evaluate(x => ({ show: !!x.closest('.show-info'), exp: x.getAttribute('aria-expanded') }));
      ok('popover: Escape hides the Next up info', !r.show && r.exp === 'false', r);
    }
    await ctx.close();
  }

  ok('no page errors', !errs.length, errs);
  console.log(fail ? `A11Y CHECKS FAILED (${fail})` : 'A11Y CHECKS PASSED'); await b.close(); process.exit(fail ? 1 : 0);
})();
