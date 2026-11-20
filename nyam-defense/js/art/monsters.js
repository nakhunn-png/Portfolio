/* 몬스터·우두머리·마왕 도트 그림 (임시 그림)
 * 모두 둥글고 큰 눈의 귀여운 모습. 왼쪽(우리 캐릭터 쪽)을 바라본다.
 * 실제 그림: assets/몬스터/<이름>.png  (이름은 config.js 의 G.MONSTERS 열쇠값)
 */
var G = globalThis.G || (globalThis.G = {});

G.MonsterArt = (function () {
  var P = G.Pixel, sh = P.shade;
  var EYE = '#2a1f2e', W = '#ffffff', BLUSH = '#ff9fb0', GOLD = '#ffd23f';

  function eyes(g, x, y, big) {
    var s = big ? 3 : 2;
    g.rect(x, y, s, s + 1, EYE); g.px(x, y, W);
    g.rect(x + (big ? 6 : 5), y, s, s + 1, EYE); g.px(x + (big ? 6 : 5), y, W);
  }
  function smile(g, x, y) { g.px(x, y, '#b8475a'); g.px(x + 1, y + 1, '#b8475a'); g.px(x + 2, y, '#b8475a'); }
  function blush(g, x, y, gap) { g.rect(x, y, 2, 1, BLUSH); g.rect(x + gap, y, 2, 1, BLUSH); }
  function crown(g, x, y) {
    g.rect(x, y + 2, 8, 2, GOLD); g.px(x, y + 1, GOLD); g.px(x, y, GOLD); g.px(x + 3, y + 1, GOLD); g.px(x + 4, y, GOLD); g.px(x + 4, y + 1, GOLD); g.px(x + 7, y, GOLD); g.px(x + 7, y + 1, GOLD);
    g.px(x + 2, y + 2, '#ff5a7a'); g.px(x + 5, y + 2, '#5ab0ff');
  }

  function slime(g, col, opt) {
    opt = opt || {};
    var cx = opt.cx || 16, bottom = opt.bottom || 27, rx = opt.rx || 11, ry = opt.ry || 9;
    g.ellipse(cx, bottom - ry + 1, rx, ry, col);
    g.hline(cx - rx + 1, cx + rx - 2, bottom, col);
    g.rect(cx - rx + 2, bottom - 1, rx * 2 - 4, 1, sh(col, -0.15));
    g.px(cx + rx - 5, bottom - ry - 3 + 4, sh(col, 0.5)); g.px(cx + rx - 4, bottom - ry - 2 + 4, sh(col, 0.5)); g.px(cx + rx - 6, bottom - ry - 2 + 4, sh(col, 0.4));
    var ey = bottom - Math.round(ry * 0.9);
    eyes(g, cx - Math.round(rx * 0.6), ey, opt.big);
    blush(g, cx - Math.round(rx * 0.8), ey + 4, Math.round(rx * 0.9));
    smile(g, cx - Math.round(rx * 0.25), ey + 4);
  }

  var MAKERS = {
    pinkSlime: function (g) { slime(g, '#ff8fb8'); },
    greenSlime: function (g) { slime(g, '#7fdc6a'); g.px(16, 15, '#c9ffb8'); },
    fireSlime: function (g) {
      slime(g, '#ff8a3d');
      g.ellipse(17, 11, 3, 4, '#ffd34d'); g.px(17, 6, '#ffd34d'); g.px(16, 7, '#ffd34d'); g.px(18, 8, '#fff2a8'); g.ellipse(17, 12, 1.5, 2, '#fff2a8');
    },
    mushroom: function (g) {
      g.ellipse(16, 12, 11, 7, '#f0564f'); g.hline(6, 26, 15, '#c43a3a');
      g.ellipse(11, 9, 2, 2, W); g.ellipse(19, 8, 2.4, 2, W); g.ellipse(24, 12, 1.5, 1.5, W); g.px(15, 13, W);
      g.rect(10, 16, 12, 9, '#fff1d6'); g.rect(10, 24, 12, 1, '#e8d2ae');
      g.rect(11, 25, 3, 2, '#c99a6b'); g.rect(18, 25, 3, 2, '#c99a6b');
      eyes(g, 11, 18); blush(g, 10, 22, 8); smile(g, 13, 22);
    },
    bat: function (g) {
      var c = '#8e6bd8';
      g.line(4, 12, 10, 16, c); g.line(3, 14, 10, 18, c); g.rect(4, 14, 6, 3, c); g.px(5, 18, c); g.px(7, 18, c);
      g.line(28, 12, 22, 16, c); g.line(29, 14, 22, 18, c); g.rect(22, 14, 6, 3, c); g.px(26, 18, c); g.px(24, 18, c);
      g.ellipse(16, 17, 7, 6.5, c); g.px(11, 10, c); g.px(12, 9, c); g.px(20, 9, c); g.px(21, 10, c);
      g.ellipse(16, 20, 4, 2.5, '#c4b0f5');
      eyes(g, 11, 15); blush(g, 10, 19, 9); smile(g, 14, 19);
      g.rect(14, 24, 1, 2, '#6b4fb0'); g.rect(18, 24, 1, 2, '#6b4fb0');
    },
    golem: function (g) {
      var c = '#8fa6c9';
      g.rect(7, 9, 18, 16, c); g.rect(8, 8, 16, 1, c); g.rect(8, 25, 16, 1, c);
      g.rect(5, 15, 3, 7, sh(c, -0.1)); g.rect(24, 15, 3, 7, sh(c, -0.1));
      g.rect(10, 26, 4, 2, sh(c, -0.25)); g.rect(18, 26, 4, 2, sh(c, -0.25));
      g.line(14, 8, 16, 2, '#7ff0ff'); g.line(15, 8, 17, 3, '#c8fbff'); g.line(19, 8, 22, 4, '#b98cff'); g.line(10, 8, 9, 4, '#7ff0ff');
      g.rect(8, 9, 16, 1, sh(c, 0.3));
      eyes(g, 9, 13); blush(g, 8, 18, 9); smile(g, 12, 18);
    },
    gemBug: function (g) {
      g.ellipse(24, 21, 4, 4, '#ff7fd1'); g.ellipse(18, 20, 4.5, 4.5, '#7fd3ff'); g.ellipse(11, 18, 6, 6, '#8ff07a');
      g.px(24, 18, W); g.px(18, 17, W);
      g.line(8, 12, 6, 8, '#3a8a2f'); g.line(12, 12, 13, 8, '#3a8a2f'); g.px(6, 7, '#ffd34d'); g.px(13, 7, '#ffd34d');
      g.rect(9, 24, 1, 2, '#3a8a2f'); g.rect(13, 24, 1, 2, '#3a8a2f'); g.rect(18, 25, 1, 2, '#3a8a2f'); g.rect(23, 25, 1, 2, '#3a8a2f');
      eyes(g, 7, 16); blush(g, 6, 20, 7); smile(g, 9, 20);
    },
    cloudBird: function (g) {
      g.ellipse(17, 17, 9, 7.5, '#ffffff'); g.ellipse(23, 13, 4, 3, '#ffffff'); g.ellipse(11, 22, 4, 2.5, '#eef6ff');
      g.ellipse(20, 18, 4, 3, '#8fc9ff'); g.px(23, 16, '#bfe2ff');
      g.rect(5, 16, 3, 2, '#ffc23d'); g.px(6, 18, '#e8a21b');
      g.rect(14, 24, 1, 3, '#ffc23d'); g.rect(18, 24, 1, 3, '#ffc23d');
      eyes(g, 9, 13); blush(g, 8, 18, 8);
    },
    windSpirit: function (g) {
      var c = '#a8f0d8';
      g.ellipse(16, 14, 8, 8, c); g.line(16, 22, 22, 27, c); g.line(15, 22, 21, 27, c); g.line(18, 22, 24, 25, c);
      g.line(20, 8, 25, 6, sh(c, 0.4)); g.line(24, 12, 28, 11, sh(c, 0.4)); g.px(12, 9, sh(c, 0.5));
      eyes(g, 11, 12); blush(g, 10, 17, 9); smile(g, 14, 17);
    },
    babyDragon: function (g) {
      var c = '#7ad06a';
      g.line(22, 20, 28, 15, c); g.line(22, 21, 29, 16, c); g.px(29, 14, '#ff8a3d');
      g.ellipse(17, 20, 7, 6, c); g.ellipse(12, 13, 6, 5.5, c);
      g.ellipse(17, 22, 4, 3, '#f6f0a8');
      g.line(20, 14, 25, 10, '#ff9fb0'); g.line(21, 15, 26, 12, '#ff9fb0'); g.rect(22, 12, 3, 3, '#ff9fb0');
      g.px(9, 7, '#fff2c4'); g.px(10, 8, '#fff2c4'); g.px(14, 7, '#fff2c4'); g.px(14, 8, '#fff2c4');
      g.rect(13, 25, 2, 2, sh(c, -0.25)); g.rect(19, 25, 2, 2, sh(c, -0.25));
      eyes(g, 8, 11); blush(g, 7, 15, 8); smile(g, 10, 15);
    },
    skeleton: function (g) {
      g.rect(11, 19, 10, 6, '#9aa7b8'); g.rect(11, 21, 10, 1, '#7d8a9b');
      g.rect(9, 19, 2, 4, '#f5f3ea'); g.rect(21, 19, 2, 4, '#f5f3ea');
      g.rect(12, 25, 2, 2, '#f5f3ea'); g.rect(18, 25, 2, 2, '#f5f3ea');
      g.ellipse(16, 12, 8, 7, '#f5f3ea');
      for (var y = 4; y <= 9; y++) for (var x = 7; x <= 25; x++) { var a = (x + 0.5 - 16) / 8.4, b = (y + 0.5 - 12) / 7.8; if (a * a + b * b <= 1) g.px(x, y, '#9aa7b8'); }
      g.hline(8, 24, 9, '#7d8a9b'); g.px(16, 3, '#ff7f9e'); g.px(16, 2, '#ff7f9e');
      eyes(g, 10, 11, true); blush(g, 9, 16, 11); smile(g, 14, 16);
    },
    darkKnight: function (g) {
      var c = '#6a5a9e';
      g.rect(10, 18, 12, 7, c); g.rect(8, 18, 2, 4, c); g.rect(22, 18, 2, 4, c);
      g.rect(12, 25, 3, 2, sh(c, -0.3)); g.rect(17, 25, 3, 2, sh(c, -0.3));
      g.ellipse(16, 12, 8, 7, c); g.rect(9, 11, 14, 5, '#3a3060'); g.hline(9, 22, 10, sh(c, 0.3));
      g.px(8, 5, '#ffd34d'); g.px(9, 6, '#ffd34d'); g.px(24, 5, '#ffd34d'); g.px(23, 6, '#ffd34d');
      g.rect(11, 12, 3, 2, '#9cff9c'); g.rect(17, 12, 3, 2, '#9cff9c'); g.px(11, 12, W); g.px(17, 12, W);
      g.rect(3, 17, 5, 7, '#8a7ac9'); g.px(5, 19, '#ffd34d'); g.px(5, 20, '#ffd34d');
    },
    minion: function (g) {
      var c = '#b07ae6';
      g.ellipse(16, 18, 8, 8, c); g.ellipse(16, 21, 5, 3, '#e3cbff');
      g.line(10, 11, 8, 6, '#ffe7a8'); g.line(11, 11, 9, 7, '#ffe7a8'); g.line(22, 11, 24, 6, '#ffe7a8'); g.line(21, 11, 23, 7, '#ffe7a8');
      g.line(24, 22, 28, 20, c); g.px(29, 19, '#ff7fd1');
      g.rect(12, 26, 2, 1, sh(c, -0.3)); g.rect(18, 26, 2, 1, sh(c, -0.3));
      eyes(g, 11, 15); blush(g, 10, 19, 9); smile(g, 14, 19);
    },
    minion2: function (g) { MAKERS.bat(g); g.px(16, 9, GOLD); g.px(15, 10, GOLD); g.px(17, 10, GOLD); },

    // ── 우두머리 (40×40) ──
    kingSlime: function (g) { slime(g, '#ff7fae', { cx: 20, bottom: 37, rx: 16, ry: 13, big: true }); crown(g, 16, 7); },
    mushroomKing: function (g) {
      g.ellipse(20, 15, 16, 10, '#e2463f'); g.hline(5, 35, 20, '#b0302e');
      g.ellipse(12, 11, 3, 2.5, W); g.ellipse(24, 9, 3.5, 3, W); g.ellipse(31, 15, 2, 2, W); g.ellipse(18, 16, 2, 1.5, W);
      g.rect(12, 21, 17, 13, '#fff1d6'); g.rect(14, 34, 4, 3, '#c99a6b'); g.rect(23, 34, 4, 3, '#c99a6b');
      eyes(g, 14, 23, true); blush(g, 12, 28, 13);
      g.rect(15, 29, 3, 1, '#8a5a32'); g.rect(20, 29, 3, 1, '#8a5a32'); g.px(18, 30, '#b8475a'); g.px(19, 30, '#b8475a');
      crown(g, 16, 1);
    },
    crystalGiant: function (g) {
      var c = '#7f97c4';
      g.rect(8, 12, 24, 22, c); g.rect(9, 11, 22, 1, c); g.rect(4, 18, 4, 10, sh(c, -0.1)); g.rect(32, 18, 4, 10, sh(c, -0.1));
      g.rect(11, 34, 6, 3, sh(c, -0.25)); g.rect(23, 34, 6, 3, sh(c, -0.25));
      g.line(13, 11, 11, 3, '#7ff0ff'); g.line(14, 11, 12, 4, '#c8fbff'); g.line(19, 11, 20, 1, '#b98cff'); g.line(20, 11, 21, 2, '#e3ccff');
      g.line(26, 11, 29, 4, '#7ff0ff'); g.line(27, 11, 30, 5, '#c8fbff'); g.rect(9, 12, 22, 1, sh(c, 0.3));
      eyes(g, 12, 17, true); blush(g, 11, 23, 14); smile(g, 17, 24);
      g.ellipse(20, 29, 3, 2, '#7ff0ff');
    },
    stormBird: function (g) {
      g.ellipse(22, 23, 12, 10, '#e9f1ff'); g.ellipse(28, 16, 6, 4, '#e9f1ff'); g.ellipse(26, 25, 6, 4, '#6fa8ff');
      g.line(26, 10, 30, 3, '#ffd34d'); g.line(28, 11, 34, 6, '#ffd34d'); g.line(24, 10, 24, 3, '#ffd34d');
      g.rect(6, 21, 5, 3, '#ffc23d'); g.px(7, 24, '#e8a21b');
      g.rect(18, 33, 2, 4, '#ffc23d'); g.rect(24, 33, 2, 4, '#ffc23d');
      eyes(g, 12, 17, true); blush(g, 11, 23, 11);
      g.px(32, 30, '#c8e2ff'); g.px(35, 27, '#c8e2ff');
    },
    lavaDragon: function (g) {
      var c = '#f2604a';
      g.line(28, 28, 37, 20, c); g.line(28, 29, 38, 21, c); g.px(38, 19, '#ffd34d'); g.px(37, 18, '#ffd34d');
      g.ellipse(23, 27, 10, 8, c); g.ellipse(15, 17, 9, 8, c); g.ellipse(23, 30, 6, 4, '#ffd9a8');
      g.line(27, 17, 35, 9, '#ffb36b'); g.line(28, 19, 37, 12, '#ffb36b'); g.rect(30, 12, 4, 5, '#ffb36b');
      g.px(10, 9, '#fff2c4'); g.px(11, 10, '#fff2c4'); g.px(9, 8, '#fff2c4'); g.px(18, 9, '#fff2c4'); g.px(19, 8, '#fff2c4');
      g.rect(17, 34, 3, 3, sh(c, -0.25)); g.rect(26, 34, 3, 3, sh(c, -0.25));
      eyes(g, 9, 15, true); blush(g, 8, 21, 11); smile(g, 12, 21);
      g.px(4, 19, '#ffd34d'); g.px(3, 18, '#fff2a8');
    },
    darkCaptain: function (g) {
      var c = '#5a4a8e';
      g.rect(9, 20, 24, 10, '#7a3a8e'); // 망토
      g.rect(12, 20, 16, 12, c); g.rect(9, 21, 3, 6, c); g.rect(28, 21, 3, 6, c);
      g.rect(13, 32, 5, 4, sh(c, -0.3)); g.rect(22, 32, 5, 4, sh(c, -0.3));
      g.ellipse(20, 13, 10, 9, c); g.rect(11, 12, 18, 6, '#30285a'); g.hline(10, 30, 11, sh(c, 0.3));
      g.line(11, 6, 7, 1, '#ffd34d'); g.line(12, 6, 8, 2, '#ffd34d'); g.line(29, 6, 33, 1, '#ffd34d'); g.line(28, 6, 32, 2, '#ffd34d');
      g.rect(13, 13, 4, 3, '#9cff9c'); g.rect(23, 13, 4, 3, '#9cff9c'); g.px(13, 13, W); g.px(23, 13, W);
      g.rect(2, 19, 7, 10, '#8a7ac9'); g.px(5, 22, GOLD); g.rect(4, 23, 3, 1, GOLD); g.px(5, 24, GOLD);
      g.vline(34, 10, 30, '#d8e0ea'); g.vline(35, 10, 30, '#aab4c0'); g.hline(32, 37, 30, GOLD);
    },
    demonKing: function (g) {
      var c = '#8e4fd0';
      // 망토
      g.rect(6, 22, 28, 14, '#5a2a8e'); g.rect(5, 30, 30, 6, '#4a2276');
      // 몸
      g.ellipse(20, 26, 11, 10, c); g.ellipse(20, 29, 7, 5, '#c9a3f5');
      g.rect(14, 35, 4, 3, sh(c, -0.3)); g.rect(22, 35, 4, 3, sh(c, -0.3));
      // 머리
      g.ellipse(20, 14, 11, 9, c);
      // 둥근 뿔
      g.ellipse(8, 8, 2.5, 4, '#ffe7a8'); g.ellipse(32, 8, 2.5, 4, '#ffe7a8'); g.px(7, 4, '#ffe7a8'); g.px(33, 4, '#ffe7a8');
      // 커다란 왕관
      g.rect(13, 3, 14, 4, GOLD); g.px(13, 1, GOLD); g.px(13, 2, GOLD); g.px(17, 0, GOLD); g.px(17, 1, GOLD); g.px(17, 2, GOLD);
      g.px(22, 0, GOLD); g.px(22, 1, GOLD); g.px(22, 2, GOLD); g.px(26, 1, GOLD); g.px(26, 2, GOLD);
      g.px(16, 4, '#3fbf4f'); g.px(20, 4, '#ff5a7a'); g.px(24, 4, '#3fbf4f'); g.hline(13, 26, 6, '#d9a21b');
      // 초록 눈 + 장난스러운 표정
      g.rect(12, 12, 4, 4, '#3fbf4f'); g.rect(24, 12, 4, 4, '#3fbf4f'); g.rect(13, 13, 2, 2, '#1d5c27'); g.rect(25, 13, 2, 2, '#1d5c27');
      g.px(12, 12, W); g.px(24, 12, W);
      g.line(11, 10, 15, 11, '#5a2a8e'); g.line(29, 10, 25, 11, '#5a2a8e');
      blush(g, 10, 17, 18);
      g.hline(17, 23, 19, '#5a1a4a'); g.px(18, 20, W); g.px(22, 20, W);
      // 보라 마법 반짝임
      g.px(2, 14, '#e3b0ff'); g.px(1, 15, '#e3b0ff'); g.px(3, 15, '#e3b0ff'); g.px(2, 16, '#e3b0ff');
      g.px(37, 20, '#e3b0ff'); g.px(36, 21, '#e3b0ff'); g.px(38, 21, '#e3b0ff'); g.px(37, 22, '#e3b0ff');
    }
  };

  function sprite(type) {
    return P.get('몬스터/' + type, function () {
      var boss = G.MONSTERS[type].boss, g = new P.Grid(boss ? 40 : 32, boss ? 40 : 32);
      MAKERS[type](g);
      g.outline();
      return g.toCanvas();
    });
  }
  function overrideList() {
    return Object.keys(G.MONSTERS).map(function (k) { return { key: '몬스터/' + k, src: 'assets/몬스터/' + k + '.png' }; });
  }
  return { sprite: sprite, overrideList: overrideList };
})();
