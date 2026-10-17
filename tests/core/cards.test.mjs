/* The card registry (src/core/cards.js, 0.4 P4a; docs/design/0.4-engine-contract.md §4): call order (slots in their
   order, ascending order within a slot, a card's sections right after it), mount once, update every time, and the
   registration errors (unknown slot, duplicate id, duplicate order in a slot, undeclared section). Each test uses a
   fresh registry; the page's own one holds the Confidence and Sources cards (src/cards/sources.js). */
import assert from 'node:assert/strict';

export default (test, M) => {
  /* a registry and a call log: each card logs "mount:<id>" / "update:<id>" with the element and ctx it got */
  const setup = () => {
    const R = M.cardRegistry(), log = [];
    const card = (id, slot, order, extra = {}) => R.register({ id, slot, order, root: id + 'El',
      mount: (el, ctx) => log.push(['mount:' + id, el, ctx]), update: ctx => log.push(['update:' + id, ctx]), ...extra });
    return { R, log, card, calls: () => log.map(x => x[0]) };
  };

  test('cards: slots in CARD_SLOTS order, ascending order within a slot, not registration order', () => {
    assert.deepEqual(M.CARD_SLOTS, ['rail', 'top', 'main', 'foot', 'drawer']);
    const { R, card, calls } = setup();
    card('f3', 'foot', 300); card('d1', 'drawer', 100); card('f1', 'foot', 100); card('r2', 'rail', 200); card('m1', 'main', 100); card('r1', 'rail', 100); card('t1', 'top', 100);
    assert.deepEqual(R.cards().map(s => s.id), ['r1', 'r2', 't1', 'm1', 'f1', 'f3', 'd1']);
    R.updateAll({});
    assert.deepEqual(calls(), ['update:r1', 'update:r2', 'update:t1', 'update:m1', 'update:f1', 'update:f3', 'update:d1']);
  });
  test('cards: a card\'s sections run right after it (in declared order, then ascending order), before the next card', () => {
    const { R, card, calls } = setup();
    card('a', 'main', 100, { sections: ['after-timeline', 'foot-note'] }); card('b', 'main', 200);
    card('a2', 'a.after-timeline', 200); card('a1', 'a.after-timeline', 100, { sections: ['x'] }); card('an', 'a.foot-note', 100); card('ax', 'a1.x', 100);
    R.updateAll({});
    assert.deepEqual(calls(), ['update:a', 'update:a1', 'update:ax', 'update:a2', 'update:an', 'update:b']);
  });
  test('cards: mountAll mounts each card once, with els[root] and the ctx; a later mountAll mounts only new cards', () => {
    const { R, log, card, calls } = setup();
    const els = { aEl: { el: 'a' }, bEl: { el: 'b' } }, ctx = { basic: true };
    card('a', 'foot', 100); card('b', 'foot', 200);
    R.register({ id: 'noroot', slot: 'foot', order: 300, mount: (el, c) => log.push(['mount:noroot', el, c]) });
    R.mountAll(els, ctx);
    assert.deepEqual(calls(), ['mount:a', 'mount:b', 'mount:noroot']);
    assert.equal(log[0][1], els.aEl); assert.equal(log[1][1], els.bEl); assert.equal(log[2][1], null);
    assert.ok(log.every(x => x[2] === ctx));
    R.mountAll(els, ctx);
    assert.equal(log.length, 3, 'a second mountAll mounts nothing again');
    card('c', 'foot', 400); R.mountAll({ cEl: 'c' }, ctx);
    assert.deepEqual(calls().slice(3), ['mount:c']);
  });
  test('cards: updateAll calls every update every time with the ctx; update null = mount only; updateCard calls one', () => {
    const { R, log, card, calls } = setup();
    card('a', 'top', 100); card('m', 'top', 200, { update: null }); card('b', 'top', 300);
    const c1 = { n: 1 }, c2 = { n: 2 };
    R.updateAll(c1); R.updateAll(c2);
    assert.deepEqual(calls(), ['update:a', 'update:b', 'update:a', 'update:b']);
    assert.deepEqual(log.map(x => x[1]), [c1, c1, c2, c2]);
    R.updateCard('b', c1); R.updateCard('m', c1);
    assert.deepEqual(calls().slice(4), ['update:b']);
    assert.throws(() => R.updateCard('nope', c1), /not registered/);
  });
  test('cards: an unknown slot, a duplicate id or order, an undeclared section or a bad spec is rejected', () => {
    const { R, card } = setup();
    card('a', 'main', 100, { sections: ['s'] });
    assert.throws(() => card('x', 'sidebar', 100), /unknown slot "sidebar"/);
    assert.throws(() => card('x', undefined, 100), /unknown slot/);
    assert.throws(() => card('x', 'a.t', 100), /unknown slot "a.t"/, 'a section its card doesn\'t declare');
    assert.throws(() => card('x', 'zz.s', 100), /unknown slot "zz.s"/, 'a section of a card not registered');
    assert.throws(() => card('x', 'a.s.t', 100), /unknown slot/);
    assert.throws(() => card('a', 'top', 100), /registered twice/);
    assert.throws(() => card('x', 'main', 100), /order 100 is taken/);
    assert.throws(() => card('x', 'main', '200'), /numeric order/);
    assert.throws(() => R.register({ slot: 'main', order: 300 }), /needs an id/);
    assert.throws(() => card('x', 'main', 300, { update: 'no' }), /functions or null/);
    card('x', 'top', 100); card('y', 'a.s', 100); /* the same order in another slot is fine */
    assert.deepEqual(R.cards().map(s => s.id), ['x', 'a', 'y']);
    assert.ok(Object.isFrozen(R.cards()[0]));
  });
  test('cards: the page registry is a separate one (fresh registries share nothing)', () => {
    const a = M.cardRegistry(), b = M.cardRegistry();
    a.register({ id: 'one', slot: 'foot', order: 100 });
    assert.deepEqual(b.cards(), []);
    b.register({ id: 'one', slot: 'foot', order: 100 });
  });
  test('cards: the Confidence and Sources specs (src/cards/sources.js) register in the foot slot, mount only', () => {
    const R = M.cardRegistry();
    M.sourcesCards({ CONF: [], SOURCES: [], SRC_SITE: {} }).forEach(R.register);
    assert.deepEqual(R.cards().map(s => [s.id, s.slot, s.order, s.root, s.update]), [['confidence', 'foot', 200, 'confCard', null], ['sources', 'foot', 300, 'srcCard', null]]);
    const got = {}, el = id => ({ querySelector: q => (got[q] = { innerHTML: '' }) });
    R.mountAll({ confCard: el(), srcCard: el() }, {});
    assert.equal(got['#confBody'].innerHTML, '');
    assert.match(got['#srcBody'].innerHTML, /^<p class="fine src-intro">Every sourced value in the guide comes from one of these pages \(0 links/);
  });
};
