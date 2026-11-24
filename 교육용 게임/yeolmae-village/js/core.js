'use strict';
/* ================= 기본 도구 ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const strip = s => String(s == null ? '' : s).replace(/<br\s*\/?>/g, '. ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* 숫자 뒤 조사: j(3,'은') → '3은', j(4,'은') → '4는' */
function hasB(n) { n = Math.abs(n); const o = n % 10; if (n === 0 || o === 0) return true; return [1, 3, 6, 7, 8].includes(o); }
const JO = { 은: ['은', '는'], 이: ['이', '가'], 을: ['을', '를'], 과: ['과', '와'] };
function j(n, k) {
  if (k === '으로') { const o = Math.abs(n) % 10; const rieul = o !== 0 && [1, 7, 8].includes(o); return n + (hasB(n) && !rieul ? '으로' : '로'); }
  const [a, b] = JO[k]; return n + (hasB(n) ? a : b);
}

/* ================= 전역 상태 ================= */
const G = { cls: 0, num: 0, P: null, run: null, scale: 1 };
const KEY = 'yeolmae_v1:';

/* ================= 저장 ================= */
const STORE = {
  broken: false,
  get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { STORE.broken = true; return d; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { STORE.broken = true; } },
  del(k) { try { localStorage.removeItem(KEY + k); } catch (e) { } },
  keys() { try { return Object.keys(localStorage).filter(k => k.startsWith(KEY)).map(k => k.slice(KEY.length)); } catch (e) { return []; } }
};
const SET = Object.assign({ sound: true, voice: true }, STORE.get('settings', {}));
function saveSettings() { STORE.set('settings', SET); }

function newProfile() {
  return {
    v: 1, done: {}, best: {}, maxLv: 0, rec: 2, fruit: 0, gold: 0, badge: 0,
    tools: [], items: [], wear: {}, pieces: [], ach: [], ten: 0,
    ending: false, breakSeen: false, shelterSeen: false, intro: {}, prologue: false, allOpen: false, hiddenDone: {}
  };
}
const pkey = () => `p:${G.cls}-${G.num}`;
function save() { if (G.P) STORE.set(pkey(), G.P); }

/* ================= 소리 ================= */
const SFX = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, t0, dur, type = 'sine', vol = 0.15) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    const t = c.currentTime + t0;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const P = {
    ok: () => { tone(660, 0, .15); tone(880, .1, .3); },
    no: () => { tone(330, 0, .18, 'triangle', .1); tone(262, .13, .25, 'triangle', .09); },
    pop: () => tone(500 + Math.random() * 250, 0, .07, 'square', .04),
    go: () => [392, 494, 587, 784].forEach((f, i) => tone(f, i * .08, .16, 'triangle', .12)),
    up: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .12, .32, 'sine', .14)),
    item: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .07, .22, 'sine', .12))
  };
  return { play(n) { if (!SET.sound) return; try { P[n] && P[n](); } catch (e) { } }, unlock: ac };
})();

/* ================= 음성 읽기 ================= */
const TTS = (() => {
  const ok = 'speechSynthesis' in window; let voice = null;
  function load() { if (!ok) return; const vs = speechSynthesis.getVoices(); voice = vs.find(v => /ko[-_]KR/i.test(v.lang)) || vs.find(v => /^ko/i.test(v.lang)) || null; }
  if (ok) { load(); try { speechSynthesis.onvoiceschanged = load; } catch (e) { } }
  function clean(t) {
    return strip(t).replace(/□/g, ' 네모 ').replace(/\+/g, ' 더하기 ').replace(/−/g, ' 빼기 ').replace(/=/g, ' 는 ')
      .replace(/[✕✓★⭐🔊]/g, '').replace(/\s+/g, ' ').trim();
  }
  return {
    ok,
    speak(t) {
      if (!ok || !SET.voice || !t) return;
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(clean(t)); u.lang = 'ko-KR'; if (voice) u.voice = voice; u.rate = 0.9; u.pitch = 1.1; speechSynthesis.speak(u); } catch (e) { }
    },
    stop() { if (ok) try { speechSynthesis.cancel(); } catch (e) { } }
  };
})();

/* ================= 그림 (없으면 이모지로 대신) ================= */
const EMO = {
  'char/toki': '🌱', 'char/owl': '🦉',
  'char/tori_1': '🐿️', 'char/tori_2': '🐿️', 'char/tori_3': '🐿️',
  'char/gomi_1': '🦔', 'char/gomi_2': '🦔', 'char/gomi_3': '🦔',
  'char/kkoko_1': '🐣', 'char/kkoko_2': '🐥', 'char/kkoko_3': '🐔',
  'char/duddy': '🐹', 'char/robot': '🤖', 'char/yeori': '🌟', 'char/yeori_shadow': '❔',
  'item/glasses': '👓', 'item/frog_shoes': '🐸', 'item/magnifier': '🔍', 'item/piece': '✨',
  'item/fruit': '🍎', 'item/golden_fruit': '🌟', 'item/badge': '🏅',
  'item/straw_hat': '👒', 'item/ribbon': '🎀', 'item/flowerpot': '🪴', 'item/umbrella': '☂️', 'item/star_cape': '🧣', 'item/crown': '👑',
  'item/lv1_seed': '🌱', 'item/lv2_sprout': '🌿', 'item/lv3_tree': '🌳', 'item/lv4_fruit': '🍎', 'item/lv5_star': '⭐'
};
function pic(key, size = 100, cls = '') {
  const e = EMO[key] || '❔';
  return `<span class="pic ${cls}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .78)}px"><img src="assets/${key}.webp" alt="" draggable="false" onload="this.parentNode.classList.add('ld')" onerror="if(/\.webp$/.test(this.src)){this.src=this.src.replace(/\.webp$/,'.png')}else{this.remove()}"><i>${e}</i></span>`;
}
function bgStyle(bg) { return `background-image:url(assets/bg/${bg}.webp),url(assets/bg/${bg}.png),var(--bg-${bg});`; }

/* ================= 화면 · 알림 ================= */
function screen(name, html) { TTS.stop(); const s = $('#scr'); s.innerHTML = html; s.dataset.s = name; closeModal(); return s; }
function modal(html, cls = '') {
  const m = $('#modal'); m.innerHTML = `<div class="mcard ${cls}">${html}</div>`; m.classList.add('on'); return m.firstElementChild;
}
function closeModal() { const m = $('#modal'); m.classList.remove('on'); m.innerHTML = ''; }
function toast(t, ms = 1400) {
  const el = h(`<div class="toast">${t}</div>`); $('#g').appendChild(el);
  setTimeout(() => el.classList.add('out'), ms); setTimeout(() => el.remove(), ms + 400);
}
function cheer(t) {
  const el = h(`<div class="cheer">${t}</div>`); $('#g').appendChild(el); setTimeout(() => el.remove(), 1100);
}
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function popIn(el) { el.classList.remove('popin'); void el.offsetWidth; el.classList.add('popin'); SFX.play('pop'); }
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

/* 누르거나 끌어서 옮기기: 누르면 바로 action, 끌어서 target 위에 놓아도 action */
function movable(el, target, action) {
  let sx = 0, sy = 0, drag = false, id = null;
  el.addEventListener('pointerdown', e => {
    if (el.dataset.used) return; id = e.pointerId; sx = e.clientX; sy = e.clientY; drag = false;
    try { el.setPointerCapture(id); } catch (_) { } e.preventDefault();
  });
  el.addEventListener('pointermove', e => {
    if (id !== e.pointerId) return; const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!drag && Math.hypot(dx, dy) > 14) { drag = true; el.classList.add('dragging'); }
    if (drag) el.style.transform = `translate(${dx / G.scale}px,${dy / G.scale}px) scale(1.15)`;
  });
  const end = e => {
    if (id !== e.pointerId) return; id = null; el.style.transform = ''; el.classList.remove('dragging');
    if (!drag) { action(); return; }
    const tg = typeof target === 'function' ? target() : target;
    if (tg) { const r = tg.getBoundingClientRect(), pad = 40; if (e.clientX >= r.left - pad && e.clientX <= r.right + pad && e.clientY >= r.top - pad && e.clientY <= r.bottom + pad) action(); }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', e => { if (id === e.pointerId) { id = null; el.style.transform = ''; el.classList.remove('dragging'); } });
}

/* ================= 조작물 그림 ================= */
// 10칸 틀: filled개 채움. o.kind, o.altFrom(이 칸부터 다른 색), o.cross(끝에서부터 지운 개수), o.cls
function frameHTML(filled, kind = 'apple', o = {}) {
  let s = `<div class="frame ${o.cls || ''}">`;
  for (let i = 0; i < 10; i++) {
    let inner = '';
    if (i < filled) {
      const alt = o.altFrom != null && i >= o.altFrom ? ' alt' : '';
      const x = o.cross && i >= filled - o.cross ? ' x' : '';
      inner = `<span class="tok ${kind}${alt}${x}"></span>`;
    }
    s += `<div class="cell">${inner}</div>`;
  }
  return s + '</div>';
}
// 묶음(5개씩 줄): o.alt, o.cross(끝에서부터), o.cross2(그중 맨 끝 몇 개는 다른 표시)
function groupHTML(n, kind = 'apple', o = {}) {
  let s = `<div class="grp ${o.cls || ''}"${o.data || ''}>`;
  for (let i = 0; i < n; i++) {
    const alt = o.alt ? ' alt' : '';
    let x = '';
    if (o.cross && i >= n - o.cross) x = (o.cross2 && i >= n - o.cross2) ? ' x x2' : ' x';
    s += `<span class="tok ${kind}${alt}${x}"></span>`;
  }
  return s + '</div>';
}
function emptyCell(frame) { return Array.from(frame.children).find(c => !c.firstElementChild); }
// 달걀: 10개짜리 판 + 낱개
function trayHTML(o = {}) { return `<div class="tray ${o.x ? 'x' : ''} ${o.cls || ''}">${'<span class="es"></span>'.repeat(10)}</div>`; }
function eggsHTML(num, o = {}) {
  const t = Math.floor(num / 10), u = num % 10;
  let s = `<div class="eggs ${o.cls || ''}"><div class="trays">`;
  for (let i = 0; i < t; i++) s += trayHTML({ x: o.crossT && i >= t - o.crossT, cls: o.tcls || '' });
  s += '</div><div class="loose">';
  for (let i = 0; i < u; i++) s += `<span class="tok egg${o.crossO && i >= u - o.crossO ? ' x' : ''}${o.ecls ? ' ' + o.ecls : ''}"></span>`;
  return s + `</div>${o.label ? `<div class="elab">${o.label}</div>` : ''}</div>`;
}
// 주사위
const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
function diceInner(n) { let s = ''; for (let i = 1; i <= 9; i++) s += `<span class="${PIPS[n].includes(i) ? 'pip' : ''}"></span>`; return s; }
function diceHTML(n) { return `<div class="die" data-n="${n}">${diceInner(n)}</div>`; }
function rollDice(el) {
  const ds = $$('.die', el); let k = 0;
  const t = setInterval(() => {
    ds.forEach(d => d.innerHTML = diceInner(R(1, 6))); SFX.play('pop');
    if (++k > 7) { clearInterval(t); ds.forEach(d => { d.innerHTML = diceInner(+d.dataset.n); d.classList.add('popin'); }); }
  }, 80);
}
// 수직선 위 개구리 점프 (0~20)
function frogLineHTML(a, d) {
  const W = 900, x0 = 30, st = (W - 60) / 20, X = n => x0 + n * st, t = a + d;
  let s = `<svg viewBox="0 0 ${W} 180" class="nline"><line x1="${x0}" y1="130" x2="${W - 30}" y2="130" class="ax"/>`;
  for (let n = 0; n <= 20; n++) s += `<line x1="${X(n)}" y1="120" x2="${X(n)}" y2="140" class="tk${n === 10 ? ' ten' : ''}"/><text x="${X(n)}" y="168" class="tn${n === 10 ? ' ten' : ''}">${n}</text>`;
  const arc = (p, q, c) => {
    const mx = (X(p) + X(q)) / 2, hh = Math.min(95, 30 + Math.abs(q - p) * 9);
    s += `<path d="M${X(p)} 120 Q${mx} ${120 - hh * 1.6} ${X(q)} 120" class="arc ${c}"/><text x="${mx}" y="${120 - hh * .8 - 10}" class="al ${c}">${q > p ? '+' : '−'}${Math.abs(q - p)}</text>`;
  };
  if ((d > 0 && a < 10 && t > 10) || (d < 0 && a > 10 && t < 10)) { arc(a, 10, 'a1'); arc(10, t, 'a2'); } else arc(a, t, 'a1');
  s += `<text x="${X(a)}" y="112" class="frog">🐸</text>`;
  return s + '</svg>';
}

/* ================= 문제 글 조각 ================= */
const alt = i => ((i + ((G.run && G.run.flip) ? 1 : 0)) % 2 === 0);
function expr(s) { return `<div class="expr">${s.replace(/□/g, '<span class="blank"></span>')}</div>`; }
function story(t) { return `<div class="story">${t}</div>`; }
function row(...xs) { return `<div class="row">${xs.join('')}</div>`; }
const OP = s => `<b class="op">${s}</b>`;
function soltx(t) { return `<div class="soltx">${t}</div>`; }
