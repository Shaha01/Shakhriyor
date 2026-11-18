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
    anixart: "https://anixart-app.com/profile/2710957",
    email: "shahriyorabrorovtech@gmail.com",
  },

  /* Резюме (PDF): собираются из этого файла командой node tools/cv/build.mjs */
  cv: {
    ru: "media/cv/Abrorov_Shahriyor_CV_RU.pdf",
    en: "media/cv/Abrorov_Shahriyor_CV_EN.pdf",
    uz: "media/cv/Abrorov_Shahriyor_CV_UZ.pdf",
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
      preview: "media/projects/ciniphille.webp",
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
      preview: "media/projects/cyberpunk.webp",
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
      preview: "media/projects/pingpong.webp",
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
      preview: "media/projects/weather.webp",
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
      preview: "media/projects/f1-maps.webp",
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
      preview: "media/projects/monarch.webp",
    },
  ],

  /* Самые любимые аниме: показываются отдельным блоком в этом порядке.
     k — ключ тайтла из assets/js/anime.js (там же постер, годы и оценка), desc — описание на ru/en/uz. */
  animeFavorites: [
    { k: "aot", desc: {
      ru: "Человечество прячется за стенами от титанов-людоедов, пока Эрен не узнаёт, что правда за ними куда страшнее.",
      en: "Humanity hides behind walls from man-eating titans, until Eren learns the truth beyond them is far darker.",
      uz: "Insoniyat odamxo'r titanlardan devorlar ortida yashiringan, toki Eren ularning ortidagi haqiqat ancha dahshatliroq ekanini bilmaguncha.",
    } },
    { k: "vinland", desc: {
      ru: "Сага о викингах: Торфинн растёт ради мести, а потом ищет, ради чего вообще стоит жить без войны.",
      en: "A Viking saga: Thorfinn grows up living for revenge, then searches for a reason to live without war.",
      uz: "Vikinglar dostoni: Torfinn qasos uchun ulg'ayadi, so'ng urushsiz yashashning ma'nosini izlaydi.",
    } },
    { k: "a3020", desc: {
      ru: "Школьник находит тетрадь, которая убивает любого, чьё имя в неё вписано, и вступает в дуэль умов с детективом L.",
      en: "A student finds a notebook that kills anyone whose name is written in it and starts a battle of wits with the detective L.",
      uz: "O'quvchi ismi yozilgan har qanday odamni o'ldiradigan daftarni topadi va detektiv L bilan aql jangini boshlaydi.",
    } },
    { k: "jigokuraku", desc: {
      ru: "Легендарного ниндзя-смертника отправляют на загадочный остров за эликсиром бессмертия в обмен на помилование.",
      en: "A legendary ninja on death row is sent to a mysterious island for the elixir of life in exchange for a pardon.",
      uz: "O'limga hukm qilingan afsonaviy ninja afv evaziga mangulik eliksirini topish uchun sirli orolga yuboriladi.",
    } },
    { k: "a18244", desc: {
      ru: "Футбол без прикрас: парень из провинции попадает в академию токийского клуба и учится думать на поле.",
      en: "Football done right: a kid from the countryside joins a Tokyo club's academy and learns to think on the pitch.",
      uz: "Haqiqiy futbol: viloyatlik yigit Tokio klubining akademiyasiga tushadi va maydonda fikrlashni o'rganadi.",
    } },
    { k: "geass", desc: {
      ru: "Изгнанный принц получает силу абсолютного приказа и в маске Зеро поднимает восстание против империи.",
      en: "An exiled prince gains the power of absolute command and, masked as Zero, leads a rebellion against the empire.",
      uz: "Surgun qilingan shahzoda mutlaq buyruq kuchiga ega bo'ladi va Zero niqobi ostida imperiyaga qarshi qo'zg'olon ko'taradi.",
    } },
    { k: "ghoul", desc: {
      ru: "После нападения гуля студент Канеки становится наполовину монстром и застревает между двумя мирами.",
      en: "After a ghoul attack, student Kaneki becomes half-monster and gets stuck between two worlds.",
      uz: "Gul hujumidan so'ng talaba Kaneki yarim maxluqqa aylanadi va ikki dunyo orasida qolib ketadi.",
    } },
    { k: "moriarty", desc: {
      ru: "Шерлок Холмс глазами Мориарти: гениальный преступник против классовой системы викторианской Англии.",
      en: "Sherlock Holmes from Moriarty's side: a criminal genius taking on the class system of Victorian England.",
      uz: "Sherlok Xolms Moriarti nigohida: daho jinoyatchi Viktoriya davri Angliyasining tabaqaviy tizimiga qarshi.",
    } },
    { k: "a19486", desc: {
      ru: "Лучший киллер Японии получает приказ целый год прожить обычной жизнью и никого не убивать.",
      en: "Japan's best hitman is ordered to live an ordinary life for a whole year without killing anyone.",
      uz: "Yaponiyaning eng zo'r qotiliga butun bir yil oddiy hayot kechirish va hech kimni o'ldirmaslik buyuriladi.",
    } },
    { k: "a1788", desc: {
      ru: "Эпоха сухого закона: парень под чужим именем входит в мафиозную семью, чтобы отомстить за родных.",
      en: "The Prohibition era: a young man joins a mafia family under a false name to avenge his own.",
      uz: "Quruq qonun davri: yigit oilasi uchun qasos olish maqsadida soxta ism bilan mafiya oilasiga kiradi.",
    } },
    { k: "a1271", desc: {
      ru: "Деревенский парень приезжает в столицу, видит её гнилую изнанку и вступает в отряд убийц Night Raid.",
      en: "A village boy comes to the capital, sees its rotten core and joins the assassin group Night Raid.",
      uz: "Qishloqlik yigit poytaxtga keladi, uning chirigan ichini ko'radi va Night Raid qotillar guruhiga qo'shiladi.",
    } },
    { k: "a18606", desc: {
      ru: "Пятерых друзей втягивают в игру из-за долга в 20 миллионов иен, где главное оружие — недоверие.",
      en: "Five friends are dragged into a game over a 20-million-yen debt, where distrust is the main weapon.",
      uz: "Besh do'st 20 million iyenlik qarz sababli o'yinga tortiladi, unda asosiy qurol — ishonchsizlik.",
    } },
    { k: "a18849", desc: {
      ru: "Слабейший охотник на драконов объединяется с самим собой из будущего, чтобы убить сильнейших драконов.",
      en: "The weakest dragon hunter teams up with his future self to slay the strongest dragons.",
      uz: "Eng zaif ajdar ovchisi eng kuchli ajdarlarni o'ldirish uchun kelajakdagi o'zi bilan birlashadi.",
    } },
    { k: "eminence", desc: {
      ru: "Парень мечтает быть серым кардиналом в тени и разыгрывает выдуманный заговор, который оказывается настоящим.",
      en: "A guy who dreams of being the mastermind in the shadows plays out a made-up conspiracy that turns out to be real.",
      uz: "Soyadagi kulrang kardinal bo'lishni orzu qilgan yigit to'qima fitnani o'ynaydi, u esa haqiqiy bo'lib chiqadi.",
    } },
    { k: "naruto", desc: {
      ru: "Ниндзя-изгой с демоном-лисом внутри идёт к мечте стать Хокаге и заслужить признание деревни.",
      en: "An outcast ninja with a fox demon sealed inside chases his dream of becoming Hokage and earning the village's respect.",
      uz: "Ichida tulki-iblis muhrlangan quvg'in ninja Hokage bo'lish va qishloq e'tirofini qozonish orzusiga intiladi.",
    } },
    { k: "bluelock", desc: {
      ru: "300 нападающих заперты в проекте, который должен вырастить самого эгоистичного форварда в мире.",
      en: "300 strikers are locked into a project built to create the world's most egotistical forward.",
      uz: "300 hujumchi dunyodagi eng xudbin forvardni yetishtirish uchun tuzilgan loyihaga qamaladi.",
    } },
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
