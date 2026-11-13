/* ==========================================================
   ABROROV SHAHRIYOR — main.js
   ========================================================== */
(() => {
  "use strict";

  const S = window.SITE;
  const T = window.I18N;
  const M = window.MEDIA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  const noop = () => {};
  const SFX = window.SFX || { supported: false, play: noop, speed: noop, duck: noop, unlock: noop, isOn: () => false, setEnabled: noop, toggle: noop, onChange: noop };

  if (hasGSAP) {
    document.documentElement.classList.add("js");
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const img = (folder, id, size) => `media/${folder}/${id}-${size}.webp`;
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const ageFrom = (iso) => {
    const b = new Date(iso), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  };
  const ruYears = (n) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return `${n} год`;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} года`;
    return `${n} лет`;
  };
  const locales = { ru: "ru-RU", en: "en-GB", uz: "uz-Latn-UZ" };
  const fmtDate = (iso, lang) => {
    try { return new Date(iso).toLocaleDateString(locales[lang], { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return iso.slice(0, 10); }
  };

  /* ---------------------------------------------------------
     Links
     --------------------------------------------------------- */
  $$("[data-link]").forEach((a) => {
    const k = a.dataset.link;
    if (k === "email") a.href = `mailto:${S.links.email}`;
    else if (S.links[k]) a.href = S.links[k];
  });
  $("#year").textContent = new Date().getFullYear();
  /* ---------------------------------------------------------
     TEAM RADIO: Spotify playlist with custom UI
     --------------------------------------------------------- */
  const PL = window.PLAYLIST || { tracks: [] };
  const np = { state: "idle", idx: -1, uri: null, title: PL.name || "Playlist", artist: "SHAHRIYOR", cover: "", pos: 0, dur: 0 };
  let spCtl = null, pendingPlay = false, pendingIdx = null, ended = false, lastPos = 0;
  const fmtMs = (ms) => {
    const s = Math.max(0, Math.floor((ms || 0) / 1000)), pad = (n) => String(n).padStart(2, "0");
    return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
  };
  const totalMs = PL.tracks.reduce((a, x) => a + (x[3] || 0), 0);
  const oembedCache = {};
  const oembed = (url) => {
    if (!oembedCache[url]) {
      oembedCache[url] = fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
        .then((r) => (r.ok ? r.json() : null)).catch(() => null);
    }
    return oembedCache[url];
  };
  function setCover(src) {
    if (!src || src === np.cover) return;
    np.cover = src;
    const cover = $("#npCover");
    cover.classList.add("is-swap");
    const im = new Image();
    im.onload = () => { cover.src = src; cover.classList.remove("is-swap"); };
    im.src = src;
  }

  // waveform bars
  const WAVE_N = 56;
  const waveEl = $("#npWave");
  if (waveEl) {
    waveEl.innerHTML = Array.from({ length: WAVE_N }, (_, i) => {
      const h = 25 + Math.abs(Math.sin(i * 0.55) * 55) + Math.random() * 20;
      return `<i style="--h:${h.toFixed(0)}%;--d:${(-Math.random()).toFixed(2)}s"></i>`;
    }).join("");
  }
  const waveBars = waveEl ? $$("i", waveEl) : [];

  function renderNP() {
    const box = $("#np");
    if (!box) return;
    box.classList.toggle("is-playing", np.state === "playing");
    SFX.duck(np.state === "playing"); // no engine hum over the music
    $("#npState").textContent = t(np.state === "playing" ? "spotify.playing" : np.state === "paused" ? "spotify.paused" : "spotify.idle");
    $("#npTitle").textContent = np.title;
    $("#npArtist").textContent = np.artist;
    const idle = np.idx < 0;
    const p = !idle && np.dur ? Math.min(1, np.pos / np.dur) : 0;
    $("#npPos").textContent = fmtMs(idle ? 0 : np.pos);
    $("#npDur").textContent = fmtMs(idle ? totalMs : np.dur);
    $("#npBar").style.width = `${(p * 100).toFixed(1)}%`;
    const on = Math.round(p * WAVE_N);
    waveBars.forEach((b, i) => b.classList.toggle("on", i < on));
    $("#npCount").textContent = `${PL.tracks.length} ${t("spotify.tracks")} · ${Math.floor(totalMs / 3600000)}h ${Math.round((totalMs % 3600000) / 60000)}m`;
    $$("#npList button").forEach((b, i) => b.classList.toggle("is-active", i === np.idx));
  }

  function renderList() {
    const list = $("#npList");
    if (!list) return;
    list.innerHTML = PL.tracks.map(([, title, artist, dur], i) => `
      <li><button data-i="${i}"><span class="t"><b>${title}</b><span>${artist}</span></span><span class="d">${fmtMs(dur)}</span></button></li>`).join("");
    $$("button", list).forEach((b) => b.addEventListener("click", () => playIndex(+b.dataset.i)));
    bindCursorTargets(list);
  }

  function setTrackInfo(i) {
    const [id, title, artist, dur] = PL.tracks[i];
    np.idx = i;
    np.uri = `spotify:track:${id}`;
    np.title = title;
    np.artist = artist;
    np.dur = dur;
    np.pos = 0;
    oembed(`https://open.spotify.com/track/${id}`).then((d) => { if (d && np.idx === i) setCover(d.thumbnail_url); });
    const btn = $(`#npList button[data-i="${i}"]`);
    if (btn) { const list = $("#npList"); list.scrollTo({ top: btn.offsetTop - list.clientHeight / 2 + btn.offsetHeight / 2, behavior: "smooth" }); }
  }

  function playIndex(i) {
    if (!PL.tracks.length) return;
    i = (i + PL.tracks.length) % PL.tracks.length;
    setTrackInfo(i);
    ended = false; lastPos = 0;
    np.state = "playing";
    renderNP();
    if (spCtl) { pendingPlay = true; spCtl.loadUri(np.uri); }
    else { pendingIdx = i; loadSpotify(); }
  }

  $("#npPlay").dataset.sfx = "radio";
  $("#npPlay").addEventListener("click", () => {
    if (np.idx < 0) return playIndex(0);
    if (spCtl) spCtl.togglePlay();
  });
  $("#npPrev").addEventListener("click", () => playIndex(np.idx < 0 ? 0 : np.pos > 4000 ? np.idx : np.idx - 1));
  $("#npNext").addEventListener("click", () => playIndex(np.idx + 1));

  function onPlayback(d) {
    if (np.idx < 0 && d.isPaused) return; // embed reporting its preloaded track — stay idle
    if (d.playingURI && d.playingURI !== np.uri) {
      const k = PL.tracks.findIndex((x) => `spotify:track:${x[0]}` === d.playingURI);
      if (k >= 0) setTrackInfo(k);
      else np.uri = d.playingURI; // relinked/regional ID — keep the title we already show
    }
    if (np.idx < 0 && !d.isPaused) setTrackInfo(0);
    if (!d.isBuffering) np.state = d.isPaused ? "paused" : "playing";
    np.pos = d.position || 0;
    if (d.duration) np.dur = d.duration;
    renderNP();
    // auto-advance to the next track at the end
    const nearEnd = d.duration > 0 && d.position >= d.duration - 700;
    const resetAfterEnd = d.isPaused && d.position === 0 && lastPos > (d.duration || np.dur) - 2000;
    if (!ended && np.idx >= 0 && (nearEnd || resetAfterEnd)) {
      ended = true;
      setTimeout(() => playIndex(np.idx + 1), 600);
    }
    lastPos = d.position || 0;
  }

  function loadSpotify() {
    if (window.__spLoaded) return;
    window.__spLoaded = true;
    const s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1";
    s.async = true;
    s.onerror = () => { const a = $("#np .link-arrow"); if (a) a.style.borderColor = "var(--neon)"; };
    document.body.appendChild(s);
  }

  if (S.links.spotifyPlaylist && $("#np")) {
    const pid = S.links.spotifyPlaylist;
    renderList();
    oembed(`https://open.spotify.com/playlist/${pid}`).then((d) => { if (d && np.idx < 0) { setCover(d.thumbnail_url); if (d.title) np.title = d.title; renderNP(); } });

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const first = PL.tracks.length ? `spotify:track:${PL.tracks[0][0]}` : `spotify:playlist:${pid}`;
      IFrameAPI.createController($("#spotifyEmbed"), { uri: first, width: "100%", height: 80 }, (ctl) => {
        spCtl = ctl;
        const fr = $(".radio__embed iframe");
        if (fr && !/theme=0/.test(fr.src)) fr.src += (fr.src.includes("?") ? "&" : "?") + "theme=0";
        ctl.addListener("ready", () => { if (pendingPlay) { pendingPlay = false; ctl.play(); } });
        ctl.addListener("playback_update", (e) => onPlayback(e.data || {}));
        if (pendingIdx !== null) { const i = pendingIdx; pendingIdx = null; playIndex(i); }
      });
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((ents) => { if (ents.some((x) => x.isIntersecting)) { loadSpotify(); io.disconnect(); } }, { rootMargin: "800px 0px" });
      io.observe($("#np"));
    } else loadSpotify();
  } else if ($("#np")) {
    $("#np").remove();
  }

  /* ---------------------------------------------------------
     Split text into words (keeps <em>, <strong>, <br>)
     --------------------------------------------------------- */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const parts = ch.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.textContent = p;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && ch.tagName !== "BR" && !ch.classList.contains("w")) {
          walk(ch);
        }
      });
    };
    walk(el);
    if (hasGSAP && !reduced) {
      const inners = $$(".w > span", el);
      gsap.set(inners, { yPercent: el.dataset.shown ? 0 : 110 });
    }
  }

  /* ---------------------------------------------------------
     i18n
     --------------------------------------------------------- */
  let lang = store.get("lang");
  if (!T[lang]) {
    const nl = (navigator.language || "ru").toLowerCase();
    lang = nl.startsWith("uz") ? "uz" : nl.startsWith("en") ? "en" : "ru";
  }
  const t = (k) => (T[lang] && T[lang][k]) ?? T.ru[k] ?? k;

  function applyLang(l) {
    lang = l;
    store.set("lang", l);
    document.documentElement.lang = l;
    document.title = t("meta.title");
    $$("[data-i18n]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18n);
      if (el.classList.contains("split")) splitWords(el);
    });
    // split headings without i18n key (static)
    $$(".split:not([data-i18n])").forEach((el) => { if (!el.dataset.splitDone) { splitWords(el); el.dataset.splitDone = 1; } });

    const age = ageFrom(S.birthDate);
    $$("[data-age]").forEach((el) => { el.textContent = l === "ru" ? ruYears(age) : t("age.unit").replace("{n}", age); });
    $$("[data-age-num]").forEach((el) => { el.textContent = age; });

    $$(".lang button").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === l));
    moveLangPill();
    renderProjects();
    renderStats();
    renderNP();
    renderChess();
    syncSound();
    requestAnimationFrame(moveNavInk); // link widths change with the language
    $$(".tabs").forEach(moveInk);
    if (hasGSAP) ScrollTrigger.refresh();
  }

  function moveLangPill() {
    const active = $(".lang button.is-active");
    const pill = $(".lang__pill");
    if (!active || !pill) return;
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft - 3}px)`;
  }
  $$(".lang button").forEach((b) => { b.dataset.sfx = "blip"; b.addEventListener("click", () => applyLang(b.dataset.lang)); });

  /* ---------------------------------------------------------
     Sound: toggle + UI sounds for the whole page
     --------------------------------------------------------- */
  const sndBtn = $("#soundToggle");
  function syncSound() {
    if (!sndBtn || !sndBtn.isConnected) return;
    const on = SFX.isOn();
    sndBtn.classList.toggle("is-on", on);
    sndBtn.setAttribute("aria-pressed", String(on));
    sndBtn.setAttribute("aria-label", t(on ? "sound.on" : "sound.off"));
    sndBtn.title = t(on ? "sound.on" : "sound.off");
  }
  if (sndBtn && !SFX.supported) sndBtn.remove();
  else if (sndBtn) {
    sndBtn.dataset.sfx = "none";
    sndBtn.addEventListener("click", () => {
      SFX.toggle();
      if (SFX.isOn()) setTimeout(() => SFX.play("blip"), 60);
    });
    SFX.onChange(syncSound);
  }
  // Elements that open the lightbox get the "open" sound from openLightbox()
  const SFX_SKIP = ".shot, .tile, .gta__art, #lbPrev, #lbNext, #lbClose, #loader";
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a, button, [role=tab]");
    if (!el || el.closest(SFX_SKIP)) return;
    if (el.dataset.dir) return SFX.play("whoosh", +el.dataset.dir);
    const s = el.dataset.sfx || "click";
    if (s !== "none") SFX.play(s);
  }, true);
  if (finePointer) {
    let hov = null;
    document.addEventListener("pointerover", (e) => {
      const el = e.target.closest("a, button, .shot, .tile, .chip, .social, .magnetic");
      if (el === hov) return;
      hov = el;
      if (el && !el.closest("#loader")) SFX.play("tick");
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Projects
     --------------------------------------------------------- */
  const ghCache = {};
  function renderProjects() {
    const grid = $("#projectsGrid");
    grid.innerHTML = S.projects.map((p, i) => {
      const gh = ghCache[p.repo] || {};
      const artClass = i % 2 === 0 ? "project__art--cinema" : "project__art--cyber";
      const visual = p.preview
        ? `<img src="${p.preview}" alt="${p.title}" loading="lazy">`
        : `<div class="project__art ${artClass}"></div><div class="project__art-text">${p.title}<small>${p.tag}</small></div>`;
      return `
      <article class="project tilt" data-cursor="view">
        <div class="project__visual">
          ${visual}
          <span class="project__lang"><i></i>${p.lang}</span>
        </div>
        <div class="project__body">
          <div class="project__top">
            <h3 class="project__title">${p.title}</h3>
            <div class="project__meta">
              <span>★ ${gh.stars ?? "—"}</span>
              ${gh.pushed ? `<span>${t("projects.updated")} ${fmtDate(gh.pushed, lang)}</span>` : ""}
            </div>
          </div>
          <p class="project__desc">${(gh.desc && !p.desc) ? gh.desc : (p.desc[lang] || p.desc.ru)}</p>
          <div class="project__links">
            ${p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">${t("projects.demo")} ↗</a>` : ""}
            <a href="https://github.com/${p.repo}" target="_blank" rel="noopener">${t("projects.code")} ↗</a>
          </div>
        </div>
        <div class="project__glare"></div>
      </article>`;
    }).join("");
    bindTilt($$(".project", grid));
    bindCursorTargets(grid);
  }

  async function fetchGitHub() {
    try {
      const reqs = S.projects.map((p) => fetch(`https://api.github.com/repos/${p.repo}`).then((r) => (r.ok ? r.json() : null)));
      const user = fetch(`https://api.github.com/users/${S.links.github.split("/").pop()}`).then((r) => (r.ok ? r.json() : null));
      const res = await Promise.all(reqs);
      res.forEach((j, i) => { if (j) ghCache[S.projects[i].repo] = { stars: j.stargazers_count, pushed: j.pushed_at, desc: j.description }; });
      const u = await user;
      if (u && u.public_repos) $("#repoCount").textContent = u.public_repos;
      renderProjects();
    } catch (e) { /* offline or rate-limited — keep static */ }
  }

  /* ---------------------------------------------------------
     CS2
     --------------------------------------------------------- */
  function renderCS2() {
    $("#clipCount").textContent = M.cs2.length;
    renderCollage();
  }

  /* Collage: the clips as a random mosaic of big and small rectangles.
     The layout is re-rolled on every page load. A guillotine split guarantees the
     tiles always fill a perfect rectangle with no holes. */
  const COLLAGE_DESKTOP = 8, COLLAGE_MOBILE = 6; // how many clips the mosaic shows (more = heavier page)
  const TILE_H = 0.5625; // one grid row is 9/16 of a column, so a unit cell has a 16:9 shape
  function makeLayout(n, C, R, minW, minH) {
    const rnd = Math.random;
    const aspect = (r) => r.w / (r.h * TILE_H);
    for (let attempt = 0; attempt < 80; attempt++) {
      const rects = [{ x: 0, y: 0, w: C, h: R }];
      let ok = true;
      while (rects.length < n) {
        const cand = rects.filter((r) => r.w >= minW * 2 || r.h >= minH * 2);
        if (!cand.length) { ok = false; break; }
        const weights = cand.map((r) => Math.pow(r.w * r.h, 0.8));
        let pick = rnd() * weights.reduce((a, b) => a + b, 0), k = 0;
        while (k < cand.length - 1 && (pick -= weights[k]) > 0) k++;
        const r = cand[k];
        const canV = r.w >= minW * 2, canH = r.h >= minH * 2;
        const vertical = canV && (!canH || aspect(r) * (0.65 + rnd() * 0.7) > 1);
        const size = vertical ? r.w : r.h, min = vertical ? minW : minH;
        const cut = Math.min(size - min, Math.max(min, Math.round(size * (0.3 + rnd() * 0.4))));
        rects.splice(rects.indexOf(r), 1,
          vertical ? { x: r.x, y: r.y, w: cut, h: r.h } : { x: r.x, y: r.y, w: r.w, h: cut },
          vertical ? { x: r.x + cut, y: r.y, w: r.w - cut, h: r.h } : { x: r.x, y: r.y + cut, w: r.w, h: r.h - cut });
      }
      if (ok && rects.every((r) => aspect(r) >= 0.7 && aspect(r) <= 3.4)) return rects;
    }
    return null;
  }

  let collageIO = null, collageMQ = null;
  function renderCollage() {
    const root = $("#cs2Clips");
    if (!root) return;
    if (collageIO) collageIO.disconnect();
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const list = M.cs2.map((c, i) => ({ c, i }));
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    list.length = Math.min(list.length, mobile ? COLLAGE_MOBILE : COLLAGE_DESKTOP); // random subset, new on every reload
    const C = mobile ? 6 : 12, R = mobile ? 18 : 10;
    let rects = makeLayout(list.length, C, R, 2, mobile ? 3 : 2);
    if (!rects) { // safety net: even grid
      const cols = mobile ? 2 : 5; rects = list.map((_, k) => ({ x: (k % cols) * (C / cols), y: Math.floor(k / cols) * 4, w: C / cols, h: 4 }));
    }
    rects.sort((a, b) => a.y - b.y || a.x - b.x);
    const rows = Math.max(...rects.map((r) => r.y + r.h));
    root.style.setProperty("--c", C);
    root.style.setProperty("--r", rows);
    root.style.aspectRatio = `${C} / ${rows * TILE_H}`;
    root.innerHTML = rects.map((r, k) => {
      const { c } = list[k];
      return `<div class="cell" style="grid-column:${r.x + 1} / span ${r.w};grid-row:${r.y + 1} / span ${r.h}">
        <video muted loop playsinline preload="none" poster="media/cs2/${c.id}.webp" data-src="media/cs2/${c.id}.mp4"></video>
      </div>`;
    }).join("");
    collageIO = autoplayVideos($$(".cell", root), mobile || saveData ? 3 : 5);
    if (!collageMQ) {
      collageMQ = window.matchMedia("(max-width: 900px)");
      collageMQ.addEventListener("change", renderCollage);
    }
  }

  // Plays the clips that are on screen (muted, looping, no controls), at most `cap` at once,
  // preferring the ones closest to the middle of the viewport. Videos load only when needed.
  function autoplayVideos(cells, cap) {
    if (reduced || !("IntersectionObserver" in window)) return { disconnect() {} };
    const seen = new Set();
    let raf = 0;
    const play = (v) => {
      if (!v.src) {
        v.addEventListener("loadedmetadata", () => {
          const d = v.duration;
          if (d > 6) v.currentTime = Math.random() * Math.min(d - 4, 25); // desync the tiles
        }, { once: true });
        v.src = v.dataset.src; v.preload = "auto";
      }
      v.play().catch(() => {});
    };
    const update = () => {
      raf = 0;
      const mid = innerHeight / 2;
      const order = [...seen].sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return Math.abs(ra.top + ra.height / 2 - mid) - Math.abs(rb.top + rb.height / 2 - mid);
      });
      cells.forEach((el) => {
        const v = el.firstElementChild, on = order.indexOf(el);
        if (on > -1 && on < cap && !document.hidden) play(v); else if (!v.paused) v.pause();
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      queue();
    }, { rootMargin: "80px" });
    cells.forEach((el) => io.observe(el));
    const onScroll = () => { if (seen.size > cap) queue(); };
    const onVis = () => queue();
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return { disconnect() { io.disconnect(); removeEventListener("scroll", onScroll); document.removeEventListener("visibilitychange", onVis); } };
  }

  function renderStats() {
    const st = S.cs2Stats || {};
    const box = $("#cs2Stats");
    // numbers from config.js (if filled in) show as tiny chips; the link is always a small button
    const chip = (k, v, suf = "") => (v === null || v === undefined || v === "") ? "" :
      `<span class="chip chip--stat">${t("cs2." + k)} <b>${typeof v === "number" ? v.toLocaleString("en-US").replace(/,/g, " ") : v}${suf}</b></span>`;
    box.innerHTML = `${chip("premier", st.premier)}${chip("kd", st.kd)}${chip("hs", st.hs, "%")}${chip("winrate", st.winrate, "%")}${chip("matches", st.matches)}
      <a class="link-arrow link-arrow--sm" href="${S.links.csstats}" target="_blank" rel="noopener" title="${t("cs2.full")}"><span>${t("cs2.stats")} · csstats.gg</span><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></a>`;
  }

  /* ---------------------------------------------------------
     CHESS: Chess.com ratings + animated replays of wins
     --------------------------------------------------------- */
  const CH = window.CHESS;
  const chessCfg = S.chess || {};
  const ch = {
    on: !!(CH && chessCfg.user && $("#chess")),
    status: "idle", stats: null, profile: null, recent: [], wins: [],
    cur: -1, ply: 0, board: null, els: [], last: null, flipped: false,
    playing: !reduced, visible: false, timer: null, loading: null,
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DRAWS = ["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"];
  const fmtTC = (tc) => {
    if (!tc) return "";
    if (tc.includes("/")) return `${Math.max(1, Math.round(+tc.split("/")[1] / 86400))}d`;
    const [b, i] = tc.split("+");
    const m = +b / 60;
    return `${m >= 1 ? m : b + "s"}${i ? "|" + i : " min"}`;
  };
  const termKey = (r) => (["checkmated", "resigned", "timeout", "abandoned"].includes(r) ? r : "other");
  const pieceSrc = (code) => `media/chess/${code}.svg`;

  function sqPos(i) {
    const f = i % 8, r = Math.floor(i / 8);
    const col = ch.flipped ? 7 - f : f, row = ch.flipped ? r : 7 - r;
    return `translate(${col * 100}%, ${row * 100}%)`;
  }

  function buildSquares() {
    const box = $("#chessBoard .board__squares");
    let html = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const f = ch.flipped ? 7 - col : col, r = ch.flipped ? row : 7 - row;
        const light = (f + r) % 2 === 1;
        html += `<div class="sq${light ? " l" : ""}">${row === 7 ? `<span class="sq__f">${"abcdefgh"[f]}</span>` : ""}${col === 0 ? `<span class="sq__r">${r + 1}</span>` : ""}</div>`;
      }
    }
    box.innerHTML = html;
  }

  function drawPieces() {
    const box = $("#chessBoard .board__pieces");
    box.innerHTML = "";
    ch.els = new Array(64).fill(null);
    ch.board.forEach((p, i) => {
      if (!p) return;
      const el = document.createElement("img");
      el.className = `pc pc--${p[0]}`;
      el.src = pieceSrc(p);
      el.alt = "";
      el.draggable = false;
      el.style.transform = sqPos(i);
      box.appendChild(el);
      ch.els[i] = el;
    });
  }

  function drawMarks() {
    const box = $("#chessBoard .board__marks");
    const g = ch.wins[ch.cur];
    let html = "";
    if (ch.last) {
      html += `<i class="mk mk--last" style="transform:${sqPos(ch.last.from)}"></i><i class="mk mk--last mk--to" style="transform:${sqPos(ch.last.to)}"></i>`;
      const san = g && g.san[ch.ply - 1] || "";
      if (/[+#]$/.test(san)) {
        const side = ch.ply % 2 === 1 ? "b" : "w"; // side to move now is in check
        const k = ch.board.indexOf(side + "K");
        if (k >= 0) html += `<i class="mk ${san.endsWith("#") ? "mk--mate" : "mk--check"}" style="transform:${sqPos(k)}"></i>`;
      }
    }
    box.innerHTML = html;
    const end = g && ch.ply >= g.moves.length;
    const flag = $("#chessFlag");
    flag.textContent = g ? `${t("chess.win")} · ${t("chess.t." + termKey(g.opp.result))}` : "";
    flag.classList.toggle("is-on", !!(g && end));
  }

  function drawMoveInfo() {
    const g = ch.wins[ch.cur];
    const n = g ? g.moves.length : 0;
    const san = g && ch.ply > 0 ? g.san[ch.ply - 1] || "" : "";
    $("#chessSan").innerHTML = ch.ply > 0
      ? `${Math.ceil(ch.ply / 2)}.${ch.ply % 2 === 0 ? ".." : ""} ${esc(san)}<small>${ch.ply} / ${n}</small>`
      : `—<small>0 / ${n}</small>`;
    const pct = n ? (ch.ply / n) * 100 : 0;
    $("#chessBar i").style.width = pct + "%";
    const row = $(`#chessWins .cw[data-i="${ch.cur}"] .cw__prog`);
    if (row) row.style.width = pct + "%";
  }

  function seek(n) {
    const g = ch.wins[ch.cur];
    ch.board = CH.fromFEN(CH.START);
    ch.last = null;
    n = g ? Math.max(0, Math.min(n, g.moves.length)) : 0;
    for (let i = 0; i < n; i++) ch.last = CH.applyMove(ch.board, g.moves[i]);
    ch.ply = n;
    drawPieces(); drawMarks(); drawMoveInfo();
  }

  function chessStep() {
    const g = ch.wins[ch.cur];
    if (!g || ch.ply >= g.moves.length) return false;
    const info = CH.applyMove(ch.board, g.moves[ch.ply]);
    const els = ch.els;
    if (info.cap !== null && els[info.cap]) {
      const dead = els[info.cap];
      els[info.cap] = null;
      dead.classList.add("is-cap");
      setTimeout(() => dead.remove(), 320);
    }
    const el = els[info.from];
    if (el) {
      els[info.from] = null; els[info.to] = el;
      el.classList.add("is-moving");
      el.style.transform = sqPos(info.to);
      setTimeout(() => el.classList.remove("is-moving"), 340);
      if (info.promo) setTimeout(() => { el.src = pieceSrc(info.promo); }, 260);
    }
    if (info.rook && els[info.rook[0]]) {
      const r = els[info.rook[0]];
      els[info.rook[0]] = null; els[info.rook[1]] = r;
      r.style.transform = sqPos(info.rook[1]);
    }
    ch.last = info;
    ch.ply++;
    const san = g.san[ch.ply - 1] || "";
    if (san.endsWith("#")) { SFX.play("capture"); setTimeout(() => SFX.play("win"), 380); }
    else if (san.endsWith("+")) SFX.play("check");
    else SFX.play(info.cap !== null ? "capture" : "move");
    if (ch.ply === g.moves.length && !san.endsWith("#")) setTimeout(() => SFX.play("win"), 380);
    drawMarks(); drawMoveInfo();
    return true;
  }

  function setPlaying(v) {
    ch.playing = v;
    $(".chess__ctl").classList.toggle("is-playing", v);
    tick();
  }

  function tick() {
    clearTimeout(ch.timer);
    const g = ch.wins[ch.cur];
    if (!ch.playing || !ch.visible || !g) return;
    if (ch.ply < g.moves.length) {
      chessStep();
      ch.timer = setTimeout(tick, Math.max(380, Math.min(720, 40000 / g.moves.length)));
    } else {
      ch.timer = setTimeout(() => {
        if (!ch.playing || !ch.visible) return;
        loadGame((ch.cur + 1) % ch.wins.length);
        ch.timer = setTimeout(tick, 900);
      }, 3600);
    }
  }

  function loadGame(k) {
    if (!ch.wins[k]) return;
    const prev = $(`#chessWins .cw[data-i="${ch.cur}"]`);
    if (prev) { prev.classList.remove("is-active"); $(".cw__prog", prev).style.width = "0%"; }
    ch.cur = k;
    const g = ch.wins[k];
    const flip = g.side === "black";
    if (flip !== ch.flipped || !$("#chessBoard .sq")) { ch.flipped = flip; buildSquares(); }
    const row = $(`#chessWins .cw[data-i="${k}"]`);
    if (row) {
      row.classList.add("is-active");
      const list = $("#chessWins");
      const top = row.offsetTop - list.offsetTop;
      if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: top - 8, behavior: "smooth" });
    }
    drawPlayers();
    seek(reduced ? g.moves.length : 0);
  }

  function drawPlayers() {
    const g = ch.wins[ch.cur];
    const ava = ch.profile && ch.profile.avatar;
    const user = chessCfg.user;
    if (!g) {
      $("#chessTop").innerHTML = `<span class="cp__dot cp__dot--b"></span><b class="cp__name">${esc(ch.status === "error" ? t("chess.error") : t("chess.loading"))}</b>`;
      $("#chessBottom").innerHTML = `${ava ? `<img class="cp__ava" src="${esc(ava)}" alt="">` : `<span class="cp__dot cp__dot--w"></span>`}<b class="cp__name">${esc(user)}</b>`;
      return;
    }
    const oppSide = g.side === "white" ? "b" : "w";
    $("#chessTop").innerHTML = `<span class="cp__dot cp__dot--${oppSide}"></span><b class="cp__name">${esc(g.opp.name)}</b><span class="cp__rt">${g.opp.rating}</span>
      <span class="cp__meta mono">${t("chess." + g.cls) !== "chess." + g.cls ? t("chess." + g.cls) : esc(g.cls)} · ${fmtTC(g.tc)}</span>`;
    $("#chessBottom").innerHTML = `${ava ? `<img class="cp__ava" src="${esc(ava)}" alt="">` : ""}<span class="cp__dot cp__dot--${g.side[0]}"></span><b class="cp__name">${esc(g.me.name)}</b><span class="cp__rt">${g.me.rating}</span>
      <a class="cp__link mono" href="${esc(g.url)}" target="_blank" rel="noopener" aria-label="${t("chess.open")}"><span class="cp__lt">${t("chess.open")}</span> <svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></a>`;
  }

  function drawRatings() {
    const st = ch.stats;
    const box = $("#chessRatings"), rec = $("#chessRecord");
    if (!st) {
      box.innerHTML = ["rapid", "blitz", "bullet"].map((k) => `<div class="cr"><span>${t("chess." + k)}</span><b>—</b></div>`).join("") +
        `<div class="cr cr--half"><span>${t("chess.puzzles")}</span><b>—</b></div><div class="cr cr--half"><span>${t("chess.rush")}</span><b>—</b></div>`;
      rec.innerHTML = "";
      return;
    }
    const tile = (k) => {
      const s = st["chess_" + k];
      if (!s) return `<div class="cr"><span>${t("chess." + k)}</span><b>—</b></div>`;
      const cur = s.last ? s.last.rating : 0, best = s.best ? s.best.rating : cur;
      return `<div class="cr"><span>${t("chess." + k)}</span><b data-count="${cur}">${cur}</b><em>${t("chess.best")} ${best}</em><i style="width:${best ? Math.round((cur / best) * 100) : 0}%"></i></div>`;
    };
    const tac = st.tactics && st.tactics.highest ? st.tactics.highest.rating : null;
    const rush = st.puzzle_rush && st.puzzle_rush.best ? st.puzzle_rush.best.score : null;
    box.innerHTML = tile("rapid") + tile("blitz") + tile("bullet") +
      `<div class="cr cr--half"><span>${t("chess.puzzles")}</span><b>${tac ?? "—"}</b><em>${t("chess.best")}</em></div>` +
      `<div class="cr cr--half"><span>${t("chess.rush")}</span><b>${rush ?? "—"}</b><em>${t("chess.best")}</em></div>`;

    let w = 0, l = 0, d = 0;
    ["chess_rapid", "chess_blitz", "chess_bullet", "chess_daily"].forEach((k) => {
      const r = st[k] && st[k].record;
      if (r) { w += r.win || 0; l += r.loss || 0; d += r.draw || 0; }
    });
    const tot = w + l + d || 1;
    const num = (n) => n.toLocaleString("en-US").replace(/,/g, " ");
    const form = ch.recent.slice(0, 10).map((x) => {
      const r = x.me.result === "win" ? "w" : DRAWS.includes(x.me.result) ? "d" : "l";
      return `<a class="${r}" href="${esc(x.url)}" target="_blank" rel="noopener" title="${t("chess." + r)} · ${esc(x.opp.name)} ${x.opp.rating}">${{ w: "+", l: "−", d: "=" }[r]}</a>`;
    }).join("");
    rec.innerHTML = `
      <div class="wld"><span class="w" style="flex:${w}"></span><span class="d" style="flex:${d}"></span><span class="l" style="flex:${l}"></span></div>
      <div class="wld__legend mono">
        <span><i class="w"></i><b>${num(w)}</b> ${t("chess.w")} · ${Math.round((w / tot) * 100)}%</span>
        <span><i class="l"></i><b>${num(l)}</b> ${t("chess.l")}</span>
        <span><i class="d"></i><b>${num(d)}</b> ${t("chess.d")}</span>
      </div>
      ${form ? `<div class="chess__form mono"><span>${t("chess.form")}</span>${form}</div>` : ""}`;
  }

  function drawWins() {
    const list = $("#chessWins");
    $("#chessWinsCount").textContent = ch.wins.length ? String(ch.wins.length).padStart(2, "0") : "";
    if (!ch.wins.length) {
      list.innerHTML = `<li class="chess__empty mono">${t(ch.status === "error" ? "chess.error" : "chess.loading")}</li>`;
      return;
    }
    list.innerHTML = ch.wins.map((g, i) => `<li><button class="cw${i === ch.cur ? " is-active" : ""}" data-i="${i}">
        <span class="cw__n">${String(i + 1).padStart(2, "0")}</span>
        <span class="cw__opp">${esc(g.opp.name)}<i>${g.opp.rating}</i></span>
        <span class="cw__date">${fmtDate(new Date(g.end * 1000).toISOString(), lang)}</span>
        <span class="cw__meta">${t("chess." + g.cls) !== "chess." + g.cls ? t("chess." + g.cls) : esc(g.cls)} ${fmtTC(g.tc)} · <em>${t("chess.t." + termKey(g.opp.result))}</em> · ${Math.ceil(g.moves.length / 2)} ${t("chess.moves")}</span>
        <span class="cw__prog"></span>
      </button></li>`).join("");
    drawMoveInfo();
  }

  function renderChess() {
    if (!ch.on) return;
    drawRatings(); drawWins(); drawPlayers(); drawMarks(); drawMoveInfo();
  }

  async function loadChess() {
    if (ch.loading) return ch.loading;
    ch.status = "loading";
    const user = encodeURIComponent(chessCfg.user.toLowerCase());
    const get = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
    const base = `https://api.chess.com/pub/player/${user}`;
    ch.loading = (async () => {
      try {
        const [stats, profile, arch] = await Promise.all([get(`${base}/stats`), get(base).catch(() => null), get(`${base}/games/archives`)]);
        ch.stats = stats; ch.profile = profile;
        drawRatings(); drawPlayers();
        const months = (arch.archives || []).slice().reverse();
        const max = chessCfg.maxWins || 12;
        for (let i = 0; i < months.length && i < 8 && (ch.wins.length < max || ch.recent.length < 10); i++) {
          const data = await get(months[i]).catch(() => ({ games: [] }));
          const games = (data.games || []).slice().sort((a, b) => b.end_time - a.end_time);
          for (const raw of games) {
            const g = CH.parseGame(raw, chessCfg.user);
            if (ch.recent.length < 10) ch.recent.push(g);
            if (ch.wins.length < max && g.me.result === "win" && g.opp.result !== "abandoned" && g.standard && g.cls !== "daily" && g.moves.length >= 16) ch.wins.push(g);
          }
        }
        ch.status = "ready";
      } catch (e) {
        ch.status = ch.stats ? "ready" : "error";
      }
      renderChess();
      if (ch.wins.length) { loadGame(0); setPlaying(ch.playing); }
    })();
    return ch.loading;
  }

  if (ch.on) {
    buildSquares();
    ch.board = CH.fromFEN(CH.START);
    drawPieces();
    const ctl = $(".chess__ctl");
    ctl.classList.toggle("is-playing", ch.playing);
    ctl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || !ch.wins.length) return;
      const act = b.dataset.act;
      if (act === "play") {
        const g = ch.wins[ch.cur];
        if (!ch.playing && g && ch.ply >= g.moves.length) seek(0);
        setPlaying(!ch.playing);
        return;
      }
      setPlaying(false);
      if (act === "next") chessStep();
      else if (act === "prev") seek(ch.ply - 1);
      else if (act === "start") seek(0);
      else if (act === "end") seek(Infinity);
    });
    $("#chessBar").addEventListener("click", (e) => {
      const g = ch.wins[ch.cur];
      if (!g) return;
      const r = e.currentTarget.getBoundingClientRect();
      setPlaying(false);
      seek(Math.round(((e.clientX - r.left) / r.width) * g.moves.length));
    });
    $("#chessWins").addEventListener("click", (e) => {
      const b = e.target.closest(".cw");
      if (!b) return;
      loadGame(+b.dataset.i);
      setPlaying(!reduced);
    });
    // keyboard arrows when the board is hovered/focused
    $("#chessBoard").tabIndex = 0;
    $("#chessBoard").addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { setPlaying(false); chessStep(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { setPlaying(false); seek(ch.ply - 1); e.preventDefault(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => { if (ents.some((x) => x.isIntersecting)) loadChess(); }, { rootMargin: "900px 0px" }).observe($("#chess"));
      new IntersectionObserver((ents) => {
        ch.visible = ents.some((x) => x.isIntersecting);
        tick();
      }, { threshold: 0.35 }).observe($("#chessBoard"));
    } else { ch.visible = true; loadChess(); }
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(ch.timer); else tick(); });
  }

  /* ---------------------------------------------------------
     Games chips, garage, GTA
     --------------------------------------------------------- */
  $("#gamesChips").innerHTML = S.games.map((g) => `<span class="chip">${g}</span>`).join("");

  const garageSets = {
    fh6: M.fh6.map(([id, w, h]) => ({ id, w, h, folder: "forza" })),
    fh5: M.fh5.map(([id, w, h]) => ({ id, w, h, folder: "forza" })),
    nfs: M.nfs.map(([id, w, h]) => ({ id, w, h, folder: "nfs" })),
  };
  function renderGarage(key) {
    const set = garageSets[key];
    const strip = $("#garageStrip");
    const items = set.map((s) => ({ type: "img", src: img(s.folder, s.id, "l") }));
    strip.innerHTML = set.map((s, i) => `
      <button class="shot" data-i="${i}" data-cursor="view" aria-label="Screenshot ${i + 1}">
        <img src="${img(s.folder, s.id, "s")}" srcset="${img(s.folder, s.id, "s")} 760w, ${img(s.folder, s.id, "l")} 2000w" sizes="(max-width: 900px) 82vw, 42vw" alt="" loading="lazy" decoding="async" width="${s.w}" height="${s.h}">
      </button>`).join("");
    $$(".shot", strip).forEach((el) => el.addEventListener("click", () => openLightbox(items, +el.dataset.i)));
    bindCursorTargets(strip);
    if (strip._carousel) strip._carousel.refresh(true);
    if (hasGSAP && !reduced) gsap.from($$(".shot", strip).slice(0, 4), { opacity: 0, x: 60, duration: 0.8, stagger: 0.06, ease: "expo.out", clearProps: "transform,opacity" });
  }

  const gtaItems = M.gta.map(([id]) => ({ type: "img", src: img("photos", id, "l") }));
  $("#gtaArt").innerHTML = M.gta.map(([id], i) => `<button data-i="${i}" data-cursor="view" aria-label="GTA art ${i + 1}"><img src="${img("photos", id, "l")}" alt="" loading="lazy" decoding="async"></button>`).join("");
  $$("#gtaArt button").forEach((b) => b.addEventListener("click", () => openLightbox(gtaItems, +b.dataset.i)));

  /* ---------------------------------------------------------
     Life: masonry, reels, instagram
     --------------------------------------------------------- */
  const lifeItems = M.life.map(([id]) => ({ type: "img", src: img("photos", id, "l") }));
  $("#lifeMasonry").innerHTML = M.life.map(([id, w, h], i) => `
    <button class="tile" data-i="${i}" data-cursor="view" aria-label="Photo ${i + 1}">
      <img src="${img("photos", id, "s")}" srcset="${img("photos", id, "s")} 760w, ${img("photos", id, "l")} 2000w" sizes="(max-width: 600px) 70vw, 32vw" alt="" loading="lazy" decoding="async" width="${w}" height="${h}">
    </button>`).join("");
  $$("#lifeMasonry .tile").forEach((el) => el.addEventListener("click", () => openLightbox(lifeItems, +el.dataset.i)));

  /* F1 track silhouettes as section backgrounds.
     section id → [[track key, top %, left %, width, lap seconds, run colour?], ...]
     Track keys: see assets/js/tracks.js */
  const YELLOW = "#ffd400", ORANGE = "#ff7a00";
  const SECTION_TRACKS = {
    about: [
      ["zandvoort", 2, 70, "clamp(180px, 24vw, 380px)", 12, ORANGE],
      ["baku", 74, -5, "clamp(220px, 30vw, 460px)", 16],
    ],
    f1: [
      ["rbr", 4, 58, "clamp(240px, 36vw, 560px)", 9, YELLOW],
      ["vegas", 62, -2, "clamp(140px, 18vw, 280px)", 11],
    ],
    projects: [
      ["singapore", 0, 72, "clamp(180px, 22vw, 340px)", 13],
      ["monza", 50, -4, "clamp(110px, 13vw, 200px)", 8],
    ],
    app: [
      ["suzuka", 60, -4, "clamp(240px, 36vw, 560px)", 14],
      ["melbourne", 4, 84, "clamp(110px, 13vw, 200px)", 12],
    ],
    gaming: [
      ["spa", 1, 74, "clamp(140px, 17vw, 260px)", 13],
      ["interlagos", 36, -5, "clamp(150px, 18vw, 280px)", 12],
      ["cota", 66, 80, "clamp(180px, 22vw, 340px)", 14],
      ["silverstone", 86, 30, "clamp(140px, 16vw, 250px)", 11],
    ],
    life: [
      ["monaco", 1, 62, "clamp(160px, 20vw, 300px)", 14],
      ["hungaroring", 14, -4, "clamp(160px, 20vw, 300px)", 12],
      ["jeddah", 26, 86, "clamp(60px, 7vw, 110px)", 10],
      ["miami", 40, 28, "clamp(200px, 26vw, 400px)", 11],
      ["imola", 52, -6, "clamp(180px, 22vw, 340px)", 10],
      ["mexico", 64, 76, "clamp(160px, 20vw, 300px)", 12],
      ["montreal", 76, 40, "clamp(180px, 24vw, 360px)", 9],
      ["bahrain", 88, 4, "clamp(140px, 17vw, 260px)", 11],
    ],
    contact: [
      ["yas", 2, 74, "clamp(180px, 22vw, 340px)", 11, YELLOW],
      ["losail", 48, -4, "clamp(150px, 18vw, 280px)", 10],
    ],
  };
  if (window.TRACKS) {
    let n = 0;
    Object.entries(SECTION_TRACKS).forEach(([sid, list]) => {
      const sec = document.getElementById(sid);
      if (!sec) return;
      const layer = document.createElement("div");
      layer.className = "tracks";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = list.map(([key, top, left, width, lap, run]) => {
        const tr = window.TRACKS[key];
        if (!tr) return "";
        n++;
        return `
        <figure class="track" style="top:${top}%;left:${left}%;width:${width};--lap:${lap}s;${run ? `--run:${run};` : ""}">
          <svg viewBox="-4 -4 ${tr.w + 8} ${tr.h + 8}"><path class="trk" d="${tr.d}"/><path class="trk-run" pathLength="1000" d="${tr.d}" style="animation-delay:${-n * 1.7}s"/></svg>
          <figcaption><b>${tr.name}</b><span>${tr.city}</span></figcaption>
        </figure>`;
      }).join("");
      sec.prepend(layer);
    });
  }

  // videos in "Life": same idea as the CS2 mosaic, they just play, no player
  $("#reelsGrid").innerHTML = M.reels.map((id) => `
    <div class="reel"><video muted loop playsinline preload="none" poster="media/reels/${id}.webp" data-src="media/reels/${id}.mp4"></video></div>`).join("");
  autoplayVideos($$("#reelsGrid .reel"), 3);

  let instaLoaded = false;
  function loadInstagram() {
    if (instaLoaded) return;
    instaLoaded = true;
    const grid = $("#instaGrid");
    const fallback = () => {
      grid.innerHTML = S.instagramPosts.map((id, i) => `
        <a class="insta__card" href="https://www.instagram.com/p/${id}/" target="_blank" rel="noopener" data-cursor="go">
          <span class="mono muted">POST ${String(i + 1).padStart(2, "0")}</span>
          <b>@shahriyor_abrorov</b>
          <span class="mono" style="color:var(--neon)">${t("life.open")} ↗</span>
        </a>`).join("");
      bindCursorTargets(grid);
    };
    grid.innerHTML = S.instagramPosts.map((id) => `
      <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${id}/" data-instgrm-version="14" style="background:#111;">
        <a href="https://www.instagram.com/p/${id}/" target="_blank" rel="noopener">Instagram</a>
      </blockquote>`).join("");
    const s = document.createElement("script");
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.onerror = fallback;
    s.onload = () => { try { window.instgrm && window.instgrm.Embeds.process(); } catch (e) { fallback(); } };
    document.body.appendChild(s);
    setTimeout(() => { if (!$("iframe", grid)) fallback(); if (hasGSAP) ScrollTrigger.refresh(); }, 8000);
  }

  /* ---------------------------------------------------------
     Tabs
     --------------------------------------------------------- */
  function moveInk(tabs) {
    const a = $("button.is-active", tabs), ink = $(".tabs__ink", tabs);
    if (!a || !ink) return;
    ink.style.width = `${a.offsetWidth}px`;
    ink.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop - 4}px)`;
  }
  function bindTabs(tabs, onChange) {
    $$("button", tabs).forEach((b) => { b.dataset.sfx = "tab"; });
    $$("button", tabs).forEach((b) => b.addEventListener("click", () => {
      $$("button", tabs).forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", x === b); });
      moveInk(tabs);
      onChange(b.dataset.tab);
    }));
    moveInk(tabs);
  }
  bindTabs($("#garageTabs"), renderGarage);
  bindTabs($("#lifeTabs"), (key) => {
    $$(".life__panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === key));
    if (key === "insta") loadInstagram();
    if (key === "photos" && $("#lifeMasonry")._carousel) $("#lifeMasonry")._carousel.refresh();
    if (hasGSAP) ScrollTrigger.refresh();
  });

  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */
  const lb = $("#lightbox"), stage = $("#lbStage");
  let lbItems = [], lbIndex = 0;
  function showLb() {
    const it = lbItems[lbIndex];
    stage.innerHTML = `<img src="${it.src}" alt="">`; // photos only, there is no video player on the site
    $("#lbCounter").textContent = `${String(lbIndex + 1).padStart(2, "0")} / ${String(lbItems.length).padStart(2, "0")}`;
    lb.classList.toggle("is-single", lbItems.length < 2);
    // preload neighbours
    [lbIndex + 1, lbIndex - 1].forEach((n) => { const x = lbItems[(n + lbItems.length) % lbItems.length]; if (x) new Image().src = x.src; });
  }
  function openLightbox(items, i) {
    lbItems = items; lbIndex = i;
    SFX.play("open");
    showLb();
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
    $("#lbClose").focus({ preventScroll: true });
  }
  function closeLightbox() {
    if (lb.classList.contains("is-open")) SFX.play("close");
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    stage.innerHTML = "";
    lenis && lenis.start();
  }
  const step = (d) => { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; SFX.play("whoosh", d); showLb(); };
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", () => step(-1));
  $("#lbNext").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50 && lbItems.length > 1) step(dx < 0 ? 1 : -1);
    tx = null;
  });

  /* ---------------------------------------------------------
     Kanatobi phone mock
     --------------------------------------------------------- */
  const KANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソ";
  const rain = $("#kanaRain");
  if (!reduced) {
    for (let i = 0; i < 28; i++) {
      const s = document.createElement("span");
      s.textContent = KANA[Math.floor(Math.random() * KANA.length)];
      s.style.left = `${Math.random() * 100}%`;
      s.style.fontSize = `${14 + Math.random() * 22}px`;
      s.style.animationDuration = `${7 + Math.random() * 10}s`;
      s.style.animationDelay = `${-Math.random() * 14}s`;
      s.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
      rain.appendChild(s);
    }
  }
  const deck = [["あ", "a", ["ka", "a", "sa", "ta"]], ["か", "ka", ["ka", "na", "ha", "ma"]], ["し", "shi", ["chi", "tsu", "shi", "su"]], ["ね", "ne", ["re", "ne", "nu", "wa"]], ["と", "to", ["to", "so", "ko", "no"]], ["み", "mi", ["mi", "ni", "hi", "ri"]]];
  let di = 0;
  function nextKana() {
    di = (di + 1) % deck.length;
    const [k, r, opts] = deck[di];
    const apply = () => {
      $("#kanaChar").textContent = k;
      $("#kanaRomaji").textContent = r;
      $("#kanaOptions").innerHTML = opts.map((o) => `<span${o === r ? ' class="is-right"' : ""}>${o}</span>`).join("");
    };
    if (hasGSAP && !reduced) {
      gsap.timeline()
        .to("#kanaCard", { rotateY: 90, duration: 0.3, ease: "power2.in" })
        .add(apply)
        .to("#kanaCard", { rotateY: 0, duration: 0.5, ease: "back.out(2)" });
    } else apply();
  }
  if (!reduced) setInterval(nextKana, 2600);

  /* ---------------------------------------------------------
     Copy email
     --------------------------------------------------------- */
  $("#copyEmail").dataset.sfx = "none";
  $("#copyEmail").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(S.links.email); }
    catch (err) {
      const ta = document.createElement("textarea");
      ta.value = S.links.email; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (x) { /* ignore */ }
      ta.remove();
    }
    SFX.play("success");
    b.textContent = t("contact.copied"); b.classList.add("is-done");
    setTimeout(() => { b.textContent = t("contact.copy"); b.classList.remove("is-done"); }, 1800);
  });

  /* ---------------------------------------------------------
     Cursor, magnetic, tilt
     --------------------------------------------------------- */
  // Targets are found by event delegation, so dynamic content needs no binding.
  function bindCursorTargets() {}
  const cursor = $(".cursor");
  if (finePointer && cursor) {
    const dot = $(".cursor__dot", cursor), frame = $(".cursor__frame", cursor), tag = $(".cursor__tag", cursor);
    const label = $(".cursor__label", cursor), speedEl = $(".cursor__speed", cursor);
    const cv = $(".cursor__trail", cursor), g2 = cv.getContext("2d");
    const LABELS = { view: "View", play: "▶ Play", go: "Go ↗" };
    const HOVER = "a, button, [data-cursor], [role=tab], .chip, .f1__gauge, input, textarea, select, label";
    const IDLE = 34, PAD = 7;
    let mx = -100, my = -100, fx = mx - IDLE / 2, fy = my - IDLE / 2, fw = IDLE, fh = IDLE;
    let target = null, vel = 0, lastMove = 0, lastX = 0, lastY = 0, trail = [], drew = false, dragging = false;
    let dpr = 1;
    const sizeCanvas = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeCanvas();
    addEventListener("resize", sizeCanvas);

    const setTarget = (el) => {
      if (el === target) return;
      target = el;
      const key = el && el.dataset.cursor;
      cursor.classList.toggle("is-hover", !!el);
      cursor.classList.toggle("is-label", !!(key && LABELS[key]) && !dragging);
      if (key && LABELS[key]) label.textContent = LABELS[key];
    };

    addEventListener("mousemove", (e) => {
      const t = performance.now();
      mx = e.clientX; my = e.clientY;
      const dt = Math.max(1, t - lastMove);
      const v = Math.hypot(mx - lastX, my - lastY) / dt; // px per ms
      vel = vel * 0.7 + v * 0.3;
      lastX = mx; lastY = my; lastMove = t;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      if (!reduced) trail.push({ x: mx, y: my, t });
      cursor.classList.remove("is-hidden");
    }, { passive: true });

    const hide = () => { cursor.classList.add("is-hidden"); setTarget(null); };
    document.addEventListener("pointerover", (e) => {
      if (e.target.tagName === "IFRAME") return hide(); // Spotify / Instagram embeds draw their own cursor
      setTarget(e.target.closest ? e.target.closest(HOVER) : null);
    }, { passive: true });
    // Hide only on a real exit through the window edge (Chrome also fires bogus leaves when nodes under the pointer change).
    document.documentElement.addEventListener("mouseleave", (e) => {
      const x = e.clientX, y = e.clientY, m = 60;
      const near = x > -m && y > -m && x < innerWidth + m && y < innerHeight + m;
      const edge = x <= 2 || y <= 2 || x >= innerWidth - 2 || y >= innerHeight - 2;
      if (near && edge) hide();
    });
    addEventListener("mousedown", (e) => {
      cursor.classList.add("is-down");
      if (e.target.closest && e.target.closest(".carousel__track")) {
        dragging = true;
        label.textContent = "‹ Drag ›";
        cursor.classList.add("is-label");
      }
    }, true);
    addEventListener("mouseup", () => {
      cursor.classList.remove("is-down");
      if (dragging) {
        dragging = false;
        const key = target && target.dataset.cursor;
        if (key && LABELS[key]) label.textContent = LABELS[key];
        else cursor.classList.remove("is-label");
      }
    }, true);

    const lerp = (a, b, k) => a + (b - a) * k;
    const loop = () => {
      const now = performance.now();
      // frame: wrap the hovered element, or float around the pointer
      let tx = mx - IDLE / 2, ty = my - IDLE / 2, tw = IDLE, th = IDLE;
      if (target && target.isConnected && !dragging) {
        const r = target.getBoundingClientRect();
        const huge = r.width > innerWidth * 0.8 || r.height > innerHeight * 0.75;
        if (r.width && r.height && !huge) { tx = r.left - PAD; ty = r.top - PAD; tw = r.width + PAD * 2; th = r.height + PAD * 2; }
        else { tw = th = 46; tx = mx - 23; ty = my - 23; }
      } else if (target && !target.isConnected) setTarget(null);
      const k = target ? 0.24 : 0.2;
      fx = lerp(fx, tx, k); fy = lerp(fy, ty, k); fw = lerp(fw, tw, k); fh = lerp(fh, th, k);
      frame.style.transform = `translate(${fx}px, ${fy}px)`;
      frame.style.width = `${fw}px`; frame.style.height = `${fh}px`;
      tag.style.transform = `translate(${mx + 16}px, ${my + 16}px)`;

      // speedometer
      if (now - lastMove > 90) vel *= 0.85;
      const kmh = Math.round(Math.min(vel * 95, 350));
      const fast = kmh > 70;
      cursor.classList.toggle("is-fast", fast);
      if (fast) {
        const drs = kmh >= 300;
        speedEl.classList.toggle("is-drs", drs);
        speedEl.textContent = drs ? `DRS · ${kmh}` : `${kmh} km/h`;
      }

      // neon trail (last ~170 ms of movement)
      while (trail.length && now - trail[0].t > 170) trail.shift();
      if (drew || trail.length > 1) {
        g2.clearRect(0, 0, innerWidth, innerHeight);
        drew = false;
        if (trail.length > 1) {
          g2.lineCap = "round";
          const n = trail.length;
          for (let i = 1; i < n; i++) {
            const a = i / n;
            g2.strokeStyle = `rgba(255, 42, 61, ${(a * 0.85).toFixed(3)})`;
            g2.lineWidth = 0.5 + a * 3;
            g2.beginPath();
            g2.moveTo(trail[i - 1].x, trail[i - 1].y);
            g2.lineTo(trail[i].x, trail[i].y);
            g2.stroke();
          }
          drew = true;
        }
      }
      requestAnimationFrame(loop);
    };
    loop();

    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25, y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    const big = $(".contact__big");
    big.addEventListener("mousemove", (e) => {
      const r = big.getBoundingClientRect();
      big.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      big.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }

  function bindTilt(els) {
    if (!finePointer || reduced) return;
    els.forEach((el) => {
      if (el.dataset.tb) return; el.dataset.tb = 1;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(1000px) rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 10}deg)`;
        el.style.setProperty("--gx", `${px * 100}%`);
        el.style.setProperty("--gy", `${py * 100}%`);
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 600);
      });
    });
  }
  bindTilt($$(".tilt:not(.project)"));

  /* ---------------------------------------------------------
     Nav: burger, smooth anchors, hide on scroll
     --------------------------------------------------------- */
  const nav = $("#nav"), burger = $("#burger");
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  let lenis = null;
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (nav.classList.contains("is-open")) { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); lenis && lenis.start(); }
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else if (target === 0) scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }));

  /* Nav indicator: one pill that slides to the active link, whether the section changes
     by scrolling (down or up) or by a click on a menu item. */
  const navLinksEl = $("#navLinks");
  const navInk = document.createElement("span");
  navInk.className = "nav__ink";
  navLinksEl.appendChild(navInk);
  const navActive = new Set();     // links whose sections are currently under the viewport middle
  let navCur = null, navLock = false, navLockT = 0;
  function moveNavInk() {
    if (!navCur || !navCur.offsetWidth) { navInk.classList.remove("is-on"); return; }
    const fresh = !navInk.classList.contains("is-on");
    if (fresh) navInk.classList.add("no-anim");
    navInk.style.width = `${navCur.offsetWidth}px`;
    navInk.style.transform = `translateX(${navCur.offsetLeft}px)`;
    if (fresh) { void navInk.offsetWidth; navInk.classList.remove("no-anim"); navInk.classList.add("is-on"); }
  }
  function renderNav() {
    $$("a", navLinksEl).forEach((a) => a.classList.toggle("is-active", a === navCur));
    moveNavInk();
  }
  function navSection(link, on) {
    if (on) { navActive.add(link); navCur = link; }
    else { navActive.delete(link); if (navCur === link) navCur = [...navActive].pop() || null; }
    if (!navLock) renderNav();
  }
  $$("a", navLinksEl).forEach((a) => a.addEventListener("click", () => {
    navCur = a; navLock = true; renderNav();       // jump straight to the clicked item, skip the ones in between
    clearTimeout(navLockT);
    navLockT = setTimeout(() => { navLock = false; navCur = [...navActive].pop() || a; renderNav(); }, 1700);
  }));
  addEventListener("resize", moveNavInk);
  addEventListener("load", moveNavInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveNavInk);

  /* ---------------------------------------------------------
     Raceway: custom scrollbar with an F1 car
     --------------------------------------------------------- */
  const raceway = $("#raceway"), rcar = $("#racewayCar");
  const FLAG = 12;
  let rLastY = 0, rMoveTimer = null, rDragging = false;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  function updateRaceway(y) {
    if (!raceway || !raceway.clientHeight) return;
    const p = Math.min(1, Math.max(0, y / maxScroll()));
    const travel = raceway.clientHeight - rcar.offsetHeight - FLAG * 2;
    rcar.style.transform = `translate(-50%, ${FLAG + p * travel}px)`;
    raceway.style.setProperty("--off", `${(-y * 0.35).toFixed(1)}px`);
    if (Math.abs(y - rLastY) > 0.5) {
      raceway.classList.toggle("is-up", y < rLastY);
      raceway.classList.add("is-moving");
      clearTimeout(rMoveTimer);
      rMoveTimer = setTimeout(() => raceway.classList.remove("is-moving"), 180);
    }
    rLastY = y;
  }
  function seekRaceway(e, immediate) {
    const r = raceway.getBoundingClientRect();
    const ch = rcar.offsetHeight;
    const p = Math.min(1, Math.max(0, (e.clientY - r.top - FLAG - ch / 2) / (r.height - FLAG * 2 - ch)));
    const target = p * maxScroll();
    if (lenis) lenis.scrollTo(target, immediate ? { immediate: true, force: true } : { duration: 1.2, force: true });
    else scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
  }
  if (raceway) {
    raceway.addEventListener("pointerdown", (e) => {
      rDragging = true;
      raceway.classList.add("is-drag");
      raceway.setPointerCapture(e.pointerId);
      // grabbing the car → drag; clicking the track → drive there smoothly
      seekRaceway(e, rcar.contains(e.target));
    });
    raceway.addEventListener("pointermove", (e) => { if (rDragging) seekRaceway(e, true); });
    const stopDrag = () => { rDragging = false; raceway.classList.remove("is-drag"); };
    raceway.addEventListener("pointerup", stopDrag);
    raceway.addEventListener("pointercancel", stopDrag);
    addEventListener("resize", () => updateRaceway(scrollY));
    requestAnimationFrame(() => updateRaceway(scrollY));
  }

  let lastY = 0;
  function onScroll(y) {
    updateRaceway(y);
    SFX.speed(y - lastY);
    nav.classList.toggle("is-scrolled", y > 40);
    lastY = y;
  }

  /* ---------------------------------------------------------
     Gauge (F1 RPM)
     --------------------------------------------------------- */
  const gaugeFill = $("#gaugeFill");
  const gLen = gaugeFill.getTotalLength();
  gaugeFill.style.strokeDasharray = gLen;
  gaugeFill.style.strokeDashoffset = gLen;
  (function buildTicks() {
    const cx = 150, cy = 161.9, a0 = 151, sweep = 238, max = 15;
    let html = "";
    for (let i = 0; i <= max; i++) {
      const a = ((a0 + (sweep * i) / max) * Math.PI) / 180;
      const major = i % 5 === 0;
      const r1 = major ? 88 : 94, r2 = 103;
      html += `<line class="${major ? "major" : ""}" x1="${cx + r1 * Math.cos(a)}" y1="${cy + r1 * Math.sin(a)}" x2="${cx + r2 * Math.cos(a)}" y2="${cy + r2 * Math.sin(a)}"/>`;
      if (i % 3 === 0) html += `<text x="${cx + 74 * Math.cos(a)}" y="${cy + 74 * Math.sin(a)}">${i}</text>`;
    }
    $("#gaugeTicks").innerHTML = html;
  })();
  const shift = $$("#shiftLights i");
  function setRPM(p) {
    gaugeFill.style.strokeDashoffset = gLen * (1 - p);
    $("#rpmValue").textContent = (p * 15).toFixed(1);
    const on = Math.round(p * 11);
    shift.forEach((l, i) => {
      l.className = i < on ? (i < 3 ? "on-g" : i < 7 ? "on-r" : "on-b") : "";
    });
  }
  setRPM(0);
  const gaugeState = { p: 0 };
  $(".f1__gauge").addEventListener("click", () => {
    SFX.play("rev");
    if (!hasGSAP) return;
    gsap.timeline()
      .to(gaugeState, { p: 1, duration: 0.5, ease: "power2.in", onUpdate: () => setRPM(gaugeState.p) })
      .to(gaugeState, { p: 0.86, duration: 0.7, ease: "elastic.out(1, .4)", onUpdate: () => setRPM(gaugeState.p) });
  });

  /* ---------------------------------------------------------
     Init content + language
     --------------------------------------------------------- */
  /* ---------------------------------------------------------
     Carousels: drag / swipe / arrows / counter
     --------------------------------------------------------- */
  const ARROW_L = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
  const ARROW_R = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
  function initCarousel(root) {
    const track = $(".carousel__track", root);
    track.style.position = "relative";
    root.insertAdjacentHTML("beforeend", `
      <div class="carousel__ui">
        <span class="carousel__count mono"></span>
        <div class="carousel__bar"><i></i></div>
        <button class="rbtn" data-dir="-1" aria-label="Previous">${ARROW_L}</button>
        <button class="rbtn" data-dir="1" aria-label="Next">${ARROW_R}</button>
      </div>`);
    const count = $(".carousel__count", root), bar = $(".carousel__bar i", root);
    const prev = $('[data-dir="-1"]', root), next = $('[data-dir="1"]', root);
    const pad = (n) => String(n).padStart(2, "0");
    function update() {
      const items = track.children, n = items.length;
      const max = track.scrollWidth - track.clientWidth;
      const x = track.scrollLeft;
      const padL = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      let idx = 0;
      for (let i = 0; i < n; i++) { if (items[i].offsetLeft + items[i].offsetWidth / 2 >= x + padL) { idx = i; break; } }
      if (max > 0 && x >= max - 2) idx = n - 1;
      count.innerHTML = `<b>${pad(n ? idx + 1 : 0)}</b> / ${pad(n)}`;
      const w = Math.max(8, Math.min(100, (track.clientWidth / Math.max(1, track.scrollWidth)) * 100));
      const p = max > 0 ? x / max : 0;
      bar.style.width = `${w}%`;
      bar.style.left = `${p * (100 - w)}%`;
      prev.disabled = x <= 2;
      next.disabled = max <= 2 || x >= max - 2;
    }
    [prev, next].forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: +b.dataset.dir * track.clientWidth * 0.8, behavior: "smooth" })));
    track.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);

    // mouse drag
    let down = false, moved = false, sx = 0, sl = 0;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add("is-drag"); }
      if (moved) track.scrollLeft = sl - dx;
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove("is-drag");
        setTimeout(() => { moved = false; }, 0);
      }
    });
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    // start on the 2nd item so the 1st one already bleeds past the left edge
    function toStart() {
      const items = track.children;
      if (items.length < 3) { track.scrollLeft = 0; return; }
      const padL = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      // first item whose predecessors overflow the left margin → something always crosses the screen edge
      let k = 1;
      while (k < items.length - 2 && items[k].offsetLeft - items[0].offsetLeft <= padL) k++;
      track.style.scrollSnapType = "none";
      track.scrollLeft = items[k].offsetLeft - padL;
      requestAnimationFrame(() => { track.style.scrollSnapType = ""; });
    }
    // Autoplay: a slow drift that turns around at both ends. It pauses while the pointer is over the
    // strip, while it is touched / dragged / used with the arrows, when the tab is hidden, and when off screen.
    if (!reduced) {
      const SPEED = 46; // px per second
      let pos = 0, dir = 1, last = 0, raf = 0, paused = false, hovering = false, visible = false, resumeT = 0;
      const pauseFor = (ms) => {
        paused = true; last = 0;
        track.classList.remove("is-auto");
        clearTimeout(resumeT);
        resumeT = setTimeout(() => { paused = false; }, ms);
      };
      const frame = (t) => {
        raf = 0;
        if (!visible || document.hidden) { last = 0; return; }
        const max = track.scrollWidth - track.clientWidth;
        if (!paused && !hovering && !down && max > 4) {
          if (!last) pos = track.scrollLeft;
          const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
          last = t;
          track.classList.add("is-auto");
          if (Math.abs(track.scrollLeft - pos) > 1.5) pos = track.scrollLeft; // moved by something else, e.g. a tab switch
          pos += dir * SPEED * dt;
          if (pos >= max) { pos = max; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
          track.scrollLeft = pos;
        } else {
          last = 0;
          track.classList.remove("is-auto");
        }
        raf = requestAnimationFrame(frame);
      };
      const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
      root.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hovering = true; });
      root.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { hovering = false; pauseFor(700); } });
      root.addEventListener("pointerdown", () => pauseFor(6000), true);
      addEventListener("pointerup", () => { if (paused) pauseFor(3000); });
      root.addEventListener("touchstart", () => pauseFor(6000), { passive: true });
      track.addEventListener("wheel", () => pauseFor(4000), { passive: true });
      root.addEventListener("focusin", () => pauseFor(8000));
      document.addEventListener("visibilitychange", kick);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((ents) => { visible = ents.some((e) => e.isIntersecting); if (visible) kick(); }, { threshold: 0.15 }).observe(root);
      }
    }

    const api = { refresh(reset) { if (reset) toStart(); update(); } };
    root._carousel = track._carousel = api;
    toStart();
    update();
    let touched = false;
    track.addEventListener("pointerdown", () => { touched = true; }, { once: true });
    addEventListener("load", () => { if (!touched) { toStart(); update(); } }, { once: true });
    return api;
  }

  renderCS2();
  renderGarage("fh6");
  $$("[data-carousel]").forEach(initCarousel);
  applyLang(lang);
  fetchGitHub();

  /* ---------------------------------------------------------
     No GSAP fallback
     --------------------------------------------------------- */
  if (!hasGSAP) {
    $("#loader").remove();
    document.body.classList.remove("is-loading");
    setRPM(0.86);
    addEventListener("scroll", () => onScroll(scrollY), { passive: true });
    return;
  }

  /* ---------------------------------------------------------
     Lenis smooth scroll
     --------------------------------------------------------- */
  if (typeof window.Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", (e) => { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  } else {
    addEventListener("scroll", () => onScroll(scrollY), { passive: true });
  }

  /* ---------------------------------------------------------
     Scroll animations
     --------------------------------------------------------- */
  function initScroll() {
    // progress bar
    gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    if (reduced) { setRPM(0.86); return; }

    // split headings
    $$(".split").forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => {
          el.dataset.shown = 1;
          gsap.to($$(".w > span", el), { yPercent: 0, duration: 1.1, stagger: 0.05, ease: "expo.out" });
        },
      });
    });

    // reveal blocks
    ScrollTrigger.batch(".reveal", {
      start: "top 90%", once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: "expo.out", overwrite: true }),
    });
    ScrollTrigger.create({
      trigger: "#projectsGrid", start: "top 88%", once: true,
      onEnter: () => gsap.from($$("#projectsGrid .project"), { opacity: 0, y: 70, duration: 1.2, stagger: 0.12, ease: "expo.out", clearProps: "opacity,transform" }),
    });

    // reveal images
    $$(".reveal-img").forEach((el) => {
      const im = $("img", el);
      gsap.to(im, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      gsap.fromTo(im, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // hero parallax
    gsap.to(".hero__photo img", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__text", { y: -80, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "20% top", end: "bottom top", scrub: true } });
    gsap.to(".hero__glow", { xPercent: -20, yPercent: 30, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // F1 big text + gauge
    gsap.fromTo(".f1__bigtext", { xPercent: 10 }, { xPercent: -30, ease: "none", scrollTrigger: { trigger: ".f1", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".f1__livery i", { xPercent: -30 }, { xPercent: 30, ease: "none", stagger: 0.1, scrollTrigger: { trigger: ".f1", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.to(gaugeState, {
      p: 0.86, ease: "power2.out",
      scrollTrigger: { trigger: ".f1__gauge", start: "top 85%", end: "center 45%", scrub: 0.6 },
      onUpdate: () => setRPM(gaugeState.p),
    });

    // phone float
    gsap.fromTo(".phone", { rotateY: -18, rotateX: 8, y: 60 }, { rotateY: 8, rotateX: -4, y: -40, ease: "none", scrollTrigger: { trigger: ".app", start: "top bottom", end: "bottom top", scrub: true } });

    // gaming tag
    gsap.fromTo(".gaming__tag", { letterSpacing: "0.02em", opacity: 0.2 }, { letterSpacing: "-0.06em", opacity: 1, ease: "none", scrollTrigger: { trigger: ".gaming__tag", start: "top 95%", end: "top 45%", scrub: true } });

    // clips / garage strips in
    ScrollTrigger.batch(".cell, .shot, .reel, .tile", {
      start: "top 92%", once: true,
      onEnter: (b) => gsap.from(b, { opacity: 0, y: 40, duration: 0.9, stagger: 0.05, ease: "expo.out", clearProps: "transform,opacity" }),
    });

    // F1 tracks parallax
    $$(".track").forEach((el, i) => {
      const depth = 40 + (i % 3) * 45;
      gsap.fromTo(el, { y: depth }, { y: -depth, ease: "none", scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
    });

    // contact title
    gsap.fromTo(".checker", { backgroundPositionX: "0px" }, { backgroundPositionX: "360px", ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom bottom", scrub: true } });

    // active nav link
    $$("main section[id]").forEach((sec) => {
      const link = $(`.nav__links a[href="#${sec.id}"]`);
      if (!link) return;
      ScrollTrigger.create({
        trigger: sec, start: "top 50%", end: "bottom 50%",
        onToggle: (self) => navSection(link, self.isActive),
      });
    });
  }

  /* ---------------------------------------------------------
     Loader → hero intro
     --------------------------------------------------------- */
  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero__name .word", { yPercent: 110, duration: 1.4, stagger: 0.1 })
      .from(".hero__kicker", { opacity: 0, x: -30, duration: 1 }, "-=1.1")
      .from(".hero__photo", { clipPath: "inset(100% 0 0 0)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath" }, "-=1.4")
      .from(".hero__photo img", { scale: 1.4, duration: 2 }, "<")
      .from(".hero__slogan", { opacity: 0, y: 30, duration: 1 }, "-=1.4")
      .from(".hero__ctas > *", { opacity: 0, y: 20, duration: 0.9, stagger: 0.08 }, "-=1.1")
      .from(".hero__tag", { opacity: 0, x: -30, duration: 0.9 }, "-=0.9")
      .from(".telemetry > *", { opacity: 0, y: 16, duration: 0.8, stagger: 0.06 }, "-=0.9")
      .from(".nav", { yPercent: -100, duration: 1, clearProps: "transform" }, "-=1.2");
    return tl;
  }

  function runLoader() {
    const loader = $("#loader");
    const lights = $$(".light", loader);
    const fast = reduced || sessionStorageSafe("seenLoader");
    let done = false, started = false, launched = false, tl = null;

    const launch = () => { if (!launched) { launched = true; SFX.play("launch"); } };
    const finish = () => {
      if (done) return;
      done = true;
      if (tl) tl.kill();
      if (started) launch();
      lights.forEach((l) => l.classList.remove("is-on"));
      gsap.to(loader, {
        yPercent: -100, duration: 0.9, ease: "expo.inOut",
        onComplete: () => { loader.remove(); },
      });
      document.body.classList.remove("is-loading");
      lenis && lenis.start();
      heroIntro();
      initScroll();
      ScrollTrigger.refresh();
      sessionStorageSafe("seenLoader", "1");
    };

    const start = (withSound) => {
      if (started || done) return;
      started = true;
      if (withSound !== undefined) SFX.setEnabled(withSound);
      loader.classList.add("is-started");
      const step = fast ? 0.12 : 0.42;
      tl = gsap.timeline({ delay: fast ? 0.15 : 0.45 });
      lights.forEach((l, i) => tl.call(() => { l.classList.add("is-on"); SFX.play("light", i); }, null, i * step));
      tl.call(() => {
        lights.forEach((l) => l.classList.remove("is-on"));
        gsap.to("#loaderText", { opacity: 1, duration: 0.25 });
        launch();
      }, null, lights.length * step + (fast ? 0.15 : 0.4 + Math.random() * 0.5));
      tl.call(finish, null, `+=${fast ? 0.25 : 0.65}`);
    };

    // Browsers block audio until the first click, so the first visit waits for "Start".
    const gate = !fast && SFX.supported;
    if (gate) {
      loader.classList.add("has-gate");
      $("#loaderGo").addEventListener("click", (e) => { e.stopPropagation(); start(true); });
      $("#loaderMute").addEventListener("click", (e) => { e.stopPropagation(); start(false); });
      $("#loaderGo").focus({ preventScroll: true });
    } else {
      start();
    }
    loader.addEventListener("click", () => (started ? finish() : start(true)));
    addEventListener("keydown", (e) => {
      if (done) return;
      if (!started) {
        if (e.key === "Escape") start(false);
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(true); }
        return;
      }
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    });
  }
  function sessionStorageSafe(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; }
    return null;
  }

  runLoader();
  addEventListener("load", () => ScrollTrigger.refresh());
  addEventListener("resize", () => { moveLangPill(); $$(".tabs").forEach(moveInk); });
})();
