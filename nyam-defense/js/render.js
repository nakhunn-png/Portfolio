/* 전투 화면 그리기
 * 모든 움직임은 state.time(전투 시간)으로만 계산한다.
 * 멈춤 중에는 전투 시간이 흐르지 않으므로 그림도 완전히 멈춘다.
 */
var G = globalThis.G || (globalThis.G = {});

G.Render = (function () {
  var UNIT_H = 64;

  function background(ctx, stageIdx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(G.BgArt.background(stageIdx), 0, 0, 960, 540);
  }

  function defenseLine(ctx) {
    var x = G.Battle.DEFENSE_X;
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x - 3, 170, 6, 290);
    for (var y = 175; y < 460; y += 34) {
      ctx.fillStyle = '#3a2a3f'; ctx.fillRect(x - 26, y - 2, 28, 26);
      ctx.fillStyle = '#e8b878'; ctx.fillRect(x - 23, y + 1, 22, 20);
      ctx.fillStyle = '#c98a4a'; ctx.fillRect(x - 23, y + 15, 22, 6);
    }
    // 깃발
    ctx.fillStyle = '#3a2a3f'; ctx.fillRect(x - 14, 132, 4, 46);
    ctx.fillStyle = '#ff5a7a'; ctx.fillRect(x - 10, 134, 26, 16);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 2, 138, 8, 8);
  }

  function shadowEllipse(ctx, x, y, w, color) {
    ctx.fillStyle = color || 'rgba(40,30,50,.28)';
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  }
  function hpBar(ctx, x, y, w, ratio, col) {
    ctx.fillStyle = '#3a2a3f'; ctx.fillRect(x - w / 2 - 2, y - 2, w + 4, 8);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2, y, w, 4);
    ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, Math.max(0, w * ratio), 4);
  }

  function drawUnit(ctx, s, u) {
    var t = s.time, img = G.CharArt.sprite(u.charId), gr = G.grade(u.grade);
    var bob = u.moving ? -Math.abs(Math.sin(u.walk * 9)) * 5 : Math.sin(t * 3 + u.walk) * 1.5;
    var lunge = t - u.lunge < 0.14 ? 7 : 0;
    // 등급 색 발판 (색 + 모양으로 구분)
    shadowEllipse(ctx, u.x, u.y, 22);
    ctx.strokeStyle = gr.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(u.x, u.y, 20, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
    if (u.down > 0) {
      ctx.save(); ctx.globalAlpha = 0.55; ctx.translate(u.x, u.y - 8); ctx.rotate(-Math.PI / 2);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(img, -UNIT_H / 2, -UNIT_H / 2, UNIT_H, UNIT_H); ctx.restore();
      // 빙글빙글 별
      for (var i = 0; i < 3; i++) {
        var a = t * 3 + i * 2.1; star(ctx, u.x + Math.cos(a) * 16, u.y - 34 + Math.sin(a) * 5, 4, '#ffd23f');
      }
      // 다시 일어나는 시간 동그라미
      var r = 1 - u.down / G.CONFIG.reviveSeconds;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(u.x, u.y - 52, 9, -Math.PI / 2, -Math.PI / 2 + r * Math.PI * 2); ctx.stroke();
      return;
    }
    ctx.save();
    if (t - u.hurt < 0.12) ctx.filter = 'brightness(1.9)';
    G.Pixel.drawSprite(ctx, img, u.x + lunge, u.y + 2 + bob, UNIT_H);
    ctx.restore();
    if (u.grade === 'legendary' || u.grade === 'unique') {
      var k = Math.floor(t * 4 + u.walk) % 4;
      star(ctx, u.x - 22 + k * 3, u.y - 58 + (k % 2) * 4, 3, u.grade === 'legendary' ? '#bfffb0' : '#ffe27a');
    }
    if (u.hp < u.maxHp) hpBar(ctx, u.x, u.y - 70, 40, u.hp / u.maxHp, '#4cc35a');
  }

  function drawMonster(ctx, s, m) {
    var t = s.time, img = G.MonsterArt.sprite(m.type), h = 64 * m.size * (m.boss ? 1.25 : 1);
    var flyer = /bat|Bird|windSpirit|minion2/.test(m.type);
    var bounce = flyer ? Math.sin(t * 5 + m.walk) * 5 - 14 : -Math.abs(Math.sin(m.walk * 5)) * 4;
    var squash = 1 + (flyer ? 0 : Math.sin(m.walk * 10) * 0.04);
    var lunge = t - m.lunge < 0.14 ? -8 : 0;
    var appear = Math.min(1, (t - m.bornAt) / 0.3);
    shadowEllipse(ctx, m.x, m.y, 20 * m.size);
    if (m.hp <= 0) { return; }
    ctx.save();
    ctx.globalAlpha = appear;
    if (t - m.hurt < 0.1) ctx.filter = 'brightness(2)';
    ctx.translate(m.x + lunge, m.y + bounce);
    ctx.scale(1 / squash, squash);
    G.Pixel.drawSprite(ctx, img, 0, 2, h);
    ctx.restore();
    if (m.boss) {
      // 우두머리 왕관 표시 반짝임
      star(ctx, m.x + Math.sin(t * 2) * 20, m.y - h - 6, 5, '#ffd23f');
    } else hpBar(ctx, m.x, m.y - h - 8, 36, m.hp / m.maxHp, '#ff5a7a');
  }

  function star(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x - r / 2), Math.round(y - r * 1.5), r, r * 3);
    ctx.fillRect(Math.round(x - r * 1.5), Math.round(y - r / 2), r * 3, r);
  }

  function drawProjectile(ctx, s, p) {
    if (p.kind === 'arrow') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang || 0);
      ctx.fillStyle = '#3a2a3f'; ctx.fillRect(-14, -2, 22, 4);
      ctx.fillStyle = '#a0693a'; ctx.fillRect(-13, -1, 20, 2);
      ctx.fillStyle = '#dfe6ee'; ctx.fillRect(6, -3, 5, 6);
      ctx.fillStyle = '#ff8fb8'; ctx.fillRect(-15, -4, 4, 3); ctx.fillRect(-15, 1, 4, 3);
      ctx.restore();
    } else {
      var col = G.grade(p.grade).color, sz = 7 + Math.sin((s.time - p.t0) * 30) * 1.5;
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(p.x - sz - 6, p.y - 3, 8, 6);
      ctx.fillStyle = '#3a2a3f'; ctx.fillRect(p.x - sz - 2, p.y - sz - 2, sz * 2 + 4, sz * 2 + 4);
      ctx.fillStyle = col; ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x - sz + 2, p.y - sz + 2, 4, 4);
    }
  }

  function drawEffect(ctx, s, e) {
    var k = (s.time - e.t0) / e.ttl;
    ctx.save();
    switch (e.type) {
      case 'num':
        ctx.globalAlpha = 1 - k * k;
        ctx.font = '22px Jua, "Malgun Gothic", sans-serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = '#3a2a3f'; ctx.strokeText(e.text, e.x, e.y - k * 26);
        ctx.fillStyle = e.color; ctx.fillText(e.text, e.x, e.y - k * 26);
        break;
      case 'poof':
        for (var i = 0; i < 8; i++) {
          var a = i / 8 * Math.PI * 2, d = 8 + k * 30 * e.size;
          ctx.globalAlpha = 1 - k; ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe27a';
          ctx.fillRect(e.x + Math.cos(a) * d - 4, e.y + Math.sin(a) * d - 4, 8, 8);
        }
        break;
      case 'slash':
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(e.x, e.y, 16 + k * 6, -1.2, 1.0); ctx.stroke();
        break;
      case 'boom':
        ctx.globalAlpha = 0.7 * (1 - k); ctx.fillStyle = G.grade(e.grade).color;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1 - k; for (i = 0; i < 6; i++) { a = i + k * 3; star(ctx, e.x + Math.cos(a) * e.r * k, e.y + Math.sin(a) * e.r * k * 0.6, 3, '#ffffff'); }
        break;
      case 'heart':
        ctx.globalAlpha = 1 - k;
        ctx.drawImage(G.MiscArt.heart(true), e.x - 13, e.y - k * 30 - 12, 26, 24);
        ctx.font = '24px Jua, "Malgun Gothic", sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#3a2a3f'; ctx.fillStyle = '#ff5a7a';
        ctx.strokeText('-1', e.x + 18, e.y - k * 30 + 6); ctx.fillText('-1', e.x + 18, e.y - k * 30 + 6);
        break;
      case 'quake':
        ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = '#ff7a3a'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * (0.3 + k * 0.7), e.r * 0.32 * (0.3 + k * 0.7), 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffd34d'; for (i = 0; i < 6; i++) { a = i / 6 * Math.PI * 2; ctx.fillRect(e.x + Math.cos(a) * e.r * k - 3, e.y + Math.sin(a) * e.r * 0.32 * k - 10 * (1 - k) - 3, 6, 6); }
        break;
      case 'sparkle':
        ctx.globalAlpha = 1 - k; for (i = 0; i < 5; i++) star(ctx, e.x + Math.cos(i * 1.3) * 20 * k, e.y + Math.sin(i * 1.3) * 20 * k, 3, '#bfffb0');
        break;
    }
    ctx.restore();
  }

  function battle(ctx, s) {
    ctx.clearRect(0, 0, 960, 540);
    ctx.imageSmoothingEnabled = false;
    defenseLine(ctx);
    var list = s.units.concat(s.monsters).sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (o) { if (o.kind === 'unit') drawUnit(ctx, s, o); else drawMonster(ctx, s, o); });
    s.projectiles.forEach(function (p) { drawProjectile(ctx, s, p); });
    s.effects.forEach(function (e) { drawEffect(ctx, s, e); });
  }

  return { background: background, battle: battle };
})();
