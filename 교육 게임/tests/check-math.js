/* 문제 범위 검사: node tests/check-math.js
 * 유형마다 2만 개씩 만들어 교과 범위(PRD 3-2)를 벗어나는 문제가 없는지 본다. */
var path = require('path');
var M = require(path.join(__dirname, '../js/mathgen.js'));

function ones(n) { return n % 10; }
var RULES = {
  A1: function (p) { var n = p.nums; return n.length === 3 && n.every(function (x) { return x >= 1 && x <= 9; }) && p.answer === n[0] + n[1] + n[2] && p.answer <= 9; },
  A2: function (p) { var n = p.nums; return n[0] <= 9 && p.answer === n[0] - n[1] - n[2] && p.answer >= 0 && n[1] >= 1 && n[2] >= 1; },
  A3: function (p) { return p.nums[0] >= 1 && p.nums[0] <= 9 && p.nums[0] + p.answer === 10; },
  A4: function (p) { return p.nums[0] === 10 && p.nums[1] >= 1 && p.nums[1] <= 9 && p.answer === 10 - p.nums[1]; },
  A5: function (p) { var n = p.nums; return (n[0] + n[1] === 10 || n[1] + n[2] === 10) && p.answer === n[0] + n[1] + n[2] && n.every(function (x) { return x >= 1 && x <= 9; }); },
  B1: function (p) { var a = p.nums[0], b = p.nums[1]; return a <= 9 && b <= 9 && a + b >= 11 && a + b <= 18 && p.answer === a + b; },
  B2: function (p) { return RULES.B1(p); },
  B3: function (p) { var a = p.nums[0], b = p.nums[1]; return a >= 11 && a <= 18 && b <= 9 && b > ones(a) && p.answer === a - b && p.answer >= 2; },
  B4: function (p) { return RULES.B3(p); },
  C1: function (p) { var a = p.nums[0], b = p.nums[1]; return a >= 10 && a <= 99 && ones(a) + ones(b) <= 9 && a + b <= 99 && p.answer === a + b; },
  C2: function (p) { var a = p.nums[0], b = p.nums[1]; return a >= 10 && ones(a) >= ones(b) && a - b >= 1 && p.answer === a - b; }
};

var fail = 0;
M.TYPES.forEach(function (t) {
  var bad = 0, seen = {};
  for (var i = 0; i < 20000; i++) {
    var p = M.make([t]);
    seen[p.text] = 1;
    var ok = RULES[t](p) && p.choices.length === 4 && p.choices.indexOf(p.answer) >= 0 &&
      p.choices.every(function (c) { return c >= 0 && c <= 99; }) && new Set(p.choices).size === 4;
    if (!ok) { if (bad < 3) console.log('  범위 밖:', t, p.text, '=', p.answer, p.choices); bad++; }
  }
  console.log((bad ? '실패' : '통과') + '  ' + t + '  서로 다른 식 ' + Object.keys(seen).length + '개');
  fail += bad;
});
// 식 고르기 (스테이지 8): 보기 식 4개 중 정답 식은 하나, 다른 식은 답이 달라야 한다
(function () {
  var bad = 0;
  for (var i = 0; i < 5000; i++) {
    var p = M.makePick(['C2']);
    var right = p.exprs.filter(function (e) { return e.ans === p.answer; }).length;
    var ansSet = new Set(p.exprs.map(function (e) { return e.ans; }));
    if (p.exprs.length !== 4 || right !== 1 || ansSet.size !== 4) { if (bad < 3) console.log('  잘못된 보기:', p.answer, p.exprs); bad++; }
  }
  console.log((bad ? '실패' : '통과') + '  식 고르기 보기');
  fail += bad;
})();

// 식 세우기·문장제 (2026-11-26): 단원 범위, 식과 답이 맞는지, 보기 식 중 정답은 하나, 답 보기 3개
(function () {
  var RANGE = { 1: function (p) { return p.answer >= 0 && p.answer <= 19 && p.nums.every(function (x) { return x >= 1 && x <= 10; }); },
    2: function (p) { var a = p.nums[0], b = p.nums[1]; return (p.op === '+' ? a <= 9 && b <= 9 && a + b >= 11 && a + b <= 18 : a >= 11 && a <= 18 && b <= 9 && b > a % 10) && p.answer >= 2; },
    3: function (p) { var a = p.nums[0], b = p.nums[1]; return (p.op === '+' ? a % 10 + b % 10 <= 9 && a + b <= 99 : a % 10 >= b % 10 && a - b >= 1) && a >= 10; } };
  var bad = 0, kinds = {};
  [1, 2, 3].forEach(function (u) {
    ['story', 'setup'].forEach(function (mode) {
      for (var i = 0; i < 6000; i++) {
        var p = M.makeWord(u, mode), e = M.exprOf(p.kind, p.kind === 'ten' ? [p.nums[0]] : p.kind === 'from10' ? [10, p.nums[1]] : p.nums);
        kinds[u + p.kind] = 1;
        var ok = RANGE[u](p) && e.ans === p.answer && p.story && p.ask && p.choices.length === 4 && p.choices.indexOf(p.answer) >= 0 && new Set(p.choices).size === 4;
        if (mode === 'setup') {
          var right = p.exprs.filter(function (x) { return x.ans === p.answer; }).length;
          ok = ok && p.exprs.length === 4 && right === 1 && new Set(p.exprs.map(function (x) { return x.ans; })).size === 4 && p.exprs.some(function (x) { return x.text === p.expr; });
        }
        if (!ok) { if (bad < 5) console.log('  잘못된 문제:', u, mode, p.story, p.answer, JSON.stringify(p.exprs || p.choices)); bad++; }
      }
    });
  });
  console.log((bad ? '실패' : '통과') + '  식 세우기·문장제 (상황 ' + Object.keys(kinds).length + '가지)');
  fail += bad;
})();
if (!RULES.A1 || Object.keys(RULES).length !== M.TYPES.length) { console.log('실패  검사 규칙 수가 유형 수와 다름'); fail++; }
console.log(fail ? '\n문제 범위 검사 실패' : '\n문제 범위 검사 모두 통과');
process.exit(fail ? 1 : 0);
