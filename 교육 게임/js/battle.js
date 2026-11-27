/* 뺑뺑이 전투 계산 (PRD 4, 6-1, 7, 9, 18장)
 * 화면 그리기와 떨어진 순수 계산. step(dt) 의 dt 는 "게임 시간" 초 (배속이 이미 곱해진 값).
 * node 로 모의 전투를 돌려 배속별 시간을 잴 수 있다 (tests/check-speed.js).
 */
var G = globalThis.G || (globalThis.G = {});

G.Battle = (function () {
  var W = 960, H = 540;

  /* ───────── 길 ─────────
   * 점 목록(닫힌 고리)으로 만들고 누적 거리로 위치를 찾는다. */
  function makePath(points) {
    var acc = [0], len = 0;
    for (var i = 1; i <= points.length; i++) {
      var a = points[i - 1], b = points[i % points.length];
      len += Math.hypot(b.x - a.x, b.y - a.y); acc.push(len);
    }
    return {
      points: points, length: len,
      at: function (s) {
        s = ((s % len) + len) % len;
        var lo = 0, hi = acc.length - 1;
        while (lo < hi - 1) { var m = (lo + hi) >> 1; if (acc[m] <= s) lo = m; else hi = m; }
        var a = points[lo], b = points[(lo + 1) % points.length], seg = acc[lo + 1] - acc[lo] || 1, t = (s - acc[lo]) / seg;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y };
      }
    };
  }
  // 곧은 선을 잘게 나눈다 (모서리에서 적이 자연스럽게 돌도록)
  function dense(pts, step) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / (step || 20)));
      for (var k = 0; k < n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
    }
    return out;
  }
  function roundRect(x1, y1, x2, y2, r) {
    var pts = [];
    function arc(cx, cy, from) { for (var i = 0; i <= 8; i++) { var t = from + (Math.PI / 2) * i / 8; pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r }); } }
    // 왼쪽 위에서 시작해 시계 방향
    arc(x1 + r, y1 + r, Math.PI); arc(x2 - r, y1 + r, -Math.PI / 2); arc(x2 - r, y2 - r, 0); arc(x1 + r, y2 - r, Math.PI / 2);
    return pts;
  }
  function rowSlots(ys, xs) { var s = []; ys.forEach(function (y) { xs.forEach(function (x) { s.push({ x: x, y: y }); }); }); return s; }

  /* 길 모양 9가지 (지금은 일반 스테이지 6개). 각 모양은
   * paths: 길 목록 (갈림길은 2개), slots: 출전 칸 8개, hero: 영웅 자리, bubbles: 문제 풍선 자리, laps: 몇 바퀴 돌면 빠져나가나 */
  var LAYOUTS = {
    // 1 과자 숲: 동그란 길
    loop: function () {
      return { paths: [makePath(dense(roundRect(70, 92, 890, 470, 74), 24))], slots: rowSlots([232, 340], [300, 420, 540, 660]),
        hero: { x: 178, y: 300 }, bubbles: [{ x: 790, y: 230 }, { x: 790, y: 350 }], extra: { x: 480, y: 150 } };
    },
    // 2 바닷속: 8자 길 (두 원이 가운데에서 맞닿는다)
    eight: function () {
      var pts = [], r = 195, i, t;
      for (i = 0; i < 48; i++) { t = (i / 48) * Math.PI * 2; pts.push({ x: 285 + Math.cos(t) * r, y: 300 + Math.sin(t) * r }); }
      for (i = 0; i < 48; i++) { t = Math.PI - (i / 48) * Math.PI * 2; pts.push({ x: 675 + Math.cos(t) * r, y: 300 + Math.sin(t) * r }); }
      return { paths: [makePath(pts)], slots: [{ x: 235, y: 268 }, { x: 335, y: 268 }, { x: 235, y: 372 }, { x: 335, y: 372 }, { x: 625, y: 268 }, { x: 725, y: 268 }, { x: 625, y: 372 }, { x: 725, y: 372 }],
        hero: { x: 480, y: 150 }, bubbles: [{ x: 70, y: 112 }, { x: 890, y: 112 }], extra: { x: 720, y: 190 } };
    },
    // 4 눈나라: 윗변이 톱니처럼 지그재그
    zigzag: function () {
      return { paths: [makePath(dense([{ x: 70, y: 110 }, { x: 230, y: 200 }, { x: 390, y: 110 }, { x: 550, y: 200 }, { x: 710, y: 110 }, { x: 890, y: 200 }, { x: 890, y: 465 }, { x: 70, y: 465 }], 20))],
        slots: rowSlots([298, 400], [250, 390, 530, 670]), hero: { x: 150, y: 350 }, bubbles: [{ x: 795, y: 300 }, { x: 795, y: 390 }], extra: { x: 390, y: 220 } };
    },
    // 5 사막: 갈림길. 0번 길은 아래로 크게 돌고, 1번 길은 가운데로 질러간다
    fork: function () {
      var top = [{ x: 80, y: 290 }, { x: 80, y: 105 }, { x: 880, y: 105 }, { x: 880, y: 290 }];
      var A = makePath(dense(top.concat([{ x: 880, y: 465 }, { x: 80, y: 465 }]), 20));
      var B = makePath(dense(top, 20));
      return { paths: [A, B], slots: rowSlots([225, 420], [250, 390, 530, 670]), hero: { x: 160, y: 225 }, bubbles: [{ x: 790, y: 420 }], extra: { x: 760, y: 210 } };
    },
    // 7 우주 정거장: 바깥 고리 한 바퀴 → 안쪽 고리 한 바퀴 (왼쪽 다리로 갈아탄다)
    rings: function () {
      var pts = [], i, t;
      for (i = 0; i < 64; i++) { t = Math.PI + (i / 64) * Math.PI * 2; pts.push({ x: 480 + Math.cos(t) * 410, y: 290 + Math.sin(t) * 200 }); }
      pts = pts.concat(dense([{ x: 70, y: 290 }, { x: 250, y: 290 }], 20).slice(1));
      for (i = 0; i < 48; i++) { t = Math.PI - (i / 48) * Math.PI * 2; pts.push({ x: 480 + Math.cos(t) * 230, y: 290 + Math.sin(t) * 100 }); }
      pts = pts.concat(dense([{ x: 250, y: 290 }, { x: 70, y: 290 }], 20).slice(1, -1));
      return { paths: [makePath(pts)], laps: 1, slots: [{ x: 345, y: 315 }, { x: 440, y: 315 }, { x: 520, y: 315 }, { x: 615, y: 315 }, { x: 170, y: 230 }, { x: 170, y: 350 }, { x: 790, y: 230 }, { x: 790, y: 350 }],
        hero: { x: 480, y: 238 }, bubbles: [{ x: 480, y: 150 }], rings: true, extra: { x: 700, y: 190 } };
    },
    // 8 밤 놀이공원: 위아래가 출렁이는 롤러코스터 길
    coaster: function () {
      var base = dense(roundRect(70, 100, 890, 468, 74), 12);
      var pts = base.map(function (p) {
        if (p.y < 110 || p.y > 458) return { x: p.x, y: p.y + (p.y < 300 ? 1 : -1) * 24 * Math.sin((p.x - 144) / 46) };
        return p;
      });
      return { paths: [makePath(pts)], slots: rowSlots([245, 352], [300, 420, 540, 660]), hero: { x: 178, y: 305 }, bubbles: [{ x: 790, y: 240 }, { x: 790, y: 355 }], extra: { x: 660, y: 170 } };
    }
  };

  // ── 보스 스테이지 길 ──
  // 3 문어 대장: 소용돌이 바다의 큰 타원 길
  LAYOUTS.whirl = function () {
    var pts = [], i, t;
    for (i = 0; i < 72; i++) { t = Math.PI + (i / 72) * Math.PI * 2; pts.push({ x: 480 + Math.cos(t) * 400, y: 290 + Math.sin(t) * 195 }); }
    return { paths: [makePath(pts)], slots: rowSlots([232, 345], [300, 420, 540, 660]), hero: { x: 178, y: 290 }, bubbles: [{ x: 790, y: 232 }, { x: 790, y: 345 }], extra: { x: 480, y: 420 } };
  };
  // 6 전갈 왕: 모서리가 뾰족한 네모 경기장
  LAYOUTS.arena = function () {
    return { paths: [makePath(dense([{ x: 110, y: 100 }, { x: 850, y: 100 }, { x: 850, y: 468 }, { x: 110, y: 468 }], 20))],
      slots: rowSlots([232, 345], [300, 420, 540, 660]), hero: { x: 200, y: 290 }, bubbles: [{ x: 765, y: 232 }, { x: 765, y: 345 }], extra: { x: 210, y: 380 } };
  };
  // 9 냠냠 마왕: 별 모양 길 (꼭짓점 10개). 친구들은 별 안쪽과 뾰족한 끝 사이 빈 곳에 선다
  LAYOUTS.star = function () {
    var pts = [], k;
    for (k = 0; k < 10; k++) {
      var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 118 : 222;
      pts.push({ x: 480 + Math.cos(a) * r * 1.78, y: 292 + Math.sin(a) * r });
    }
    return { paths: [makePath(dense(pts, 18))],
      slots: [{ x: 400, y: 262 }, { x: 560, y: 262 }, { x: 394, y: 362 }, { x: 566, y: 362 }, { x: 236, y: 150 }, { x: 724, y: 150 }, { x: 175, y: 380 }, { x: 785, y: 380 }],
      hero: { x: 480, y: 318 }, bubbles: [{ x: 70, y: 112 }, { x: 890, y: 112 }], extra: { x: 150, y: 150 } };
  };

  // 옆 칸: 140 픽셀 안에 있는 칸
  function neighbors(slots, i) {
    var out = [];
    slots.forEach(function (s, j) { if (j !== i && Math.hypot(s.x - slots[i].x, s.y - slots[i].y) <= 140) out.push(j); });
    return out;
  }

  // 캐릭터 능력치: 직업 기본값 × 등급 배율 (테마가 맞으면 공격 +10%)
  /* 2026-11-27 상점 강화: shop = { sword: 단계, spear, bow, gun, mgun } (없으면 0). 이 등급 친구 공격력·모두의 공격 빠르기 */
  function shopLv(shop, key) { return (shop && shop[key]) || 0; }
  function shopItem(key) { var L = G.CONFIG.shop || []; for (var i = 0; i < L.length; i++) if (L[i].key === key) return L[i]; return null; }
  function shopAtk(shop, grade) {
    var key = grade === 'normal' ? 'sword' : grade === 'epic' ? 'spear' : 'bow', it = shopItem(key);
    return 1 + (it ? it.lvBonus.atk * shopLv(shop, key) : 0);
  }
  function shopSpeed(shop) { var it = shopItem('mgun'); return 1 + (it ? it.lvBonus.speed * shopLv(shop, 'mgun') : 0); }
  function heroStats(shop) {
    var H = G.CONFIG.heroAttack, it = shopItem('gun');
    return { atk: H.atk * (1 + (it ? it.lvBonus.atk * shopLv(shop, 'gun') : 0)), interval: H.interval / shopSpeed(shop), range: H.range };
  }
  function unitStats(charId, stageNo, shop) {
    var ch = G.charById(charId), job = G.CONFIG.jobs[ch.job], gm = G.gradeInfo(ch.grade).mult;
    var theme = ch.theme === stageNo ? 1.1 : 1;
    var s = {
      atk: job.atk * gm * theme * shopAtk(shop, ch.grade), interval: job.interval / shopSpeed(shop), range: job.range * (1 + (gm - 1) * 0.04),
      splash: job.splash || 0, push: job.push || 0, buff: job.buff || 0, slow: job.slow || 0, slowSec: job.slowSec || 0
    };
    // 자동 능력: 유니크부터
    var PV = G.CONFIG.passives, order = ['normal', 'epic', 'unique', 'legendary', 'hidden'], pv = PV && PV[ch.job];
    if (pv && order.indexOf(ch.grade) >= order.indexOf(PV.minGrade)) {
      var k = ch.grade === 'unique' ? 1 : PV.legendMul;
      s.passive = ch.job;
      if (pv.stun) s.stun = pv.stun * k;
      if (pv.crit) { s.crit = Math.min(0.6, pv.crit * k); s.critMul = pv.critMul; }
      if (pv.splashMul) s.splash *= pv.splashMul * (k > 1 ? 1.15 : 1);
      if (pv.pushMul) s.push *= pv.pushMul * k;
      if (pv.buffMul) s.buff *= pv.buffMul * k;
      if (pv.freeze) { s.freeze = Math.min(0.5, pv.freeze * k); s.freezeSec = pv.freezeSec; }
      // 레전더리·히든: 더 센 능력 (legend)
      var lg = ch.grade !== 'unique' && PV.legend && PV.legend[ch.job];
      if (lg) {
        s.legend = ch.job;
        if (lg.cleave) { s.cleave = lg.cleave; s.cleaveMul = lg.cleaveMul; }
        if (lg.crit) { s.crit = lg.crit; s.critMul = lg.critMul; }
        if (lg.rapidEvery) { s.rapidEvery = lg.rapidEvery; s.rapidDur = lg.rapidDur; s.rapidMul = lg.rapidMul; }
        if (lg.stun) s.stun = Math.max(s.stun || 0, lg.stun);
        if (lg.allBuff) s.allBuff = lg.allBuff;
        if (lg.freezeR) s.freezeR = lg.freezeR;
      }
    }
    return s;
  }

  /* ───────── 전투 하나 ───────── */
  /* opts: { extraSlot: 출전 칸 +1 (도감 20종 보상), tower: 도전의 탑 (기믹 없음, 스테이지 체력 배율 1) } */
  function create(stageNo, lineup, heroId, diffKey, opts) {
    opts = opts || {};
    var st = G.stageByNo(stageNo), C = G.CONFIG, L = (LAYOUTS[st.path] || LAYOUTS.loop)(), D = G.difficultyByKey(diffKey);
    var B = {
      stageNo: stageNo, gimmick: opts.tower ? null : (st.gimmick || null), tower: !!opts.tower, hpMul: opts.tower ? C.tower.hpMul : (st.minionHp || st.hp || 1),   // 보스 스테이지는 부하 체력을 따로 (minionHp)
      carry: !!opts.carry, carryMul: 1, shop: opts.shop || null, heroSt: heroStats(opts.shop),   // 친구 이어 가기 (데려온 친구가 센 만큼 적이 단단해진다)
      paths: L.paths, path: L.paths[0], slots: opts.extraSlot && L.extra ? L.slots.concat([L.extra]) : L.slots, heroPos: L.hero, bubbleSpots: L.bubbles, laps: L.laps || C.escapeLaps, rings: !!L.rings,
      time: 0, life: D.life, lifeLost: 0, diff: D, bossType: st.boss || null, bossPhase: false, boss: null,
      hazards: [], pips: 0, legs: [], legT: 0, combo: 0,
      units: [], enemies: [], shots: [], fx: [], delayed: [], zones: [], barriers: [],
      wave: 0, spawnLeft: 0, spawnGap: 1, spawnTimer: 0, waveRunning: false, nextId: 1,
      kills: 0, escaped: 0, turboCoins: 0, cheerT: 0, gimT: 0, forkDir: 0, stormT: 0, lightT: 0, heroHits: 0
    };
    if (heroId) {
      var H = G.CONFIG.heroes[heroId];
      B.hero = { id: heroId, x: L.hero.x, y: L.hero.y, cd: H.cd * 0.5, maxCd: H.cd, atkCd: 0, flash: 0, cast: 0 };
    }
    setLineup(B, lineup);
    return B;
  }
  // lineup: 길이 8 배열, 칸마다 캐릭터 id 또는 null
  function setLineup(B, lineup) {
    B.units = [];
    for (var i = 0; i < B.slots.length; i++) {
      if (!lineup[i]) continue;
      var s = unitStats(lineup[i], B.stageNo, B.shop);
      B.units.push({ slot: i, id: lineup[i], x: B.slots[i].x, y: B.slots[i].y, st: s, cd: Math.random() * s.interval, speedUp: 1, flash: 0, frozen: 0 });
    }
    applyBuffs(B);
  }
  // 요리사: 옆 칸 친구 공격 빠르게
  function applyBuffs(B) {
    B.units.forEach(function (u) { u.speedUp = 1; });
    B.units.forEach(function (u) { if (u.st.allBuff) B.units.forEach(function (v) { if (v !== u) v.speedUp += u.st.allBuff; }); });   // 레전더리 요리사: 모두 빠르게
    B.units.forEach(function (u) {
      if (!u.st.buff) return;
      neighbors(B.slots, u.slot).forEach(function (n) { B.units.forEach(function (v) { if (v.slot === n) v.speedUp += u.st.buff; }); });
    });
  }

  /* 2026-11-26 「강화하기」: 진 웨이브를 처음부터 다시 (생명을 채우고 적을 지운다. 뽑은 친구·코인은 그대로) */
  function rewindWave(B) {
    B.wave = Math.max(0, B.wave - 1); B.plannedReal = B.prevPlanned || 0;
    B.enemies = []; B.spawnLeft = 0; B.waveRunning = false; B.midPending = false;
    B.zones = []; B.barriers = []; B.hazards = []; B.delayed = []; B.shots = []; B.fx = []; B.drag = null;
    B.life = B.diff.life;
  }
  /* 2026-11-26 전투 중 끌어다 놓기: from 칸의 친구를 to 칸으로 (to 에 친구가 있으면 서로 바꾼다). 얼음·대기 시간은 그대로 */
  function moveUnit(B, from, to) {
    if (from === to || !B.slots[from] || !B.slots[to]) return false;
    var a = null, b = null;
    B.units.forEach(function (u) { if (u.slot === from) a = u; else if (u.slot === to) b = u; });
    if (!a || a.eaten > 0 || (b && b.eaten > 0)) return false;
    a.slot = to; a.x = B.slots[to].x; a.y = B.slots[to].y;
    if (b) { b.slot = from; b.x = B.slots[from].x; b.y = B.slots[from].y; }
    applyBuffs(B);
    return true;
  }
  // 게임 좌표에서 가장 가까운 칸 (dist 픽셀 안)
  function slotAt(B, x, y, dist) {
    var best = -1, bd = dist || 60;
    B.slots.forEach(function (s, i) { var d = Math.hypot(s.x - x, (s.y - 24) - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  /* 웨이브 시작. speed: 지금 배속 { v, count }, turbo: 늘어난 웨이브면 true (터보 적 섞기)
   * plannedReal: 웨이브마다 「적이 나오는 시간 ÷ 배속」을 더한 계획 실제 시간 (9-3 원칙 2 의 판단 기준) */
  function startWave(B, speed, turbo) {
    var C = G.CONFIG, w = C.wave, speedCount = speed.count;
    B.wave++;
    // 진행 정도 p (0 ~ 약 0.9): 웨이브 번호가 아니라 계획 시간으로 정한다. 배속이 빨라 웨이브가 많아져도 마지막 적의 세기는 같다
    var p = (B.plannedReal || 0) / C.battleTime.targetRealSec;
    B.progress = p;
    var wm = B.diff.tutorial && C.tutorialQuick ? C.tutorialQuick.waveMul : 1;   // 튜토리얼은 웨이브가 짧다
    B.prevPlanned = B.plannedReal || 0;   // 「강화하기」로 이 웨이브를 다시 할 때 되돌린다
    B.plannedReal = (B.plannedReal || 0) + C.battleTime.waveGameSec * wm * speedCount * w.spawnPortion / speed.v;
    var n = Math.max(3, Math.round((w.base + w.countGrowth * p) * speedCount * B.diff.count * wm));
    B.spawnLeft = n; B.spawnTotal = n;
    B.carryMul = carryMul(B, B.wave - 1);
    // 적이 많아진 만큼 웨이브도 길어진다 (적이 나오는 간격은 그대로)
    B.spawnGap = (C.battleTime.waveGameSec * wm * speedCount * w.spawnPortion) / n * (w.spawnGapMul || 1);
    B.spawnTimer = 0; B.waveRunning = true; B.turbo = !!turbo;
    if (B.gimmick === 'dark') B.lightT = 8;   // 웨이브가 시작할 때 잠깐 조명이 켜진다
    // 2026-11-26 중간 보스: 일반 스테이지의 마지막 웨이브에 큰 적 하나 (튜토리얼·보스 스테이지·탑은 없음)
    B.midPending = !!C.midBoss && !B.bossType && !B.tower && !B.diff.tutorial && !wantsAnotherWave(B.wave, B.plannedReal, speed);
  }
  /* 10-2. 도전의 탑 한 층: 웨이브 1개. 층이 오를수록 적이 많아지고 단단해진다. 5층마다 작은 보스가 함께 나온다 */
  function towerHpScale(floor) { var T = G.CONFIG.tower; return Math.pow(T.hpGrowth, floor - 1); }   // 층마다 hpGrowth 배
  function startTowerFloor(B, floor, speed) {
    var C = G.CONFIG, T = C.tower, w = C.wave;
    B.wave = floor; B.floor = floor;
    B.progress = (towerHpScale(floor) - 1) / w.hpGrowth;   // hpScale(B) 가 탑 체력 배율과 같아지도록 (능력 피해도 함께 세진다)
    var n = Math.round((T.base + T.countGrowth * (floor - 1)) * speed.count * B.diff.count);
    B.spawnLeft = n; B.spawnTotal = n;
    B.spawnGap = (T.spawnSec * speed.count) / n;
    B.spawnTimer = 0; B.waveRunning = true; B.turbo = false;
    if (floor % T.miniEvery === 0) {
      var type = T.miniBosses[(floor / T.miniEvery - 1) % T.miniBosses.length], hp = w.hp * B.hpMul * T.miniHp * B.diff.hp * hpScale(B);
      B.enemies.push({ id: B.nextId++, type: type, mini: true, pi: 0, hp: hp, maxHp: hp, s: 0, speed: w.speed * T.miniSpeed * B.diff.speed, slowT: 0, zoneSlow: 1, hit: 0, bob: 0, shield: 0 });
    }
  }
  function hpScale(B) { return (1 + G.CONFIG.wave.hpGrowth * (B.progress || 0)) * (B.carryMul || 1); }   // 친구 이어 가기 배율도 함께 (능력 피해도 같이 세진다)
  function teamPower(B) { return B.units.reduce(function (a, u) { return a + G.gradeInfo(G.charById(u.id).grade).mult; }, 0); }
  function carryMul(B, waveIdx) {
    var K = G.CONFIG.carry; if (!B.carry || !K) return 1;
    var exp = K.expect[Math.max(0, Math.min(K.expect.length - 1, waveIdx))];
    return Math.max(1, Math.min(K.max, Math.pow(teamPower(B) / exp, K.pow)));
  }

  function spawn(B, events) {
    var st = G.stageByNo(B.stageNo), w = G.CONFIG.wave;
    if (B.midPending && B.spawnTotal - B.spawnLeft >= Math.floor(B.spawnTotal * (G.CONFIG.midBoss.at || 0.6))) { B.midPending = false; spawnMid(B, st, events); B.spawnLeft--; return; }
    var type = st.enemies[(B.spawnTotal - B.spawnLeft) % st.enemies.length];
    if (B.progress >= 0.4 && Math.random() < 0.35) type = st.enemies[1] || type;
    var E = G.ENEMIES[type], hp = w.hp * E.hp * B.hpMul * B.diff.hp * hpScale(B);
    var turbo = B.turbo && Math.random() < 0.3;
    var pi = B.paths.length > 1 ? B.forkDir : 0;
    B.enemies.push({ id: B.nextId++, type: type, pi: pi, hp: hp, maxHp: hp, s: 0, speed: w.speed * E.speed * (st.speed || 1) * B.diff.speed, slowT: 0, zoneSlow: 1,
      turbo: turbo, hit: 0, bob: Math.random() * 6, shield: E.shield || 0, maxShield: E.shield || 0, trait: E.trait || null });
    B.spawnLeft--;
  }
  /* 중간 보스 (웨이브의 60% 쯤): 그 스테이지 첫 번째 적을 3배 크기로, 체력은 일반 적의 10배. 경직·얼림·밀기가 안 걸린다 */
  function spawnMid(B, st, events) {
    var M = G.CONFIG.midBoss, w = G.CONFIG.wave, type = st.enemies[0], E = G.ENEMIES[type];
    var hp = w.hp * E.hp * B.hpMul * B.diff.hp * hpScale(B) * M.hp;
    B.enemies.push({ id: B.nextId++, type: type, mid: true, pi: B.paths.length > 1 ? B.forkDir : 0, hp: hp, maxHp: hp, s: 0,
      speed: w.speed * M.speed * (st.speed || 1) * B.diff.speed, slowT: 0, zoneSlow: 1, hit: 0, bob: 0, shield: 0, maxShield: 0 });
    if (events) events.push({ type: 'gimmick', text: '중간 보스 등장!' });
  }

  function pos(B, e) { return B.paths[e.pi || 0].at(e.s); }

  function damage(B, e, amt, events, pierce) {
    if (e.hp <= 0) return;
    if (e.shield > 0 && !pierce) {   // 거품: 공격을 막고 터진다
      e.shield--; e.hit = 0.08;
      if (e.shield === 0) { var q = pos(B, e); B.fx.push({ kind: 'bubblePop', x: q.x, y: q.y, t: 0, life: 0.35 }); }
      return;
    }
    if (e.boss) {   // 문어 다리가 남아 있으면 덜 아프고, 기절해 있으면 더 아프다
      var BC = G.CONFIG.boss[B.bossType];
      if (B.bossType === 'octopus' && B.legs.some(function (l) { return !l.cut; })) amt *= BC.armor;
      if (e.stunT > 0 && BC.vuln) amt *= BC.vuln;
    }
    e.hp -= amt; e.hit = 0.12;
    if (e.hp <= 0) {
      B.kills++;
      if (e.boss) { events.push({ type: 'bossDown' }); B.bossPhase = false; }
      var p = pos(B, e);
      B.fx.push({ kind: 'pop', x: p.x, y: p.y, t: 0, life: 0.4 });
      if (e.turbo) { B.turboCoins += G.CONFIG.turboEnemyBonus; events.push({ type: 'turboCoin', x: p.x, y: p.y, coin: G.CONFIG.turboEnemyBonus }); }
    }
  }

  /* ───────── 영웅 능력 (18장) ─────────
   * 위치를 고르는 능력은 x, y 를 받는다. 성공하면 true */
  // 보스전에서는 대기 시간 대신 필살기 칸(문제를 맞힐 때마다 1칸)이 3칸 차야 쓸 수 있다
  function skillReady(B) { if (!B.hero || B.hero.stunT > 0) return false; return B.bossPhase ? B.pips >= G.CONFIG.boss.pipsNeed : B.hero.cd <= 0; }
  function nearestPathPoint(B, x, y) {
    var best = null, bd = 1e9;
    B.paths.forEach(function (P) {
      for (var s = 0; s < P.length; s += 8) { var q = P.at(s); var d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = q; } }
    });
    return { p: best, d: bd };
  }
  function useSkill(B, x, y) {
    if (!skillReady(B)) return false;
    var H = G.CONFIG.heroes[B.hero.id], k = H.skill, sc = hpScale(B);
    if (k === 'slowZone') B.zones.push({ x: x, y: y, r: H.r, t: 0, life: H.dur, slow: H.slow });
    else if (k === 'cheer') { B.cheerT = H.dur; B.fx.push({ kind: 'cheer', x: B.hero.x, y: B.hero.y, t: 0, life: 1 }); }
    else if (k === 'block') {
      var n = nearestPathPoint(B, x, y);
      if (n.d > 70) return false;   // 길 위를 눌러야 한다
      B.barriers.push({ x: n.p.x, y: n.p.y, t: 0, life: H.dur });
    } else if (k === 'arrowRain') {
      B.fx.push({ kind: 'arrows', x: x, y: y, r: H.r, t: 0, life: 0.5 });
      B.delayed.push({ t: 0.35, fn: function (ev) { B.enemies.forEach(function (e) { var p = pos(B, e); if (Math.hypot(p.x - x, p.y - y) <= H.r) damage(B, e, H.dmg * sc, ev, true); }); } });
    } else if (k === 'meteor') {
      B.fx.push({ kind: 'flash', x: 480, y: 270, t: 0, life: 0.8 });
      B.enemies.forEach(function (e, i) { var p = pos(B, e); B.fx.push({ kind: 'meteor', x: p.x, y: p.y, t: -i * 0.03, life: 0.55 }); });
      B.delayed.push({ t: 0.5, fn: function (ev) { B.enemies.forEach(function (e) { damage(B, e, H.dmg * sc, ev, true); }); } });
    }
    if (B.bossPhase) B.pips = 0; else B.hero.cd = B.hero.maxCd;
    B.hero.cast = 0.6;
    return true;
  }

  /* ───────── 스테이지 기믹 (7장) ───────── */
  function gimmick(B, dt, events) {
    if (!B.waveRunning) return;
    B.gimT += dt;
    if (B.gimmick === 'blizzard' && B.gimT >= 14) {     // 눈보라: 친구 하나가 3초 얼어붙는다
      B.gimT = 0;
      var live = B.units.filter(function (u) { return u.frozen <= 0; });
      if (live.length) { var u = live[Math.floor(Math.random() * live.length)]; u.frozen = 3; events.push({ type: 'gimmick', text: '눈보라! 친구가 얼었어요' }); B.fx.push({ kind: 'snow', x: 480, y: 270, t: 0, life: 2 }); }
    }
    if (B.gimmick === 'storm' && B.gimT >= 18) {        // 모래폭풍: 적이 다른 갈래로 간다
      B.gimT = 0; B.forkDir = 1 - B.forkDir; B.stormT = 2.5;
      events.push({ type: 'gimmick', text: '모래폭풍! 적이 ' + (B.forkDir ? '가운데' : '아래') + ' 길로 가요' });
    }
    B.stormT = Math.max(0, B.stormT - dt);
    B.lightT = Math.max(0, B.lightT - dt);
  }
  function light(B, sec) { B.lightT = Math.max(B.lightT, sec); }
  function isDark(B) { return B.gimmick === 'dark' && B.lightT <= 0; }

  /* ───────── 보스전 (8장) ───────── */
  function bossCfg(B) { return G.CONFIG.boss[B.bossType]; }
  // 문어 다리 8개: 더해서 10이 되는 짝 4쌍
  function makeLegs(B) {
    var pairs = [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]].sort(function () { return Math.random() - 0.5; }).slice(0, 4), legs = [];
    pairs.forEach(function (pr) { legs.push({ n: pr[0], cut: false }); legs.push({ n: pr[1], cut: false }); });
    B.legs = legs.sort(function () { return Math.random() - 0.5; }); B.legT = 0;
  }
  function startBoss(B) {
    var st = G.stageByNo(B.stageNo), BC = bossCfg(B);
    B.carryMul = carryMul(B, 2);
    B.bossPhase = true; B.progress = 1; B.waveRunning = false; B.bossT = 0; B.demonPhase = 1; B.combo = 0; B.pips = 0;
    var hp = BC.hp * (st.hp || 1) * B.diff.bossHp * B.carryMul;
    B.boss = { id: B.nextId++, type: B.bossType, boss: true, pi: 0, hp: hp, maxHp: hp, s: 0, speed: BC.speed * (B.diff.bossSpeed || 1), slowT: 0, zoneSlow: 1, hit: 0, bob: 0, shield: 0, stunT: 0 };
    B.enemies.push(B.boss);
    if (B.hero) { B.hero.tx = B.hero.x; B.hero.ty = B.hero.y; B.hero.stunT = 0; }
    if (B.bossType === 'octopus') makeLegs(B);
  }
  // 문어 다리 두 개를 골라 자르기. 더해서 10이면 true
  function cutLegs(B, i, j) {
    var a = B.legs[i], b = B.legs[j];
    if (!a || !b || i === j || a.cut || b.cut || a.n + b.n !== 10) return false;
    a.cut = b.cut = true;
    if (B.legs.every(function (l) { return l.cut; })) { B.boss.stunT = bossCfg(B).stun; B.legT = 0; }
    return true;
  }
  // 보스전 문제 칸에 답함: 맞히면 필살기 칸 +1, 연속 정답 +1. 마왕 3단계에서 5연속이면 마지막 일격
  function bossAnswer(B, ok, events) {
    if (!ok) { B.combo = 0; return {}; }
    B.pips = Math.min(G.CONFIG.boss.pipsNeed, B.pips + 1); B.combo++;
    if (B.bossType === 'demon' && B.demonPhase === 3 && B.combo >= bossCfg(B).comboNeed && B.boss && B.boss.hp > 0) {
      B.fx.push({ kind: 'flash', x: 480, y: 270, t: 0, life: 1 });
      damage(B, B.boss, B.boss.hp + 1, events || [], true);
      return { final: true };
    }
    return {};
  }
  function moveHero(B, x, y) {
    if (!B.hero || !B.bossPhase) return;
    B.hero.tx = Math.max(40, Math.min(920, x)); B.hero.ty = Math.max(90, Math.min(500, y));
  }
  function hazard(B, x, y, r, warn) { B.hazards.push({ x: x, y: y, r: r, t: 0, warn: warn }); }
  function randomUnit(B) { var l = B.units.filter(function (u) { return !(u.eaten > 0); }); return l[Math.floor(Math.random() * l.length)]; }
  function bossTick(B, dt, events) {
    if (!B.bossPhase || !B.boss) return;
    var BC = bossCfg(B), boss = B.boss, h = B.hero;
    B.bossT += dt;
    if (B.bossType === 'octopus') {
      if (B.legs.every(function (l) { return l.cut; })) { B.legT += dt; if (B.legT >= BC.legRegrow) { makeLegs(B); events.push({ type: 'gimmick', text: '문어 다리가 다시 자랐어요!' }); } }
    }
    if (B.bossType === 'scorpion' && B.bossT >= BC.stingEvery) {
      B.bossT = 0;
      if (h) hazard(B, h.x, h.y, BC.stingR, BC.stingWarn);
      var u1 = randomUnit(B); if (u1) hazard(B, u1.x, u1.y, BC.stingR, BC.stingWarn);
      var bp = pos(B, boss); hazard(B, bp.x + (Math.random() - 0.5) * 200, bp.y + (Math.random() - 0.5) * 120, BC.stingR, BC.stingWarn);
    }
    if (B.bossType === 'demon') {
      var ratio = boss.hp / boss.maxHp, ph = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      if (ph > B.demonPhase) {
        B.demonPhase = ph; B.bossT = 0; B.combo = 0;
        events.push({ type: 'gimmick', text: ph === 2 ? '마왕 2단계! 별똥별을 피해요' : '마왕 3단계! 5문제 연속 정답으로 마지막 일격!' });
      }
      ph = B.demonPhase;
      if (ph === 1 && B.bossT >= BC.summonEvery) {
        B.bossT = 0;
        for (var k = 0; k < 3; k++) {
          var hp = BC.summonHp * B.diff.hp;   // 일반 적 체력과 따로 정한다
          B.enemies.push({ id: B.nextId++, type: 'imp', pi: 0, hp: hp, maxHp: hp, s: Math.max(0, boss.s - 30 * (k + 1)), speed: G.CONFIG.wave.speed * B.diff.speed, slowT: 0, zoneSlow: 1, hit: 0, bob: Math.random() * 6, shield: 0 });
        }
      }
      if (ph === 2 && B.bossT >= BC.starEvery) {
        B.bossT = 0;
        if (h) hazard(B, h.x, h.y, BC.starR, BC.starWarn);
        for (var m = 0; m < 3; m++) { var uu = randomUnit(B); if (uu) hazard(B, uu.x, uu.y, BC.starR, BC.starWarn); }
      }
      if (ph === 3 && B.bossT >= BC.eatEvery) {
        B.bossT = 0;
        var v = randomUnit(B); if (v) { v.eaten = BC.eatSec; events.push({ type: 'gimmick', text: '마왕이 친구를 삼켰어요! 빨리 물리쳐요' }); }
      }
    }
    // 빨간 원: 경고 시간이 지나면 떨어진다. 영웅이 안에 있으면 기절, 친구는 잠깐 얼어붙음
    B.hazards.forEach(function (z) {
      z.t += dt;
      if (z.t >= z.warn && !z.hit) {
        z.hit = true;
        B.fx.push({ kind: 'impact', x: z.x, y: z.y, r: z.r, t: 0, life: 0.4 });
        if (h && Math.hypot(h.x - z.x, h.y - z.y) <= z.r) { h.stunT = BC.heroStun || 3; B.heroHits++; events.push({ type: 'heroHit' }); }
        B.units.forEach(function (u) { if (Math.hypot(u.x - z.x, u.y - z.y) <= z.r) u.frozen = Math.max(u.frozen, 2); });
      }
    });
    B.hazards = B.hazards.filter(function (z) { return z.t < z.warn + 0.4; });
    // 영웅 움직이기
    if (h) {
      h.stunT = Math.max(0, (h.stunT || 0) - dt);
      if (h.stunT <= 0 && h.tx !== undefined) {
        var dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy), stepLen = G.CONFIG.boss.heroMove * dt;
        if (d > 1) { var f = Math.min(1, stepLen / d); h.x += dx * f; h.y += dy * f; }
      }
    }
  }

  function step(B, dt) {
    var C = G.CONFIG, events = [];
    B.time += dt;
    gimmick(B, dt, events);
    bossTick(B, dt, events);
    // 적 나오기
    if (B.waveRunning && B.spawnLeft > 0) {
      B.spawnTimer -= dt;
      while (B.spawnTimer <= 0 && B.spawnLeft > 0) { spawn(B, events); B.spawnTimer += B.spawnGap; }
    }
    // 느림 구역과 길막기
    B.zones.forEach(function (z) { z.t += dt; }); B.zones = B.zones.filter(function (z) { return z.t < z.life; });
    B.barriers.forEach(function (b) { b.t += dt; }); B.barriers = B.barriers.filter(function (b) { return b.t < b.life; });
    // 적 움직이기
    B.enemies.forEach(function (e) {
      var p = pos(B, e), mul = e.slowT > 0 ? (1 - C.jobs.ice.slow) : 1;
      B.zones.forEach(function (z) { if (Math.hypot(p.x - z.x, p.y - z.y) <= z.r) mul = Math.min(mul, z.slow); });
      e.zoneSlow = mul;
      e.slowT = Math.max(0, e.slowT - dt); e.hit = Math.max(0, e.hit - dt);
      if (!e.boss && e.stunT > 0) { e.stunT -= dt; return; }               // 자동 능력: 경직·얼림이면 멈춘다
      if (e.boss) {
        if (e.stunT > 0) { e.stunT -= dt; return; }                       // 기절하면 멈춘다
        if (B.bossType === 'demon' && B.demonPhase === 3) return;          // 마왕 3단계: 입을 벌리고 멈춘다
      }
      var ds = e.speed * mul * dt, nq = B.paths[e.pi || 0].at(e.s + ds), blocked = false;
      B.barriers.forEach(function (b) { if (Math.hypot(nq.x - b.x, nq.y - b.y) < 24 && Math.hypot(p.x - b.x, p.y - b.y) >= Math.hypot(nq.x - b.x, nq.y - b.y)) blocked = true; });
      e.blocked = blocked;
      if (!blocked) e.s += ds;
      if (e.boss && e.s >= B.paths[0].length) {    // 보스가 한 바퀴를 다 돌면 생명 2 를 잃고 다시 돈다
        e.s -= B.paths[0].length;
        var lose = Math.min(B.life, G.CONFIG.boss.lapLife); B.life -= lose; B.lifeLost += lose;
        events.push({ type: 'escape' }); events.push({ type: 'gimmick', text: '보스가 한 바퀴를 돌았어요! 생명 −' + lose });
        return;
      }
      /* 2026-11-26 적은 한 바퀴를 다 돌아도 사라지지 않고 계속 돈다. 바퀴를 다 돌 때마다 생명 1 (탑의 작은 보스는 2) */
      var lapLen = B.paths[e.pi || 0].length * B.laps;
      if (e.hp > 0 && e.s >= lapLen * ((e.laps || 0) + 1)) {
        e.laps = (e.laps || 0) + 1; B.escaped++;
        var lost = Math.min(B.life, e.mini ? 2 : 1);
        B.life -= lost; B.lifeLost += lost;
        events.push({ type: 'escape' });
      }
    });
    // 친구들 공격 (영웅도 함께)
    var dark = isDark(B), atkMul = B.cheerT > 0 ? C.heroes.cheer.mult : 1;
    B.cheerT = Math.max(0, B.cheerT - dt);
    var shooters = B.units.slice();
    if (B.hero) { B.hero.cast = Math.max(0, B.hero.cast - dt); if (!B.bossPhase) B.hero.cd = Math.max(0, B.hero.cd - dt); if (!(B.hero.stunT > 0)) shooters.push(B.hero); }
    shooters.forEach(function (u) {
      var isHero = u === B.hero, st = isHero ? (B.heroSt || C.heroAttack) : u.st;
      u.flash = Math.max(0, u.flash - dt);
      if (u.eaten > 0) { u.eaten -= dt; return; }   // 마왕에게 삼켜진 친구
      if (!isHero && B.drag && B.drag.slot === u.slot) return;   // 끌고 있는 친구는 쉬어요
      if (u.frozen > 0) { u.frozen -= dt; return; }
      if (!isHero && st.rapidEvery) {   // 레전더리 마법사: 연사 모드
        u.rapidClock = (u.rapidClock || 0) + dt;
        var wasRapid = u.rapid > 0; u.rapid = (u.rapidClock % st.rapidEvery) >= st.rapidEvery - st.rapidDur ? 1 : 0;
        if (u.rapid && !wasRapid) B.fx.push({ kind: 'word', text: '연사!', x: u.x, y: u.y - 70, t: 0, life: 0.8 });
      }
      if (isHero) { u.atkCd -= dt; if (u.atkCd > 0) return; } else { u.cd -= dt * u.speedUp * (u.rapid ? st.rapidMul : 1); if (u.cd > 0) return; }
      var range = st.range * (dark ? 0.7 : 1);   // 어둠 속에서는 사거리 70%
      // 사거리 안에서 가장 멀리 간(빠져나가기 직전인) 적을 노린다
      var best = null, bestS = -1;
      for (var i = 0; i < B.enemies.length; i++) {
        var e = B.enemies[i]; if (e.hp <= 0) continue;
        var p = pos(B, e), prog = e.s / B.paths[e.pi || 0].length;
        if (Math.hypot(p.x - u.x, p.y - u.y) <= range && prog > bestS) { best = e; bestS = prog; }
      }
      if (!best) { if (isHero) u.atkCd = 0; else u.cd = 0; return; }
      if (isHero) u.atkCd = st.interval; else u.cd = st.interval;
      u.flash = 0.15;
      var tp = pos(B, best), job = isHero ? 'hero' : G.charById(u.id).job, dmg = st.atk * atkMul;
      if (st.crit && Math.random() < st.crit) { dmg *= st.critMul; B.fx.push({ kind: 'crit', x: tp.x, y: tp.y - 40, t: 0, life: 0.5 }); }   // 궁수 치명타
      B.shots.push({ job: job, x: u.x, y: u.y - 30, tx: tp.x, ty: tp.y - 14, t: 0, life: 0.18 });
      if (st.splash) {
        B.fx.push({ kind: 'boom', x: tp.x, y: tp.y, t: 0, life: 0.3, r: st.splash });
        B.enemies.forEach(function (e) { if (e.hp <= 0) return; var p = pos(B, e); if (Math.hypot(p.x - tp.x, p.y - tp.y) <= st.splash) damage(B, e, dmg, events); });
      } else damage(B, best, dmg, events);
      if (st.cleave) {   // 레전더리 검사: 주위도 공격
        B.fx.push({ kind: 'slash', x: tp.x, y: tp.y, t: 0, life: 0.25, r: st.cleave });
        B.enemies.forEach(function (e) { if (e === best || e.hp <= 0) return; var p = pos(B, e); if (Math.hypot(p.x - tp.x, p.y - tp.y) <= st.cleave) damage(B, e, dmg * st.cleaveMul, events); });
      }
      if (st.push && best.hp > 0 && !best.boss && !best.mini && !best.mid) best.s = Math.max((best.laps || 0) * B.paths[best.pi || 0].length * B.laps, best.s - st.push);   // 밀어도 지난 바퀴로 돌아가지는 않는다
      if (st.slow && best.hp > 0) best.slowT = st.slowSec;
      var calm = best.hp > 0 && !best.boss && !best.mini && !best.mid;   // 보스·작은 보스·중간 보스는 멈추지 않는다
      if (st.stun && calm) { best.stunT = Math.max(best.stunT || 0, st.stun); best.stunKind = 'stun'; }
      if (st.freeze && calm && Math.random() < st.freeze) {
        best.stunT = Math.max(best.stunT || 0, st.freezeSec); best.stunKind = 'ice';
        if (st.freezeR) {   // 레전더리 얼음술사: 얼음 폭발
          B.fx.push({ kind: 'boom', x: tp.x, y: tp.y, t: 0, life: 0.3, r: st.freezeR });
          B.enemies.forEach(function (e) { if (e === best || e.hp <= 0 || e.boss || e.mini || e.mid) return; var p = pos(B, e); if (Math.hypot(p.x - tp.x, p.y - tp.y) <= st.freezeR) { e.stunT = Math.max(e.stunT || 0, st.freezeSec); e.stunKind = 'ice'; } });
        }
      }
    });
    // 늦게 터지는 능력 (화살비, 메테오)
    B.delayed.forEach(function (d) { d.t -= dt; if (d.t <= 0 && !d.done) { d.done = true; d.fn(events); } });
    B.delayed = B.delayed.filter(function (d) { return !d.done; });

    B.enemies = B.enemies.filter(function (e) { return e.hp > 0; });
    B.shots.forEach(function (s) { s.t += dt; }); B.shots = B.shots.filter(function (s) { return s.t < s.life; });
    B.fx.forEach(function (f) { f.t += dt; }); B.fx = B.fx.filter(function (f) { return f.t < f.life; });

    if (B.life <= 0) { events.push({ type: 'lose' }); B.waveRunning = false; }
    else if (B.waveRunning && B.spawnLeft === 0 && B.enemies.length === 0) { B.waveRunning = false; events.push({ type: 'waveEnd', wave: B.wave }); }
    return events;
  }

  /* 9-3 원칙 2: 웨이브가 끝났을 때 한 웨이브 더 할지 정한다.
   * realSec: 지금까지의 계획 실제 시간 (B.plannedReal), speed: 지금 배속 { v, count }
   * 적을 다 잡는 마지막 몇 초는 판마다 달라서 넣지 않는다. 그래야 웨이브 수가 흔들리지 않는다. */
  function wantsAnotherWave(wavesDone, realSec, speed) {
    var T = G.CONFIG.battleTime;
    if (wavesDone < T.minWaves) return true;
    if (wavesDone >= T.maxWaves) return false;
    var nextReal = T.waveGameSec * G.CONFIG.wave.spawnPortion * speed.count / speed.v;
    return realSec < T.targetRealSec - nextReal * 0.5;
  }

  return { create: create, setLineup: setLineup, startWave: startWave, startTowerFloor: startTowerFloor, towerHpScale: towerHpScale, step: step, wantsAnotherWave: wantsAnotherWave,
    heroStats: heroStats, moveUnit: moveUnit, slotAt: slotAt, rewindWave: rewindWave, useSkill: useSkill, skillReady: skillReady, light: light, isDark: isDark, nearestPathPoint: nearestPathPoint,
    startBoss: startBoss, cutLegs: cutLegs, bossAnswer: bossAnswer, moveHero: moveHero,
    pos: pos, teamPower: teamPower, carryMul: carryMul, LAYOUTS: LAYOUTS, unitStats: unitStats, W: W, H: H };
})();

if (typeof module !== 'undefined') module.exports = G.Battle;
