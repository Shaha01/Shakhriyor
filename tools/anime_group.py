import json, sys, re, collections

SKIP = {19362, 20160}  # шуточные релизы самого Anixart
# префикс romaji → франшиза; всё, что не совпало, считается отдельным тайтлом
FRANCHISES = [
    ("Shingeki no Kyojin", "aot"), ("Tensei shitara Slime", "slime"), ("Dr. Stone", "drstone"),
    ("Kimetsu no Yaiba", "kny"), ("Jujutsu Kaisen", "jjk"), ("Naruto", "naruto"), ("The Last: Naruto", "naruto"),
    ("One Punch Man", "opm"), ("One-Punch Man", "opm"), ("Ore dake Level Up", "solo"), ("Tokyo Ghoul", "ghoul"),
    ("Tokyo Revengers", "revengers"), ("Code Geass", "geass"), ("Blue Lock", "bluelock"), ("Vinland Saga", "vinland"),
    ("Mushoku Tensei", "mushoku"), ("Kage no Jitsuryokusha", "eminence"), ("Kaijuu 8-gou", "kaiju"),
    ("Kakegurui", "kakegurui"), ("Kusuriya no Hitorigoto", "apothecary"), ("Mashle", "mashle"), ("Nisekoi", "nisekoi"),
    ("Sakamoto Days", "sakamoto"), ("Tsuki ga Michibiku", "moonlit"), ("Wind Breaker", "windbreaker"),
    ("Youkoso Jitsuryoku", "cote"), ("Yuukoku no Moriarty", "moriarty"), ("Gokushufudou", "gokushufudou"),
    ("Jigokuraku", "jigokuraku"), ("Tsue to Tsurugi", "wistoria"), ("Ansatsu Kyoushitsu", "assclass"),
    ("Dead Mount Death Play", "dmdp"), ("Dungeon ni Deai", "danmachi"), ("Gekijouban Dungeon ni Deai", "danmachi"),
    ("Kanojo, Okarishimasu", "kanokari"), ("Spy x Family", "spyfamily"), ("Otome Game Sekai", "mobseka"),
    ("Seishun Buta Yarou", "bunny"), ("Isekai wa Smartphone", "smartphone"),
]

def key_of(r):
    t = (r["title_original"] or "").lower()
    for pre, k in FRANCHISES:
        if t.startswith(pre.lower()):
            return k
    return f"id{r['id']}"

def group(rows):
    g = collections.defaultdict(list)
    for r in rows:
        if r["id"] in SKIP:
            continue
        g[key_of(r)].append(r)
    out = []
    for k, items in g.items():
        items.sort(key=lambda r: (str(r["year"])[:4], r["id"]))
        votes = collections.Counter(r["my_vote"] for r in items)
        score = max(votes, key=lambda v: (votes[v], v))  # самая частая оценка, при равенстве — выше
        out.append({"key": k, "main": items[0], "items": items, "score": score})
    return out

if __name__ == "__main__":
    rows = json.load(open(sys.argv[1], encoding="utf8"))
    fr = group(rows)
    sys.stdout.reconfigure(encoding="utf8")
    print(len(fr), collections.Counter(f["score"] for f in fr))
    for f in sorted(fr, key=lambda f: -f["score"]):
        if len(f["items"]) > 1:
            print(f["score"], f["key"], len(f["items"]), sorted(r["my_vote"] for r in f["items"]), f["main"]["title_ru"])
