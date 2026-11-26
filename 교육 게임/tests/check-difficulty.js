/* 난이도 사다리 검사: node tests/check-difficulty.js
 * 튜토리얼 → 쉬움 → 보통 → 어려움 → 아주 어려움 → 재앙 이 한 단계마다 확실히 어려워지는가 (2026-11-26 요청).
 * 아이가 문제를 다 맞힌다고 보고 모의로 돌린다 (숫자 자판 난이도는 보너스 문제를 절반만 맞힌다고 본다).
 * 어려움 점수 = (1 − 승률) × 100 + (잃은 생명 ÷ 생명 수) × 50 + 첫 웨이브 적이 간 거리 × 50
 * 일반 스테이지와 보스 스테이지 모두, 다음 단계 점수가 앞 단계보다 MIN_GAP 이상 커야 통과.
 * 아크메이지는 일부러 강한 도움 영웅이라 뺀다. */
var path = require('path');
global.G = {};
require(path.join(__dirname, '../js/config.js'));
require(path.join(__dirname, '../js/battle.js'));
require(path.join(__dirname, '../js/collection.js'));
var C = G.CONFIG, B = G.Battle, Col = G.Collection, fail = 0, MIN_GAP = 5;
var HEROES = ['mage', 'cheer', 'shield', 'archer'];

function far(bt) { return bt.enemies.reduce(function (a, e) { return !a || e.s > a.s ? e : a; }, null); }
function autoSkill(bt) {
  if (!B.skillReady(bt)) return;
  var t = bt.boss && bt.boss.hp > 0 ? bt.boss : far(bt); if (!t) return;
  var p = B.pos(bt, t); B.useSkill(bt, p.x, p.y);
}
function has(ev, type) { return ev.some(function (e) { return e.type === type; }); }

// 웨이브 하나를 끝까지. first: 첫 웨이브 적이 죽은 자리를 모은다
function runWave(bt, first) {
  var seen = {}, game = 0, ev, dt = 1 / 30;
  while (true) {
    if (first) bt.enemies.forEach(function (e) { seen[e.id] = e; });
    ev = B.step(bt, dt); game += dt; autoSkill(bt);
    if (first) Object.keys(seen).forEach(function (id) { var e = seen[id]; if (e.hp <= 0) { if (!e.escaped) first.push(e.s / (bt.paths[e.pi || 0].length * bt.laps)); delete seen[id]; } });
    if (has(ev, 'waveEnd') || has(ev, 'lose')) return { lose: has(ev, 'lose'), game: game };
    if (game > 900) throw new Error('웨이브가 끝나지 않음');
  }
}
function shop(run, book, bt, n) { Col.addCoins(run, n * C.coin.perCorrect); Col.drawAll(run, book); Col.autoMerge(run, book); B.setLineup(bt, Col.lineup(run)); }

function simStage(no, hero, diff) {
  var D = G.difficultyByKey(diff), book = Col.newBook(), run = Col.newRun(), sp = C.speeds[0], first = [];
  Col.addCoins(run, D.coins + C.problems.prep * C.coin.perCorrect); Col.drawAll(run, book); Col.autoMerge(run, book);
  var bt = B.create(no, Col.lineup(run), hero, diff), waves = 0;
  while (true) {
    B.startWave(bt, sp, waves >= C.battleTime.minWaves);
    var r = runWave(bt, waves === 0 ? first : null); waves++;
    if (r.lose) return { win: false, lost: bt.lifeLost, life: D.life, first: first };
    if (!B.wantsAnotherWave(waves, bt.plannedReal, sp)) return { win: true, lost: bt.lifeLost, life: D.life, first: first };
    var bubbles = Math.floor(r.game / C.questionBubbleSec / 2) * (D.keypad ? 0.5 : 1);
    shop(run, book, bt, Math.round(C.problems.betweenWaves + bubbles));
  }
}
// 보스 스테이지: 부하 웨이브 2개 → 보스. 보스 문제는 실제 6초마다 하나 맞힘, 빨간 원은 80% 피함
function simBoss(no, hero, diff) {
  var D = G.difficultyByKey(diff), book = Col.newBook(), run = Col.newRun(), first = [];
  Col.addCoins(run, D.coins + C.problems.prep * C.coin.perCorrect); Col.drawAll(run, book); Col.autoMerge(run, book);
  var bt = B.create(no, Col.lineup(run), hero, diff), dt = 1 / 30;
  for (var w = 0; w < C.boss.minionWaves; w++) {
    B.startWave(bt, C.speeds[0], false);
    if (runWave(bt, w === 0 ? first : null).lose) return { win: false, lost: bt.lifeLost, life: D.life, first: first };
    shop(run, book, bt, C.problems.betweenWaves);
  }
  B.startBoss(bt);
  var t = 0, ans = 0, leg = 0, ev;
  while (t < 600) {
    ev = B.step(bt, dt); t += dt; ans += dt; leg += dt;
    if (ans >= 6) { ans = 0; B.bossAnswer(bt, true, ev); }
    if (bt.bossType === 'octopus' && leg >= 4) { leg = 0; for (var i = 0; i < bt.legs.length; i++) for (var j = i + 1; j < bt.legs.length; j++) if (B.cutLegs(bt, i, j)) { i = j = 99; } }
    bt.hazards.forEach(function (z) {
      if (z.dodge) return; z.dodge = true;
      if (bt.hero && Math.hypot(bt.hero.x - z.x, bt.hero.y - z.y) <= z.r && Math.random() < 0.8) B.moveHero(bt, bt.hero.x + (bt.hero.x < 480 ? 110 : -110), bt.hero.y);
    });
    autoSkill(bt);
    if (has(ev, 'bossDown')) return { win: true, lost: bt.lifeLost, life: D.life, first: first };
    if (has(ev, 'lose')) break;
  }
  return { win: false, lost: bt.lifeLost, life: D.life, first: first };
}

function ladder(label, stages, sim, n) {
  console.log(label);
  var prev = null;
  C.difficulties.forEach(function (D) {
    var wins = 0, lostK = 0, fr = [], runs = 0;
    stages.forEach(function (no) {
      for (var k = 0; k < n; k++) {
        var r = sim(no, HEROES[k % 4], D.key); runs++;
        if (r.win) wins++; lostK += r.lost / r.life; fr = fr.concat(r.first);
      }
    });
    var win = wins / runs, lk = lostK / runs, f = fr.length ? fr.reduce(function (a, b) { return a + b; }, 0) / fr.length : 0;
    var score = (1 - win) * 100 + lk * 50 + f * 50;
    var ok = prev === null || score >= prev + MIN_GAP;
    console.log('  ' + (ok ? '통과' : '실패') + '  ' + (D.name + '      ').slice(0, 6) + ' 승률 ' + Math.round(win * 100) + '%  잃은 생명 ' + Math.round(lk * 100) + '%  첫 웨이브 적이 간 거리 ' + Math.round(f * 100) + '%  → 점수 ' + score.toFixed(0));
    if (!ok) fail++;
    prev = score;
  });
}
ladder('일반 스테이지 (1·2·4·5·7·8, 1배속)', [1, 2, 4, 5, 7, 8], simStage, 10);
ladder('보스 스테이지 (3·6·9, 1배속)', [3, 6, 9], simBoss, 10);
console.log(fail ? '\n난이도 사다리 검사 실패 ' + fail + '건' : '\n난이도 사다리 검사 모두 통과');
process.exit(fail ? 1 : 0);
