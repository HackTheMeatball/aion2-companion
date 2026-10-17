#!/usr/bin/env node
/* Design tokens (docs/design-system.md), Node, no browser. Over every .css under src/styles/:
   1. no raw colour (hex, rgb()/hsl()/hwb()/lab()/lch()/oklab()/oklch()/color(), a named colour) outside the token
      definitions, i.e. outside custom-property declarations in a top-level :root rule;
   2. radius, spacing (margin / padding / gap) and shadows (box-shadow, filter: drop-shadow()) use tokens: no raw
      length other than 0 there;
   3. every var(--x) refers to a custom property defined in the styles, or set by the page (RUNTIME), or has a fallback.
   Usage: node tests/tokens.mjs [file.css ...]  (default: every .css under src/styles/) */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), DIR = join(ROOT, 'src', 'styles');
/* every .css under src/styles/, the card files in its subfolders included (0.4 P4d) */
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.css') ? [join(d, e.name)] : []).sort();
const files = process.argv.slice(2).length ? process.argv.slice(2) : walk(DIR);
/* custom properties set from src/main.js (style.setProperty) rather than in the styles */
const RUNTIME = new Set(['--dx', '--dy', '--hero']);
const NAMED = 'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' ');
const COLOUR = new RegExp(String.raw`#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|(?<![\w-])(?:${NAMED.join('|')})(?![\w-])`, 'gi');
const LENGTH = /(?<![\w-])-?(?:\d*\.)?\d+(?:px|r?em|%|vw|vh|ch)\b/g; /* a raw non-zero length (0 has no unit here) */

/* Minimal CSS reader: comments and strings blanked, then rules walked with their at-rule context.
   Yields { prelude, prop, value, at } for every declaration. */
function* declarations(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  let i = 0;
  function* block(end, at) {
    let start = i;
    while (i < src.length) {
      const c = src[i];
      if (c === '{') {
        const prelude = src.slice(start, i).trim(); i++;
        if (/^@(media|supports|container|layer|document)\b/.test(prelude)) yield* block('}', [...at, prelude]);
        else yield* body(prelude, at);
        start = i;
      } else if (c === '}') { i++; return; } else if (c === ';') { i++; start = i; } else i++;
    }
  }
  function* body(prelude, at) {
    let start = i, depth = 0;
    const emit = function* (text) { const m = text.match(/^\s*([-\w]+)\s*:([\s\S]*)$/); if (m) yield { prelude, prop: m[1].toLowerCase(), value: m[2].trim(), at }; };
    while (i < src.length) {
      const c = src[i];
      if (c === '(') depth++; else if (c === ')') depth--;
      else if (c === '{' && depth === 0) { /* nested block (keyframe selectors) */ const inner = src.slice(start, i).trim(); i++; yield* body(inner, [...at, prelude]); start = i; continue; }
      else if ((c === ';' || c === '}') && depth === 0) { yield* emit(src.slice(start, i)); i++; if (c === '}') return; start = i; continue; }
      i++;
    }
  }
  yield* block('', []);
}

const fails = [], defined = new Set(), used = [];
let nDecl = 0, nTok = 0;
for (const f of files) {
  const rel = f.startsWith(ROOT) ? f.slice(ROOT.length + 1) : f;
  for (const d of declarations(readFileSync(f, 'utf8'))) {
    nDecl++;
    const where = `${rel}: ${d.at.length ? d.at.join(' > ') + ' > ' : ''}${d.prelude} { ${d.prop}: ${d.value.slice(0, 80)} }`;
    const isToken = d.prop.startsWith('--');
    if (isToken) { defined.add(d.prop); if (d.prelude === ':root' && !d.at.length) { nTok++; continue; } }
    for (const m of d.value.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) used.push({ name: m[1], fallback: !!m[2], where });
    if (d.prop === 'font-family' || d.prop === 'grid-template-areas') continue; /* names, not colours */
    const v = d.value.replace(/url\([^)]*\)/g, 'url()').replace(/\s*!important$/, '');
    const col = v.match(COLOUR);
    if (col) fails.push(`raw colour ${[...new Set(col)].join(', ')} (use a token from the :root block in src/styles/app.css): ${where}`);
    const raw = (re, what) => { const m = v.replace(/var\([^()]*\)/g, '').match(re); if (m) fails.push(`raw ${what} ${[...new Set(m)].join(', ')} (use a token): ${where}`); };
    if (/radius/.test(d.prop)) raw(LENGTH, 'radius');
    if (/^(margin|padding|gap|row-gap|column-gap)(-|$)/.test(d.prop)) raw(LENGTH, 'spacing');
    /* a whole shadow list is one token */
    if (/shadow$/.test(d.prop) && v !== 'none' && v.replace(/var\([^()]*\)/g, '').trim()) fails.push(`raw shadow (use a --shadow-* / --ring-* token): ${where}`);
    if (d.prop === 'filter' && /drop-shadow\(/.test(v)) fails.push(`raw drop-shadow() (use a --drop-* token): ${where}`);
  }
}
for (const u of used) if (!u.fallback && !defined.has(u.name) && !RUNTIME.has(u.name)) fails.push(`var(${u.name}) is not defined in src/styles/*.css: ${u.where}`);

/* self-test: the reader must see the declarations it is meant to police */
const probe = [...declarations(':root{--a:#fff}@media (x){.b{color:#000}}@keyframes k{0%{box-shadow:0 0 1px red}}.c{content:"#fff"}')];
const ok = probe.length === 4 && probe[0].prelude === ':root' && probe[1].at[0] === '@media (x)' && probe[2].prelude === '0%' && probe[3].value === '""';
if (!ok) fails.push('tests/tokens.mjs: the CSS reader self-test failed ' + JSON.stringify(probe));

for (const x of fails) console.log('FAIL ' + x);
console.log(`${files.length} files, ${nDecl} declarations, ${nTok} tokens, ${used.length} var() uses`);
console.log(fails.length ? `TOKENS CHECKS FAILED (${fails.length})` : 'TOKENS CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
