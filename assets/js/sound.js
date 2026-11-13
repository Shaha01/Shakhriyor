/* ==========================================================
   SFX: every sound is synthesized with the Web Audio API.
   No audio files. Browsers only allow audio after the first
   click / key press, so the context is unlocked on a gesture.
   ========================================================== */
(function () {
  "use strict";

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const AC = window.AudioContext || window.webkitAudioContext;
  const VOLUME = 0.7;

  let ctx = null, master = null, noiseBuf = null, distCurve = null;
  let enabled = store.get("sfx") !== "off";
  let ducked = false;
  const subs = [];

  function init() {
    if (ctx || !AC) return ctx;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = enabled ? VOLUME : 0;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    distCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i * 2) / 1024 - 1, k = 12; distCurve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
    return ctx;
  }

  function unlock() {
    if (!enabled || !AC) return;
    init();
    if (ctx.state === "suspended") ctx.resume();
  }
  ["pointerdown", "keydown", "touchend"].forEach((ev) => addEventListener(ev, unlock, { capture: true, passive: true }));

  const ready = () => enabled && ctx && ctx.state === "running";
  const now = () => ctx.currentTime + 0.005;

  /* ---------- primitives ---------- */
  function env(g, t, vol, a, dur, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function tone({ f = 440, f2 = null, type = "sine", t = 0, dur = 0.15, vol = 0.2, a = 0.005, rel = 0.1, lp = null, pan = 0 }) {
    const s = now() + t;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, s);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + dur);
    let node = o;
    if (lp) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; node.connect(fl); node = fl; }
    node.connect(g);
    out(g, pan);
    env(g, s, vol, a, dur, rel);
    o.start(s); o.stop(s + dur + 0.05);
  }

  function noise({ t = 0, dur = 0.1, vol = 0.2, type = "bandpass", f = 1000, f2 = null, q = 1, a = 0.003, rel = 0.06, pan = 0 }) {
    const s = now() + t;
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    src.loop = true;
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, s);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, s + dur);
    src.connect(fl).connect(g);
    out(g, pan);
    env(g, s, vol, a, dur, rel);
    src.start(s, Math.random() * 0.5); src.stop(s + dur + 0.05);
  }

  function out(node, pan) {
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p).connect(master); }
    else node.connect(master);
  }

  // V6-ish engine: detuned saws + square sub through distortion and a lowpass that follows RPM.
  // pts: [[time, fundamental Hz], ...], shifts: times of gear changes
  function engine(pts, { vol = 0.3, fadeAt = null, end = null, shifts = [], panTo = 0 } = {}) {
    const s = now();
    const last = pts[pts.length - 1][0];
    const stop = end || last + 0.4;
    const ws = ctx.createWaveShaper(); ws.curve = distCurve; ws.oversample = "2x";
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 3;
    const g = ctx.createGain();
    const parts = [[1, "sawtooth", 0.45], [2.005, "sawtooth", 0.22], [0.5, "square", 0.3], [3.01, "triangle", 0.1]];
    const oscs = parts.map(([m, type, lvl]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; og.gain.value = lvl;
      o.connect(og).connect(ws);
      pts.forEach(([t, f], i) => (i ? o.frequency.linearRampToValueAtTime(f * m, s + t) : o.frequency.setValueAtTime(f * m, s + t)));
      o.start(s); o.stop(s + stop + 0.1);
      return o;
    });
    pts.forEach(([t, f], i) => (i ? lp.frequency.linearRampToValueAtTime(400 + f * 9, s + t) : lp.frequency.setValueAtTime(400 + f * 9, s + t)));
    ws.connect(lp).connect(g);
    let panner = null;
    if (ctx.createStereoPanner) { panner = ctx.createStereoPanner(); g.connect(panner).connect(master); panner.pan.setValueAtTime(0, s); panner.pan.linearRampToValueAtTime(panTo, s + stop); }
    else g.connect(master);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(vol, s + 0.06);
    if (fadeAt) { g.gain.setValueAtTime(vol, s + fadeAt); }
    g.gain.exponentialRampToValueAtTime(0.0001, s + stop);
    // gearshift "clack" + exhaust pop
    shifts.forEach((t) => {
      noise({ t, dur: 0.05, vol: 0.18, type: "highpass", f: 2500, q: 0.7 });
      noise({ t: t + 0.01, dur: 0.09, vol: 0.22, type: "lowpass", f: 500, q: 1 });
    });
    return oscs;
  }

  /* ---------- sounds ---------- */
  const SOUNDS = {
    // one F1 start light
    light(i = 0) {
      tone({ f: 523, type: "square", dur: 0.22, vol: 0.09, lp: 1800, rel: 0.12 });
      tone({ f: 523, type: "sine", dur: 0.26, vol: 0.18, rel: 0.16 });
      tone({ f: 130, f2: 70, type: "sine", dur: 0.12, vol: 0.25 });
    },
    // lights out: launch + three upshifts, car drives away
    launch() {
      noise({ dur: 0.5, vol: 0.12, type: "bandpass", f: 3200, f2: 1600, q: 2, a: 0.02, rel: 0.3 }); // wheelspin
      engine([[0, 48], [0.12, 70], [0.55, 215], [0.58, 150], [1.05, 235], [1.08, 172], [1.6, 250], [1.63, 190], [2.3, 262]],
        { vol: 0.32, fadeAt: 1.3, end: 2.7, shifts: [0.56, 1.06, 1.61], panTo: 0.5 });
    },
    // engine blip (gauge click)
    rev() {
      engine([[0, 52], [0.35, 250], [0.5, 255], [1.1, 64]], { vol: 0.26, end: 1.25 });
    },
    tick() { noise({ dur: 0.022, vol: 0.05, type: "bandpass", f: 5200, q: 4, rel: 0.015 }); },
    click() {
      tone({ f: 1100, f2: 520, type: "sine", dur: 0.06, vol: 0.12, rel: 0.04 });
      noise({ dur: 0.02, vol: 0.06, type: "highpass", f: 3000, rel: 0.015 });
    },
    whoosh(dir = 1) {
      noise({ dur: 0.32, vol: 0.13, type: "bandpass", f: dir > 0 ? 500 : 2600, f2: dir > 0 ? 2600 : 500, q: 1.4, a: 0.08, rel: 0.2, pan: dir > 0 ? 0.25 : -0.25 });
    },
    tab() {
      noise({ dur: 0.18, vol: 0.1, type: "bandpass", f: 900, f2: 2400, q: 1.6, a: 0.04, rel: 0.12 });
      tone({ f: 740, type: "triangle", t: 0.05, dur: 0.08, vol: 0.08 });
    },
    blip() {
      tone({ f: 880, type: "triangle", dur: 0.07, vol: 0.12 });
      tone({ f: 1320, type: "triangle", t: 0.06, dur: 0.09, vol: 0.1 });
    },
    success() {
      [784, 1047, 1568].forEach((f, i) => tone({ f, type: "sine", t: i * 0.07, dur: 0.22, vol: 0.12, rel: 0.16 }));
    },
    open() {
      noise({ dur: 0.35, vol: 0.12, type: "lowpass", f: 300, f2: 3500, q: 1, a: 0.1, rel: 0.2 });
      tone({ f: 220, f2: 440, type: "sine", dur: 0.25, vol: 0.08 });
    },
    close() {
      noise({ dur: 0.3, vol: 0.1, type: "lowpass", f: 3500, f2: 300, q: 1, a: 0.03, rel: 0.2 });
    },
    // F1 team radio "kssht"
    radio() {
      noise({ dur: 0.09, vol: 0.14, type: "bandpass", f: 1800, q: 1.2, rel: 0.04 });
      tone({ f: 1250, type: "square", t: 0.02, dur: 0.07, vol: 0.04, lp: 2500 });
      noise({ t: 0.1, dur: 0.06, vol: 0.08, type: "bandpass", f: 2400, q: 2, rel: 0.04 });
    },
    // chess: wooden piece on board
    move() {
      tone({ f: 210, f2: 120, type: "triangle", dur: 0.07, vol: 0.26, rel: 0.05 });
      noise({ dur: 0.035, vol: 0.12, type: "bandpass", f: 1900, q: 1.5, rel: 0.025 });
    },
    capture() {
      tone({ f: 260, f2: 110, type: "triangle", dur: 0.09, vol: 0.32, rel: 0.06 });
      noise({ dur: 0.05, vol: 0.18, type: "bandpass", f: 1500, q: 1.2, rel: 0.035 });
      tone({ f: 180, f2: 100, type: "triangle", t: 0.05, dur: 0.07, vol: 0.18 });
    },
    check() {
      SOUNDS.move();
      tone({ f: 1046, type: "sine", t: 0.04, dur: 0.16, vol: 0.09, rel: 0.12 });
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: "triangle", t: i * 0.09, dur: 0.6 - i * 0.05, vol: 0.09, rel: 0.4 }));
    },
  };

  /* ---------- continuous engine hum, follows scroll speed ---------- */
  let hum = null, humIdle = null;
  function buildHum() {
    const g = ctx.createGain(); g.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600; lp.Q.value = 2;
    const oscs = [[1, "sawtooth", 0.5], [2.01, "sawtooth", 0.2], [0.5, "square", 0.25]].map(([m, type, lvl]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = 45 * m; og.gain.value = lvl;
      o.connect(og).connect(lp); o.start();
      return [o, m];
    });
    lp.connect(g).connect(master);
    hum = { g, lp, oscs };
  }
  function speed(v) {
    if (!ready() || ducked) return;
    if (!hum) buildHum();
    const a = Math.min(Math.abs(v), 90);
    const t = ctx.currentTime;
    const f = 42 + a * 2.1;
    hum.oscs.forEach(([o, m]) => o.frequency.setTargetAtTime(f * m, t, 0.08));
    hum.lp.frequency.setTargetAtTime(350 + a * 22, t, 0.08);
    hum.g.gain.setTargetAtTime(a < 0.5 ? 0 : Math.min(0.075, 0.012 + a * 0.0012), t, 0.06);
    clearTimeout(humIdle);
    humIdle = setTimeout(() => { if (hum) hum.g.gain.setTargetAtTime(0, ctx.currentTime, 0.15); }, 140);
  }
  function silenceHum() { if (hum && ctx) hum.g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); }

  /* ---------- public API ---------- */
  let lastAt = {};
  function play(name, ...args) {
    if (!ready() || !SOUNDS[name]) return;
    const t = performance.now();
    if (lastAt[name] && t - lastAt[name] < 35) return; // de-duplicate bursts
    lastAt[name] = t;
    try { SOUNDS[name](...args); } catch (e) { /* ignore */ }
  }
  function setEnabled(v) {
    enabled = !!v;
    store.set("sfx", enabled ? "on" : "off");
    if (enabled) unlock();
    if (ctx) master.gain.setTargetAtTime(enabled ? VOLUME : 0, ctx.currentTime, 0.03);
    if (!enabled) silenceHum();
    subs.forEach((fn) => fn(enabled));
  }

  window.SFX = {
    supported: !!AC,
    play, speed, unlock,
    state: () => (ctx ? ctx.state : "none"),
    isOn: () => enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    duck(v) { ducked = !!v; if (ducked) silenceHum(); },
    onChange(fn) { subs.push(fn); },
  };
  document.addEventListener("visibilitychange", () => { if (document.hidden) silenceHum(); });
})();
