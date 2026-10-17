#!/usr/bin/env node
/* scrapbook suite (Node, no browser; < 1 s): every docs/reviews/<folder>/scrapbook.json is something the tracker writer can
   publish without asking (format in docs/reviews/README.md), and every folder made with tests/support/shots.mjs (it has a
   cases.mjs) has one, so the owner's Scrapbook can't silently miss a visible change again. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), REV = join(ROOT, 'docs/reviews');
const KINDS = ['before-after', 'screenshot', 'mockup'], MAX_PNG = 3 * 1024 * 1024;
const fails = [];
let cards = 0, folders = 0;
for (const f of readdirSync(REV).filter(n => statSync(join(REV, n)).isDirectory()).sort()) {
  const dir = join(REV, f), sb = join(dir, 'scrapbook.json'), rel = `docs/reviews/${f}`;
  if (!existsSync(sb)) { if (existsSync(join(dir, 'cases.mjs'))) fails.push(`${rel}: has cases.mjs but no scrapbook.json`); continue; }
  folders++;
  let list;
  try { list = JSON.parse(readFileSync(sb, 'utf8')); } catch (e) { fails.push(`${rel}/scrapbook.json: not JSON (${e.message})`); continue; }
  if (!Array.isArray(list) || list.length < 1 || list.length > 6) { fails.push(`${rel}/scrapbook.json: must be an array of 1 to 6 cards`); continue; }
  list.forEach((c, i) => {
    const at = `${rel}/scrapbook.json[${i}]`;
    const extra = Object.keys(c).filter(k => !['case', 'kind', 'title', 'caption'].includes(k));
    if (extra.length) fails.push(`${at}: unknown field(s) ${extra.join(', ')}`);
    if (!KINDS.includes(c.kind)) fails.push(`${at}: kind must be one of ${KINDS.join(', ')}`);
    if (typeof c.title !== 'string' || !c.title.trim() || c.title.length > 40) fails.push(`${at}: title must be 1-40 characters`);
    if (typeof c.caption !== 'string' || !c.caption.trim() || c.caption.length > 160) fails.push(`${at}: caption must be 1-160 characters`);
    if (/\b[PESp]\d+[a-z]?\b|\.png|#\d+/.test(`${c.title} ${c.caption}`)) fails.push(`${at}: title and caption are plain words (no item codes, PR numbers or file names)`);
    if (typeof c.case !== 'string' || !c.case) { fails.push(`${at}: case is required`); return; }
    const files = c.kind === 'before-after' ? [`${c.case}-before.png`, `${c.case}-after.png`] : [`${c.case}.png`];
    for (const n of files) {
      const p = join(dir, n);
      if (!existsSync(p)) fails.push(`${at}: ${n} is missing`);
      else if (statSync(p).size > MAX_PNG) fails.push(`${at}: ${n} is over 3 MB`);
    }
    cards++;
  });
}
if (fails.length) { console.log(fails.map(f => 'FAIL ' + f).join('\n')); console.log(`SCRAPBOOK CHECKS FAILED (${fails.length})`); process.exit(1); }
console.log(`${cards} card(s) in ${folders} folder(s)\nSCRAPBOOK CHECKS PASSED`);
