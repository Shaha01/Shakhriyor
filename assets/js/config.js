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

  /* Закреплённые репозитории. desc — по языкам. Звёзды и дата подтягиваются с GitHub автоматически. */
  projects: [
    {
      repo: "Shaha01/CiniPhille",
      title: "CiniPhille",
      lang: "Vue",
      tag: "CINEMA",
      desc: {
        ru: "Веб-проект на Vue.js с живым демо на GitHub Pages.",
        en: "A Vue.js web project with a live demo on GitHub Pages.",
        uz: "Vue.js'da yozilgan veb-loyiha, GitHub Pages'da jonli demo bilan.",
      },
      demo: "https://shaha01.github.io/CiniPhille",
      preview: null, // сюда потом можно положить путь к картинке-превью, например "media/projects/ciniphille.webp"
    },
    {
      repo: "Shaha01/Cyberpunk2077-VUE",
      title: "Cyberpunk 2077",
      lang: "SCSS · Vue",
      tag: "NIGHT CITY",
      desc: {
        ru: "Лендинг в стилистике Cyberpunk 2077 на Vue и SCSS.",
        en: "A Cyberpunk 2077-styled landing page built with Vue and SCSS.",
        uz: "Cyberpunk 2077 uslubidagi landing — Vue va SCSS.",
      },
      demo: "https://shaha01.github.io/Cyberpunk2077-VUE/",
      preview: null,
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
