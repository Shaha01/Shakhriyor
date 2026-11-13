/* ==========================================================
   Chess.com helpers: TCN decoding, board model, game parsing.
   Pure logic, no DOM. Used by main.js (CHESS block).
   ========================================================== */
(function (root) {
  "use strict";

  const TCN = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++=";
  const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

  // Square index: a1 = 0 ... h8 = 63
  const sqName = (i) => "abcdefgh"[i % 8] + (Math.floor(i / 8) + 1);

  // Chess.com "tcn" move string -> [{from, to, promo}]
  function decodeTCN(s) {
    const out = [];
    for (let i = 0; i + 1 < s.length; i += 2) {
      const from = TCN.indexOf(s[i]);
      let to = TCN.indexOf(s[i + 1]);
      let promo = null;
      if (to > 63) {
        promo = "qnrbkp"[Math.floor((to - 64) / 3)];
        to = from + (from < 16 ? -8 : 8) + ((to - 1) % 3) - 1;
      }
      if (from < 0 || from > 63 || to < 0 || to > 63) break;
      out.push({ from, to, promo });
    }
    return out;
  }

  // FEN piece placement -> array[64] of "wP" / "bK" / null
  function fromFEN(fen) {
    const b = new Array(64).fill(null);
    const rows = fen.split(" ")[0].split("/");
    rows.forEach((row, r) => {
      let f = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) { f += +ch; continue; }
        const rank = 7 - r;
        b[rank * 8 + f] = (ch === ch.toUpperCase() ? "w" : "b") + ch.toUpperCase();
        f++;
      }
    });
    return b;
  }

  function toFEN(b) {
    const rows = [];
    for (let r = 7; r >= 0; r--) {
      let row = "", e = 0;
      for (let f = 0; f < 8; f++) {
        const p = b[r * 8 + f];
        if (!p) { e++; continue; }
        if (e) { row += e; e = 0; }
        row += p[0] === "w" ? p[1] : p[1].toLowerCase();
      }
      if (e) row += e;
      rows.push(row);
    }
    return rows.join("/");
  }

  // Applies a move in place. Returns what happened, for animation.
  function applyMove(b, m) {
    const p = b[m.from];
    const info = { from: m.from, to: m.to, cap: null, rook: null, promo: null, piece: p };
    if (!p) return info;
    const fx = m.from % 8, tx = m.to % 8;
    if (b[m.to]) info.cap = m.to;
    // en passant
    if (p[1] === "P" && fx !== tx && !b[m.to]) {
      const cs = m.to + (p[0] === "w" ? -8 : 8);
      if (b[cs]) { info.cap = cs; b[cs] = null; }
    }
    // castling
    if (p[1] === "K" && Math.abs(tx - fx) === 2) {
      const r = tx > fx ? [m.from + 3, m.from + 1] : [m.from - 4, m.from - 1];
      b[r[1]] = b[r[0]]; b[r[0]] = null;
      info.rook = r;
    }
    b[m.to] = m.promo ? p[0] + m.promo.toUpperCase() : p;
    b[m.from] = null;
    if (m.promo) info.promo = b[m.to];
    return info;
  }

  // SAN list from PGN movetext
  function sanList(pgn) {
    const i = pgn.indexOf("\n\n");
    const body = i >= 0 ? pgn.slice(i + 2) : pgn;
    return body
      .replace(/\{[^}]*\}/g, " ")
      .replace(/\$\d+/g, " ")
      .replace(/\d+\.+/g, " ")
      .replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  const header = (pgn, key) => {
    const m = pgn.match(new RegExp(`\\[${key} "([^"]*)"\\]`));
    return m ? m[1] : "";
  };

  // Raw API game -> compact object for the site
  function parseGame(g, user) {
    const u = user.toLowerCase();
    const side = g.white.username.toLowerCase() === u ? "white" : "black";
    const opp = side === "white" ? "black" : "white";
    const pgn = g.pgn || "";
    const eco = header(pgn, "ECOUrl") || g.eco || "";
    const opening = eco ? decodeURIComponent(eco.split("/openings/")[1] || "").replace(/-/g, " ").replace(/\.\.\./g, "…") : "";
    return {
      url: g.url,
      end: g.end_time,
      cls: g.time_class,
      tc: g.time_control,
      rated: g.rated,
      side,
      me: { name: g[side].username, rating: g[side].rating, result: g[side].result },
      opp: { name: g[opp].username, rating: g[opp].rating, result: g[opp].result },
      opening,
      moves: g.tcn ? decodeTCN(g.tcn) : [],
      san: pgn ? sanList(pgn) : [],
      fen: g.fen,
      standard: g.rules === "chess" && (!g.initial_setup || g.initial_setup.indexOf(START) === 0),
    };
  }

  const api = { START, sqName, decodeTCN, fromFEN, toFEN, applyMove, sanList, parseGame };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CHESS = api;
})(this);
