'use strict';
/* ============ 스테이지 1: 열매 과수원 (덧셈과 뺄셈(1)) ============ */

/* ① 열매 기차: 세 수의 덧셈과 뺄셈 */
STN.s1a = {
  stage: 1, name: '열매 기차', icon: '🚂',
  gen(L, i) {
    const add = alt(i); let a, b, c;
    if (add) { const mx = L === 1 ? 3 : 5, lim = L === 1 ? 6 : 9; do { a = R(1, mx); b = R(1, mx); c = R(1, mx); } while (a + b + c > lim); }
    else { do { a = R(L === 1 ? 4 : 5, L === 1 ? 6 : 9); b = R(1, L === 1 ? 2 : 4); c = R(1, L === 1 ? 2 : 4); } while (a - b - c < 0); }
    const ans = add ? a + b + c : a - b - c, o = add ? '+' : '−';
    const picture = add
      ? row(groupHTML(a), OP('+'), groupHTML(b, 'apple', { alt: 1 }), OP('+'), groupHTML(c))
      : `<div class="col">${groupHTML(a, 'apple', { cross: b + c, cross2: c })}<div class="cap">먹은 열매 ${b}개, 친구에게 준 열매 ${c}개</div></div>`;
    const sol = add ? `${a} + ${b} = ${a + b}<br>${a + b} + ${c} = ${ans}` : `${a} − ${b} = ${a - b}<br>${a - b} − ${c} = ${ans}`;
    const base = { answer: ans, hint: picture, sol: soltx(sol) + picture, key: `${a}${o}${b}${o}${c}`, min: 0, max: 18,
      check: () => add ? a + b + c <= 9 : a - b - c >= 0 };
    if (L === 1 && add) return { ...base, needReady: true, q: '열매를 눌러서 기차에 실어요', say: '역마다 열매를 눌러서 기차에 실어요.',
      html: `<div class="col"><div class="train"><span class="loco">🚂</span>${frameHTML(0, 'apple', { cls: 'tgt' })}</div>
        <div class="row">${[a, b, c].map((n, k) => `<div class="pile"><div class="lab">${k + 1}번째 역</div>${groupHTML(n, 'apple', { cls: 'src', alt: k === 1 })}</div>`).join('')}</div></div>`,
      setup(el, ctx) {
        const fr = $('.tgt', el), toks = $$('.src .tok', el); let m = 0;
        toks.forEach(t => movable(t, fr, () => {
          if (t.dataset.used) return; const c2 = emptyCell(fr); if (!c2) return;
          t.dataset.used = 1; c2.appendChild(t); popIn(t);
          if (++m === toks.length) { ctx.ready(); ctx.say('기차에 열매가 모두 몇 개일까요?'); }
        }));
      } };
    if (L === 1) return { ...base, needReady: true, q: '집마다 열매를 내려 줘요', say: `열매를 눌러서 첫째 집에 ${b}개, 둘째 집에 ${c}개를 내려 줘요.`,
      html: `<div class="col"><div class="train"><span class="loco">🚂</span>${frameHTML(a, 'apple', { cls: 'tgt' })}</div>
        <div class="row">${[b, c].map((n, k) => `<div class="house" data-need="${n}"><div class="lab">🏠 ${k + 1}번째 집 ${n}개</div><div class="grp drop"></div></div>`).join('')}</div></div>`,
      setup(el, ctx) {
        const hs = $$('.house', el); let hi = 0; hs[0].classList.add('cur');
        $$('.tgt .tok', el).forEach(t => movable(t, () => hs[hi] && $('.drop', hs[hi]), () => {
          if (t.dataset.used || hi >= hs.length) return;
          const dp = $('.drop', hs[hi]); t.dataset.used = 1; dp.appendChild(t); popIn(t);
          if (dp.children.length >= +hs[hi].dataset.need) {
            hs[hi].classList.remove('cur'); hs[hi].classList.add('ok'); hi++;
            if (hi < hs.length) hs[hi].classList.add('cur');
            else { ctx.ready(); ctx.say('기차에 남은 열매는 몇 개일까요?'); }
          }
        }));
      } };
    if (L === 2) return { ...base, q: add ? '열매는 모두 몇 개일까요?' : '남은 열매는 몇 개일까요?', html: picture };
    if (L === 3) return { ...base, mode: 'pad', q: '식을 풀어 볼까요?', say: `${a} ${o} ${b} ${o} ${j(c, '은')} 얼마일까요?`, html: expr(`${a} ${o} ${b} ${o} ${c} = □`) };
    if (i % 2 === 0) return { ...base, mode: 'pad', answer: b, ansLabel: b, q: '네모에 알맞은 수는?', say: `${a} ${o} 네모 ${o} ${c}는 ${ans}. 네모에 알맞은 수는 얼마일까요?`,
      html: expr(`${a} ${o} □ ${o} ${c} = ${ans}`), sol: soltx(`${a} ${o} ${b} ${o} ${c} = ${ans}`) + picture };
    const t = add ? `토리가 열매를 ${a}개, ${b}개, ${c}개 땄어요. 모두 몇 개일까요?` : `열매가 ${a}개 있었어요. ${b}개를 먹고, ${c}개를 친구에게 줬어요. 몇 개 남았을까요?`;
    return { ...base, mode: 'pad', q: '이야기를 듣고 풀어요', say: t, html: story(t) + expr('□') };
  }
};

/* ② 바구니 채우기: 10이 되는 더하기, 10에서 빼기 */
function memoryProblem() {
  const ks = shuffle([1, 2, 3, 4, 5]).slice(0, 4); const cards = shuffle(ks.flatMap(k => [k, 10 - k]));
  return { mode: 'custom', answer: 10, key: 'memo' + Math.random(), q: '더해서 10이 되는 짝을 찾아요', say: '카드를 두 장씩 뒤집어서, 더해서 10이 되는 짝을 찾아요.',
    html: `<div class="memo">${cards.map(v => `<button class="mcard" data-v="${v}"><span>${v}</span></button>`).join('')}</div>`,
    setup(el, ctx) {
      let open = [], lock = false, got = 0;
      $$('.mcard', el).forEach(c => c.onclick = () => {
        if (lock || c.classList.contains('on')) return;
        c.classList.add('on'); SFX.play('pop'); open.push(c);
        if (open.length < 2) return;
        lock = true; const [x, y] = open;
        if (+x.dataset.v + +y.dataset.v === 10) setTimeout(() => { x.classList.add('ok'); y.classList.add('ok'); SFX.play('ok'); open = []; lock = false; if (++got === 4) ctx.finish(true); }, 350);
        else setTimeout(() => { x.classList.remove('on'); y.classList.remove('on'); open = []; lock = false; }, 950);
      });
    } };
}
STN.s1b = {
  stage: 1, name: '바구니 채우기', icon: '🧺',
  gen(L, i) {
    if (L === 4 && i === 3) return memoryProblem();
    if (alt(i)) {
      const a = R(1, 9), ans = 10 - a;
      const base = { answer: ans, min: 0, max: 10, key: '+' + a, hint: frameHTML(a), sol: soltx(`${j(a, '과')} ${j(ans, '을')} 더하면 10이에요`) + frameHTML(10, 'apple', { altFrom: a }),
        check: () => a + ans === 10 && ans >= 1 };
      if (L === 1) return { ...base, needReady: true, q: '바구니를 가득 채워요', say: '열매를 눌러서 바구니를 가득 채워요.',
        html: `<div class="col">${frameHTML(a, 'apple', { cls: 'tgt basket' })}${groupHTML(ans + 2, 'apple', { cls: 'src', alt: 1 })}</div>`,
        setup(el, ctx) {
          const fr = $('.tgt', el); let full = false;
          $$('.src .tok', el).forEach(t => movable(t, fr, () => {
            if (t.dataset.used) return; if (full) { shake(fr); toast('바구니가 꽉 찼어요'); return; }
            const c2 = emptyCell(fr); t.dataset.used = 1; c2.appendChild(t); popIn(t);
            if (!emptyCell(fr)) { full = true; fr.classList.add('full'); SFX.play('go'); ctx.ready(); ctx.say('바구니가 꽉 찼어요! 열매를 몇 개 넣었나요?'); }
          }));
        } };
      if (L === 2) return { ...base, q: '몇 개 더 있으면 10이 될까요?', html: frameHTML(a) };
      if (L === 3) return { ...base, mode: 'pad', q: '10이 되게 해요', say: `${a} 더하기 네모는 10. 네모에 알맞은 수는?`, html: expr(`${a} + □ = 10`) };
      return { ...base, mode: 'pad', q: '10이 되게 해요', say: `네모 더하기 ${j(a, '은')} 10. 네모에 알맞은 수는?`, html: expr(`□ + ${a} = 10`) };
    }
    const b = R(1, 9), ans = 10 - b;
    const base = { answer: ans, min: 0, max: 10, key: '-' + b, hint: frameHTML(10), sol: soltx(`10에서 ${j(b, '을')} 빼면 ${ans}`) + frameHTML(10, 'apple', { cross: b }),
      check: () => ans >= 1 && ans <= 9 };
    if (L === 1) return { ...base, needReady: true, q: `열매 ${b}개를 날려 보내요`, say: `열매를 눌러서 ${b}개를 날려 보내요.`,
      html: `<div class="col">${frameHTML(10, 'apple', { cls: 'tgt basket' })}<div class="cnt">날려 보낸 열매: <b>0</b>개</div></div>`,
      setup(el, ctx) {
        let m = 0; const cnt = $('.cnt b', el);
        $$('.tgt .tok', el).forEach(t => t.onclick = () => {
          if (t.dataset.used) return; if (m >= b) { toast(`${b}개만 날려 보내요`); return; }
          t.dataset.used = 1; t.classList.add('fly'); SFX.play('pop'); cnt.textContent = ++m;
          if (m === b) { ctx.ready(); ctx.say('바구니에 남은 열매는 몇 개일까요?'); }
        });
      } };
    if (L === 2) return { ...base, q: '남은 열매는 몇 개일까요?', html: frameHTML(10, 'apple', { cross: b }) };
    if (L === 3) return { ...base, mode: 'pad', q: '10에서 빼요', say: `10 빼기 ${j(b, '은')} 얼마일까요?`, html: expr(`10 − ${b} = □`) };
    return { ...base, mode: 'pad', answer: b, q: '네모에 알맞은 수는?', say: `10 빼기 네모는 ${ans}. 네모에 알맞은 수는?`, html: expr(`10 − □ = ${ans}`),
      sol: soltx(`10에서 ${j(b, '을')} 빼면 ${ans}`) + frameHTML(10, 'apple', { cross: b }) };
  }
};

/* ③ 10 올가미: 10을 만들어 더하기 */
STN.s1c = {
  stage: 1, name: '10 올가미', icon: '🪢',
  gen(L, i) {
    const k = R(1, 9), m = 10 - k, t = R(1, 9);
    const pos = L === 1 ? 0 : (L === 4 && i % 2 === 0) ? 2 : R(0, 2);
    const nums = pos === 0 ? [k, m, t] : pos === 1 ? [t, k, m] : [k, t, m];
    const pr = pos === 0 ? [0, 1] : pos === 1 ? [1, 2] : [0, 2];
    const ans = 10 + t;
    const grpRow = (hl) => row(...nums.map((n, x) => `<div class="gbox ${hl && pr.includes(x) ? 'ring' : ''}" data-x="${x}">${groupHTML(n)}<b>${n}</b></div>`).flatMap((g, x) => x ? [OP('+'), g] : [g]));
    const base = { answer: ans, min: 10, max: 19, key: nums.join('+'), hint: grpRow(true),
      sol: soltx(`${k} + ${m} = 10<br>10 + ${t} = ${ans}`) + row(frameHTML(10), OP('+'), groupHTML(t)), check: () => ans >= 11 && ans <= 19 };
    if (L === 1) return { ...base, needReady: true, q: '10이 되는 두 묶음을 눌러요', say: '더해서 10이 되는 두 묶음을 차례로 눌러요.', html: grpRow(false),
      setup(el, ctx) {
        let sel = [];
        $$('.gbox', el).forEach(g => g.onclick = () => {
          if (el.dataset.merged || g.classList.contains('sel')) return; g.classList.add('sel'); SFX.play('pop'); sel.push(g);
          if (sel.length < 2) return;
          const s = sel.reduce((a, x) => a + nums[+x.dataset.x], 0);
          if (s === 10) {
            el.dataset.merged = 1; const rest = [0, 1, 2].find(x => !sel.some(y => +y.dataset.x === x));
            setTimeout(() => { el.innerHTML = row(`<div class="col">${frameHTML(10, 'apple', { cls: 'full' })}<b class="big10">10</b></div>`, OP('+'), `<div class="gbox">${groupHTML(nums[rest])}<b>${nums[rest]}</b></div>`); SFX.play('go'); ctx.ready(); ctx.say('바구니 하나가 꽉 찼어요! 모두 몇 개일까요?'); }, 300);
          } else { setTimeout(() => { sel.forEach(x => { x.classList.remove('sel'); shake(x); }); sel = []; toast('더해서 10이 되는 두 묶음을 찾아요'); }, 300); }
        });
      } };
    if (L === 2) return { ...base, q: '10을 만들어 더해 봐요', say: '10이 되는 두 수를 먼저 찾아 더해 봐요. 모두 몇 개일까요?', html: grpRow(false) };
    if (L === 3) return { ...base, mode: 'pad', needReady: true, q: '10이 되는 두 수를 먼저 눌러요', say: '식에서 더해서 10이 되는 두 수를 먼저 눌러요.',
      html: `<div class="expr">${nums.map((n, x) => `<span class="n" data-x="${x}">${n}</span>`).join(' + ')} = <span class="blank"></span></div>`,
      setup(el, ctx) {
        let sel = [];
        $$('.n', el).forEach(s => s.onclick = () => {
          if (el.dataset.ok || s.classList.contains('sel')) return; s.classList.add('sel'); SFX.play('pop'); sel.push(s);
          if (sel.length < 2) return;
          if (sel.reduce((a, x) => a + nums[+x.dataset.x], 0) === 10) { el.dataset.ok = 1; sel.forEach(x => x.classList.add('ring')); SFX.play('go'); ctx.ready(); ctx.say('10이 되었어요! 이제 답을 써요.'); }
          else setTimeout(() => { sel.forEach(x => { x.classList.remove('sel'); shake(x); }); sel = []; }, 300);
        });
      } };
    if (i % 2 === 0) return { ...base, mode: 'pad', q: '10을 만들어 더해요', say: `${nums[0]} 더하기 ${nums[1]} 더하기 ${j(nums[2], '은')} 얼마일까요?`, html: expr(`${nums.join(' + ')} = □`) };
    const bl = nums.slice(); bl[pr[1]] = '□';
    return { ...base, mode: 'pad', answer: m, q: '네모에 알맞은 수는?', say: `${bl.join(' 더하기 ').replace('□', '네모')}는 ${ans}. 네모에 알맞은 수는?`, html: expr(`${bl.join(' + ')} = ${ans}`), min: 1, max: 9 };
  }
};

/* 대장 문제: 두디의 주사위 10 만들기 */
STN.s1x = {
  stage: 1, name: '두디의 주사위', icon: '🎲', side: 'char/duddy', counts: [3, 3, 3, 3],
  gen(L, i) {
    const roll = { setup(el) { rollDice(el); } };
    if (L <= 2) {
      const d = R(1, 6), ans = 10 - d;
      return { ...roll, answer: ans, min: 1, max: 9, key: 'd' + d, q: '10이 되려면 몇 개 더 있어야 할까요?', say: `두디가 주사위를 굴렸어요. ${j(d, '이')} 나왔어요. 10이 되려면 몇이 더 있어야 할까요?`,
        html: `<div class="col">${diceHTML(d)}${L === 1 ? frameHTML(d) : ''}</div>`, hint: frameHTML(d), sol: soltx(`${j(d, '과')} ${j(ans, '을')} 더하면 10`) + frameHTML(10, 'apple', { altFrom: d }) };
    }
    let d1, d2;
    if (L === 3) { do { d1 = R(1, 6); d2 = R(1, 6); } while (d1 + d2 > 9); }
    else { const over = i === 1 || Math.random() < .25; do { d1 = R(1, 6); d2 = R(1, 6); } while (over ? d1 + d2 <= 10 : d1 + d2 > 10); }
    const s = d1 + d2, ok = s <= 10, ans = ok ? 10 - s : 'X';
    const base = { ...roll, answer: ans, key: `${d1}+${d2}`, html: `<div class="col">${row(diceHTML(d1), diceHTML(d2))}${expr(`${d1} + ${d2} + □ = 10`)}</div>`,
      hint: row(frameHTML(s > 10 ? 10 : s), s > 10 ? groupHTML(s - 10) : ''),
      sol: ok ? soltx(`${d1} + ${d2} = ${s}<br>${s} + ${ans} = 10`) : soltx(`${d1} + ${d2} = ${s}<br>${j(s, '은')} 10보다 커요. 10을 만들 수 없어요`),
      ansLabel: ok ? ans : '만들 수 없어요', check: () => ok ? ans >= 0 && ans <= 8 : s > 10 };
    if (L === 3) return { ...base, mode: 'pad', q: '10을 완성해요', say: `주사위 ${j(d1, '과')} ${d2}. 네모에 얼마를 넣어야 10이 될까요?` };
    return { ...base, q: '카드를 골라 10을 완성해요', say: `주사위 ${j(d1, '과')} ${d2}. 어떤 카드를 더해야 10이 될까요? 만들 수 없으면 만들 수 없어요를 눌러요.`,
      choices: [...Array.from({ length: 10 }, (_, n) => ({ v: n, label: n, small: 1 })), { v: 'X', label: '만들 수 없어요', wide: 1 }] };
  }
};
