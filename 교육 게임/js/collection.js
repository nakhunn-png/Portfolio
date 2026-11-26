/* 냠냠 코인·뽑기·합성·출전 칸·도감 기록 (PRD 5, 6장)
 * 등급 뽑기와 합성 규칙은 1편 nyam-defense/js/collection.js 와 같다. */
var G = globalThis.G || (globalThis.G = {});

G.Collection = (function () {
  var uidSeq = 1;
  var ORDER = ['normal', 'epic', 'unique', 'legendary', 'hidden'];

  function newBook() { return { found: {}, count: {} }; }   // found[id]=true, count[id]=누적 얻은 수

  // slotCount: 출전 칸 수 (기본 8, 도감 20종 보상을 받으면 9)
  function newRun(slotCount) {
    var slots = []; for (var i = 0; i < (slotCount || G.CONFIG.slots); i++) slots.push(null);
    return { coins: 0, combo: 0, bestCombo: 0, roster: [], slots: slots,
      correct: 0, wrong: 0, wrongTypes: {} };
  }
  function addCoins(run, n) { run.coins += n; }
  // 2026-11-26 친구 이어 가기: 저장해 둘 팀 { slots: 칸마다 캐릭터 id 또는 null, bench: 칸에 못 선 친구 id }
  function saveTeam(run) {
    var onSlot = {};
    var slots = run.slots.map(function (uid) { if (!uid) return null; onSlot[uid] = true; for (var i = 0; i < run.roster.length; i++) if (run.roster[i].uid === uid) return run.roster[i].id; return null; });
    return { slots: slots, bench: run.roster.filter(function (u) { return !onSlot[u.uid]; }).map(function (u) { return u.id; }) };
  }
  function loadTeam(run, team) {
    if (!team) return;
    (team.slots || []).forEach(function (id, i) { if (!id || !G.charById(id)) return; var u = { uid: uidSeq++, id: id }; run.roster.push(u); if (i < run.slots.length) run.slots[i] = u.uid; });
    (team.bench || []).forEach(function (id) { if (G.charById(id)) run.roster.push({ uid: uidSeq++, id: id }); });
    fillSlots(run);
  }

  // 문제 하나에 답함 → 얻은 코인
  function answer(run, correct, type) {
    var C = G.CONFIG.coin;
    if (!correct) { run.wrong++; run.combo = 0; if (type) run.wrongTypes[type] = (run.wrongTypes[type] || 0) + 1; return 0; }
    run.correct++; run.combo++; run.bestCombo = Math.max(run.bestCombo, run.combo);
    var got = C.perCorrect + (run.combo % C.comboEvery === 0 ? C.comboBonus : 0);
    run.coins += got;
    return got;
  }

  // 등급 뽑기: 67 / 25 / 7 / 1 (히든 0)
  function rollGrade(rand) {
    var r = (rand !== undefined ? rand : Math.random()) * 100, acc = 0, gs = G.CONFIG.grades;
    for (var i = 0; i < gs.length; i++) { if (!gs[i].rate) continue; acc += gs[i].rate; if (r < acc) return gs[i].key; }
    return 'normal';
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function addUnit(run, book, charId) {
    var isNew = !book.found[charId];
    book.found[charId] = true; book.count[charId] = (book.count[charId] || 0) + 1;
    var u = { uid: uidSeq++, id: charId };
    run.roster.push(u);
    return { unit: u, isNew: isNew };
  }

  // 도감에 세지 않고 친구를 데려온다 (히든 친구가 판을 시작할 때 함께 온다)
  function addFriend(run, charId) { var u = { uid: uidSeq++, id: charId }; run.roster.push(u); fillSlots(run); return u; }

  function canDraw(run) { return run.coins >= G.CONFIG.coin.drawCost; }
  function draw(run, book) {
    if (!canDraw(run)) return null;
    run.coins -= G.CONFIG.coin.drawCost;
    var grade = rollGrade(), id = pick(G.charsOfGrade(grade)).id, r = addUnit(run, book, id);
    fillSlots(run);
    return { charId: id, grade: grade, isNew: r.isNew, uid: r.unit.uid };
  }
  /* 모두 뽑기: 출전 칸이 가득 차면 멈춘다 (2026-11-26). 칸이 차면 먼저 합성해 보고, 그래도 차 있으면 그만 뽑는다. 남은 코인은 다음에 쓴다 */
  function full(run) { return run.roster.length >= run.slots.length + (G.CONFIG.bench || 0); }   // 출전 칸 + 대기석
  function benchCount(run) { return Math.max(0, run.roster.length - run.slots.filter(Boolean).length); }
  function drawAll(run, book) {
    var out = [], merges = [], d;
    while (canDraw(run)) {
      if (full(run)) { merges = merges.concat(autoMerge(run, book)); if (full(run)) break; }
      if (!(d = draw(run, book))) break;
      out.push(d);
    }
    out.merges = merges.concat(autoMerge(run, book)); out.full = full(run);
    return out;
  }

  function gradeOf(u) { return G.charById(u.id).grade; }
  function nextGrade(g) { var i = ORDER.indexOf(g); return i >= 0 && i < 3 ? ORDER[i + 1] : null; }

  // 합성 결과는 아직 못 찾은 캐릭터를 먼저
  function mergeResult(book, grade) {
    var all = G.charsOfGrade(grade), un = all.filter(function (c) { return !book.found[c.id]; });
    return pick(un.length ? un : all).id;
  }
  // 한 번 합성: 출전 칸 밖(대기) 재료를 먼저 쓴다
  function mergeOnce(run, book, grade) {
    var need = G.CONFIG.merge[grade], up = nextGrade(grade);
    if (!need || !up) return null;
    var mats = run.roster.filter(function (u) { return gradeOf(u) === grade; });
    if (mats.length < need) return null;
    mats.sort(function (a, b) { return (run.slots.indexOf(a.uid) >= 0) - (run.slots.indexOf(b.uid) >= 0); });
    var used = mats.slice(0, need).map(function (u) { return u.uid; }), usedIds = mats.slice(0, need).map(function (u) { return u.id; });
    run.roster = run.roster.filter(function (u) { return used.indexOf(u.uid) < 0; });
    run.slots = run.slots.map(function (s) { return used.indexOf(s) >= 0 ? null : s; });
    var id = mergeResult(book, up), r = addUnit(run, book, id);
    fillSlots(run);
    return { from: grade, to: up, result: id, isNew: r.isNew, mats: usedIds };
  }
  function autoMerge(run, book) {
    var ev = [], e;
    ['normal', 'epic', 'unique'].forEach(function (g) { while ((e = mergeOnce(run, book, g))) ev.push(e); });
    return ev;
  }

  /* 출전 칸 채우기: 가장 높은 등급 8명이 나간다.
   * 이미 칸에 있는 친구는 자리를 지키고, 새로 나갈 친구는 빈 칸(또는 밀려난 친구 자리)에 선다. */
  function rank(u) { return ORDER.indexOf(gradeOf(u)) * 1000 - u.uid / 100000; }
  function fillSlots(run) {
    var best = run.roster.slice().sort(function (a, b) { return rank(b) - rank(a); }).slice(0, run.slots.length).map(function (u) { return u.uid; });
    run.slots = run.slots.map(function (s) { return best.indexOf(s) >= 0 ? s : null; });
    best.forEach(function (uid) {
      if (run.slots.indexOf(uid) >= 0) return;
      var i = run.slots.indexOf(null); if (i >= 0) run.slots[i] = uid;
    });
  }
  function swapSlots(run, i, j) { var t = run.slots[i]; run.slots[i] = run.slots[j]; run.slots[j] = t; }
  // 전투에 넘길 칸별 캐릭터 id
  function lineup(run) {
    return run.slots.map(function (uid) {
      if (!uid) return null;
      for (var i = 0; i < run.roster.length; i++) if (run.roster[i].uid === uid) return run.roster[i].id;
      return null;
    });
  }
  function countByGrade(run) {
    var o = { normal: 0, epic: 0, unique: 0, legendary: 0, hidden: 0 };
    run.roster.forEach(function (u) { o[gradeOf(u)]++; });
    return o;
  }

  return { newBook: newBook, newRun: newRun, addCoins: addCoins, answer: answer, rollGrade: rollGrade, canDraw: canDraw,
    benchCount: benchCount, saveTeam: saveTeam, loadTeam: loadTeam, draw: draw, drawAll: drawAll, full: full, mergeOnce: mergeOnce, autoMerge: autoMerge, fillSlots: fillSlots, swapSlots: swapSlots,
    lineup: lineup, countByGrade: countByGrade, addFriend: addFriend };
})();

if (typeof module !== 'undefined') module.exports = G.Collection;
