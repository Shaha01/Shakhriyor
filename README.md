# Abrorov Shahriyor — portfolio

Personal site: **https://shaha01.github.io/Shakhriyor/**

Static site without a build step: HTML, CSS and vanilla JavaScript with GSAP (scroll animations) and Lenis (smooth scroll). Three languages: RU, EN, UZ.

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` | Work: hero, projects, the Kanatobi app, about, contacts, CV |
| `life.html` | Personal ("Pit stop"): Formula 1, CS2 clips, Forza garage, chess replays, anime list, photos, music |

Both pages share one stylesheet and one `assets/js/main.js`; every block in the script checks that its markup exists on the current page.

## Where to edit content

| File | Contents |
| --- | --- |
| `assets/js/config.js` | Links, projects, favourite anime, CV paths, chess user |
| `assets/js/i18n.js` | All texts in three languages |
| `assets/js/media.js` | Photo / video lists (`media/<folder>/<id>-s.webp`, `-l.webp`) |
| `assets/js/anime.js` | Anime ratings exported from Anixart (generated) |
| `assets/js/github.js` | Stars and update dates for project cards (generated) |

## Data from outside

- **Chess.com** and **Spotify** are loaded in the browser (public APIs).
- **GitHub** stats are fetched by GitHub Actions (`.github/workflows/build.yml`) after every push and once a day, so visitors don't hit the API rate limit.
- **Anixart** ratings are exported once by hand: `python tools/anime.py . <tmp dir>`, banners for favourites: `python tools/anime_banners.py .` (needs Pillow).

## Tools

| Command | What it does |
| --- | --- |
| `python -I tools/bump-version.py .` | Adds `?v=<hash>` to css/js links in every page (also done by the workflow) |
| `python -I tools/github-data.py .` | Regenerates `assets/js/github.js` |
| `node tools/cv/build.mjs .` | Builds the CV PDFs (RU / EN / UZ) into `media/cv/` with headless Chrome |

## Run locally

```sh
python -m http.server 8000
```

Then open http://localhost:8000/.
