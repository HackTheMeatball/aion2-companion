#!/usr/bin/env python3
"""Put tools/gen/gen-block.js into src/index.html between the E2-GEN markers (first run: right after `const seq`).
Usage (from the repo root): python3 -I tools/gen/apply.py [page]   (page defaults to src/index.html)"""
import os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
page = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else "src/index.html")
block = open(os.path.join(ROOT, "tools/gen/gen-block.js"), encoding="utf-8").read().rstrip("\n")
h = open(page, encoding="utf-8").read()
pat = re.compile(r"/\* E2-GEN START.*?/\* E2-GEN END \*/", re.S)
if pat.search(h):
    h = pat.sub(lambda m: block, h, count=1)
else:
    anchor = "const seq = (arr) =>"
    i = h.index(anchor); j = h.index("\n", i) + 1
    h = h[:j] + block + "\n" + h[j:]
open(page, "w", encoding="utf-8").write(h)
print("E2 block applied to", os.path.basename(page), f"({len(block)} chars)")
