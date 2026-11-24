// 화면 흐름: 처음 → 반·번호 → 캐릭터 → 단계 → 달리기 → 결과. 선생님 화면과 저장 연결도 여기서 한다.
(function (root) {
  'use strict';
  const D = root.GRD, Q = root.GRQ, Save = root.GRS, Game = root.GRGame, Sound = root.GRSound;
  const $ = (id) => document.getElementById(id);
  const SCREENS = ['sTitle', 'sWho', 'sKid', 'sStage', 'sPin', 'sTeacher'];
  const me = { cls: 0, num: 0, s: null, stage: 0 };
  let hintTimer = 0, tipTimer = 0;

  function show(id) {
    SCREENS.forEach((s) => { $(s).hidden = s !== id; });
    if (id) { Game.stop(); $('hud').hidden = true; $('bossPanel').hidden = true; ['hint', 'pause', 'result'].forEach((o) => { $(o).hidden = true; }); }
  }
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
    const to = b.dataset.back;
    if (to === 'sWho') return pickClass();
    show(to);
  }));

  // ---------- 반·번호 ----------
  function pickClass() {
    show('sWho');
    $('whoTitle').textContent = '몇 반이에요?';
    const grid = $('whoGrid'); grid.innerHTML = '';
    for (let c = 1; c <= 12; c++) {
      const b = document.createElement('button');
      b.textContent = c + '반';
      if (c === Save.lastClass) b.classList.add('has');
      b.onclick = () => pickNum(c);
      grid.appendChild(b);
    }
  }
  function pickNum(cls) {
    $('whoTitle').textContent = `${cls}반 · 몇 번이에요?`;
    const grid = $('whoGrid'); grid.innerHTML = '';
    for (let n = 1; n <= 30; n++) {
      const s = Save.load(cls, n);
      const b = document.createElement('button');
      b.innerHTML = `${n}${s ? `<small>${starSum(s)}★</small>` : ''}`;
      if (s) b.classList.add('has');
      b.onclick = () => { me.cls = cls; me.num = n; Save.lastClass = cls; me.s = Save.loadOrNew(cls, n); pickKid(); };
      grid.appendChild(b);
    }
  }
  const starSum = (s) => Object.values(s.stages || {}).reduce((a, x) => a + (x.stars || 0), 0);

  // ---------- 캐릭터 ----------
  function pickKid() {
    show('sKid');
    const grid = $('kidGrid'); grid.innerHTML = '';
    D.KIDS.forEach((k, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<img src="${k.img}" alt=""><span>${k.name}</span>`;
      if (me.s.kid === i && me.s.updated) b.classList.add('sel');
      b.onclick = () => { me.s.kid = i; Save.store(me.cls, me.num, me.s); pickStage(); };
      grid.appendChild(b);
    });
  }

  // ---------- 단계 ----------
  const unlocked = (i) => i === 0 || Save.unlockAll || ((me.s.stages[i - 1] || {}).stars || 0) >= D.UNLOCK_STARS;
  const starHtml = (n) => '★'.repeat(n) + `<span class="off">${'★'.repeat(3 - n)}</span>`;
  function pickStage() {
    show('sStage');
    $('whoLabel').textContent = `${me.cls}반 ${me.num}번 · ${D.KIDS[me.s.kid].name}`;
    const grid = $('stageGrid'); grid.innerHTML = '';
    D.STAGES.forEach((st, i) => {
      const open = unlocked(i), rec = me.s.stages[i] || {};
      const b = document.createElement('button');
      if (!open) b.classList.add('lock');
      b.innerHTML = `<span class="sn">${st.name}</span><span class="sx">${open ? st.ex : '🔒'}</span><span class="st">${st.title}</span><span class="ss">${starHtml(rec.stars || 0)}</span>`;
      b.onclick = () => {
        if (open) return play(i);
        b.querySelector('.st').textContent = `${D.STAGES[i - 1].name}에서 별 ${D.UNLOCK_STARS}개를 받으면 열려요`;
      };
      grid.appendChild(b);
    });
    drawWardrobe();
  }
  function drawWardrobe() {
    const box = $('wardrobe'); box.innerHTML = '';
    const owned = me.s.owned || [];
    D.COSTUMES.forEach((c) => {
      const has = owned.includes(c.k);
      const b = document.createElement('button');
      if (!has) b.classList.add('no');
      if (has && me.s.wear === c.k) b.classList.add('on');
      b.innerHTML = has ? `<i>${c.icon}</i>${c.name}` : `<i>${c.icon}</i>친구 ${c.req}명`;
      b.onclick = () => { if (!has) return; me.s.wear = me.s.wear === c.k ? null : c.k; Save.store(me.cls, me.num, me.s); drawWardrobe(); };
      box.appendChild(b);
    });
  }
  $('changeWho').onclick = pickClass;
  $('goStart').onclick = () => { Sound.unlock(); pickClass(); };

  // ---------- 달리기 ----------
  function play(i) {
    me.stage = i;
    show(null);
    SCREENS.forEach((s) => { $(s).hidden = true; });
    ['hint', 'pause', 'result'].forEach((o) => { $(o).hidden = true; });
    $('hud').hidden = false; $('bossPanel').hidden = true; $('banner').hidden = true;
    $('tip').style.opacity = 1; $('tip').hidden = false;
    clearTimeout(tipTimer); tipTimer = setTimeout(() => { $('tip').style.opacity = 0; }, 6000);
    $('stats').innerHTML = '';
    Game.start({ stage: i, kid: me.s.kid, speed: Save.speed, wear: me.s.wear || null, owned: me.s.owned || [], on: onGame });
  }

  function onGame(name, v) {
    if (name === 'question') {
      $('qtext').textContent = Q.text(v.q);
      $('prog').textContent = `${v.no} / ${v.of}`;
      const qb = $('qbox'); qb.classList.remove('pop'); void qb.offsetWidth; qb.classList.add('pop');
    }
    if (name === 'answer') record(v.q, v.c);
    if (name === 'hint') openHint(v.q, v.picked);
    if (name === 'bossIn') {
      $('hud').hidden = true;
      const bn = $('banner'); bn.textContent = `${v.name} 등장!`; bn.hidden = false;
      setTimeout(() => { bn.hidden = true; }, 1700);
    }
    if (name === 'bossQuestion') {
      $('bossPanel').hidden = false;
      $('bossNo').textContent = `${v.no} / ${v.of}`;
      $('bossQ').textContent = Q.text(v.q);
      const box = $('bossBtns'); box.innerHTML = '';
      v.ch.forEach((c, i) => {
        const b = document.createElement('button'); b.textContent = c.v;
        b.onclick = () => { $('bossPanel').hidden = true; Game.bossAnswer(i); };
        box.appendChild(b);
      });
    }
    if (name === 'stats') {
      const P = Game.POWERS;
      $('stats').innerHTML = Object.keys(P).filter((k) => v[k] > 0)
        .map((k) => `<span>${P[k].icon} ${P[k].name}${k === 'shield' ? ' ×' + v[k] : v[k] > 1 ? ' ' + v[k] : ''}</span>`).join('');
    }
    if (name === 'costume') {
      const c = D.COSTUMES.find((x) => x.k === v.k);
      me.s.owned = me.s.owned || [];
      if (!me.s.owned.includes(v.k)) me.s.owned.push(v.k);
      me.s.wear = v.k;
      Save.store(me.cls, me.num, me.s);
      const bn = $('banner'); const last = c.name.charCodeAt(c.name.length - 1) - 0xac00;
      bn.textContent = `${c.icon} ${c.name}${last >= 0 && last % 28 ? '을' : '를'} 얻었어요!`; bn.hidden = false;
      setTimeout(() => { bn.hidden = true; }, 1600);
    }
    if (name === 'end') showResult(v);
  }

  // 정답·오답 저장
  function record(q, c) {
    const s = me.s;
    const t = (s.types[q.type] = s.types[q.type] || { ok: 0, n: 0 });
    t.n++; if (c.ok) t.ok++;
    if (!c.ok) {
      s.wrong.push({ q: Q.text(q), a: c.v, c: q.ans, k: c.k, ty: q.type, t: Date.now() });
      if (s.wrong.length > 150) s.wrong.splice(0, s.wrong.length - 150);
    }
    Save.store(me.cls, me.num, s);
  }

  // ---------- 힌트(10칸 틀) ----------
  function frames(q) {
    // 칸마다 'r'(빨강), 'b'(파랑), 'x'(빼낸 것), ''(빈칸)
    let cells = [], say = '';
    const { a, b, ans } = q;
    if (q.op === '+') {
      cells = [...Array(a).fill('r'), ...Array(b).fill('b')];
      if (a + b >= 10) say = `${a}에 <b>${10 - a}</b>를 더하면 10, 남은 <b>${b - (10 - a)}</b>를 더하면 <b>${ans}</b>`;
      else if (a === 0 || b === 0) say = `0을 더하면 그대로 <b>${ans}</b>`;
      else say = `빨강 ${a}개와 파랑 ${b}개를 모으면 <b>${ans}</b>개`;
    } else {
      cells = Array(a).fill('r');
      const ones = a % 10;
      if (a >= 10 && ones < b) { // 받아내림: 10칸 틀에서 뺀다
        for (let i = 0; i < b; i++) cells[9 - i] = 'x';
        say = `10에서 ${b}를 빼면 <b>${10 - b}</b>, 남은 ${ones}와 모으면 <b>${ans}</b>`;
      } else {
        for (let i = 0; i < b; i++) cells[a - 1 - i] = 'x';
        say = b === 0 ? `0을 빼면 그대로 <b>${ans}</b>` : `${a}개에서 ${b}개를 지우면 <b>${ans}</b>개`;
      }
    }
    const nf = Math.max(1, Math.ceil(cells.length / 10));
    let html = '';
    for (let f = 0; f < nf; f++) {
      html += '<div class="frame">';
      for (let i = 0; i < 10; i++) html += `<i class="${cells[f * 10 + i] || ''}"></i>`;
      html += '</div>';
    }
    return { html, say };
  }
  function openHint(q, picked) {
    const fr = frames(q);
    $('hEq').innerHTML = `${Q.text(q)} = <b>${q.ans}</b>`;
    $('hPicked').textContent = `고른 답: ${picked.v}`;
    $('hFrames').innerHTML = fr.html;
    $('hSay').innerHTML = fr.say;
    $('hint').hidden = false;
    const ok = $('hOk'); ok.disabled = true;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { ok.disabled = false; }, 1200); // 바로 넘기지 않고 한 번은 보게
  }
  $('hOk').onclick = () => { if ($('hOk').disabled) return; $('hint').hidden = true; Game.resume(); };

  // ---------- 결과 ----------
  function showResult(r) {
    const s = me.s, before = unlocked(r.stage + 1);
    const rec = (s.stages[r.stage] = s.stages[r.stage] || { stars: 0, best: 0, plays: 0 });
    rec.stars = Math.max(rec.stars, r.stars); rec.best = Math.max(rec.best, Math.round(r.acc * 100)); rec.plays++;
    Save.store(me.cls, me.num, s);
    $('bossPanel').hidden = true; $('hud').hidden = true;
    $('rHead').textContent = r.beat ? '대장을 물리쳤어요!' : '대장이 도망갔어요!';
    $('rStars').innerHTML = starHtml(r.stars);
    $('rText').innerHTML = `${r.total}문제 중 <b>${r.correct}</b>개 맞혔어요<br>함께 달린 친구 <b>${r.friends}</b>명`;
    const last = r.stage >= D.STAGES.length - 1;
    const nowOpen = !last && unlocked(r.stage + 1);
    $('rUnlock').hidden = !(nowOpen && !before);
    $('rUnlock').textContent = nowOpen ? `🎉 ${D.STAGES[r.stage + 1].name}가 열렸어요!` : '';
    $('rNext').hidden = !nowOpen;
    if (!last && !nowOpen) { $('rUnlock').hidden = false; $('rUnlock').textContent = `별 ${D.UNLOCK_STARS}개를 받으면 다음 단계가 열려요`; }
    if (last && r.stars >= 2) { $('rUnlock').hidden = false; $('rUnlock').textContent = '🏆 모든 단계를 끝냈어요!'; }
    $('result').hidden = false;
  }
  $('rNext').onclick = () => play(me.stage + 1);
  $('rAgain').onclick = () => play(me.stage);
  $('rList').onclick = pickStage;

  // ---------- 멈춤 ----------
  $('pauseBtn').onclick = () => { Game.pause(true); $('pause').hidden = false; };
  $('pResume').onclick = () => { $('pause').hidden = true; Game.pause(false); };
  $('pQuit').onclick = () => { $('pause').hidden = true; pickStage(); };

  // ---------- 조작 ----------
  const cv = $('cv');
  let sx = null;
  cv.addEventListener('pointerdown', (e) => { sx = e.clientX; Game.tap(e.clientX, e.clientY); });
  cv.addEventListener('pointermove', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 50) { Game.moveBy(dx > 0 ? 1 : -1); sx = e.clientX; }
  });
  window.addEventListener('pointerup', () => { sx = null; });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') Game.moveBy(-1);
    if (e.key === 'ArrowRight') Game.moveBy(1);
  });

  // ---------- 선생님 ----------
  let pin = '';
  function openPin() {
    show('sPin'); pin = ''; drawPin();
    const pad = $('pinPad'); pad.innerHTML = '';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].forEach((k) => {
      const b = document.createElement('button'); b.textContent = k;
      if (!k) { b.style.visibility = 'hidden'; }
      b.onclick = () => {
        if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
        drawPin();
        if (pin.length === 4) {
          if (pin === D.TEACHER_PIN) setTimeout(() => openTeacher(Save.lastClass || Save.classesWithData()[0] || 1), 150);
          else { const d = $('pinDots'); d.classList.add('bad'); setTimeout(() => { d.classList.remove('bad'); pin = ''; drawPin(); }, 400); }
        }
      };
      pad.appendChild(b);
    });
  }
  function drawPin() { [...$('pinDots').children].forEach((i, k) => i.classList.toggle('on', k < pin.length)); }
  $('goTeacher').onclick = openPin;

  function openTeacher(cls) {
    show('sTeacher');
    // 설정
    const sp = $('setSpeed'); sp.innerHTML = '';
    Object.entries(D.SPEEDS).forEach(([k, v]) => {
      const b = document.createElement('button'); b.className = 'small' + (Save.speed === k ? ' on' : ''); b.textContent = v.name;
      b.onclick = () => { Save.speed = k; openTeacher(cls); };
      sp.appendChild(b);
    });
    const so = $('setSound'); so.textContent = Save.sound ? '켜짐' : '꺼짐'; so.className = 'small' + (Save.sound ? ' on' : '');
    so.onclick = () => { Save.sound = !Save.sound; Sound.unlock(); openTeacher(cls); };
    const un = $('setUnlock'); un.textContent = Save.unlockAll ? '켜짐' : '꺼짐'; un.className = 'small' + (Save.unlockAll ? ' on' : '');
    un.onclick = () => { Save.unlockAll = !Save.unlockAll; openTeacher(cls); };
    // 반 고르기
    const have = Save.classesWithData();
    const cs = $('tClasses'); cs.innerHTML = '';
    for (let c = 1; c <= 12; c++) {
      const b = document.createElement('button');
      b.className = 'small' + (c === cls ? ' on' : ''); b.textContent = c + '반' + (have.includes(c) ? ' •' : '');
      b.onclick = () => openTeacher(c);
      cs.appendChild(b);
    }
    $('tBody').innerHTML = classReport(cls);
    const del = $('tDel');
    if (del) del.onclick = () => { if (confirm(`${cls}반 기록을 이 기기에서 모두 지울까요? 되돌릴 수 없어요.`)) { Save.removeClass(cls); openTeacher(cls); } };
  }

  const pct = (t) => (t && t.n ? Math.round((t.ok / t.n) * 100) : null);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 자주 틀린 문제: 문제별로 묶고, 가장 많이 고른 오답을 붙인다
  function topWrong(list, k) {
    const m = new Map();
    list.forEach((w) => {
      const e = m.get(w.q) || { q: w.q, c: w.c, n: 0, picks: {} };
      e.n++; e.picks[w.a] = (e.picks[w.a] || 0) + 1; m.set(w.q, e);
    });
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, k).map((e) => {
      const p = Object.entries(e.picks).sort((a, b) => b[1] - a[1])[0];
      return { ...e, pick: p[0] };
    });
  }

  function classReport(cls) {
    const rows = Save.listClass(cls);
    if (!rows.length) return `<div class="box">${cls}반 기록이 이 기기에 없어요. 기록은 학생이 게임을 한 기기에만 저장돼요.</div>`;
    const types = Object.keys(Q.TYPES);
    let h = '<div class="tbl-wrap"><table><thead><tr><th>번호</th><th>캐릭터</th>';
    D.STAGES.forEach((st, i) => { h += `<th>${i + 1}단계</th>`; });
    types.forEach((t) => { h += `<th>${Q.TYPES[t].short}</th>`; });
    h += '<th>자주 틀린 문제</th></tr></thead><tbody>';
    const all = [];
    rows.forEach(({ num, s }) => {
      all.push(...s.wrong);
      h += `<tr><td>${num}</td><td>${esc(D.KIDS[s.kid || 0].name)}</td>`;
      D.STAGES.forEach((st, i) => { const r = s.stages[i]; h += `<td>${r ? '★'.repeat(r.stars) + (r.stars < 3 ? '<span style="color:#ddd">' + '★'.repeat(3 - r.stars) + '</span>' : '') : '·'}</td>`; });
      types.forEach((t) => { const p = pct(s.types[t]); h += `<td class="${p !== null && p < 70 ? 'low' : ''}">${p === null ? '·' : p + '%'}</td>`; });
      const tw = topWrong(s.wrong, 3).map((e) => `${esc(e.q)}→${esc(e.pick)}${e.n > 1 ? `(${e.n})` : ''}`).join(', ');
      h += `<td class="l">${tw || '·'}</td></tr>`;
    });
    h += '</tbody></table></div>';
    // 반 전체 요약
    const tw = topWrong(all, 10);
    h += '<div class="box"><h3>반 전체 · 자주 틀린 문제</h3>';
    h += tw.length ? tw.map((e) => `<b>${esc(e.q)} = ${e.c}</b> · ${e.n}번 틀림 (가장 많이 고른 답 ${esc(e.pick)})`).join('<br>') : '아직 틀린 문제가 없어요.';
    h += '</div>';
    const kinds = {};
    all.forEach((w) => { if (w.k) kinds[w.k] = (kinds[w.k] || 0) + 1; });
    const ks = Object.entries(kinds).sort((a, b) => b[1] - a[1]);
    h += '<div class="box"><h3>반 전체 · 실수 종류</h3>';
    h += ks.length ? ks.map(([k, n]) => `${esc(Q.KINDS[k] || k)} <b>${n}</b>번`).join('<br>') : '아직 기록이 없어요.';
    h += '</div>';
    h += '<div class="box">정답률 70% 아래는 빨간 글씨로 보여요. 별 2개 이상이면 다음 단계가 열려요.<br><button id="tDel" class="small danger">이 반 기록 지우기</button></div>';
    return h;
  }

  // ---------- 시작 ----------
  Game.init(cv);
  show('sTitle');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})(window);
