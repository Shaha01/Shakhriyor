"""Рисует карточки для превью ссылок (Telegram, WhatsApp, соцсети): media/og.jpg и media/og-life.jpg, 1200x630.

Запуск: python -I tools/og-image.py <папка сайта>   (нужен Pillow)
Шрифты берутся из системных Arial Black / Consolas (Windows); на других системах поменяй FONT_* ниже.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

site = sys.argv[1] if len(sys.argv) > 1 else "."
W, H = 1200, 630
BG, TEXT, MUTED = (5, 5, 6), (243, 243, 245), (139, 139, 151)
RED, YELLOW, BLUE = (255, 42, 61), (255, 212, 0), (43, 76, 255)
FONT_DISPLAY = r"C:\Windows\Fonts\ariblk.ttf"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"

CARDS = {
    "og.jpg": (["ABROROV", "SHAHRIYOR"], "FULL STACK DEVELOPER", "learning AI & ML  /  TSUE"),
    "og-life.jpg": (["PIT", "STOP"], "OUTSIDE OF CODE", "F1  /  games  /  anime  /  music"),
}


def card(lines, kicker, sub, out):
    img = Image.new("RGB", (W, H), BG)
    photo = Image.open(os.path.join(site, "media", "photos", "022-l.webp")).convert("RGB")
    pw = 520
    # crop the portrait to the right-hand panel's aspect ratio, anchored near the top so head and arms stay in frame
    ch = round(photo.width * H / pw)
    top = max(0, min(photo.height - ch, 60))
    photo = photo.crop((0, top, photo.width, top + min(ch, photo.height - top))).resize((pw, H), Image.LANCZOS)
    img.paste(photo, (W - pw, 0))
    # fade the photo's left edge into the background
    fade = Image.new("L", (160, H))
    fd = ImageDraw.Draw(fade)
    for x in range(160):
        fd.line([(x, 0), (x, H)], fill=int(255 * (x / 160) ** 0.6))
    black = Image.new("RGB", (160, H), BG)
    img.paste(black, (W - pw, 0), Image.eval(fade, lambda v: 255 - v))

    d = ImageDraw.Draw(img)
    big, mono, small = ImageFont.truetype(FONT_DISPLAY, 82), ImageFont.truetype(FONT_MONO, 30), ImageFont.truetype(FONT_MONO, 26)
    x, y = 72, 150
    d.text((x, y - 60), kicker, font=mono, fill=RED)
    for i, ln in enumerate(lines):
        d.text((x, y + i * 96), ln, font=big, fill=TEXT)
    d.text((x, y + len(lines) * 96 + 40), sub, font=small, fill=MUTED)
    for i, c in enumerate((RED, YELLOW, BLUE)):  # three stripes, same as the site's logo
        d.polygon([(x + i * 30 + 6, 540), (x + i * 30 + 22, 540), (x + i * 30 + 16, 580), (x + i * 30, 580)], fill=c)
    d.text((x + 110, 548), "shaha01.github.io/Shakhriyor", font=small, fill=MUTED)
    img.save(os.path.join(site, "media", out), "JPEG", quality=86, optimize=True, progressive=True)
    print(out, os.path.getsize(os.path.join(site, "media", out)) // 1024, "KB")


for name, (lines, kicker, sub) in CARDS.items():
    card(lines, kicker, sub, name)
