'use strict';
/* ============ 스테이지 2: 택배 마을 (덧셈과 뺄셈(2)) ============ */

/* ① 트럭 먼저 채우기: (몇)+(몇)=(십몇) */
STN.s2a = {
  stage: 2, name: '트럭 먼저 채우기', icon: '🚚',
  gen(L, i) {
    let a, b;
    if (L === 1) { do { a = R(7, 9); b = R(2, 5); } while (a + b < 11); }
    else { do { a = R(2, 9); b = R(2, 9); } while (a + b < 11); }
    const v4 = L === 4 ? i % 3 : -1;
    if (v4 === 0 && a > b) [a, b] = [b, a];
    const s = a + b, big = Math.max(a, b), sm = Math.min(a, b), need = 10 - big;
    const solPic = row(frameHTML(10, 'box', { altFrom: big }), frameHTML(s - 10, 'box', { altFrom: 0 }));
    const base = { answer: s, min: 10, max: 18, key: `${a}+${b}`, hint: frogLineHTML(big, sm),
      sol: soltx(`${j(sm, '을')} ${j(need, '과')} ${s - 10}${hasB(s - 10) ? '으로' : '로'} 갈라요<br>${big} + ${need} = 10<br>10 + ${s - 10} = ${s}`) + solPic,
      check: () => s >= 11 && s <= 18 && a >= 2 && b >= 2 && a <= 9 && b <= 9 };
    if (L === 1) return { ...base, needReady: true, q: '상자를 트럭에 실어요', say: `상자를 눌러서 트럭에 실어요. 첫 번째 트럭부터 채워요.`,
      html: `<div class="col"><div class="trucks"><div class="truck t1"><span class="tl">🚚 1번 트럭</span>${frameHTML(a, 'box', { cls: 'tf' })}</div><div class="truck t2"><span class="tl">🚚 2번 트럭</span>${frameHTML(0, 'box', { cls: 'tf' })}</div></div>${groupHTML(b, 'box', { cls: 'src', alt: 1 })}</div>`,
      setup(el, ctx) {
        const [f1, f2] = $$('.tf', el); let m = 0; const toks = $$('.src .tok', el);
        toks.forEach(t => movable(t, () => emptyCell(f1) ? f1 : f2, () => {
          if (t.dataset.used) return; const fr = emptyCell(f1) ? f1 : f2; const c = emptyCell(fr); if (!c) return;
          t.dataset.used = 1; c.appendChild(t); popIn(t);
          if (fr === f1 && !emptyCell(f1)) { $('.t1', el).classList.add('full'); SFX.play('go'); toast('1번 트럭 꽉 찼어요! 10!'); }
          if (++m === toks.length) { ctx.ready(); ctx.say('상자는 모두 몇 개일까요?'); }
        }));
      } };
    if (L === 2) return { ...base, q: '상자는 모두 몇 개일까요?', html: row(frameHTML(a, 'box'), OP('+'), groupHTML(b, 'box', { alt: 1 })) };
    if (L === 3 || v4 === 0) return { ...base, mode: 'pad', q: '10을 만들어 더해요', say: `${a} 더하기 ${j(b, '은')} 얼마일까요?`, html: expr(`${a} + ${b} = □`) };
    if (v4 === 1) return { ...base, mode: 'pad', answer: b, min: 2, max: 9, q: '네모에 알맞은 수는?', say: `${a} 더하기 네모는 ${s}. 네모에 알맞은 수는?`, html: expr(`${a} + □ = ${s}`) };
    const t = `상자 ${a}개가 있었는데 ${b}개가 더 왔어요. 상자는 모두 몇 개일까요?`;
    return { ...base, mode: 'pad', q: '이야기를 듣고 풀어요', say: t, html: story(t) + expr('□') };
  }
};

/* ② 상자 뜯기: (십몇)−(몇) */
STN.s2b = {
  stage: 2, name: '상자 뜯기', icon: '📦',
  gen(L, i) {
    let m, s; do { m = R(11, L === 1 ? 14 : 18); s = R(2, L === 1 ? 5 : 9); } while (!(m % 10 < s && m - s >= 2));
    const ans = m - s, u = m - 10;
    const pic2 = row(frameHTML(10, 'box', { cross: s - u }), groupHTML(u, 'box', { cross: u }));
    const solA = soltx(`${j(m, '을')} 10과 ${u}${hasB(u) ? '으로' : '로'} 갈라요<br>10 − ${s} = ${10 - s}<br>${10 - s} + ${u} = ${ans}`);
    const solB = soltx(`${j(s, '을')} ${j(u, '과')} ${s - u}${hasB(s - u) ? '으로' : '로'} 갈라요<br>${m} − ${u} = 10<br>10 − ${s - u} = ${ans}`);
    const base = { answer: ans, min: 1, max: 9, key: `${m}-${s}`, hint: frogLineHTML(m, -s), sol: (Math.random() < .5 ? solA : solB) + pic2,
      check: () => m >= 11 && m <= 18 && s >= 2 && s <= 9 && m % 10 < s && ans >= 2 };
    if (L === 1) return { ...base, needReady: true, q: `상자 ${s}개를 꺼내요`, say: `상자를 눌러서 ${s}개를 꺼내요. 모자라면 묶음을 풀어요.`,
      html: `<div class="col"><div class="row stock"><div class="bundle" data-a="open"><span class="bx">📦</span><b>10</b><small>눌러서 풀기</small></div>${groupHTML(u, 'box', { cls: 'loose' })}</div><div class="cnt">꺼낸 상자: <b>0</b> / ${s}개</div></div>`,
      setup(el, ctx) {
        let taken = 0; const cnt = $('.cnt b', el);
        const bindTok = t => t.onclick = () => {
          if (t.dataset.used) return; if (taken >= s) { toast(`${s}개만 꺼내요`); return; }
          t.dataset.used = 1; t.classList.add('fly'); SFX.play('pop'); cnt.textContent = ++taken;
          if (taken === s) { ctx.ready(); ctx.say('남은 상자는 몇 개일까요?'); }
          else if (!$$('.tok:not([data-used])', el).length && $('.bundle', el)) { $('.bundle', el).classList.add('pulse'); ctx.say('모자라요! 10 묶음을 풀어요.'); }
        };
        $$('.loose .tok', el).forEach(bindTok);
        $('.bundle', el).onclick = e => {
          const bd = e.currentTarget; const f = h(frameHTML(10, 'box', { cls: 'opened' })); bd.replaceWith(f); SFX.play('go');
          $$('.tok', f).forEach(t => { popIn(t); bindTok(t); });
        };
      } };
    if (L === 2) return { ...base, q: '남은 상자는 몇 개일까요?', html: pic2 };
    if (L === 3) return { ...base, mode: 'pad', q: '묶음을 풀어서 빼요', say: `${m} 빼기 ${j(s, '은')} 얼마일까요?`, html: expr(`${m} − ${s} = □`) };
    if (i % 2 === 0) return { ...base, mode: 'pad', answer: s, min: 2, max: 9, q: '네모에 알맞은 수는?', say: `${m} 빼기 네모는 ${ans}. 네모에 알맞은 수는?`, html: expr(`${m} − □ = ${ans}`) };
    const t = `상자 ${m}개 중에서 ${s}개를 배달했어요. 남은 상자는 몇 개일까요?`;
    return { ...base, mode: 'pad', q: '이야기를 듣고 풀어요', say: t, html: story(t) + expr('□') };
  }
};

/* ③ 덧셈표 퍼즐 */
STN.s2c = {
  stage: 2, name: '덧셈표 퍼즐', icon: '🧩',
  gen(L, i) {
    let rows, cols, op = '+', find = false, nb;
    if (L <= 2) { rows = [R(1, 9)]; const c = R(1, 7); cols = [c, c + 1, c + 2]; nb = L; }
    else if (L === 3) { const r = R(1, 7), c = R(1, 7); rows = [r, r + 1, r + 2]; cols = [c, c + 1, c + 2]; nb = 3; }
    else if (i % 2 === 0) { op = '−'; const r = R(11, 16), c = R(2, 7); rows = [r, r + 1, r + 2]; cols = [c, c + 1, c + 2]; nb = 4; }
    else { find = true; const r = R(1, 7), c = R(1, 7); rows = [r, r + 1, r + 2]; cols = [c, c + 1, c + 2]; nb = 0; }
    const val = (r, c) => op === '+' ? r + c : r - c;
    const cells = []; rows.forEach((r, y) => cols.forEach((c, x) => cells.push({ x, y, v: val(r, c) })));
    const blanks = shuffle(cells.map((_, k) => k)).slice(0, nb).sort((a, b) => a - b);
    const target = find ? val(rows[0], cols[2]) : 0;
    const tbl = `<table class="tbl"><tr><th class="corner">${op}</th>${cols.map(c => `<th>${c}</th>`).join('')}</tr>${rows.map((r, y) => `<tr><th>${r}</th>${cols.map((c, x) => { const k = y * cols.length + x; return blanks.includes(k) ? `<td class="blank" data-k="${k}"></td>` : `<td data-k="${k}">${cells[k].v}</td>`; }).join('')}</tr>`).join('')}</table>`;
    const arrow = L === 1 ? '<div class="cap">→ 오른쪽으로 갈수록 1씩 커져요</div>' : '';
    const q = find ? `답이 ${j(target, '이')} 되는 칸을 모두 눌러요` : '빈칸에 알맞은 수를 써요';
    return { mode: 'custom', answer: 0, key: rows.join() + cols.join() + op + find, q, say: find ? `덧셈표에서 답이 ${j(target, '이')} 되는 칸을 모두 눌러요.` : `${op === '+' ? '덧셈표' : '뺄셈표'}의 빈칸에 알맞은 수를 써요. 표의 규칙을 찾아봐요.`,
      html: `<div class="col">${tbl}${arrow}</div>`,
      check: () => cells.every(c => c.v >= 0 && c.v <= 18) && (!find || cells.filter(c => c.v === target).length === 3),
      setup(el, ctx) {
        let miss = 0;
        if (find) {
          let found = 0;
          $$('td', el).forEach(td => td.onclick = () => {
            if (td.classList.contains('ok')) return;
            if (cells[+td.dataset.k].v === target) { td.classList.add('ok'); popIn(td); if (++found === 3) ctx.finish(miss === 0); }
            else { miss++; ctx.miss(); shake(td); SFX.play('no'); }
          });
          return;
        }
        let bi = 0, tries = 0; const tds = blanks.map(k => $(`td[data-k="${k}"]`, el));
        const mark = () => { tds.forEach((t, x) => t.classList.toggle('cur', x === bi)); };
        mark();
        const pad = ctx.pad(v => {
          const td = tds[bi], want = cells[blanks[bi]].v;
          if (v === want) { td.textContent = want; td.classList.add('filled'); td.classList.remove('cur'); popIn(td); SFX.play('ok'); bi++; tries = 0; }
          else {
            miss++; ctx.miss(); SFX.play('no'); shake(td); tries++;
            if (tries >= 2) { td.textContent = want; td.classList.add('filled', 'shown'); td.classList.remove('cur'); toast(`정답은 ${want}이에요`); bi++; tries = 0; }
            else toast('다시 해 볼까요?');
          }
          pad.clear();
          if (bi >= tds.length) ctx.finish(miss === 0); else mark();
        });
      } };
  }
};

/* 대장 문제: 덧셈과 뺄셈 길 만들기 */
function pathExpr(v, add) {
  if (add) { const a = R(Math.max(2, v - 9), Math.min(9, v - 2)); return { t: `${a} + ${v - a}`, a, b: v - a, add }; }
  let m, s; do { m = R(11, 18); s = m - v; } while (!(s >= 2 && s <= 9 && m % 10 < s));
  return { t: `${m} − ${s}`, a: m, b: s, add };
}
STN.s2x = {
  stage: 2, name: '길 만들기', icon: '🛣️', side: 'char/gomi_2', counts: [2, 2, 2, 2],
  gen(L, i) {
    const n = L <= 2 ? 3 : 4, add = L === 1 ? true : i % 2 === 0;
    const lo = add ? 11 : 3, hi = add ? 18 : 9; const T = R(add ? 11 : 4, add ? 18 : 8);
    const path = [[0, 0]]; let x = 0, y = 0;
    while (x < n - 1 || y < n - 1) { if (x === n - 1) y++; else if (y === n - 1) x++; else if (Math.random() < .5) x++; else y++; path.push([x, y]); }
    const onP = new Set(path.map(p => p.join()));
    const cells = [];
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
      let v = T;
      if (!onP.has(xx + ',' + yy)) { const offs = shuffle(L === 4 ? [-1, 1, -2, 2] : [-3, -2, -1, 1, 2, 3]); v = T + offs.find(o => T + o >= lo && T + o <= hi); }
      cells.push({ x: xx, y: yy, v, e: pathExpr(v, add), p: onP.has(xx + ',' + yy) });
    }
    return { mode: 'custom', answer: 0, wide: true, key: 'path' + T + add, q: `답이 ${T}인 칸만 밟아요`,
      say: `답이 ${T}인 칸만 밟아서 트럭을 집까지 보내요. 트럭 바로 옆 칸만 갈 수 있어요.`,
      check: () => cells.every(c => (c.p ? c.v === T : c.v !== T) && c.v >= lo && c.v <= hi) && cells.every(c => c.e.add ? c.e.a + c.e.b === c.v : c.e.a - c.e.b === c.v),
      html: `<div class="pathwrap"><div class="pstart">🚚<b>출발</b></div><div class="pgrid g${n}">${cells.map((c, k) => `<button class="pc" data-k="${k}"><span>${c.e.t}</span></button>`).join('')}</div><div class="pend">🏠<b>집</b></div></div>`,
      setup(el, ctx) {
        let cur = null, miss = 0, lp = null, skip = false;
        const btns = $$('.pc', el);
        btns.forEach(b => {
          const c = cells[+b.dataset.k];
          if (L === 1) {
            b.addEventListener('pointerdown', () => { skip = false; lp = setTimeout(() => { skip = true; const pop = h(`<div class="hintpop"><div class="hh">10칸 틀로 보기<button class="x">✕</button></div><div class="hb">${row(frameHTML(c.e.a, 'box'), OP('+'), frameHTML(c.e.b, 'box', { altFrom: 0 }))}</div></div>`); $('.vis').appendChild(pop); $('.x', pop).onclick = () => pop.remove(); }, 650); });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => clearTimeout(lp)));
          }
          b.onclick = () => {
            if (skip) { skip = false; return; }
            if (b.classList.contains('ok')) return;
            const adj = cur === null ? (c.x === 0 && c.y === 0) : Math.abs(c.x - cur.x) + Math.abs(c.y - cur.y) === 1;
            if (!adj) { shake(b); toast(cur === null ? '출발 바로 옆 칸부터 눌러요' : '트럭 바로 옆 칸을 눌러요'); return; }
            if (c.v === T) {
              $$('.truck-on', el).forEach(t => t.remove()); b.classList.add('ok'); b.insertAdjacentHTML('beforeend', '<i class="truck-on">🚚</i>'); popIn(b); cur = c;
              if (c.x === n - 1 && c.y === n - 1) { SFX.play('go'); setTimeout(() => ctx.finish(miss === 0), 400); }
            } else {
              miss++; ctx.miss(); SFX.play('no'); shake(b); b.classList.add('bad'); b.insertAdjacentHTML('beforeend', `<i class="pv">= ${c.v}</i>`);
              setTimeout(() => { b.classList.remove('bad'); const pv = $('.pv', b); pv && pv.remove(); }, 1300);
            }
          };
        });
      } };
  }
};
