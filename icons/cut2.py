import sys
from collections import deque
from PIL import Image, ImageFilter
# Flood in from the edges through everything that isn't the black outline; what's left is the icon.
src, out, thr = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert("RGBA"); w, h = im.size; px = im.load()
wall = lambda c: max(c[:3]) <= thr
seen = bytearray(w*h); q = deque([(x, y) for x in range(w) for y in (0, h-1)] + [(x, y) for y in range(h) for x in (0, w-1)])
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or seen[y*w+x] or wall(px[x, y]): continue
    seen[y*w+x] = 1; q.extend(((x+1, y), (x-1, y), (x, y+1), (x, y-1)))
mask = Image.new("L", (w, h)); mask.putdata([0 if seen[i] else 255 for i in range(w*h)])
mask = mask.filter(ImageFilter.GaussianBlur(0.5))
kept = sum(1 for i in range(w*h) if not seen[i])
im.putalpha(mask); im = im.crop(mask.getbbox()); im.save(out)
print(thr, "kept", kept, "of", w*h, "size", im.size)
