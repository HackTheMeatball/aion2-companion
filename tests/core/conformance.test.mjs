/* Pack conformance (0.4 P6, docs/plans/0.4/P6-fake-pack.md): what every pack chain passes, run for the AION 2 Assassin chain
   and for a fake game (tests/fixtures/packs/fakegame/: a game pack and a guide pack, three story quests, one milestone
   with two steps, one source site). "The engine holds no AION 2" is proved by running it on a game that isn't AION 2.
     1. the generator (tools/gen/gen.mjs generate({ root, pack }), the CLI's --root / --pack) builds it with 0 failed
        checks: engine checks for every pack, a pack's own checks only where its manifests declare them (P6a);
     2. a fresh v5 save through memoryStorage: Lv 1 on the first story quest;
     3. rankNext with the pack's producers: the story card on the first quest comes first; turning the quest in moves
        Next up on; the gated step (the first step whose gate waits on a quest being turned in) stays out until then;
     4. save, reload, merge() with itself: unchanged;
     5. the fake chain (the engine, src/core/ and src/cards/, plus the fake pack's code) loads no module of a pack
        under src/packs/ (esbuild's import graph).
   The AION 2 chain runs on M (tests/support/core-bundle.mjs, the bundle the core suite tests); the fake chain on a bundle
   of its own built here, so the two packs never share an engine instance. Node only: the fake game has no page build. */
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { generate } from '../../tools/gen/gen.mjs';
import { DEFAULT_PACK, DEFAULT_ROOT } from '../../tools/gen/packs.mjs';
import { generatedData } from '../../scripts/generated-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FAKE_ROOT = join(ROOT, 'tests/fixtures/packs'), FAKE_PACK = 'fakegame/guide';
const FAKE_CODE = join(FAKE_ROOT, 'fakegame/fakegame.js');

/* step 1: the generator on one chain; a throw (a broken reference the compile step can't resolve) counts as a failure */
const gen = opts => { try { const g = generate(opts); return { g, failed: g.failed.map(c => c.check) }; } catch (e) { return { g: null, failed: ['generator threw: ' + e.message] }; } };

/* The fake chain's bundle: every engine module (src/core/, src/cards/) and the fake pack's code, with its generated data
   served as "fakegame:data"; usePack(fakegamePack) as the page would. The AION 2 data plugin is there too, only so a
   planted engine import of src/packs/aion2/ still builds and shows up in the import graph (step 5) instead of failing
   the build. Returns the namespace and the bundle's inputs (paths relative to the repo, virtual modules as "ns:path"). */
const fakeGen = gen({ root: FAKE_ROOT, pack: FAKE_PACK });
const fakeData = { name: 'fakegame-data', setup(b) {
  b.onResolve({ filter: /^fakegame:data$/ }, () => ({ path: 'data', namespace: 'fakegame' }));
  b.onLoad({ filter: /.*/, namespace: 'fakegame' }, () => ({ contents: fakeGen.g.module + fakeGen.g.gateModule + fakeGen.g.proposedModule, loader: 'js' }));
} };
const fakeBundle = async () => {
  const js = d => readdirSync(join(ROOT, 'src', d)).filter(f => f.endsWith('.js')).sort().map(f => `export * from "./${d}/${f}";`);
  const ENTRY = [...js('core'), ...js('cards'),
    `import { fakegamePack } from ${JSON.stringify(FAKE_CODE)};`, 'import { usePack as __usePack } from "./core/pack.js";', '__usePack(fakegamePack);'].join('\n');
  const r = await build({ stdin: { contents: ENTRY, resolveDir: join(ROOT, 'src'), loader: 'js', sourcefile: 'fakegame-entry.js' }, absWorkingDir: ROOT,
    bundle: true, write: false, metafile: true, format: 'esm', platform: 'neutral', treeShaking: false, logLevel: 'silent', plugins: [fakeData, generatedData] });
  const inputs = Object.keys(r.metafile.inputs).map(p => /^[\w-]+:/.test(p) ? p : relative(ROOT, resolve(ROOT, p)).split(sep).join('/'));
  return { E: await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64')), inputs };
};
const FAKE = fakeGen.g ? await fakeBundle() : null;

/* The shell's "Turned in" (src/main.js), the part the engine sees: every objective done, then the next quest, or
   storyEnd on the last one. */
const turnIn = (E, state) => {
  const c = E.char(state), { quests, steps } = E.activePack().data.story, i = E.questIdx(c);
  if (steps[c.quest]) (c.qsteps = c.qsteps || {})[c.quest] = steps[c.quest].map((_, j) => j);
  if (i === quests.length - 1) c.storyEnd = c.quest; else c.quest = quests[i + 1][1];
};
const atomsOf = g => g.all ? g.all.flatMap(atomsOf) : g.any ? g.any.flatMap(atomsOf) : [g];
/* the gated step: the first step node (catalog order) whose gate waits on a quest being turned in and on nothing but
   story and level atoms, so the story position and the level alone open it */
const gatedStepOf = graph => {
  for (const n of Object.values(graph.nodes)) {
    if (n.kind !== 'step') continue;
    const at = atomsOf(n.req), turn = at.find(a => a.story && a.is === 'turnedIn');
    if (turn && at.every(a => a.story || a.level !== undefined)) return { k: n.key, qi: turn.i, lv: Math.max(1, ...at.filter(a => a.level !== undefined).map(a => a.level)) };
  }
  return null;
};
const NOW_MS = 1_760_000_000_000, NOW_S = NOW_MS / 1000;

/* steps 2-4 on one chain's engine E (its pack already set) */
const runChain = (test, name, E) => {
  const P = E.activePack(), quests = P.data.story.quests, store = E.memoryStorage();
  const { state, hadSave } = E.loadState(store.get(E.KEY), { now: NOW_MS, newId: () => 'slot-1' });
  const save = () => { E.stampSave(state, NOW_MS); assert.equal(store.set(E.KEY, JSON.stringify(state)), true, 'stored'); };
  E.migrate(state, hadSave, save, NOW_S);
  const c = E.char(state);
  const cards = () => E.rankNext(state), keys = () => cards().filter(x => x.x).map(x => x.x.k);
  test(`${name} 2: a fresh v5 save through memoryStorage starts at Lv 1 on the first story quest`, () => {
    assert.equal(hadSave, false);
    assert.equal(state.v, 5); assert.equal(E.SAVE_V, 5);
    assert.deepEqual([c.level, c.quest, c.pack], [1, quests[0][1], P.character.pack]);
    save();
    assert.equal(JSON.parse(store.get(E.KEY)).chars['slot-1'].quest, quests[0][1]);
  });
  test(`${name} 3: rankNext puts the story card on the first quest first; turning it in moves Next up on`, () => {
    const first = cards()[0];
    assert.deepEqual([first.kind, first.quest], ['story', quests[0][1]]);
    turnIn(E, state);
    const next = cards()[0];
    assert.deepEqual([next.kind, next.quest], ['story', quests[1][1]]);
  });
  const gs = gatedStepOf(P.data.graph);
  test(`${name} 3: the gated step (${gs && gs.k}) stays out of Next up until its quest is turned in`, () => {
    assert.ok(gs, 'the chain has a step gated on a turned-in quest');
    c.level = gs.lv; c.quest = quests[gs.qi][1];
    assert.ok(!keys().includes(gs.k), `${gs.k} shown while "${c.quest}" is not turned in`);
    turnIn(E, state);
    assert.ok(keys().includes(gs.k), `${gs.k} not shown after "${quests[gs.qi][1]}" is turned in: ${JSON.stringify(cards().map(x => x.kind + ':' + (x.x ? x.x.k : x.quest || '')))}`);
    c.checks[gs.k] = true;
    assert.ok(!keys().includes(gs.k), 'a ticked step leaves Next up');
  });
  test(`${name} 4: save, reload and merge() with itself leave the save unchanged`, () => {
    save();
    const raw = store.get(E.KEY), saved = JSON.parse(raw);
    let wrote = false;
    const { state: s2, hadSave: had2 } = E.loadState(raw, { now: NOW_MS, newId: () => 'other' });
    E.migrate(s2, had2, () => { wrote = true; }, NOW_S);
    assert.equal(had2, true); assert.equal(wrote, false, 'a reload writes nothing');
    assert.deepEqual(s2, saved, 'reloaded = saved');
    assert.deepEqual(E.merge(s2, s2), s2, 'merge(save, save) = save');
    assert.deepEqual(E.char(s2).checks, c.checks); assert.equal(E.char(s2).quest, c.quest);
  });
  return state;
};

export default (test, M) => {
  /* ---------- the AION 2 Assassin chain (M: the core suite's bundle, aion2Pack set) ---------- */
  const A = 'conformance [aion2/asmodian/assassin]';
  test(`${A} 1: the generator builds it with 0 failed checks (engine checks + the pack's checks.mjs)`, () => {
    const { g, failed } = gen({ root: DEFAULT_ROOT, pack: DEFAULT_PACK });
    assert.deepEqual(failed.slice(0, 5), []);
    assert.deepEqual(g.B.packChecks.map(p => p.pack), ['aion2'], 'AION 2 declares its own checks');
    assert.deepEqual(M.activePack().data.graph, g.gateGraph, 'the pack the engine runs carries this build\'s GATE_GRAPH');
  });
  runChain(test, A, M);

  /* ---------- the fake game ---------- */
  const F = `conformance [${FAKE_PACK}]`;
  test(`${F} 1: the generator builds it with 0 failed checks (engine checks only)`, () => {
    assert.deepEqual(fakeGen.failed.slice(0, 5), []);
    assert.ok(fakeGen.g.report.checks.length > 0);
    assert.deepEqual(fakeGen.g.B.packChecks, [], 'no pack checks declared');
    assert.deepEqual(FAKE.E.activePack().data.graph, fakeGen.g.gateGraph);
    assert.equal(FAKE.E.activePack().id, 'fakegame');
  });
  test(`${F} 1: negative control: a copy with a broken gate reference fails the generator`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'fakegame-'));
    try {
      cpSync(join(FAKE_ROOT, 'fakegame'), join(dir, 'fakegame'), { recursive: true });
      const f = join(dir, 'fakegame/guide/steps.json'), doc = JSON.parse(readFileSync(f, 'utf8'));
      const gated = doc.records.find(r => r.id === 'f2:1').requires.all.find(a => a.story);
      assert.equal(gated.is, 'turnedIn'); gated.story = 'sq:10009';
      writeFileSync(f, JSON.stringify(doc));
      const { failed } = gen({ root: dir, pack: FAKE_PACK });
      assert.ok(failed.length && failed.some(x => x.includes('sq:10009')), JSON.stringify(failed));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  if (!FAKE) return;
  const fs = runChain(test, F, FAKE.E);
  test(`${F} 3: the pack's producer runs: its card ranks after the story card on the last quest`, () => {
    const cards = FAKE.E.rankNext(fs).map(x => x.kind);
    assert.deepEqual(cards.filter(k => k === 'story' || k === 'fakeEnd'), ['story', 'fakeEnd']);
  });
  test(`${F} 5: the fake chain loads no module from src/packs/ (import graph)`, () => {
    const packs = FAKE.inputs.filter(p => p.startsWith('src/packs/') || p.startsWith('generated:'));
    assert.deepEqual(packs, [], `${packs.length} pack module(s) loaded: ${packs.slice(0, 4).join(', ')}`);
    assert.ok(FAKE.inputs.includes('tests/fixtures/packs/fakegame/fakegame.js') && FAKE.inputs.includes('src/core/nextup.js'), JSON.stringify(FAKE.inputs));
  });
};
