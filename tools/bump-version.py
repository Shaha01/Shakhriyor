"""Дописывает ?v=<хеш файла> к локальным css/js во всех страницах сайта (index.html, life.html …),
чтобы браузер не держал старые версии из кеша.

GitHub Pages отдаёт файлы с max-age=600, поэтому без версии в адресе сайт после деплоя обновляется до 10 минут.
Запускается в GitHub Actions после каждого пуша; локально: python -I tools/bump-version.py <папка сайта>
"""
import glob, hashlib, os, re, sys

site = sys.argv[1] if len(sys.argv) > 1 else "."
pattern = re.compile(r'(href|src)="(assets/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"')


def stamp(m):
    f = os.path.join(site, m.group(2))
    h = hashlib.md5(open(f, "rb").read().replace(b"\r\n", b"\n")).hexdigest()[:8]
    return f'{m.group(1)}="{m.group(2)}?v={h}"'


for path in sorted(glob.glob(os.path.join(site, "*.html"))):
    html = open(path, encoding="utf8", newline="").read()
    new = pattern.sub(stamp, html)
    if new != html:
        open(path, "w", encoding="utf8", newline="").write(new)
    print(os.path.basename(path), len(pattern.findall(new)), "assets", "(changed)" if new != html else "(up to date)")
