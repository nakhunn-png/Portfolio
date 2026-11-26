/* 도감 보상·도전 과제·도전의 탑·만들어요 놀이 계산 (PRD 6-3, 10장)
 * 화면과 떨어진 순수 계산이라 node 로 검사할 수 있다 (tests/check-challenge.js). */
var G = globalThis.G || (globalThis.G = {});

G.Challenge = (function () {
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ───────── 도전의 탑 (10-2) ───────── */
  // 5층마다 배경(스테이지 길과 적)이 바뀐다. 끝까지 가면 처음부터 다시
  function towerTheme(floor) {
    var T = G.CONFIG.tower, k = Math.floor((floor - 1) / T.themeFloors) % T.themes.length;
    return T.themes[k];
  }
  // 층이 오를수록 단원이 섞인다
  var UNIT_TYPES = { 1: ['A1', 'A2', 'A3', 'A4', 'A5'], 2: ['B1', 'B3'], 3: ['C1', 'C2'] };
  function towerTypes(floor) {
    var out = [];
    G.CONFIG.tower.units.forEach(function (u) { if (floor >= u[0]) out = out.concat(UNIT_TYPES[u[2]]); });
    return out;
  }

  /* ───────── 선물 코인 (도감 보상·도전 과제·놀이) ───────── */
  function addGift(progress, n) { progress.gift = Math.min(G.CONFIG.giftMax, (progress.gift || 0) + n); }

  /* ───────── 도감 보상 (6-3) ─────────
   * 모은 수가 기준을 넘으면 보상을 준다. 새로 받은 보상 목록을 돌려준다 */
  function bookCount(book, hiddenOut) {
    return G.CHARACTERS.filter(function (c) { return book.found[c.id] && !(hiddenOut && c.grade === 'hidden'); }).length;
  }
  function checkBook(book, progress) {
    progress.rewards = progress.rewards || {};
    var got = [];
    G.CONFIG.bookRewards.forEach(function (r) {
      if (progress.rewards[r.key] || bookCount(book, r.hiddenOut) < r.need) return;
      progress.rewards[r.key] = true;
      if (r.key === 'gift100') addGift(progress, 100);
      got.push({ text: '도감 ' + r.need + '종 보상: ' + r.text, desc: r.desc });
    });
    return got;
  }

  /* ───────── 도전 과제 (10-1) ─────────
   * ev: { stageNo, win, bossType, speedV, lifeLost, heroHits, bestCombo, towerFloor }
   * 기록을 남기고, 새로 깬 과제 목록을 돌려준다 */
  function achDone(progress, key) { return !!(progress.ach && progress.ach[key]); }
  function achProgress(progress, key) {
    var p = progress, n;
    if (key === 'bolt') { n = Object.keys(p.bossFast || {}).length; return n + ' / 3'; }
    if (key === 'combo15') return '최고 ' + (p.bestCombo || 0) + ' / 15';
    if (key === 'tower30') return '최고 ' + ((p.tower && p.tower.floor) || 0) + ' / 30층';
    if (key === 'allStars') { n = G.CONFIG.stages.filter(function (s) { return (p.stars[s.no] || 0) >= 3; }).length; return n + ' / 9'; }
    return '';
  }
  function record(progress, book, ev) {
    var p = progress; p.ach = p.ach || {};
    if (ev.bestCombo) p.bestCombo = Math.max(p.bestCombo || 0, ev.bestCombo);
    if (ev.win && ev.bossType && ev.speedV >= 1.5) { p.bossFast = p.bossFast || {}; p.bossFast[ev.bossType] = true; }
    if (ev.towerFloor) {
      var t = p.tower || { floor: 0 };
      if (ev.towerFloor > t.floor) p.tower = { floor: ev.towerFloor, speed: ev.speedName, diff: ev.diffName };
    }
    var met = {
      bolt: Object.keys(p.bossFast || {}).length >= 3,
      combo15: (p.bestCombo || 0) >= 15,
      tower30: ((p.tower && p.tower.floor) || 0) >= G.CONFIG.tower.goal,
      noHit: !!(ev.win && ev.bossType && ev.lifeLost === 0 && ev.heroHits === 0),
      allStars: G.CONFIG.stages.every(function (s) { return (p.stars[s.no] || 0) >= 3; })
    };
    var got = [];
    G.CONFIG.achievements.forEach(function (a) {
      if (p.ach[a.key] || !met[a.key]) return;
      p.ach[a.key] = true;
      var text = '도전 과제 「' + a.name + '」';
      if (a.char) { book.found[a.char] = true; book.count[a.char] = (book.count[a.char] || 0) + 1; text += ' → 히든 「' + G.charById(a.char).name + '」'; }
      if (a.gift) { addGift(p, a.gift); text += ' → 선물 코인 ' + a.gift; }
      if (a.frame) { p.rainbow = true; text += ' → 도감 무지개 테'; }
      got.push({ text: text, charId: a.char || null });
    });
    return got;
  }

  /* ───────── 만들어요 놀이 (10-3) ───────── */
  // 주사위 10 만들기 (2단원): 세 주사위 중 두 개가 10. 남은 하나를 10에 더한다
  function makeDice() {
    var a = ri(1, 9), c = ri(1, 9);
    var faces = shuffle([a, 10 - a, c]);
    return { faces: faces, rest: c, answer: 10 + c, choices: shuffle([10 + c, 10 + c + 1, 10 + c - 1]) };
  }
  // 두 수를 골랐을 때 남은 수 (10이 아니면 null)
  function diceRest(faces, i, j) {
    if (i === j || faces[i] + faces[j] !== 10) return null;
    for (var k = 0; k < 3; k++) if (k !== i && k !== j) return faces[k];
    return null;
  }

  // 덧셈과 뺄셈 길 (4단원): 출발 수에서 카드 두 장(1단계 2장 중 1, 2단계 2장 중 1)을 지나 도착 수로.
  // 네 길 중 꼭 하나만 도착 수가 된다. 중간 수와 도착 수는 0~18
  function opText(o) { return (o > 0 ? '+ ' : '− ') + Math.abs(o); }
  function makeRoad() {
    for (var tries = 0; tries < 500; tries++) {
      var start = ri(4, 16), step1 = [], step2 = [];
      for (var k = 0; k < 2; k++) { step1.push((Math.random() < 0.5 ? 1 : -1) * ri(2, 9)); step2.push((Math.random() < 0.5 ? 1 : -1) * ri(2, 9)); }
      var ok = true, hits = [];
      step1.forEach(function (a, i) { step2.forEach(function (b, j) {
        var m = start + a, e = m + b;
        if (m < 0 || m > 18 || e < 0 || e > 18) ok = false;
        hits.push({ i: i, j: j, end: e });
      }); });
      if (!ok || step1[0] === step1[1] || step2[0] === step2[1]) continue;
      var good = hits[ri(0, 3)], same = hits.filter(function (h) { return h.end === good.end; });
      if (same.length !== 1 || good.end === start) continue;   // 출발 수로 되돌아오는 길은 너무 쉽다
      // 받아올림·받아내림이 있는 단계가 하나는 있어야 4단원답다
      var m1 = start + step1[good.i];
      var carry = function (x, o) { return Math.floor(x / 10) !== Math.floor((x + o) / 10); };
      if (!carry(start, step1[good.i]) && !carry(m1, step2[good.j])) continue;
      return { start: start, step1: step1, step2: step2, target: good.end, good: good };
    }
    return { start: 7, step1: [8, -3], step2: [-6, 5], target: 9, good: { i: 0, j: 0, end: 9 } };
  }
  function stepChoices(x, o) {
    var ans = x + o, c = [ans];
    [ans + 1, ans - 1, ans + 10, ans - 10, x - o].forEach(function (v) { if (c.length < 3 && v >= 0 && v <= 99 && c.indexOf(v) < 0) c.push(v); });
    return { answer: ans, choices: shuffle(c) };
  }

  // 명령어 만들기 (6단원): 1~100 수판에서 「앞으로 □칸」과 「뒤로 □칸」 카드를 하나씩 골라 깃발 칸으로.
  // 받아올림·받아내림 없는 두 자리 수 계산. 앞으로 2장 × 뒤로 2장 중 하나만 맞는다
  function noCarryAdd(a, b) { return a % 10 + b % 10 <= 9 && a + b <= 99; }
  function noBorrowSub(a, b) { return a % 10 >= b % 10 && a - b >= 1; }
  function makeCommand() {
    for (var tries = 0; tries < 1000; tries++) {
      var start = ri(11, 45), fw = [ri(12, 45), ri(12, 45)], bw = [ri(11, 34), ri(11, 34)];
      if (fw[0] === fw[1] || bw[0] === bw[1]) continue;
      var ends = [], ok = true;
      fw.forEach(function (f, i) { bw.forEach(function (b, j) {
        var m = start + f;
        if (!noCarryAdd(start, f) || !noBorrowSub(m, b)) ok = false;
        ends.push({ i: i, j: j, end: m - b });
      }); });
      if (!ok) continue;
      var good = ends[ri(0, 3)];
      if (ends.filter(function (e) { return e.end === good.end; }).length !== 1 || good.end === start) continue;
      return { start: start, fw: fw, bw: bw, target: good.end, good: good };
    }
    return { start: 15, fw: [23, 31], bw: [12, 21], target: 26, good: { i: 0, j: 0, end: 26 } };
  }

  return { towerTheme: towerTheme, towerTypes: towerTypes, addGift: addGift, bookCount: bookCount, checkBook: checkBook,
    achDone: achDone, achProgress: achProgress, record: record,
    makeDice: makeDice, diceRest: diceRest, makeRoad: makeRoad, opText: opText, stepChoices: stepChoices,
    makeCommand: makeCommand, noCarryAdd: noCarryAdd, noBorrowSub: noBorrowSub };
})();

if (typeof module !== 'undefined') module.exports = G.Challenge;
