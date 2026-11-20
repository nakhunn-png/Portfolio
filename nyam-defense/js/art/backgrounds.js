/* 일곱 지역 배경 + 기타 작은 그림 (임시 도트 그림)
 * 배경은 320×180 칸으로 그린 뒤 3배로 키워 960×540 화면에 쓴다.
 * 실제 그림: assets/배경/1.png ~ assets/배경/7.png (가로형, 960×540 권장)
 *           assets/기타/뽑기상자.png, assets/기타/뽑기권.png, assets/기타/대표그림.png
 */
var G = globalThis.G || (globalThis.G = {});

G.BgArt = (function () {
  var P = G.Pixel, sh = P.shade;
  var BW = 320, BH = 180, HORIZON = 64;

  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function base(ctx, sky1, sky2, ground1, ground2) {
    // 하늘: 띠 모양 단계 색
    for (var i = 0; i < 6; i++) {
      ctx.fillStyle = mix(sky1, sky2, i / 5);
      ctx.fillRect(0, Math.floor(i * HORIZON / 6), BW, Math.ceil(HORIZON / 6) + 1);
    }
    ctx.fillStyle = ground1; ctx.fillRect(0, HORIZON, BW, BH - HORIZON);
    // 땅 무늬
    var r = seeded(7);
    ctx.fillStyle = ground2;
    for (var k = 0; k < 140; k++) ctx.fillRect(Math.floor(r() * BW), HORIZON + 4 + Math.floor(r() * (BH - HORIZON - 4)), 2, 1);
  }
  function mix(a, b, t) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round((x >> 16) * (1 - t) + (y >> 16) * t), g = Math.round(((x >> 8) & 255) * (1 - t) + ((y >> 8) & 255) * t), bl = Math.round((x & 255) * (1 - t) + (y & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  function blob(ctx, cx, cy, rx, ry, col) {
    ctx.fillStyle = col;
    for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))); ctx.fillRect(cx - w, cy + y, w * 2, 1); }
  }
  function cloud(ctx, x, y, s, col) { blob(ctx, x, y, 8 * s, 3 * s, col || '#ffffff'); blob(ctx, x - 5 * s, y + 1, 5 * s, 2 * s, col || '#ffffff'); blob(ctx, x + 3 * s, y - 2 * s, 5 * s, 3 * s, col || '#ffffff'); }
  function tree(ctx, x, y, col) {
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 1, y - 8, 3, 8);
    blob(ctx, x, y - 13, 7, 7, sh(col, -0.15)); blob(ctx, x - 1, y - 14, 6, 6, col); ctx.fillStyle = sh(col, 0.3); ctx.fillRect(x - 3, y - 17, 2, 2);
  }
  function flower(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillStyle = '#fff17a'; ctx.fillRect(x, y, 1, 1); }
  function hills(ctx, col, y, seed, amp) {
    var r = seeded(seed); ctx.fillStyle = col;
    var h = y;
    for (var x = 0; x < BW; x += 4) { h += (r() - 0.5) * amp; h = Math.max(y - 14, Math.min(y + 4, h)); ctx.fillRect(x, Math.round(h), 4, HORIZON - Math.round(h) + 1); }
  }
  function castle(ctx, x, y, wall, roof) {
    ctx.fillStyle = wall; ctx.fillRect(x, y - 18, 30, 18); ctx.fillRect(x - 6, y - 26, 8, 26); ctx.fillRect(x + 28, y - 26, 8, 26); ctx.fillRect(x + 11, y - 32, 8, 14);
    ctx.fillStyle = roof;
    for (var i = 0; i < 6; i++) { ctx.fillRect(x - 6 + i, y - 26 - 6 + i, 8 - i * 2 > 0 ? 8 - i * 2 : 1, 1); }
    tri(ctx, x - 2, y - 26, 6, roof); tri(ctx, x + 32, y - 26, 6, roof); tri(ctx, x + 15, y - 32, 6, roof);
    ctx.fillStyle = sh(wall, -0.4); ctx.fillRect(x + 12, y - 8, 6, 8); ctx.fillRect(x - 3, y - 20, 2, 3); ctx.fillRect(x + 31, y - 20, 2, 3);
  }
  function tri(ctx, cx, by, h, col) { ctx.fillStyle = col; for (var i = 0; i < h; i++) ctx.fillRect(cx - (h - i), by - i - 1, (h - i) * 2, 1); }
  function crystal(ctx, x, y, h, col) {
    ctx.fillStyle = col; for (var i = 0; i < h; i++) { var w = Math.max(1, Math.round(3 * (1 - i / h)) + 1); ctx.fillRect(x - w, y - i, w * 2, 1); }
    ctx.fillStyle = sh(col, 0.5); ctx.fillRect(x - 1, y - h + 2, 1, Math.round(h / 2));
  }
  function mushroomBig(ctx, x, y, s, col) {
    ctx.fillStyle = '#fff1d6'; ctx.fillRect(x - 2 * s, y - 8 * s, 4 * s, 8 * s);
    blob(ctx, x, y - 9 * s, 8 * s, 4 * s, col); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4 * s, y - 11 * s, 2 * s, 2 * s); ctx.fillRect(x + 3 * s, y - 10 * s, 2 * s, s + 1);
  }

  var THEMES = [
    function (ctx) { // 1 초록 들판
      base(ctx, '#7cc8ff', '#c6ecff', '#7fd36b', '#6cc05a');
      cloud(ctx, 50, 16, 1.2); cloud(ctx, 200, 12, 1); cloud(ctx, 280, 24, 0.8);
      hills(ctx, '#9be08a', 52, 3, 6); hills(ctx, '#86d672', 58, 9, 4);
      castle(ctx, 236, 58, '#f4efe4', '#ff7f7f');
      tree(ctx, 30, 62, '#4fb84a'); tree(ctx, 120, 60, '#5cc455'); tree(ctx, 300, 63, '#4fb84a'); tree(ctx, 170, 62, '#62c95a');
      var r = seeded(11); for (var i = 0; i < 40; i++) flower(ctx, Math.floor(r() * BW), 70 + Math.floor(r() * 105), ['#ff8fb8', '#ffffff', '#ffd34d', '#b98cff'][i % 4]);
    },
    function (ctx) { // 2 버섯 숲
      base(ctx, '#9fd8ff', '#e3f6d8', '#8fcf6a', '#7cbd58');
      hills(ctx, '#3f9c55', 46, 5, 10); hills(ctx, '#57b25e', 56, 8, 6);
      tree(ctx, 20, 60, '#2f8a44'); tree(ctx, 70, 58, '#3f9c55'); tree(ctx, 250, 59, '#2f8a44');
      mushroomBig(ctx, 110, 64, 2, '#f0564f'); mushroomBig(ctx, 190, 62, 1.5, '#ffb03d'); mushroomBig(ctx, 290, 64, 2, '#b98cff'); mushroomBig(ctx, 40, 66, 1, '#ff8fb8');
      var r = seeded(5); for (var i = 0; i < 30; i++) flower(ctx, Math.floor(r() * BW), 72 + Math.floor(r() * 100), ['#ffd34d', '#ff8fb8', '#ffffff'][i % 3]);
    },
    function (ctx) { // 3 수정 동굴
      base(ctx, '#4a3f78', '#6f5fa8', '#7c6fa8', '#6c609a');
      ctx.fillStyle = '#3a3060'; for (var x = 0; x < BW; x += 8) ctx.fillRect(x, 0, 8, 6 + ((x * 7) % 13));
      hills(ctx, '#5a4d8c', 50, 4, 8);
      var cols = ['#7ff0ff', '#ff9cf2', '#b98cff', '#8ff07a', '#ffd34d'];
      [[20, 62, 16], [60, 60, 10], [140, 62, 20], [210, 60, 12], [270, 63, 18], [305, 61, 9]].forEach(function (c, i) { crystal(ctx, c[0], c[1], c[2], cols[i % 5]); });
      var r = seeded(3); for (var i = 0; i < 26; i++) { ctx.fillStyle = cols[i % 5]; ctx.fillRect(Math.floor(r() * BW), 70 + Math.floor(r() * 100), 2, 2); }
    },
    function (ctx) { // 4 구름 언덕
      base(ctx, '#5fb6ff', '#d8f0ff', '#bfe8a8', '#a8db90');
      cloud(ctx, 40, 20, 1.6); cloud(ctx, 150, 12, 1.2); cloud(ctx, 260, 22, 1.8); cloud(ctx, 100, 40, 1); cloud(ctx, 210, 44, 1.1);
      hills(ctx, '#d8f0c8', 40, 6, 14); hills(ctx, '#b0e09a', 54, 12, 8);
      var r = seeded(8); for (var i = 0; i < 12; i++) cloud(ctx, Math.floor(r() * BW), 80 + Math.floor(r() * 90), 0.5, '#e9f6ff');
    },
    function (ctx) { // 5 용암 지대
      base(ctx, '#ffb37a', '#ffe0b0', '#c9845a', '#b8744c');
      hills(ctx, '#a35a3a', 44, 4, 14); hills(ctx, '#c06a42', 56, 6, 6);
      ctx.fillStyle = '#ff7a3a'; ctx.fillRect(130, 30, 3, 14); ctx.fillStyle = '#ffd34d'; ctx.fillRect(131, 26, 2, 4);
      var r = seeded(9);
      for (var i = 0; i < 6; i++) { var x = 20 + Math.floor(r() * 280), y = 80 + Math.floor(r() * 85); blob(ctx, x, y, 10, 3, '#ff8a3d'); blob(ctx, x, y, 6, 2, '#ffd34d'); }
      for (i = 0; i < 18; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.floor(r() * BW), Math.floor(r() * HORIZON), 1, 1); }
      [[30, 62], [200, 61], [290, 63]].forEach(function (p) { blob(ctx, p[0], p[1] - 4, 8, 5, '#8a4a32'); });
    },
    function (ctx) { // 6 마왕의 성
      base(ctx, '#8a6fd0', '#d9c6ff', '#a49ab8', '#958aa8');
      cloud(ctx, 60, 18, 1, '#efe4ff'); cloud(ctx, 270, 14, 1.2, '#efe4ff');
      hills(ctx, '#7a6aa8', 50, 2, 8);
      castle(ctx, 140, 60, '#8a7ab8', '#b07ae6');
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(152, 40, 2, 2); ctx.fillRect(160, 46, 2, 2);
      ctx.fillStyle = '#8a809e'; for (var x = 0; x < BW; x += 16) for (var y = 72; y < BH; y += 12) ctx.fillRect(x + ((y / 12) % 2) * 8, y, 14, 1);
      tree(ctx, 30, 62, '#7fb870'); tree(ctx, 290, 62, '#7fb870');
    },
    function (ctx) { // 7 마왕의 왕좌
      base(ctx, '#5a3a8e', '#9a6fd0', '#8e74b8', '#7f66a8');
      ctx.fillStyle = '#4a2f78'; for (var x = 0; x < BW; x += 40) ctx.fillRect(x + 8, 0, 10, HORIZON);
      ctx.fillStyle = '#3fbf4f'; for (x = 0; x < BW; x += 40) { ctx.fillRect(x + 6, 10, 14, 3); ctx.fillRect(x + 6, 40, 14, 3); }
      // 커다란 왕좌
      ctx.fillStyle = '#7a3a9e'; ctx.fillRect(140, 12, 40, 52); ctx.fillStyle = '#ffd23f'; ctx.fillRect(136, 8, 48, 6); ctx.fillRect(136, 40, 8, 24); ctx.fillRect(176, 40, 8, 24);
      ctx.fillStyle = '#b07ae6'; ctx.fillRect(146, 18, 28, 30); ctx.fillStyle = '#3fbf4f'; ctx.fillRect(157, 4, 6, 6);
      ctx.fillStyle = '#c93a5a'; ctx.fillRect(120, 64, 80, BH - 64);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(120, 64, 2, BH - 64); ctx.fillRect(198, 64, 2, BH - 64);
      var r = seeded(4); for (var i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? '#e3b0ff' : '#bfffb0'; ctx.fillRect(Math.floor(r() * BW), Math.floor(r() * HORIZON), 1, 1); }
    }
  ];

  function background(stageIdx) {
    return P.get('배경/' + (stageIdx + 1), function () {
      var c = document.createElement('canvas'); c.width = BW; c.height = BH;
      var ctx = c.getContext('2d'); THEMES[stageIdx](ctx);
      return c;
    });
  }
  function overrideList() {
    var l = []; for (var i = 1; i <= 7; i++) l.push({ key: '배경/' + i, src: 'assets/배경/' + i + '.png' });
    return l;
  }
  return { background: background, overrideList: overrideList };
})();

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
  function ticket() {
    return P.get('기타/뽑기권', function () {
      var g = new P.Grid(20, 14);
      g.rect(1, 2, 18, 10, '#ffd34d'); g.px(1, 6, null); g.vline(14, 3, 10, '#e8a21b');
      g.rect(4, 5, 7, 4, '#ff8fb8'); g.px(7, 4, '#ff8fb8'); g.px(7, 9, '#ff8fb8'); g.px(5, 6, '#ffffff');
      g.d[6 * 20 + 1] = null; g.d[7 * 20 + 1] = null;
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
  function overrideList() {
    return ['뽑기상자', '뽑기권', '대표그림'].map(function (n) { return { key: '기타/' + n, src: 'assets/기타/' + n + '.png' }; });
  }
  return { chest: chest, ticket: ticket, heart: heart, overrideList: overrideList };
})();
