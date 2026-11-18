// Собирает резюме (RU / EN / UZ) в media/cv/*.pdf из assets/js/config.js.
// Запуск из папки сайта: node tools/cv/build.mjs   (нужен установленный Google Chrome)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const site = resolve(process.argv[2] || ".");
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(site, "assets/js/config.js"), "utf8"), ctx);
const S = ctx.window.SITE;

const CHROME = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));

const L = {
  ru: {
    role: "Full Stack-разработчик · изучаю AI и ML",
    where: "Узбекистан",
    summaryH: "Обо мне",
    summary: "Full Stack-разработчик и студент TSUE. Делаю веб-приложения целиком: интерфейс и анимации, логику, работу с внешними API и деплой. Пишу на JavaScript (Vue, Three.js) и Python. Сейчас изучаю искусственный интеллект и машинное обучение.",
    skillsH: "Навыки",
    skills: [
      ["Frontend", "JavaScript, Vue 3, Pinia, Three.js, HTML, CSS / SCSS, Canvas API, GSAP"],
      ["Backend и инструменты", "Python, REST API (TMDB, OpenWeather, GitHub, Chess.com), PeerJS / WebRTC, Git, GitHub Actions, GitHub Pages"],
      ["Изучаю", "AI, машинное обучение"],
    ],
    projectsH: "Проекты",
    demo: "демо", code: "код",
    productH: "Своё приложение",
    product: ["Kanatobi", "Приложение для изучения японского языка. Сейчас на закрытом тестировании в Google Play, открытый релиз скоро."],
    eduH: "Образование",
    edu: ["Ташкентский государственный экономический университет (TSUE)", "Студент, с 2025"],
    site: "Портфолио",
  },
  en: {
    role: "Full Stack developer · learning AI & ML",
    where: "Uzbekistan",
    summaryH: "Summary",
    summary: "Full Stack developer and TSUE student. I build web apps end to end: interface and motion, logic, work with external APIs and deployment. I write JavaScript (Vue, Three.js) and Python. Currently learning artificial intelligence and machine learning.",
    skillsH: "Skills",
    skills: [
      ["Frontend", "JavaScript, Vue 3, Pinia, Three.js, HTML, CSS / SCSS, Canvas API, GSAP"],
      ["Backend & tools", "Python, REST APIs (TMDB, OpenWeather, GitHub, Chess.com), PeerJS / WebRTC, Git, GitHub Actions, GitHub Pages"],
      ["Learning", "AI, machine learning"],
    ],
    projectsH: "Projects",
    demo: "demo", code: "code",
    productH: "Own product",
    product: ["Kanatobi", "An app for learning Japanese. Currently in closed testing on Google Play, public release coming soon."],
    eduH: "Education",
    edu: ["Tashkent State University of Economics (TSUE)", "Student, since 2025"],
    site: "Portfolio",
  },
  uz: {
    role: "Full Stack dasturchi · AI va ML'ni o'rganyapman",
    where: "O'zbekiston",
    summaryH: "Men haqimda",
    summary: "Full Stack dasturchi va TSUE talabasi. Veb-ilovalarni to'liq yarataman: interfeys va animatsiyalar, mantiq, tashqi API'lar bilan ishlash va deploy. JavaScript (Vue, Three.js) va Python'da yozaman. Hozir sun'iy intellekt va mashinali o'qitishni o'rganyapman.",
    skillsH: "Ko'nikmalar",
    skills: [
      ["Frontend", "JavaScript, Vue 3, Pinia, Three.js, HTML, CSS / SCSS, Canvas API, GSAP"],
      ["Backend va vositalar", "Python, REST API (TMDB, OpenWeather, GitHub, Chess.com), PeerJS / WebRTC, Git, GitHub Actions, GitHub Pages"],
      ["O'rganyapman", "AI, mashinali o'qitish"],
    ],
    projectsH: "Loyihalar",
    demo: "demo", code: "kod",
    productH: "O'z ilovam",
    product: ["Kanatobi", "Yapon tilini o'rganish uchun ilova. Hozir Google Play'da yopiq testda, ochiq reliz yaqin."],
    eduH: "Ta'lim",
    edu: ["Toshkent davlat iqtisodiyot universiteti (TSUE)", "Talaba, 2025-yildan"],
    site: "Portfolio",
  },
};

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const bare = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
const SITE_URL = "https://shaha01.github.io/Shakhriyor/";

function page(lang) {
  const t = L[lang];
  const contacts = [
    [`mailto:${S.links.email}`, S.links.email],
    [S.links.telegram, bare(S.links.telegram)],
    [S.links.github, bare(S.links.github)],
    [SITE_URL, bare(SITE_URL)],
  ];
  const projects = S.projects.map((p) => `
    <div class="pr">
      <div class="pr__top"><b>${esc(p.title)}</b><span class="pr__stack">${esc(p.lang)}</span>
        <span class="pr__links">${p.demo ? `<a href="${esc(p.demo)}">${t.demo}</a> · ` : ""}<a href="https://github.com/${esc(p.repo)}">${t.code}</a></span></div>
      <p>${esc(p.desc[lang] || p.desc.en)}</p>
    </div>`).join("");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>Abrorov Shahriyor — CV</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font: 10.4pt/1.45 "Manrope", system-ui, sans-serif; color: #15151a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { position: relative; width: 210mm; min-height: 297mm; padding: 15mm 16mm 14mm 19mm; }
  .sheet::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 5mm; background: linear-gradient(180deg, #ff2a3d 0 34%, #ffd400 34% 67%, #2b4cff 67%); }
  h1 { font: 800 24pt/1 "Unbounded", "Arial Black", sans-serif; letter-spacing: -.02em; }
  .role { margin-top: 3mm; font-weight: 700; font-size: 12pt; color: #ff2a3d; }
  .contacts { display: flex; flex-wrap: wrap; gap: 1.5mm 5mm; margin-top: 3mm; font-size: 9.4pt; color: #444; }
  a { color: inherit; text-decoration: none; }
  .contacts a { border-bottom: 1px solid #ccc; }
  h2 { margin: 6.5mm 0 2.5mm; font: 800 10pt/1 "Unbounded", sans-serif; text-transform: uppercase; letter-spacing: .06em; display: flex; align-items: center; gap: 3mm; }
  h2::after { content: ""; flex: 1; height: 1px; background: #e2e2e8; }
  .skills { display: grid; grid-template-columns: 38mm 1fr; gap: 1.6mm 4mm; }
  .skills b { font-weight: 700; }
  .pr { margin-bottom: 2.6mm; break-inside: avoid; }
  .pr__top { display: flex; align-items: baseline; gap: 3mm; flex-wrap: wrap; }
  .pr__top b { font-weight: 700; font-size: 10.8pt; }
  .pr__stack { color: #666; font-size: 9pt; }
  .pr__links { margin-left: auto; font-size: 9pt; color: #ff2a3d; }
  .pr p { color: #333; font-size: 9.6pt; }
  .row { display: flex; justify-content: space-between; gap: 4mm; }
  .row b { font-weight: 700; }
  .muted { color: #666; }
  .foot { position: absolute; left: 19mm; right: 16mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: #888; }
</style></head><body><div class="sheet">
  <h1>Abrorov Shahriyor</h1>
  <p class="role">${esc(t.role)}</p>
  <p class="contacts">${contacts.map(([h, x]) => `<a href="${esc(h)}">${esc(x)}</a>`).join("")}<span>${esc(t.where)}</span></p>

  <h2>${esc(t.summaryH)}</h2>
  <p>${esc(t.summary)}</p>

  <h2>${esc(t.skillsH)}</h2>
  <div class="skills">${t.skills.map(([k, v]) => `<b>${esc(k)}</b><span>${esc(v)}</span>`).join("")}</div>

  <h2>${esc(t.projectsH)}</h2>
  ${projects}

  <h2>${esc(t.productH)}</h2>
  <div class="pr"><div class="pr__top"><b>${esc(t.product[0])}</b><span class="pr__stack">Google Play</span></div><p>${esc(t.product[1])}</p></div>

  <h2>${esc(t.eduH)}</h2>
  <div class="row"><b>${esc(t.edu[0])}</b><span class="muted">${esc(t.edu[1])}</span></div>

  <div class="foot"><span>${esc(t.site)}: ${bare(SITE_URL)}</span><span>${new Date().getFullYear()}</span></div>
</div></body></html>`;
}

if (!CHROME) throw new Error("Google Chrome not found (set CHROME=path)");
const outDir = join(site, "media", "cv");
const tmpDir = join(site, "tools", "cv", ".out");
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });
for (const lang of Object.keys(L)) {
  const html = join(tmpDir, `cv-${lang}.html`);
  writeFileSync(html, page(lang));
  const pdf = join(site, S.cv[lang]);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000",
    `--print-to-pdf=${pdf}`, pathToFileURL(html).href], { stdio: "ignore" });
  console.log(lang, "→", S.cv[lang]);
}
