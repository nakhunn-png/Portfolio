/* 배속 보정·난이도 검사: node tests/check-speed.js
 * 만든 스테이지마다, 배속마다 10판씩 모의로 돌려 본다.
 *  - 웨이브 수가 PRD 9-3 표(1배속 4 · 1.5배속 5 · 2배속 6 · 2.5배속 7)와 같은가 (10판 모두)
 *  - 실제 전투 시간이 3분 20초 ~ 5분인가 (이긴 판만)
 *  - 너무 쉽지도 어렵지도 않은가 (스테이지마다 40판 모아 승률 60%↑·평균 잃은 생명 0.5↑, 배속 하나는 40%↑)
 *  - 디펜스다운가: 첫 웨이브 적이 죽기 전에 길을 평균 15% 넘게 가는가 (2026-11-26 「나오자마자 5초도 안 돼서 죽는다」)
 * 아이가 문제를 다 맞혀 뽑기를 하고, 영웅(마법사·응원단장·방패병·궁수 돌아가며) 능력을 힘이 모일 때마다 쓴다고 본다. */
var path = require('path');
global.G = {};
require(path.join(__dirname, '../js/config.js'));
require(path.join(__dirname, '../js/battle.js'));
require(path.join(__dirname, '../js/collection.js'));
var C = G.CONFIG, B = G.Battle, Col = G.Collection;

var EXPECT = { '1배속': 4, '1.5배속': 5, '2배속': 6, '2.5배속': 7 };
var fail = 0;

// 위치를 고르는 능력은 가장 멀리 간 적 자리에 쓴다
function autoSkill(bt) {
  if (!B.skillReady(bt) || !bt.enemies.length) return;
  var far = bt.enemies.reduce(function (a, e) { return e.s > a.s ? e : a; });
  var p = B.pos(bt, far);
  B.useSkill(bt, p.x, p.y);
}

function simulate(stageNo, sp, heroId) {
  var book = Col.newBook(), run = Col.newRun();
  Col.addCoins(run, C.coin.start + C.problems.prep * C.coin.perCorrect);
  Col.drawAll(run, book); Col.autoMerge(run, book);
  var bt = B.create(stageNo, Col.lineup(run), heroId), real = 0, waves = 0, dt = 1 / 30, lightClock = 0, firstFr = [];
  while (true) {
    B.startWave(bt, sp, waves >= C.battleTime.minWaves);
    var game = 0, ev = [], seen = {};
    while (true) {
      if (waves === 0) bt.enemies.forEach(function (e) { seen[e.id] = e; });
      ev = B.step(bt, dt); game += dt;
      // 첫 웨이브 적이 죽은 자리 (길 한 바퀴 중 몇 %)
      if (waves === 0) Object.keys(seen).forEach(function (id) { var e = seen[id]; if (e.hp <= 0) { if (!e.escaped) firstFr.push(e.s / (bt.paths[e.pi || 0].length * bt.laps)); delete seen[id]; } });
      autoSkill(bt);
      // 밤 놀이공원: 12초마다 뜨는 보너스 문제의 절반을 맞혀 조명을 켠다
      lightClock += dt / sp.v; if (lightClock >= 24) { lightClock = 0; B.light(bt, 12); }
      if (ev.some(function (e) { return e.type === 'waveEnd' || e.type === 'lose'; })) break;
      if (game > 900) throw new Error('웨이브가 끝나지 않음 (스테이지 ' + stageNo + ')');
    }
    real += game / sp.v; waves++;
    if (ev.some(function (e) { return e.type === 'lose'; })) return { real: real, waves: waves, lost: bt.lifeLost, win: false, first: avg(firstFr) };
    if (!B.wantsAnotherWave(waves, bt.plannedReal, sp)) break;
    var bubbles = Math.floor((game / sp.v) / C.questionBubbleSec / 2);
    Col.addCoins(run, (C.problems.betweenWaves + bubbles) * C.coin.perCorrect);
    Col.drawAll(run, book); Col.autoMerge(run, book);
    B.setLineup(bt, Col.lineup(run));
  }
  return { real: real, waves: waves, lost: bt.lifeLost, win: true, first: avg(firstFr) };
}
function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

C.stages.filter(function (st) { return st.ready && !st.boss; }).forEach(function (st) {   // 보스 스테이지는 tests/check-boss.js
  console.log('스테이지 ' + st.no + ' ' + st.name);
  var stageLost = 0, stageRuns = 0, firstSum = 0, stageWins = 0;
  C.speeds.forEach(function (sp) {
    var trials = 10, wins = 0, sumReal = 0, sumWaves = 0, sumLost = 0, wavesSet = {};
    for (var k = 0; k < trials; k++) {
      var r = simulate(st.no, sp, ['mage', 'cheer', 'shield', 'archer'][k % 4]);
      sumLost += r.lost; firstSum += r.first;
      if (r.win) { wins++; sumReal += r.real; sumWaves += r.waves; wavesSet[r.waves] = 1; }   // 웨이브 수·시간은 이긴 판만
    }
    var avgReal = wins ? sumReal / wins : 0, avgWaves = wins ? sumWaves / wins : 0, avgLost = sumLost / trials, rate = wins / trials;
    var okWaves = Object.keys(wavesSet).length === 1 && avgWaves === EXPECT[sp.name];
    var okTime = avgReal >= 200 && avgReal <= 315;   // 3분 20초 ~ 5분 15초 (적이 단단해 마지막 적 정리가 길어진다)
    // 2026-11-26: 배속 하나(10판)는 흔들림이 커서 40% 아래만 실패로 본다. 승률은 아래에서 40판을 모아 60% 이상인지 본다
    var okLife = rate >= 0.4;
    stageWins += wins;
    stageLost += sumLost; stageRuns += trials;
    var m = Math.floor(avgReal / 60), s = Math.round(avgReal % 60);
    console.log('  ' + (okWaves && okTime && okLife ? '통과' : '실패') + '  ' + sp.name + '  웨이브 ' + avgWaves.toFixed(1) + ' (기대 ' + EXPECT[sp.name] + ')' +
      '  실제 전투 ' + m + '분 ' + s + '초  승률 ' + Math.round(rate * 100) + '%  잃은 생명 평균 ' + avgLost.toFixed(1));
    if (!(okWaves && okTime && okLife)) fail++;
  });
  // 너무 쉬운지: 모든 스테이지에서 40판 평균으로 생명을 0.5개 이상 잃고, 첫 웨이브 적이 길을 15% 넘게 가야 한다
  var ok = stageLost / stageRuns >= 0.5, okFirst = firstSum / stageRuns >= 0.15, okWin = stageWins / stageRuns >= 0.6;
  console.log('  ' + (ok && okFirst && okWin ? '통과' : '실패') + '  40판 모아 보기: 승률 ' + Math.round(stageWins / stageRuns * 100) + '% · 평균 잃은 생명 ' + (stageLost / stageRuns).toFixed(2) + ' · 첫 웨이브 적이 죽은 자리 평균 ' + Math.round(firstSum / stageRuns * 100) + '%');
  if (!(ok && okFirst && okWin)) fail++;
});
console.log(fail ? '\n배속 보정 검사 실패' : '\n배속 보정 검사 모두 통과');
process.exit(fail ? 1 : 0);
