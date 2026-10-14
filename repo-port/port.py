import os
os.chdir('/home/claude/aion2-companion/tests')
def edit(p, pairs):
    s=open(p,encoding='utf-8').read()
    for a,b,*n in pairs:
        n = n[0] if n else 1
        c = s.count(a)
        assert c==n,(p,a[:70],c); s=s.replace(a,b)
    open(p,'w',encoding='utf-8').write(s)
CFG = "const CFG = require('./config');"
edit('regress.js', [
 ('''   Usage (from the scratchpad root):
     bash polish/qa/map.sh assassin-route.html qa-cur.html && bash polish/qa/map.sh backup-v285-before-polish.html qa-v285.html
     NODE_PATH=$(npm root -g) node polish/qa/regress.js [--quick] [--noshots]
   Writes polish/qa/results.json ([{level, mode, width, fixture, check, pass, detail, soft?}]) and polish/qa/shots/*.png.''',
  '''   Usage: npm test (or, with a server running: AION_BASE=http://127.0.0.1:8080 node tests/regress.js [--quick] [--noshots])
   Writes tests/out/regress/results.json ([{level, mode, width, fixture, check, pass, detail, soft?}]) and tests/out/regress/shots/*.png.'''),
 ("const ROOT = path.resolve(__dirname, '..', '..'), QA = __dirname, SHOTS = path.join(QA, 'shots');\nconst CUR = path.join(ROOT, 'qa-cur.html'), V285 = path.join(ROOT, 'qa-v285.html'), KEY = 'aion2-assassin-route-v4';",
  CFG + "\nconst ROOT = CFG.ROOT, QA = path.join(CFG.OUT, 'regress'), SHOTS = path.join(QA, 'shots');\nconst CUR = CFG.CUR, V285 = CFG.V285, KEY = 'aion2-assassin-route-v4';"),
 ("const SRC = fs.readFileSync(path.join(ROOT, 'assassin-route.html'), 'utf8');", "const SRC = fs.readFileSync(CFG.PAGE, 'utf8');"),
 ("p.goto('file://' + CUR)", "p.goto(CUR)", 6),
 ("p.goto('file://' + V285)", "p.goto(V285)", 2),
 ("path.join(ROOT, 'polish/e1/fixture-v285.json')", "path.join(CFG.FIX, 'fixture-v285.json')", 2),
])
edit('e1test.js', [
 ("/* E1 functional checks. Usage: node e1test.js <test-icons.html> */",
  "/* E1 functional checks. Usage: node tests/e1test.js <page URL> <v285 fixture> (tests/run.mjs passes both) */"),
 ("await p.goto('file://' + FILE);", "await p.goto(FILE);"),
 ('''  /* Export now goes through the artifact downloads capability; without a viewer it stays hidden. */
  ok('export: hidden when the downloads capability is unavailable', await p.evaluate(() => document.getElementById('expBtn').hidden));''',
  '''  /* Export: outside claude.ai (no window.claude.use) it is a plain Blob download (the check from before the downloads-capability version). */
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expBtn')]);
  const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')), live = await p.evaluate(() => state);
  ok('export: file equals the saved state', JSON.stringify(exported) === JSON.stringify(live) && /^aion2-assassin-progress-\\d{4}-\\d\\d-\\d\\d\\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());'''),
])
edit('e1-migtest.js', [("await p.goto('file://' + file);", "await p.goto(file);")])
edit('e2test.js', [
 ("/* E2 functional checks. Usage: node e2test.js <test-icons.html> (run from the scratchpad root; reads data/*.json).",
  "/* E2 functional checks. Usage: node tests/e2test.js <page URL> (reads data/*.json and dist/index.html)."),
 ("ROOT = path.resolve(__dirname, '..', '..'), KEY", "ROOT = path.resolve(__dirname, '..'), KEY"),
 ("const SRC = fs.readFileSync(path.join(ROOT, 'assassin-route.html'), 'utf8');", "const SRC = fs.readFileSync(require('./config').PAGE, 'utf8');"),
 ("if (!/^(file|data|blob):/.test(u)) reqs.add(u.split('?')[0]);", "if (!/^(file|data|blob):/.test(u) && !u.startsWith(require('./config').BASE + '/')) reqs.add(u.split('?')[0]); /* same origin = local, like file:// */"),
 ("await p.goto('file://' + FILE);", "await p.goto(FILE);"),
 ("ok('no external requests besides Google Fonts', [...reqs].every(u => /fonts\\.googleapis\\.com/.test(u)), [...reqs]);",
  "ok('no external requests besides Google Fonts', [...reqs].every(u => /^https:\\/\\/fonts\\.(googleapis|gstatic)\\.com\\//.test(u)), [...reqs]); /* stylesheet + the font files it names (only where the network allows) */"),
])
edit('e2-migtest.js', [
 ("/* E2 migration check (extends polish/e1/migtest.js). Usage:\n     node migtest-e2.js <pre-E2 page> <E2 page> <v285 fixture>",
  "/* E2 migration check (extends tests/e1-migtest.js). Usage:\n     node tests/e2-migtest.js <pre-E2 page URL> <current page URL> <v285 fixture>"),
 ("(exact E4 values are checked in polish/e4/e4test.js)", "(exact E4 values are checked in tests/e4test.js)"),
 ("await p.goto('file://' + file);", "await p.goto(file);"),
 ("fs.writeFileSync(__dirname + '/fixture-v287.json', JSON.stringify(S, null, 1));",
  "fs.mkdirSync(require('./config').OUT, { recursive: true }); fs.writeFileSync(require('path').join(require('./config').OUT, 'fixture-v287.json'), JSON.stringify(S, null, 1));"),
])
for p in ('e3test.js', 'e4test.js'):
    pairs = [
     ("const ROOT = path.resolve(__dirname, '..', '..');", "const ROOT = path.resolve(__dirname, '..'); const CFG = require('./config');"),
     ("fs.readFileSync(path.join(ROOT, 'polish/qa/regress.js'), 'utf8')", "fs.readFileSync(path.join(__dirname, 'regress.js'), 'utf8')"),
     ("await p.goto('file://' + ROOT + '/qa-cur.html');", "await p.goto(CFG.CUR);"),
    ]
    if p == 'e3test.js': pairs.append(("/* E3 functional checks. node polish/e3/e3test.js  (uses qa-cur.html; run polish/qa/map.sh first) */", "/* E3 functional checks. node tests/e3test.js  (page at AION_BASE; see tests/config.js) */"))
    else:
        pairs.append(("/* E4 functional checks (QA3 findings 1-12). node polish/e4/e4test.js  (uses qa-cur.html; run polish/qa/map.sh first) */", "/* E4 functional checks (QA3 findings 1-12). node tests/e4test.js  (page at AION_BASE; see tests/config.js) */"))
        pairs.append(("const blk = fs.readFileSync(path.join(ROOT, 'polish/e2/gen-block.js'), 'utf8'), page = fs.readFileSync(path.join(ROOT, 'assassin-route.html'), 'utf8');",
                      "const blk = fs.readFileSync(CFG.GEN_BLOCK, 'utf8'), page = fs.readFileSync(CFG.PAGE, 'utf8');"))
    edit(p, pairs)
edit('journey.js', [
 ("/* QA3 journey: the user's v285 save -> current file, Lv 27 -> 45 by clicking. node polish/qa3/journey.js [toLv] */",
  "/* QA3 journey: the user's v285 save -> current page, Lv 27 -> 45 by clicking. node tests/journey.js [toLv]  (log: tests/out/journey/journey.log) */"),
 ("const ROOT = path.resolve(__dirname, '..', '..'), KEY = 'aion2-assassin-route-v4', OUT = __dirname, SH = path.join(OUT, 'shots');",
  "const CFG = require('./config'); const ROOT = CFG.ROOT, KEY = 'aion2-assassin-route-v4', OUT = path.join(CFG.OUT, 'journey'), SH = path.join(OUT, 'shots');"),
 ("fs.readFileSync(path.join(ROOT, 'polish/qa/fixture-user-v285.json'), 'utf8')", "fs.readFileSync(path.join(CFG.FIX, 'fixture-user-v285.json'), 'utf8')"),
 ("await p.goto('file://' + ROOT + '/qa-v285.html');", "await p.goto(CFG.V285);"),
 ("await p.goto('file://' + ROOT + '/qa-cur.html');", "await p.goto(CFG.CUR);"),
])
edit('lib.js', [
 ("const ROOT = path.resolve(__dirname, '..', '..'), KEY = 'aion2-assassin-route-v4', OUT = __dirname;",
  "const CFG = require('./config'); const ROOT = CFG.ROOT, KEY = 'aion2-assassin-route-v4', OUT = path.join(CFG.OUT, 'journey');"),
 ("fs.readFileSync(path.join(ROOT, 'polish/qa/fixture-user-v285.json'), 'utf8')", "fs.readFileSync(path.join(CFG.FIX, 'fixture-user-v285.json'), 'utf8')"),
 ("await p.goto('file://' + ROOT + '/qa-v285.html');", "await p.goto(CFG.V285);"),
 ("await p.goto('file://' + ROOT + '/qa-cur.html');", "await p.goto(CFG.CUR);"),
])
print('done')
