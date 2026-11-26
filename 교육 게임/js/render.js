/* 전투 화면 그리기 (field 캔버스). 배경은 스테이지마다 한 번만 bg 캔버스에 그린다. */
var G = globalThis.G || (globalThis.G = {});

G.Render = (function () {
  var bg, fg, bctx, ctx, darkCanvas = null, tintCanvas = null;
  var SHOT_COLOR = { sword: '#ffffff', archer: '#8a5a32', mage: '#7fe3ff', knight: '#c9a05a', chef: '#ffd23f', ice: '#bdf3ff', hero: '#ffe27a' };

  function init() {
    bg = document.getElementById('bg'); fg = document.getElementById('field');
    bctx = bg.getContext('2d'); ctx = fg.getContext('2d');
  }
  // L: { paths, slots, hero } (전투 B 도 같은 이름을 갖고 있다)
  function drawBackground(stageNo, L) {
    bctx.clearRect(0, 0, 960, 540);
    G.MapArt.draw(bctx, stageNo, { paths: L.paths, slots: L.slots, hero: L.hero !== undefined ? L.hero : L.heroPos, diff: L.diff });
  }
  function clear() { ctx.clearRect(0, 0, 960, 540); }

  function heroSprite(id, x, y, t, cast) {
    var jump = cast > 0 ? -8 : Math.sin(t * 2.4) * 2;
    if (cast > 0) { ctx.fillStyle = 'rgba(255,226,122,.55)'; ctx.beginPath(); ctx.arc(x, y - 30, 40, 0, Math.PI * 2); ctx.fill(); }
    G.Pixel.drawSprite(ctx, G.CharArt.sprite(id), x, y + 4 + jump, 72, false);
  }

  // 준비 시간에도 출전 칸 친구들과 영웅이 보이도록
  function drawUnits(L, lineup, heroId, t, selected) {
    L.slots.forEach(function (s, i) {
      if (selected === i) {
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(s.x, s.y, 44, 18, 0, 0, Math.PI * 2); ctx.stroke();
      }
      var id = lineup[i]; if (!id) return;
      G.Pixel.drawSprite(ctx, G.CharArt.sprite(id), s.x, s.y + 4 + Math.sin(t * 3 + i) * 2, 64, false);
    });
    if (heroId) heroSprite(heroId, L.heroPos.x, L.heroPos.y, t, 0);
  }

  function frame(B, t) {
    clear();
    // 느림 구역
    B.zones.forEach(function (z) {
      var a = 1 - z.t / z.life;
      ctx.fillStyle = 'rgba(127,119,221,' + (0.28 * a + 0.1) + ')'; ctx.strokeStyle = 'rgba(206,203,246,' + (0.8 * a) + ')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 30; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff'; ctx.font = '26px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⏳', z.x, z.y + 9);
    });
    // 길막기 방패
    B.barriers.forEach(function (b) {
      var blink = b.life - b.t < 1.2 && Math.floor(t * 8) % 2;
      if (blink) return;
      ctx.fillStyle = '#3aa0f0'; ctx.strokeStyle = '#3a2a3f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(b.x - 26, b.y - 40); ctx.lineTo(b.x + 26, b.y - 40); ctx.lineTo(b.x + 26, b.y - 10); ctx.lineTo(b.x, b.y + 8); ctx.lineTo(b.x - 26, b.y - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 3, b.y - 34, 6, 30); ctx.fillRect(b.x - 13, b.y - 24, 26, 6);
    });
    // 보스 공격 예고: 빨간 원이 점점 차오르고, 다 차면 떨어진다
    B.hazards.forEach(function (z) {
      var k = Math.min(1, z.t / z.warn);
      ctx.fillStyle = 'rgba(226,75,74,.18)'; ctx.strokeStyle = '#e24b4a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(226,75,74,.45)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = '26px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', z.x, z.y + 9);
    });
    // 적 (y 순서)
    var list = B.enemies.slice().sort(function (a, b) { return G.Battle.pos(B, a).y - G.Battle.pos(B, b).y; });
    list.forEach(function (e) {
      var p = G.Battle.pos(B, e), hop = e.blocked ? 0 : Math.abs(Math.sin(t * 8 + e.bob)) * 4;
      ctx.fillStyle = 'rgba(58,42,63,.22)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (e.turbo) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y - 20, 24, 0, Math.PI * 2); ctx.stroke(); }
      // 느려지거나 얼면 몸 색이 파랗게 바뀐다 (얼면 더 밝은 얼음색). 따로 글자나 효과는 넣지 않는다.
      // 그림을 따로 그린 뒤 그 위에만 파란색을 덧칠한다 (원래 색과 상관없이 확실히 파랗게)
      var MB = G.CONFIG.midBoss, big = e.mid ? 44 * (MB ? MB.size : 3) : e.trait === 'tank' ? 52 : 44;
      if (e.mid) { ctx.fillStyle = 'rgba(226,75,74,.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 56, 16, 0, 0, Math.PI * 2); ctx.fill(); }
      if (e.trait === 'fast' && !e.blocked && !(e.stunT > 0)) {   // 빠른 적: 뒤에 바람 줄
        var back = p.dx < 0 ? 1 : -1; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
        for (var wl = 0; wl < 3; wl++) { var ly = p.y - 12 - wl * 10, lx = p.x + back * (22 + (t * 90 + wl * 9) % 10); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + back * 16, ly); ctx.stroke(); }
      }
      var spr = G.EnemyArt.sprite(e.type, (e.boss || e.mini || e.mid) ? 0 : e.id % 3), sx = p.x, sy = p.y - hop + (e.boss ? 18 : e.mini ? 10 : e.mid ? 14 : 0), size = e.boss ? 124 : e.mini ? 84 : big;
      var tint = e.hit > 0 ? null : (!e.boss && e.stunT > 0 && e.stunKind === 'ice') ? 'rgba(150,215,255,.78)' : (e.slowT > 0 || e.zoneSlow < 1) ? 'rgba(40,120,255,.62)' : null;
      if (tint) {
        if (!tintCanvas) { tintCanvas = document.createElement('canvas'); tintCanvas.width = 200; tintCanvas.height = 200; }   // 중간 보스(132)도 들어간다
        var tc = tintCanvas.getContext('2d');
        tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, 200, 200);
        G.Pixel.drawSprite(tc, spr, 100, 180, size, p.dx < 0);
        tc.globalCompositeOperation = 'source-atop'; tc.fillStyle = tint; tc.fillRect(0, 0, 200, 200);
        ctx.drawImage(tintCanvas, sx - 100, sy - 180);
      } else {
        ctx.save();
        if (e.hit > 0) ctx.filter = 'brightness(1.8)';
        G.Pixel.drawSprite(ctx, spr, sx, sy, size, p.dx < 0);
        ctx.restore();
      }
      if (!e.boss && e.stunT > 0) {   // 자동 능력: 경직이면 노란 별 (얼림은 색으로만)
        if (e.stunKind !== 'ice') { ctx.fillStyle = '#ffd23f'; ctx.font = '14px Jua, sans-serif'; ctx.textAlign = 'center'; for (var sq = 0; sq < 2; sq++) ctx.fillText('★', p.x + Math.cos(t * 7 + sq * 3.1) * 14, p.y - 50 + Math.sin(t * 7 + sq * 3.1) * 4); }
      }
      if (e.boss) {
        if (e.stunT > 0) { ctx.fillStyle = '#ffd23f'; ctx.font = '24px Jua, sans-serif'; ctx.textAlign = 'center'; for (var q = 0; q < 3; q++) ctx.fillText('★', p.x + Math.cos(t * 5 + q * 2.1) * 40, p.y - 108 + Math.sin(t * 5 + q * 2.1) * 10); }
        if (B.bossType === 'octopus') {   // 아직 남은 다리 수만큼 분홍 동그라미
          var left = B.legs.filter(function (l) { return !l.cut; }).length;
          for (var lg = 0; lg < left; lg++) { var a = Math.PI * (0.15 + 0.7 * lg / 7); ctx.fillStyle = '#ed93b1'; ctx.strokeStyle = '#3a2a3f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 70, p.y - 10 + Math.sin(a) * 26, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        }
        return;
      }
      if (e.shield > 0) {   // 방어막 (해파리는 거품, 다른 적은 노란 방어막)
        var bubbleOne = e.type === 'jellyfish';
        ctx.fillStyle = bubbleOne ? 'rgba(191,230,255,.35)' : 'rgba(255,226,122,.28)'; ctx.strokeStyle = bubbleOne ? 'rgba(255,255,255,.9)' : 'rgba(255,200,60,.95)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y - 22, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x - 10, p.y - 34, 4, 0, Math.PI * 2); ctx.fill();
        for (var k = 0; k < e.shield; k++) { ctx.fillStyle = '#7fd3ff'; ctx.beginPath(); ctx.arc(p.x - 8 + k * 8, p.y - 56, 3, 0, Math.PI * 2); ctx.fill(); }
      } else {
        var w = e.mini ? 70 : e.mid ? 100 : e.trait === 'tank' ? 42 : 34, f = Math.max(0, e.hp / e.maxHp), by = e.mini ? p.y - 86 : e.mid ? p.y - 140 : e.trait === 'tank' ? p.y - 62 : p.y - 54;   // 작은 보스·중간 보스는 막대가 길다
        if (e.mid) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#3a2a3f'; ctx.lineWidth = 4; ctx.font = '18px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.strokeText('중간 보스', p.x, by - 6); ctx.fillText('중간 보스', p.x, by - 6); }
        ctx.fillStyle = '#3a2a3f'; ctx.fillRect(p.x - w / 2 - 2, by, w + 4, 8);
        ctx.fillStyle = f > 0.5 ? '#6fdc73' : f > 0.25 ? '#ffc04d' : '#ff6b6b'; ctx.fillRect(p.x - w / 2, by + 2, w * f, 4);
      }
    });
    // 친구들
    if (B.drag) {   // 친구를 끌고 있으면 놓을 수 있는 칸을 보여 준다
      B.slots.forEach(function (sl, i) {
        var on = B.drag.over === i;
        ctx.strokeStyle = on ? '#ffd23f' : 'rgba(255,255,255,.7)'; ctx.lineWidth = on ? 6 : 3; ctx.setLineDash(on ? [] : [8, 6]);
        ctx.beginPath(); ctx.ellipse(sl.x, sl.y, 44, 18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      });
    }
    B.units.forEach(function (u) {
      if (B.drag && B.drag.slot === u.slot) { ctx.globalAlpha = 0.35; G.Pixel.drawSprite(ctx, G.CharArt.sprite(u.id), u.x, u.y + 4, 64, false); ctx.globalAlpha = 1; return; }
      if (u.eaten > 0) {   // 마왕에게 삼켜짐
        ctx.fillStyle = 'rgba(90,42,142,.5)'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 36, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = '18px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('꿀꺽! ' + Math.ceil(u.eaten), u.x, u.y - 10);
        return;
      }
      var jump = u.flash > 0 ? -4 : Math.sin(t * 3 + u.slot) * 2;
      if (B.cheerT > 0) { ctx.fillStyle = 'rgba(255,90,122,.25)'; ctx.beginPath(); ctx.arc(u.x, u.y - 28, 34, 0, Math.PI * 2); ctx.fill(); }
      if (u.rapid) { ctx.strokeStyle = 'rgba(255,154,31,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(u.x, u.y - 28, 36 + Math.sin(t * 20) * 3, 0, Math.PI * 2); ctx.stroke(); }   // 연사 모드
      G.Pixel.drawSprite(ctx, G.CharArt.sprite(u.id), u.x, u.y + 4 + (u.frozen > 0 ? 0 : jump), 64, false);
      if (u.frozen > 0) {
        ctx.fillStyle = 'rgba(191,230,255,.6)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.fillRect(u.x - 28, u.y - 62, 56, 66); ctx.strokeRect(u.x - 28, u.y - 62, 56, 66);
      }
      if (B.cheerT > 0) { ctx.fillStyle = '#ff5a7a'; ctx.font = '18px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▲', u.x + 26, u.y - 56 + Math.sin(t * 6) * 3); }
    });
    if (B.drag && B.drag.id) G.Pixel.drawSprite(ctx, G.CharArt.sprite(B.drag.id), B.drag.x, B.drag.y + 30, 76, false);   // 손가락 밑의 친구
    if (B.hero) {
      if (B.bossPhase && B.hero.tx !== undefined && Math.hypot(B.hero.tx - B.hero.x, B.hero.ty - B.hero.y) > 6) {
        ctx.strokeStyle = 'rgba(255,226,122,.9)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(B.hero.x, B.hero.y); ctx.lineTo(B.hero.tx, B.hero.ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(B.hero.tx, B.hero.ty, 10, 0, Math.PI * 2); ctx.stroke();
      }
      if (B.bossPhase) { ctx.fillStyle = 'rgba(255,226,122,.55)'; ctx.beginPath(); ctx.ellipse(B.hero.x, B.hero.y + 2, 30, 11, 0, 0, Math.PI * 2); ctx.fill(); }
      heroSprite(B.hero.id, B.hero.x, B.hero.y, t, B.hero.cast);
      if (B.hero.stunT > 0) { ctx.fillStyle = '#ffd23f'; ctx.font = '20px Jua, sans-serif'; ctx.textAlign = 'center'; for (var hs = 0; hs < 3; hs++) ctx.fillText('★', B.hero.x + Math.cos(t * 6 + hs * 2.1) * 24, B.hero.y - 80 + Math.sin(t * 6 + hs * 2.1) * 6); }
    }
    // 공격
    B.shots.forEach(function (s) {
      var k = s.t / s.life, x = s.x + (s.tx - s.x) * k, y = s.y + (s.ty - s.y) * k;
      ctx.fillStyle = SHOT_COLOR[s.job] || '#fff'; ctx.strokeStyle = '#3a2a3f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, s.job === 'mage' || s.job === 'hero' ? 8 : 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    // 효과
    B.fx.forEach(function (f) {
      var k = Math.max(0, f.t) / f.life;
      if (f.t < 0) return;
      if (f.kind === 'pop' || f.kind === 'bubblePop') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = f.kind === 'pop' ? '#fff3a8' : '#bfe6ff';
        for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 26 * k, f.y - 20 + Math.sin(a) * 26 * k, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
      } else if (f.kind === 'boom') {
        ctx.globalAlpha = 0.6 * (1 - k); ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(f.x, f.y - 14, f.r * (0.4 + 0.6 * k), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (f.kind === 'arrows') {
        ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 3;
        for (var j = 0; j < 14; j++) {
          var ax = f.x + Math.cos(j * 2.4) * f.r * ((j % 5) / 5), ay = f.y + Math.sin(j * 2.4) * f.r * 0.6 * ((j % 5) / 5), drop = (1 - k) * 160;
          ctx.beginPath(); ctx.moveTo(ax - 8, ay - drop - 26); ctx.lineTo(ax, ay - drop); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(224,96,58,' + (1 - k) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (f.kind === 'meteor') {
        var mx = f.x + (1 - k) * 160, my = f.y - 20 - (1 - k) * 360;
        if (k < 0.85) {
          ctx.strokeStyle = 'rgba(255,176,46,.8)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(mx + 40, my - 80); ctx.lineTo(mx, my); ctx.stroke();
          ctx.fillStyle = '#ff6b3a'; ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(mx - 3, my - 3, 6, 0, Math.PI * 2); ctx.fill();
        } else { ctx.fillStyle = 'rgba(255,176,46,.7)'; ctx.beginPath(); ctx.arc(f.x, f.y - 14, 40, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'flash') {
        ctx.fillStyle = 'rgba(255,120,60,' + 0.35 * (1 - k) + ')'; ctx.fillRect(0, 0, 960, 540);
      } else if (f.kind === 'cheer') {
        ctx.strokeStyle = 'rgba(255,90,122,' + (1 - k) + ')'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(f.x, f.y - 30, 40 + k * 500, 0, Math.PI * 2); ctx.stroke();
      } else if (f.kind === 'impact') {
        ctx.fillStyle = 'rgba(226,75,74,' + 0.6 * (1 - k) + ')'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 + k * 0.4), 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'slash') {   // 레전더리 검사: 주위 베기
        ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(f.x, f.y - 16, f.r * (0.5 + 0.5 * k), 0, Math.PI * 1.6); ctx.stroke();
      } else if (f.kind === 'word') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ff9a1f'; ctx.strokeStyle = '#3a2a3f'; ctx.lineWidth = 3; ctx.font = '18px Jua, sans-serif'; ctx.textAlign = 'center';
        ctx.strokeText(f.text, f.x, f.y - k * 14); ctx.fillText(f.text, f.x, f.y - k * 14); ctx.globalAlpha = 1;
      } else if (f.kind === 'crit') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ff5a3a'; ctx.font = '18px Jua, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('치명타!', f.x, f.y - k * 16); ctx.globalAlpha = 1;
      } else if (f.kind === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,' + 0.6 * (1 - k) + ')';
        for (var n = 0; n < 60; n++) ctx.fillRect((n * 97 + k * 400) % 960, (n * 53 + k * 300) % 540, 5, 5);
      }
    });
    // 모래폭풍
    if (B.stormT > 0) {
      ctx.fillStyle = 'rgba(232,199,122,' + Math.min(0.55, B.stormT * 0.3) + ')'; ctx.fillRect(0, 0, 960, 540);
      ctx.strokeStyle = 'rgba(181,118,42,.5)'; ctx.lineWidth = 3;
      for (var m = 0; m < 30; m++) { var sx = (m * 131 + t * 600) % 1000 - 20, sy = (m * 47) % 540; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 40, sy - 4); ctx.stroke(); }
    }
    // 어둠: 친구들 둘레만 밝다. 따로 그린 어둠 판에 구멍을 낸 다음 위에 얹는다 (그래야 친구 그림이 지워지지 않는다)
    if (G.Battle.isDark(B)) {
      if (!darkCanvas) { darkCanvas = document.createElement('canvas'); darkCanvas.width = 960; darkCanvas.height = 540; }
      var d = darkCanvas.getContext('2d');
      d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, 960, 540);
      d.fillStyle = 'rgba(10,6,30,.72)'; d.fillRect(0, 0, 960, 540);
      d.globalCompositeOperation = 'destination-out';
      B.units.concat(B.hero ? [B.hero] : []).forEach(function (u) {
        var g = d.createRadialGradient(u.x, u.y - 20, 30, u.x, u.y - 20, 170);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = g; d.beginPath(); d.arc(u.x, u.y - 20, 170, 0, Math.PI * 2); d.fill();
      });
      ctx.drawImage(darkCanvas, 0, 0);
    }
    // 재앙: 불씨가 천천히 떠오른다
    if (B.diff && B.diff.key === 'disaster') {
      for (var em = 0; em < 26; em++) {
        var ey = 540 - ((em * 83 + t * (18 + em % 5 * 6)) % 600), ex = (em * 157) % 960 + Math.sin(t * 1.3 + em) * 14;
        ctx.fillStyle = em % 3 ? 'rgba(255,110,60,.75)' : 'rgba(255,210,120,.85)'; ctx.fillRect(ex, ey, em % 4 ? 3 : 4, em % 4 ? 3 : 4);
      }
    }
  }
  return { init: init, drawBackground: drawBackground, frame: frame, drawUnits: drawUnits, clear: clear };
})();
