/* 자동 전투 (기획서 8·9·11·12장)
 * 화면 그리기와 완전히 분리된 계산 부분이다.
 * update(state, dt)를 부르지 않으면 이동·공격·대기 시간·무리 진행·애니메이션 시간이 모두 멈춘다.
 * → 멈춤 버튼은 update 호출 자체를 막는다. 그림도 state.time(전투 시간)으로만 움직인다.
 */
var G = globalThis.G || (globalThis.G = {});

G.Battle = (function () {
  var W = 960, H = 540;
  var DEFENSE_X = 70, SPAWN_X = W + 30;
  var LANES = [215, 280, 345, 410];
  var FRONT_X = [300, 250], BACK_X = [175, 125];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // 무리 구성 만들기
  function buildWave(stageIdx, waveIdx, level) {
    var C = G.CONFIG, st = C.stages[stageIdx], wv = C.wave, dm = G.difficulty(level).monster;
    var isBossWave = waveIdx === st.waves - 1;
    var count = Math.round(wv.base + (waveIdx + 1) * wv.perWave + stageIdx * wv.perStage) + (st.extra || 0);
    count = Math.min(count, wv.maxCount || 99);
    count = Math.max(1, Math.round(count * dm.count));   // 난이도: 몬스터 수
    if (isBossWave) count = Math.max(2, count - 2);
    var list = [];
    for (var i = 0; i < count; i++) list.push({ type: st.monsters[i % 2 === 0 ? 0 : 1], at: i * wv.spawnGap });
    // 같은 종류만 몰리지 않게 섞기
    list.forEach(function (m) { m.type = st.monsters[Math.random() < 0.5 ? 0 : 1]; });
    if (isBossWave) list.push({ type: st.boss, at: count * wv.spawnGap + 1.5, boss: true });
    return { list: list, isBossWave: isBossWave };
  }

  function makeMonster(stageIdx, waveIdx, type, level) {
    var C = G.CONFIG, st = C.stages[stageIdx], b = C.monsterBase, t = G.MONSTERS[type], dm = G.difficulty(level).monster;
    var waveBoost = 1 + 0.12 * waveIdx;
    var hp = b.hp * st.hp * t.hp * waveBoost, atk = b.atk * st.atk * t.atk * waveBoost;
    if (t.boss) { hp = b.hp * st.hp * C.wave.bossHpMult * t.hp; atk = b.atk * st.atk * C.wave.bossAtkMult * t.atk; }
    hp = Math.round(hp * dm.hp); atk = Math.round(atk * dm.atk);   // 난이도: 체력·공격력
    var lane = LANES[Math.floor(Math.random() * LANES.length)];
    if (t.boss) lane = (LANES[1] + LANES[2]) / 2;
    return { kind: 'mon', type: type, name: t.name, boss: !!t.boss, final: !!t.final, size: t.size,
             x: SPAWN_X + rnd(0, 20), y: lane + rnd(-8, 8), hp: hp, maxHp: hp, atk: atk,
             interval: b.interval * (t.boss ? (C.wave.bossInterval || 1.2) : 1), cd: rnd(0.3, 1), speed: b.speed * t.speed * dm.speed,
             hurt: 0, lunge: 0, bornAt: 0, walk: rnd(0, 6) };
  }

  function makeUnits(lineupIds) {
    var units = lineupIds.map(function (id) {
      var c = G.charById(id), s = G.unitStats(id);
      return { kind: 'unit', charId: id, job: c.job, grade: c.grade, atk: s.atk, hp: s.hp, maxHp: s.hp, interval: s.interval,
               range: s.range, melee: s.melee, splash: s.splash, cd: rnd(0.1, s.interval), down: 0, hurt: 0, lunge: 0, walk: rnd(0, 6), x: 0, y: 0 };
    });
    // 자동 배치: 기사 → 검사는 앞줄, 마법사·궁수는 뒷줄. 한 줄에 4명.
    var order = { knight: 0, sword: 1, mage: 2, archer: 3 };
    var melee = units.filter(function (u) { return u.melee; }).sort(function (a, b) { return order[a.job] - order[b.job]; });
    var ranged = units.filter(function (u) { return !u.melee; }).sort(function (a, b) { return order[a.job] - order[b.job]; });
    function place(list, cols) {
      list.forEach(function (u, i) {
        var col = Math.floor(i / LANES.length), row = i % LANES.length;
        u.homeX = cols[Math.min(col, cols.length - 1)] - (col >= cols.length ? 40 : 0);
        u.homeY = LANES[row] + (col % 2 ? 12 : 0);
        u.x = u.homeX - 140; u.y = u.homeY;   // 왼쪽에서 걸어 들어오며 시작
      });
    }
    place(melee, FRONT_X); place(ranged, BACK_X);
    return units;
  }

  function create(stageIdx, waveIdx, lineupIds, life, level) {
    var wave = buildWave(stageIdx, waveIdx, level);
    return { level: level, stageIdx: stageIdx, waveIdx: waveIdx, time: 0, life: life, units: makeUnits(lineupIds), monsters: [], projectiles: [], effects: [],
             queue: wave.list, isBossWave: wave.isBossWave, outcome: null, events: [], kills: 0, intro: 1.6 };
  }

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function radius(m) { return 16 * m.size; }

  function addEffect(s, e) { e.t0 = s.time; s.effects.push(e); }
  function damageMonster(s, m, dmg) {
    if (m.hp <= 0) return;
    m.hp -= dmg; m.hurt = s.time;
    addEffect(s, { type: 'num', x: m.x + rnd(-6, 6), y: m.y - 30 * m.size, text: String(dmg), color: '#ffffff', ttl: 0.7 });
    if (m.hp <= 0) {
      s.kills++;
      addEffect(s, { type: 'poof', x: m.x, y: m.y - 12 * m.size, size: m.size, ttl: 0.5 });
      s.events.push(m.boss ? 'bossDown' : 'kill');
    } else s.events.push('hit');
  }

  function update(s, dt) {
    if (s.outcome) return;
    s.time += dt;
    var C = G.CONFIG;

    // 들어오는 연출 동안에는 우리 캐릭터만 자리로 걸어간다
    if (s.intro > 0) {
      s.intro -= dt;
      s.units.forEach(function (u) { moveTo(u, u.homeX, u.homeY, 120 * dt); });
      return;
    }
    var t = s.time - 0; // 무리 시간
    if (s.waveTime === undefined) s.waveTime = 0;
    s.waveTime += dt;

    // 몬스터 등장
    while (s.queue.length && s.queue[0].at <= s.waveTime) {
      var q = s.queue.shift();
      var m = makeMonster(s.stageIdx, s.waveIdx, q.type, s.level);
      m.bornAt = s.time;
      s.monsters.push(m);
      s.events.push(m.boss ? 'boss' : 'spawn');
    }
    var alive = s.monsters.filter(function (m) { return m.hp > 0; });

    // 우리 캐릭터
    s.units.forEach(function (u) {
      if (u.down > 0) {
        u.down -= dt;
        if (u.down <= 0) { u.hp = Math.round(u.maxHp * 0.6); addEffect(s, { type: 'sparkle', x: u.x, y: u.y - 20, ttl: 0.6 }); }
        return;
      }
      u.cd -= dt;
      if (!alive.length) { moveTo(u, u.homeX, u.homeY, C.unitMoveSpeed * 0.8 * dt); return; }
      if (u.melee) {
        var tgt = null, best = 1e9;
        alive.forEach(function (m) { var d = dist(u, m); if (d < best) { best = d; tgt = m; } });
        var reach = u.range + radius(tgt);
        if (best <= reach) {
          if (u.cd <= 0) { u.cd = u.interval; u.lunge = s.time; damageMonster(s, tgt, u.atk); addEffect(s, { type: 'slash', x: tgt.x - 10, y: tgt.y - 14 * tgt.size, ttl: 0.25 }); }
        } else if (tgt.x - u.homeX < 260) {
          var tx = Math.min(tgt.x - reach + 6, u.homeX + 260);
          moveTo(u, tx, tgt.y, C.unitMoveSpeed * dt);
        } else moveTo(u, u.homeX, u.homeY, C.unitMoveSpeed * 0.8 * dt);
      } else {
        // 원거리: 방어선에 가장 가까운 적을 노린다
        var target = null;
        alive.forEach(function (m) { if (dist(u, m) <= u.range && (!target || m.x < target.x)) target = m; });
        moveTo(u, u.homeX, u.homeY, C.unitMoveSpeed * 0.8 * dt);
        if (target && u.cd <= 0) {
          u.cd = u.interval; u.lunge = s.time;
          s.projectiles.push({ kind: u.job === 'mage' ? 'magic' : 'arrow', grade: u.grade, x: u.x + 14, y: u.y - 22, target: target, dmg: u.atk, splash: u.splash,
                               speed: u.job === 'mage' ? 380 : 560, t0: s.time });
          s.events.push(u.job === 'mage' ? 'magic' : 'shoot');
        }
      }
    });

    // 날아가는 화살과 마법
    s.projectiles = s.projectiles.filter(function (p) {
      var tg = p.target;
      var tx = tg.x, ty = tg.y - 14 * tg.size;
      var dx = tx - p.x, dy = ty - p.y, d = Math.sqrt(dx * dx + dy * dy), step = p.speed * dt;
      if (d <= step || tg.hp <= 0) {
        if (tg.hp > 0 || p.splash) {
          if (p.splash) {
            addEffect(s, { type: 'boom', x: tx, y: ty, r: p.splash, ttl: 0.4, grade: p.grade });
            s.monsters.forEach(function (m) { if (m.hp > 0 && Math.hypot(m.x - tx, (m.y - 14 * m.size) - ty) <= p.splash + radius(m)) damageMonster(s, m, p.dmg); });
          } else damageMonster(s, tg, p.dmg);
        }
        return false;
      }
      p.x += dx / d * step; p.y += dy / d * step; p.ang = Math.atan2(dy, dx);
      return true;
    });

    // 몬스터
    alive.forEach(function (m) {
      m.cd -= dt;
      var blocker = null;
      s.units.forEach(function (u) {
        if (u.down > 0 || blocker) return;
        var dx = m.x - u.x, dy = Math.abs(m.y - u.y);
        if (dx > -8 && dx < radius(m) + 18 && dy < 20 + 10 * m.size) blocker = u;
      });
      if (blocker) {
        if (m.cd <= 0) {
          m.cd = m.interval; m.lunge = s.time;
          hitUnit(s, blocker, m.atk);
          s.events.push('ouch');
          // 우두머리: 땅을 쿵! 막고 있는 친구 주변의 친구들도 함께 맞는다
          if (m.boss && C.bossSlam) {
            var sl = C.bossSlam;
            addEffect(s, { type: 'quake', x: blocker.x, y: blocker.y, r: sl.radius, ttl: 0.45 });
            s.events.push('slam');
            s.units.forEach(function (u) {
              if (u === blocker || u.down > 0) return;
              if (Math.hypot(u.x - blocker.x, u.y - blocker.y) <= sl.radius) hitUnit(s, u, Math.round(m.atk * sl.ratio));
            });
          }
        }
      } else {
        m.x -= m.speed * dt;
        m.walk += dt;
      }
      // 방어선에 닿으면 생명력이 줄고 몬스터는 오른쪽으로 튕겨 나간다 (물리쳐야 끝난다)
      if (m.x <= DEFENSE_X) {
        s.life -= m.boss ? C.bossLifeDamage : 1;
        addEffect(s, { type: 'heart', x: DEFENSE_X + 10, y: m.y - 30, ttl: 0.9 });
        s.events.push('leak');
        m.x = SPAWN_X; m.y = LANES[Math.floor(Math.random() * LANES.length)];
        if (m.boss) m.y = (LANES[1] + LANES[2]) / 2;
      }
    });

    s.monsters = s.monsters.filter(function (m) { return m.hp > 0 || s.time - m.hurt < 0.01; });
    s.effects = s.effects.filter(function (e) { return s.time - e.t0 < e.ttl; });

    if (s.life <= 0) { s.life = 0; s.outcome = 'lose'; }
    else if (!s.queue.length && !s.monsters.some(function (m) { return m.hp > 0; })) s.outcome = 'win';
  }

  function hitUnit(s, u, dmg) {
    u.hp -= dmg; u.hurt = s.time;
    addEffect(s, { type: 'num', x: u.x, y: u.y - 40, text: String(dmg), color: '#ffd0d0', ttl: 0.6 });
    if (u.hp <= 0) { u.hp = 0; u.down = G.CONFIG.reviveSeconds; }
  }

  function moveTo(u, tx, ty, step) {
    var dx = tx - u.x, dy = ty - u.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.5) { u.moving = false; return; }
    u.moving = true; u.walk += step / 60;
    if (d <= step) { u.x = tx; u.y = ty; } else { u.x += dx / d * step; u.y += dy / d * step; }
  }

  // 추천 전투력 (준비 화면 안내용): 무리의 총 체력과 공격력으로 계산
  function recommendedPower(stageIdx, waveIdx) {
    var w = buildWave(stageIdx, waveIdx), hp = 0, atk = 0;
    w.list.forEach(function (q) { var m = makeMonster(stageIdx, waveIdx, q.type); hp += m.hp; atk += m.atk; });
    return Math.round(hp * 0.3 + atk * 6);
  }

  return { create: create, update: update, buildWave: buildWave, recommendedPower: recommendedPower,
           W: W, H: H, DEFENSE_X: DEFENSE_X, LANES: LANES };
})();
