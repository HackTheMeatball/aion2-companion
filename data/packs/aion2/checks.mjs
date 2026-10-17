/* AION 2 pack checks (0.4 P6a): the cross-record checks that know this game, declared by data/packs/aion2/pack.json
   (`checks`) and called by tools/gen/gen.mjs after its engine checks as checks(ctx, check). ctx: the loaded bundle and the
   compiled tables (gen.mjs, "pack-declared checks"); check(name, ok, detail) is the generator's. Names and order are the
   ones these checks had inside gen.mjs (0.4 P6a moved them unchanged). No imports: a copied packs root runs as is. */
export function checks(ctx, check) {
  const { zones, chain, rqs, skills, stigmas, nodeById, boards, sds, shs, rules, builds, build, milestones, steps, asc, all, RQ, STORY_END, SH_DATA, atomsOf, byNum, refCheck } = ctx;
  const sk = id => { if (!ctx.skById[id]) throw new Error('unknown skill ' + id); return ctx.skById[id]; };

  /* ---------------------------------------------------------------- story */
  for (const s of chain) if (s.steps.length) check('story steps end with a turn-in: ' + s.name, /^Turn in/.test(s.steps[s.steps.length - 1].text));
  /* 0.3 E10: the data ends at "Daeva Trapped in a Nightmare"; the game's next story quest unlocks past the Lv 45 cap */
  check('story end names the next story quest past the cap', !!STORY_END.next && STORY_END.nextLv > 45, [STORY_END.next, STORY_END.nextLv]);

  /* ---------------------------------------------------------------- regional quests (in RQ order) */
  for (const q of rqs.slice().sort(byNum('order'))) {
    check('regional: at most one story gate: ' + q.name, atomsOf(q.requires).filter(a => a.story).length <= 1);
    check('regional: zone = giver zone: ' + q.name, q.zone === q.giver.zone);
    check('regional: id = key = rq:<gameId>: ' + q.name, q.id === 'rq:' + q.gameId && q.key === q.id);
  }
  check('58 regional quests', RQ.length === 58, RQ.length);
  check('every regional quest has unlocksAt and rec', RQ.every(x => x.unlocksAt && x.rec));
  /* a camp (giver place, or a Kibelisk within 100 m of the giver) belongs to one zone; a nearest Kibelisk further away
     may lie across a zone border (Pain Unending: Basfelt Waterfall 309 m) */
  { const cz = {}; for (const q of rqs) for (const a of [q.giver.meters != null && q.giver.meters <= 100 ? q.giver.kibelisk : null, q.giver.place]) if (a) (cz[a] = cz[a] || new Set()).add(q.zone);
    check('same giver camp/Kibelisk -> one zone', Object.values(cz).every(v => v.size === 1), Object.entries(cz).filter(([, v]) => v.size > 1).map(([k, v]) => [k, [...v]])); }
  check('Nine Wonders of Altgard: 2nd Leg is in Battlescar Mound (E4)', (RQ.find(x => x.name === 'Nine Wonders of Altgard: 2nd Leg') || {}).zone === 'Battlescar Mound');

  /* ---------------------------------------------------------------- strongholds, Sealed Dungeons, zones */
  check('15 strongholds', SH_DATA.length === 15);
  check('every stronghold has zone, range and Kibelisk', SH_DATA.every(x => x.zone && x.lo && x.hi && x.kib));
  for (const s of shs) check('stronghold pays no stones/crystals: ' + s.name, !s.rewards.wisdom && !s.rewards.crystal);
  const mapSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const d of sds) check('Sealed Dungeon key = <band prefix>:<slug>: ' + d.name, d.key === `${d.band === 10 ? 'g10h' : 'sd'}:${mapSlug(d.name)}` && d.id === 'sd:' + mapSlug(d.name));
  check('60 Sealed Dungeons', sds.length === 60, sds.length);
  const sdRule = rules['rule:sd-first-clear-asmodian'];
  check('Sealed Dungeon reward is 2 Wisdom Stones + 2 crystals in every sampled band', !!sdRule && sdRule.value.evidence.every(b => b.wisdom === 2 && b.crystal === 2));
  for (const z of Object.values(zones)) for (const c of [...(z.camps || []), ...(z.kibelisks || [])]) {
    const other = Object.values(zones).find(o => o !== z && [...(o.camps || []), ...(o.kibelisks || [])].includes(c));
    check(`camp/Kibelisk ${c} resolves to one zone`, !other, [z.id, other && other.id]);
  }

  /* ---------------------------------------------------------------- the guide build */
  const spSlots = rules['rule:specialty-slots'] ? rules['rule:specialty-slots'].value : { slots: [] };
  /* specialties (owner F4, Metabot): every active skill has the 5 choices at effective skill level 8 / 8 / 8 / 12 / 16 */
  for (const s of skills) if (s.type === 'active') check(`specialty choices 8/8/8/12/16: ${s.name}`, JSON.stringify((s.specialtyChoices || []).map(c => c.skillLv)) === '[8,8,8,12,16]', (s.specialtyChoices || []).map(c => c.skillLv));
    else check(`passive skill has no specialty choices: ${s.name}`, !s.specialtyChoices);
  check('specialty slots at effective level 8 / 12 / 20', JSON.stringify(spSlots.slots) === '[8,12,20]' && spSlots.levelBasis === 'effective');
  for (const [sid, picks] of Object.entries(build.specialtyPicks)) for (const p of picks) check(`specialty pick ${p} is a choice of ${sid}`, (sk(sid).specialtyChoices || []).some(c => c.id === p));
  check('specialty picks: at most 3 slots', Object.values(build.specialtyPicks).every(p => p.length <= spSlots.slots.length));
  /* one choice never fills two slots */
  for (const [sid, picks] of Object.entries(build.specialtyPicks)) check(`specialty picks of ${sid} are distinct`, new Set(picks).size === picks.length, picks);
  /* a pick beyond slot 1 needs a '2+ sources' entry in specialtyEvidence for that slot, witnessed by two or more publishers
     (hosts) that the build cites for specialtyPicks (owner on #75; research #77 at 8dd047d); no stale entries */
  const spEv = build.specialtyEvidence || {}, spSrc = new Set((build.sources || []).filter(r => r.url && (r.fields || []).includes('specialtyPicks')).map(r => r.url));
  for (const [sid, picks] of Object.entries(build.specialtyPicks)) picks.forEach((p, i) => { if (!i) return; const ev = spEv[p];
    check(`specialty pick ${p} (slot ${i + 1}) has 2+ source evidence`, ev && ev.slot === i + 1 && ev.label === '2+ sources' && ev.sources.every(u => spSrc.has(u))
      && new Set(ev.sources.map(u => new URL(u).hostname.replace(/^www\./, ''))).size >= 2, ev || 'no specialtyEvidence entry'); });
  for (const p of Object.keys(spEv)) check(`specialtyEvidence ${p} backs a pick in its slot`, Object.values(build.specialtyPicks).some(ps => ps[spEv[p].slot - 1] === p));
  /* game rules the build tables use (0.4 P2a): cost bands [{ from, to, cost }] run without a gap over the levels they
     price; node costs by node type are numbers */
  const bands = (id, lo, hi) => { const v = rules[id] ? rules[id].value : null;
    check(`${id}: bands run ${lo}–${hi} without a gap`, !!v && v.length > 0 && v[0].from === lo && v[v.length - 1].to === hi && v.every((b, i) => b.from <= b.to && (!i || b.from === v[i - 1].to + 1)), v); };
  bands('rule:skill-point-cost', 2, rules['rule:skill-level-gate'].value.maxFromPoints);
  bands('rule:stigma-shard-cost', 1, 20);
  const nc = rules['rule:node-costs'] ? rules['rule:node-costs'].value : {}, nodeCosts = { passive: nc.passive, active: nc.active, corner: nc.corner };
  check('rule:node-costs: passive / active / corner are numbers', Object.values(nodeCosts).every(Number.isInteger), nodeCosts);
  check('exactly one guide build, at most two community builds', builds.filter(b => b.origin === 'guide').length === 1 && builds.filter(b => b.origin === 'community').length <= 2);
  for (const e of build.boardPlan) if (e.anyNode) check('board plan any-of nodes on one board: ' + e.key, new Set(e.anyNode.map(n => nodeById[n].board)).size === 1);

  /* ---------------------------------------------------------------- Ascension */
  for (const a of asc) {
    if (a.guideStep) check(`ascension ${a.id}: guideStep ${a.guideStep} is a step`, steps.some(s => s.key === a.guideStep));
    for (const s of steps.filter(s => s.ascensionQuest === a.id)) check(`ascension ${a.id}: guideStep is ${s.key} (its ascensionQuest)`, a.guideStep === s.key, a.guideStep);
  }

  /* ---------------------------------------------------------------- Daevanion */
  /* one window gate, defined once on unlock:daevanion ("Urgent Pursuit" turned in, owner screen); every board inherits
     it (live since 0.3 E5; plan nodes inherit their board's), so no plan node repeats the story atom */
  { const ud = ctx.unlocks.find(u => u.id === 'unlock:daevanion');
    check('unlock:daevanion opens with "Urgent Pursuit" turned in', !!ud && atomsOf(ud.at).some(a => a.story === 'sq:2102065' && a.is === 'turnedIn'));
    for (const b of boards) check(`${b.id}: inherits the Daevanion window gate (done unlock:daevanion)`, !!b.requires && atomsOf(b.requires).some(a => a.done === 'unlock:daevanion'));
    for (const bl of builds) for (const e of bl.boardPlan) check(`${bl.id} boardPlan ${e.node || e.key}: no own copy of the window gate`,
      ![e.requires, e.proposed && e.proposed.requires].some(g => g && atomsOf(g).some(a => a.story === 'sq:2102065'))); }
  for (const e of build.boardPlan) check('board plan milestone resolves: ' + (e.node || e.key), milestones.some(m => m.id === e.milestone));
  for (const s of build.skillOrder) refCheck(build.id, s.skill);

  /* ---------------------------------------------------------------- class content */
  /* choice n: dense from 1, never renumbered (positions are save indices) */
  for (const { r } of all) if (r.specialtyChoices) check(`${r.id}: choice n = position + 1`, r.specialtyChoices.every((c, i) => c.n === i + 1));
  /* shared steps carry no class content outside build tokens: no skill or stigma name of this class */
  const classWords = [...stigmas.map(s => s.name)];
  for (const s of steps) for (const w of classWords) check(`shared step ${s.id} names no stigma outside a build token`, !(s.text + (s.loc || '')).includes(w));
  /* zone adjacency symmetric */
  for (const z of Object.values(zones)) for (const n of z.neighbours || []) check(`zone adjacency symmetric: ${z.id} - ${n.zone}`, (zones[n.zone] && (zones[n.zone].neighbours || []).some(x => x.zone === z.id)));

  /* ---------------------------------------------------------------- GATE_GRAPH */
  for (const q of rqs.slice().sort(byNum('order'))) {
    const lv = atomsOf(q.requires).filter(a => a.level !== undefined).map(a => a.level);
    check('GATE_GRAPH: regional level atom = unlocksAt: ' + q.id, lv.length === 1 && lv[0] === q.unlocksAt, lv);
  }
}
