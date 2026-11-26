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

  return { make: make, makePick: makePick, MAKERS: MAKERS, makeChoices: makeChoices, TYPES: Object.keys(MAKERS) };
})();

if (typeof module !== 'undefined') module.exports = G.MathGen;
