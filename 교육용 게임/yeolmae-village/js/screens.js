'use strict';
/* ================= 꾸미기 아이템 ================= */
const SHOP = [
  { id: 'straw_hat', n: '밀짚모자', price: 5, slot: 'head' },
  { id: 'ribbon', n: '리본', price: 5, slot: 'head' },
  { id: 'flowerpot', n: '꽃 화분', price: 8, slot: 'hand' },
  { id: 'umbrella', n: '무지개 우산', price: 8, slot: 'hand' },
  { id: 'star_cape', n: '별 망토', gold: 1, slot: 'back' },
  { id: 'crown', n: '왕관', gold: 2, slot: 'head' }
];
function tokiHTML(size = 160) {
  const w = G.P ? G.P.wear : {};
  const lay = (slot, css, sz) => w[slot] ? `<span class="wear ${slot}" style="${css}">${pic('item/' + w[slot], Math.round(size * sz))}</span>` : '';
  return `<span class="toki" style="width:${size}px;height:${size}px">
    ${lay('back', `left:${-size * .12}px;top:${size * .25}px`, .7)}
    ${pic('char/toki', size)}
    ${lay('head', `left:${size * .22}px;top:${-size * .22}px`, .56)}
    ${lay('hand', `left:${size * .66}px;top:${size * .42}px`, .5)}
  </span>`;
}

/* ================= 반·번호 ================= */
let titleTaps = 0, titleTimer = null;
function showLogin() {
  G.P = null; let cls = 0, num = 0;
  const recent = STORE.get('recent', []);
  const root = screen('login', `<div class="login" style="${bgStyle('title')}">
    <h1 class="title" data-a="title">열매 마을 축제</h1>
    <div class="lwrap">
      <div class="lpic">${pic('char/toki', 200)}</div>
      <div class="lform">
        ${recent.length ? `<div class="lrow"><span class="lt">최근</span>${recent.map(k => `<button class="btn sm rec" data-r="${k}">${k.replace('-', '반 ')}번</button>`).join('')}</div>` : ''}
        <div class="lt">몇 반이에요?</div>
        <div class="clsrow">${Array.from({ length: 10 }, (_, i) => `<button class="nb" data-c="${i + 1}">${i + 1}</button>`).join('')}</div>
        <div class="lt">몇 번이에요?</div>
        <div class="numgrid">${Array.from({ length: 30 }, (_, i) => `<button class="nb" data-n="${i + 1}">${i + 1}</button>`).join('')}</div>
        <button class="btn pri big" data-a="go" disabled>시작하기</button>
      </div>
    </div></div>`);
  const go = $('[data-a=go]', root);
  const upd = () => { go.disabled = !(cls && num); go.textContent = cls && num ? `${cls}반 ${num}번 시작하기` : '시작하기'; };
  root.onclick = e => {
    const b = e.target.closest('button,[data-a]'); if (!b) return;
    SFX.unlock();
    if (b.dataset.c) { cls = +b.dataset.c; $$('[data-c]', root).forEach(x => x.classList.toggle('sel', x === b)); SFX.play('pop'); upd(); }
    if (b.dataset.n) { num = +b.dataset.n; $$('[data-n]', root).forEach(x => x.classList.toggle('sel', x === b)); SFX.play('pop'); upd(); }
    if (b.dataset.r) { const [c, n] = b.dataset.r.split('-').map(Number); confirmLogin(c, n); }
    if (b.dataset.a === 'go' && cls && num) confirmLogin(cls, num);
    if (b.dataset.a === 'title') {
      titleTaps++; clearTimeout(titleTimer); titleTimer = setTimeout(() => titleTaps = 0, 1500);
      if (titleTaps >= 5) { titleTaps = 0; teacherCode(); }
    }
  };
}
function confirmLogin(c, n) {
  const m = modal(`<h2>${c}반 ${n}번 맞아요?</h2><div class="mbtns"><button class="btn" data-m="no">아니요</button><button class="btn pri" data-m="yes">네, 맞아요</button></div>`);
  TTS.speak(`${c}반 ${n}번 맞아요?`);
  m.onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b) return; closeModal();
    if (b.dataset.m !== 'yes') return;
    G.cls = c; G.num = n;
    G.P = Object.assign(newProfile(), STORE.get(pkey(), {}));
    const k = `${c}-${n}`; const rc = STORE.get('recent', []).filter(x => x !== k); rc.unshift(k); STORE.set('recent', rc.slice(0, 6));
    save(); goFull();
    if (!G.P.prologue) showPrologue(); else showMap();
  };
}
function goFull() { const d = document.documentElement; try { if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => { }); } catch (e) { } }

/* ================= 프롤로그 ================= */
function showPrologue() {
  const slides = [
    { k: 'char/owl', t: '열매 마을에 축제가 열려요!' },
    { k: 'char/owl', t: '그런데 준비할 게 아주 많아요. 열매도 따고, 물건도 나르고, 달걀빵도 구워야 해요.' },
    { k: 'char/toki', t: '톡이야, 친구들을 도와 축제를 준비해 줄래?' }
  ];
  let i = 0;
  const draw = () => {
    const s = slides[i];
    const root = screen('pro', `<div class="pro" style="${bgStyle('title')}"><div class="pcard">${s.k === 'char/toki' ? tokiHTML(220) : pic(s.k, 220)}<p>${s.t}</p>
      <div class="mbtns"><button class="btn" data-a="skip">건너뛰기</button><button class="btn pri big" data-a="next">${i < slides.length - 1 ? '다음' : '좋아요!'}</button></div></div></div>`);
    TTS.speak(s.t);
    root.onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return; SFX.play('pop');
      if (b.dataset.a === 'next' && i < slides.length - 1) { i++; draw(); return; }
      G.P.prologue = true; save(); showMap();
    };
  };
  draw();
}

/* ================= 마을 지도 ================= */
const NODE_POS = [[70, 150], [230, 255], [70, 365], [215, 480]];
const PIECE_POS = { 1: [300, 120], 2: [320, 380], 3: [320, 140] };
function showMap() {
  G.run = null; const P = G.P;
  const region = st => {
    const S = STAGES[st]; const ids = ORDER.slice((st - 1) * 4, st * 4);
    const pts = NODE_POS.map(([x, y]) => `${x + 60},${y + 60}`).join(' ');
    const nodes = ids.map((id, k) => {
      const d = STN[id], open = isOpen(id), done = !!P.done[id];
      const next = open && !done;
      const [x, y] = NODE_POS[k];
      return `<button class="node ${open ? '' : 'lock'} ${done ? 'done' : ''} ${next ? 'next' : ''} ${k === 3 ? 'boss' : ''}" style="left:${x}px;top:${y}px" data-s="${id}">
        <span class="ni">${open ? d.icon : '🔒'}</span>${done ? `<span class="nb2">${pic(LV[P.best[id]].k, 40)}</span>` : ''}<span class="nl">${d.name}</span></button>`;
    }).join('');
    const hid = S.hidden; let hnode = '';
    if (P.ending || P.allOpen) {
      const ok = isOpen(hid), done = P.hiddenDone[hid];
      hnode = `<button class="node hid ${ok ? '' : 'lock'} ${done ? 'done' : ''}" style="left:40px;top:540px" data-s="${hid}"><span class="ni">${ok ? '⭐' : '🔒'}</span><span class="nl">${ok ? STN[hid].name : '10 조각 필요'}</span></button>`;
    }
    let piece = '';
    if (P.done[S.grow] && !P.pieces.includes(st)) {
      const [x, y] = PIECE_POS[st];
      piece = `<button class="piece ${P.ending ? 'bright' : ''}" style="left:${x}px;top:${y}px" data-p="${st}">✨</button>`;
    }
    return `<div class="region r${st}" style="${bgStyle(S.bg)}">
      <div class="rh">${pic(compKey(st), 76)}<span>${S.name}</span></div>
      <svg class="path"><polyline points="${pts}"/></svg>${nodes}${hnode}${piece}</div>`;
  };
  const root = screen('map', `<div class="map" style="${bgStyle('map')}">
    <div class="topbar"><div class="me">${tokiHTML(56)}<span>${G.cls}반 ${G.num}번</span></div>
      <div class="ttl"><span>열매 마을 축제</span></div>
      <div class="tbtns">${moneyHTML()}<button class="btn sm" data-a="album">📖 도감</button>${P.shelterSeen ? '<button class="btn sm" data-a="shop">🛍️ 쉼터</button>' : ''}${P.ending ? '<button class="btn sm" data-a="end">🎉 축제</button>' : ''}<button class="btn sm" data-a="out">나가기</button></div></div>
    <div class="regions">${region(1)}${region(2)}${region(3)}</div></div>`);
  root.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; SFX.play('pop');
    if (b.dataset.s) {
      const id = b.dataset.s;
      if (!isOpen(id)) { shake(b); toast(HIDDEN.includes(id) ? '숨은 10 조각을 찾아야 열려요' : '앞 정거장을 먼저 해요'); return; }
      return openStation(id);
    }
    if (b.dataset.p) return getPiece(+b.dataset.p);
    const a = b.dataset.a;
    if (a === 'album') showAlbum();
    if (a === 'shop') showShelter(showMap);
    if (a === 'end') showEnding(false);
    if (a === 'out') showLogin();
  };
}
function getPiece(st) {
  if (!G.P.pieces.includes(st)) G.P.pieces.push(st); save(); SFX.play('item');
  const n = G.P.pieces.length;
  const m = modal(`${pic('item/piece', 150, 'bounce')}<h2>숨은 10 조각을 찾았어요!</h2><p>${n}개 모았어요. ${n < 3 ? '다른 곳에도 숨어 있어요.' : '모두 모았어요! 축제 날 누군가 나타날지도 몰라요.'}</p><div class="mbtns"><button class="btn pri" data-m="ok">좋아요</button></div>`);
  TTS.speak('숨은 10 조각을 찾았어요!');
  m.onclick = e => { if (e.target.closest('[data-m]')) { closeModal(); showMap(); } };
}
function openStation(id) {
  const d = STN[id], st = d.stage, P = G.P;
  if (d.hidden) return RUN.start(id, 5);
  if (!P.intro[st]) {
    const S = STAGES[st];
    const m = modal(`${pic(compKey(st), 180, 'bounce')}<h2>${S.name}</h2><p>${S.compName}: ${S.intro}</p><div class="mbtns"><button class="btn pri big" data-m="ok">좋아요!</button></div>`);
    TTS.speak(S.intro);
    m.onclick = e => { if (!e.target.closest('[data-m]')) return; P.intro[st] = true; save(); closeModal(); levelSelect(id); };
    return;
  }
  levelSelect(id);
}
function levelSelect(id) {
  const P = G.P, d = STN[id];
  const rec = Object.keys(P.done).length ? P.rec : 2;
  const m = modal(`<h2>${d.icon} ${d.name}</h2><p>어떤 단계로 해 볼까요?</p>
    <div class="lvs">${[1, 2, 3, 4].map(L => `<button class="lv ${L === rec ? 'rec' : ''}" data-l="${L}">${L === rec ? '<em>추천</em>' : ''}${pic(LV[L].k, 90)}<b>${LV[L].n}</b><small>${LV[L].d}</small></button>`).join('')}</div>
    <div class="mbtns"><button class="btn" data-m="back">돌아가기</button></div>`, 'wide');
  TTS.speak('어떤 단계로 해 볼까요?');
  m.onclick = e => {
    const b = e.target.closest('[data-l],[data-m]'); if (!b) return; SFX.play('pop'); closeModal();
    if (b.dataset.l) RUN.start(id, +b.dataset.l);
  };
}

/* ================= 쉬는 시간 ================= */
function showBreak() {
  const root = screen('break', `<div class="brk" style="${bgStyle('break')}"><div class="pcard">
    <div class="brow">${pic(compKey(1), 110)}${pic(compKey(2), 110)}${tokiHTML(130)}</div>
    <h1>1교시 끝! 쉬는 시간이에요</h1><p>잘 저장했어요. 선생님 말씀을 기다려요.</p>
    <button class="btn pri big hold" data-a="hold"><span class="fill"></span><span class="lbl">2교시 시작 (꾹 누르기)</span></button></div></div>`);
  TTS.speak('1교시 끝! 쉬는 시간이에요.');
  const b = $('[data-a=hold]', root); let t = null;
  const down = e => { e.preventDefault(); b.classList.add('holding'); t = setTimeout(() => { SFX.play('go'); showMap(); }, 2000); };
  const up = () => { b.classList.remove('holding'); clearTimeout(t); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
}

/* ================= 쉼터 ================= */
function showShelter(back) {
  const P = G.P;
  const draw = () => {
    const root = screen('shop', `<div class="shop" style="${bgStyle('shelter')}">
      <div class="topbar"><div class="ttl"><span>🛍️ 쉼터</span></div>${moneyHTML()}</div>
      <div class="shopin"><div class="preview">${tokiHTML(260)}<p>열매로 톡이를 꾸며 봐요!</p></div>
      <div class="goods">${SHOP.map(it => {
        const own = P.items.includes(it.id), on = P.wear[it.slot] === it.id;
        const price = it.gold ? `${pic('item/golden_fruit', 30)} ${it.gold}` : `${pic('item/fruit', 30)} ${it.price}`;
        return `<div class="good ${own ? 'own' : ''}">${pic('item/' + it.id, 96)}<b>${it.n}</b>
          ${own ? `<button class="btn sm ${on ? 'pri' : ''}" data-w="${it.id}">${on ? '벗기' : '입기'}</button>` : `<button class="btn sm" data-b="${it.id}">${price}</button>`}</div>`;
      }).join('')}</div></div>
      <button class="btn pri big done" data-a="done">다 골랐어요</button></div>`);
    root.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.b) {
        const it = SHOP.find(x => x.id === b.dataset.b);
        const okk = it.gold ? P.gold >= it.gold : P.fruit >= it.price;
        if (!okk) { shake(b); SFX.play('no'); toast(it.gold ? '황금 열매가 모자라요' : '열매가 모자라요'); return; }
        if (it.gold) P.gold -= it.gold; else P.fruit -= it.price;
        P.items.push(it.id); P.wear[it.slot] = it.id; SFX.play('item');
        const got = []; checkAch(got); save(); draw();
        if (got.length) toast(`숨은 업적: ${ACH.items4.n}`, 2000);
        return;
      }
      if (b.dataset.w) { const it = SHOP.find(x => x.id === b.dataset.w); if (P.wear[it.slot] === it.id) delete P.wear[it.slot]; else P.wear[it.slot] = it.id; SFX.play('pop'); save(); draw(); return; }
      if (b.dataset.a === 'done') { SFX.play('pop'); back(); }
    };
  };
  draw(); TTS.speak('열매로 톡이를 꾸며 봐요!');
}

/* ================= 도감 ================= */
function showAlbum() {
  const P = G.P;
  const slot = (ok, html, label) => `<div class="slot ${ok ? '' : 'no'}">${html}<span>${ok ? label : '???'}</span></div>`;
  const friends = [1, 2, 3].map(st => { const S = STAGES[st]; const met = P.intro[st]; return slot(met, pic(compKey(st), 90), S.compName); }).join('')
    + slot(P.ending && P.pieces.length >= 3, pic(P.ending && P.pieces.length >= 3 ? 'char/yeori' : 'char/yeori_shadow', 90), '열이');
  const tools = [1, 2, 3].map(st => { const S = STAGES[st]; return slot(P.tools.includes(S.tool), pic('item/' + S.tool, 80), S.toolName); }).join('');
  const items = SHOP.map(it => slot(P.items.includes(it.id), pic('item/' + it.id, 80), it.n)).join('');
  const achs = Object.keys(ACH).map(k => slot(P.ach.includes(k), pic('item/badge', 70), ACH[k].n)).join('');
  const pieces = [1, 2, 3].map(st => slot(P.pieces.includes(st), pic('item/piece', 70), '10 조각')).join('');
  const root = screen('album', `<div class="album"><div class="topbar"><div class="ttl"><span>📖 도감</span></div><button class="btn sm" data-a="back">지도로</button></div>
    <div class="abody">
      <h3>친구</h3><div class="slots">${friends}</div>
      <h3>도구</h3><div class="slots">${tools}</div>
      <h3>꾸미기</h3><div class="slots">${items}</div>
      <h3>숨은 업적</h3><div class="slots">${achs}</div>
      <h3>10 조각 · 도전 배지 ${P.badge}개</h3><div class="slots">${pieces}</div>
    </div></div>`);
  root.onclick = e => { if (e.target.closest('[data-a=back]')) { SFX.play('pop'); showMap(); } };
}

/* ================= 엔딩 ================= */
function showEnding(first) {
  const P = G.P, yeori = P.pieces.length >= 3;
  const root = screen('end', `<div class="ending" style="${bgStyle('ending')}">
    <h1 class="etitle">열매 마을 축제가 열렸어요!</h1>
    <div class="stagef">${pic(compKey(1, 3), 170, 'bounce')}${pic(compKey(2, 3), 170, 'bounce d1')}${tokiHTML(200)}${pic(compKey(3, 3), 170, 'bounce d2')}
      ${yeori ? pic('char/yeori', 170, 'bounce d3 glow') : pic('char/yeori_shadow', 140, 'shadow')}</div>
    <div class="endcard"><p>${yeori ? '숨은 친구 열이가 축제에 왔어요! ⭐ 히든 단계가 열렸어요.' : '숨은 친구가 있어요. 지도에서 반짝이는 곳을 찾아봐요. 10 조각을 찾으면 히든 단계가 열려요.'}</p>
    <div class="mbtns"><button class="btn" data-a="album">📖 도감</button><button class="btn" data-a="shop">🛍️ 쉼터</button><button class="btn pri big" data-a="map">지도로</button></div></div></div>`);
  if (first) SFX.play('up');
  TTS.speak('열매 마을 축제가 열렸어요! ' + (yeori ? '숨은 친구 열이가 축제에 왔어요!' : '숨은 친구가 있어요. 지도에서 반짝이는 곳을 찾아봐요.'));
  root.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return; SFX.play('pop');
    if (b.dataset.a === 'album') showAlbum();
    if (b.dataset.a === 'shop') showShelter(() => showEnding(false));
    if (b.dataset.a === 'map') showMap();
  };
}

/* ================= 교사 메뉴 ================= */
function teacherCode() {
  let v = '';
  const m = modal(`<h2>선생님 메뉴</h2><div class="pdisp tcode"></div><div class="pkeys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(k => `<button class="pk" data-k="${k}">${k}</button>`).join('')}<button class="pk del" data-k="del">⌫</button><button class="pk ok" data-k="ok">확인</button></div><div class="mbtns"><button class="btn" data-k="close">닫기</button></div>`);
  const disp = $('.tcode', m);
  m.onclick = e => {
    const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'close') return closeModal();
    if (k === 'del') v = v.slice(0, -1); else if (k === 'ok') { if (v === '1010') teacherMenu(); else { shake(disp); v = ''; } }
    else if (v.length < 4) v += k;
    disp.textContent = '●'.repeat(v.length);
  };
}
function teacherMenu() {
  const m = modal(`<h2>선생님 메뉴</h2>
    <div class="tmenu">
      <button class="btn" data-t="snd">소리: ${SET.sound ? '켜짐' : '꺼짐'}</button>
      <button class="btn" data-t="voice">음성 읽기: ${SET.voice ? '켜짐' : '꺼짐'}${TTS.ok ? '' : ' (이 브라우저는 지원 안 함)'}</button>
      <button class="btn" data-t="one">한 학생 기록 지우기</button>
      <button class="btn" data-t="openall">한 학생 모든 스테이지 열기</button>
      <button class="btn warn" data-t="all">이 태블릿의 모든 기록 지우기</button>
      <button class="btn" data-t="test">문제 범위 검사</button>
    </div>
    <p class="tinfo">${STORE.broken ? '⚠ 이 브라우저는 저장이 안 되는 상태예요.' : '저장 상태: 정상'} · 저장된 학생 ${STORE.keys().filter(k => k.startsWith('p:')).length}명</p>
    <div class="tout"></div>
    <div class="mbtns"><button class="btn pri" data-t="close">닫기</button></div>`, 'wide');
  const out = $('.tout', m);
  const askStudent = (cb) => {
    out.innerHTML = `<div class="ask">반 <select class="sc">${Array.from({ length: 10 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select> 번호 <select class="sn">${Array.from({ length: 30 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select> <button class="btn sm pri" data-t="doask">실행</button></div>`;
    m.dataset.ask = '1'; m._ask = cb;
  };
  m.onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t;
    if (t === 'close') return closeModal();
    if (t === 'snd') { SET.sound = !SET.sound; saveSettings(); teacherMenu(); }
    if (t === 'voice') { SET.voice = !SET.voice; saveSettings(); teacherMenu(); }
    if (t === 'one') askStudent((c, n) => { STORE.del(`p:${c}-${n}`); out.textContent = `${c}반 ${n}번 기록을 지웠어요.`; });
    if (t === 'openall') askStudent((c, n) => { const P = Object.assign(newProfile(), STORE.get(`p:${c}-${n}`, {})); P.allOpen = true; P.prologue = true; STORE.set(`p:${c}-${n}`, P); out.textContent = `${c}반 ${n}번의 모든 스테이지를 열었어요.`; });
    if (t === 'doask') { const c = +$('.sc', m).value, n = +$('.sn', m).value; m._ask && m._ask(c, n); }
    if (t === 'all') {
      if (b.dataset.sure) { STORE.keys().filter(k => k !== 'settings').forEach(k => STORE.del(k)); out.textContent = '이 태블릿의 모든 기록을 지웠어요.'; b.dataset.sure = ''; b.textContent = '이 태블릿의 모든 기록 지우기'; }
      else { b.dataset.sure = '1'; b.textContent = '정말 지울까요? 한 번 더 누르세요'; }
    }
    if (t === 'test') { out.innerHTML = '<pre>' + runTests().join('\n') + '</pre>'; }
  };
}

/* ================= 문제 범위 검사 ================= */
function runTests() {
  const lines = []; const save0 = G.run, P0 = G.P;
  G.P = G.P || newProfile();
  for (const id of ORDER.concat(HIDDEN)) {
    const d = STN[id]; const lvls = d.hidden ? [5] : [1, 2, 3, 4]; let bad = 0, total = 0, msg = '';
    for (const L of lvls) {
      const cnt = d.counts ? d.counts[Math.min(L, d.counts.length) - 1] : COUNTS[L - 1];
      for (let rep = 0; rep < 250; rep++) {
        G.run = { flip: rep % 2 === 0 };
        for (let i = 0; i < cnt; i++) {
          total++;
          let p; try { p = d.gen(L, i); } catch (e) { bad++; msg = msg || `L${L}: ${e.message}`; continue; }
          let ok = p && p.answer !== undefined && p.answer !== null && !(typeof p.answer === 'number' && !Number.isFinite(p.answer));
          if (ok && (p.mode || 'choice') === 'choice') {
            const ch = (p.choices || autoChoices(+p.answer, p)).map(c => String(typeof c === 'object' ? c.v : c));
            ok = ch.includes(String(p.answer)) && new Set(ch).size === ch.length;
          }
          if (ok && p.check) ok = !!p.check();
          if (!ok) { bad++; msg = msg || `L${L}: ${strip(p && (p.key || p.say))}`; }
        }
      }
    }
    lines.push(`${bad ? '✕' : '✓'} ${id} ${d.name}: ${total}문제 중 이상 ${bad}${msg ? ' (' + msg + ')' : ''}`);
  }
  G.run = save0; G.P = P0;
  return lines;
}

/* ================= 시작 ================= */
function fit() {
  const g = $('#g'); const s = Math.min(innerWidth / 1280, innerHeight / 800); G.scale = s;
  g.style.transform = `translate(-50%,-50%) scale(${s})`;
  $('#rotate').classList.toggle('on', innerHeight > innerWidth * 1.05);
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 300));
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
window.addEventListener('DOMContentLoaded', () => { fit(); showLogin(); });
