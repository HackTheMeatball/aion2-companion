import sys
from collections import deque
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]; tol = int(sys.argv[3]) if len(sys.argv) > 3 else 6
im = Image.open(src).convert("RGBA"); w, h = im.size; px = im.load()
# background colour = median of the border pixels
border = [px[x, 0] for x in range(w)] + [px[x, h-1] for x in range(w)] + [px[0, y] for y in range(h)] + [px[w-1, y] for y in range(h)]
bg = tuple(sorted(c[i] for c in border)[len(border)//2] for i in range(3))
near = lambda c: all(abs(c[i] - bg[i]) <= tol for i in range(3))
seen = [[False]*h for _ in range(w)]; q = deque()
for x in range(w):
    for y in (0, h-1): q.append((x, y))
for y in range(h):
    for x in (0, w-1): q.append((x, y))
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or seen[x][y] or not near(px[x, y]): continue
    seen[x][y] = True
    q.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
mask = Image.new("L", (w, h), 0); m = mask.load()
for x in range(w):
    for y in range(h):
        m[x, y] = 0 if seen[x][y] else 255
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))  # trim the 1px fringe, soften edge
im.putalpha(mask)
im = im.crop(mask.getbbox()); im.save(out); print("bg", bg, "size", im.size)
