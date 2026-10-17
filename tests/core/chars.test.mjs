/* Characters in the engine (0.5 P17, src/core/chars.js): add, switch, rename, remove a slot of save v5; the pack's playable
   classes (definePack `classes`, packClasses) and newChar's class input. Every call leaves the input unwritten (deep-frozen
   saves) and every other slot byte-identical (same object, same JSON). */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const json = p => JSON.parse(readFileSync(new URL('../../' + p, import.meta.url), 'utf8'));
/* the page's slot ids (src/shell/ids.js), loaded as an ES module (the package has no "type") */
const { newId } = await import('data:text/javascript;base64,' + readFileSync(new URL('../../src/shell/ids.js', import.meta.url)).toString('base64'));
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const tiny = () => ({ id: 'tiny', data: { graph: { story: [['q:1', 'First']], nodes: { 'a': { kind: 'step', key: 'a', req: { all: [] }, done: ['tick'] } } }, story: { quests: [[1, 'First']], steps: {} } },
  catalog: { milestones: [{ id: 'm1', lv: 1, items: [{ k: 'a', t: '<b>Do A</b>' }] }], routes: [] } });
const withPack = (M, p, fn) => { M.usePack(p); try { return fn(); } finally { M.usePack(M.aion2Pack); } };

export default (test, M) => {
  /* three slots, b current, with progress in each */
  const three = () => {
    const s = M.newSave({ now: 1, id: 'a' });
    s.chars.b = { ...M.newChar({ now: 2, id: 'b' }), name: 'Bee', level: 30, checks: { 'g6:0': true }, mt: { checks: { 'g6:0': [5, true] } } };
    s.chars.c = { ...M.newChar({ now: 3, id: 'c' }), level: 12 };
    s.current = 'b'; s.mode = 'basic';
    return deepFreeze(s);
  };
  /* the slots other than `except` are the same objects with the same JSON as in `before` */
  const othersSame = (before, after, except) => {
    for (const k of Object.keys(before.chars).filter(k => !except.includes(k))) {
      assert.equal(after.chars[k], before.chars[k], k); assert.equal(JSON.stringify(after.chars[k]), JSON.stringify(before.chars[k]), k);
    }
  };
  const viewSame = (before, after) => { for (const k of Object.keys(before).filter(k => k !== 'chars' && k !== 'current')) assert.deepEqual(after[k], before[k], k); };

  test('chars add: a new slot of the class, named, created now, becomes current; other slots and the view untouched; frozen input', () => {
    const s = three(), json0 = JSON.stringify(s);
    const r = M.addChar(s, { class: M.CLASS, name: '  Zed  ', now: 99, id: 'd' });
    assert.equal(r.current, 'd'); assert.deepEqual(Object.keys(r.chars), ['a', 'b', 'c', 'd']);
    assert.deepEqual(r.chars.d, { id: 'd', pack: M.PACK, class: M.CLASS, name: 'Zed', created: 99, checks: {}, level: 5, quest: '' });
    othersSame(s, r, ['d']); viewSame(s, r); assert.equal(JSON.stringify(s), json0);
  });
  test('chars add: no class = the pack\'s character; no name = ""; a taken or missing id and an unlisted class throw', () => {
    const s = three();
    assert.deepEqual(M.addChar(s, { id: 'd' }).chars.d, M.newChar({ id: 'd' }));
    assert.throws(() => M.addChar(s, { id: 'b' }), /taken/);
    assert.throws(() => M.addChar(s, {}), /slot id/);
    assert.throws(() => M.addChar(s, { id: 'd', class: 'nope' }), /playable class/);
  });
  test('chars switch: current moves; every slot and the view untouched; an unknown slot throws; frozen input', () => {
    const s = three(), json0 = JSON.stringify(s);
    const r = M.switchChar(s, 'c');
    assert.equal(r.current, 'c'); assert.equal(M.char(r), s.chars.c); othersSame(s, r, []); viewSame(s, r);
    assert.equal(M.switchChar(s, 'b').current, 'b');
    for (const id of ['x', '', undefined, 'toString', '__proto__']) assert.throws(() => M.switchChar(s, id), /no such slot/, String(id));
    assert.equal(JSON.stringify(s), json0);
  });
  test('chars rename: trimmed, white space and control characters folded, capped at NAME_MAX code points; only that slot changes; frozen input', () => {
    const s = three(), json0 = JSON.stringify(s);
    const r = M.renameChar(s, 'a', ' \t Night\n\u0000Shade  ');
    assert.equal(r.chars.a.name, 'Night Shade'); assert.equal(r.current, 'b');
    assert.deepEqual({ ...r.chars.a, name: '' }, s.chars.a); othersSame(s, r, ['a']); viewSame(s, r);
    assert.equal(M.renameChar(s, 'b', '').chars.b.name, '');
    assert.equal(M.renameChar(s, 'b', 42).chars.b.name, '');
    const long = M.renameChar(s, 'b', '😀'.repeat(40) + 'x').chars.b.name;
    assert.equal([...long].length, M.NAME_MAX); assert.equal(long, '😀'.repeat(M.NAME_MAX));
    assert.equal(M.renameChar(s, 'b', 'a'.repeat(M.NAME_MAX - 1) + ' b').chars.b.name, 'a'.repeat(M.NAME_MAX - 1), 'no trailing space after the cut');
    assert.throws(() => M.renameChar(s, 'x', 'Zed'), /no such slot/);
    assert.equal(JSON.stringify(s), json0);
  });
  test('chars remove: the slot goes, others untouched; current stays, or moves to the first remaining slot; frozen input', () => {
    const s = three(), json0 = JSON.stringify(s);
    const r1 = M.removeChar(s, 'c');
    assert.deepEqual(Object.keys(r1.chars), ['a', 'b']); assert.equal(r1.current, 'b'); othersSame(s, r1, ['c']); viewSame(s, r1);
    const r2 = M.removeChar(s, 'b');
    assert.deepEqual(Object.keys(r2.chars), ['a', 'c']); assert.equal(r2.current, 'a'); othersSame(s, r2, ['b']);
    assert.throws(() => M.removeChar(s, 'x'), /no such slot/);
    assert.equal(JSON.stringify(s), json0);
  });
  test('chars remove: the last character is refused', () => {
    const s = deepFreeze(M.newSave({ id: 'only' }));
    assert.throws(() => M.removeChar(s, 'only'), /last character/);
    const two = M.addChar(s, { id: 'two' }), one = M.removeChar(two, 'only');
    assert.deepEqual(Object.keys(one.chars), ['two']); assert.equal(one.current, 'two');
    assert.throws(() => M.removeChar(one, 'two'), /last character/);
  });
  /* a finding for 0.6 (sync), pinned so a change shows: merge() keeps a slot on one side only, so a character removed here
     comes back when another device's save (or an older export) still has it. P17 does not change merge(). */
  test('chars remove + merge (today): a slot removed locally comes back from a save that still has it', () => {
    const s = three(), r = M.removeChar(s, 'c'), m = M.merge(r, s);
    assert.deepEqual(Object.keys(m.chars).sort(), ['a', 'b', 'c']); assert.equal(m.current, 'b');
  });
  test('chars: a save after add / rename / switch / remove still loads as a v5 save with the same characters', () => {
    let s = M.newSave({ id: 'a' });
    s = M.addChar(s, { id: 'b', name: 'Zed' }); s = M.renameChar(s, 'a', 'Ann'); s = M.switchChar(s, 'a'); s = M.removeChar(s, 'b');
    const r = M.loadState(JSON.stringify(s));
    assert.equal(r.hadSave, true); assert.deepEqual(r.state, s);
  });
  /* the property test: ids from the page's newId (src/shell/ids.js), names from an alphabet without UUID characters
     (hex digits and "-") so a contained name can only mean the id was built from it */
  test('chars: a slot id never contains the name, class or level (1,000 random names, ids from newId)', () => {
    const ALPHA = 'ghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ _.!éßøÆ漢字😀';
    const chars = [...ALPHA];
    let seed = 20261017; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    let s = M.newSave({ id: newId() }), n = 0;
    for (let i = 0; i < 1000; i++) {
      const name = Array.from({ length: 1 + rnd(30) }, () => chars[rnd(chars.length)]).join('');
      const id = newId();
      s = M.addChar(s, { class: M.CLASS, name, now: i, id });
      s.chars[id] = { ...M.char(s), level: 1 + rnd(45) };
      s = M.renameChar(s, id, name.split('').reverse().join(''));
      const d = M.char(s), clean = M.cleanName(name);
      assert.equal(d.id, id); assert.equal(s.current, id); assert.ok(id in s.chars);
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      for (const w of [clean, d.name, d.class, 'lvl' + d.level, M.labelOf(d)].filter(Boolean)) assert.ok(!id.includes(w), `${id} contains ${w}`);
      n++;
    }
    assert.equal(n, 1000); assert.equal(Object.keys(s.chars).length, 1001);
  });

  test('classes: the AION 2 pack lists the one class with a guide pack; name, class and guide pack match data/', () => {
    assert.deepEqual(M.packClasses(), [{ class: M.CLASS, pack: M.PACK, name: 'Assassin' }]);
    assert.ok(Object.isFrozen(M.aion2Pack.classes) && M.aion2Pack.classes.every(Object.isFrozen));
    for (const e of M.packClasses()) {
      const cls = json(`data/packs/aion2/classes/${e.class}/class.json`), guide = json(`data/packs/${e.pack}/pack.json`);
      assert.equal(cls.records.find(r => r.id === 'class:' + e.class).name, e.name);
      assert.equal(guide.id, e.pack); assert.ok(guide.uses.includes('aion2/classes/' + e.class), e.pack);
      assert.ok(existsSync(new URL(`../../data/packs/${e.pack}/pack.json`, import.meta.url)));
    }
  });
  test('classes: newChar takes the class and guide pack from the chosen entry; an unlisted class throws', () => {
    assert.deepEqual(M.newChar({ id: 'x', class: M.CLASS, now: 7 }), { id: 'x', pack: M.PACK, class: M.CLASS, name: '', created: 7, checks: {}, level: 5, quest: '' });
    for (const c of ['gladiator', '', 'Assassin', null]) assert.throws(() => M.newChar({ id: 'x', class: c }), /playable class/, String(c));
    const p = M.definePack({ ...tiny(), character: { pack: 'tiny/b', class: 'b' }, classes: [{ class: 'a', pack: 'tiny/a', name: 'A' }, { class: 'b', pack: 'tiny/b', name: 'B' }] });
    withPack(M, p, () => {
      assert.deepEqual([M.newChar({ id: 'x', class: 'a' }).pack, M.newChar({ id: 'x', class: 'a' }).class], ['tiny/a', 'a']);
      assert.deepEqual([M.newChar({ id: 'x' }).pack, M.newChar({ id: 'x' }).class], ['tiny/b', 'b']);
      const s = M.addChar(M.newSave({ id: 's1' }), { id: 's2', class: 'a' });
      assert.equal(M.char(s).pack, 'tiny/a');
    });
  });
  test('classes: a pack without `classes` (the fake game\'s shape) falls back to its character', () => {
    const p = M.definePack(tiny());
    assert.equal(p.classes, undefined);
    assert.deepEqual(M.packClasses(p), [{ class: '', pack: 'tiny', name: '' }]);
    withPack(M, p, () => {
      assert.deepEqual(M.packClasses(), [{ class: '', pack: 'tiny', name: '' }]);
      assert.equal(M.newChar({ id: 'x', class: '' }).pack, 'tiny');
      const s = M.addChar(M.newSave({ id: 's1' }), { id: 's2', name: 'Zed' });
      assert.deepEqual([M.char(s).pack, M.char(s).class, M.char(s).name], ['tiny', '', 'Zed']);
    });
  });
  test('classes: definePack refuses an empty list, a bad entry, a class twice, or a character not in the list', () => {
    const e = (c, pack = 'tiny/' + c) => ({ class: c, pack, name: c.toUpperCase() });
    for (const bad of [[], {}, [{ class: 'a', pack: 'tiny/a' }], [{ class: '', pack: 'tiny', name: 'X' }], [e('a'), e('a', 'tiny/z')], ['a']])
      assert.throws(() => M.definePack({ ...tiny(), classes: bad }), /"classes" has the wrong type/, JSON.stringify(bad));
    assert.throws(() => M.definePack({ ...tiny(), character: { pack: 'tiny/z', class: 'z' }, classes: [e('a')] }), /"character" is not one of "classes"/);
    assert.throws(() => M.definePack({ ...tiny(), character: { pack: 'tiny/z', class: 'a' }, classes: [e('a')] }), /"character" is not one of "classes"/);
    const p = M.definePack({ ...tiny(), classes: [e('b'), e('a')] });
    assert.deepEqual(p.classes, [e('b'), e('a')]);
    assert.deepEqual(p.character, { pack: 'tiny/b', class: 'b' }, 'no character: the first class');
  });
};
