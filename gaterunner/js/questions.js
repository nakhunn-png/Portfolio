// 문제 은행: 1학년 덧셈·뺄셈 문제를 만들고, 아이들이 자주 하는 실수로 오답 보기를 만든다.
// 브라우저에서는 window.GRQ, node(검사 스크립트)에서는 module.exports로 쓴다.
(function (root) {
  'use strict';

  // 유형 A~D2. 이름은 선생님 화면에 그대로 보인다
  const TYPES = {
    A: { name: '받아올림 없는 덧셈', short: '덧셈' },
    B: { name: '받아올림 있는 덧셈', short: '받아올림' },
    C: { name: '한 자리 뺄셈', short: '뺄셈' },
    D1: { name: '받아내림 없는 (십몇)−(몇)', short: '십몇−몇' },
    D2: { name: '받아내림 있는 (십몇)−(몇)', short: '받아내림' },
  };

  // 오답 종류. 선생님 화면에서 묶어 보여 준다
  const KINDS = {
    off1: '하나 차이(세다가 빠뜨림)',
    off2: '두 개 차이',
    nocarry: '받아올림을 잊음',
    swapop: '덧셈·뺄셈을 바꿔 함',
    reverse: '작은 수에서 큰 수를 거꾸로 뺌',
    keeptens: '받아내림 후 십의 자리를 그대로 둠',
  };

  // 유형마다 나올 수 있는 모든 문제
  function all(type) {
    const out = [];
    const add = (a, b, op) => out.push({ a, b, op, type, ans: op === '+' ? a + b : a - b });
    if (type === 'A') for (let a = 0; a <= 9; a++) for (let b = 0; a + b <= 9; b++) { if (a || b) add(a, b, '+'); }
    if (type === 'B') for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) { if (a + b >= 10) add(a, b, '+'); }
    if (type === 'C') for (let a = 0; a <= 9; a++) for (let b = 0; b <= a; b++) { if (a || b) add(a, b, '-'); }
    if (type === 'D1') for (let x = 1; x <= 9; x++) for (let b = 1; b <= x; b++) add(10 + x, b, '-');
    if (type === 'D2') for (let x = 0; x <= 8; x++) for (let b = x + 1; b <= 9; b++) add(10 + x, b, '-');
    return out;
  }

  const POOL = {};
  for (const t of Object.keys(TYPES)) POOL[t] = all(t);

  const text = (q) => `${q.a} ${q.op === '+' ? '+' : '−'} ${q.b}`;
  const key = (q) => `${q.a}${q.op}${q.b}`;

  function shuffle(arr, rnd = Math.random) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }

  // 그 문제에서 생길 만한 실수(앞에 올수록 그 유형다운 실수)
  function mistakes(q) {
    const { a, b, ans, type } = q;
    const m = [];
    if (type === 'B') m.push({ v: ans - 10, k: 'nocarry' });
    if (type === 'D2') { m.push({ v: 10 + (b - (a - 10)), k: 'reverse' }); m.push({ v: ans + 10, k: 'keeptens' }); }
    if (q.op === '+') m.push({ v: Math.abs(a - b), k: 'swapop' });
    else if (a + b <= 19) m.push({ v: a + b, k: 'swapop' });
    return m;
  }

  // 보기 n개(정답 포함)를 섞어서 돌려준다. [{v, ok, k}]
  function choices(q, n, rnd = Math.random) {
    const used = new Set([q.ans]);
    const out = [{ v: q.ans, ok: true, k: null }];
    const push = (c) => { if (out.length < n && c.v >= 0 && c.v <= 19 && !used.has(c.v)) { used.add(c.v); out.push({ v: c.v, ok: false, k: c.k }); } };
    const near = shuffle([{ v: q.ans + 1, k: 'off1' }, { v: q.ans - 1, k: 'off1' }], rnd);
    const mis = mistakes(q);
    // 실수 오답 1개 + 하나 차이 오답 1개가 기본. 보기 2개일 때는 반반
    if (n === 2) { if (mis.length && rnd() < 0.5) push(mis[Math.floor(rnd() * mis.length)]); }
    else if (mis.length) push(mis[Math.floor(rnd() * Math.min(2, mis.length))]);
    for (const c of near) push(c);
    for (const c of mis) push(c);
    for (const c of shuffle([{ v: q.ans + 2, k: 'off2' }, { v: q.ans - 2, k: 'off2' }], rnd)) push(c);
    for (let v = 0; out.length < n; v++) push({ v, k: 'off2' }); // 여기까지 올 일은 거의 없다
    return shuffle(out, rnd);
  }

  // 한 판에 낼 문제 count개. types 중에서 고르게, 같은 문제는 겹치지 않게
  function pick(types, count, rnd = Math.random) {
    const bags = types.map((t) => shuffle(POOL[t].slice(), rnd));
    const out = [];
    for (let i = 0; out.length < count; i++) {
      const bag = bags[types.length > 1 ? Math.floor(rnd() * types.length) : 0];
      if (!bag.length) continue;
      const q = bag.pop();
      // 0이 들어간 문제는 유형 A·C의 1/3이나 돼서 너무 자주 나온다. 셋 중 둘은 건너뛴다
      if ((q.a === 0 || q.b === 0) && rnd() < 0.67 && i < 500) continue;
      out.push(q);
      if (i > 1000) break;
    }
    return out;
  }

  const api = { TYPES, KINDS, POOL, all, text, key, choices, pick, shuffle, mistakes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GRQ = api;
})(typeof window !== 'undefined' ? window : globalThis);
