/* 뽑기·자동 합성·수집 기록 (기획서 5·6·7장) */
var G = globalThis.G || (globalThis.G = {});

G.Collection = (function () {
  var uidSeq = 1;

  function newRun(level) {
    var D = G.difficulty(level);
    return {
      difficulty: D.level,
      tickets: G.CONFIG.startTickets,
      rounds: D.unlimited ? [] : [makeRound(D.level, 'first')],   // 앞으로 풀 문제 묶음들 (맨 앞부터 푼다)
      roster: [],              // 현재 보유 캐릭터 [{uid, id}]
      gainedByGrade: { normal: 0, epic: 0, unique: 0, legendary: 0 }, // 이번 모험에서 얻은 수 (뽑기+합성)
      solved: 0, wrong: 0
    };
  }
  /* ───────── 준비 시간 문제 묶음 ───────── */
  function makeRound(level, kind) {
    var r = G.roundRule(level, kind);
    return { kind: kind, left: r.count, need: r.need, reward: r.reward, inGroup: 0, groupOk: true };
  }
  function addRound(run, kind) {
    if (G.difficulty(run.difficulty).unlimited) return null;
    var r = makeRound(run.difficulty, kind); run.rounds.push(r); return r;
  }
  function problemsLeft(run) {
    if (G.difficulty(run.difficulty).unlimited) return Infinity;
    return run.rounds.reduce(function (s, r) { return s + r.left; }, 0);
  }
  // 문제 하나에 답했을 때: 맞혀도 틀려도 1문제 줄고, 묶음을 모두 맞혔을 때만 뽑기권
  function answer(run, correct) {
    var out = { tickets: 0, groupDone: false, groupOk: false };
    if (G.difficulty(run.difficulty).unlimited) { if (correct) { run.tickets++; out.tickets = 1; } return out; }
    var r = run.rounds[0];
    if (!r) return out;
    r.left--; r.inGroup++;
    r.marks = (r.marks || []).concat(correct ? 1 : 0);
    if (!correct) r.groupOk = false;
    if (r.inGroup >= r.need || r.left <= 0) {
      out.groupDone = true; out.groupOk = r.groupOk && r.inGroup >= r.need;
      if (out.groupOk) { run.tickets += r.reward; out.tickets = r.reward; }
      r.inGroup = 0; r.groupOk = true; r.marks = [];
    }
    if (r.left <= 0) run.rounds.shift();
    return out;
  }

  function newBook() {
    return { found: {}, everOwned: {} }; // found[id]=true, everOwned[id]=누적 획득 수
  }

  // 등급 뽑기: 67 / 25 / 7 / 1
  function rollGrade(rand) {
    var r = (rand !== undefined ? rand : Math.random()) * 100, acc = 0, gs = G.CONFIG.grades;
    for (var i = 0; i < gs.length; i++) { acc += gs[i].rate; if (r < acc) return gs[i].key; }
    return gs[gs.length - 1].key;
  }
  function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }

  function addUnit(run, book, charId) {
    var c = G.charById(charId);
    var isNew = !book.found[charId];
    book.found[charId] = true;
    book.everOwned[charId] = (book.everOwned[charId] || 0) + 1;
    run.gainedByGrade[c.grade]++;
    var u = { uid: uidSeq++, id: charId };
    run.roster.push(u);
    return { unit: u, isNew: isNew };
  }

  // 뽑기권 1개 → 캐릭터 1명 (같은 캐릭터가 다시 나올 수 있음)
  function draw(run, book) {
    if (run.tickets <= 0) return null;
    run.tickets--;
    var grade = rollGrade();
    var charId = pickRandom(G.charsOfGrade(grade)).id;
    var r = addUnit(run, book, charId);
    return { charId: charId, grade: grade, isNew: r.isNew, uid: r.unit.uid };
  }

  function countGrade(run, grade) {
    return run.roster.filter(function (u) { return G.charById(u.id).grade === grade; }).length;
  }
  function nextGrade(grade) {
    var i = G.gradeIndex(grade);
    return i >= 0 && i < G.CONFIG.grades.length - 1 ? G.CONFIG.grades[i + 1].key : null;
  }

  // 합성 결과: 아직 발견하지 못한 캐릭터를 우선, 모두 발견했으면 전체에서 무작위
  function pickMergeResult(book, grade) {
    var all = G.charsOfGrade(grade);
    var unfound = all.filter(function (c) { return !book.found[c.id]; });
    return pickRandom(unfound.length ? unfound : all).id;
  }

  // 한 번 합성: 해당 등급 재료를 정확히 정해진 수만큼 소모하고 상위 등급 1명 생성
  function mergeOnce(run, book, grade) {
    var need = G.CONFIG.merge[grade], up = nextGrade(grade);
    if (!need || !up) return null;
    var mats = [];
    for (var i = 0; i < run.roster.length && mats.length < need; i++) {
      if (G.charById(run.roster[i].id).grade === grade) mats.push(run.roster[i]);
    }
    if (mats.length < need) return null;
    var matUids = mats.map(function (u) { return u.uid; });
    run.roster = run.roster.filter(function (u) { return matUids.indexOf(u.uid) < 0; });
    var resultId = pickMergeResult(book, up);
    var r = addUnit(run, book, resultId);   // 수집 기록(found)은 재료가 사라져도 그대로 남는다
    return { from: grade, to: up, materials: mats.map(function (u) { return u.id; }), result: resultId, isNew: r.isNew, uid: r.unit.uid };
  }

  // 자동 합성: 낮은 등급부터 조건을 만족하는 만큼 연속 합성
  function autoMerge(run, book) {
    var events = [], order = ['normal', 'epic', 'unique'];
    for (var g = 0; g < order.length; g++) {
      var ev;
      while ((ev = mergeOnce(run, book, order[g]))) events.push(ev);
    }
    return events;
  }

  function mergeableInfo(run) {
    var out = [];
    ['normal', 'epic', 'unique'].forEach(function (g) {
      var n = countGrade(run, g), need = G.CONFIG.merge[g];
      out.push({ grade: g, have: n, need: need, times: Math.floor(n / need) });
    });
    return out;
  }

  // 출전 선택: 전투력이 높은 순서로 최대 8명
  function lineup(run) {
    return run.roster.slice().sort(function (a, b) { return G.unitPower(b.id) - G.unitPower(a.id) || a.uid - b.uid; })
      .slice(0, G.CONFIG.maxLineup);
  }
  function teamPower(run) {
    return lineup(run).reduce(function (s, u) { return s + G.unitPower(u.id); }, 0);
  }

  // 자동 검사: 합성 재료가 정확히 소모되는지, 노말 45명 → 레전더리 1명이 되는지
  function selfTest() {
    var results = [];
    var run = newRun(), book = newBook();
    var normals = G.charsOfGrade('normal');
    for (var i = 0; i < 45; i++) addUnit(run, book, normals[i % normals.length].id);
    var ev = autoMerge(run, book);
    var c = { normal: countGrade(run, 'normal'), epic: countGrade(run, 'epic'), unique: countGrade(run, 'unique'), legendary: countGrade(run, 'legendary') };
    results.push({ name: '노말 45명 → 에픽 9 → 유니크 3 → 레전더리 1', pass: c.normal === 0 && c.epic === 0 && c.unique === 0 && c.legendary === 1 && ev.length === 9 + 3 + 1 && run.roster.length === 1 });

    run = newRun(); book = newBook();
    for (i = 0; i < 4; i++) addUnit(run, book, 'n1');
    var ev2 = autoMerge(run, book);
    results.push({ name: '노말 4명은 합성되지 않음', pass: ev2.length === 0 && run.roster.length === 4 });
    addUnit(run, book, 'n7');
    ev2 = autoMerge(run, book);
    results.push({ name: '종류가 달라도 노말 5명 → 에픽 1명', pass: ev2.length === 1 && run.roster.length === 1 && G.charById(run.roster[0].id).grade === 'epic' });
    results.push({ name: '합성 후에도 수집 기록 유지', pass: !!book.found.n1 && !!book.found.n7 });

    run = newRun(); book = newBook();
    for (i = 0; i < 7; i++) addUnit(run, book, 'e1');
    ev2 = autoMerge(run, book);
    results.push({ name: '에픽 7명 → 유니크 2명 + 에픽 1명', pass: countGrade(run, 'unique') === 2 && countGrade(run, 'epic') === 1 && run.roster.length === 3 });

    run = newRun(); book = newBook();
    for (i = 0; i < 5; i++) addUnit(run, book, 'l1');
    ev2 = autoMerge(run, book);
    results.push({ name: '레전더리는 더 이상 합성하지 않음', pass: ev2.length === 0 && countGrade(run, 'legendary') === 5 });

    // 합성 결과는 아직 발견하지 못한 캐릭터 우선
    run = newRun(); book = newBook();
    var epics = G.charsOfGrade('epic'), okUnfound = true;
    for (var k = 0; k < epics.length; k++) {
      for (i = 0; i < 5; i++) addUnit(run, book, 'n1');
      var e = autoMerge(run, book)[0];
      if (!e.isNew) okUnfound = false;
    }
    results.push({ name: '합성 결과는 발견하지 못한 캐릭터 우선 (에픽 6명 모두 새로 발견)', pass: okUnfound });

    // 확률 검사
    var cnt = { normal: 0, epic: 0, unique: 0, legendary: 0 }, N = 200000;
    for (i = 0; i < N; i++) cnt[rollGrade()]++;
    var near = function (k, p) { return Math.abs(cnt[k] / N * 100 - p) < 0.6; };
    results.push({ name: '뽑기 확률 67 / 25 / 7 / 1 (' + ['normal', 'epic', 'unique', 'legendary'].map(function (k) { return (cnt[k] / N * 100).toFixed(1); }).join(' / ') + ')',
      pass: near('normal', 67) && near('epic', 25) && near('unique', 7) && near('legendary', 1) });
    var gsum = G.CONFIG.grades.reduce(function (s, g) { return s + g.rate; }, 0);
    results.push({ name: '확률 합계 100', pass: gsum === 100 });
    var counts = ['normal', 'epic', 'unique', 'legendary'].map(function (g) { return G.charsOfGrade(g).length; });
    results.push({ name: '등급별 캐릭터 수 ' + counts.join(' / ') + ' (모든 등급에 여러 명)', pass: counts.every(function (n) { return n >= 2; }) && counts[3] >= 4 });
    return results;
  }

  // 이어하기로 불러온 뒤: 새 캐릭터 번호가 기존 번호와 겹치지 않게 맞춘다
  function restore(run) {
    var max = 0;
    run.roster.forEach(function (u) { if (u.uid > max) max = u.uid; });
    if (uidSeq <= max) uidSeq = max + 1;
    if (!run.difficulty) run.difficulty = G.CONFIG.defaultDifficulty;
    // 예전 저장(남은 문제 수 방식)을 새 묶음 방식으로 바꾼다
    if (!Array.isArray(run.rounds)) {
      run.rounds = [];
      if (!G.difficulty(run.difficulty).unlimited && run.quota > 0) run.rounds.push({ kind: 'retry', left: run.quota, need: 1, reward: 1, inGroup: 0, groupOk: true });
    }
    delete run.quota; delete run.setProgress;
    return run;
  }

  return { newRun: newRun, restore: restore, addRound: addRound, answer: answer, problemsLeft: problemsLeft, newBook: newBook, draw: draw, autoMerge: autoMerge, mergeOnce: mergeOnce, mergeableInfo: mergeableInfo,
           countGrade: countGrade, lineup: lineup, teamPower: teamPower, rollGrade: rollGrade, addUnit: addUnit, selfTest: selfTest };
})();
