/* 스테이지 그림: 배경·길, 적, 기타 (코인·생명·뽑기 상자)
 * 모두 코드로 그리는 임시 그림. 1편 그림 엔진(G.Pixel)을 쓴다. */
var G = globalThis.G || (globalThis.G = {});

/* ───────── 적 ───────── */
G.EnemyArt = (function () {
  var P = G.Pixel, sh = P.shade, EYE = '#2a1f2e', W = '#ffffff', BLUSH = '#ff9fb0';
  function eyes(g, x, y, gap) { g.rect(x, y, 2, 2, EYE); g.rect(x + gap, y, 2, 2, EYE); g.px(x, y, W); g.px(x + gap, y, W); }
  function cheeks(g, x, y, gap) { g.rect(x, y, 2, 1, BLUSH); g.rect(x + gap, y, 2, 1, BLUSH); }
  var MAKERS = {
    // ── 1 과자 숲 ──
    jellyBear: function (g, v) {
      var col = ['#ff6f91', '#7fdc6a', '#ffb02e'][v % 3];
      g.ellipse(10, 9, 3, 3, col); g.ellipse(22, 9, 3, 3, col);
      g.ellipse(16, 15, 8, 7, col); g.ellipse(16, 25, 7, 5.5, col);
      g.ellipse(10, 24, 2.4, 3, col); g.ellipse(22, 24, 2.4, 3, col);
      g.ellipse(12, 29.5, 2.6, 1.8, sh(col, -0.15)); g.ellipse(20, 29.5, 2.6, 1.8, sh(col, -0.15));
      g.px(11, 11, sh(col, 0.6)); g.px(12, 10, sh(col, 0.6)); g.px(20, 22, sh(col, 0.5));
      eyes(g, 12, 14, 6); g.ellipse(16, 18, 2.2, 1.4, sh(col, 0.35)); g.px(16, 17, EYE);
    },
    cookieSoldier: function (g) {
      var c = '#c9783a', icing = '#ffffff';
      g.ellipse(16, 10, 6.5, 6, c); g.rect(10, 16, 12, 10, c); g.rect(6, 17, 4, 3, c); g.rect(22, 17, 4, 3, c);
      g.rect(11, 26, 4, 4, c); g.rect(17, 26, 4, 4, c);
      g.rect(11, 3, 10, 3, '#3a6ea8'); g.rect(13, 1, 6, 2, '#3a6ea8'); g.px(16, 0, '#ffd23f');
      g.px(13, 9, EYE); g.px(18, 9, EYE); g.hline(14, 17, 12, icing);
      g.hline(6, 9, 18, icing); g.hline(22, 25, 18, icing); g.hline(11, 14, 28, icing); g.hline(17, 20, 28, icing);
      g.px(16, 18, '#e05a4a'); g.px(16, 21, '#e05a4a'); g.px(16, 24, '#e05a4a');
    },
    // ── 2 바닷속 ──
    puffer: function (g) {
      var c = '#ffc94d';
      g.ellipse(16, 18, 10, 9, c); g.ellipse(16, 22, 7, 4, '#fff3c4');
      [[5, 18], [27, 18], [16, 7], [8, 10], [24, 10], [8, 26], [24, 26]].forEach(function (p) { g.px(p[0], p[1], '#e8a21b'); g.px(p[0] + (p[0] < 16 ? -1 : p[0] > 16 ? 1 : 0), p[1] + (p[1] < 18 ? -1 : 1), '#e8a21b'); });
      g.rect(25, 15, 3, 6, '#ff9a5a'); g.px(28, 16, '#ff9a5a'); g.px(28, 19, '#ff9a5a');
      eyes(g, 11, 15, 7); g.rect(14, 20, 3, 2, '#e05a4a');
    },
    jellyfish: function (g) {
      var c = '#f4a0d8';
      g.ellipse(16, 12, 10, 8, c); g.rect(6, 12, 21, 4, c); g.hline(7, 25, 15, sh(c, -0.2));
      for (var i = 0; i < 5; i++) { var x = 8 + i * 4; g.vline(x, 16, 24 + (i % 2) * 3, sh(c, -0.1)); g.px(x + 1, 20 + (i % 2), sh(c, -0.1)); }
      g.px(11, 7, W); g.px(12, 6, W); eyes(g, 12, 11, 6); cheeks(g, 10, 14, 10);
    },
    // ── 4 눈나라 ──
    snowball: function (g) {
      g.ellipse(16, 20, 10, 9, '#ffffff'); g.ellipse(16, 23, 9, 5, '#e6f1fb');
      g.line(6, 17, 2, 13, '#8a5a32'); g.px(3, 12, '#8a5a32'); g.line(26, 17, 30, 13, '#8a5a32'); g.px(29, 12, '#8a5a32');
      eyes(g, 12, 16, 6); g.rect(15, 19, 3, 1, '#ff9a3a'); g.px(18, 19, '#ff9a3a');
      g.rect(10, 9, 12, 3, '#e05a4a'); g.rect(12, 7, 8, 2, '#e05a4a');
    },
    babyBear: function (g) {
      var c = '#f2f6fa';
      g.ellipse(9, 8, 3, 3, c); g.ellipse(23, 8, 3, 3, c); g.px(9, 8, '#ffc0d0'); g.px(23, 8, '#ffc0d0');
      g.ellipse(16, 14, 8.5, 7, c); g.ellipse(16, 25, 9, 6, c);
      g.ellipse(11, 30, 3, 1.6, sh(c, -0.12)); g.ellipse(21, 30, 3, 1.6, sh(c, -0.12));
      g.rect(10, 22, 12, 2, '#3aa0f0');
      eyes(g, 12, 13, 6); g.ellipse(16, 17, 2.4, 1.6, '#e6e8eb'); g.px(16, 16, EYE); cheeks(g, 10, 16, 10);
    },
    // ── 5 사막 ──
    mole: function (g) {
      var c = '#8a5a3a';
      g.ellipse(16, 25, 12, 5, '#e8c77a'); g.ellipse(16, 18, 8, 9, c); g.ellipse(16, 22, 5, 5, sh(c, 0.3));
      g.px(12, 14, EYE); g.px(19, 14, EYE); g.ellipse(16, 17, 2, 1.5, '#ff8fb8');
      g.rect(8, 23, 3, 2, '#ffd0a8'); g.rect(21, 23, 3, 2, '#ffd0a8');
      g.rect(10, 8, 12, 2, '#e8c77a'); g.rect(13, 6, 6, 2, '#e8c77a');
    },
    cactus: function (g) {
      var c = '#4caf50';
      g.rect(11, 6, 10, 22, c); g.ellipse(16, 6, 5, 3, c); g.rect(5, 12, 4, 8, c); g.rect(5, 18, 6, 3, c); g.rect(23, 9, 4, 8, c); g.rect(21, 15, 6, 3, c);
      g.vline(14, 8, 26, sh(c, 0.25)); g.ellipse(16, 3, 2.5, 2, '#ff6f91'); g.px(16, 3, '#ffd23f');
      eyes(g, 13, 13, 5); g.px(15, 17, EYE); g.px(16, 18, EYE); g.px(17, 17, EYE);
      g.rect(9, 28, 14, 3, '#c9783a');
    },
    // ── 7 우주 ──
    alien: function (g) {
      var c = '#7fdc6a';
      g.line(11, 7, 9, 2, c); g.line(21, 7, 23, 2, c); g.ellipse(9, 2, 1.6, 1.6, '#ffd23f'); g.ellipse(23, 2, 1.6, 1.6, '#ffd23f');
      g.ellipse(16, 13, 9, 7, c); g.ellipse(16, 24, 6, 6, c); g.rect(9, 22, 3, 4, c); g.rect(20, 22, 3, 4, c);
      g.ellipse(12, 13, 2.6, 3, EYE); g.ellipse(20, 13, 2.6, 3, EYE); g.px(11, 12, W); g.px(19, 12, W);
      g.hline(14, 18, 18, sh(c, -0.35)); g.rect(12, 28, 3, 2, sh(c, -0.2)); g.rect(17, 28, 3, 2, sh(c, -0.2));
    },
    meteorRock: function (g) {
      g.line(28, 4, 21, 12, '#ffb02e'); g.line(30, 7, 22, 14, '#ff6b3a'); g.line(26, 2, 20, 10, '#ffe066');
      g.ellipse(14, 19, 10, 9, '#8c7a6a'); g.ellipse(10, 16, 2.5, 2, '#6e5e50'); g.ellipse(18, 24, 2, 1.6, '#6e5e50'); g.ellipse(19, 14, 1.6, 1.4, '#6e5e50');
      eyes(g, 10, 19, 6); g.hline(12, 15, 23, EYE);
    },
    // ── 8 밤 놀이공원 ──
    toySoldier: function (g) {
      g.rect(12, 0, 8, 8, '#2a1f2e'); g.px(16, 1, '#ffd23f');
      g.ellipse(16, 11, 5, 4, '#ffd9b8'); g.px(14, 11, EYE); g.px(18, 11, EYE); g.rect(13, 13, 1, 1, BLUSH); g.rect(19, 13, 1, 1, BLUSH);
      g.rect(11, 15, 10, 9, '#e0303a'); g.vline(16, 15, 23, '#ffd23f'); g.hline(11, 20, 19, '#ffffff');
      g.rect(8, 15, 3, 8, '#e0303a'); g.rect(21, 15, 3, 8, '#e0303a'); g.vline(24, 9, 22, '#8c9298');
      g.rect(12, 24, 3, 6, '#3a6ea8'); g.rect(17, 24, 3, 6, '#3a6ea8'); g.rect(11, 30, 4, 2, '#2a1f2e'); g.rect(17, 30, 4, 2, '#2a1f2e');
    },
    balloonGhost: function (g) {
      g.line(24, 10, 21, 20, '#ffffff'); g.ellipse(25, 6, 4, 5, '#ff5a7a'); g.px(24, 4, '#ffd0dc');
      g.ellipse(14, 17, 9, 9, '#f2eefa'); g.rect(5, 17, 18, 9, '#f2eefa');
      g.px(5, 26, '#f2eefa'); g.px(9, 27, '#f2eefa'); g.px(13, 26, '#f2eefa'); g.px(17, 27, '#f2eefa'); g.px(21, 26, '#f2eefa');
      g.ellipse(11, 16, 1.6, 2.2, EYE); g.ellipse(17, 16, 1.6, 2.2, EYE); g.ellipse(14, 21, 1.6, 1.2, '#b8475a'); cheeks(g, 8, 19, 10);
    }
  };
  // ── 보스 스테이지 부하 ──
  MAKERS.babyOctopus = function (g) {
    var c = '#e05a8a';
    g.ellipse(16, 13, 9, 8, c);
    for (var i = 0; i < 4; i++) { var x = 9 + i * 5; g.vline(x, 19, 27, c); g.vline(x + 1, 19, 26, c); g.px(x - 1, 27, c); }
    g.px(12, 8, '#ffb3cc'); g.px(13, 7, '#ffb3cc'); eyes(g, 12, 12, 6); g.rect(15, 16, 3, 1, '#7a1f44');
  };
  MAKERS.babyScorpion = function (g) {
    var c = '#c9783a';
    g.ellipse(14, 22, 9, 5, c); g.ellipse(8, 21, 3, 2, c); g.ellipse(4, 19, 2.5, 2.5, c); g.px(2, 17, c); g.px(6, 17, c);
    g.line(22, 20, 26, 14, c); g.line(26, 14, 24, 8, c); g.line(24, 8, 20, 7, c); g.px(19, 8, '#e0303a'); g.px(20, 9, '#e0303a');
    for (var i = 0; i < 3; i++) { g.line(10 + i * 4, 26, 8 + i * 4, 29, sh(c, -0.3)); }
    eyes(g, 10, 19, 5);
  };
  MAKERS.imp = function (g) {
    var c = '#7b3fc4';
    g.line(10, 6, 8, 2, '#e05a4a'); g.line(22, 6, 24, 2, '#e05a4a');
    g.ellipse(16, 14, 8, 7, c); g.ellipse(16, 24, 6, 6, c);
    g.line(5, 18, 9, 22, c); g.line(27, 18, 23, 22, c); g.line(22, 28, 28, 30, c); g.px(29, 29, '#e05a4a');
    g.rect(12, 12, 2, 2, '#ffe066'); g.rect(18, 12, 2, 2, '#ffe066'); g.hline(13, 19, 17, '#2a1f2e'); g.px(14, 18, W); g.px(18, 18, W);
  };
  // ── 보스 (48칸) ──
  var BOSS = {
    // 문어 대장: 커다란 머리, 해적 모자
    octopus: function (g) {
      var c = '#d4537e';
      g.ellipse(24, 20, 15, 13, c);
      for (var i = 0; i < 6; i++) { var x = 10 + i * 5.5; g.line(x, 30, x - 2 + (i % 2) * 4, 44, c); g.line(x + 1, 30, x - 1 + (i % 2) * 4, 44, c); g.line(x + 2, 30, x + (i % 2) * 4, 43, c); g.px(x - 2 + (i % 2) * 4, 45, sh(c, -0.2)); }
      g.rect(12, 4, 24, 5, '#2a1f2e'); g.rect(16, 1, 16, 4, '#2a1f2e'); g.rect(22, 3, 4, 3, W); g.px(23, 4, '#2a1f2e');
      g.rect(15, 17, 5, 5, W); g.rect(28, 17, 5, 5, W); g.rect(17, 19, 3, 3, EYE); g.rect(30, 19, 3, 3, EYE);
      g.hline(19, 29, 27, '#7a1f44'); g.hline(20, 28, 28, '#7a1f44'); g.px(14, 14, sh(c, 0.4)); g.px(15, 13, sh(c, 0.4));
      g.rect(28, 16, 7, 2, '#2a1f2e');
    },
    // 전갈 왕: 금관, 큰 집게와 꼬리
    scorpion: function (g) {
      var c = '#b5762a';
      g.ellipse(22, 32, 14, 8, c); g.ellipse(14, 26, 7, 6, c);
      g.ellipse(5, 18, 5, 4, c); g.px(1, 15, c); g.px(2, 14, c); g.px(8, 14, c); g.px(9, 13, c);
      g.ellipse(23, 18, 4, 3, c); g.px(20, 15, c); g.px(26, 15, c);
      g.line(34, 30, 42, 20, c); g.line(35, 31, 43, 21, c); g.line(42, 20, 40, 10, c); g.line(43, 21, 41, 10, c); g.line(40, 10, 34, 8, c); g.line(41, 10, 35, 7, c);
      g.ellipse(33, 8, 2.5, 2, '#e0303a'); g.px(31, 9, '#e0303a');
      for (var i = 0; i < 4; i++) g.line(14 + i * 5, 38, 11 + i * 5, 44, sh(c, -0.3));
      g.rect(9, 16, 10, 3, '#ffd23f'); g.px(9, 14, '#ffd23f'); g.px(13, 14, '#ffd23f'); g.px(17, 14, '#ffd23f'); g.px(9, 15, '#ffd23f'); g.px(13, 15, '#ffd23f'); g.px(17, 15, '#ffd23f');
      g.rect(10, 23, 3, 3, EYE); g.rect(16, 23, 3, 3, EYE); g.px(10, 23, W); g.px(16, 23, W); g.hline(11, 17, 29, '#633806');
    },
    // 냠냠 마왕: 보라 망토, 왕관, 커다란 입
    demon: function (g) {
      var c = '#5a2a8e';
      g.rect(8, 22, 32, 20, '#3a1a5a'); g.rect(6, 34, 36, 10, '#3a1a5a');
      g.ellipse(24, 20, 14, 13, c);
      g.line(13, 10, 8, 1, '#e05a4a'); g.line(14, 10, 9, 1, '#e05a4a'); g.line(35, 10, 40, 1, '#e05a4a'); g.line(34, 10, 39, 1, '#e05a4a');
      g.rect(17, 3, 14, 4, '#ffd23f'); g.px(17, 1, '#ffd23f'); g.px(17, 2, '#ffd23f'); g.px(24, 0, '#ffd23f'); g.px(24, 1, '#ffd23f'); g.px(24, 2, '#ffd23f'); g.px(30, 1, '#ffd23f'); g.px(30, 2, '#ffd23f'); g.px(24, 4, '#e0303a');
      g.rect(15, 14, 5, 4, '#ffe066'); g.rect(28, 14, 5, 4, '#ffe066'); g.rect(17, 15, 2, 3, EYE); g.rect(30, 15, 2, 3, EYE);
      g.ellipse(24, 26, 8, 5, '#2a1f2e'); g.ellipse(24, 28, 5, 2.4, '#e05a8a');
      g.px(18, 23, W); g.px(20, 22, W); g.px(28, 22, W); g.px(30, 23, W);
    }
  };
  function sprite(type, variant) {
    var v = variant || 0;
    return P.get('적/' + type + v, function () {
      if (BOSS[type]) { var gb = new P.Grid(48, 48); BOSS[type](gb); gb.outline(); return gb.toCanvas(); }
      var g = new P.Grid(32, 32); MAKERS[type](g, v); g.outline(); return g.toCanvas();
    });
  }
  return { sprite: sprite, MAKERS: MAKERS, BOSS: BOSS };
})();

/* ───────── 배경과 길 ───────── */
G.MapArt = (function () {
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function strokePath(ctx, P, width, color, dash) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = width; ctx.strokeStyle = color;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); P.points.forEach(function (p, k) { if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  function road(ctx, L, edge, fill, mid) {
    L.paths.forEach(function (P) { strokePath(ctx, P, 64, edge); });
    L.paths.forEach(function (P) { strokePath(ctx, P, 54, fill); });
    if (mid) L.paths.forEach(function (P) { strokePath(ctx, P, 4, mid, [14, 16]); });
  }
  function plates(ctx, L, fill, rim) {
    L.slots.concat(L.hero ? [L.hero] : []).forEach(function (s, i) {
      var hero = i === L.slots.length;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, 40, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hero ? '#ffe27a' : fill; ctx.beginPath(); ctx.ellipse(s.x, s.y, 40, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hero ? '#c98a1a' : rim; ctx.lineWidth = 3; ctx.stroke();
      if (hero) { ctx.fillStyle = '#c98a1a'; ctx.font = '14px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', s.x, s.y + 5); }
    });
  }
  function flag(ctx, L) {
    var st = L.paths[0].at(0);
    ctx.fillStyle = '#3a2a3f'; ctx.fillRect(st.x - 2, st.y - 46, 4, 30);
    ctx.fillStyle = '#ff6f91'; ctx.beginPath(); ctx.moveTo(st.x + 2, st.y - 46); ctx.lineTo(st.x + 24, st.y - 38); ctx.lineTo(st.x + 2, st.y - 30); ctx.fill();
  }
  function lolly(ctx, x, y, col) {
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(x - 2, y - 4, 4, 18);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 10, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 10, 7, 0, Math.PI * 1.4); ctx.stroke();
    ctx.strokeStyle = '#3a2a3f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 10, 13, 0, Math.PI * 2); ctx.stroke();
  }
  function speckle(ctx, seed, n, cols, w, h) {
    var r = rnd(seed);
    for (var i = 0; i < n; i++) { ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.fillRect(Math.floor(r() * 960), Math.floor(r() * 540), w, h); }
  }

  var THEMES = {
    // 1 과자 숲
    1: function (ctx, L) {
      ctx.fillStyle = '#a8df7a'; ctx.fillRect(0, 0, 960, 540); speckle(ctx, 7, 260, ['#98d36a', '#b6e88a'], 6, 4);
      road(ctx, L, '#7a4a2a', '#ffe3b0', '#f2c98a');
      [[30, 40], [930, 40], [30, 510], [930, 510], [480, 30], [480, 512], [20, 280], [940, 280]].forEach(function (t, k) { lolly(ctx, t[0], t[1], ['#ff6f91', '#7fd3ff', '#ffd23f', '#c08af5'][k % 4]); });
      plates(ctx, L, '#f6d9a8', '#c98a4a');
    },
    // 2 바닷속
    2: function (ctx, L) {
      var g = ctx.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, '#4fb3e8'); g.addColorStop(1, '#1f6fae');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
      var r = rnd(11);
      for (var i = 0; i < 40; i++) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r() * 960, r() * 540, 3 + r() * 7, 0, Math.PI * 2); ctx.stroke(); }
      road(ctx, L, '#c9a05a', '#f6e3a8', '#e8c77a');
      // 미역과 산호
      [[40, 520], [920, 520], [480, 530], [40, 90], [920, 90]].forEach(function (p, k) {
        ctx.strokeStyle = k % 2 ? '#3fbf4f' : '#2e9a3d'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] - 18, p[1] - 40, p[0], p[1] - 70); ctx.quadraticCurveTo(p[0] + 18, p[1] - 100, p[0], p[1] - 120); ctx.stroke();
      });
      // 산호 (두 원 사이 위아래 빈 곳)
      [[480, 500], [480, 70]].forEach(function (p) {
        ctx.strokeStyle = '#ff7f7f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        [[-16, -30], [0, -40], [16, -28]].forEach(function (d) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + d[0], p[1] + d[1]); ctx.stroke(); });
      });
      plates(ctx, L, '#ffd0e0', '#d4537e');
    },
    // 4 눈나라
    4: function (ctx, L) {
      ctx.fillStyle = '#e6f1fb'; ctx.fillRect(0, 0, 960, 540); speckle(ctx, 13, 200, ['#ffffff', '#d0e4f6'], 5, 5);
      road(ctx, L, '#7aa7c9', '#bfe6ff', '#ffffff');
      [[30, 70], [935, 60], [30, 520], [935, 520], [480, 530]].forEach(function (p) {
        ctx.fillStyle = '#2e7d4f'; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 46); ctx.lineTo(p[0] - 20, p[1]); ctx.lineTo(p[0] + 20, p[1]); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 46); ctx.lineTo(p[0] - 9, p[1] - 26); ctx.lineTo(p[0] + 9, p[1] - 26); ctx.fill();
        ctx.fillStyle = '#8a5a32'; ctx.fillRect(p[0] - 3, p[1], 6, 8);
      });
      plates(ctx, L, '#ffffff', '#7aa7c9');
    },
    // 5 사막
    5: function (ctx, L) {
      ctx.fillStyle = '#fac775'; ctx.fillRect(0, 0, 960, 540); speckle(ctx, 17, 220, ['#efb860', '#ffd998'], 6, 3);
      ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(905, 46, 26, 0, Math.PI * 2); ctx.fill();
      road(ctx, L, '#b5762a', '#faeeda', '#e8c77a');
      // 갈래 표지판
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(910, 270, 6, 40); ctx.fillStyle = '#c9783a'; ctx.fillRect(892, 262, 50, 16);
      [[30, 520], [930, 520], [480, 30]].forEach(function (p) {
        ctx.fillStyle = '#4caf50'; ctx.fillRect(p[0] - 5, p[1] - 34, 10, 34); ctx.fillRect(p[0] - 15, p[1] - 24, 6, 14); ctx.fillRect(p[0] + 9, p[1] - 28, 6, 12);
      });
      plates(ctx, L, '#ffe3b0', '#b5762a');
    },
    // 7 우주 정거장
    7: function (ctx, L) {
      ctx.fillStyle = '#1a1840'; ctx.fillRect(0, 0, 960, 540); speckle(ctx, 23, 160, ['#ffffff', '#cecbf6', '#fac775'], 2, 2);
      ctx.fillStyle = '#d85a30'; ctx.beginPath(); ctx.arc(905, 60, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fac775'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(905, 60, 48, 12, -0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#5dcaa5'; ctx.beginPath(); ctx.arc(50, 500, 22, 0, Math.PI * 2); ctx.fill();
      road(ctx, L, '#534ab7', '#3c3489', '#afa9ec');
      plates(ctx, L, '#cecbf6', '#7f77dd');
    },
    // 8 밤 놀이공원
    8: function (ctx, L) {
      ctx.fillStyle = '#2c2440'; ctx.fillRect(0, 0, 960, 540); speckle(ctx, 29, 90, ['#fac775', '#ffffff'], 2, 2);
      // 대관람차 그림자
      ctx.strokeStyle = 'rgba(237,147,177,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(480, 290, 120, 0, Math.PI * 2); ctx.stroke();
      for (var a = 0; a < 8; a++) { ctx.beginPath(); ctx.moveTo(480, 290); ctx.lineTo(480 + Math.cos(a * Math.PI / 4) * 120, 290 + Math.sin(a * Math.PI / 4) * 120); ctx.stroke(); }
      // 롤러코스터 레일: 레일 두 줄과 침목
      L.paths.forEach(function (P) {
        for (var s = 0; s < P.length; s += 22) { var q = P.at(s), n = Math.hypot(q.dx, q.dy) || 1, nx = -q.dy / n * 26, ny = q.dx / n * 26;
          ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(q.x - nx, q.y - ny); ctx.lineTo(q.x + nx, q.y + ny); ctx.stroke(); }
      });
      L.paths.forEach(function (P) { strokePath(ctx, P, 50, 'rgba(255,255,255,.06)'); strokePath(ctx, P, 56, '#ed93b1', null); strokePath(ctx, P, 44, '#3a2a50'); });
      L.paths.forEach(function (P) { for (var s = 0; s < P.length; s += 22) { var q = P.at(s), n = Math.hypot(q.dx, q.dy) || 1, nx = -q.dy / n * 18, ny = q.dx / n * 18;
        ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x - nx, q.y - ny); ctx.lineTo(q.x + nx, q.y + ny); ctx.stroke(); } });
      [[30, 40], [930, 40], [30, 510], [930, 510]].forEach(function (p, k) { ctx.fillStyle = ['#ffd23f', '#ff6f91', '#7fd3ff', '#8fe07a'][k]; ctx.beginPath(); ctx.arc(p[0], p[1], 8, 0, Math.PI * 2); ctx.fill(); });
      plates(ctx, L, '#5a4a7a', '#ed93b1');
    }
  };
  // 3 문어 대장: 깊은 바다 소용돌이
  THEMES[3] = function (ctx, L) {
    ctx.fillStyle = '#185fa5'; ctx.fillRect(0, 0, 960, 540);
    ctx.strokeStyle = 'rgba(133,183,235,.35)'; ctx.lineWidth = 6;
    for (var k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(480, 290, 60 + k * 70, 30 + k * 34, 0, k * 0.6, k * 0.6 + Math.PI * 1.4); ctx.stroke(); }
    speckle(ctx, 31, 60, ['#b5d4f4', '#e6f1fb'], 3, 3);
    road(ctx, L, '#0c447c', '#85b7eb', '#e6f1fb');
    plates(ctx, L, '#f4c0d1', '#993556');
  };
  // 6 전갈 왕: 모래 돌 경기장과 기둥
  THEMES[6] = function (ctx, L) {
    ctx.fillStyle = '#e8c77a'; ctx.fillRect(0, 0, 960, 540);
    ctx.strokeStyle = 'rgba(181,118,42,.35)'; ctx.lineWidth = 2;
    for (var x = 0; x < 960; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke(); }
    for (var y = 0; y < 540; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
    road(ctx, L, '#854f0b', '#c98a4a', '#faeeda');
    [[40, 60], [920, 60], [40, 510], [920, 510]].forEach(function (p) {
      ctx.fillStyle = '#d9c08a'; ctx.fillRect(p[0] - 16, p[1] - 50, 32, 56); ctx.fillStyle = '#b5762a'; ctx.fillRect(p[0] - 20, p[1] - 56, 40, 8); ctx.fillRect(p[0] - 20, p[1] + 4, 40, 8);
    });
    plates(ctx, L, '#faeeda', '#854f0b');
  };
  // 9 냠냠 마왕: 마왕의 성 — 보라 바닥, 용암 틈, 별
  THEMES[9] = function (ctx, L) {
    ctx.fillStyle = '#26215c'; ctx.fillRect(0, 0, 960, 540); speckle(ctx, 37, 80, ['#cecbf6', '#fac775'], 2, 2);
    ctx.strokeStyle = '#e0603a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    [[30, 520, 120, 470, 90, 430], [930, 520, 860, 480, 890, 440], [480, 535, 520, 505, 500, 490]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[2], c[3]); ctx.lineTo(c[4], c[5]); ctx.stroke(); });
    road(ctx, L, '#3c3489', '#7f77dd', '#cecbf6');
    plates(ctx, L, '#afa9ec', '#3c3489');
  };
  function draw(ctx, stageNo, L) { (THEMES[stageNo] || THEMES[1])(ctx, L); flag(ctx, L); }
  return { draw: draw };
})();

/* ───────── 기타 ───────── */
G.MiscArt = (function () {
  var P = G.Pixel;
  function chest() {
    return P.get('기타/뽑기상자', function () {
      var g = new P.Grid(32, 28), wood = '#c9783a', dark = '#8a4a22', gold = '#ffd23f';
      g.rect(3, 10, 26, 15, wood); g.rect(4, 4, 24, 7, '#d98a48'); g.rect(5, 3, 22, 1, '#d98a48');
      g.hline(3, 28, 11, dark); g.rect(3, 17, 26, 1, dark);
      g.rect(14, 2, 4, 23, gold); g.rect(3, 10, 2, 15, gold); g.rect(27, 10, 2, 15, gold);
      g.rect(13, 11, 6, 5, gold); g.rect(15, 13, 2, 2, '#8a4a22');
      g.px(7, 6, '#ffd9a8'); g.px(8, 5, '#ffd9a8'); g.px(9, 5, '#ffd9a8');
      g.outline(); return g.toCanvas();
    });
  }
  function coin() {
    return P.get('기타/코인', function () {
      var g = new P.Grid(14, 14);
      g.ellipse(7, 7, 6, 6, '#ffd23f'); g.ellipse(7, 7, 4, 4, '#ffb02e'); g.rect(6, 4, 2, 6, '#ffe58a'); g.px(4, 4, '#ffffff');
      g.outline(); return g.toCanvas();
    });
  }
  function heart(full) {
    return P.get('기타/생명' + (full ? '' : '빈'), function () {
      var g = new P.Grid(13, 12), c = full ? '#ff5a7a' : '#d8cfe0';
      g.ellipse(3.5, 4, 3, 3, c); g.ellipse(9.5, 4, 3, 3, c);
      for (var y = 4; y < 11; y++) g.hline(1 + (y - 4), 11 - (y - 4), y, c);
      if (full) { g.px(3, 2, '#ffffff'); g.px(2, 3, '#ffd0dc'); }
      g.outline(); return g.toCanvas();
    });
  }
  return { chest: chest, coin: coin, heart: heart };
})();
