"""Contact sheet for the Daeva Companion assets (tools/brand/build.py --sheet DIR). Review aid only; nothing here ships."""
import os, subprocess, shutil

FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')


def build(root, out):
    os.makedirs(out, exist_ok=True)
    for f in ['brand/icon.svg', 'brand/icon-any.svg', 'brand/icon-maskable.svg', 'brand/favicon.svg', 'brand/wordmark.svg',
              'brand/wordmark-light.svg', 'brand/header-name.svg', 'public/icons/icon-192.png', 'public/icons/icon-512.png',
              'public/icons/maskable-192.png', 'public/icons/maskable-512.png', 'public/icons/apple-touch-icon.png']:
        shutil.copy(os.path.join(root, f), os.path.join(out, os.path.basename(f)))
    shutil.copy(os.path.join(root, 'public/favicon.svg'), os.path.join(out, 'favicon-public.svg'))
    css = f'''@font-face{{font-family:Figtree;src:url("file://{FONTS}/Figtree.ttf");font-weight:300 900}}
@font-face{{font-family:Fraunces;src:url("file://{FONTS}/Fraunces.ttf");font-weight:100 900}}
*{{box-sizing:border-box}} body{{margin:0;width:1170px;background:#ece9e4;font-family:Figtree;color:#1b1b1f}}
.sec{{padding:40px 56px;border-bottom:1px solid #d6d1c9}} .lab{{font:600 20px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6d6870;margin-bottom:20px}}
h1{{font:700 60px Figtree;margin:0}} .kind{{font-size:28px;color:#58535c;margin-top:6px}}
.row{{display:flex;align-items:flex-end;gap:40px;flex-wrap:wrap}} figure{{margin:0;text-align:center;font:500 18px ui-monospace,monospace;color:#6d6870}}
figure img,figure .box{{display:block;margin:0 auto 10px}} .pix{{image-rendering:pixelated}}
.safe{{position:relative;width:300px;height:300px}} .safe img{{width:300px;height:300px}}
.safe i{{position:absolute;inset:30px;border-radius:50%;border:3px dashed #ff3b6b}}
.circ{{width:192px;height:192px;border-radius:50%;overflow:hidden}} .circ img,.sq img,.sqr img{{width:192px;height:192px}}
.sqr{{width:192px;height:192px;border-radius:38px;overflow:hidden}} .tear{{width:192px;height:192px;border-radius:50% 50% 50% 12%;overflow:hidden}} .tear img{{width:192px;height:192px}}
.home{{border-radius:44px;padding:50px 50px 60px;background:linear-gradient(160deg,#36506b,#1f2a3a 55%,#151a24);display:grid;grid-template-columns:repeat(4,1fr);gap:40px 30px}}
.app{{text-align:center}} .t{{width:180px;height:180px;border-radius:40px;margin:0 auto;overflow:hidden}} .t img{{width:180px;height:180px;display:block}}
.ph{{background:rgba(255,255,255,.16)}} .nm{{color:#fff;font:500 33px -apple-system,Figtree;margin:12px auto 0;width:228px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,.4)}}
.wm{{padding:36px;border-radius:24px;margin-bottom:20px}} .wm img{{width:100%;display:block}}
.hdr{{background:#110c13;background-image:radial-gradient(1200px 500px at 85% -10%,#3a1730 0%,transparent 60%);border-radius:24px;padding:28px 32px;color:#ece4ee}}
.lock{{display:flex;align-items:center;gap:12px;color:#cfa650}} .lock img.m{{width:40px;height:40px}} .lock img.n{{height:26px}}
p.note{{font-size:21px;line-height:1.5;color:#3d3940;margin:14px 0 0}}'''
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="sec"><div class="lab">Daeva Companion · direction C</div><h1>Compass Quill</h1><div class="kind">Shipped assets, regenerated for the new name</div></div>
<div class="sec"><div class="lab">App icon ("any", transparent corners) · 512 · 192 · apple-touch 180 · favicon 32 (+ @4×)</div><div class="row">
 <figure><img src="icon-512.png" width="300" height="300">icon-512 (shown 300)</figure>
 <figure><img src="icon-192.png" width="192" height="192">icon-192</figure>
 <figure><img src="apple-touch-icon.png" width="180" height="180">apple-touch 180</figure>
 <figure><img src="favicon.svg" width="32" height="32">32</figure>
 <figure><img class="pix" src="favicon-32.png" width="128" height="128">32 @4×</figure>
 <figure><img class="pix" src="favicon-16.png" width="128" height="128">16 @8×</figure></div></div>
<div class="sec"><div class="lab">Maskable · 40 % safe circle (dashed) · launcher masks</div><div class="row">
 <figure><div class="safe box"><img src="maskable-512.png"><i></i></div>maskable-512 + safe zone</figure>
 <figure><div class="circ box"><img src="maskable-192.png"></div>circle</figure>
 <figure><div class="sqr box"><img src="maskable-192.png"></div>squircle</figure>
 <figure><div class="tear box"><img src="maskable-192.png"></div>teardrop</figure></div></div>
<div class="sec"><div class="lab">iOS home screen · short_name check</div><div class="home">
 <div class="app"><div class="t ph"></div><div class="nm">&nbsp;</div></div>
 <div class="app"><div class="t"><img src="apple-touch-icon.png"></div><div class="nm">Daeva</div></div>
 <div class="app"><div class="t"><img src="apple-touch-icon.png"></div><div class="nm">Daeva Companion</div></div>
 <div class="app"><div class="t ph"></div><div class="nm">&nbsp;</div></div></div>
 <p class="note">Mocked at 3×: 60 pt tile, ≈11 pt label in ≈76 pt. "Daeva Companion" truncates, so short_name and the iOS web-app title are "Daeva".</p></div>
<div class="sec"><div class="lab">Wordmark · dark · light</div>
 <div class="wm" style="background:#0b1b1e"><img src="wordmark.svg"></div>
 <div class="wm" style="background:#f3ead7"><img src="wordmark-light.svg"></div></div>
<div class="sec"><div class="lab">Header lockup on today's dark theme (brass on night plum)</div>
 <div class="hdr"><div class="lock"><img class="m" src="favicon.svg"><img class="n" src="header-name-brass.svg"></div></div></div>
</body></html>'''
    import json
    subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render.mjs'), json.dumps([[os.path.join(out, 'favicon.svg'), os.path.join(out, 'favicon-%d.png' % n), n, 1] for n in (16, 32)])], check=True, cwd=root)
    name = open(os.path.join(out, 'header-name.svg')).read().replace('currentColor', '#cfa650')
    open(os.path.join(out, 'header-name-brass.svg'), 'w').write(name)
    open(os.path.join(out, 'contact-sheet.html'), 'w').write(html)
    shot = os.path.join(out, '_shot.mjs')
    open(shot, 'w').write('''import { chromium } from %r;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1170, height: 800 } });
await p.goto('file://%s', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: %r, fullPage: true }); await b.close();''' % (
        os.path.join(root, 'node_modules', 'playwright', 'index.mjs'), os.path.join(out, 'contact-sheet.html'), os.path.join(out, 'contact-sheet.png')))
    subprocess.run(['node', shot], check=True)
    os.remove(shot)
