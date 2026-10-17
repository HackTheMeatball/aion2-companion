"""Story-quest step points from Metabot quest pages (Data & Research, 2026-10-17; ROADMAP 0.5 research-step-points).

For each story quest page in <urls.txt> (the 51 story quests with step markers, location research §3), reads the cached
Metabot page and takes every step marker (`step-N` in the embedded "spots" array). N is the row's position in the page's
walkthrough list (`<li id="step-N">`, numbered or not), so marker N belongs to our objective `steps[N-1]` (our objective
lines were filled from the same list, issue #65). Each row is checked three ways: our objective title (text before
" — ") equals the page's row title (else 'reworded', with a similarity ratio); our `(Kibelisk: X)` marker equals Metabot's nearest Kibelisk; and per quest, our
objective title list equals the page's walkthrough list. Where the two lists differ in length, a
marker binds by best title match (ratio >= 0.6) instead of position. Writes data/research/story-step-points-metabot-2026-10.csv.

Point = Metabot's `center` for a step with several points (as the location research), else the single point.

Usage: python3 -I story_step_points.py <cache dir> <urls.txt> <repo root> [<quest summary json out>]
The cache holds pages fetched once by fetch.sh (own User-Agent, >= 6 s apart); page copies are not committed.
"""
import csv, difflib, hashlib, html, json, re, sys
from collections import Counter

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from extract import flight, spots  # noqa: E402

CACHE, URLS, ROOT = sys.argv[1], sys.argv[2], sys.argv[3]
SQ = json.load(open(f'{ROOT}/data/packs/aion2/asmodian/story-quests.json'))['records']
BY_URL = {}
for r in SQ:
    for s in r['sources']:
        if s.get('url', '').startswith('https://metabot.gg/en/aion-2/quests/'):
            BY_URL.setdefault(s['url'], r)


def page(u):
    return f'{CACHE}/{hashlib.md5(u.encode()).hexdigest()[:16]}.html'


def walk_rows(t):
    """Walkthrough list rows <li id="step-N" data-kind="step"> -> {N: (title, numbered on the page)}."""
    out = {}
    for n, body in re.findall(r'<li id="step-(\d+)"[^>]*data-kind="step">(.*?)</li>(?=<li id="step-|</ol>)', t, flags=re.S):
        m = re.search(r'_body"><span>(.*?)</span>', body, flags=re.S)
        out[int(n)] = (html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else '', 'noBadge' not in body)
    return out


def title(text):
    return re.sub(r' \(Kibelisk: [^)]+\)$', '', text.split(' — ')[0]).strip()


def kib(text):
    m = re.search(r'\(Kibelisk: ([^)]+)\)', text)
    return m.group(1) if m else ''


def ratio(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


rows, quests = [], []
for u in open(URLS).read().split():
    t = open(page(u), errors='ignore').read()
    r = BY_URL[u]
    name = html.unescape(re.search(r'<title>([^<|]*?)(?: Quest Walkthrough| – Quest Steps)? \|', t).group(1).strip())
    assert name == r['name'], (name, r['name'])
    build = re.search(r'global client \(build ([0-9.]+)\)', t).group(1)
    sp = json.loads(spots(flight(page(u))) or '[]')
    wr = walk_rows(t)
    ours = [s for s in r['steps'] if not s['text'].startswith('Turn in')]
    steps = [x for x in sp if x.get('kind') == 'step']
    same_len = len(wr) == len(ours) and sorted(wr) == list(range(1, len(ours) + 1))
    bound = set()
    for x in steps:
        n = int(x['id'].split('-')[1])
        c = x.get('center')
        if not isinstance(c, list): c = x['goals'][0]['pts'][0]
        pts = [p for g in x['goals'] for p in g['pts']]
        ptitle = wr.get(n, ('', False))[0]
        if same_len:
            mine = next((s for s in ours if s['i'] == n - 1), None)
        else:  # lists differ in length: align by title (best match, >= 0.6), never by position
            best = max(ours, key=lambda s: ratio(title(s['text']), ptitle), default=None)
            mine = best if best and ratio(title(best['text']), ptitle) >= 0.6 else None
        notes = []
        if not ptitle: notes.append('no walkthrough row for this marker')
        tagree, tr = '', ''
        if mine is None:
            notes.append('no objective at this position' if same_len else 'no objective with a matching title')
        else:
            tr = round(ratio(title(mine['text']), ptitle), 2)
            tagree = 'yes' if norm(title(mine['text'])) == norm(ptitle) else 'reworded'
            if tagree == 'reworded': notes.append(f'our title reworded; page "{ptitle}"')
            if not same_len and mine['i'] != n - 1: notes.append(f'our list is offset here (page row {n}, our objective {mine["i"]})')
        ok = kib(mine['text']) if mine else ''
        kagree = '' if not mine else ('no marker' if not ok else ('yes' if ok == x['kisk']['name'] else 'NO'))
        if kagree == 'NO': notes.append(f'our marker {ok} vs Metabot {x["kisk"]["name"]}')
        status = 'unbound' if not mine or kagree == 'NO' else 'confirmed' if tagree == 'yes' else 'confirmed-reworded'
        if status.startswith('confirmed'): bound.add(mine['i'])
        rows.append(dict(quest_id=r['id'], quest=r['name'], level=r['lv'], step_no=n, objective_i=mine['i'] if mine else '',
                         objective_title=title(mine['text']) if mine else '', title_agrees=tagree, title_ratio=tr,
                         map=x['map'], x=c[0], y=c[1], points=len(pts), all_points=';'.join(f'{a} {b}' for a, b in pts),
                         kibelisk=x['kisk']['name'], meters=x['kisk']['d'], our_kibelisk=ok, kibelisk_agrees=kagree,
                         status=status, build=build, page_url=u, notes=' | '.join(notes)))
    page_list = [norm(wr[k][0]) for k in sorted(wr)]
    quests.append(dict(id=r['id'], name=r['name'], url=u, markers=len(steps), objectives=len(ours), page_rows=len(wr),
                       page_unnumbered=sum(not v[1] for v in wr.values()), same_len=same_len,
                       unnumbered_i=[k - 1 for k, v in wr.items() if not v[1]],
                       list_agrees=[norm(title(s['text'])) for s in ours] == page_list,
                       unmarked=[dict(i=s['i'], text=s['text']) for s in ours if s['i'] not in bound]))

cols = list(rows[0])
w = csv.DictWriter(open(f'{ROOT}/data/research/story-step-points-metabot-2026-10.csv', 'w', newline=''), fieldnames=cols, lineterminator='\n')
w.writeheader(); w.writerows(rows)
if len(sys.argv) > 4: json.dump(quests, open(sys.argv[4], 'w'), indent=1)
print(len(quests), 'quests;', len(rows), 'markers;', Counter(x['status'] for x in rows), 'title', Counter(x['title_agrees'] for x in rows),
      'kib', Counter(x['kibelisk_agrees'] for x in rows), 'maps', Counter(x['map'] for x in rows), 'multi-point', sum(x['points'] > 1 for x in rows))
print('walkthrough list == our objective list:', Counter(q['list_agrees'] for q in quests), [q['name'] for q in quests if not q['list_agrees']])
print('objectives (excl. turn-in):', sum(q['objectives'] for q in quests), '; page rows:', sum(q['page_rows'] for q in quests),
      '; unnumbered page rows:', sum(q['page_unnumbered'] for q in quests), '; objectives without a confirmed point:', sum(len(q['unmarked']) for q in quests))
