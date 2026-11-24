// 문제 은행 검사: node tests/check-questions.js
// 범위 밖 문제가 없는지, 보기가 올바른지 확인한다. 문제가 있으면 오류를 내고 멈춘다.
const Q = require('../js/questions.js');
const assert = (ok, msg) => { if (!ok) { console.error('실패:', msg); process.exit(1); } };

const expected = { A: 54, B: 45, C: 54, D1: 45, D2: 45 };
for (const [t, n] of Object.entries(expected)) assert(Q.POOL[t].length === n, `${t} 문제 수 ${Q.POOL[t].length} (기대 ${n})`);

for (const q of Object.values(Q.POOL).flat()) {
  const s = Q.text(q);
  if (q.op === '+') {
    assert(q.a >= 0 && q.a <= 9 && q.b >= 0 && q.b <= 9, `${s}: 한 자리 수가 아님`);
    assert(q.type === 'A' ? q.ans <= 9 : q.ans >= 10 && q.ans <= 18, `${s}: 받아올림 구분이 틀림`);
  } else {
    assert(q.ans >= 0 && q.ans <= 19 && q.b >= 0 && q.b <= 9, `${s}: 범위 밖`);
    if (q.type === 'C') assert(q.a <= 9, `${s}: C는 한 자리 − 한 자리`);
    if (q.type === 'D1') assert(q.a >= 11 && q.a <= 19 && q.a % 10 >= q.b, `${s}: D1은 받아내림 없음`);
    if (q.type === 'D2') assert(q.a >= 10 && q.a <= 18 && q.a % 10 < q.b && q.ans <= 9, `${s}: D2는 받아내림 있음`);
  }
  assert(!(q.a === 0 && q.b === 0), `${s}: 0과 0은 빼기로 함`);
  for (const n of [2, 3]) for (let i = 0; i < 30; i++) {
    const c = Q.choices(q, n);
    assert(c.length === n, `${s}: 보기 수`);
    assert(c.filter((x) => x.ok).length === 1, `${s}: 정답이 하나가 아님`);
    assert(new Set(c.map((x) => x.v)).size === n, `${s}: 보기가 겹침`);
    assert(c.every((x) => x.v >= 0 && x.v <= 19 && Number.isInteger(x.v)), `${s}: 보기 범위`);
    assert(c.every((x) => x.ok === (x.v === q.ans)), `${s}: 정답 표시가 틀림`);
  }
}

// 대표 예시: 기획서에 적은 실수 보기가 실제로 나오는지
const has = (a, op, b, v, k) => {
  const q = Q.POOL[Object.keys(Q.POOL).find((t) => Q.POOL[t].some((x) => x.a === a && x.b === b && x.op === op))].find((x) => x.a === a && x.b === b && x.op === op);
  assert(Q.mistakes(q).some((m) => m.v === v && m.k === k), `${Q.text(q)} 에 ${v}(${k}) 오답이 없음`);
};
has(8, '+', 5, 3, 'nocarry');
has(9, '-', 4, 13, 'swapop');
has(13, '-', 5, 12, 'reverse');
has(13, '-', 5, 18, 'keeptens');

const p = Q.pick(['A', 'B', 'C', 'D1', 'D2'], 10);
assert(p.length === 10 && new Set(p.map(Q.key)).size === 10, '한 판 문제가 겹침');

console.log('통과: 문제', Object.values(Q.POOL).flat().length, '개 검사');
