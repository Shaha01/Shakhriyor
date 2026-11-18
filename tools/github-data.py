"""Пишет assets/js/github.js: звёзды, дату последнего пуша и описание репозиториев из config.js
и число публичных репозиториев. Карточки проектов берут цифры отсюда, а не из GitHub API у каждого посетителя
(без токена API даёт всего 60 запросов в час с одного IP).

Запускается в GitHub Actions с GITHUB_TOKEN; локально тоже работает: python -I tools/github-data.py <папка сайта>
"""
import json, os, re, sys, urllib.request

site = sys.argv[1] if len(sys.argv) > 1 else "."
out = os.path.join(site, "assets", "js", "github.js")
cfg = open(os.path.join(site, "assets", "js", "config.js"), encoding="utf8").read()
repos = re.findall(r'repo:\s*"([^"]+)"', cfg)
user = re.search(r'github:\s*"https://github\.com/([^"/]+)"', cfg).group(1)
token = os.environ.get("GITHUB_TOKEN")


def get(path):
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "portfolio-build"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with urllib.request.urlopen(urllib.request.Request("https://api.github.com/" + path, headers=headers), timeout=30) as r:
        return json.loads(r.read())


def write(data):
    js = ("/* Сгенерировано tools/github-data.py (GitHub Actions). Не редактировать вручную. */\n"
          "window.GITHUB = " + json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + ";\n")
    old = open(out, encoding="utf8").read() if os.path.exists(out) else ""
    if old != js:
        open(out, "w", encoding="utf8", newline="\n").write(js)
    print("github.js", "updated" if old != js else "unchanged")


try:
    data = {"user": {"public_repos": get(f"users/{user}")["public_repos"]}, "repos": {}}
    for full in repos:
        j = get(f"repos/{full}")
        item = {"stars": j["stargazers_count"], "pushed": j["pushed_at"]}
        desc = (j.get("description") or "").strip()
        if desc and not re.match(r"https?://", desc):
            item["desc"] = desc
        data["repos"][full] = item
except Exception as e:  # offline or rate limited: keep what we have
    print("GitHub API failed:", e)
    if not os.path.exists(out):
        write({"user": {}, "repos": {}})
    sys.exit(0)
write(data)
