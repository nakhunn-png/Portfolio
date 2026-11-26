/* 보스전 검사: node tests/check-boss.js
 * 보스 스테이지 3개를 영웅 4명(아크메이지 제외 — 일부러 강한 도움 영웅이라 밸런스 기준에서 뺀다)으로 모의로 돌린다.
 *  - 부하 웨이브 2개 뒤 보스가 나오는가
 *  - 보스전 실제 시간이 1분 ~ 3분인가 (1배속·1.5배속)
 *  - 「보통」이 너무 쉽지도 어렵지도 않은가 (승률 1배속 70%·1.5배속 60% 이상, 잃은 생명 평균 0.2 이상)
 * 아이 모습 가정: 보스전 문제를 실제 시간 6초마다 하나 맞힘, 빨간 원은 80% 피함, 문어 다리는 4초마다 한 쌍씩 자름,
 * 필살기 칸이 차면 바로 능력을 씀. 준비·웨이브 사이 문제는 다 맞혀 뽑기를 한다. */
var path = require('path');
global.G = {};
require(path.join(__dirname, '../js/config.js'));
require(path.join(__dirname, '../js/battle.js'));
require(path.join(__dirname, '../js/collection.js'));
var C = G.CONFIG, B = G.Battle, Col = G.Collection, fail = 0;

function far(bt) { return bt.enemies.reduce(function (a, e) { return !a || e.s > a.s ? e : a; }, null); }
function useSkill(bt) {
  if (!B.skillReady(bt)) return;
  var t = bt.boss && bt.boss.hp > 0 ? bt.boss : far(bt); if (!t) return;
  var p = B.pos(bt, t); B.useSkill(bt, p.x, p.y);
}

function simulate(stageNo, sp, heroId, diffKey) {
  var book = Col.newBook(), run = Col.newRun(), D = G.difficultyByKey(diffKey);
  Col.addCoins(run, D.coins + C.problems.prep * C.coin.perCorrect);
  Col.drawAll(run, book); Col.autoMerge(run, book);
  var bt = B.create(stageNo, Col.lineup(run), heroId, diffKey), dt = 1 / 30, ev;
  function done(list, type) { return list.some(function (e) { return e.type === type; }); }
  // 부하 웨이브
  for (var w = 0; w < C.boss.minionWaves; w++) {
    B.startWave(bt, sp, false);
    for (var g = 0; ; g += dt) {
      ev = B.step(bt, dt); if (!B.bossPhase) useSkill(bt);
      if (done(ev, 'lose')) return { win: false, bossSec: 0, lost: bt.lifeLost, phase: 'minion' };
      if (done(ev, 'waveEnd')) break;
      if (g > 600) throw new Error('부하 웨이브가 끝나지 않음');
    }
    Col.addCoins(run, C.problems.betweenWaves * C.coin.perCorrect); Col.drawAll(run, book); Col.autoMerge(run, book); B.setLineup(bt, Col.lineup(run));
  }
  // 보스
  B.startBoss(bt);
  var real = 0, ansClock = 0, legClock = 0;
  while (true) {
    ev = B.step(bt, dt); real += dt / sp.v;
    ansClock += dt / sp.v; legClock += dt / sp.v;
    if (ansClock >= 6) { ansClock = 0; B.bossAnswer(bt, true, ev); Col.answer(run, true); }
    if (bt.bossType === 'octopus' && legClock >= 4) {
      legClock = 0;
      for (var i = 0; i < bt.legs.length; i++) for (var j = i + 1; j < bt.legs.length; j++) if (B.cutLegs(bt, i, j)) { i = j = 99; }
    }
    // 빨간 원 피하기 (80%): 영웅 아래에 원이 생기면 옆으로 비킨다
    bt.hazards.forEach(function (z) {
      if (z.dodgeChecked) return; z.dodgeChecked = true;
      if (bt.hero && Math.hypot(bt.hero.x - z.x, bt.hero.y - z.y) <= z.r && Math.random() < 0.8) B.moveHero(bt, bt.hero.x + (bt.hero.x < 480 ? 110 : -110), bt.hero.y);
    });
    useSkill(bt);
    if (done(ev, 'bossDown')) return { win: true, bossSec: real, lost: bt.lifeLost };
    if (done(ev, 'lose')) return { win: false, bossSec: real, lost: bt.lifeLost, phase: 'boss' };
    if (real > 600) return { win: false, bossSec: real, lost: bt.lifeLost, phase: 'timeout' };
  }
}

C.stages.filter(function (st) { return st.boss; }).forEach(function (st) {
  console.log('스테이지 ' + st.no + ' ' + st.name);
  [C.speeds[0], C.speeds[1]].forEach(function (sp) {
    var n = 0, wins = 0, sum = 0, lost = 0;
    ['mage', 'cheer', 'shield', 'archer'].forEach(function (h) {
      for (var k = 0; k < 6; k++) { var r = simulate(st.no, sp, h, 'normal'); n++; if (r.win) { wins++; sum += r.bossSec; } lost += r.lost; }
    });
    // 2026-11-25 「너무 쉬워」: 이기기는 하되(1배속 70%, 1.5배속 60% 이상) 생명을 조금은 잃을 만큼 (평균 0.2 이상)
    var avg = wins ? sum / wins : 0, okTime = avg >= 60 && avg <= 180, okWin = wins / n >= (sp.v === 1 ? 0.7 : 0.6) && lost / n >= 0.2;
    console.log('  ' + (okTime && okWin ? '통과' : '실패') + '  보통 ' + sp.name + '  승률 ' + Math.round(wins / n * 100) + '%  보스전 ' + Math.floor(avg / 60) + '분 ' + Math.round(avg % 60) + '초  잃은 생명 평균 ' + (lost / n).toFixed(1));
    if (!(okTime && okWin)) fail++;
  });
  // 난이도별 (1배속, 영웅 4명 × 3판): 쉬울수록 이기기 쉬워야 한다
  var rates = C.difficulties.map(function (D) {
    var n = 0, wins = 0;
    ['mage', 'cheer', 'shield', 'archer'].forEach(function (h) { for (var k = 0; k < 5; k++) { n++; if (simulate(st.no, C.speeds[0], h, D.key).win) wins++; } });
    return { name: D.name, rate: wins / n };
  });
  console.log('  난이도별 승률  ' + rates.map(function (r) { return r.name + ' ' + Math.round(r.rate * 100) + '%'; }).join(' · '));
  var easy = rates[C.difficulties.map(function (d) { return d.key; }).indexOf('easy')];
  if (easy.rate < 0.9) { console.log('  실패  쉬움에서도 자주 짐'); fail++; }
});
console.log(fail ? '\n보스전 검사 실패' : '\n보스전 검사 모두 통과');
process.exit(fail ? 1 : 0);
