"""Разовая выгрузка оценённых аниме с Anixart для сайта.

python -I anime.py <site_dir> <tmp_dir>
Пишет <site_dir>/assets/js/anime.js и постеры в <site_dir>/media/anime/<key>.webp.
Английские названия берутся из AniList и кешируются в anime_cache.json рядом со скриптом.
"""
import collections, datetime, io, json, os, sys, time, urllib.request

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from anime_group import group  # noqa: E402

PROFILE = 2710957
API = "https://api.anixart.tv"
UA = {"User-Agent": "AnixartApp/9.0"}
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "anime_cache.json")
POSTER_W, POSTER_H = 300, 427

# AniList иногда находит не то, поэтому для спорных тайтлов английское название задано вручную
EN_OVERRIDE = {
    "aot": "Attack on Titan", "slime": "That Time I Got Reincarnated as a Slime", "kny": "Demon Slayer",
    "jjk": "Jujutsu Kaisen", "naruto": "Naruto", "opm": "One-Punch Man", "solo": "Solo Leveling",
    "ghoul": "Tokyo Ghoul", "geass": "Code Geass", "drstone": "Dr. Stone", "mushoku": "Mushoku Tensei: Jobless Reincarnation",
    "eminence": "The Eminence in Shadow", "apothecary": "The Apothecary Diaries", "cote": "Classroom of the Elite",
    "danmachi": "Is It Wrong to Try to Pick Up Girls in a Dungeon?", "kanokari": "Rent-a-Girlfriend",
    "bunny": "Rascal Does Not Dream of Bunny Girl Senpai", "smartphone": "In Another World With My Smartphone",
    "mobseka": "Trapped in a Dating Sim", "assclass": "Assassination Classroom", "moonlit": "Tsukimichi: Moonlit Fantasy",
    "gokushufudou": "The Way of the Househusband", "moriarty": "Moriarty the Patriot", "wistoria": "Wistoria: Wand and Sword",
    "jigokuraku": "Hell's Paradise", "kaiju": "Kaiju No. 8", "dmdp": "Dead Mount Death Play",
    "mashle": "Mashle: Magic and Muscles", "a12350": "Your Name.", "a2013": "A Silent Voice",
    "a19046": "I Got a Cheat Skill in Another World and Became Unrivaled in the Real World, Too",
    "a18986": "Shangri-La Frontier", "a19752": "Failure Frame", "a19147": "Heavenly Delusion",
    "a19746": "The Strongest Magician in the Demon Lord's Army Was a Human", "a19432": "The Ossan Newbie Adventurer",
    "a19859": "The Most Notorious \"Talker\" Runs the World's Greatest Clan", "a2039": "Akashic Records of Bastard Magic Instructor",
    "a16510": "The Misfit of Demon King Academy", "a16741": "Higehiro", "a19340": "Villainess Level 99",
    "a19169": "I Was Reincarnated as the 7th Prince", "a1357": "The Seven Deadly Sins",
    "a19019": "The Aristocrat's Otherworldly Adventure",
}


def get(url, as_json=True):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    return json.loads(data) if as_json else data


def anilist_title(search):
    q = "query($s:String){Media(search:$s,type:ANIME){title{romaji english}}}"
    body = json.dumps({"query": q, "variables": {"s": search}}).encode()
    req = urllib.request.Request("https://graphql.anilist.co", data=body,
                                 headers={"Content-Type": "application/json", "Accept": "application/json",
                                          "User-Agent": "anime-list-export/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                m = json.loads(r.read())["data"]["Media"]
            return (m["title"]["english"] or m["title"]["romaji"]) if m else None
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code == 429:
                time.sleep(65)
                continue
            raise
    return None


def main(site, tmp):
    profile = get(f"{API}/profile/{PROFILE}")["profile"]
    rows, page = [], 0
    while True:
        chunk = get(f"{API}/profile/vote/release/voted/{PROFILE}/{page}?sort=1").get("content", [])
        if not chunk:
            break
        rows += chunk
        page += 1
    json.dump(rows, open(os.path.join(tmp, "anixart_votes.json"), "w", encoding="utf8"), ensure_ascii=False)

    cache = json.load(open(CACHE, encoding="utf8")) if os.path.exists(CACHE) else {}
    out_dir = os.path.join(site, "media", "anime")
    os.makedirs(out_dir, exist_ok=True)

    items = []
    for f in group(rows):
        main_r = min(f["items"], key=lambda r: (len(r["title_ru"] or ""), str(r["year"])))
        k = f["key"] if not f["key"].startswith("id") else f"a{main_r['id']}"
        if k in EN_OVERRIDE:
            en = EN_OVERRIDE[k]
        elif k in cache:
            en = cache[k]
        else:
            en = anilist_title(main_r["title_original"]) or main_r["title_original"]
            cache[k] = en
            json.dump(cache, open(CACHE, "w", encoding="utf8"), ensure_ascii=False, indent=1)
            time.sleep(2.2)

        poster = os.path.join(out_dir, f"{k}.webp")
        if not os.path.exists(poster) and main_r.get("image"):
            im = Image.open(io.BytesIO(get(main_r["image"], as_json=False))).convert("RGB")
            scale = max(POSTER_W / im.width, POSTER_H / im.height)
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
            l, t = (im.width - POSTER_W) // 2, (im.height - POSTER_H) // 2
            im.crop((l, t, l + POSTER_W, t + POSTER_H)).save(poster, "WEBP", quality=78, method=6)

        years = sorted({int(str(r["year"])[:4]) for r in f["items"] if r.get("year")})
        y = f"{years[0]}" if len(years) < 2 or years[0] == years[-1] else f"{years[0]}–{years[-1]}"
        items.append({"k": k, "ru": main_r["title_ru"].strip(), "en": en.strip(), "y": y,
                      "n": len(f["items"]), "s": f["score"], "last": years[-1] if years else 0})

    items.sort(key=lambda i: (-i["s"], -i["n"], -i["last"], i["en"]))
    for i in items:
        del i["last"]

    data = {
        "profile": f"https://anixart-app.com/profile/{PROFILE}",
        "updated": datetime.date.today().isoformat(),
        "stats": {"completed": profile["completed_count"], "episodes": profile["watched_episode_count"],
                  "minutes": profile["watched_time"], "rated": len(rows)},
        "list": items,
    }
    js = ("/* Аниме-лист: выгрузка оценок с Anixart (tools/anime.py). Сезоны одной франшизы склеены,\n"
          "   s — самая частая оценка по франшизе (1–5), n — сколько частей оценено. */\n"
          "window.ANIME = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    open(os.path.join(site, "assets", "js", "anime.js"), "w", encoding="utf8").write(js)
    print(len(items), collections.Counter(i["s"] for i in items))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
