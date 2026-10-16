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
      testing and with them in; a point the neighbour had and lost is a failure.
   6. Touch (0.1.9, P1-4 / P3-1; 390 px with touch emulation, fresh / Lv 20 / Lv 27 / Lv 45 × Basic / Advanced,
      drawer and panels open): every text field and select at 16 px or more (iPhone Safari zooms below that) and the big number
      fields (BIGNUM) still at 18 px, the primary buttons (PRIMARY) at least 44 px tall, no text under 11 px (mono) /
      12 px (body) except the icon glyphs in GLYPH.
   7. Story connector (P2-4): on a fresh save no connector line is drawn above the first story row.
   8. Page zoom (P2-9): at 260 px (150 % zoom on a 390 px phone) the page doesn't scroll sideways.
   9. Folded cleared steps (P3-2, 390 px, Lv 27 and Lv 45): in every ticked milestone step the warnings (.note) and the
      location / "Reward:" line (.loc) are visible, and every link or button in the step is either out of the layout
      (display: none, so not focusable) or visible inside its row: nothing hidden can take keyboard focus.
  10. Derived rows (0.3 E4, 390 / 1500 px × Basic / Advanced): a row done in the story (byStory, wrapper, regional
      follow-up) is a ticked, disabled box named "<row>: done in the story" with that tooltip, axe-clean; the same rows
      in both modes; moving the story back shows the stored false again (box enabled, save untouched).
  11. Ascension bar (0.3 E8, same saves as 10): shown in Basic and Advanced, a progressbar named "Ascension" with its value
      (aria-valuenow / max / valuetext), the same label in both modes, axe-clean. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const CFG = require('./config');
const KEY = 'aion2-assassin-route-v4';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const { buildFixture } = require('./support/regress-fixture');
const USER = JSON.parse(fs.readFileSync(path.join(CFG.FIX, 'fixture-user-v285.json'), 'utf8'));
let fail = 0; const ok = (n, c, d) => { console.log((c ? 'ok   ' : 'FAIL ') + n + (!c && d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 700) : '')); if (!c) fail++; };
const info = (n, d) => console.log('info ' + n + (d !== undefined ? '  · ' + JSON.stringify(d).slice(0, 700) : ''));

/* Rules still expected until they are fixed (each with the audit item that fixes it). Anything else fails. */
const ALLOW = {
  'scrollable-region-focusable': 'P3-5 (0.1.7): #spSoon / #dvThen / #stSoon scroll without keyboard focus',
};

/* the controls given a hit area in 0.1.6 (src/styles/app.css, "Pointer targets of at least 24 px") and before */
const HIT = ['.tip', '.tipbtn', '#nowStar .q-cb', '#stCard .st-lvctl button', '.modeseg button', '.sec .ns-pop', '.sd-close',
  '.zone-btn', '.ms-name', '.nsinfo', '#nowStar .ns-pin', '.trk-sum',
  '#nowStar .rq-wait > summary', '.jfilt-btn', '.jfilt-x', '.dvi', '#stCard .st-chg .st-pick'];

/* touch: the primary buttons that get 44 px, and the glyphs in fixed boxes that keep their size (icons, not text) */
const PRIMARY = '.lvlup-btn, .ns-btn.primary, #nowStar .ns-card .ns-go, .dvbuy';
const GLYPH = '.tip, .tipbtn, .dvi, .nsinfo, .zchev, .cstep-b button, .spmini.ini, .st-mini.ini, .filt-n';
const BIGNUM = ['lvlNum', 'spPts', 'dvIn', 'stShards'];

const STATES = {
  fresh: () => null,
  lv27: () => ({ ...USER }),
  lv45: 'fixture',
};

async function load(p, state, mode) {
  await p.goto(CFG.CUR);
  if (state === 'fixture' || state === 'fixture20') await p.evaluate(buildFixture, { L: state === 'fixture' ? 45 : 20, mode, fx: 'clean' });
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

  /* ---------- 6. touch: field sizes, primary buttons, minimum text; 7. story connector ---------- */
  /* Lv 20 (generated) adds the Daevanion cost column, "open" board rows and "+N more" objectives */
  for (const sn of ['fresh', 'lv20', 'lv27', 'lv45']) for (const mode of ['basic', 'advanced']) {
    const id = `${sn} ${mode} 390px touch`;
    const { ctx, p } = await page(390, { isMobile: true, hasTouch: true });
    await load(p, sn === 'lv20' ? 'fixture20' : typeof STATES[sn] === 'function' ? STATES[sn]() : STATES[sn], mode);
    await p.evaluate(() => { const d = document.getElementById('statDrawer'); if (d && !d.classList.contains('open')) document.getElementById('sdTab').click();
      document.querySelectorAll('details').forEach(x => { x.open = true; }); });
    await p.waitForTimeout(250);
    const r = await p.evaluate(([PRIMARY, GLYPH, BIGNUM]) => {
      const desc = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).join('.') : '');
      const vis = e => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0; };
      const fields = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]), select, textarea')]
        .filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(e => desc(e) + ' ' + getComputedStyle(e).fontSize);
      const prim = [...document.querySelectorAll(PRIMARY)].filter(vis).filter(e => e.getBoundingClientRect().height < 43.5).map(e => desc(e) + ' ' + Math.round(e.getBoundingClientRect().height));
      const small = [];
      for (const e of document.querySelectorAll('body *')) {
        if (!vis(e) || e.closest('svg') || e.closest(GLYPH) || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const cs = getComputedStyle(e), fs = parseFloat(cs.fontSize), min = /Mono|monospace/.test(cs.fontFamily) ? 11 : 12;
        if (fs > 0 && fs < min - .01) /* 0 px: text deliberately not rendered (a folded cleared step) */ small.push((e.parentElement ? desc(e.parentElement) + ' > ' : '') + desc(e) + ' ' + fs);
      }
      const first = document.querySelector('ul.story > li.st:not(:empty)');
      const line = first && getComputedStyle(first, '::before').content;
      const big = BIGNUM.map(id => document.getElementById(id)).filter(Boolean).filter(e => getComputedStyle(e).fontSize !== '18px').map(e => desc(e) + ' ' + getComputedStyle(e).fontSize);
      return { fields, big, prim: [...new Set(prim)], small: [...new Set(small)], line };
    }, [PRIMARY, GLYPH, BIGNUM]);
    ok(`touch ${id}: fields at 16 px or more (no zoom on focus)`, !r.fields.length, r.fields);
    ok(`touch ${id}: the big number fields stay at 18 px`, !r.big.length, r.big);
    ok(`touch ${id}: primary buttons at least 44 px tall`, !r.prim.length, r.prim);
    ok(`touch ${id}: no text under 11 px (mono) / 12 px`, !r.small.length, r.small);
    if (sn === 'fresh') ok(`story ${id}: no connector above the first story row`, r.line === 'none', r.line);
    await ctx.close();
  }

  /* ---------- 8. page zoom: no sideways scroll at 260 px ---------- */
  for (const mode of ['basic', 'advanced']) {
    const { ctx, p } = await page(260);
    await load(p, { ...USER }, mode);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`page zoom lv27 ${mode} 260px: no horizontal scroll`, over <= 0, over);
    await ctx.close();
  }

  /* ---------- 9. folded cleared steps on phones ---------- */
  for (const sn of ['lv27', 'lv45']) {
    const { ctx, p } = await page(390);
    await load(p, typeof STATES[sn] === 'function' ? STATES[sn]() : STATES[sn], 'advanced');
    /* every card, the cleared ones too (hidden by "hide cleared cards"): at Lv 45 on "Forgotten Commander" the only ticked row
       of a shown card was g45's story line, which since E6 waits for that quest's turn-in (unticked), so check them all */
    await p.evaluate(() => document.querySelectorAll('#gates details.step').forEach(x => { x.open = true; x.hidden = false; }));
    await p.waitForTimeout(250);
    const r = await p.evaluate(() => {
      /* rendered rows only (a done milestone keeps its list collapsed even when open) */
      const items = [...document.querySelectorAll('#gates li.item')].filter(li => li.querySelector('input:checked') && li.querySelector('.txt') && li.getBoundingClientRect().height);
      const hiddenKept = [], focusHidden = []; let folded = 0;
      for (const li of items) {
        const t = li.querySelector('.txt'), name = (li.querySelector('.txt > b') || t).textContent.trim().slice(0, 40), lr = li.getBoundingClientRect();
        if (parseFloat(getComputedStyle(t).fontSize) === 0) folded++;
        const tr = t.getBoundingClientRect(); /* clipped outside .txt (e.g. by a line clamp) counts as hidden */
        for (const k of t.querySelectorAll(':scope > .note, :scope > .loc')) { const b = k.getBoundingClientRect(); if (!b.width || !b.height || b.bottom > tr.bottom + 1) hiddenKept.push(name + ' ' + k.className); }
        for (const f of t.querySelectorAll('a[href], button, input, select, summary, [tabindex]')) {
          if (!f.checkVisibility()) continue; /* display: none somewhere above: not focusable */
          const b = f.getBoundingClientRect();
          if (!b.width || !b.height || b.top < lr.top - 1 || b.bottom > lr.bottom + 1) focusHidden.push(name + ' > ' + f.tagName.toLowerCase() + '.' + f.className);
        }
      }
      return { n: items.length, folded, hiddenKept, focusHidden };
    });
    ok(`fold ${sn} 390px: ${r.n} ticked steps, ${r.folded} folded; warnings and Reward lines visible`, r.n > 0 && r.folded === r.n && !r.hiddenKept.length, r);
    ok(`fold ${sn} 390px: no hidden link or button can take focus`, !r.focusHidden.length, r.focusHidden);
    await ctx.close();
  }

  /* ---------- 10. derived rows (0.3 E4): a row done in the story is a ticked, disabled box with a name ---------- */
  for (const width of [390, 1500]) {
    const counts = {};
    for (const mode of ['basic', 'advanced']) {
      const { ctx, p } = await page(width);
      await p.goto(CFG.CUR);
      /* Lv 22, story one quest past "Daeva in a Dream" (g6:0 … g16:monolith byStory, g22:0 wrapper), a stored false on
         g16:0, "In the Fang Legion's Name" picked up (its prerequisites by follow-up) */
      await p.evaluate(([k, m]) => { const q = QUESTS[QUESTS.findIndex(x => x[1] === 'Daeva in a Dream') + 1][1];
        localStorage.setItem(k, JSON.stringify({ checks: { 'g16:0': false }, started: { 'rq:2202017': 1 }, level: 22, quest: q, mode: m, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })); }, [KEY, mode]);
      await p.reload(); await p.waitForTimeout(400);
      await p.evaluate(() => document.querySelectorAll('#gates details.step').forEach(x => { x.open = true; x.hidden = false; }));
      const id = `derived ${mode} ${width}px`;
      const r = await p.evaluate(() => [...document.querySelectorAll('#gates input[data-derived]')].map(i => ({ k: i.dataset.k, checked: i.checked, disabled: i.disabled, label: i.getAttribute('aria-label') || '', title: i.title })));
      counts[mode] = r.map(x => x.k).sort().join(' ');
      ok(`${id}: derived rows (byStory, wrapper, follow-up) are ticked and disabled`, ['g16:0', 'g22:0', 'rq:2202016'].every(k => r.some(x => x.k === k)) && r.every(x => x.checked && x.disabled), r);
      ok(`${id}: each has a name and a tooltip saying "done in the story"`, r.length && r.every(x => /\S: done in the story$/.test(x.label) && /^done in the story/.test(x.title)), r.slice(0, 4));
      await p.addScriptTag({ content: AXE });
      const ax = await p.evaluate(async () => (await axe.run('#gates', { resultTypes: ['violations'] })).violations.map(v => ({ id: v.id, n: v.nodes.length, first: v.nodes.slice(0, 2).map(x => x.target.join(' ')) })));
      ok(`${id}: axe on the milestones, no violations outside the allowlist`, !ax.filter(v => !ALLOW[v.id]).length, ax);
      /* 11. the Ascension bar (0.3 E8): shown in both modes, a progressbar with a name and a value (2 / 4 here: Perceives and
         Hears the Voice derived from their wrappers), its label as visible text */
      const asc = await p.evaluate(() => { const el = document.getElementById('asc'), b = el && el.querySelector('[role="progressbar"]');
        return { shown: !!el && el.offsetParent !== null, name: b && b.getAttribute('aria-label'), now: b && b.getAttribute('aria-valuenow'), max: b && b.getAttribute('aria-valuemax'),
          text: b && b.getAttribute('aria-valuetext'), on: b ? b.querySelectorAll('.on').length : -1, label: el ? el.querySelector('.asc-txt').textContent : '',
          desc: b && (document.getElementById(b.getAttribute('aria-describedby')) || {}).textContent }; });
      counts[mode] += ' | ' + asc.label;
      ok(`${id}: Ascension bar shown, a progressbar named "Ascension" with value 2 of 4, described by its label`, asc.shown && asc.name === 'Ascension' && asc.now === '2' && asc.max === '4' &&
        asc.text === '2 of 4 chapters done' && asc.on === 2 && asc.label === 'Ascension 2 / 4 · next: Dreams · gauge 100%' && asc.desc === asc.label, asc);
      const axAsc = await p.evaluate(async () => (await axe.run('#asc', { resultTypes: ['violations'] })).violations.map(v => v.id));
      ok(`${id}: axe on the Ascension bar, no violations`, !axAsc.length, axAsc);
      /* A3: the story moves back before "Buried Atrocities": the stored false shows again, the box is enabled */
      const back = await p.evaluate(() => { char(state).quest = 'Buried Atrocities'; update(); const i = document.querySelector('#gates input[data-k="g16:0"]');
        return { checked: i.checked, disabled: i.disabled, derived: 'derived' in i.dataset, label: i.getAttribute('aria-label'), stored: char(state).checks['g16:0'] }; });
      ok(`${id}: story moved back: g16:0 unticked and enabled again, its stored false untouched`, !back.checked && !back.disabled && !back.derived && back.label === null && back.stored === false, back);
      await ctx.close();
    }
    ok(`derived ${width}px: the same derived rows and Ascension bar in Basic and Advanced`, counts.basic === counts.advanced, counts);
  }

  /* ---------- 12. the Ascension label is one line on a phone (owner, 2026-10-16): 390 px, touch (the 12 px phone size), Basic,
     at every story position and at 4 / 4 (all four steps ticked), no ellipsis needed. The suites block web fonts (fallback
     fonts, tests/run.mjs), but this is a width check in the font users get, so it adds the shipped Figtree 400 itself. ---------- */
  {
    const { ctx, p } = await page(390, { hasTouch: true });
    await p.goto(CFG.CUR);
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ checks: {}, level: 45, quest: '', mode: 'basic', open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })), KEY);
    await p.reload(); await p.waitForTimeout(400);
    const FIG = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'fonts', 'figtree-latin.woff2')).toString('base64');
    const r = await p.evaluate(async fig => {
      const f = new FontFace('Figtree', Uint8Array.from(atob(fig), ch => ch.charCodeAt(0)), { weight: '400' }); document.fonts.add(await f.load());
      const s = () => document.querySelector('#asc .asc-txt'), out = { size: getComputedStyle(s()).fontSize, font: f.status, n: 0, want: QUESTS.length + 2, wide: [] };
      const fits = () => { const t = s(); out.n++; if (t.scrollWidth > t.clientWidth && out.wide.length < 3) out.wide.push(`${t.textContent} (${t.scrollWidth} > ${t.clientWidth})`); };
      for (const q of ['', ...QUESTS.map(x => x[1])]) { char(state).quest = q; update(); fits(); }
      Object.assign(char(state).checks, { 'g6:0': true, 'g22:0': true, 'g32:dreams': true, 'g45:0': true }); update(); fits();
      return out;
    }, FIG);
    ok(`Ascension label one line at 390px (touch, Basic, ${r.size} Figtree): ${r.n} positions, none wider than the card`, r.size === '12px' && r.font === 'loaded' && r.n === r.want && !r.wide.length, r);
    await ctx.close();
  }

  /* ---------- 13. Active / Passive tags on the Skills card (0.2.7, F2): 390 px, Basic and Advanced, every level 1-45: each skill
     shown (the hero and every Coming up row, specialty rows too) carries a visible "Active" / "Passive" tag, and it matches
     the data (skills.json type, compiled to SP_SKILLS[].passive). The tag is text, so it is in the accessible name. ---------- */
  for (const mode of ['basic', 'advanced']) {
    const { ctx, p } = await page(390);
    await p.goto(CFG.CUR);
    await p.evaluate(([k, mode]) => localStorage.setItem(k, JSON.stringify({ checks: {}, level: 45, quest: '', mode, open: {}, seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true })), [KEY, mode]);
    await p.reload(); await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const out = { shown: 0, bad: [], names: new Set() };
      const names = SP_SKILLS.map(s => s.n).sort((a, b) => b.length - a.length);
      for (let lv = 1; lv <= 45; lv++) {
        char(state).level = lv; update();
        for (const el of document.querySelectorAll('#spHero .spname, #spSoon .sname')) {
          const text = el.textContent.trim(), n = names.find(x => text.startsWith(x)); if (!n) continue;
          const tag = el.querySelector('.sptype'), want = SP_SKILLS.find(s => s.n === n).passive ? 'Passive' : 'Active';
          out.shown++; out.names.add(n);
          if (!tag || tag.textContent !== want || !el.textContent.includes(want)) out.bad.push(`Lv ${lv} ${n}: ${tag ? tag.textContent : 'no tag'} (want ${want})`);
        }
      }
      return { shown: out.shown, skills: out.names.size, bad: out.bad.slice(0, 5), hasBoth: SP_SKILLS.some(s => s.passive) && SP_SKILLS.some(s => !s.passive) };
    });
    ok(`${mode} 390px: every skill on the Skills card has an Active / Passive tag matching the data (${r.shown} rows, ${r.skills} skills)`, r.shown > 0 && r.skills > 1 && r.hasBoth && !r.bad.length, r);
    await ctx.close();
  }

  ok('no page errors', !errs.length, errs);
  console.log(fail ? `A11Y CHECKS FAILED (${fail})` : 'A11Y CHECKS PASSED'); await b.close(); process.exit(fail ? 1 : 0);
})();
