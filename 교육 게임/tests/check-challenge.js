/* 도전 영역 검사: node tests/check-challenge.js
 *  - 만들어요 놀이 3개의 문제가 교과 범위 안이고 답이 꼭 하나인가
 *  - 도감 보상·도전 과제가 한 번씩만 주어지는가
 *  - 도전의 탑: 문제를 다 맞히는 아이가 「보통」에서 평균 18~45층 (30층은 잘하는 아이도 도전해야 닿는 목표, 2026-11-26)
 *    「쉬움」은 24층 이상. 배속이 달라도 오르는 층 수가 크게 다르지 않은가 */
var path = require('path');
global.G = {};
require(path.join(__dirname, '../js/config.js'));
require(path.join(__dirname, '../js/battle.js'));
require(path.join(__dirname, '../js/collection.js'));
require(path.join(__dirname, '../js/challenge.js'));
var C = G.CONFIG, B = G.Battle, Col = G.Collection, Ch = G.Challenge, fail = 0;
function check(ok, msg) { if (!ok) { console.log('  실패  ' + msg); fail++; } }

console.log('만들어요 놀이');
for (var i = 0; i < 3000; i++) {
  var d = Ch.makeDice();
  var pairs = 0; for (var a = 0; a < 3; a++) for (var b = a + 1; b < 3; b++) if (d.faces[a] + d.faces[b] === 10) pairs++;
  check(pairs >= 1 && d.faces.every(function (f) { return f >= 1 && f <= 9; }), '주사위에 10 짝이 없음 ' + d.faces);
  check(d.choices.indexOf(d.answer) >= 0 && new Set(d.choices).size === 3, '주사위 보기 이상 ' + d.choices);
  var r = Ch.makeRoad(), ends = [];
  r.step1.forEach(function (x) { r.step2.forEach(function (y) { ends.push(r.start + x + y); check(r.start + x >= 0 && r.start + x <= 18 && r.start + x + y >= 0 && r.start + x + y <= 18, '길 범위 밖'); }); });
  check(ends.filter(function (e) { return e === r.target; }).length === 1, '길 답이 하나가 아님');
  var m = Ch.makeCommand(), ce = [];
  m.fw.forEach(function (f) { m.bw.forEach(function (bk) { ce.push(m.start + f - bk); check(Ch.noCarryAdd(m.start, f) && Ch.noBorrowSub(m.start + f, bk), '명령어 받아올림/내림 있음'); }); });
  check(ce.filter(function (e) { return e === m.target; }).length === 1 && m.target >= 1 && m.target <= 99, '명령어 답이 하나가 아님');
}

console.log('도감 보상 · 도전 과제');
var book = Col.newBook(), prog = { stars: {}, best: {} };
G.CHARACTERS.slice(0, 10).forEach(function (c) { book.found[c.id] = true; });
check(Ch.checkBook(book, prog).length === 1 && prog.gift === 100, '10종 보상');
check(Ch.checkBook(book, prog).length === 0, '10종 보상을 두 번 줌');
G.CHARACTERS.filter(function (c) { return c.grade !== 'hidden'; }).forEach(function (c) { book.found[c.id] = true; });
check(Ch.checkBook(book, prog).length === 2 && prog.rewards.slot9 && prog.rewards.gold, '20종·27종 보상');
var got = Ch.record(prog, book, { bestCombo: 15 });
check(got.length === 1 && book.found.h2, '15연속 정답 → 무지개 요리사');
['octopus', 'scorpion', 'demon'].forEach(function (bt) { got = Ch.record(prog, book, { win: true, bossType: bt, speedV: 1.5, lifeLost: 1, heroHits: 0 }); });
check(book.found.h1 && !prog.ach.noHit, '보스 셋 1.5배속 → 번개 냠냠');
got = Ch.record(prog, book, { win: true, bossType: 'demon', speedV: 1, lifeLost: 0, heroHits: 0 });
check(prog.ach.noHit && prog.gift === 400, '안 맞고 보스 → 선물 코인 300');
got = Ch.record(prog, book, { towerFloor: 30, speedName: '1배속' });
check(book.found.h3 && prog.tower.floor === 30, '탑 30층 → 마왕의 아이');
check(Ch.towerTypes(1).every(function (t) { return t[0] === 'A'; }) && Ch.towerTypes(25).indexOf('C1') >= 0, '탑 문제 단원 섞기');

console.log('도전의 탑');
function autoSkill(bt) {
  if (!B.skillReady(bt) || !bt.enemies.length) return;
  var far = bt.enemies.reduce(function (a, e) { return e.s > a.s ? e : a; });
  var p = B.pos(bt, far); B.useSkill(bt, p.x, p.y);
}
function climb(sp, heroId, diffKey) {
  var book = Col.newBook(), run = Col.newRun(), D = G.difficultyByKey(diffKey);
  Col.addCoins(run, D.coins + C.problems.prep * C.coin.perCorrect);
  Col.drawAll(run, book); Col.autoMerge(run, book);
  var bt = null, theme = 0, dt = 1 / 30, real = 0;
  for (var floor = 1; floor <= 80; floor++) {
    var th = Ch.towerTheme(floor);
    if (th !== theme) {   // 5층마다 배경이 바뀐다: 생명·영웅 힘은 이어 간다
      var nb = B.create(th, Col.lineup(run), heroId, diffKey, { tower: true });
      if (bt) { nb.life = bt.life; nb.lifeLost = bt.lifeLost; nb.hero.cd = bt.hero.cd; }
      bt = nb; theme = th;
    }
    B.setLineup(bt, Col.lineup(run));
    B.startTowerFloor(bt, floor, sp);
    var game = 0, ev;
    while (true) {
      ev = B.step(bt, dt); game += dt; autoSkill(bt);
      if (ev.some(function (e) { return e.type === 'waveEnd' || e.type === 'lose'; })) break;
      if (game > 900) throw new Error('층이 끝나지 않음');
    }
    real += game / sp.v;
    if (ev.some(function (e) { return e.type === 'lose'; })) return { floor: floor - 1, real: real };
    var bubbles = Math.floor((game / sp.v) / C.questionBubbleSec / 2);
    Col.addCoins(run, (C.tower.problems + bubbles) * C.coin.perCorrect);
    Col.drawAll(run, book); Col.autoMerge(run, book);
  }
  return { floor: 80, real: real };
}
[['normal', 18, 45], ['easy', 24, 999]].forEach(function (dk) {
  C.speeds.forEach(function (sp) {
    var n = 8, sum = 0, min = 999, max = 0, sumReal = 0;
    for (var k = 0; k < n; k++) { var r = climb(sp, ['mage', 'cheer', 'shield', 'archer'][k % 4], dk[0]); sum += r.floor; sumReal += r.real; min = Math.min(min, r.floor); max = Math.max(max, r.floor); }
    var avg = sum / n;
    console.log('  ' + G.difficultyByKey(dk[0]).name + ' ' + sp.name + ': 평균 ' + avg.toFixed(1) + '층 (' + min + '~' + max + '), 전투 ' + Math.round(sumReal / n / 60) + '분');
    check(avg >= dk[1] && avg <= dk[2], G.difficultyByKey(dk[0]).name + ' ' + sp.name + ' 평균 층 ' + avg.toFixed(1) + ' (기대 ' + dk[1] + '~' + dk[2] + ')');
  });
});

console.log(fail ? '\n도전 영역 검사 실패 ' + fail + '건' : '\n도전 영역 검사 모두 통과');
process.exit(fail ? 1 : 0);
