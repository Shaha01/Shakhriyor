/* ==========================================================
   SITE CONFIG — редактируй этот файл, чтобы менять данные сайта
   ========================================================== */
window.SITE = {
  birthDate: "2007-10-12",

  links: {
    instagram: "https://www.instagram.com/shahriyor_abrorov",
    github: "https://github.com/Shaha01",
    telegram: "https://t.me/shakhriyorabrorov",
    steam: "https://steamcommunity.com/profiles/76561199409199143",
    spotify: "https://open.spotify.com/user/31l6w357mk26et2gofhd6k7maoui",
    spotifyPlaylist: "0TbHACo5NOmWhRs7Db3Er2", // ID плейлиста из ссылки open.spotify.com/playlist/<ID>
    csstats: "https://csstats.gg/player/76561199409199143",
    chess: "https://www.chess.com/member/shahrikabrorov",
    email: "shahriyorabrorovtech@gmail.com",
  },

  /* Проекты добавляются вручную: карточки показываются в том порядке, в котором записаны.
     Поля: repo (владелец/имя на GitHub), title, lang, tag, art (запасной фон без превью: cinema | cyber | ember | lime | ice),
     desc (ru/en/uz), demo (ссылка на live demo), preview (картинка/анимированный SVG 16:10 из media/projects). */
  projects: [
    {
      repo: "Shaha01/CiniPhille",
      title: "CiniPhille",
      lang: "Vue · Pinia",
      tag: "CINEMA",
      art: "cinema",
      desc: {
        ru: "Кино-каталог на Vue 3 + Pinia с живыми данными TMDB: фильмы и сериалы, поиск, трейлеры, актёры, «Скоро в кино» и избранное. RU/EN.",
        en: "A Vue 3 + Pinia movie catalog on live TMDB data: films and series, search, trailers, cast, upcoming releases and favourites. RU/EN.",
        uz: "Vue 3 + Pinia'da TMDB jonli ma'lumotlari bilan kino katalogi: filmlar va seriallar, qidiruv, treylerlar, aktyorlar, tez kunda va sevimlilar. RU/EN.",
      },
      demo: "https://shaha01.github.io/CiniPhille",
      preview: "media/projects/ciniphille.svg",
    },
    {
      repo: "Shaha01/Cyberpunk2077-VUE",
      title: "Cyberpunk 2077",
      lang: "SCSS · Vue",
      tag: "NIGHT CITY",
      art: "cyber",
      desc: {
        ru: "Фан-лендинг Cyberpunk 2077 на Vue: экран загрузки нейроинтерфейса, лор, районы Night City, персонажи, хронология и Phantom Liberty. RU/EN/UZ.",
        en: "A Cyberpunk 2077 fan landing in Vue: neural-link boot screen, lore, Night City districts, characters, timeline and Phantom Liberty. RU/EN/UZ.",
        uz: "Vue'da Cyberpunk 2077 fan-landingi: neyrointerfeys yuklanish ekrani, lor, Night City tumanlari, personajlar, xronologiya va Phantom Liberty. RU/EN/UZ.",
      },
      demo: "https://shaha01.github.io/Cyberpunk2077-VUE/",
      preview: "media/projects/cyberpunk.svg",
    },
    {
      repo: "Shaha01/PingPong",
      title: "Ping Pong",
      lang: "JavaScript · Canvas",
      tag: "GAME",
      art: "ember",
      desc: {
        ru: "Пинг-понг в стиле F1 на Canvas: старт по огням, игра против компьютера, вдвоём на одной клавиатуре или онлайн через PeerJS. До 15 очков.",
        en: "F1-styled ping pong on Canvas: lights-out start, play vs the computer, two players on one keyboard or online via PeerJS. First to 15.",
        uz: "Canvas'da F1 uslubidagi ping-pong: chiroqlar bo'yicha start, kompyuterga qarshi, bitta klaviaturada ikki kishi yoki PeerJS orqali onlayn. 15 ochkogacha.",
      },
      demo: "https://shaha01.github.io/PingPong",
      preview: "media/projects/pingpong.svg",
    },
    {
      repo: "Shaha01/Weather-VUE",
      title: "SHA Weather",
      lang: "Vue · OpenWeather",
      tag: "LIVE WEATHER",
      art: "ice",
      desc: {
        ru: "Погода в реальном времени на Vue и OpenWeather: геолокация и поиск города, местное время, почасовой и 8-дневный прогноз, живые эффекты дождя, снега и грозы. °C/°F, RU/EN.",
        en: "Real-time weather on Vue and OpenWeather: geolocation and city search, local time, hourly and 8-day forecast, live rain, snow and storm effects. °C/°F, RU/EN.",
        uz: "Vue va OpenWeather'da real vaqtdagi ob-havo: geolokatsiya va shahar qidiruvi, mahalliy vaqt, soatlik va 8 kunlik prognoz, yomg'ir, qor va momaqaldiroqning jonli effektlari. °C/°F, RU/EN.",
      },
      demo: "https://shaha01.github.io/Weather-VUE/",
      preview: "media/projects/weather.svg",
    },
    {
      repo: "Shaha01/F1-Maps",
      title: "F1 Maps",
      lang: "JavaScript · Three.js",
      tag: "3D CIRCUITS",
      art: "ember",
      desc: {
        ru: "3D-трассы Формулы-1 на Three.js: все автодромы сезона 2026 с реальным рельефом, симуляция круга с телеметрией (скорость, передача, газ/тормоз), камеры орбита/погоня/онборд и профиль высот. RU/EN/UZ.",
        en: "Formula 1 circuits in 3D on Three.js: every 2026 track with real elevation, a simulated lap with telemetry (speed, gear, throttle/brake), orbit/chase/onboard cameras and an elevation profile. RU/EN/UZ.",
        uz: "Three.js'da Formula-1 trassalari 3D'da: 2026 mavsumining barcha avtodromlari haqiqiy relyef bilan, telemetriyali aylana simulyatsiyasi (tezlik, uzatma, gaz/tormoz), orbita/quvish/onbord kameralari va balandlik profili. RU/EN/UZ.",
      },
      demo: "https://shaha01.github.io/F1-Maps/",
      preview: "media/projects/f1-maps.svg",
    },
    {
      repo: "Monarch-IT-Team/monarch-portfolio",
      title: "Monexarch",
      lang: "Astro · Three.js",
      tag: "TEAM · MONARCH IT",
      art: "lime",
      desc: {
        ru: "Командный проект Monarch IT: сайт-визитка на Astro, TypeScript и Three.js со своими шейдерами. При прокрутке камера отдаляется от звезды до вселенной, есть генеративный звук, терминал и проекты, которые подтягиваются с GitHub. UZ/RU/EN.",
        en: "A Monarch IT team project: a portfolio site on Astro, TypeScript and Three.js with custom shaders. Scrolling pulls the camera out from a star to the whole universe, with generative sound, a terminal and projects pulled from GitHub. UZ/RU/EN.",
        uz: "Monarch IT jamoaviy loyihasi: Astro, TypeScript va o'z shaderlari bilan Three.js'da sayt-vizitka. Aylantirganda kamera yulduzdan butun koinotgacha uzoqlashadi, generativ ovoz, terminal va GitHub'dan olinadigan loyihalar bor. UZ/RU/EN.",
      },
      demo: "https://monarch-it-team.github.io/monarch-portfolio/",
      preview: "media/projects/monarch.svg",
    },
  ],

  /* Статистика CS2. csstats.gg не отдаёт данные автоматически — впиши цифры вручную.
     Оставь null, чтобы скрыть показатель. */
  cs2Stats: {
    premier: null, // например 15400
    kd: null, // например 1.12
    hs: null, // например 48  (в %)
    winrate: null, // например 54 (в %)
    matches: null, // например 320
  },

  /* Посты Instagram (новые сверху) */
  instagramPosts: [
    "DfcnzeIjfPy",
    "DfcIMYOtR5p",
    "DdwmDUMNwHU",
    "DbekfKojADZ",
    "Da57CJutYOh",
    "DY99MmjN_o9",
    "DY6fhokDT-4",
    "DXeySmrjboS",
    "DUvbACdDTSh",
    "DT0y3AijcCD",
    "DT0yQLqjWn_",
    "DKOkHSCtJ4J",
    "DDRBhIet5PM",
  ],

  games: ["Counter-Strike 2", "GTA V", "Forza Horizon 6", "Forza Horizon 5", "F1 Manager", "Euro Truck Simulator 2", "NFS Hot Pursuit", "Chess.com"],

  /* Chess.com: рейтинги и партии подтягиваются автоматически по нику.
     maxWins — сколько последних побед показывать в повторах. */
  chess: { user: "shahrikabrorov", maxWins: 12 },
};
