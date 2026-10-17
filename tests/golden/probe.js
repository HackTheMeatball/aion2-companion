/* Golden master: what is recorded for each state (see tests/golden/README.md).

   installProbe() is added to every page as an init script. At DOMContentLoaded, i.e. right after the app's synchronous
   start-up (`render(); update();` at the end of its script, migrations included) and before the first frame, it takes
   the snapshot and resolves window.__golden. That DOM state is the "app idle" point: everything the app decides is done,
   and only layout fitting (requestAnimationFrame: card heights, font shrinking, rail sizing) is still to come. That
   layout work is deliberately not recorded: it isn't logic, it depends on fonts, and skipping the first frame keeps a
   state at roughly half the cost.

   Text is read with textContent (whitespace collapsed), not innerText, so nothing depends on layout or CSS. Basic mode
   hides some things with CSS only; the snapshot records the mode and the classes that CSS keys on (upnext / overdue)
   instead of computed visibility. */
'use strict';

function installProbe([KEY, EARLY]) {
  /* the root is display:none from the start, so the page never does style/layout/paint work: the frames a browser
     renders while it parses (requestAnimationFrame can run before DOMContentLoaded) cost more than the app itself */
  const hide = () => { const r = document.documentElement; if (!r) return false; r.style.setProperty('display', 'none', 'important'); return true; };
  if (EARLY && !hide()) new MutationObserver((_, mo) => { if (hide()) mo.disconnect(); }).observe(document, { childList: true });
  const errors = [];
  addEventListener('error', e => errors.push('error: ' + (e.message || e.type)));
  addEventListener('unhandledrejection', e => errors.push('rejection: ' + String(e.reason && e.reason.message || e.reason)));
  const N = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim()
    /* volatile text: dates, times, durations (none are expected with the fixed clock; this keeps it that way) */
    .replace(/\b\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?\b/g, '<date>').replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '<time>')
    .replace(/\b\d+(\.\d+)? ?ms\b/g, '<ms>');
  /* text of an element: its text nodes joined with spaces (so "Survival Supplies" + "Lv 10" don't run together),
     without tooltip bodies and the "i" buttons that open them */
  const SKIP = '.tip, .tipbtn, svg, script, style';
  const T = e => { if (!e) return ''; const parts = [], w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const sk = n.parentElement && n.parentElement.closest(SKIP); if (!sk || !e.contains(sk)) parts.push(n.data); }
    return N(parts.join(' ')); };
  const cls = (e, names) => names.filter(n => e.classList.contains(n)).join(',');
  function snap() {
    const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const o = {};
    /* Next up: the card stack in rank order */
    o.nu = $$('#nowStar .ns-card').map(c => {
      const r = { t: T(c.querySelector('h3')) }, p = c.querySelector('.title > p'); if (p) r.s = T(p);
      const meta = c.querySelector('.meta'), b = meta && meta.querySelector('[data-now]'), tag = meta && meta.querySelector('.tag');
      r.c = b ? `${b.classList.contains('primary') ? 'primary' : 'go'} "${T(b)}" ${b.dataset.now}` : tag ? `tag "${T(tag)}"` : '';
      const f = cls(c, ['later']); if (f) r.f = f;
      /* the level-band label above the card (0.5 P14) */
      const band = c.querySelector('.ns-band'); if (band) r.b = T(band);
      const info = c.querySelector('.ns-info'); if (info) r.i = T(info);
      /* the story card's "Bind X" row (0.5 P15): its text and the key its tick writes */
      const bind = c.querySelector('.ns-bind'); if (bind) { const cb = bind.querySelector('input[data-nsbind]'); r.bd = `${T(bind)} ${cb ? cb.dataset.nsbind : ''}`.trim(); }
      /* its travel line (0.5 P16): the text and the target "I'll walk" hides */
      const tele = c.querySelector('.ns-tele'); if (tele) { const wb = tele.querySelector('[data-nswalk]'); r.tl = `${T(tele.querySelector('span'))} ${wb ? wb.dataset.nswalk : ''}`.trim(); }
      const ex = c.querySelector('.ns-extra');
      if (ex) r.x = $$('li.qg', ex).map(li => li.classList.contains('rq-aux') || li.classList.contains('more') ? T(li)
        : $$('.ql', li).map(q => { const cb = q.querySelector('.q-cb'), nm = q.querySelector('a, span[title]');
          return `${q.classList.contains('fu') ? '-> ' : ''}${cls(q, ['new', 'run', 'lock'])}${cb && cb.disabled ? '(disabled)' : ''} ${T(nm)}${q.querySelector('.q-rec') ? ' [' + T(q.querySelector('.q-rec')) + ']' : ''}${q.classList.contains('near') ? ' (near)' : ''}`; }).join(' | '));
      const obj = c.querySelector('.ns-obj'); if (obj) r.o = $$(':scope > li', obj).map(T);
      return r;
    });
    /* milestone headers (GATES) and route rules (STEPS): tag, count, state classes, folded/open, hidden */
    o.ms = $$('#gates details.step').map(d => `${d.id} | ${T(d.querySelector('.tag'))} | ${T(d.querySelector('.count'))} | ${cls(d, ['done', 'overdue', 'current', 'upnext', 'sideonly', 'peek'])}${d.open ? ' | open' : ''}${d.hidden ? ' | hidden' : ''}`);
    o.rt = $$('#steps details.step').map(d => `${d.id} | ${T(d.querySelector('.count'))}${d.open ? ' | open' : ''}`);
    /* Journey: story timeline, objectives, "Ahead", milestone track, progress */
    const qi = $('#questIn');
    o.jr = { prev: T($('#questPrev')), quest: qi ? N(qi.value) : '', lv: T($('#questLv')), next: T($('#questStatus')), hint: T($('#gateHint')),
      ahead: $$('#ahead > *').map(T).filter(Boolean), ...(T($('#asc')) ? { asc: T($('#asc')) } : {}), track: $$('#track > li').map(T), ring: T($('#ringTxt')), prog: $$('#progRows > *').map(T).filter(Boolean) };
    const subs = $('#questSubs'); if (subs && subs.firstElementChild) o.jr.subs = { head: T(subs.querySelector('.qs-head')), items: $$('.qs-list > li', subs).length, on: $$('.qs-list > li.on', subs).length, end: T(subs.querySelector('.qs-next, .qs-end, .qs-none')) };
    /* Dungeons & Strongholds (the regional card): band options, then section / zone headers and rows */
    o.reg = { opts: $$('#areaSel option').filter(x => !x.disabled).map(x => (x.selected ? '* ' : '') + T(x)),
      list: $$('#areaList > li').map(li => li.classList.contains('arow') ? `  ${T(li.querySelector('label') || li)} [${[li.querySelector('input:checked') ? 'done' : '', cls(li, ['running', 'locked'])].filter(Boolean).join(',')}]`.replace(' []', '') : T(li)).filter(s => s.trim()) };
    /* the stored state after load (o.stored, o.keys: a migration or seed writing shows up there) is read after drain() */
    o.mode = document.body.classList.contains('basic') ? 'basic' : 'advanced';
    return o;
  }
  /* <details> "toggle" events are queued tasks; the app's handlers save state.open from them. They can run before or
     after DOMContentLoaded, so the stored state is read only once they have drained (no toggle for two macrotasks). */
  let toggles = 0; addEventListener('toggle', () => { toggles++; }, true);
  const drain = async () => { for (let quiet = 0, i = 0; quiet < 2 && i < 50; i++) { const n = toggles; await new Promise(r => setTimeout(r, 0)); quiet = toggles === n ? quiet + 1 : 0; } };
  window.__golden = new Promise(res => document.addEventListener('DOMContentLoaded', async () => {
    let o; try { o = snap(); } catch (e) { o = { probeError: String(e && e.stack || e) }; }
    await drain(); o.stored = localStorage.getItem(KEY); o.keys = Object.keys(localStorage).filter(k => k !== KEY).sort(); o.err = errors.slice();
    res(o);
    /* recorded; with --render, stop rendering now (nothing after this point is recorded) */
    document.documentElement.style.setProperty('display', 'none', 'important');
  }, { once: true }));
}

/* The stored state vs the state that was loaded: only what changed, as path -> [before, after] (undefined = absent). */
function storeDiff(inRaw, outRaw) {
  if (inRaw === outRaw) return null;
  let a, b; try { a = inRaw == null ? null : JSON.parse(inRaw); } catch { a = inRaw; } try { b = outRaw == null ? null : JSON.parse(outRaw); } catch { b = outRaw; }
  const isO = x => x && typeof x === 'object' && !Array.isArray(x), out = {};
  const C = x => JSON.stringify(x, (k, v) => isO(v) ? Object.fromEntries(Object.keys(v).sort().map(j => [j, v[j]])) : v); /* key order doesn't count */
  const J = x => x === undefined ? '(absent)' : x;
  /* 5c change times (mt) are recorded as a summary: stamp count, count per time and a hash of the whole object, so any
     change still shows as a diff without storing ~2 KB of stamps per state (they are checked in full by tests/core/sync
     and the save suite). */
  const MT = m => { if (!isO(m)) return m; const at = {}; let n = 0, h = 0x811c9dc5; const t = C(m);
    for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619) >>> 0;
    (function walk(o) { Object.values(o).forEach(v => { if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') { n++; at[v[0]] = (at[v[0]] || 0) + 1; } else if (isO(v)) walk(v); }); })(m);
    return { stamps: n, at, fnv1a: h.toString(16).padStart(8, '0') }; };
  for (const o of [a, b]) if (isO(o) && 'mt' in o) o.mt = MT(o.mt);
  if (!isO(a) || !isO(b)) return { '': [J(a), J(b)] };
  for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const x = a[k], y = b[k];
    if (C(x) === C(y)) continue;
    if (isO(x) && isO(y)) { for (const j of [...new Set([...Object.keys(x), ...Object.keys(y)])].sort()) if (C(x[j]) !== C(y[j])) out[k + '.' + j] = [J(x[j]), J(y[j])]; }
    else out[k] = [J(x), J(y)];
  }
  return Object.keys(out).length ? out : null;
}

module.exports = { installProbe, storeDiff };
