'use strict';
/* ================= 게임 데이터 ================= */
const STN = {};
const ORDER = ['s1a', 's1b', 's1c', 's1x', 's2a', 's2b', 's2c', 's2x', 's3a', 's3b', 's3c', 's3x'];
const HIDDEN = ['h1', 'h2', 'h3'];
const STAGES = {
  1: { name: '열매 과수원', comp: 'tori', compName: '토리', bg: 'orchard', tool: 'glasses', toolName: '10칸 틀 안경', first: 's1a', grow: 's1b', boss: 's1x', hidden: 'h1',
    intro: '축제에 쓸 열매를 따러 가요! 바구니에는 10개가 들어가요.' },
  2: { name: '택배 마을', comp: 'gomi', compName: '고미', bg: 'delivery', tool: 'frog_shoes', toolName: '개구리 점프 신발', first: 's2a', grow: 's2b', boss: 's2x', hidden: 'h2',
    intro: '축제 물건을 트럭으로 날라요! 트럭 한 대에는 10개가 들어가요.' },
  3: { name: '달걀 가게', comp: 'kkoko', compName: '꼬꼬', bg: 'eggshop', tool: 'magnifier', toolName: '달걀판 돋보기', first: 's3a', grow: 's3b', boss: 's3x', hidden: 'h3',
    intro: '달걀빵 주문이 밀려 있어요! 달걀판 한 판에는 10개가 들어가요.' }
};
const LV = [null,
  { n: '씨앗', k: 'item/lv1_seed', d: '물건을 옮기며 풀어요' },
  { n: '새싹', k: 'item/lv2_sprout', d: '그림을 보고 골라요' },
  { n: '나무', k: 'item/lv3_tree', d: '식을 보고 풀어요' },
  { n: '열매', k: 'item/lv4_fruit', d: '어려운 도전 문제' },
  { n: '히든', k: 'item/lv5_star', d: '숨겨진 문제' }];
const COUNTS = [3, 4, 4, 4];
const ACH = {
  ten: { n: '10 박사', d: '답이 10인 문제를 10개 풀었어요' },
  perfect: { n: '한 번에 척척', d: '정거장 문제를 모두 한 번에 맞혔어요' },
  grown: { n: '친구 키우기', d: '세 친구를 모두 다 키웠어요' },
  items4: { n: '멋쟁이', d: '꾸미기 아이템을 4개 모았어요' }
};

function compForm(stage) { const s = STAGES[stage], d = G.P.done; return d[s.boss] ? 3 : d[s.grow] ? 2 : 1; }
function compKey(stage, f) { return `char/${STAGES[stage].comp}_${f || compForm(stage)}`; }
function isOpen(id) {
  if (G.P.allOpen) return true;
  if (HIDDEN.includes(id)) { const st = STN[id].stage; return G.P.ending && G.P.pieces.includes(st); }
  const i = ORDER.indexOf(id); return i === 0 || !!G.P.done[ORDER[i - 1]];
}
function moneyHTML() { return `<div class="money"><span>${pic('item/fruit', 40)}<b>${G.P.fruit}</b></span><span>${pic('item/golden_fruit', 40)}<b>${G.P.gold}</b></span></div>`; }

function autoChoices(ans, o = {}) {
  const lo = o.min ?? 0, hi = o.max ?? 99;
  let cand = [-2, -1, 1, 2]; if (ans >= 10) cand = cand.concat([-10, 10]);
  cand = shuffle(cand.map(d => ans + d).filter(v => v >= lo && v <= hi && v !== ans));
  const out = [ans]; for (const c of cand) { if (out.length >= 3) break; if (!out.includes(c)) out.push(c); }
  while (out.length < 3) { const v = R(lo, Math.max(lo + 3, Math.min(hi, ans + 5))); if (!out.includes(v)) out.push(v); }
  return shuffle(out);
}

/* ================= 정거장 진행 ================= */
const RUN = {
  start(id, L) {
    const d = STN[id]; const cnt = d.counts ? d.counts[Math.min(L, d.counts.length) - 1] : COUNTS[L - 1];
    G.run = { id, d, L, cnt, i: 0, first: 0, reveal: 0, earned: 0, recent: [], flip: Math.random() < .5 };
    RUN.next();
  },
  next() {
    const r = G.run; if (r.i >= r.cnt) return RUN.finish();
    let p, k = 0;
    do { p = r.d.gen(r.L, r.i); k++; } while (k < 25 && r.recent.includes(p.key || p.say));
    r.recent.push(p.key || p.say);
    if (!p.mode) p.mode = 'choice';
    r.p = p; r.miss = 0; r.done = false;
    showPlay();
  },
  submit(v, btn) {
    const r = G.run; if (!r || r.done) return;
    if (String(v) === String(r.p.answer)) { r.done = true; if (btn) btn.classList.add('yes'); RUN.right(); }
    else RUN.wrong(btn);
  },
  right() {
    const r = G.run, first = r.miss === 0; SFX.play('ok'); cheer(first ? '잘했어요!' : '맞았어요!');
    if (+r.p.answer === 10) G.P.ten++;
    const bl = $('.vis .blank'); if (bl) { bl.textContent = r.p.answer; bl.classList.add('filled'); }
    RUN.award(first);
  },
  award(first) {
    const r = G.run; const n = first ? 2 : 1; r.earned += n; G.P.fruit += n; if (first) r.first++;
    save(); const m = $('.money b'); if (m) m.textContent = G.P.fruit;
    setTimeout(() => { if (G.run === r) { r.i++; RUN.next(); } }, 1200);
  },
  wrong(btn) {
    const r = G.run; r.miss++; SFX.play('no');
    if (btn) { btn.classList.add('no'); btn.disabled = true; }
    shake($('.ans'));
    if (r.miss === 1) {
      toast('다시 해 볼까요?'); TTS.speak('다시 해 볼까요?');
      if (r.pad) r.pad.clear();
      if (r.L >= 3 && r.p.hint) setTimeout(showHint, 500);
    } else { r.done = true; r.reveal++; setTimeout(showSolution, 500); }
  },
  finish() {
    const r = G.run, P = G.P, id = r.id, st = STAGES[r.d.stage];
    const formBefore = compForm(r.d.stage);
    const wasDone = !!P.done[id];
    P.done[id] = true; P.best[id] = Math.max(P.best[id] || 0, r.L);
    const got = []; const perfect = r.first === r.cnt;
    if (r.d.hidden) { P.gold += 2; P.hiddenDone[id] = true; got.push({ k: 'item/golden_fruit', t: '황금 열매 2개' }); }
    else {
      if (r.L > P.maxLv) { P.maxLv = r.L; P.fruit += 5; P.badge++; got.push({ k: 'item/badge', t: '도전 배지와 열매 5개' }); }
      if (r.L === 4) { P.gold++; got.push({ k: 'item/golden_fruit', t: '황금 열매 1개' }); }
      P.rec = clamp(r.L + (perfect ? 1 : 0) - (r.reveal >= 2 ? 1 : 0), 1, 4);
      if (id === st.first && !P.tools.includes(st.tool)) { P.tools.push(st.tool); got.push({ k: 'item/' + st.tool, t: `멋진 도구를 얻었어요! ${st.toolName}`, big: 1 }); }
    }
    if (perfect) unlockAch('perfect', got);
    const grown = compForm(r.d.stage) > formBefore;
    checkAch(got); save();
    showResult(r, got, grown, wasDone);
  }
};
function unlockAch(k, got) { if (!G.P.ach.includes(k)) { G.P.ach.push(k); got && got.push({ k: 'item/badge', t: `숨은 업적: ${ACH[k].n}`, ach: 1 }); } }
function checkAch(got) {
  const P = G.P;
  if (P.ten >= 10) unlockAch('ten', got);
  if (P.done.s1x && P.done.s2x && P.done.s3x) unlockAch('grown', got);
  if (P.items.length >= 4) unlockAch('items4', got);
}

/* ================= 문제 화면 ================= */
function showPlay() {
  const r = G.run, p = r.p, d = r.d, stg = STAGES[d.stage];
  const dots = Array.from({ length: r.cnt }, (_, k) => `<i class="${k < r.i ? 'on' : ''}${k === r.i ? ' cur' : ''}"></i>`).join('');
  const side = d.side || compKey(d.stage);
  const hasTool = !d.hidden && r.L >= 3 && p.hint && G.P.tools.includes(stg.tool);
  const root = screen('play', `<div class="play" style="${bgStyle(stg.bg)}">
    <div class="topbar"><button class="btn sm" data-a="home">🏠 지도</button>
      <div class="ttl">${pic(LV[r.L].k, 46)}<span>${d.name}</span></div>
      <div class="dots">${dots}</div>${moneyHTML()}</div>
    <div class="side">${pic(side, 200, 'sidepic')}<div class="bubble"><div class="q">${p.q}</div><button class="btn say" data-a="say">🔊 다시 듣기</button></div></div>
    <div class="vis ${p.wide ? 'wide' : ''}"><div class="vin">${p.html || ''}</div></div>
    <div class="ans"></div>
    ${hasTool ? `<button class="toolbtn" data-a="tool">${pic('item/' + stg.tool, 64)}<span>도구</span></button>` : ''}
  </div>`);
  const vin = $('.vin', root), ans = $('.ans', root);
  r.pad = null;
  const ctx = {
    root, vin, ans,
    ready() { ans.classList.remove('wait'); },
    miss() { r.miss++; },
    finish(first) { if (r.done) return; r.done = true; SFX.play('ok'); cheer(first ? '잘했어요!' : '해냈어요!'); RUN.award(first); },
    say(t) { $('.q', root).innerHTML = t; TTS.speak(t); },
    pad(cb, max) { r.pad = makePad(ans, cb, max); return r.pad; },
    choices(list, cb) { makeChoices(ans, list, cb); }
  };
  if (p.mode === 'choice') makeChoices(ans, p.choices || autoChoices(+p.answer, p), (v, b) => RUN.submit(v, b));
  else if (p.mode === 'pad') r.pad = makePad(ans, v => RUN.submit(v), p.max || 2);
  if (p.needReady) ans.classList.add('wait');
  if (p.setup) p.setup(vin, ctx);
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'say') TTS.speak(p.say || p.q);
    if (a.dataset.a === 'tool') showHint();
    if (a.dataset.a === 'home') {
      const m = modal(`<h2>지도로 갈까요?</h2><p>이 정거장은 다음에 처음부터 다시 해요.</p><div class="mbtns"><button class="btn" data-m="no">계속할래요</button><button class="btn pri" data-m="yes">지도로 가요</button></div>`);
      m.onclick = e2 => { const b = e2.target.closest('[data-m]'); if (!b) return; closeModal(); if (b.dataset.m === 'yes') { G.run = null; showMap(); } };
    }
  });
  setTimeout(() => { if (G.run === r && r.p === p) TTS.speak(p.say || p.q); }, 350);
}
function makeChoices(ans, list, onPick) {
  ans.innerHTML = `<div class="chs">${list.map(c => { const o = typeof c === 'object' ? c : { v: c, label: String(c) }; return `<button class="ch ${o.wide ? 'wide' : ''} ${o.small ? 'small' : ''}" data-v="${o.v}">${o.label}</button>`; }).join('')}</div>`;
  $$('.ch', ans).forEach(b => b.onclick = () => { SFX.play('pop'); onPick(b.dataset.v, b); });
}
function makePad(ans, onSubmit, max = 2) {
  let v = '';
  const keys = n => n.map(k => `<button class="pk" data-k="${k}">${k}</button>`).join('');
  ans.innerHTML = `<div class="pad"><div class="pdisp"></div><div class="pkeys">${keys([1, 2, 3, 4, 5])}<button class="pk del" data-k="del">⌫</button>${keys([6, 7, 8, 9, 0])}<button class="pk ok" data-k="ok">확인</button></div></div>`;
  const disp = $('.pdisp', ans);
  const upd = () => { disp.textContent = v; const bl = $('.vis .blank.cur') || $('.vis .blank:not(.filled)'); if (bl) bl.textContent = v; };
  $$('.pk', ans).forEach(b => b.onclick = () => {
    const k = b.dataset.k; SFX.play('pop');
    if (k === 'del') v = v.slice(0, -1);
    else if (k === 'ok') { if (v === '') { shake(disp); return; } const val = +v; onSubmit(val); return; }
    else if (v.length < max) v = (v === '0' ? '' : v) + k;
    upd();
  });
  upd();
  return { clear() { v = ''; upd(); } };
}
function showHint() {
  const r = G.run; if (!r || !r.p.hint) return;
  const v = $('.vis'); const old = $('.hintpop', v); if (old) { old.remove(); return; }
  const stg = STAGES[r.d.stage];
  const el = h(`<div class="hintpop"><div class="hh">${pic('item/' + stg.tool, 48)} ${stg.toolName}<button class="x">✕</button></div><div class="hb">${r.p.hint}</div></div>`);
  v.appendChild(el); SFX.play('item'); $('.x', el).onclick = () => el.remove();
}
function showSolution() {
  const r = G.run, p = r.p;
  const m = modal(`<h2>이렇게 풀어요</h2><div class="solb">${p.sol || ''}</div><div class="sola">답: <b>${p.ansLabel ?? p.answer}</b></div><div class="mbtns"><button class="btn pri" data-m="ok">알겠어요</button></div>`, 'wide');
  TTS.speak(strip(p.solSay || p.sol) + '. 답은 ' + (p.ansLabel ?? p.answer));
  m.onclick = e => { if (!e.target.closest('[data-m]')) return; closeModal(); if (G.run === r) { r.i++; RUN.next(); } };
}

/* ================= 정거장 결과 ================= */
function showResult(r, got, grown, wasDone) {
  const st = STAGES[r.d.stage];
  const items = got.map(g => `<div class="gotit ${g.big ? 'big' : ''}">${pic(g.k, g.big ? 110 : 64)}<span>${g.t}</span></div>`).join('');
  const root = screen('result', `<div class="result" style="${bgStyle(st.bg)}"><div class="rcard">
    <h1>정거장 완료!</h1>
    <div class="rrow">${pic(LV[r.L].k, 80)}<div class="earn">${pic('item/fruit', 56)}<b>+${r.earned}</b></div></div>
    ${grown ? `<div class="grow">${pic(compKey(r.d.stage), 150, 'bounce')}<span>${st.compName}${compForm(r.d.stage) === 3 ? '가 다 자랐어요!' : '가 자랐어요!'}</span></div>` : ''}
    <div class="gots">${items}</div>
    <button class="btn pri big" data-a="next">다음</button></div></div>`);
  SFX.play(got.length || grown ? 'up' : 'ok');
  TTS.speak('정거장 완료! ' + (grown ? st.compName + '가 자랐어요. ' : '') + got.map(g => g.t).join('. '));
  $('[data-a=next]', root).onclick = () => afterStation(r.id, wasDone);
}
function afterStation(id, wasDone) {
  const P = G.P; G.run = null;
  if (id === 's1x' && !P.shelterSeen) { P.shelterSeen = true; save(); return showShelter(showMap); }
  if (id === 's2x' && !P.breakSeen) { P.breakSeen = true; save(); return showBreak(); }
  if (id === 's3x' && !P.ending) { P.ending = true; save(); return showEnding(true); }
  showMap();
}
