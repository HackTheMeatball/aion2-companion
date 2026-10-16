"""Story-quest locations from Metabot quest pages (Data & Research, 2026-10-15).

For the story quests on the placeholder zone `zone:altgard-unplaced`, reads each cached Metabot quest page and writes
data/research/story-locations-metabot-2026-10.csv: giver and turn-in NPC, Metabot's "Location" (its zone page), marker
position, nearest Kibelisk, and the registry zone with the rule that chose it.

Zone rules, in order (first match wins):
  metabot-location  Metabot's Location column names a zone our registry holds (same name)            -> verified
  registry-camp     Metabot's Location is listed as a camp / Kibelisk of a registry zone               -> inferred
  registry-kibelisk the nearest Kibelisk (<= 100 m, as gen.mjs's camp rule) is listed in a registry zone -> inferred
  (none)            stays zone:altgard-unplaced (owner-check), with the reason

Usage: python3 -I story_locations.py <cache dir> <urls.txt> <repo root>
The cache holds pages fetched once by fetch.sh (own User-Agent, >= 6 s apart); page copies are not committed.
"""
import csv, hashlib, html, json, re, sys

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from extract import flight, spots  # noqa: E402

CACHE, URLS, ROOT = sys.argv[1], sys.argv[2], sys.argv[3]
SQ = json.load(open(f'{ROOT}/data/packs/aion2/asmodian/story-quests.json'))['records']
ZN = [z for z in json.load(open(f'{ROOT}/data/packs/aion2/asmodian/zones.json'))['records'] if z['id'] != 'zone:altgard-unplaced']
BY_NAME = {z['name']: z['id'] for z in ZN}
CAMP = {k: z['id'] for z in ZN for k in (z.get('camps') or []) + (z.get('kibelisks') or [])}
BY_URL = {}
for r in SQ:
    for s in r['sources']:
        if s.get('url', '').startswith('https://metabot.gg/en/aion-2/quests/'):
            BY_URL.setdefault(s['url'], r)


def page(u):
    return f'{CACHE}/{hashlib.md5(u.encode()).hexdigest()[:16]}.html'


def table(t):
    """The 'Start & turn-in' table: Role | NPC | Map | Location (link to the zone page)."""
    t = re.sub(r'<script.*?</script>', '', t, flags=re.S)
    i = t.find('>Role<'); j = t.find('<section id="chain"', i)
    rows = {}
    for r in re.findall(r'<tr[^>]*>(.*?)</tr>', t[i:j], flags=re.S):
        cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, flags=re.S)
        txt = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', c))).strip() for c in cells]
        zs = re.findall(r'href="/en/aion-2/zones/([^"]+)"', ''.join(cells))
        if len(txt) == 4 and txt[0] in ('Quest giver', 'Turn in'):
            rows['giver' if txt[0] == 'Quest giver' else 'turnin'] = dict(npc=txt[1].split(' · ')[0], region=txt[2],
                                                                          loc=None if txt[3] in ('', '—') else txt[3], zslug=zs[0] if zs else '')
    return rows


def zone_for(loc, kib, m):
    if loc and loc in BY_NAME: return BY_NAME[loc], 'metabot-location'
    if loc and loc in CAMP: return CAMP[loc], 'registry-camp'
    if kib and m is not None and m <= 100 and kib in CAMP: return CAMP[kib], 'registry-kibelisk'
    return 'zone:altgard-unplaced', ''


def why(side, info, mk):
    if not info: return f'{side}: no {side} on the page (quest starts by itself)' if side == 'giver' else f'{side}: no turn-in on the page'
    if mk is None and not info['loc']: return f'{side}: no map point and no Location on the page'
    if mk and mk['map'] != 'World_D_A': return f"{side}: on map {mk['map']} ({info['region']}, Location {info['loc']}), outside the Altgard zone registry"
    k = mk['kisk']
    parts = [f"Location {info['loc']} is not a registry zone, camp or Kibelisk" if info['loc'] else 'no Location on the page']
    if k['name'] not in CAMP: parts.append(f"Kibelisk {k['name']} is in no zone record")
    elif k['d'] > 100: parts.append(f"Kibelisk {k['name']} is {k['d']} m away (over the 100 m camp rule)")
    return f'{side}: ' + '; '.join(parts)


rows = []
for u in open(URLS).read().split():
    t = open(page(u), errors='ignore').read()
    r = BY_URL[u]
    title = html.unescape(re.search(r'<title>([^<|]*) Quest Walkthrough', t).group(1).strip())
    assert title == r['name'], (title, r['name'])
    assert '· Asmodian · Lv.' in html.unescape(re.sub(r'<[^>]+>', '', t)), u
    assert 'global client (build 0.0.4387.0)' in t, u
    sp = json.loads(spots(flight(page(u))) or '[]')
    tb = table(t)

    def mark(kind):
        s = [x for x in sp if x.get('kind') == kind]
        if not s: return None
        s = s[0]; c = s.get('center')
        if not isinstance(c, list): c = s['goals'][0]['pts'][0]
        return dict(map=s['map'], x=c[0], y=c[1], kisk=s['kisk'], mark=s.get('mark'))

    g, e = mark('start'), mark('end')
    tmark = 'end' if e else ('S·T' if g and g['mark'] and 'T' in g['mark'].split('·') else 'none')
    if tmark == 'S·T': e = g
    out = dict(id=r['id'], name=r['name'], level=r['lv'], page_url=u)
    notes = []
    for side, info, mk in (('giver', tb.get('giver'), g), ('turnin', tb.get('turnin'), e)):
        loc = info['loc'] if info else None
        z, basis = zone_for(loc, mk and mk['kisk']['name'], mk and mk['kisk']['d']) if info and (not mk or mk['map'] == 'World_D_A') else ('zone:altgard-unplaced', '')
        out.update({f'{side}_npc': info['npc'] if info else '', f'{side}_location': loc or '',
                    f'{side}_location_page': f"https://metabot.gg/en/aion-2/zones/{info['zslug']}" if info and info['zslug'] else '',
                    f'{side}_map': mk['map'] if mk else '', f'{side}_x': mk['x'] if mk else '', f'{side}_y': mk['y'] if mk else '',
                    f'{side}_kib': mk['kisk']['name'] if mk else '', f'{side}_kib_m': mk['kisk']['d'] if mk else '',
                    f'{side}_zone': z, f'{side}_zone_basis': basis or 'placeholder'})
        if not basis: notes.append(why(side, info, mk))
    out['turnin_marker'] = tmark
    fin = re.search(r'To finish: Talk to (.+?) (?:at|in front of|near) (?:the entrance to )?(?:the )?([^.<]+)\.', html.unescape(re.sub(r'<[^>]+>', '', t)))
    out['turnin_finish_place'] = fin.group(2).strip() if fin else ''
    out['result'] = 'both zones' if all(out[f'{s}_zone_basis'] != 'placeholder' for s in ('giver', 'turnin')) else \
        'no zone' if all(out[f'{s}_zone_basis'] == 'placeholder' for s in ('giver', 'turnin')) else 'one zone'
    out['notes'] = ' | '.join(notes)
    rows.append(out)

cols = ['id', 'name', 'level', 'giver_npc', 'giver_location', 'giver_map', 'giver_x', 'giver_y', 'giver_kib', 'giver_kib_m',
        'giver_zone', 'giver_zone_basis', 'turnin_npc', 'turnin_location', 'turnin_marker', 'turnin_map', 'turnin_x', 'turnin_y',
        'turnin_kib', 'turnin_kib_m', 'turnin_finish_place', 'turnin_zone', 'turnin_zone_basis', 'result', 'page_url', 'giver_location_page',
        'turnin_location_page', 'notes']
w = csv.DictWriter(open(f'{ROOT}/data/research/story-locations-metabot-2026-10.csv', 'w', newline=''), fieldnames=cols, lineterminator='\n')
w.writeheader(); w.writerows(rows)
from collections import Counter
print(len(rows), 'rows;', Counter(r['result'] for r in rows), Counter(r[f'{s}_zone_basis'] for r in rows for s in ('giver', 'turnin')))
