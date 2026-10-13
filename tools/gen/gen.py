#!/usr/bin/env python3
"""Data generator: builds the generated data block (src/data/generated.js, via apply.py) from data/*.json.

Usage (from the repo root):  python3 -I tools/gen/gen.py  &&  python3 -I tools/gen/apply.py   (or: npm run gen)
Output: tools/gen/gen-block.js (the block between the E2-GEN markers in src/data/generated.js), tools/gen/gen-report.json
        (every consistency check + warnings) and data/DATA_SOURCES.md (every source URL and what it backs).
Exit status 1 if any consistency check fails.

Inputs (all read-only):
  data/rq.json, data/rq-chains.json            regional quests + prerequisites (R1)
  data/story.json, data/story-40-45.json       main story objectives and Kibelisks (R2 + earlier research)
  data/strongholds.json, data/dungeons.json, data/dungeon-bands.json   (R2)
  data/build.json                              skills, boards, stigmas (R3)
  data/claims.json                             text claims and verdicts (V1)
  tools/gen/snapshots/area-loc-v287.json       snapshot of the page's AREA_LOC before E2 (allthings.how map pages)
  tools/gen/snapshots/sources-v287.json        snapshot of the page's Sources card before E2
  tools/gen/snapshots/hideout-area-v288.json   Sealed Dungeon entrance -> zone (page snapshot before E3), zone votes
Every value written to the page comes from one of these; every URL in them goes into SOURCES.
"""
import json, re, os, sys
from collections import OrderedDict

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
D = lambda *p: os.path.join(ROOT, *p)
load = lambda p: json.load(open(D(p), encoding="utf-8"))

rq = load("data/rq.json")
chains = load("data/rq-chains.json")
story = load("data/story.json")
story45 = load("data/story-40-45.json")
sh = load("data/strongholds.json")
dun = load("data/dungeons.json")
bands = load("data/dungeon-bands.json")
build = load("data/build.json")
claims = {c["id"]: c for c in load("data/claims.json")}
area_old = load("tools/gen/snapshots/area-loc-v287.json")
src_old = load("tools/gen/snapshots/sources-v287.json")

report = {"warnings": [], "checks": []}
def check(name, cond, detail=None):
    report["checks"].append({"check": name, "pass": bool(cond), "detail": detail})
    if not cond:
        print("CHECK FAILED:", name, detail, file=sys.stderr)

# ---------------------------------------------------------------- regional quests
RQ_NAMES = {q["name"] for q in rq}
reg_edges, story_edges = {}, {}
for e in chains:
    if e["kind"] == "regional":
        check(f"chain confirmed: {e['quest']} <- {e['after']}", e["status"] == "confirmed")
        reg_edges.setdefault(e["quest"], []).append(e["after"])
    elif e["kind"] == "story":
        check(f"story gate confirmed: {e['quest']}", e["status"] == "confirmed")
        story_edges[e["quest"]] = e["after"]

def short_item(it):
    """Reward line in the guide's short form (accessories by slot; titles left out)."""
    if it.startswith("Title:"): return None
    m = re.match(r"^(.*?)\s+x(\d+)$", it)
    if m: return f"{m.group(1)} ×{m.group(2)}"
    m = re.match(r"^.*\b(Ring|Earrings|Bracelet|Necklace)$", it)
    if m: return m.group(1).lower()
    if it.startswith("Kina Chest: "):
        n = int(re.sub(r"\D", "", it.split(":")[1]))
        return f"{n // 1000}k Kina chest"
    if it.startswith("Kisk Summoning Stone: "): return it.split(": ")[1].lower() + " Kisk"
    if it == "Key: Hidden Cube": return "Hidden Cube key"
    if it.startswith("Artwork:"): return "Artwork"
    return it

# E3 (P1-9): one zone per giver camp / Kibelisk, and no camp names as zones. A quest's zone is the zone of its giver Kibelisk
# (else its giver place, else its own zone when that is a camp name) from CAMP_ZONE; otherwise allthings.how's zone stays.
# Each entry is the majority of the map data (Sealed Dungeon entrances: HIDEOUT_AREA snapshot + AREA_LOC Kibelisks;
# dungeons.json; strongholds.json; story steps "<zone> ... (Kibelisk: X)"), checked below against those votes.
hz = load("tools/gen/snapshots/hideout-area-v288.json")
ZONES = set(hz.values()) | {s["zone"] for s in sh} | {x["zone"] for x in dun if x.get("zone")}
CAMP_ZONE = {
    "Quai Campsite": "Calderon Canyon",            # Dusk Pit, Watcher's Temporary Outpost (Kibelisk Quai Campsite)
    "Temporary Investigation Base": "Dredgion Crash Site",  # Dratona Cave, Trickster's Den, Valka's Nest, Treasure Hunter's Residence
    "Safe Haven": "Dredgion Crash Site",           # Safe Haven Cliff Kibelisk (Rubek Thieves' stronghold); allthings files the Safe Haven
                                                   # giver's Odyle Jelly quest under Dredgion Crash Site (Hidden Vein Cave is 460 m away)
    "Watcher's Tent": "Calderon Canyon",           # Smuggler's Cave (Kibelisk Watcher's Tent, 180 m)
    "Forest Hideout": "Moslan Forest",             # Bloodsoaked Confessional, Corrupted Forester Ruins stronghold
    "Briskwind Shelter": "Dranactus",              # story "Infiltrate Dranactus (Kibelisk: Briskwind Shelter)", Hugo Mercenaries: An Old Promise
    "Zemurru's Tomb": "Western Gribade Highland",  # Empty Cave, Detlef Thieves Camp stronghold
}
kv = {}
def vote(k, z):
    if k and z: kv.setdefault(k, {}); kv[k][z] = kv[k].get(z, 0) + 1
for n, z in hz.items(): vote((area_old.get(n) or {}).get("kib"), z)
for x in dun:
    if (area_old.get(x["name"]) or {}).get("kib") != x.get("kib") or x["name"] not in hz: vote(x.get("kib"), x.get("zone"))  # same dungeon once
for s in sh: vote(s.get("kib"), s["zone"])
for s_ in list(story.values()) + list(story45.values()):
    for t in s_.get("steps") or []:
        mk = re.search(r"\(Kibelisk: ([^)]+)\)", t); head = t.split("(Kibelisk:")[0]
        zs = [z for z in ZONES if re.match(r"^\w+ " + re.escape(z), head)]  # "Infiltrate Dranactus — ..."
        if mk and len(zs) == 1: vote(mk.group(1), zs[0])
for c, z in CAMP_ZONE.items():
    v = kv.get(c, {})
    check(f"CAMP_ZONE {c} -> {z} is the map-data majority", c in ("Safe Haven",) or (v and all(n < v.get(z, 0) for k2, n in v.items() if k2 != z)), v)
    check(f"CAMP_ZONE target is a zone: {z}", z in ZONES)
ZONE_FIX = {}
def rq_zone(q):
    g = q["giver"]
    for a in (g.get("kib"), g.get("place"), q["zone"]):
        if a in CAMP_ZONE:
            if CAMP_ZONE[a] != q["zone"]: ZONE_FIX[q["name"]] = [q["zone"], CAMP_ZONE[a], a]
            return CAMP_ZONE[a]
    # E4 (QA3 #11): sources disagree on the zone (allthings.how's list vs the giver's own location): the giver's zone wins.
    # Giver place is a zone, or a spot named after one ("Battlescar Mound Cliff" -> Battlescar Mound).
    gp = g.get("place") or ""
    gz = gp if gp in ZONES else max([z for z in ZONES if gp.startswith(z + " ")], key=len, default=None)
    if gz and gz != q["zone"]:
        ZONE_FIX[q["name"]] = [q["zone"], gz, gp]
        return gz
    return q["zone"]
report["zoneVotes"] = {k: kv.get(k) for k in CAMP_ZONE}

RQ_OUT = []
for q in rq:
    g, r = q["giver"], q["rewards"]
    after = reg_edges.get(q["name"], [])
    req_reg = q.get("requiresRegional") or []
    check(f"rq.json requiresRegional matches chains: {q['name']}", sorted(after) == sorted(req_reg) or q.get("requiresRegional") is None, [after, req_reg])
    st = story_edges.get(q["name"])
    rs = q.get("requiresStory") or []
    check(f"rq.json requiresStory matches chains: {q['name']}", (st or None) == (rs[0]["name"] if rs else None) or q.get("requiresStory") is None, [st, rs])
    for a in after: check(f"prerequisite exists: {a}", a in RQ_NAMES)
    items = [x for x in (short_item(i) for i in r.get("items", [])) if x]
    if r.get("ap"): items.insert(0, f"{r['ap'] // 1000}k Abyss Points")
    zone = rq_zone(q)
    place = g.get("place") or ""
    if place == zone: place = ""
    row = OrderedDict([
        ("name", q["name"]), ("id", q["id"]), ("rec", q["rec"]), ("unlocksAt", q["unlocksAt"]),
        ("zone", zone), ("place", place), ("npc", g.get("npc") or ""), ("kib", g.get("kib")), ("m", g.get("m")),
        ("after", after), ("story", st), ("reward", " · ".join(items)), ("xp", r.get("xp")),
        ("rw", OrderedDict([("st", r.get("wisdom") or 0), ("cr", r.get("crystal") or 0)])),
    ])
    # E3 (P0-1): no prerequisite data at all (nothing checked, no chain edge): the page opens it at its recommended level.
    if q.get("requiresStory") is None and q.get("requiresRegional") is None and not after and not st: row["noPre"] = 1
    RQ_OUT.append(row)
check("58 regional quests", len(RQ_OUT) == 58, len(RQ_OUT))
check("every regional quest has a zone", all(x["zone"] for x in RQ_OUT))
_cz = {}
for x, q in zip(RQ_OUT, rq):
    for a in (q["giver"].get("kib"), q["giver"].get("place")):
        if a: _cz.setdefault(a, set()).add(x["zone"])
check("same giver camp/Kibelisk -> one zone", all(len(v) == 1 for v in _cz.values()), {k: sorted(v) for k, v in _cz.items() if len(v) > 1})
check("no camp-only name used as a zone", not [x["zone"] for x in RQ_OUT if x["zone"] not in ZONES and x["zone"] in {q["giver"].get("place") for q in rq} - {"Nornir Assembly"}], sorted({x["zone"] for x in RQ_OUT} - ZONES))
report["zoneFix"] = ZONE_FIX
check("E4: a giver standing in a named zone puts the quest in that zone", all(x["zone"] == (q["giver"].get("place") or "") or not (q["giver"].get("place") or "").startswith(tuple(z + " " for z in ZONES)) or (q["giver"].get("place") or "").startswith(x["zone"] + " ") or q["giver"].get("place") in CAMP_ZONE or q["giver"].get("kib") in CAMP_ZONE for x, q in zip(RQ_OUT, rq)))
check("E4: Nine Wonders of Altgard: 2nd Leg is in Battlescar Mound (giver Tina, Battlescar Mound Cliff)", next(x["zone"] for x in RQ_OUT if x["name"] == "Nine Wonders of Altgard: 2nd Leg") == "Battlescar Mound")
check("every regional quest has unlocksAt and rec", all(x["unlocksAt"] and x["rec"] for x in RQ_OUT))
RQ_STATS = {"n": len(RQ_OUT), "at10": sum(1 for x in RQ_OUT if x["unlocksAt"] == 10),
            "story": sum(1 for x in RQ_OUT if x["story"]), "chained": sum(1 for x in RQ_OUT if x["after"]),
            "kib": sum(1 for x in RQ_OUT if x["kib"])}

# ---------------------------------------------------------------- story 41-45
check("story.json ends at Symbol of Liberation -> Daybreak Society", story["Symbol of Liberation"].get("next") == "Daybreak Society")
chain, cur, seen = [], "Daybreak Society", set()
while cur:
    check(f"story chain resolves: {cur}", cur in story45, cur)
    if cur not in story45 or cur in seen: break
    seen.add(cur); s = story45[cur]; chain.append(cur)
    nxt = s.get("next")
    if nxt: check(f"story prev link: {nxt}", story45.get(nxt, {}).get("prev") == cur)
    cur = nxt
check("story chain covers every 40-45 entry", len(chain) == len(story45), [len(chain), len(story45)])
last = story45[chain[-1]]
check("story chain ends with an explicit end marker", bool(last.get("end")) and last.get("next") is None)
QUESTS_X = [[story45[n]["lv"], n] for n in chain]
QUEST_STEPS_X = OrderedDict((n, story45[n]["steps"]) for n in chain)
LOC_KEYS = ["giverKib", "giverKibM", "turnin", "turninPlace", "turninKib", "turninKibM"]
QUEST_LOC_X = OrderedDict((n, OrderedDict((k, story45[n][k]) for k in LOC_KEYS if story45[n].get(k) is not None)) for n in chain)
for n in chain:
    check(f"story steps end with a turn-in: {n}", story45[n]["steps"][-1].startswith("Turn in"))
m = re.search(r"\(([^)]*Reshanta)\)", last["steps"][-1])
STORY_END = OrderedDict([("quest", chain[-1]), ("lv", last["lv"]), ("turnin", last["turnin"]), ("place", last["turninPlace"]),
                         ("region", "Reshanta" if m else None), ("regionFull", m.group(1) if m else None)])
check("last story quest turns in in Reshanta", STORY_END["region"] == "Reshanta", last["steps"][-1])
# story gates of regional quests must name quests in QUESTS (story.json keys + 40-45 chain + the pre-24 list in the page)
for q in RQ_OUT:
    if q["story"]: check(f"story gate is a known story quest: {q['story']}", q["story"] in story or q["story"] in story45 or q["story"] in
                         {"Empyrean Monolith", "Verdant Melody", "Disturbed Balance"})

# ---------------------------------------------------------------- strongholds
SH_OUT = []
for s in sh:
    SH_OUT.append(OrderedDict([("name", s["name"]), ("qid", s["qid"]), ("zone", s["zone"]), ("lo", s["lo"]), ("hi", s["hi"]), ("kib", s.get("kib")), ("m", s.get("m"))]))
    w, c = (s.get("rewards") or {}).get("wisdom"), (s.get("rewards") or {}).get("crystal")
    check(f"stronghold pays no stones/crystals: {s['name']}", not w and not c, [w, c])
check("15 strongholds", len(SH_OUT) == 15)
check("every stronghold has zone, range and Kibelisk", all(x["zone"] and x["lo"] and x["hi"] and x["kib"] for x in SH_OUT))

# ---------------------------------------------------------------- Sealed Dungeons
AREA_LOC = OrderedDict()
SH_NAMES = {s["name"] for s in sh}
for n, v in area_old.items():
    if n in SH_NAMES: continue                      # strongholds come from strongholds.json
    if v.get("kib"): AREA_LOC[n] = OrderedDict([("kib", v["kib"]), ("m", v.get("m"))])
for x in dun:
    if not x.get("kib"):
        report["warnings"].append(f"no Kibelisk for {x['name']}: {x.get('notes')}")
        continue
    old = AREA_LOC.get(x["name"])
    if old and (old["kib"], old["m"]) != (x["kib"], x["m"]):
        report["warnings"].append(f"AREA_LOC {x['name']}: {old} replaced by dungeons.json {x['kib']} {x['m']}")
    AREA_LOC[x["name"]] = OrderedDict([("kib", x["kib"]), ("m", x["m"])])
# both bands answer 2+2 everywhere -> one constant
bw = {(b["wisdom"], b["crystal"]) for b in bands["bands"]}
check("Sealed Dungeon reward is 2 Wisdom Stones + 2 crystals in every sampled band", bw == {(2, 2)}, sorted(bw))
SD_RW = {"st": 2, "cr": 2}

# ---------------------------------------------------------------- skills appended after the core 8
sk = {s["name"]: s for s in build["skills"]}
order = build["spOrderAfterCore"]["order"]
per = build["spOrderAfterCore"]["perItem"]
SP_EXTRA = []
for n in order:
    s = sk[n]
    check(f"skill costs 1/2/4: {n}", s["costs"] == {"2-4": 1, "5-7": 2, "8-10": 4}, s["costs"])
    flat = bool(s.get("gate") and str(s["gate"]).startswith("flat"))
    e = OrderedDict([("n", n), ("learn", s["learnLv"])])
    if s["type"] == "passive": e["passive"] = True
    if flat: e["flat"] = True
    if per[n]["verdict"] != "2-source": e["single"] = per[n]["basis"].split(" (")[0]
    SP_EXTRA.append(e)

# ---------------------------------------------------------------- Vaizel / Triniel nodes
KEYS = {"Heart Gore": "hg", "Insignia Explosion": "ie", "Quick Slice": "qs", "Assault Stance": "as", "Defense Break": "db"}
DV_BOARDS = OrderedDict()
for b, pre, lv in (("Vaizel", "v", 30), ("Triniel", "t", 40)):
    out = []
    for nd in build["boards"][b]:
        name = nd["node"]
        if name in KEYS:
            out.append(OrderedDict([("k", f"dv:{pre}:{KEYS[name]}"), ("t", name), ("ty", nd["ty"])]))
        elif nd["ty"] == "c":
            out.append(OrderedDict([("k", f"dv:{pre}:corner"), ("t", name), ("ty", "c"), ("via", "corner stat inferred from the board's stat totals (Metabot)")]))
    DV_BOARDS[b] = {"lv": lv, "nodes": out}
check("board list has no Ariel", all(x["name"] != "Ariel" for x in build["boards"]["list"]) and build["boards"]["Ariel"] is None)
BOARDS = [[x["name"], x["lv"]] for x in build["boards"]["list"]]

# ---------------------------------------------------------------- sources
URL = re.compile(r"https?://[^\s)\]'\"]+")
def urls(v):
    out = []
    if isinstance(v, str): out += [u.rstrip(".,;") for u in URL.findall(v)]
    elif isinstance(v, dict):
        for x in v.values(): out += urls(x)
    elif isinstance(v, list):
        for x in v: out += urls(x)
    return out

label_of, name_of_id = {}, {}
for q in rq: label_of[q["src"]] = q["name"]; name_of_id[q["id"]] = q["name"]
for q in rq:
    for r in (q.get("requiresStory") or []): name_of_id[r["id"]] = r["name"]
for n, s_ in story.items(): label_of[s_["src"]] = n
for n, s_ in story45.items(): label_of[s_["src"]] = n
for s_ in sh: label_of[s_["src"]] = s_["name"]
for x in dun:
    label_of[x["src"]] = x["name"]
    if x.get("kibSrc"): label_of.setdefault(x["kibSrc"], x["name"] + " (exploration quest)")
for x in src_old: label_of.setdefault(x["url"], x["label"])
# claims.json sources may name their page ("label"), e.g. quest pages that no other data file cites (0.1.3)
for c_ in load("data/claims.json"):
    for s_ in c_["sources"]:
        if isinstance(s_, dict) and s_.get("label"): label_of.setdefault(s_["url"], s_["label"])
SITE = [("metabot.gg", "Metabot"), ("aion2.gaming.tools", "aion2.gaming.tools"), ("aion2.th.gl", "aion2.th.gl"), ("allthings.how", "allthings.how"),
        ("thegameswiki.com", "thegameswiki"), ("wikily.gg", "Wikily"), ("gamesfuze.com", "GamesFuze"), ("skycoach.gg", "Skycoach"), ("games.gg", "games.gg"),
        ("keengamer.com", "KeenGamer"), ("mein-mmo.de", "MeinMMO"), ("playnews.gg", "PlayNews"), ("gameplay.tips", "gameplay.tips"), ("gamewith.ai", "GameWith"),
        ("expcarry.com", "ExpCarry"), ("aion2hub.com", "AION2HUB"), ("fandomwire.com", "FandomWire"), ("neonsect.com", "neonsect"), ("massivelyop.com", "MassivelyOP"),
        ("selphie1999gaming.com", "Selphie1999"), ("exitlag.com", "ExitLag"), ("metaroad.gg", "Metaroad")]
def site(u):
    for d, n in SITE:
        if d in u: return n
    return re.sub(r"^https?://(www\.)?", "", u).split("/")[0]
OLD_URLS = {x["url"] for x in src_old}
def label(u):
    s = site(u)
    if u in label_of:
        l = label_of[u]
        return l if (l.lower().startswith(s.lower()) or u in OLD_URLS) else f"{s}: {l}"
    m = re.search(r"aion2\.gaming\.tools/quests/(\d+)", u) or re.search(r"aion2\.th\.gl/db/quests/q_(\d+)", u)
    if m:
        name = name_of_id.get(m.group(1), m.group(1))
        return f"{s}: {name}"
    m = re.search(r"[?&]p=(\d+)", u)
    if m: return f"{s}: article {m.group(1)}"
    path = re.sub(r"^https?://[^/]+", "", u).strip("/")
    segs = [x for x in path.split("/") if x and not x.isdigit()] if path else []
    tail = segs[-1] if segs else ""
    tail = re.sub(r",\d+$", "", tail)
    tail = re.sub(r"\.html?$", "", tail).replace("-", " ").strip()
    tail = re.sub(r"^aion ?2 ", "", tail, flags=re.I)
    if not tail: return s
    words = tail.split()
    if len(words) > 7: words = words[:7] + ["…"]
    t = " ".join(words)
    return f"{s}: {t[:1].upper() + t[1:]}"

groups = OrderedDict([
    ("rq", ("Regional quests", urls([[q["src"], q.get("zoneSrc"), q.get("requiresSrc")] for q in rq]) + urls([e["sources"] for e in chains]) + urls(rq) + urls(chains))),
    ("story", ("Main story", urls([s["src"] for s in story.values()]) + urls([s["src"] for s in story45.values()]) + urls(story) + urls(story45))),
    ("areas", ("Strongholds and Sealed Dungeons", urls([[s["src"], s.get("mapSrc")] for s in sh]) + urls([[x["src"], x.get("kibSrc")] for x in dun]) + urls(sh) + urls(dun) + urls(bands))),
    ("build", ("Skills, boards and stigmas", urls(build))),
    # E4 (QA3 #12): the check date is said once, in the Sources card intro; "old" named after what those pages back.
    ("claims", ("Tips and rules", urls([c["sources"] for c in claims.values()]) + urls(list(claims.values())))),
    ("old", ("Leveling guides, build and tips", [x["url"] for x in src_old])),
])
SOURCES, seen = [], set()
for gid, (title, us) in groups.items():
    items = []
    for u in us:
        if u in seen: continue
        seen.add(u); items.append([u, label(u)])
    items.sort(key=lambda x: (site(x[0]) != "Metabot", x[1].lower()))
    SOURCES.append(OrderedDict([("id", gid), ("t", title), ("links", items)]))
ALL_URLS = seen
for c in claims.values():
    for s in c["sources"]:
        u = s.get("url") if isinstance(s, dict) else s
        if isinstance(u, str) and u.startswith("http"): check(f"claim source listed: {c['id']}", any(x in ALL_URLS for x in urls(u)), u)

# ---------------------------------------------------------------- confidence card (verdicts from the data files)
V = lambda cid: claims[cid]["verdict"]
sp = build["spOrderAfterCore"]
CONF = [
    ("Verified", "two or more independent sources, or game data", [
        "Unlock levels from the client-data table (Metabot, Wikily): enhancement 9; extraction, crafting, gathering 10; Supply Requests 25; daily dungeon 30; Abyss, Market, Ascension Trial, Conquest 45." if V("C28a") == "verified" else None,
        f"Regional quests: giver, Kibelisk, rewards, recommended and unlock level from each quest's Metabot page; prerequisites (an earlier regional quest or a story quest) from aion2.gaming.tools and aion2.th.gl, cross-checked with allthings.how ({RQ_STATS['chained']} follow-ups, {RQ_STATS['story']} story-gated).",
        f"Main story to \"{STORY_END['quest']}\" (Lv {STORY_END['lv']}): objectives and Kibelisks from Metabot quest pages.",
        "Stigma slots 22 / 27 / 32 / 37; every stigma learnable at 22; shard cost per level (Metabot, allthings.how). Upgrade plan: Triniel's Dagger to 10, then Illusive Clone toward 20 (GamesFuze, Skycoach).",
        f"Skill points after the core eight: {', '.join(n for n in sp['order'] if sp['perItem'][n]['verdict'] == '2-source')} (GamesFuze, Skycoach). Per-level costs and gates from Metabot skill pages.",
        "Five Daevanion boards on global: " + ", ".join(f"{n} {l}" for n, l in BOARDS) + "; node costs 1 / 2 / 3 / 4." if V("C22") == "verified" else None,
        "Specialty slots at skill level 8 / 12 / 20." if V("C03") == "verified" else None,
        "Sealed Dungeons are solo; every sampled band pays 2 Wisdom Stones + 2 crystals on the first clear (Metabot, allthings.how, AION2HUB)." if V("C12") == "verified" else None,
        "Strongholds pay belt scrolls and Kina, no Wisdom Stones or crystals (Metabot quest pages, AION2HUB, allthings.how, FandomWire).",
        "Expeditions: Urugugu Canyon 28 (item level 300, party 2–5) and Fire Temple 35 (item level 500); Conquest at 45.",
        "Duty Quests open at 45, 5 a day per server; Supply Requests (25) are a separate system." if V("C15") == "verified" and V("C28g") == "verified" else None,
        "Free-to-play: the Market and the Kina/Quna exchange need the $15 subscription." if V("C17") == "verified" else None,
        "Stat tiers: only stats that at least two of Metabot, games.gg and GamesFuze rank high (order inside a tier varies).",
    ]),
    ("Single source", "shown, labelled where it's advice", [
        "Abyss Points: Stigma Shards first (KeenGamer)." if V("C07") == "single-source" else None,
        "Belt +10 (Rare) cost: 232,000 Kina and 9,280 Enhance Stones." if V("C23") == "single-source" else None,
        "Supply Request details (request types, deadlines)." if V("C16") == "single-source" else None,
        f"Skill points per level 30–44 (Wikily; 203 at 45 has two sources).",
        f"Skill points after the four above: {', '.join(n for n in sp['order'] if sp['perItem'][n]['verdict'] != '2-source')} (games.gg).",
    ]),
    ("Inferred", "the guide's own reasoning; test it in game", [
        "Core skill-point order (Heart Gore, Insignia Explosion, Savage Roar, Quick Slice, Ambush, passives, Shadowstrike), ranked from per-level damage and cooldowns.",
        "Right-click row order and the E stack (buffs first).",
        "Vaizel and Triniel corner stats (Critical Damage Boost, Multi-Hit Chance), from each board's stat totals; Daevanion path costs.",
        "Stronghold level bands (zone plus the level range on Metabot's map).",
    ]),
    ("Disputed", "sources disagree; the guide says which way it goes", [
        "Respec: free while you level; whether it costs Kina after 31 (MeinMMO vs allthings.how, ExitLag)." if V("C01") == "disputed" else None,
        "Expedition weekly reward cap: 7 per dungeon (Metabot, KeenGamer) vs removed (games.gg; KR/TW)." if V("C11") == "disputed" else None,
        "Stigma slots 3 and 4: Swift Contract before Savage Fang (Metabot, Skycoach); GamesFuze has the reverse.",
        "First Daevanion nodes (Metabot's class build vs its board guide, couga54, GamesFuze); the guide blends them. Which core skill first: Heart Gore (Metabot, GamesFuze) or Quick Slice (games.gg, ExpCarry).",
        "Cash shop: mostly cosmetic, but consumables and Daeva Pass materials exist (MassivelyOP, games.gg)." if V("C18") == "disputed" else None,
    ]),
    ("Unverified", "no source found, so the guide leaves it out", [
        "Kibelisk and Command mission unlock levels.",
    ]),
    ("From your game", "seen in game, not in a source", [
        "16 points to reach Heart Gore + Ambush on Nezekan." if V("C28d") == "verified" else None,
        "Daevanion points: 4 per level past 11 (checked at 16 and 17).",
        "Holding left click with the right-click macro keeps MP full.",
    ]),
]
CONF = [OrderedDict([("g", g), ("sub", sub), ("items", [x for x in items if x])]) for g, sub, items in CONF]

# ---------------------------------------------------------------- data/DATA_SOURCES.md
DATA_FILES = ["rq.json", "rq-chains.json", "story.json", "story-40-45.json", "strongholds.json", "dungeons.json", "dungeon-bands.json",
              "build.json", "claims.json", "locations.json", "current-areas-quests.json"]
def _record_label(rec, key):
    if isinstance(rec, dict):
        for f in ("name", "quest", "id", "node", "claim", "title"):
            if isinstance(rec.get(f), (str, int)) and f != "id" or (f == "id" and "name" not in rec and isinstance(rec.get(f), (str, int))):
                if f == "quest" and rec.get("after"): return f"{rec['quest']} (after {rec['after']})"
                return str(rec[f])
    return str(key)
def _walk_urls(v):
    if isinstance(v, str):
        for u in re.findall(r"https?://[^\s\"'()<>]+", v): yield u.rstrip(".,;:")
    elif isinstance(v, dict):
        for x in v.values(): yield from _walk_urls(x)
    elif isinstance(v, list):
        for x in v: yield from _walk_urls(x)
def write_data_sources():
    """Every URL in data/*.json and the Sources card: which data file / record cites it, and which card group shows it."""
    used = OrderedDict()   # url -> list of "file: record"
    for fn in DATA_FILES:
        if not os.path.exists(D("data", fn)): continue
        d = load("data/" + fn)
        top = d.items() if isinstance(d, dict) else enumerate(d)
        for k, rec in top:
            if isinstance(d, dict) and isinstance(rec, dict) and fn in ("locations.json", "current-areas-quests.json", "build.json"):
                sub = rec.items() if all(isinstance(x, (dict, list)) for x in rec.values()) else [(None, rec)]
            else: sub = [(None, rec)]
            for k2, r2 in sub:
                lab = _record_label(r2, k2 if k2 is not None else k)
                where = f"{fn}: {k} / {lab}" if k2 is not None else f"{fn}: {lab}"
                for u in _walk_urls(r2):
                    lst = used.setdefault(u, [])
                    if where not in lst: lst.append(where)
    group_of = {u: s["t"] for s in SOURCES for u, _ in s["links"]}
    label_of_u = {u: l for s in SOURCES for u, l in s["links"]}
    out = ["# Data sources", "",
           "Generated by `tools/gen/gen.py` (`npm run gen`). Do not edit by hand.", "",
           "Every URL cited in `data/*.json` or shown in the app's **Sources** card, grouped by site. *Backs* lists the data records",
           "that cite the page (`file: record`); *Card group* is where the app lists it. Pages were checked in Oct 2026.", "",
           "Only facts were taken from these pages; the app reproduces no page text. Short quotations in `data/claims.json`",
           "stay their owners'; thegameswiki quotations are CC BY-NC-SA 4.0 (shortened). Listing a site implies no endorsement.", "",
           f"{len(set(used) | set(group_of))} URLs · {len(group_of)} in the Sources card · {len(set(used) - set(group_of))} cited only in the data files", ""]
    by_site = OrderedDict()
    for u in sorted(set(used) | set(group_of), key=lambda u: (site(u) != "Metabot", site(u).lower(), u)):
        by_site.setdefault(site(u), []).append(u)
    for s_name, us in by_site.items():
        out += [f"## {s_name} ({len(us)})", "", "| Page | Card group | Backs |", "|---|---|---|"]
        for u in us:
            lab = label_of_u.get(u) or label(u)
            backs = "; ".join(used.get(u, [])) or "Sources card (earlier research snapshot)"
            cell = lambda t: t.replace("|", "\\|").replace("\n", " ")
            out.append(f"| [{cell(lab)}]({u}) | {cell(group_of.get(u, '—'))} | {cell(backs)} |")
        out.append("")
    open(D("data", "DATA_SOURCES.md"), "w", encoding="utf-8").write("\n".join(out))

# ---------------------------------------------------------------- write the block
J = lambda v: json.dumps(v, ensure_ascii=False, separators=(", ", ": "))
lines = [
    "/* E2-GEN START: generated by tools/gen/gen.py from data/*.json (Oct 2026). Do not edit by hand: change the data and re-run. */",
    "/* Regional quests (data/rq.json, data/rq-chains.json). id, rec (recommended level), unlocksAt, giver npc/place and its nearest",
    "   Kibelisk (kib, m), rewards and xp: each quest's Metabot page. zone: allthings.how area guides. after: regional quests that must be",
    "   turned in first; story: the main-story quest the game requires first (aion2.gaming.tools / aion2.th.gl \"Required Quests\",",
    "   allthings.how). rw: Wisdom Stones / Daevanion Crystals credited on turn-in. */",
    "const RQ = [", *("  " + J(x) + "," for x in RQ_OUT), "];",
    f"const RQ_STATS = {J(RQ_STATS)};",
    "/* Main story Lv 41-45 (data/story-40-45.json, Metabot quest pages): appended to QUESTS / QUEST_STEPS / QUEST_LOC. */",
    f"const QUESTS_X = {J(QUESTS_X)};",
    f"const QUEST_STEPS_X = {J(QUEST_STEPS_X)};",
    f"const QUEST_LOC_X = {J(QUEST_LOC_X)};",
    f"const STORY_END = {J(STORY_END)};",
    "/* Strongholds (data/strongholds.json): zone and level range from Metabot's Altgard stronghold map; nearest Kibelisk from the map list. */",
    "const SH_DATA = [", *("  " + J(x) + "," for x in SH_OUT), "];",
    "/* Sealed Dungeon entrances: nearest Kibelisk (allthings.how map pages; gaps filled from data/dungeons.json, Metabot). */",
    f"const AREA_LOC = {J(AREA_LOC)};",
    f"const SD_RW = {J(SD_RW)}; /* first clear, every band (data/dungeon-bands.json) */",
    "/* Skills appended after the core eight (data/build.json spOrderAfterCore). flat: every level needs the learn level (Metabot table).",
    "   single: only one source ranks it. */",
    f"const SP_EXTRA = {J(SP_EXTRA)};",
    "/* Vaizel / Triniel plan nodes (data/build.json boards). */",
    f"const DV_BOARDS = {J(DV_BOARDS)};",
    f"const SOURCES = {J(SOURCES)};",
    "/* Site names for the Sources card's per-site rows (hostname -> name). */",
    f"const SRC_SITE = {J(OrderedDict((d, n) for d, n in SITE))};",
    f"const CONF = {J(CONF)};",
    "/* E2-GEN END */",
]
open(D("tools/gen/gen-block.js"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
report["stats"] = {"rq": RQ_STATS, "story": QUESTS_X, "sources": {s["id"]: len(s["links"]) for s in SOURCES}, "areaLoc": len(AREA_LOC)}
json.dump(report, open(D("tools/gen/gen-report.json"), "w"), indent=1, ensure_ascii=False)
write_data_sources()
bad = [c for c in report["checks"] if not c["pass"]]
print(f"gen-block.js + data/DATA_SOURCES.md written · {len(report['checks'])} checks, {len(bad)} failed · warnings: {len(report['warnings'])}")
for w in report["warnings"]: print("  warn:", w)
sys.exit(1 if bad else 0)
