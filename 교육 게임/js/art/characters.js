/* 캐릭터 도트 그림 (임시 그림) — 1편 nyam-defense 에서 가져와 2편 모자·무기를 더했다
 * config.js 의 look 값을 재료로 32×32 칸의 귀여운 2~3등신 캐릭터를 만든다.
 * 실제 그림이 준비되면 assets/캐릭터/<번호>.png 로 넣으면 자동으로 바뀐다.
 */
var G = globalThis.G || (globalThis.G = {});

G.CharArt = (function () {
  var P = G.Pixel, sh = P.shade;
  var EYE = '#2a1f2e', WHITE = '#ffffff', BLUSH = '#ff9fb0', MOUTH = '#b8475a';
  var GOLD = '#ffd23f', GOLD2 = '#d9a21b', METAL = '#dfe6ee';

  function make(ch) {
    var L = ch.look, g = new P.Grid(32, 32);
    var skin = L.skin || '#ffd9b8', hair = L.hair, out = L.outfit, out2 = L.outfit2 || sh(out, -0.3);
    var grade = ch.grade;

    // ── 뒤쪽 (날개, 망토, 긴 머리) ──
    if (L.extra === 'wings') {
      var wc = ch.grade === 'legendary' ? '#d9ffd0' : '#d6fbff';
      g.ellipse(7, 17, 4, 5, wc); g.ellipse(25, 17, 4, 5, wc);
      g.ellipse(8, 22, 3, 3, sh(wc, -0.08)); g.ellipse(24, 22, 3, 3, sh(wc, -0.08));
    }
    if (L.extra === 'cape') { g.rect(10, 18, 12, 8, L.capeColor); g.rect(9, 22, 14, 4, sh(L.capeColor, -0.15)); }
    if (L.hairStyle === 'long') { g.rect(8, 11, 3, 11, hair); g.rect(21, 11, 3, 11, hair); g.rect(9, 21, 2, 1, sh(hair, -0.2)); g.rect(21, 21, 2, 1, sh(hair, -0.2)); }
    if (L.hairStyle === 'twin') { g.ellipse(7, 15, 2.6, 4, hair); g.ellipse(25, 15, 2.6, 4, hair); g.px(8, 11, '#ff6f91'); g.px(23, 11, '#ff6f91'); }

    // ── 몸 ──
    g.rect(12, 18, 8, 6, out);
    g.rect(12, 22, 8, 1, out2);                 // 허리띠
    g.rect(13, 23, 6, 1, out2);
    if (grade === 'unique' || grade === 'legendary') { g.rect(12, 22, 8, 1, GOLD); g.px(15, 22, GOLD2); g.px(16, 22, GOLD2); }
    if (grade === 'epic') g.px(16, 20, '#e6c3ff');
    if (grade === 'epic' || grade === 'unique' || grade === 'legendary') { g.px(12, 18, sh(out, 0.35)); g.px(19, 18, sh(out, 0.35)); }
    if (grade === 'legendary') { g.px(16, 19, '#bfffb0'); g.px(15, 20, '#bfffb0'); g.px(16, 20, GOLD); g.px(17, 20, '#bfffb0'); }
    // 팔
    g.rect(10, 18, 2, 3, out); g.rect(20, 18, 2, 3, out);
    g.rect(10, 21, 2, 1, skin); g.rect(20, 21, 2, 1, skin);
    // 다리와 신발
    g.rect(13, 24, 2, 2, sh(out2, -0.2)); g.rect(17, 24, 2, 2, sh(out2, -0.2));
    g.rect(12, 26, 3, 1, '#6b4a3a'); g.rect(17, 26, 3, 1, '#6b4a3a');

    // ── 머리 ──
    if (L.ears === 'bunny') {
      g.ellipse(12, 3.5, 1.8, 4.5, L.earColor); g.ellipse(20, 3.5, 1.8, 4.5, L.earColor);
      g.vline(12, 1, 5, '#ffb7c8'); g.vline(20, 1, 5, '#ffb7c8');
    }
    if (L.ears === 'dog') { g.ellipse(8, 11, 2, 4, L.earColor); g.ellipse(24, 11, 2, 4, L.earColor); }
    if (L.ears === 'elf') { g.line(9, 12, 6, 10, skin); g.line(9, 13, 7, 11, skin); g.line(22, 12, 25, 10, skin); g.line(22, 13, 24, 11, skin); }

    g.ellipse(16, 12, 7.2, 6.6, skin);
    // 머리카락 윗부분
    for (var y = 4; y <= 9; y++) for (var x = 7; x <= 24; x++) {
      var dx = (x + 0.5 - 16) / 7.4, dy = (y + 0.5 - 12) / 6.9;
      if (dx * dx + dy * dy <= 1) g.px(x, y, hair);
    }
    // 앞머리
    g.hline(10, 21, 10, hair); g.px(12, 11, hair); g.px(13, 11, hair); g.px(17, 11, hair); g.px(20, 11, hair); g.px(21, 11, hair);
    g.rect(9, 10, 2, 3, hair); g.rect(21, 10, 2, 3, hair);
    if (L.hairStyle === 'bob' || L.hairStyle === 'long' || L.hairStyle === 'twin') { g.rect(9, 10, 2, 7, hair); g.rect(21, 10, 2, 7, hair); }
    if (L.hairStyle === 'spiky') { g.px(10, 5, hair); g.px(9, 6, hair); g.px(13, 4, hair); g.px(12, 4, hair); g.px(16, 3, hair); g.px(17, 3, hair); g.px(20, 4, hair); g.px(22, 5, hair); g.px(23, 7, hair); }
    // 머리카락 반짝임
    g.px(12, 6, sh(hair, 0.35)); g.px(13, 6, sh(hair, 0.35)); g.px(11, 7, sh(hair, 0.35));

    // 얼굴
    g.rect(12, 13, 2, 2, EYE); g.rect(18, 13, 2, 2, EYE);
    g.px(12, 13, WHITE); g.px(18, 13, WHITE);
    g.rect(10, 15, 2, 1, BLUSH); g.rect(20, 15, 2, 1, BLUSH);
    g.px(15, 16, MOUTH); g.px(16, 16, MOUTH);

    if (L.ears === 'cat') {
      g.line(9, 3, 9, 7, L.earColor); g.line(10, 4, 11, 6, L.earColor); g.px(10, 5, L.earColor); g.px(10, 6, '#ffb7c8');
      g.line(22, 3, 22, 7, L.earColor); g.line(21, 4, 20, 6, L.earColor); g.px(21, 5, L.earColor); g.px(21, 6, '#ffb7c8');
    }

    // ── 모자 ──
    var hc = L.hatColor;
    switch (L.hat) {
      case 'hood':
        for (y = 4; y <= 10; y++) for (x = 7; x <= 24; x++) { var a = (x + 0.5 - 16) / 7.8, b = (y + 0.5 - 12) / 7.4; if (a * a + b * b <= 1) g.px(x, y, hc); }
        g.rect(8, 10, 2, 7, hc); g.rect(22, 10, 2, 7, hc); g.line(24, 7, 27, 10, hc); g.px(27, 11, hc);
        g.px(12, 6, sh(hc, 0.3)); g.px(13, 5, sh(hc, 0.3));
        break;
      case 'wizard':
        g.hline(6, 25, 9, hc); g.hline(7, 24, 8, hc);
        g.rect(11, 5, 10, 3, hc); g.rect(12, 3, 8, 2, hc); g.rect(14, 1, 5, 2, hc); g.px(19, 0, hc); g.px(20, 0, hc); g.px(21, 1, hc);
        g.hline(11, 20, 7, sh(hc, -0.25));
        g.px(13, 5, sh(hc, 0.3));
        if (L.hatStar) { g.px(16, 4, GOLD); g.px(15, 5, GOLD); g.px(17, 5, GOLD); g.px(16, 5, '#fff7b0'); g.px(16, 6, GOLD); }
        break;
      case 'helmet':
      case 'crownHelm':
        for (y = 3; y <= 10; y++) for (x = 7; x <= 24; x++) { var c1 = (x + 0.5 - 16) / 7.8, d1 = (y + 0.5 - 12) / 7.8; if (c1 * c1 + d1 * d1 <= 1) g.px(x, y, L.hat === 'crownHelm' ? METAL : hc); }
        var hm = L.hat === 'crownHelm' ? METAL : hc;
        g.rect(8, 10, 2, 6, hm); g.rect(22, 10, 2, 6, hm); g.hline(9, 22, 10, sh(hm, -0.2));
        g.px(11, 5, WHITE); g.px(12, 5, WHITE); g.px(10, 6, WHITE);
        if (L.plume) { g.rect(15, 0, 3, 3, L.plume); g.px(18, 1, L.plume); g.px(14, 1, sh(L.plume, 0.3)); }
        if (L.hat === 'crownHelm') {
          g.rect(11, 2, 10, 2, GOLD); g.px(11, 1, GOLD); g.px(14, 0, GOLD); g.px(14, 1, GOLD); g.px(17, 0, GOLD); g.px(17, 1, GOLD); g.px(20, 1, GOLD);
          g.px(13, 2, '#3fbf4f'); g.px(16, 2, '#ff5a7a'); g.px(19, 2, '#3fbf4f');
        }
        break;
      case 'pot':
        g.rect(9, 4, 14, 6, hc); g.hline(8, 23, 9, sh(hc, -0.2)); g.rect(6, 6, 3, 2, hc); g.rect(23, 6, 3, 2, hc);
        g.hline(10, 21, 4, sh(hc, 0.3)); g.px(15, 3, '#555b61'); g.px(16, 3, '#555b61');
        break;
      case 'crown':
        g.rect(11, 3, 10, 3, GOLD); g.px(11, 2, GOLD); g.px(11, 1, GOLD); g.px(14, 1, GOLD); g.px(14, 2, GOLD); g.px(15, 0, GOLD);
        g.px(17, 1, GOLD); g.px(17, 2, GOLD); g.px(16, 0, GOLD); g.px(20, 1, GOLD); g.px(20, 2, GOLD);
        g.hline(11, 20, 5, GOLD2); g.px(13, 4, '#ff5a7a'); g.px(16, 4, '#3fbf4f'); g.px(18, 4, '#5ab0ff');
        break;
      case 'flower':
        g.ellipse(21, 5, 2.4, 2.4, hc); g.px(21, 5, '#fff17a'); g.px(20, 5, '#fff17a'); g.px(23, 7, '#6cc04a'); g.px(24, 7, '#6cc04a');
        break;
      case 'feather':
        g.rect(10, 5, 12, 3, '#3d9a8b'); g.hline(9, 22, 8, '#276b60');
        g.line(21, 6, 26, 0, hc); g.line(22, 6, 27, 1, hc); g.px(25, 2, '#ffe066');
        break;
      case 'tiara':
        g.hline(12, 19, 6, hc); g.px(15, 5, hc); g.px(16, 5, hc); g.px(16, 4, '#ffffff'); g.px(13, 5, hc); g.px(18, 5, hc);
        break;
      // ── 2편에서 새로 더한 모자 ──
      case 'chef':
        g.rect(10, 6, 12, 4, hc); g.ellipse(12, 4, 3, 3, hc); g.ellipse(16, 3, 3.4, 3, hc); g.ellipse(20, 4, 3, 3, hc);
        g.hline(10, 21, 9, sh(hc, -0.12)); g.px(13, 3, sh(hc, -0.08));
        break;
      case 'beanie':
        for (y = 4; y <= 9; y++) for (x = 8; x <= 23; x++) { var bb = (x + 0.5 - 16) / 7.8, bc2 = (y + 0.5 - 10) / 6.2; if (bb * bb + bc2 * bc2 <= 1) g.px(x, y, hc); }
        g.hline(8, 23, 9, sh(hc, -0.25)); g.ellipse(16, 3, 2, 1.6, sh(hc, 0.35));
        break;
      case 'bucket':
        g.rect(11, 3, 10, 5, hc); g.hline(9, 22, 8, sh(hc, -0.25)); g.hline(11, 20, 3, sh(hc, 0.25));
        break;
      case 'shark':
        for (y = 3; y <= 10; y++) for (x = 7; x <= 24; x++) { var s1 = (x + 0.5 - 16) / 7.8, s2 = (y + 0.5 - 12) / 7.6; if (s1 * s1 + s2 * s2 <= 1) g.px(x, y, hc); }
        g.line(15, 3, 18, 0, hc); g.line(16, 3, 19, 0, hc); g.vline(19, 0, 3, hc);
        for (x = 9; x <= 22; x += 2) g.px(x, 9, '#ffffff');
        g.px(9, 7, EYE); g.px(22, 7, EYE);
        break;
      case 'penguin':
        for (y = 3; y <= 10; y++) for (x = 7; x <= 24; x++) { var p1 = (x + 0.5 - 16) / 7.8, p2 = (y + 0.5 - 12) / 7.6; if (p1 * p1 + p2 * p2 <= 1) g.px(x, y, hc); }
        g.rect(8, 10, 2, 6, hc); g.rect(22, 10, 2, 6, hc);
        g.rect(14, 5, 4, 2, '#ffb02e'); g.px(13, 4, '#ffffff'); g.px(18, 4, '#ffffff');
        break;
      case 'astro':
        for (y = 3; y <= 19; y++) for (x = 6; x <= 25; x++) { var a1 = (x + 0.5 - 16) / 9.6, a2 = (y + 0.5 - 12) / 8.6; var r = a1 * a1 + a2 * a2; if (r <= 1 && r > 0.72) g.px(x, y, hc); }
        g.px(9, 7, '#ffffff'); g.px(10, 6, '#ffffff'); g.rect(15, 2, 2, 2, '#ff5a7a');
        break;
      case 'band':
        g.hline(8, 23, 8, hc); g.hline(8, 23, 9, hc); g.px(24, 9, hc); g.px(25, 10, hc); g.px(25, 11, hc); g.px(15, 8, '#ffffff'); g.px(16, 8, '#ffffff');
        break;
      case 'horns':
        g.line(10, 6, 7, 1, hc); g.line(11, 6, 8, 1, hc); g.line(21, 6, 24, 1, hc); g.line(20, 6, 23, 1, hc);
        g.px(7, 0, sh(hc, 0.3)); g.px(24, 0, sh(hc, 0.3));
        break;
      case 'leafCrown':
        for (var i = 0; i < 6; i++) { g.px(10 + i * 2, 5 - (i % 2), hc); g.px(11 + i * 2, 5, sh(hc, 0.3)); }
        g.px(16, 3, GOLD); g.px(16, 4, GOLD);
        break;
    }

    // ── 무기 ──
    if (L.weapon === 'sword') {
      var bl = L.blade || METAL;
      if (L.bladeGlow) { g.vline(23, 7, 19, L.bladeGlow); g.vline(26, 7, 19, L.bladeGlow); g.px(24, 5, L.bladeGlow); }
      g.vline(24, 7, 19, bl); g.vline(25, 7, 19, sh(bl, -0.15)); g.px(24, 6, bl);
      g.hline(22, 27, 20, ch.grade === 'normal' ? '#a0794a' : GOLD);
      g.rect(24, 21, 2, 2, '#7a4a2a');
    } else if (L.weapon === 'bow') {
      var bc = L.bowColor || '#a0693a';
      g.line(23, 10, 26, 13, bc); g.line(26, 13, 26, 19, bc); g.line(26, 19, 23, 22, bc); g.px(27, 15, bc); g.px(27, 16, bc); g.px(27, 17, bc);
      g.vline(23, 11, 21, '#f3efe6');
      g.hline(19, 28, 16, '#8a5a32'); g.px(29, 16, '#cfd6de'); g.px(28, 15, '#cfd6de'); g.px(28, 17, '#cfd6de');
      if (L.bowGem) { g.px(27, 16, L.bowGem); }
    } else if (L.weapon === 'staff') {
      g.vline(24, 7, 26, '#8a5a32'); g.vline(25, 9, 26, '#6b4426');
      g.ellipse(24.5, 5, 2.6, 2.6, L.orb || '#7fe3ff'); g.px(24, 4, WHITE);
      if (ch.grade !== 'normal') { g.px(22, 5, sh(L.orb, -0.2)); g.px(27, 5, sh(L.orb, -0.2)); }
    } else if (L.weapon === 'shield') {
      // 오른손에 작은 칼
      g.vline(24, 12, 19, METAL); g.vline(25, 12, 19, sh(METAL, -0.15)); g.hline(23, 26, 20, '#a0794a'); g.rect(24, 21, 2, 1, '#7a4a2a');
      // 왼손에 방패
      var sc = L.shieldColor;
      g.rect(5, 16, 7, 7, sc); g.rect(6, 23, 5, 1, sc); g.rect(7, 24, 3, 1, sc);
      g.hline(5, 11, 16, sh(sc, 0.35)); g.vline(5, 16, 22, sh(sc, 0.35));
      if (L.shieldStar) { g.px(8, 18, GOLD); g.rect(7, 19, 3, 1, GOLD); g.px(8, 20, GOLD); g.px(7, 21, GOLD); g.px(9, 21, GOLD); }
      else { g.vline(8, 17, 23, sh(sc, -0.25)); }
    } else if (L.weapon === 'pompom') {
      // 양손에 응원 술
      [[6, 19], [26, 19]].forEach(function (c, k) {
        g.ellipse(c[0], c[1], 3.6, 3.4, k ? '#ffd23f' : '#ff5a7a');
        g.px(c[0] - 2, c[1] - 2, '#ffffff'); g.px(c[0] + 1, c[1] + 2, k ? '#e8a21b' : '#c0392b');
      });
    } else if (L.weapon === 'bigShield') {
      var bs = L.shieldColor;
      g.rect(3, 13, 10, 12, bs); g.rect(4, 25, 8, 1, bs); g.rect(6, 26, 4, 1, bs);
      g.hline(3, 12, 13, sh(bs, 0.4)); g.vline(3, 13, 24, sh(bs, 0.4));
      g.rect(7, 15, 2, 8, '#ffffff'); g.rect(5, 18, 6, 2, '#ffffff');
      g.vline(24, 12, 19, METAL); g.vline(25, 12, 19, sh(METAL, -0.15)); g.hline(23, 26, 20, '#a0794a');
    } else if (L.weapon === 'ladle') {
      g.vline(24, 8, 21, '#c9a05a'); g.vline(25, 9, 21, '#a7764a');
      g.ellipse(24.5, 6, 3, 2.4, METAL); g.hline(22, 27, 5, sh(METAL, 0.2)); g.px(24, 6, '#8fd0f5');
    } else if (L.weapon === 'fishbun') {
      g.ellipse(25, 18, 4, 2.6, '#e0a24a'); g.px(28, 16, '#e0a24a'); g.px(28, 20, '#e0a24a'); g.px(29, 17, '#e0a24a'); g.px(29, 19, '#e0a24a');
      g.px(22, 17, EYE); g.hline(23, 27, 19, '#b5762a'); g.px(24, 17, '#f6d37a');
    } else if (L.weapon === 'cotton') {
      g.vline(24, 12, 22, '#f2f2f2'); g.ellipse(24.5, 8, 3.8, 3.6, '#ffb3d9'); g.px(23, 7, '#ffe0f0'); g.px(26, 9, '#e07bb0');
    }

    if (L.extra === 'dragon') {
      var dc = '#ff8a3d';
      g.ellipse(5, 24, 3.2, 2.6, dc); g.ellipse(3.5, 20.5, 2.4, 2.2, dc);
      g.px(2, 20, EYE); g.px(4, 18, '#ffe066'); g.px(2, 18, '#ffe066'); g.px(8, 22, '#ffb36b'); g.px(9, 21, '#ffb36b');
      g.px(6, 26, sh(dc, -0.2)); g.px(4, 26, sh(dc, -0.2)); g.px(5, 24, '#ffd2a8');
    }

    g.outline();
    if (grade === 'legendary') { g.px(2, 3, GOLD); g.px(29, 6, '#bfffb0'); g.px(28, 26, GOLD); g.px(1, 13, '#bfffb0'); }
    return g.toCanvas();
  }

  function sprite(charId) {
    var ch = G.charById(charId);
    return P.get('캐릭터/' + charId, function () { return make(ch); });
  }

  // 아직 발견하지 못한 캐릭터: 검은 그림자
  function shadow(charId) {
    return P.get('그림자/' + charId, function () {
      // 교체 그림 파일 대신 내장 그림으로 그림자를 만든다 (파일로 직접 열었을 때 브라우저 보안 제한 방지)
      var src = make(G.charById(charId)), c = document.createElement('canvas');
      c.width = src.width; c.height = src.height;
      var x = c.getContext('2d'); x.drawImage(src, 0, 0);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = '#4b4560'; x.fillRect(0, 0, c.width, c.height);
      return c;
    });
  }

  function overrideList() {
    return G.CHARACTERS.map(function (c) { return { key: '캐릭터/' + c.id, src: 'assets/캐릭터/' + c.id + '.png' }; });
  }

  return { sprite: sprite, shadow: shadow, overrideList: overrideList };
})();
