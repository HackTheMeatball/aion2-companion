"""Daeva Companion brand assets (direction C, Compass Quill), drawn as code. Original art: no game art is used.

Usage (from the repo root; needs fontTools and the dev dependency Playwright):
    python3 -I tools/brand/build.py                # brand/*.svg, public/favicon.svg, public/icons/*.png
    python3 -I tools/brand/build.py --sheet DIR    # also a contact sheet (DIR/contact-sheet.html + .png)

Writes
    brand/icon.svg            master: full-bleed square, compass inside the maskable safe zone
    brand/icon-any.svg        rounded tile with transparent corners (manifest purpose "any")
    brand/icon-maskable.svg   full-bleed, compass scaled to 0.9 for room inside the 40 % safe circle (purpose "maskable")
    brand/favicon.svg         simplified drawing tuned for 16-32 px (no ticks, no notches, bigger needle)
    brand/wordmark.svg        "Daeva Companion" + "UNOFFICIAL COMPANION FOR AION 2", for dark backgrounds, text as paths
    brand/wordmark-light.svg  the same for light backgrounds
    brand/header-name.svg     the name alone as one path (fill currentColor), inlined in src/index.html's header
    public/favicon.svg        = brand/favicon.svg
    public/icons/icon-192.png, icon-512.png            from icon-any.svg
    public/icons/maskable-192.png, maskable-512.png    from icon-maskable.svg
    public/icons/apple-touch-icon.png (180)            from icon.svg (opaque: iOS fills transparency with black)
Fonts (tools/brand/fonts, SIL OFL 1.1, licence texts alongside): Fraunces for the name, Figtree for the subtitle.
They are only used here, outlined to paths; the site ships no extra font.
"""
import math, os, subprocess, sys, json, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import txt2path as T

FONTS = os.path.join(HERE, 'fonts')
NAME = 'Daeva Companion'
SUB = 'UNOFFICIAL COMPANION FOR AION 2'

# Direction C palette (brand/palette.md in the brand project)
NIGHT2 = '#09171a'; BRASS2 = '#9c7630'; FACE = '#f1e6cd'; TICK = '#7a6440'; RED = '#b9433a'; RED2 = '#8f2f2a'; QUILL = '#3a2c1c'
BRASS = '#cfa650'; TEAL = '#0b1b1e'


def icon(rx=0, small=False, rot=20, scale=1.0, pre=''):
    """The compass. rx: corner radius of the tile (0 = full bleed). small: the simplified favicon drawing.
    scale: motif scale around the centre (tile unchanged). pre: prefix for ids (inline use in a page)."""
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    s += (f'<defs><radialGradient id="{pre}bg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#16343a"/>'
          f'<stop offset="1" stop-color="{NIGHT2}"/></radialGradient>'
          f'<linearGradient id="{pre}br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c47a"/>'
          f'<stop offset="1" stop-color="{BRASS2}"/></linearGradient>'
          f'<linearGradient id="{pre}vn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{RED}"/>'
          f'<stop offset=".5" stop-color="{RED}"/><stop offset=".5" stop-color="{RED2}"/><stop offset="1" stop-color="{RED2}"/>'
          '</linearGradient></defs>')
    s += f'<rect width="512" height="512" rx="{rx}" fill="url(#{pre}bg)"/>'
    if scale != 1:
        s += f'<g transform="translate(256 256) scale({scale}) translate(-256 -256)">'
    R = 214 if small else 186
    ring = 30 if small else 20
    s += f'<circle cx="256" cy="256" r="{R}" fill="url(#{pre}br)"/>'
    s += f'<circle cx="256" cy="256" r="{R - ring}" fill="{FACE}"/>'
    if not small:
        def star(n_r, i_r, rot_, fill):
            pts = []
            for j in range(8):
                a = math.radians(rot_ + j * 45); r = n_r if j % 2 == 0 else i_r
                pts.append(f"{256 + r * math.sin(a):.1f} {256 - r * math.cos(a):.1f}")
            return f'<path d="M{" L".join(pts)}Z" fill="{fill}"/>'
        s += star(112, 18, 45, '#e2d3b2')
        s += star(150, 22, 0, '#d9c7a0')
        for j, col in enumerate([RED, TICK, TICK, TICK]):   # rim markers: north in quill red
            a = math.radians(j * 90); r0 = R - ring - 6
            tx, ty = 256 + r0 * math.sin(a), 256 - r0 * math.cos(a)
            bx1, by1 = 256 + (r0 - 22) * math.sin(a) + 9 * math.cos(a), 256 - (r0 - 22) * math.cos(a) + 9 * math.sin(a)
            bx2, by2 = 256 + (r0 - 22) * math.sin(a) - 9 * math.cos(a), 256 - (r0 - 22) * math.cos(a) - 9 * math.sin(a)
            s += f'<path d="M{tx:.1f} {ty:.1f} L{bx1:.1f} {by1:.1f} L{bx2:.1f} {by2:.1f}Z" fill="{col}"/>'
    k = 1.12 if small else 0.86
    s += f'<g transform="rotate({rot} 256 256) translate(256 256) scale({k * 0.86:.3f} {k}) translate(-256 -256)">'
    s += f'<path d="M256 300 L256 418" stroke="{QUILL}" stroke-width="{16 if small else 11}" stroke-linecap="round"/>'
    vane = ("M256 96 C 224 134, 206 184, 211 234 C 215 280, 236 312, 250 336 L262 336 "
            "C 278 312, 301 272, 300 224 C 298 172, 282 130, 256 96Z")
    s += f'<path d="{vane}" fill="url(#{pre}vn)"/>'
    if not small:   # barb notches and shaft in face colour
        s += f'<path d="M209 252 L238 268 L214 270Z M300 196 L272 214 L299 220Z M219 292 L242 300 L228 306Z" fill="{FACE}"/>'
        s += f'<path d="M256 118 L256 334" stroke="{FACE}" stroke-opacity=".85" stroke-width="4" stroke-linecap="round"/>'
    s += '</g>'
    s += f'<circle cx="256" cy="256" r="{20 if small else 13}" fill="url(#{pre}br)" stroke="{QUILL}" stroke-width="{5 if small else 3}"/>'
    if scale != 1:
        s += '</g>'
    return s + '</svg>'


FR = (os.path.join(FONTS, 'Fraunces.ttf'), {'wght': 560, 'opsz': 96, 'SOFT': 60, 'WONK': 0}, 76, -0.005)
FG = (os.path.join(FONTS, 'Figtree.ttf'), {'wght': 600}, 18, 0.2)


def wordmark(title, sub, rule, pad=24):
    """Centred two-line wordmark (name, subtitle with thin rules either side), text outlined to paths."""
    tw = T.measure(FR[0], NAME, FR[2], FR[1], FR[3]); sw = T.measure(FG[0], SUB, FG[2], FG[1], FG[3])
    L, gapr = 46, 18
    W = max(tw, sw + 2 * (L + gapr)) + 2 * pad
    b1 = pad + FR[2] * 0.82; b2 = b1 + FR[2] * 0.12 + 28 + FG[2] * 0.78
    H = b2 + FG[2] * 0.12 + pad
    d1, _ = T.path(FR[0], NAME, FR[2], W / 2, b1, FR[1], FR[3], anchor='middle')
    d2, _ = T.path(FG[0], SUB, FG[2], W / 2, b2, FG[1], FG[3], anchor='middle')
    x0 = (W - sw) / 2; cy = b2 - 6.5
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}">'
            f'<title>{NAME}, {SUB.lower().replace("aion", "AION")}</title>'
            f'<path fill="{title}" d="{d1}"/><path fill="{sub}" d="{d2}"/>'
            f'<path d="M{x0 - gapr - L:.1f} {cy:.1f} H{x0 - gapr:.1f} M{x0 + sw + gapr:.1f} {cy:.1f} H{x0 + sw + gapr + L:.1f}" '
            f'stroke="{rule}" stroke-width="1.6"/></svg>')


def header_name(size=32):
    """The name alone as one path, tight box from cap height to baseline (+ descender room for 'p')."""
    w = T.measure(FR[0], NAME, size, FR[1], FR[3])
    asc, desc = size * 0.74, size * 0.25
    d, _ = T.path(FR[0], NAME, size, 0, asc, FR[1], FR[3], prec=1)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {asc + desc:.0f}"><path fill="currentColor" d="{d}"/></svg>'


def write(rel, text):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w') as f: f.write(text)
    return p


def main():
    svgs = {
        'brand/icon.svg': icon(),
        'brand/icon-any.svg': icon(rx=112),
        'brand/icon-maskable.svg': icon(scale=0.9),
        'brand/favicon.svg': icon(rx=96, small=True),
        'brand/wordmark.svg': wordmark(FACE, BRASS, BRASS),
        'brand/wordmark-light.svg': wordmark('#1d2b2d', '#85641c', '#85641c'),
        'brand/header-name.svg': header_name(),
    }
    for rel, t in svgs.items(): write(rel, t)
    write('public/favicon.svg', svgs['brand/favicon.svg'])
    jobs = [
        ['brand/icon-any.svg', 'public/icons/icon-192.png', 192, 1],
        ['brand/icon-any.svg', 'public/icons/icon-512.png', 512, 1],
        ['brand/icon-maskable.svg', 'public/icons/maskable-192.png', 192, 0],
        ['brand/icon-maskable.svg', 'public/icons/maskable-512.png', 512, 0],
        ['brand/icon.svg', 'public/icons/apple-touch-icon.png', 180, 0],
    ]
    subprocess.run(['node', os.path.join(HERE, 'render.mjs'), json.dumps([[os.path.join(ROOT, a), os.path.join(ROOT, b), n, t] for a, b, n, t in jobs])], check=True, cwd=ROOT)
    if '--sheet' in sys.argv:
        out = os.path.abspath(sys.argv[sys.argv.index('--sheet') + 1])
        import sheet
        sheet.build(ROOT, out)
    print('brand assets written')


if __name__ == '__main__':
    main()
