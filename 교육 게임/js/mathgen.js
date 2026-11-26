/* 문제 만들기 (PRD 3-2, 3-3)
 * 유형 코드 A1~C2 별로 문제를 만들고, 1학년이 자주 하는 실수로 오답 보기를 만든다.
 * 화면과 상관없는 순수 계산만 있어서 node 로 검사할 수 있다 (tests/check-math.js).
 */
var G = globalThis.G || (globalThis.G = {});

G.MathGen = (function () {
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }   // a 이상 b 이하 정수

  /* 문제 하나: { type, text, answer, nums, op, wrongs[] }
   * text 는 화면에 그대로 쓰는 식. 빈칸 문제는 □ 를 쓴다. */
  var MAKERS = {
    // 세 수의 덧셈 (합 9 이하, 0 없이)
    A1: function () {
      var a, b, c;
      do { a = ri(1, 7); b = ri(1, 7); c = ri(1, 7); } while (a + b + c > 9);
      var s = a + b + c;
      return { text: a + ' + ' + b + ' + ' + c, answer: s, nums: [a, b, c], op: '++',
        wrongs: [s - 1, s + 1, a + b, b + c] };
    },
    // 세 수의 뺄셈 (9 이하에서, 답 0 이상)
    A2: function () {
      var a, b, c;
      do { a = ri(4, 9); b = ri(1, 5); c = ri(1, 5); } while (a - b - c < 0);
      var d = a - b - c;
      return { text: a + ' − ' + b + ' − ' + c, answer: d, nums: [a, b, c], op: '--',
        wrongs: [d + 1, d - 1, a - b, a - c, a - b + c] };
    },
    // 10이 되는 더하기: a + □ = 10
    A3: function () {
      var a = ri(1, 9), x = 10 - a;
      return { text: a + ' + □ = 10', answer: x, nums: [a], op: 'blank+',
        wrongs: [x + 1, x - 1, a, 10 + a] };
    },
    // 10에서 빼기
    A4: function () {
      var a = ri(1, 9), d = 10 - a;
      return { text: '10 − ' + a, answer: d, nums: [10, a], op: '-',
        wrongs: [d + 1, d - 1, 10 + a, a] };
    },
    // 10을 만들어 더하기: 앞 두 수 또는 뒤 두 수가 10
    A5: function () {
      var t = ri(1, 9), o = 10 - t, c = ri(1, 9), front = Math.random() < 0.5;
      var nums = front ? [t, o, c] : [c, t, o], s = t + o + c;
      return { text: nums.join(' + '), answer: s, nums: nums, op: '++',
        wrongs: [s - 1, s + 1, c, 10 + c - 1, s - 10] };
    },
    // 받아올림 있는 (몇)+(몇): 합 11~18
    B1: function () {
      var a, b;
      do { a = ri(2, 9); b = ri(2, 9); } while (a + b < 11);
      var s = a + b;
      return { text: a + ' + ' + b, answer: s, nums: [a, b], op: '+',
        wrongs: [s - 1, s + 1, s % 10, s - 10 + 1] };
    },
    // 여러 가지 덧셈: 같은 수에 더하는 수를 하나씩 키운다 (규칙 찾기). 한 문제씩 따로 낸다
    B2: function () {
      var a = ri(6, 9), b = ri(11 - a, 9), s = a + b;
      return { text: a + ' + ' + b, answer: s, nums: [a, b], op: '+', pattern: a,
        wrongs: [s - 1, s + 1, s % 10] };
    },
    // 받아내림 있는 (십몇)−(몇): 일의 자리끼리 뺄 수 없는 것
    B3: function () {
      var a, b;
      do { a = ri(11, 18); b = ri(2, 9); } while (b <= a % 10 || a - b < 2);
      var d = a - b, ones = a % 10;
      return { text: a + ' − ' + b, answer: d, nums: [a, b], op: '-',
        wrongs: [d + 1, d - 1, 10 + (b - ones), d + 10, a + b] };   // 거꾸로 뺌, 십의 자리 그대로
    },
    // 여러 가지 뺄셈: 같은 수에서 빼는 수를 하나씩 키운다
    B4: function () {
      var a = ri(12, 17), b = ri(a - 9, 9);
      if (b <= a % 10) b = a % 10 + 1;
      var d = a - b;
      return { text: a + ' − ' + b, answer: d, nums: [a, b], op: '-', pattern: a,
        wrongs: [d + 1, d - 1, 10 + (b - a % 10)] };
    },
    // 받아올림 없는 두 자리 덧셈: (몇십몇)+(몇) 또는 (몇십몇)+(몇십몇)
    C1: function () {
      var a, b, two = Math.random() < 0.6;
      do {
        a = ri(11, 88);
        b = two ? ri(11, 88) : ri(1, 8);
      } while ((a % 10) + (b % 10) > 9 || a + b > 99 || a % 10 === 0);
      var s = a + b, wr = [s + 1, s - 1, s + 10, s - 10];
      if (!two) wr.push(a + b * 10);   // 자리를 섞어 더함 (34 + 5 → 84)
      return { text: a + ' + ' + b, answer: s, nums: [a, b], op: '+', wrongs: wr };
    },
    // 받아내림 없는 두 자리 뺄셈
    C2: function () {
      var a, b, two = Math.random() < 0.6;
      do {
        a = ri(21, 99);
        b = two ? ri(11, a - 10) : ri(1, 8);
      } while ((a % 10) < (b % 10) || a - b < 1);
      var d = a - b;
      return { text: a + ' − ' + b, answer: d, nums: [a, b], op: '-', wrongs: [d + 1, d - 1, d + 10, d - 10, a + b] };
    }
  };

  // 보기 만들기: 정답 + 오답 (count 개). 오답이 0보다 작거나 겹치면 하나 차이 숫자로 채운다
  function makeChoices(p, count) {
    var out = [p.answer], pool = p.wrongs.slice().sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < pool.length && out.length < count; i++) {
      var w = pool[i];
      if (w >= 0 && w <= 99 && out.indexOf(w) < 0) out.push(w);
    }
    for (var k = 1; out.length < count; k++) {
      if (out.indexOf(p.answer + k) < 0 && p.answer + k <= 99) out.push(p.answer + k);
      if (out.length < count && p.answer - k >= 0 && out.indexOf(p.answer - k) < 0) out.push(p.answer - k);
    }
    return out.sort(function (x, y) { return x - y; });
  }

  // 바로 앞 문제와 같은 식은 다시 내지 않는다
  var last = '';
  function make(types, choiceCount) {
    var p, tries = 0;
    do {
      var type = types[Math.floor(Math.random() * types.length)];
      p = MAKERS[type]();
      p.type = type;
    } while (p.text === last && ++tries < 20);
    last = p.text;
    p.choices = makeChoices(p, choiceCount || 3);
    return p;
  }

  /* 식 고르기 (3-3, 스테이지 8): 「답이 34인 식은?」 보기 3개가 식이다.
   * 오답 식은 같은 유형에서 답이 다르고, 정답과 20 이내로 가까운 것을 고른다 */
  function makePick(types) {
    var p = make(types, 3), exprs = [{ text: p.text, ans: p.answer }], tries = 0;
    while (exprs.length < 3 && tries++ < 400) {
      var q = MAKERS[p.type]();
      if (q.answer === p.answer || Math.abs(q.answer - p.answer) > 20) continue;
      if (exprs.some(function (e) { return e.text === q.text || e.ans === q.answer; })) continue;
      exprs.push({ text: q.text, ans: q.answer });
    }
    while (exprs.length < 3) { var r = MAKERS[p.type](); if (r.answer !== p.answer && !exprs.some(function (e) { return e.ans === r.answer; })) exprs.push({ text: r.text, ans: r.answer }); }
    exprs.sort(function () { return Math.random() - 0.5; });
    p.pick = true; p.exprs = exprs;
    return p;
  }


  /* ───────── 식 세우기 · 문장제 (2026-11-26, 교과서 2·4·6단원 상황) ─────────
   * 문장제(story): 글을 읽고 답(수)을 구한다. 높은 난이도에서 나온다.
   * 식 세우기(setup): 그림과 짧은 글을 보고 알맞은 식을 보기 3개 중에서 고른다.
   * 상황: add(더 가져옴·첨가) / join(합치기·합병) / take(덜어 냄·제거) / cmp(비교) / three(세 수) / three-(세 수 빼기) / ten(10 만들기) / from10(10에서 빼기)
   * 문제: { type: 'W1'~'W3'(문장제) | 'E1'~'E3'(식 세우기), unit, kind, story, ask, icon, nums, op, answer, wrongs, expr } */
  var SITU = {
    1: [
      { kind: 'three', icon: '🏹', make: function () { var a, b, c; do { a = ri(1, 6); b = ri(1, 6); c = ri(1, 6); } while (a + b + c > 9); return [a, b, c]; },
        story: function (n) { return '투호 놀이를 했어요. 세미는 ' + n[0] + '개, 재현이는 ' + n[1] + '개, 나는 ' + n[2] + '개를 넣었어요.'; }, ask: '모두 몇 개를 넣었나요?' },
      { kind: 'three', icon: '🏹', make: function () { var t = ri(1, 9), c = ri(1, 9); return [t, 10 - t, c]; },
        story: function (n) { return '투호 놀이를 했어요. 세미는 ' + n[0] + '개, 재현이는 ' + n[1] + '개, 나는 ' + n[2] + '개를 넣었어요.'; }, ask: '모두 몇 개를 넣었나요?' },
      { kind: 'three-', icon: '🍪', make: function () { var a, b, c; do { a = ri(5, 9); b = ri(1, 4); c = ri(1, 4); } while (a - b - c < 1); return [a, b, c]; },
        story: function (n) { return '쿠키가 ' + n[0] + '개 있었어요. 내가 ' + n[1] + '개, 동생이 ' + n[2] + '개를 먹었어요.'; }, ask: '남은 쿠키는 몇 개인가요?' },
      { kind: 'ten', icon: '🍬', make: function () { return [ri(1, 9)]; },
        story: function (n) { return '사탕이 ' + n[0] + '개 있어요. 사탕 10개를 모으고 싶어요.'; }, ask: '몇 개가 더 있어야 하나요?' },
      { kind: 'from10', icon: '🎈', make: function () { return [10, ri(1, 9)]; },
        story: function (n) { return '풍선 10개 중에서 ' + n[1] + '개가 터졌어요.'; }, ask: '남은 풍선은 몇 개인가요?' }
    ],
    2: [
      { kind: 'add', icon: '🥛', make: function () { var a, b; do { a = ri(3, 9); b = ri(2, 9); } while (a + b < 11); return [a, b]; },
        story: function (n) { return '우유갑이 ' + n[0] + '개 있었는데 ' + n[1] + '개를 더 가져왔어요.'; }, ask: '우유갑은 모두 몇 개인가요?' },
      { kind: 'join', icon: '🍓', icon2: '🍇', make: function () { var a, b; do { a = ri(3, 9); b = ri(2, 9); } while (a + b < 11); return [a, b]; },
        story: function (n) { return '딸기 맛 요구르트가 ' + n[0] + '병, 포도 맛 요구르트가 ' + n[1] + '병 있어요.'; }, ask: '요구르트는 모두 몇 병인가요?' },
      { kind: 'take', icon: '🎴', make: function () { var a, b; do { a = ri(11, 18); b = ri(2, 9); } while (b <= a % 10 || a - b < 2); return [a, b]; },
        story: function (n) { return '딱지가 ' + n[0] + '장 있었는데 ' + n[1] + '장을 잃었어요.'; }, ask: '남은 딱지는 몇 장인가요?' },
      { kind: 'cmp', icon: '🔴', icon2: '🔵', make: function () { var a, b; do { a = ri(11, 18); b = ri(2, 9); } while (b <= a % 10 || a - b < 2); return [a, b]; },
        story: function (n) { return '빨간 구슬은 ' + n[0] + '개, 파란 구슬은 ' + n[1] + '개예요.'; }, ask: '빨간 구슬은 파란 구슬보다 몇 개 더 많나요?' }
    ],
    3: [
      { kind: 'join', icon: '🔮', make: function () { var a, b; do { a = ri(11, 68); b = Math.random() < 0.5 ? ri(1, 8) : ri(10, 30); } while (a % 10 + b % 10 > 9 || a + b > 99); return [a, b]; },
        story: function (n) { return '형은 구슬을 ' + n[0] + '개, 나는 ' + n[1] + '개 가지고 있어요.'; }, ask: '구슬은 모두 몇 개인가요?' },
      { kind: 'add', icon: '🪨', make: function () { var a, b; do { a = ri(20, 60); b = Math.random() < 0.5 ? ri(1, 8) : ri(1, 3) * 10; } while (a % 10 + b % 10 > 9 || a + b > 99); return [a, b]; },
        story: function (n) { return '공깃돌이 ' + n[0] + '개 있었는데 ' + n[1] + '개를 더 가져왔어요.'; }, ask: '공깃돌은 모두 몇 개인가요?' },
      { kind: 'take', icon: '📄', make: function () { var a, b; do { a = ri(21, 89); b = Math.random() < 0.5 ? ri(1, 8) : ri(11, a - 10); } while (a % 10 < b % 10); return [a, b]; },
        story: function (n) { return '색종이 ' + n[0] + '장 중에서 ' + n[1] + '장을 썼어요.'; }, ask: '남은 색종이는 몇 장인가요?' },
      { kind: 'cmp', icon: '🪢', make: function () { var a, b; do { a = ri(30, 89); b = ri(11, a - 10); } while (a % 10 < b % 10); return [a, b]; },
        story: function (n) { return '줄넘기를 나는 ' + n[0] + '번, 친구는 ' + n[1] + '번 했어요.'; }, ask: '나는 친구보다 몇 번 더 많이 했나요?' }
    ]
  };
  // 상황 → 식, 답
  function exprOf(kind, n) {
    if (kind === 'three') return { text: n[0] + ' + ' + n[1] + ' + ' + n[2], ans: n[0] + n[1] + n[2], op: '++' };
    if (kind === 'three-') return { text: n[0] + ' − ' + n[1] + ' − ' + n[2], ans: n[0] - n[1] - n[2], op: '--' };
    if (kind === 'ten') return { text: n[0] + ' + □ = 10', ans: 10 - n[0], op: 'blank+' };
    if (kind === 'from10') return { text: '10 − ' + n[1], ans: 10 - n[1], op: '-' };
    if (kind === 'add' || kind === 'join') return { text: n[0] + ' + ' + n[1], ans: n[0] + n[1], op: '+' };
    return { text: n[0] + ' − ' + n[1], ans: n[0] - n[1], op: '-' };   // take, cmp
  }
  // 식 세우기 오답 식: 덧셈·뺄셈 바꿈, 수 하나 잘못 읽음, 수 하나 빠뜨림 (답이 정답과 달라야 한다)
  function wrongExprs(kind, n) {
    var a = n[0], b = n[1], c = n[2], out = [];
    if (kind === 'three') out = [{ text: a + ' + ' + b + ' − ' + c, ans: a + b - c }, { text: a + ' + ' + b, ans: a + b }, { text: a + ' + ' + c, ans: a + c }, { text: a + ' + ' + b + ' + ' + (c + 1), ans: a + b + c + 1 }];
    else if (kind === 'three-') out = [{ text: a + ' − ' + b + ' + ' + c, ans: a - b + c }, { text: a + ' + ' + b + ' + ' + c, ans: a + b + c }, { text: a + ' − ' + b, ans: a - b }];
    else if (kind === 'ten') out = [{ text: a + ' + 10', ans: a + 10 }, { text: '10 + □ = ' + a, ans: a - 10 }, { text: (a + 1) + ' + □ = 10', ans: 9 - a }];
    else if (kind === 'from10') out = [{ text: '10 + ' + b, ans: 10 + b }, { text: b + ' − 1', ans: b - 1 }, { text: '10 − ' + (b === 9 ? 8 : b + 1), ans: 10 - (b === 9 ? 8 : b + 1) }];
    else if (kind === 'add' || kind === 'join') out = [{ text: Math.max(a, b) + ' − ' + Math.min(a, b), ans: Math.abs(a - b) }, { text: a + ' + ' + (b + 1), ans: a + b + 1 }, { text: (a + 10) + ' + ' + b, ans: a + 10 + b }];
    else out = [{ text: a + ' + ' + b, ans: a + b }, { text: a + ' − ' + (b - 1), ans: a - b + 1 }, { text: (a - 10 > 0 ? a - 10 : a + 1) + ' − ' + b, ans: (a - 10 > 0 ? a - 10 : a + 1) - b }];
    return out;
  }
  function makeWord(unit, mode) {
    var list = SITU[unit] || SITU[1], S = list[Math.floor(Math.random() * list.length)], n = S.make(), e = exprOf(S.kind, n);
    var p = { type: (mode === 'setup' ? 'E' : 'W') + unit, unit: unit, kind: S.kind, word: mode, icon: S.icon, icon2: S.icon2 || null,
      story: S.story(n), ask: S.ask, nums: n.slice(), op: e.op, answer: e.ans, expr: e.text };
    if (S.kind === 'ten') p.nums = [n[0]];
    if (S.kind === 'from10') p.nums = [10, n[1]];
    var w = wrongExprs(S.kind, n);
    p.wrongs = w.map(function (x) { return x.ans; }).concat([e.ans + 1, e.ans - 1, e.ans + 10]);
    p.text = p.story;
    if (mode === 'setup') {
      var exprs = [{ text: e.text, ans: e.ans }];
      w.sort(function () { return Math.random() - 0.5; }).forEach(function (x) { if (exprs.length < 3 && x.ans >= 0 && !exprs.some(function (y) { return y.ans === x.ans || y.text === x.text; })) exprs.push(x); });
      exprs.sort(function () { return Math.random() - 0.5; });
      p.setup = true; p.pick = true; p.exprs = exprs;
    }
    p.choices = makeChoices(p, 3);
    return p;
  }

  return { make: make, makePick: makePick, makeWord: makeWord, exprOf: exprOf, SITU: SITU, MAKERS: MAKERS, makeChoices: makeChoices, TYPES: Object.keys(MAKERS) };
})();

if (typeof module !== 'undefined') module.exports = G.MathGen;
