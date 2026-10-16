"""Kibelisk table (Data & Research, 2026-10-15): the first story step per Kibelisk and the 0.4 binding class.

Reads data/shared/asmodian/{story,regional}-quests.json, the derived-position CSV, Metabot's Altgard Kibelisk listing
(parsed to altgard61.json) and cached Metabot quest pages (for step distances the repo does not store).
Rules (DECISIONS "Kibelisk binding (0.4)"): d <= 25 m auto-bound, 25 < d <= 150 nudge, d > 150 none.

Usage: python3 -I kibelisks.py <scratch dir with altgard61.json and q/*.html> <repo root> <out csv> <out json>
"""
import csv, json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
from extract import flight, spots  # noqa: E402

SC, ROOT, OUTCSV, OUTJSON = sys.argv[1:5]
ST = json.load(open(f'{ROOT}/data/shared/asmodian/story-quests.json'))['records']
RQ = json.load(open(f'{ROOT}/data/shared/asmodian/regional-quests.json'))['records']
LIST = json.load(open(f'{SC}/altgard61.json'))  # [name, zone, level range]
POS = {r['kibelisk']: r for r in csv.DictReader(open(f'{ROOT}/data/research/kibelisk-positions-metabot-2026-10.csv'))}
ISH = {'Aldelle Village', "Witch's Cabin", 'Abandoned Barracks Site'}


def cls(d):
    if d is None: return 'unknown'
    return 'auto-bound' if d <= 25 else 'nudge' if d <= 150 else 'none'


def nsteps(slug):
    """Number of 'Step n' blocks on the page (the 'step-start' / 'step-end' blocks excluded)."""
    return len(set(re.findall(r'"id":"step-(\d+)"', flight(f'{SC}/q/{slug}.html'))))


def page(slug):
    p = f'{SC}/q/{slug}.html'
    if not os.path.exists(p): return None
    s = spots(flight(p))
    out = {}
    for x in json.loads(s) if s else []:
        k = x.get('kisk')
        if isinstance(k, dict) and 'name' in k: out[x['mark']] = (k['name'], k['d'])
    return out


events, mism, fetched = [], [], []  # dict per point: qi, ord, kib, m, role, quest, lv, what, page
for qi, r in enumerate(ST):
    slug = next(s['url'].rsplit('/', 1)[1] for s in r['sources'] if 'metabot.gg/en/aion-2/quests/' in s.get('url', ''))
    pg = page(slug)
    if pg is not None: fetched.append(r['name'])
    g, t = r.get('giver') or {}, r.get('turnin') or {}
    # Our step list normally equals the page's steps one to one (16 of 17 pages). "The Being Beneath the Lake" has one
    # extra leading step in ours ("Bind with the Witch's Cabin Kibelisk"), which the page shows as the quest start.
    body = len(r['steps']) - (1 if r['steps'] and r['steps'][-1]['text'].startswith('Turn in') else 0)
    off = body - nsteps(slug) if pg is not None else 0
    assert off in (0, 1), (r['name'], off)

    def add(order, kib, m, role, what):
        events.append(dict(qi=qi, ord=order, kib=kib, m=m, role=role, quest=r['name'], lv=r['lv'], what=what, page=pg is not None))

    gp = (pg or {}).get('S') or (pg or {}).get('S·T')
    if gp: add(0, gp[0], gp[1], 'giver', 'giver ' + str(g.get('npc')))
    elif g.get('kibelisk'): add(0, g['kibelisk'], g.get('meters'), 'giver', 'giver ' + str(g.get('npc')))
    for s in r['steps']:
        m = re.findall(r'\(Kibelisk: ([^)]*)\)', s['text'])
        txt = s['text'].split(' (Kibelisk')[0]
        key = str(s['i'] + 1 - off)
        if pg is not None and s['i'] < off and 'S' in pg:
            add(1 + s['i'], pg['S'][0], pg['S'][1], 'step', f'step {s["i"]+1}: {txt}')
        elif pg is not None and key in pg:
            n, d = pg[key]
            if m and m[0] != n: mism.append((r['name'], s['i'], m[0], n))
            add(1 + s['i'], n, d, 'step', f'step {s["i"]+1}: {txt}')
        elif pg is None and m:
            add(1 + s['i'], m[0], None, 'step', f'step {s["i"]+1}: {txt}')
    tp = (pg or {}).get('T') or (pg or {}).get('S·T')
    if tp: add(99, tp[0], tp[1], 'turn-in', 'turn-in ' + str(t.get('npc')))
    elif t.get('kibelisk'): add(99, t['kibelisk'], t.get('meters'), 'turn-in', 'turn-in ' + str(t.get('npc')))

# regional quests: giver / turn-in / steps carry kibelisk + meters
reg = {}
for r in RQ:
    pts = [r.get('giver') or {}, r.get('turnin') or {}] + list(r.get('steps') or [])
    for p in pts:
        if p.get('kibelisk') and p.get('meters') is not None:
            reg.setdefault(p['kibelisk'], []).append((p['meters'], r['name']))

names = {x[0]: x for x in LIST}
for k in ISH: names.setdefault(k, [k, 'Ishalgen (' + k + ')', '—'])
for e in events: names.setdefault(e['kib'], [e['kib'], '', ''])
for k in reg: names.setdefault(k, [k, '', ''])
for k in POS: names.setdefault(k, [k, '', ''])

rows = []
listed = {x[0] for x in LIST}
for k, (n, zone, lvl) in names.items():
    ev = sorted([e for e in events if e['kib'] == k], key=lambda e: (e['qi'], e['ord']))
    f = ev[0] if ev else None
    known = [e for e in ev if e['m'] is not None]
    b = min(known, key=lambda e: (e['m'], e['qi'])) if known else None
    fa = next((e for e in known if e['m'] <= 25), None)
    fn = next((e for e in known if e['m'] <= 150), None)
    ish = n in ISH
    pos = POS.get(n, {})
    rg = min(reg[k]) if k in reg else None
    lab = lambda e: e['quest'] + ' / ' + e['what']
    rows.append(dict(
        kibelisk=n, map='Ishalgen' if ish else 'Altgard', zone=n if ish else zone,
        level_range=lvl, listed_by_metabot='yes' if n in listed else ('count only (3 on the Ishalgen map)' if ish else 'no'),
        x=pos.get('x', ''), y=pos.get('y', ''), pos_confidence=pos.get('confidence', ''),
        first_quest=f['quest'] if f else '', first_quest_lv=f['lv'] if f else '', first_point=f['what'] if f else '',
        first_m='' if not f or f['m'] is None else f['m'],
        first_m_source='' if not f else ('metabot page' if f['page'] else 'story-quests.json'),
        first_class=cls(f['m']) if f else 'not in story',
        first_known_within_150=lab(fn) if fn else '', first_known_within_150_m=fn['m'] if fn else '',
        ever_class=cls(b['m']) if b else ('not in story' if not ev else 'unknown'),
        best_known_m=b['m'] if b else '', best_known_where=lab(b) if b else '',
        first_autobound=lab(fa) if fa else '', first_autobound_m=fa['m'] if fa else '',
        first_story_order=f['qi'] + 1 if f else '',
        story_points=len(ev), story_points_known=len(known),
        regional_best_m=rg[0] if rg else '', regional_best_quest=rg[1] if rg else '', regional_points=len(reg.get(k, [])),
    ))
rows.sort(key=lambda r: (r['first_story_order'] == '', r['first_story_order'] or 0, r['kibelisk']))
w = csv.DictWriter(open(OUTCSV, 'w', newline=''), fieldnames=list(rows[0]), lineterminator='\n')
w.writeheader(); w.writerows(rows)
json.dump(dict(rows=rows, fetched=fetched, mismatches=mism), open(OUTJSON, 'w'), indent=1)
print(len(rows), 'rows;', len(fetched), 'pages;', 'mismatches', mism)
