'use strict';
/* ============ 스테이지 3: 달걀 가게 (덧셈과 뺄셈(3)) ============ */
const T10 = n => Math.floor(n / 10), O10 = n => n % 10;
const eggPair = (A, B, op) => row(eggsHTML(A, { label: `${A}개` }), OP(op), eggsHTML(B, { label: `${B}개` }));

/* ① 주문 포장: 두 자리 수 덧셈 */
STN.s3a = {
  stage: 3, name: '주문 포장', icon: '🥚',
  gen(L, i) {
    let A, B;
    if (L === 1) { if (i % 2 === 0) { A = R(1, 5) * 10; B = R(1, 9); } else { const o = R(1, 7); A = R(1, 4) * 10 + o; B = R(1, 9 - o); } }
    else if (L === 2) {
      const ty = i % 3;
      if (ty === 0) { const t = R(1, 8); A = t * 10; B = R(1, 9 - t) * 10; }
      else if (ty === 1) { const t = R(1, 8); A = t * 10 + R(1, 9); B = R(1, 9 - t) * 10; }
      else { const o = R(1, 7); A = R(1, 9) * 10 + o; B = R(1, 9 - o); }
    } else { const at = R(1, 8), ao = R(1, 8); A = at * 10 + ao; B = R(1, 9 - at) * 10 + R(1, 9 - ao); }
    const S = A + B;
    const base = { answer: S, min: 1, max: 99, key: `${A}+${B}`, hint: eggPair(A, B, '+'),
      sol: soltx(`10묶음끼리: ${T10(A)} + ${T10(B)} = ${T10(S)}<br>낱개끼리: ${O10(A)} + ${O10(B)} = ${O10(S)}<br>그래서 ${S}`) + eggsHTML(S),
      check: () => O10(A) + O10(B) <= 9 && S <= 99 && B >= 1 };
    if (L === 1) return { ...base, needReady: true, q: '달걀을 모두 상자에 담아요', say: `${A}개와 ${B}개를 눌러서 상자에 담아요. 달걀판은 판 칸에, 낱개는 낱개 칸에 들어가요.`,
      html: `<div class="col"><div class="ebox"><div class="zt"><span class="zl">판 칸</span></div><div class="zo"><span class="zl">낱개 칸</span></div></div>
        ${row(eggsHTML(A, { label: `${A}개`, cls: 'src', tcls: 'mv', ecls: 'mv' }), OP('+'), eggsHTML(B, { label: `${B}개`, cls: 'src', tcls: 'mv', ecls: 'mv' }))}</div>`,
      setup(el, ctx) {
        const zt = $('.zt', el), zo = $('.zo', el), mv = $$('.src .mv', el); let m = 0;
        mv.forEach(t => movable(t, () => t.classList.contains('tray') ? zt : zo, () => {
          if (t.dataset.used) return; t.dataset.used = 1; (t.classList.contains('tray') ? zt : zo).appendChild(t); popIn(t);
          if (++m === mv.length) { ctx.ready(); ctx.say('상자에 달걀이 모두 몇 개일까요?'); }
        }));
      } };
    if (L === 2) return { ...base, q: '달걀은 모두 몇 개일까요?', html: eggPair(A, B, '+') };
    if (L === 3 || i % 2 === 0) return { ...base, mode: 'pad', q: '10묶음끼리, 낱개끼리 더해요', say: `${A} 더하기 ${j(B, '은')} 얼마일까요?`, html: expr(`${A} + ${B} = □`) };
    if (i % 4 === 1) return { ...base, mode: 'pad', answer: B, q: '네모에 알맞은 수는?', say: `${A} 더하기 네모는 ${S}. 네모에 알맞은 수는?`, html: expr(`${A} + □ = ${S}`) };
    const t = `달걀이 ${A}개 있어요. 꼬꼬가 ${B}개를 더 가져왔어요. 달걀은 모두 몇 개일까요?`;
    return { ...base, mode: 'pad', q: '이야기를 듣고 풀어요', say: t, html: story(t) + expr('□') };
  }
};

/* ② 달걀 팔기: 두 자리 수 뺄셈 */
STN.s3b = {
  stage: 3, name: '달걀 팔기', icon: '🛒',
  gen(L, i) {
    let M, S;
    if (L === 1) { if (i % 2 === 0) { const o = R(2, 9); M = R(1, 9) * 10 + o; S = R(1, o); } else { const t = R(2, 9); M = t * 10; S = R(1, t - 1) * 10; } }
    else if (L === 2) {
      const t = R(2, 9), o = R(1, 9); M = t * 10 + o;
      S = i % 2 === 0 ? R(1, t - 1) * 10 : R(1, t - 1) * 10 + R(1, o);
    } else { const t = R(2, 9), o = R(1, 9); M = t * 10 + o; S = R(1, t - 1) * 10 + R(1, o); }
    const A = M - S;
    const pic2 = eggsHTML(M, { crossT: T10(S), crossO: O10(S), label: `${M}개 중 ${S}개 팔기` });
    const base = { answer: A, min: 1, max: 99, key: `${M}-${S}`, hint: eggsHTML(M, { label: `${M}개` }),
      sol: soltx(`10묶음끼리: ${T10(M)} − ${T10(S)} = ${T10(A)}<br>낱개끼리: ${O10(M)} − ${O10(S)} = ${O10(A)}<br>그래서 ${A}`) + pic2,
      check: () => O10(M) >= O10(S) && A >= 1 && S >= 1 };
    if (L === 1) return { ...base, needReady: true, q: `달걀 ${S}개를 팔아요`, say: `손님이 달걀 ${S}개를 달래요. 눌러서 손님에게 건네요.`,
      html: `<div class="col">${eggsHTML(M, { cls: 'src', tcls: 'mv', ecls: 'mv' })}<div class="cust"><span>🧺 손님 바구니</span><div class="cz"></div><b class="cnt2">0</b> / ${S}개</div></div>`,
      setup(el, ctx) {
        const cz = $('.cz', el), cnt = $('.cnt2', el); let taken = 0;
        $$('.src .mv', el).forEach(t => movable(t, cz, () => {
          if (t.dataset.used) return; const val = t.classList.contains('tray') ? 10 : 1;
          if (taken + val > S) { shake(t); toast(val === 10 ? '판이 너무 많아요' : '너무 많아요'); return; }
          t.dataset.used = 1; cz.appendChild(t); popIn(t); taken += val; cnt.textContent = taken;
          if (taken === S) { ctx.ready(); ctx.say('남은 달걀은 몇 개일까요?'); }
        }));
      } };
    if (L === 2) return { ...base, q: '남은 달걀은 몇 개일까요?', html: pic2 };
    if (L === 3 || i % 2 === 0) return { ...base, mode: 'pad', q: '10묶음끼리, 낱개끼리 빼요', say: `${M} 빼기 ${j(S, '은')} 얼마일까요?`, html: expr(`${M} − ${S} = □`) };
    if (i % 4 === 1) return { ...base, mode: 'pad', answer: S, q: '네모에 알맞은 수는?', say: `${M} 빼기 네모는 ${A}. 네모에 알맞은 수는?`, html: expr(`${M} − □ = ${A}`) };
    const t = `달걀이 ${M}개 있어요. 손님이 ${S}개를 사 갔어요. 몇 개 남았을까요?`;
    return { ...base, mode: 'pad', q: '이야기를 듣고 풀어요', say: t, html: story(t) + expr('□') };
  }
};

/* ③ 바쁜 가게: 덧셈과 뺄셈 섞인 주문 */
STN.s3c = {
  stage: 3, name: '바쁜 가게', icon: '🏪',
  gen(L, i) {
    if (L === 4) {
      let a, b, c, mid;
      do {
        const at = R(3, 9), ao = R(2, 9); a = at * 10 + ao;
        b = R(1, at - 1) * 10 + R(0, ao); mid = a - b;
        const ct = R(0, 9 - T10(mid)), co = R(0, 9 - O10(mid)); c = ct * 10 + co;
      } while (c < 10 || b < 10 || mid < 10);
      const ans = mid + c;
      const t = `달걀이 ${a}개 있었어요. ${b}개를 팔고, ${c}개가 더 들어왔어요. 지금 달걀은 몇 개일까요?`;
      return { mode: 'pad', answer: ans, key: `${a}-${b}+${c}`, q: '두 번 계산해요', say: t, html: story(t) + expr('□'),
        hint: soltx(`먼저 ${a} − ${b}, 그다음 더하기 ${c}`) + eggsHTML(a),
        sol: soltx(`${a} − ${b} = ${mid}<br>${mid} + ${c} = ${ans}`),
        check: () => O10(a) >= O10(b) && O10(mid) + O10(c) <= 9 && ans <= 99 && mid >= 10 };
    }
    const add = alt(i); let a, b;
    const at = R(2, 8), ao = R(1, 8); a = at * 10 + ao;
    if (L === 1) b = add ? R(1, 9 - ao) : R(1, ao);
    else if (L === 2) b = add ? R(1, 9 - at) * 10 : R(1, at - 1) * 10;
    else b = add ? R(1, 9 - at) * 10 + R(1, 9 - ao) : R(1, at - 1) * 10 + R(1, ao);
    const ans = add ? a + b : a - b, op = add ? '+' : '−';
    const t = add ? `가게에 달걀이 ${a}개 있어요. 꼬꼬가 달걀 ${b}개를 가져왔어요.` : `가게에 달걀이 ${a}개 있어요. 손님이 달걀 ${b}개를 사 갔어요.`;
    return { mode: L === 3 ? 'pad' : 'choice', needReady: true, answer: ans, min: 1, max: 99, key: `${a}${op}${b}`,
      q: '더할까요, 뺄까요?', say: t + ' 달걀이 늘어날까요, 줄어들까요?',
      html: `<div class="col">${story(t)}<div class="opbtns"><button class="btn big" data-o="+">＋ 늘어나요</button><button class="btn big" data-o="−">− 줄어들어요</button></div><div class="eqz"></div></div>`,
      hint: eggPair(a, b, op), sol: soltx(add ? '달걀이 늘어나요. 더해요.' : '달걀이 줄어들어요. 빼요.') + soltx(`${a} ${op} ${b} = ${ans}`),
      check: () => add ? O10(a) + O10(b) <= 9 && ans <= 99 : O10(a) >= O10(b) && ans >= 1,
      setup(el, ctx) {
        $$('[data-o]', el).forEach(b2 => b2.onclick = () => {
          if (el.dataset.ok) return;
          if (b2.dataset.o === op) {
            el.dataset.ok = 1; b2.classList.add('pri'); SFX.play('ok');
            $('.opbtns', el).outerHTML = expr(`${a} ${op} ${b} = □`); const sto = $('.story', el); if (sto) sto.remove();
            if (L <= 2) $('.eqz', el).innerHTML = eggPair(a, b, op);
            ctx.ready(); ctx.say('지금 달걀은 몇 개일까요?');
          } else { ctx.miss(); SFX.play('no'); shake(b2); toast(add ? '달걀이 들어왔어요. 늘어나요!' : '손님이 사 갔어요. 줄어들어요!'); }
        });
      } };
  }
};

/* 대장 문제: 배달 로봇 명령어 */
const MOVES = { '+1': { d: 1, l: '+1 →' }, '-1': { d: -1, l: '−1 ←' }, '+10': { d: 10, l: '+10 ↓' }, '-10': { d: -10, l: '−10 ↑' } };
function stepBoard(n, mv) {
  const r = Math.floor((n - 1) / 10), c = (n - 1) % 10;
  if (mv === '+1' && c < 9) return n + 1; if (mv === '-1' && c > 0) return n - 1;
  if (mv === '+10' && r < 9) return n + 10; if (mv === '-10' && r > 0) return n - 10; return null;
}
function bfsBoard(s, t, holes) {
  const prev = { [s]: null }, q = [s];
  while (q.length) {
    const n = q.shift(); if (n === t) { const p = []; let k = t; while (prev[k]) { p.unshift(prev[k].mv); k = prev[k].n; } return p; }
    for (const mv of Object.keys(MOVES)) { const m = stepBoard(n, mv); if (m && !(m in prev) && !holes.includes(m)) { prev[m] = { n, mv }; q.push(m); } }
  }
  return null;
}
function robotGen(L) {
  for (let k = 0; k < 400; k++) {
    const s = R(1, 100), r = Math.floor((s - 1) / 10), c = (s - 1) % 10; let dr, dc;
    if (L === 1) { dr = R(2, 4); dc = 0; }
    else if (L === 2) { dr = R(1, 3); dc = R(1, 3); }
    else { dr = R(-3, 3); dc = R(-3, 3); const d = Math.abs(dr) + Math.abs(dc); if (d < (L >= 4 ? 3 : 2) || d > 5 || (dr >= 0 && dc >= 0)) continue; }
    const r2 = r + dr, c2 = c + dc; if (r2 < 0 || r2 > 9 || c2 < 0 || c2 > 9) continue;
    const t = r2 * 10 + c2 + 1; let holes = [];
    if (L >= 4) {
      const cand = [];
      for (let rr = Math.min(r, r2); rr <= Math.max(r, r2); rr++) for (let cc = Math.min(c, c2); cc <= Math.max(c, c2); cc++) { const n = rr * 10 + cc + 1; if (n !== s && n !== t) cand.push(n); }
      holes = shuffle(cand).slice(0, R(2, 3));
    }
    const path = bfsBoard(s, t, holes); if (!path || path.length > 7) continue;
    return { s, t, holes, path };
  }
  return { s: 23, t: 53, holes: [], path: ['+10', '+10', '+10'] };
}
function robotProblem(L, shortest) {
  const g = robotGen(L), limit = L === 4 && !shortest ? Math.min(8, g.path.length + 2) : 8;
  const cards = L === 1 ? ['+10'] : L === 2 ? ['+1', '+10'] : ['+1', '-1', '+10', '-10'];
  return { mode: 'custom', answer: 0, wide: true, key: `${g.s}>${g.t}`, q: shortest ? '가장 적은 카드로 배달해요' : `${g.s}에서 ${g.t}까지 배달해요`,
    say: `로봇이 ${g.s}에 있어요. ${g.t}에 달걀빵을 배달해요. 명령 카드를 놓고 출발을 눌러요.` + (shortest ? ' 카드를 가장 적게 써 봐요.' : ''),
    check: () => g.path && g.path.length <= limit && !g.holes.includes(g.s) && !g.holes.includes(g.t),
    html: `<div class="rwrap"><div class="board">${Array.from({ length: 100 }, (_, k) => { const n = k + 1; return `<div class="bc ${n === g.t ? 'goal' : ''} ${g.holes.includes(n) ? 'hole' : ''} ${n === g.s ? 'start' : ''}" data-n="${n}">${g.holes.includes(n) ? '🕳️' : n}</div>`; }).join('')}<div class="robot">🤖</div></div>
      <div class="rinfo"><div class="rgoal">🤖 <b>${g.s}</b> → 🏠 <b>${g.t}</b></div><div class="rmsg">카드는 ${limit}장까지 놓을 수 있어요</div><div class="reqn"></div></div></div>`,
    setup(el, ctx) {
      const ans = ctx.ans, seq = []; let fails = 0, busy = false;
      ans.innerHTML = `<div class="rctl"><div class="rcards">${cards.map(c => `<button class="rmv" data-c="${c}">${MOVES[c].l}</button>`).join('')}</div>
        <div class="rseq"></div><div class="rbtns"><button class="btn" data-r="clr">지우기</button><button class="btn pri big" data-r="go">출발!</button></div></div>`;
      const seqEl = $('.rseq', ans), robot = $('.robot', el), msg = $('.rmsg', el);
      const place = n => { const k = n - 1; robot.style.left = (k % 10) * 46 + 'px'; robot.style.top = Math.floor(k / 10) * 46 + 'px'; };
      const draw = () => { seqEl.innerHTML = Array.from({ length: limit }, (_, k) => seq[k] ? `<button class="rslot full" data-k="${k}">${MOVES[seq[k]].l}</button>` : '<span class="rslot"></span>').join(''); };
      place(g.s); draw();
      ans.onclick = async e => {
        const b = e.target.closest('button'); if (!b || busy) return; SFX.play('pop');
        if (b.dataset.c) { if (seq.length >= limit) { shake(seqEl); toast(`카드는 ${limit}장까지예요`); return; } seq.push(b.dataset.c); draw(); return; }
        if (b.dataset.k) { seq.splice(+b.dataset.k, 1); draw(); return; }
        if (b.dataset.r === 'clr') { seq.length = 0; draw(); return; }
        if (b.dataset.r !== 'go') return;
        if (!seq.length) { shake(seqEl); toast('명령 카드를 먼저 놓아요'); return; }
        busy = true; let pos = g.s, why = '';
        const slots = $$('.rslot', seqEl);
        for (let k = 0; k < seq.length; k++) {
          slots.forEach((s, x) => s.classList.toggle('now', x === k));
          const np = stepBoard(pos, seq[k]);
          if (np === null) { why = '벽이에요!'; break; }
          pos = np; place(pos); SFX.play('pop'); await wait(480);
          if (g.holes.includes(pos)) { why = '구덩이에 빠졌어요!'; break; }
        }
        slots.forEach(s => s.classList.remove('now'));
        if (!why && pos === g.t) {
          const eq = `${g.s} ${seq.map(m => (m[0] === '+' ? '+ ' : '− ') + m.slice(1)).join(' ')} = ${g.t}`;
          $('.reqn', el).innerHTML = `<div class="expr small">${eq}</div>` + (shortest ? (seq.length === g.path.length ? '<div class="crown">👑 가장 짧은 길!</div>' : `<div class="cap">가장 짧은 길은 카드 ${g.path.length}장이에요</div>`) : '');
          SFX.play('go'); TTS.speak(`도착! ${eq}`);
          setTimeout(() => ctx.finish(fails === 0), 1800); return;
        }
        fails++; ctx.miss(); SFX.play('no'); msg.textContent = why || '아직 도착하지 않았어요'; shake(robot); TTS.speak(why || '아직 도착하지 않았어요');
        await wait(900); place(g.s); busy = false;
        if (fails >= 2) {
          let p = g.s; $$('.bc.way', el).forEach(c => c.classList.remove('way'));
          g.path.forEach(mv => { p = stepBoard(p, mv); const c = $(`.bc[data-n="${p}"]`, el); c && c.classList.add('way'); });
          msg.textContent = '힌트: 반짝이는 길을 따라가요';
        }
      };
    } };
}
STN.s3x = { stage: 3, name: '배달 로봇', icon: '🤖', side: 'char/robot', counts: [3, 3, 3, 3], gen: (L) => robotProblem(L, false) };
