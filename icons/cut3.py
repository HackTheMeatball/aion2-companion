import sys
from collections import deque
from PIL import Image, ImageFilter
# 1) flood the flat background from the edges; 2) peel the light rim outside the black outline,
#    walking at most DEPTH px inward and stopping at dark (outline) pixels, so it can't leak inside.
src, out = sys.argv[1], sys.argv[2]; tol, thr, depth = (int(a) for a in sys.argv[3:6])
im = Image.open(src).convert("RGBA"); w, h = im.size; px = im.load()
border = [px[x, y] for x in range(w) for y in (0, h-1)] + [px[x, y] for y in range(h) for x in (0, w-1)]
bg = tuple(sorted(c[i] for c in border)[len(border)//2] for i in range(3))
near = lambda c: all(abs(c[i]-bg[i]) <= tol for i in range(3))
out_ = bytearray(w*h); q = deque([(x, y) for x in range(w) for y in (0, h-1)] + [(x, y) for y in range(h) for x in (0, w-1)])
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or out_[y*w+x] or not near(px[x, y]): continue
    out_[y*w+x] = 1; q.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
d = {}; q = deque()
for i in range(w*h):
    if out_[i]: q.append((i % w, i // w, 0))
while q:
    x, y, k = q.popleft()
    for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
        if 0 <= nx < w and 0 <= ny < h and not out_[ny*w+nx] and k < depth and max(px[nx, ny][:3]) > thr:
            out_[ny*w+nx] = 1; q.append((nx, ny, k+1))
# keep only the largest piece (drops specks left along the rim), then smooth the edge
keep = bytearray(w*h); best = []
for s0 in range(w*h):
    if out_[s0] or keep[s0]: continue
    comp = [s0]; keep[s0] = 1; i = 0
    while i < len(comp):
        c = comp[i]; i += 1; x, y = c % w, c // w
        for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            j = ny*w+nx
            if 0 <= nx < w and 0 <= ny < h and not out_[j] and not keep[j]: keep[j] = 1; comp.append(j)
    if len(comp) > len(best): best = comp
sel = bytearray(w*h)
for j in best: sel[j] = 1
mask = Image.new("L", (w, h)); mask.putdata([255 if sel[i] else 0 for i in range(w*h)])
# Frames are symmetric: rebuild an edge the cut bit into (here the top, whose wave is almost the
# background colour) by mirroring the opposite edge about the frame's centre. Square frame assumed.
if len(sys.argv) > 6 and sys.argv[6] == "mirror":
    l, t, r, b = mask.getbbox(); half = (r - l) / 2; cy = b - half
    flip = mask.transpose(Image.FLIP_TOP_BOTTOM)          # flipped about h/2
    shift = int(round(2*cy - h))                            # re-centre the flip on cy
    canvas = Image.new("L", (w, h)); canvas.paste(flip, (0, shift))
    from PIL import ImageChops
    mask = ImageChops.lighter(mask, canvas)
    # same left-right, so a side that was trimmed a pixel too far gets the fuller edge from its mirror
    l, t, r, b = mask.getbbox(); cx = (l + r) / 2
    flip = mask.transpose(Image.FLIP_LEFT_RIGHT); shift = int(round(2*cx - w))
    canvas = Image.new("L", (w, h)); canvas.paste(flip, (shift, 0))
    mask = ImageChops.lighter(mask, canvas)
mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))   # close pinholes/notches
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))   # open: shave burrs
mask = mask.filter(ImageFilter.GaussianBlur(0.6))
im.putalpha(mask); im = im.crop(mask.getbbox()); im.save(out); print("bg", bg, "size", im.size)
