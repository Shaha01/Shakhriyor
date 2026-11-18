"""Широкие баннеры для блока «Самые любимые» (берутся из AniList один раз).

python -I anime_banners.py <site_dir> [--check]
id тайтлов на AniList — в BANNERS. Пишет <site_dir>/media/anime/banner-<key>.webp.
"""
import io, json, os, sys, time, urllib.request

from PIL import Image

# ключ из assets/js/anime.js → id тайтла на AniList (первый сезон / основная работа)
BANNERS = {
    "aot": 16498, "vinland": 101348, "a3020": 1535, "jigokuraku": 128893, "a18244": 134732, "geass": 1575,
    "ghoul": 20605, "moriarty": 114124, "a19486": 166910, "a1788": 21711, "a1271": 20613, "a18606": 141014,
    "a18849": 146493, "eminence": 130298, "naruto": 20, "bluelock": 137822,
}
W, H = 1400, 620  # кадр под карточку ~2.25:1


def anilist(ids):
    q = "query($ids:[Int]){Page(perPage:50){media(id_in:$ids,type:ANIME){id title{romaji english} bannerImage coverImage{extraLarge}}}}"
    body = json.dumps({"query": q, "variables": {"ids": ids}}).encode()
    req = urllib.request.Request("https://graphql.anilist.co", data=body, headers={
        "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "anime-list-export/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return {m["id"]: m for m in json.loads(r.read())["data"]["Page"]["media"]}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "anime-list-export/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main(site, check):
    media = anilist(list(BANNERS.values()))
    out = os.path.join(site, "media", "anime")
    for k, mid in BANNERS.items():
        m = media.get(mid)
        if not m:
            print(k, mid, "NOT FOUND")
            continue
        print(k, mid, m["title"]["english"] or m["title"]["romaji"], "| banner" if m["bannerImage"] else "| NO BANNER")
        if check:
            continue
        src = m["bannerImage"] or m["coverImage"]["extraLarge"]
        im = Image.open(io.BytesIO(fetch(src))).convert("RGB")
        scale = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        l, t = (im.width - W) // 2, (im.height - H) // 2
        im.crop((l, t, l + W, t + H)).save(os.path.join(out, f"banner-{k}.webp"), "WEBP", quality=74, method=6)
        time.sleep(0.3)


if __name__ == "__main__":
    main(sys.argv[1], "--check" in sys.argv)
