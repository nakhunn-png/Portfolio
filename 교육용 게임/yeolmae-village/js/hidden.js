'use strict';
/* ============ 히든 단계 ============ */

/* ★1 13 만들기 대회: 카드 세 장으로 13 만들기, 다른 조합 3개 */
STN.h1 = {
  stage: 1, hidden: true, name: '13 만들기 대회', icon: '⭐', counts: [1, 1, 1, 1, 1],
  gen() {
    return { mode: 'custom', answer: 0, key: 'h1' + Math.random(), q: '카드 세 장으로 13을 만들어요', say: '숫자 카드 세 장을 골라 더해서 13을 만들어요. 서로 다른 방법을 세 가지 찾아요.',
      html: `<div class="col"><div class="ncards">${Array.from({ length: 9 }, (_, k) => `<button class="ncard" data-v="${k + 1}">${k + 1}</button>`).join('')}</div>
        <div class="cap">고른 카드: <b class="pickd">-</b></div><div class="founds"></div></div>`,
      check: () => true,
      setup(el, ctx) {
        let sel = []; const found = new Set();
        const pk = $('.pickd', el), fd = $('.founds', el);
        $$('.ncard', el).forEach(c => c.onclick = () => {
          if (c.classList.contains('sel')) { c.classList.remove('sel'); sel = sel.filter(x => x !== c); }
          else { if (sel.length >= 3) return; c.classList.add('sel'); sel.push(c); }
          SFX.play('pop');
          const vs = sel.map(x => +x.dataset.v); pk.textContent = vs.length ? vs.join(' + ') : '-';
          if (vs.length < 3) return;
          const sum = vs.reduce((a, b) => a + b, 0), k = vs.slice().sort((a, b) => a - b).join('+');
          setTimeout(() => {
            if (sum !== 13) { ctx.miss(); SFX.play('no'); toast(`합이 ${sum}${hasB(sum) ? '이에요' : '예요'}`); }
            else if (found.has(k)) toast('이미 찾은 방법이에요');
            else { found.add(k); SFX.play('ok'); fd.insertAdjacentHTML('beforeend', `<div class="fnd">${vs.join(' + ')} = 13 ✓</div>`); if (found.size >= 3) { ctx.finish(true); } }
            sel.forEach(x => x.classList.remove('sel')); sel = []; pk.textContent = '-';
          }, 350);
        });
      } };
  }
};

/* ★2 같은 답 모으기 */
STN.h2 = {
  stage: 2, hidden: true, name: '같은 답 모으기', icon: '⭐', counts: [2, 2, 2, 2, 2],
  gen() {
    const T = R(11, 15); const set = new Map();
    while ([...set.values()].filter(x => x.ok).length < 3) { const a = R(T - 9, 9); if (a >= 2) set.set(`${a} + ${T - a}`, { ok: true, v: T }); }
    const s = R(1, 19 - T); set.set(`${T + s} − ${s}`, { ok: true, v: T });
    while (set.size < 8) { const v = T + pick([-1, 1]); const a = R(Math.max(2, v - 9), Math.min(9, v - 2)); const e = `${a} + ${v - a}`; if (!set.has(e)) set.set(e, { ok: false, v }); }
    const cards = shuffle([...set.entries()]); const need = cards.filter(c => c[1].ok).length;
    return { mode: 'custom', answer: 0, key: 'h2' + T, q: `답이 ${T}인 식을 모두 찾아요`, say: `답이 ${T}인 식 카드를 모두 찾아서 눌러요.`,
      html: `<div class="ecards">${cards.map(([e, o], k) => `<button class="ecard" data-k="${k}">${e}</button>`).join('')}</div>`,
      check: () => cards.every(([e, o]) => (o.ok ? o.v === T : o.v !== T)),
      setup(el, ctx) {
        let got = 0;
        $$('.ecard', el).forEach(b => b.onclick = () => {
          if (b.classList.contains('ok')) return; const [, o] = cards[+b.dataset.k];
          if (o.ok) { b.classList.add('ok'); popIn(b); if (++got === need) ctx.finish(true); }
          else { ctx.miss(); SFX.play('no'); shake(b); b.dataset.v = o.v; b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 1200); }
        });
      } };
  }
};

/* ★3 가장 짧은 배달 */
STN.h3 = { stage: 3, hidden: true, name: '가장 짧은 배달', icon: '⭐', side: 'char/robot', counts: [3, 3, 3, 3, 3], gen: () => robotProblem(4, true) };
