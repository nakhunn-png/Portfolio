/* 수학 문제 출제 (기획서 3장)
 * - 유형 4가지: 한+한 덧셈, 두+한 덧셈, 한-한 뺄셈, 두-한 뺄셈
 * - 정답은 19 이하, 뺄셈의 앞의 수는 18 이하, 결과는 0 이상
 * - 화면에 보여주기 전에 반드시 validate()로 검사하고, 어기면 버리고 새로 만든다.
 * - 같은 문제가 연달아 나오지 않게 한다.
 */
var G = globalThis.G || (globalThis.G = {});

G.MathGen = (function () {
  var MAX_ANSWER = 19, MAX_MINUEND = 18;
  var TYPES = ['한자리+한자리', '두자리+한자리', '한자리-한자리', '두자리-한자리'];
  var recent = [];   // 최근 문제 기록 (연달아 같은 문제 금지)

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function digits(n) { return String(n).length; }

  function raw(type) {
    var a, b;
    switch (type) {
      case 0: a = rnd(1, 9);  b = rnd(1, 9); return { a: a, b: b, op: '+' };
      case 1: a = rnd(10, 18); b = rnd(1, 9); return { a: a, b: b, op: '+' };
      case 2: a = rnd(1, 9);  b = rnd(1, 9); return { a: a, b: b, op: '-' };
      default: a = rnd(10, 18); b = rnd(1, 9); return { a: a, b: b, op: '-' };
    }
  }

  // 제한 조건 검사: 하나라도 어기면 false
  function validate(p) {
    if (!p || (p.op !== '+' && p.op !== '-')) return false;
    if (!Number.isInteger(p.a) || !Number.isInteger(p.b)) return false;
    if (p.a < 0 || p.b < 0) return false;
    var ans = p.op === '+' ? p.a + p.b : p.a - p.b;
    if (ans !== p.answer) return false;
    if (ans > MAX_ANSWER) return false;          // 정답 19 이하
    if (ans < 0) return false;                   // 음수 금지
    if (p.op === '-' && p.a > MAX_MINUEND) return false; // 뺄셈 앞의 수 18 이하
    if (digits(p.b) !== 1) return false;         // 뒤의 수는 한 자릿수
    if (digits(p.a) > 2) return false;           // 앞의 수는 한 자릿수 또는 두 자릿수
    // 선택지 3개: 서로 다르고, 정답이 꼭 하나 들어 있고, 모두 0 이상 19 이하
    if (!p.choices || p.choices.length !== 3) return false;
    var seen = {}, hasAnswer = 0;
    for (var i = 0; i < 3; i++) {
      var c = p.choices[i];
      if (!Number.isInteger(c) || c < 0 || c > MAX_ANSWER || seen[c]) return false;
      seen[c] = true;
      if (c === ans) hasAnswer++;
    }
    return hasAnswer === 1;
  }

  function makeChoices(ans) {
    var cands = [ans - 1, ans + 1, ans - 2, ans + 2, ans - 10, ans + 10, ans - 3, ans + 3]
      .filter(function (v) { return v >= 0 && v <= MAX_ANSWER && v !== ans; });
    // 가까운 수를 우선 섞어서 두 개 고른다
    var near = cands.slice(0, 4).sort(function () { return Math.random() - 0.5; });
    var far = cands.slice(4).sort(function () { return Math.random() - 0.5; });
    var pool = near.concat(far), pick = [];
    for (var i = 0; i < pool.length && pick.length < 2; i++) if (pick.indexOf(pool[i]) < 0) pick.push(pool[i]);
    var list = pick.concat([ans]);
    for (var j = list.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = list[j]; list[j] = list[k]; list[k] = t; }
    return list;
  }

  function next() {
    for (var tries = 0; tries < 1000; tries++) {
      var type = rnd(0, 3);
      var p = raw(type);
      p.type = TYPES[type];
      p.answer = p.op === '+' ? p.a + p.b : p.a - p.b;
      p.choices = makeChoices(p.answer);
      if (!validate(p)) continue;                 // 조건 위반 → 버리고 새로
      var key = p.a + p.op + p.b;
      if (recent.indexOf(key) >= 0) continue;     // 최근 문제와 같으면 새로
      recent.push(key); if (recent.length > 6) recent.shift();
      p.key = key;
      return p;
    }
    throw new Error('문제를 만들 수 없어요');
  }

  // 자동 검사: 많이 만들어 보고 규칙 위반이 하나도 없는지 확인
  function selfTest(n) {
    n = n || 20000;
    var bad = 0, typeCount = {}, prev = null, repeat = 0, maxAns = 0, maxMinuend = 0;
    for (var i = 0; i < n; i++) {
      var p = next();
      if (!validate(p)) bad++;
      if (prev && prev.key === p.key) repeat++;
      typeCount[p.type] = (typeCount[p.type] || 0) + 1;
      maxAns = Math.max(maxAns, p.answer);
      if (p.op === '-') maxMinuend = Math.max(maxMinuend, p.a);
      prev = p;
    }
    // 기획서 예시 검사
    var allowed = [[13, '+', 5], [10, '+', 9], [7, '+', 5], [18, '-', 6], [12, '-', 5], [9, '-', 4], [8, '-', 8]];
    var banned = [[13, '+', 8], [15, '+', 6], [19, '-', 5], [5, '-', 8]];
    function asProblem(t) {
      var ans = t[1] === '+' ? t[0] + t[2] : t[0] - t[2];
      var ch = [ans, ans + 1 <= 19 ? ans + 1 : ans - 2, ans - 1 >= 0 ? ans - 1 : ans + 2];
      return { a: t[0], op: t[1], b: t[2], answer: ans, choices: ch };
    }
    var exOk = allowed.every(function (t) { return validate(asProblem(t)); }) &&
               banned.every(function (t) { return !validate(asProblem(t)); });
    return { total: n, bad: bad, repeat: repeat, typeCount: typeCount, maxAnswer: maxAns, maxMinuend: maxMinuend, examplesOk: exOk,
             pass: bad === 0 && repeat === 0 && maxAns <= 19 && maxMinuend <= 18 && exOk };
  }

  /* ───────── 그림을 보고 식을 고르는 문제 ─────────
   * 그림 종류
   *   cubeDiff : 두 줄의 블록을 비교 (얼마만큼 차이가 나?)  → 큰 수 − 작은 수   예) 12 − 7
   *   beadTake : 구슬 틀에서 몇 개를 덜어 냄                → 앞의 수 − 덜어 낸 수 예) 13 − 5
   *   cubeJoin : 두 줄의 블록을 모두 합침                    → 앞의 수 + 뒤의 수
   *   beadAdd  : 구슬 틀에 구슬을 더 넣음                    → 원래 수 + 넣은 수
   * 정답 식과 보기 식은 모두 위의 숫자 규칙(정답 19 이하, 뺄셈 앞의 수 18 이하, 음수 없음)을 지킨다.
   */
  var PIC = ['cubeDiff', 'beadTake', 'cubeJoin', 'beadAdd'];
  var PIC_CHOICES = 4;   // 식 고르기 보기 수
  function exprOk(e) {
    if (!e || (e.op !== '+' && e.op !== '-')) return false;
    if (!Number.isInteger(e.a) || !Number.isInteger(e.b) || e.a < 1 || e.b < 1) return false;
    if (digits(e.b) !== 1 || digits(e.a) > 2) return false;
    var ans = e.op === '+' ? e.a + e.b : e.a - e.b;
    if (ans < 0 || ans > MAX_ANSWER) return false;
    if (e.op === '-' && e.a > MAX_MINUEND) return false;
    return true;
  }
  function sameExpr(x, y) {
    if (x.op !== y.op) return false;
    if (x.a === y.a && x.b === y.b) return true;
    return x.op === '+' && x.a === y.b && x.b === y.a;   // 덧셈은 순서를 바꿔도 같은 식
  }
  function exprText(e) { return e.a + ' ' + (e.op === '+' ? '+' : '−') + ' ' + e.b; }

  function validatePicture(p) {
    if (!p || PIC.indexOf(p.tpl) < 0) return false;
    if (!exprOk(p.expr)) return false;
    var ans = p.expr.op === '+' ? p.expr.a + p.expr.b : p.expr.a - p.expr.b;
    if (ans !== p.answer) return false;
    if ((p.tpl === 'cubeDiff' || p.tpl === 'beadTake') && p.expr.op !== '-') return false;
    if ((p.tpl === 'cubeJoin' || p.tpl === 'beadAdd') && p.expr.op !== '+') return false;
    if (p.tpl === 'cubeDiff' && p.expr.b >= p.expr.a) return false;
    if (p.tpl === 'beadTake' && p.expr.b > Math.min(p.expr.a, 10)) return false;   // 덜어 내는 구슬은 윗줄 안에서
    if (!p.exprChoices || p.exprChoices.length !== PIC_CHOICES) return false;
    var right = 0;
    for (var i = 0; i < PIC_CHOICES; i++) {
      if (!exprOk(p.exprChoices[i])) return false;
      for (var j = 0; j < i; j++) if (sameExpr(p.exprChoices[i], p.exprChoices[j])) return false;
      if (sameExpr(p.exprChoices[i], p.expr)) right++;
    }
    return right === 1;
  }

  function nextPicture() {
    for (var tries = 0; tries < 2000; tries++) {
      var tpl = PIC[rnd(0, PIC.length - 1)], a, b, op;
      if (tpl === 'cubeDiff') { a = rnd(3, 18); b = rnd(1, Math.min(9, a - 1)); op = '-'; }
      else if (tpl === 'beadTake') { a = rnd(3, 18); b = rnd(1, Math.min(9, a, 10)); op = '-'; }
      else { a = rnd(2, 15); b = rnd(1, 9); op = '+'; }
      var e = { a: a, op: op, b: b };
      if (!exprOk(e)) continue;
      // 헷갈리기 쉬운 보기: 기호를 바꾼 식, 숫자 하나가 다른 식, (뺄셈) 거꾸로 뺀 결과로 빼는 식
      var c = op === '-'
        ? [{ a: a, op: '+', b: b }, { a: a, op: '-', b: a - b }, { a: a, op: '-', b: b + 1 }, { a: a, op: '-', b: b - 1 }, { a: a + 1, op: '-', b: b }, { a: a - 1, op: '-', b: b }]
        : [{ a: a, op: '-', b: b }, { a: a, op: '+', b: b + 1 }, { a: a, op: '+', b: b - 1 }, { a: a + 1, op: '+', b: b }, { a: a - 1, op: '+', b: b }];
      c = c.filter(exprOk).filter(function (x) { return !sameExpr(x, e); });
      var swap = c.length && c[0].op !== op ? [c.shift()] : [];
      c.sort(function () { return Math.random() - 0.5; });
      var picks = swap.concat(c);
      var list = [];
      for (var i = 0; i < picks.length && list.length < PIC_CHOICES - 1; i++) if (!list.some(function (x) { return sameExpr(x, picks[i]); })) list.push(picks[i]);
      if (list.length < PIC_CHOICES - 1) continue;   // 헷갈리는 보기를 3개 만들 수 없으면 다른 문제로
      list.push(e);
      list.sort(function () { return Math.random() - 0.5; });
      var p = { kind: 'picture', tpl: tpl, expr: e, a: a, op: op, b: b, answer: op === '+' ? a + b : a - b, exprChoices: list, type: '그림 보고 식 만들기' };
      if (!validatePicture(p)) continue;
      var key = tpl + a + op + b;
      if (recent.indexOf(key) >= 0) continue;
      recent.push(key); if (recent.length > 6) recent.shift();
      p.key = key;
      return p;
    }
    throw new Error('그림 문제를 만들 수 없어요');
  }

  function pictureSelfTest(n) {
    n = n || 20000;
    var bad = 0, tplCount = {};
    for (var i = 0; i < n; i++) { var p = nextPicture(); if (!validatePicture(p)) bad++; tplCount[p.tpl] = (tplCount[p.tpl] || 0) + 1; }
    // 보내 주신 예시: 블록 12와 7 비교 → 12 − 7 / 구슬 13개에서 5개 덜어 냄 → 13 − 5
    var ex1 = { tpl: 'cubeDiff', expr: { a: 12, op: '-', b: 7 }, answer: 5, exprChoices: [{ a: 12, op: '-', b: 7 }, { a: 12, op: '+', b: 7 }, { a: 12, op: '-', b: 5 }, { a: 12, op: '-', b: 8 }] };
    var ex2 = { tpl: 'beadTake', expr: { a: 13, op: '-', b: 5 }, answer: 8, exprChoices: [{ a: 13, op: '-', b: 5 }, { a: 13, op: '+', b: 5 }, { a: 13, op: '-', b: 8 }, { a: 14, op: '-', b: 5 }] };
    return { total: n, bad: bad, tplCount: tplCount, examplesOk: validatePicture(ex1) && validatePicture(ex2), pass: bad === 0 && Object.keys(tplCount).length === 4 && validatePicture(ex1) && validatePicture(ex2) };
  }

  return { next: next, validate: validate, selfTest: selfTest,
           nextPicture: nextPicture, validatePicture: validatePicture, pictureSelfTest: pictureSelfTest,
           exprOk: exprOk, sameExpr: sameExpr, exprText: exprText };
})();
