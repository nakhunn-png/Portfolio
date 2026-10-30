// 화면 흐름(타이틀 → 반 → 번호 → 학년군 → 1시간/2시간 → 주인공 → 연습 층 → 본 층), HUD, 창, 선생님 화면.
import { BANDS, COURSES, DIFFS, CHARS, STAGES, STAGE_INTRO, PRACTICE_QUESTIONS, TEACHER_PIN, hideName } from './data.js';
import { QUESTIONS } from './questions.js';
import { Save } from './save.js';
import { Sound } from './sound.js';
import { Game, TUTORIAL, loadImages } from './game.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 오래된 브라우저용 roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
}

const S = { cls: 0, num: 0, save: null, game: null, diff: Save.diff };

// ---------- 화면 전환 ----------
const SCREENS = ['sTitle', 'sClass', 'sNum', 'sResume', 'sBand', 'sCourse', 'sChar', 'sTeacher'];
function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  $('hud').hidden = id !== null;
  if (id !== null && S.game) { S.game.destroy(); S.game = null; }
  closeModal();
  $('say').hidden = true;
  if (id === 'sTitle') renderTitle();
}
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show(b.dataset.back)));

// ---------- 타이틀 ----------
function renderTitle() {
  const box = $('diffs'); box.innerHTML = '';
  for (const [k, d] of Object.entries(DIFFS)) {
    const b = document.createElement('button');
    b.className = (k === S.diff ? 'on ' : '') + k;
    b.innerHTML = `<b>${d.icon} ${d.name}</b><small>${d.desc}</small>`;
    b.onclick = () => { S.diff = k; Save.diff = k; renderTitle(); };
    box.appendChild(b);
  }
  syncSound();
}
function syncSound() {
  $('soundBtn').textContent = Sound.on ? '🔊' : '🔇';
  $('soundBtn2').textContent = Sound.on ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
}
$('soundBtn').onclick = $('soundBtn2').onclick = () => { Sound.toggle(); syncSound(); };
$('fullBtn').onclick = () => { const d = document.documentElement; if (!document.fullscreenElement) (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d); else document.exitFullscreen?.(); };
$('startBtn').onclick = () => { Sound.unlock(); renderClass(); show('sClass'); };

// ---------- 반 / 번호 ----------
function renderClass() {
  const g = $('classGrid'); g.innerHTML = '';
  const used = new Set(Save.classesWithData());
  for (let c = 1; c <= 15; c++) {
    const b = document.createElement('button');
    b.innerHTML = `${c}반${used.has(c) ? '<small>기록 있음</small>' : ''}`;
    if (c === Save.lastClass) b.className = 'has';
    b.onclick = () => { S.cls = c; Save.lastClass = c; renderNum(); show('sNum'); };
    g.appendChild(b);
  }
}
function progressText(s) {
  if (!s) return '';
  if (s.finished) return '🏆 완주';
  if (s.inTutorial) return '연습 층';
  const st = COURSES[s.course]?.stages[s.stageIdx];
  return st ? `${st}층` : '';
}
function totalStars(s) { return Object.values(s?.results || {}).reduce((a, r) => a + (r.stars || 0), 0); }
function renderNum() {
  $('numTitle').textContent = `${S.cls}반, 몇 번인가요?`;
  const g = $('numGrid'); g.innerHTML = '';
  for (let n = 1; n <= 30; n++) {
    const s = Save.load(S.cls, n), b = document.createElement('button');
    b.innerHTML = `${n}번${s ? `<small>${progressText(s)} ⭐${totalStars(s)}</small>` : ''}`;
    if (s) b.className = 'has';
    b.onclick = () => pickStudent(n);
    g.appendChild(b);
  }
}
function pickStudent(n) {
  S.num = n; S.save = Save.load(S.cls, n);
  if (S.save && S.save.course) { renderResume(); show('sResume'); }
  else { S.save = { results: {} }; renderBand(); show('sBand'); }
}
function renderResume() {
  const s = S.save, d = DIFFS[s.diff] || DIFFS.easy;
  $('resumeTitle').textContent = `${S.cls}반 ${S.num}번, 이어 할까요?`;
  $('resumeInfo').innerHTML = `학년: <b>${BANDS[s.band].name}</b> · ${COURSES[s.course].name}<br>
    진행: <b>${s.finished ? '🏆 모두 탈출!' : s.inTutorial ? '연습 층' : esc(STAGES[COURSES[s.course].stages[s.stageIdx]].name)}</b><br>
    난이도: <b>${d.icon} ${d.name}</b> · 모은 별 ⭐ <b>${totalStars(s)}</b>`;
  $('contBtn').disabled = !!s.finished;
  $('contBtn').onclick = () => startPlay();
  $('newBtn').onclick = () => confirmBox('처음부터 새로 할까요? 지금까지의 기록이 지워져요.', '새로 하기', () => { Save.remove(S.cls, S.num); S.save = { results: {} }; renderBand(); show('sBand'); });
}

// ---------- 학년군 / 과정 / 주인공 ----------
function renderBand() {
  const box = $('bandCards'); box.innerHTML = '';
  const em = { low: '🌱', mid: '🌿', high: '🌳' };
  for (const [k, b] of Object.entries(BANDS)) {
    const el = document.createElement('button');
    el.innerHTML = `<span class="em">${em[k]}</span><b>${b.name}</b><span>${b.sub}</span>`;
    el.onclick = () => { S.save.band = k; renderCourse(); show('sCourse'); };
    box.appendChild(el);
  }
}
function renderCourse() {
  const box = $('courseCards'); box.innerHTML = '';
  for (const [k, c] of Object.entries(COURSES)) {
    const el = document.createElement('button');
    el.innerHTML = `<span class="em">${k === 'short' ? '⏱️' : '⏳'}</span><b>${c.name}</b><span>${c.sub}</span><span>${c.stages.map(s => STAGES[s].place).join(' · ')}</span>`;
    el.onclick = () => { S.save.course = k; renderChar(); show('sChar'); };
    box.appendChild(el);
  }
}
function renderChar() {
  const box = $('charCards'); box.innerHTML = '';
  for (const c of CHARS) {
    const el = document.createElement('button');
    el.innerHTML = `<img src="img/${c.id}.png" alt=""><b>${c.name}</b>`;
    el.onclick = () => {
      Object.assign(S.save, { char: c.id, diff: S.diff, stageIdx: 0, inTutorial: true, tutorialDone: false, run: null, results: {}, finished: false });
      persist(); startPlay();
    };
    box.appendChild(el);
  }
}

function persist() { if (S.cls && S.num && S.save) Save.store(S.cls, S.num, S.save); }

// ---------- 게임 ----------
function currentStageId() { const s = S.save; return s.inTutorial ? 0 : COURSES[s.course].stages[s.stageIdx]; }
function poolFor(stageId) { return stageId === 0 ? PRACTICE_QUESTIONS : QUESTIONS[S.save.band][stageId]; }

const imgReady = Promise.all([
  loadImages(['boy1', 'boy2', 'girl1', 'girl2', 'germ_basic', 'germ_mold', 'germ_cavity', 'yeongyang']),
  // 지도 위 글자(숨는 곳, ? 등)도 같은 글꼴로 그리도록 먼저 불러 둔다
  document.fonts ? document.fonts.load('20px "Ssurround"').catch(() => {}) : null,
]);

async function startPlay() {
  await imgReady;
  if (S.game) { S.game.destroy(); S.game = null; }
  show(null);
  const s = S.save, stageId = currentStageId(), st = STAGES[stageId];
  const resumed = !!(s.run && s.run.stageId === stageId);
  S.game = new Game($('cv'), { stageId, band: s.band, diff: s.diff, char: s.char, pool: poolFor(stageId), run: resumed ? s.run : null, ui: UI });
  $('stageName').textContent = st.name;
  $('tutBox').hidden = stageId !== 0;
  if (stageId === 0) UI.tutorial(S.game.run.tut);
  const intro = STAGE_INTRO[stageId];
  UI.say(resumed ? '이어서 해 보자! 균을 조심해!' : (intro.all || intro[s.band]));
  if (!resumed) { s.run = S.game.serialize(); persist(); }
  updateHud();
}

let hudT = 0;
function hudLoop(t) {
  requestAnimationFrame(hudLoop);
  const g = S.game; if (!g) return;
  if (t - hudT > 120) { hudT = t; updateHud(); }
  if (g.dirty && !g.over) { g.dirty = false; S.save.run = g.serialize(); persist(); }
  if (!$('compass').hidden) { const e = g.exitAngle(); $('arrow').style.transform = `rotate(${e.a}rad)`; }
}
requestAnimationFrame(hudLoop);

function updateHud() {
  const g = S.game; if (!g) return;
  const r = g.run;
  $('roomName').textContent = '📍 ' + g.currentRoom();
  $('lives').textContent = g.tut ? '연습 중' : g.lives === Infinity ? `${DIFFS[r.diff].icon} ${DIFFS[r.diff].name} · ❤️ 무한` : `${DIFFS[r.diff].icon} ${DIFFS[r.diff].name} · ${'❤️'.repeat(g.lives)}${'🤍'.repeat(Math.max(0, DIFFS[r.diff].lives - g.lives))}`;
  const d = g.detector();
  const det = $('detector'); det.dataset.l = d ? d.level : 0; $('detText').textContent = d ? d.text : '';
  $('compass').hidden = !r.exitOpen;
  $('noteN').textContent = `${g.found}/${g.need}`;
  $('noteBtn').classList.toggle('ready', g.found >= g.need && !r.noteSolved);
  $('soapN').textContent = r.soap;
  $('itemIco').textContent = r.item === 'water' ? '💧' : r.item === 'mask' ? '😷' : '✋';
  $('itemName').textContent = r.item === 'water' ? '물 한 컵' : r.item === 'mask' ? '마스크' : '빈손';
  $('itemBtn').classList.toggle('ready', !!r.item);
  const n = g.nearby();
  $('actBtn').hidden = !n;
  if (n) $('actLabel').textContent = n.label;
}

// 조작
const press = (el, fn) => el.addEventListener('pointerdown', (e) => { e.preventDefault(); Sound.unlock(); fn(); });
press($('actBtn'), () => S.game?.interact());
press($('bubbleBtn'), () => S.game?.throwBubble());
press($('itemBtn'), () => S.game?.useItem());
press($('noteBtn'), () => openNote());
press($('menuBtn'), () => openMenu());
press($('detector'), () => {
  const g = S.game; if (!g) return; const d = g.detector();
  if (!d) return;
  if (g.run.exitOpen) UI.say('탈출문이 열렸어! 초록 화살표를 따라가!');
  else if (!d.room) UI.say('조각을 다 모았어! 📜 쪽지 단추를 눌러 순서대로 붙여 봐!');
  else UI.say(`쪽지 조각은 <b>${esc(d.room)}</b> 쪽에 있어! 감지기가 "가까워요"로 바뀌는 곳을 찾아봐.`);
});
$('tutSkip').onclick = () => { if (S.game) { S.game.pausedBefore = S.game.paused; S.game.paused = true; } confirmBox('연습을 건너뛰고 바로 1층으로 갈까요?', '건너뛰기', () => finishTutorial()); };

addEventListener('keydown', (e) => {
  const g = S.game; if (!g || !$('modal').hidden) { if (e.code === 'Escape') closeModal(); return; }
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  g.keys.add(e.code);
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') g.interact();
  else if (e.code === 'KeyF') g.throwBubble();
  else if (e.code === 'KeyQ') g.useItem();
  else if (e.code === 'Tab') openNote();
  else if (e.code === 'Escape') openMenu();
});
addEventListener('keyup', (e) => S.game?.keys.delete(e.code));
addEventListener('blur', () => S.game?.keys.clear());
addEventListener('resize', () => S.game?.resize());

// 가상 조이스틱: 화면 왼쪽 아무 데나 누르고 끌기
let joyId = null, joyX = 0, joyY = 0;
const cv = $('cv');
cv.addEventListener('pointerdown', (e) => {
  if (!S.game || e.clientX > innerWidth * 0.55) return;
  joyId = e.pointerId; joyX = e.clientX; joyY = e.clientY;
  const j = $('joy'); j.hidden = false; j.style.left = joyX + 'px'; j.style.top = joyY + 'px';
  $('knob').style.transform = ''; cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  if (e.pointerId !== joyId || !S.game) return;
  let dx = e.clientX - joyX, dy = e.clientY - joyY; const R = 55, d = Math.hypot(dx, dy);
  if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  $('knob').style.transform = `translate(${dx}px, ${dy}px)`;
  S.game.input.x = dx / R; S.game.input.y = dy / R;
});
const joyEnd = (e) => { if (e.pointerId !== joyId) return; joyId = null; $('joy').hidden = true; if (S.game) { S.game.input.x = 0; S.game.input.y = 0; } };
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);

// 화면을 떠나거나 숨길 때 저장
const flush = () => { if (S.game && !S.game.over) { S.save.run = S.game.serialize(); persist(); } };
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) { flush(); S.game?.keys.clear(); } });

// ---------- 메시지 ----------
let sayT = 0, bigT = 0;
const UI = {
  say(html) { $('sayText').innerHTML = html; $('say').hidden = false; clearTimeout(sayT); sayT = setTimeout(() => { $('say').hidden = true; }, 6000); },
  bigMsg(text, kind = 'info') { const el = $('bigMsg'); el.textContent = text; el.className = kind; el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; clearTimeout(bigT); bigT = setTimeout(() => { el.hidden = true; }, 2000); },
  toast(text) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = text; $('toasts').appendChild(el); setTimeout(() => el.remove(), 3500); },
  tutorial(i) {
    if (i >= TUTORIAL.length) { $('tutBox').hidden = true; return; }
    $('tutStep').textContent = `연습 ${i + 1}/${TUTORIAL.length}`;
    $('tutText').innerHTML = TUTORIAL[i].text.replace('{hide}', hideName(S.save.band));
    if (i === 0) $('tutText').innerHTML += '<br><small>💡 ?가구 10개 중 4개에만 진짜 쪽지 조각이 있어요. (연습에서는 4개 중 2개) 문제를 틀리면 6초 동안 그 가구를 뒤질 수 없어요!</small>';
  },
  openQuiz,
  onCaught,
  onClear,
};
// 말풍선은 누름을 막지 않는다(아래 조이스틱이 그대로 움직이게). 6초 뒤 저절로 사라진다

// ---------- 창 ----------
function openModal(html) { $('sheet').innerHTML = html; $('modal').hidden = false; return $('sheet'); }
function closeModal() { $('modal').hidden = true; $('sheet').innerHTML = ''; }
function confirmBox(text, okText, onOk) {
  const sh = openModal(`<h3>확인</h3><p class="q">${esc(text)}</p><div class="acts"><button class="big alt" id="cNo">아니요</button><button class="big" id="cYes">${esc(okText)}</button></div>`);
  sh.querySelector('#cNo').onclick = () => { closeModal(); if (S.game) S.game.paused = S.game.pausedBefore ?? false; };
  sh.querySelector('#cYes').onclick = () => { closeModal(); onOk(); };
}

function choiceButtons(q, disabled) {
  const opts = shuffled(q.c);
  return opts.map((c, i) => `<button data-c="${esc(c)}" ${disabled.includes(c) ? 'disabled' : ''}><i>${i + 1}</i><span>${esc(c)}</span></button>`).join('');
}

function openQuiz({ title, q }, cb) {
  const sh = openModal(`<h3>${esc(title)}</h3><p class="q">${esc(q.q)}</p><div class="choices">${choiceButtons(q, [])}</div>`);
  let done = false;
  sh.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
    if (done) return; done = true;
    const ok = b.dataset.c === q.c[0];
    b.classList.add(ok ? 'ok' : 'no');
    if (!ok) sh.querySelectorAll('.choices button').forEach(x => { if (x.dataset.c === q.c[0]) x.classList.add('ok'); });
    setTimeout(() => { closeModal(); cb(ok); }, ok ? 500 : 1100);
  });
}

// 쪽지: 조각 모으기 → 순서 맞추기 → 문제 풀기
function splitPieces(text, n) {
  const words = text.split(' ');
  if (words.length >= n) {
    const out = []; let at = 0;
    for (let i = 0; i < n; i++) { const take = Math.round((words.length - at) / (n - i)); out.push(words.slice(at, at + take).join(' ')); at += take; }
    return out;
  }
  const out = [], len = Math.ceil(text.length / n);
  for (let i = 0; i < n; i++) out.push(text.slice(i * len, (i + 1) * len));
  return out;
}
function openNote() {
  const g = S.game; if (!g) return;
  const r = g.run, q = g.o.pool[r.noteQ], n = g.need, pieces = splitPieces(q.q, n);
  if (!r.pieceOrder || r.pieceOrder.length !== n) r.pieceOrder = shuffled([...Array(n).keys()]);
  g.pausedBefore = g.paused; g.paused = true;
  const close = () => { closeModal(); g.paused = false; g.invuln = Math.max(g.invuln, 1); };
  const numbered = S.save.band === 'low';
  const pieceHtml = (i) => `${numbered ? `<sup>${i + 1}</sup> ` : ''}${esc(pieces[i])}`;

  if (r.noteSolved) {
    const sh = openModal(`<h3>📜 쪽지</h3><p class="q">탈출문이 열렸어요! 초록 화살표를 따라 탈출문으로 가요.</p><div class="acts"><button class="big" id="nClose">닫기</button></div>`);
    sh.querySelector('#nClose').onclick = close; return;
  }
  if (g.found < n) {
    const got = r.pieceOrder.slice(0, g.found);
    const sh = openModal(`<h3>📜 찢어진 쪽지 (${g.found}/${n})</h3>
      <p class="hint">조각을 ${n}개 모두 모으면 순서대로 붙여서 문제를 풀 수 있어요. ?가구 중 진짜는 ${n}개뿐! 감지기를 보며 찾아요.</p>
      <div class="pieces">${got.map(i => `<span class="piece">${pieceHtml(i)}</span>`).join('')}${Array(n - g.found).fill('<span class="piece ghost">? 아직 못 찾음</span>').join('')}</div>
      <div class="acts"><button class="big" id="nClose">닫기</button></div>`);
    sh.querySelector('#nClose').onclick = close; return;
  }
  if (!r.noteOrdered) {
    const placed = [];
    const draw = () => {
      const left = r.pieceOrder.filter(i => !placed.includes(i));
      const sh = openModal(`<h3>📜 조각을 순서대로 붙여요</h3>
        <p class="hint">조각을 누르면 빈칸에 차례로 들어가요. 칸을 누르면 빠져요.</p>
        <div class="slots" style="--n:${n}">${[...Array(n).keys()].map(k => placed[k] != null ? `<button class="slot filled" data-s="${k}">${pieceHtml(placed[k])}</button>` : `<div class="slot"><span class="num">${k + 1}</span></div>`).join('')}</div>
        <div class="pieces">${left.map(i => `<button class="piece" data-p="${i}">${pieceHtml(i)}</button>`).join('')}</div>
        <div class="acts"><button class="big alt" id="nClose">닫기</button><button class="big green" id="nGlue" ${placed.length < n ? 'disabled' : ''}>이대로 붙이기</button></div>`);
      sh.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { placed.push(+b.dataset.p); draw(); });
      sh.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { placed.splice(+b.dataset.s, 1); draw(); });
      sh.querySelector('#nClose').onclick = close;
      sh.querySelector('#nGlue').onclick = () => {
        if (placed.every((p, k) => p === k)) { r.noteOrdered = true; g.dirty = true; Sound.good(); askNote(); }
        else { Sound.bad(); UI.bigMsg('순서가 맞지 않아요. 다시 해 봐요!', 'bad'); }
      };
    };
    draw(); return;
  }
  askNote();

  function askNote() {
    const hint = r.disabled.length && r.diff !== 'hell' ? `<p class="hint">💡 힌트: ${esc(q.h)}</p>` : '';
    const sh = openModal(`<h3>📜 쪽지 문제 · 맞히면 탈출문이 열려요!</h3>${hint}<p class="q">${esc(q.q)}</p><div class="choices">${choiceButtons(q, r.disabled)}</div>
      <div class="acts"><button class="big alt" id="nClose">닫기</button></div>`);
    sh.querySelector('#nClose').onclick = close;
    let done = false;
    sh.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
      if (done) return; done = true;
      const ok = b.dataset.c === q.c[0];
      b.classList.add(ok ? 'ok' : 'no');
      const res = g.noteAnswer(b.dataset.c, ok);
      setTimeout(() => {
        if (res === 'open') close();
        else if (res === 'scatter') { r.noteOrdered = false; r.pieceOrder = null; close(); }
        else askNote();
      }, ok ? 600 : 900);
    });
  }
}

function diffButtons(current) {
  return `<div class="diffrow">${Object.entries(DIFFS).map(([k, d]) => `<button data-d="${k}" class="${k === current ? 'on' : ''}">${d.icon} ${d.name}</button>`).join('')}</div>`;
}
function onCaught({ name, lives, diff }) {
  const g = S.game;
  const out = lives <= 0;
  const head = out ? `<p class="q">목숨을 모두 썼어요! 이 층을 처음부터 다시 해요.</p><p class="hint">난이도를 골라 다시 시작하세요.</p>`
    : `<p class="q">${lives === Infinity ? '쉬움 모드라 목숨은 무한이에요.' : `남은 목숨: ${'❤️'.repeat(lives)}`}<br>처음 자리에서 다시 출발해요.</p>`;
  const sh = openModal(`<h3>😵 ${esc(name)}에게 잡혔어요!</h3>${head}
    ${out ? '' : '<div class="acts"><button class="big" id="cCont">계속하기</button></div><p class="hint" style="margin-top:14px">난이도를 바꾸면 이 층을 처음부터 다시 해요.</p>'}
    ${diffButtons(diff)}`);
  sh.querySelector('#cCont')?.addEventListener('click', () => { closeModal(); g.respawn(); g.dirty = true; });
  sh.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    const nd = b.dataset.d;
    if (!out && nd === diff) { closeModal(); g.respawn(); return; }
    closeModal(); restartStage(nd);
  });
}
function restartStage(diff) {
  S.save.diff = diff; S.save.run = null; persist(); startPlay();
}

function finishTutorial() {
  Object.assign(S.save, { inTutorial: false, tutorialDone: true, run: null, stageIdx: 0 });
  persist(); startPlay();
}

function onClear(res) {
  const s = S.save;
  if (res.stageId === 0) {
    const sh = openModal(`<h3>🎉 연습 끝!</h3><p class="q">잘했어요! 이제 진짜 탈출을 시작해요.<br>균을 피해서 쪽지 조각 4개를 모아요!</p><div class="acts"><button class="big" id="go">1층으로 출발!</button></div>`);
    sh.querySelector('#go').onclick = () => finishTutorial();
    return;
  }
  s.results[res.stageId] = { stars: res.stars, diff: res.diff, wrong: res.wrong, correct: res.correct, at: Date.now() };
  s.stageIdx++; s.run = null;
  const stages = COURSES[s.course].stages, last = s.stageIdx >= stages.length;
  if (last) s.finished = true;
  persist();
  const d = DIFFS[res.diff];
  const sh = openModal(`<h3>🎉 ${esc(STAGES[res.stageId].name)} 탈출 성공!</h3>
    <div class="stars">${'⭐'.repeat(res.stars)}${'☆'.repeat(3 - res.stars)}</div>
    <p style="text-align:center"><span class="badge ${res.diff}">${d.icon} ${d.name}${res.diff === 'hell' ? ' 클리어 🔥' : ''}</span></p>
    <ul class="crit">
      <li>✅ 탈출하기</li>
      <li>${res.wrong <= 2 ? '✅' : '⬜'} 문제를 2번 이하로 틀리기 (틀린 횟수 ${res.wrong}번)</li>
      <li>${res.soapTotal && res.soapGot / res.soapTotal >= 0.6 ? '✅' : '⬜'} 바닥의 비누 60% 넘게 줍기 (${res.soapGot}/${res.soapTotal})</li>
    </ul>
    <p class="hint">맞힌 문제 ${res.correct}개 · 틀린 문제 ${res.wrong}개</p>
    <div class="acts"><button class="big" id="go">${last ? '최종 결과 보기' : '다음 층으로'}</button></div>`);
  sh.querySelector('#go').onclick = () => { if (last) showFinal(); else startPlay(); };
}
function showFinal() {
  const s = S.save, stages = COURSES[s.course].stages;
  const rows = stages.map(id => { const r = s.results[id]; return `<li>${esc(STAGES[id].name)} — ${r ? '⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + ` <span class="badge ${r.diff}">${DIFFS[r.diff].icon} ${DIFFS[r.diff].name}</span>` : '-'}</li>`; }).join('');
  const sh = openModal(`<h3>🏆 냠냠 탈출 대작전 완주!</h3><p class="q">${S.cls}반 ${S.num}번, 모든 층을 탈출했어요!<br>모은 별: ⭐ ${totalStars(s)} / ${stages.length * 3}</p><ul class="crit">${rows}</ul>
    <p class="hint">선생님께 이 화면을 보여 주세요!</p><div class="acts"><button class="big" id="go">처음 화면으로</button></div>`);
  sh.querySelector('#go').onclick = () => show('sTitle');
}

function openMenu() {
  const g = S.game; if (!g) return;
  g.pausedBefore = g.paused; g.paused = true;
  const sh = openModal(`<h3>⏸ 잠깐 멈춤</h3><p class="hint">진행 상황은 자동으로 저장돼요. 새로고침해도 이어서 할 수 있어요.</p>
    <div class="menu" style="margin:0 auto">
      <button class="big" id="mGo">▶ 계속하기</button>
      <button class="big alt" id="mSound">${Sound.on ? '🔊 소리 끄기' : '🔇 소리 켜기'}</button>
      <button class="big alt" id="mHelp">❓ 조작 방법</button>
      <button class="big alt" id="mHome">🏠 처음 화면으로</button>
    </div>`);
  sh.querySelector('#mGo').onclick = () => { closeModal(); g.paused = false; };
  sh.querySelector('#mSound').onclick = () => { Sound.toggle(); syncSound(); openMenu(); };
  sh.querySelector('#mHome').onclick = () => { flush(); show('sTitle'); };
  sh.querySelector('#mHelp').onclick = () => {
    const h = openModal(`<h3>❓ 조작 방법</h3><ul class="crit">
      <li>🕹️ 움직이기: 화면 왼쪽을 누른 채 끌기 (키보드: 방향키·WASD)</li>
      <li>🔍 살펴보기·숨기·탈출: 주황 단추 (E 또는 스페이스)</li>
      <li>🫧 비눗방울: 가까운 균에게 날아가 4초 동안 멈추게 해요 (F)</li>
      <li>💧 물 한 컵: 5초 빨라짐 · 😷 마스크: 6초 동안 균이 못 알아봄 (Q)</li>
      <li>📜 쪽지: 모은 조각 보기·붙이기 (Tab)</li>
      <li>📶 감지기: 조각과 멀어요 → 가까워요. 누르면 영양이가 방 이름을 알려 줘요</li></ul>
      <div class="acts"><button class="big" id="hBack">돌아가기</button></div>`);
    h.querySelector('#hBack').onclick = () => openMenu();
  };
}

// ---------- 선생님 ----------
$('teacherBtn').onclick = () => {
  let pin = '';
  const draw = () => {
    const sh = openModal(`<h3>👩‍🏫 선생님 비밀번호</h3><div class="pindots">${'●'.repeat(pin.length)}${'○'.repeat(4 - pin.length)}</div>
      <div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0, '✕'].map(k => `<button data-k="${k}">${k}</button>`).join('')}</div>`);
    sh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      if (k === '✕') { closeModal(); return; }
      if (k === '←') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
      if (pin.length === 4) {
        if (pin === TEACHER_PIN) { closeModal(); openTeacher(); return; }
        pin = ''; UI.toast('비밀번호가 달라요');
      }
      draw();
    });
  };
  draw();
};
function openTeacher() {
  show('sTeacher');
  const sel = $('tClass');
  sel.innerHTML = [...Array(15).keys()].map(i => `<option value="${i + 1}">${i + 1}반</option>`).join('');
  sel.value = Save.lastClass || Save.classesWithData()[0] || 1;
  sel.onchange = renderTable;
  renderTable();
}
function fmtTime(ts) { if (!ts) return ''; const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function renderTable() {
  const cls = +$('tClass').value;
  const head = `<tr><th>번호</th><th>학년</th><th>과정</th><th>진행</th>${[1, 2, 3, 4, 5, 6].map(i => `<th>${i}층</th>`).join('')}<th>별 합계</th><th>지금 난이도</th><th>마지막 접속</th><th></th></tr>`;
  let rows = '';
  for (let n = 1; n <= 30; n++) {
    const s = Save.load(cls, n);
    if (!s || !s.course) { rows += `<tr><td>${n}</td><td class="empty" colspan="13">기록 없음</td></tr>`; continue; }
    const cells = [1, 2, 3, 4, 5, 6].map(id => {
      if (!COURSES[s.course].stages.includes(id)) return '<td class="empty">·</td>';
      const r = s.results[id]; return r ? `<td>${'⭐'.repeat(r.stars)}${r.diff === 'hell' ? '🔥' : r.diff === 'hard' ? '💪' : ''}</td>` : '<td class="empty">-</td>';
    }).join('');
    rows += `<tr><td>${n}</td><td>${BANDS[s.band]?.name || ''}</td><td>${COURSES[s.course].name}</td><td>${progressText(s)}</td>${cells}<td>⭐ ${totalStars(s)}</td><td>${DIFFS[s.diff]?.icon || ''} ${DIFFS[s.diff]?.name || ''}</td><td>${fmtTime(s.updated)}</td><td><button data-del="${n}">지우기</button></td></tr>`;
  }
  $('tTable').innerHTML = head + rows;
  $('tTable').querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmBox(`${cls}반 ${b.dataset.del}번 기록을 지울까요?`, '지우기', () => { Save.remove(cls, +b.dataset.del); renderTable(); }));
}
$('tClear').onclick = () => { const cls = +$('tClass').value; confirmBox(`${cls}반 기록을 모두 지울까요? 되돌릴 수 없어요.`, '모두 지우기', () => { Save.removeClass(cls); renderTable(); }); };

// ---------- 시작 ----------
window.__nyam = S; // 점검용
show('sTitle');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
