#!/usr/bin/env python3
"""Write tools/gen/gen-block.js into the ES module src/data/generated.js: a header, the block byte for byte (between its
E2-GEN markers), and an export list of the block's top-level constants. src/main.js imports them; scripts/build.mjs
bundles both into the page. The module is generated: never edit it by hand.
Usage (from the repo root): python3 -I tools/gen/apply.py [module]   (module defaults to src/data/generated.js)"""
import os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
out = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else "src/data/generated.js")
block = open(os.path.join(ROOT, "tools/gen/gen-block.js"), encoding="utf-8").read().rstrip("\n")
if not re.match(r"/\* E2-GEN START", block) or not block.endswith("/* E2-GEN END */"):
    sys.exit("apply.py: tools/gen/gen-block.js lacks the E2-GEN markers")
names = re.findall(r"^const (\w+) =", block, re.M)
head = ("/* Generated data module: tools/gen/gen.py builds the block below from data/*.json, tools/gen/apply.py writes this\n"
        "   file (npm run gen). Do not edit by hand: change the data and re-run. */\n")
mod = head + block + "\nexport { " + ", ".join(names) + " };\n"
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, "w", encoding="utf-8").write(mod)
print("E2 block applied to", os.path.relpath(out, ROOT), f"({len(block)} chars, {len(names)} exports)")
