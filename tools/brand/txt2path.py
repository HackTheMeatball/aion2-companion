"""Text -> SVG path (tools/brand). path(fontfile, text, size, x, y, axes={}, tracking=0, anchor='start', prec=2) -> (d, width)"""
import functools
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib import instancer

@functools.lru_cache(None)
def load(fontfile, axes_t):
    f = TTFont(fontfile)
    if 'fvar' in f:
        ax = {a.axisTag: a.defaultValue for a in f['fvar'].axes}
        ax.update(dict(axes_t))
        f = instancer.instantiateVariableFont(f, ax)
    return f

def measure(fontfile, text, size, axes={}, tracking=0):
    f = load(fontfile, tuple(sorted(axes.items())))
    cmap = f.getBestCmap(); hmtx = f['hmtx']; upm = f['head'].unitsPerEm
    s = size / upm
    w = 0
    for i, ch in enumerate(text):
        g = cmap.get(ord(ch), '.notdef')
        w += hmtx[g][0] * s + (tracking * size if i < len(text)-1 else 0)
    return w

def path(fontfile, text, size, x, y, axes={}, tracking=0, anchor='start', prec=2):
    f = load(fontfile, tuple(sorted(axes.items())))
    cmap = f.getBestCmap(); gs = f.getGlyphSet(); hmtx = f['hmtx']; upm = f['head'].unitsPerEm
    s = size / upm
    w = measure(fontfile, text, size, axes, tracking)
    if anchor == 'middle': x -= w/2
    elif anchor == 'end': x -= w
    pen = SVGPathPen(gs, lambda v: f"{v:.{prec}f}".rstrip('0').rstrip('.'))
    cx = x
    for ch in text:
        g = cmap.get(ord(ch), '.notdef')
        tp = TransformPen(pen, (s, 0, 0, -s, cx, y))
        gs[g].draw(tp)
        cx += hmtx[g][0] * s + tracking * size
    return pen.getCommands(), w
