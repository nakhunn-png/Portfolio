/* 화면 연결 (시작 → 준비(문제·뽑기·합성) → 전투 → 결과) */
var G = globalThis.G || (globalThis.G = {});

G.UI = (function () {
  var $ = function (id) { return document.getElementById(id); };
  var C = G.CONFIG;
  var A = {               // 앱 상태
    mode: 'title', run: null, book: null, settings: null,
    stageIdx: 0, waveIdx: 0, life: C.lifePerStage,
    battle: null, paused: false, busy: false, acc: 0, lastFrame: 0, outcomeHandled: false, scale: 1
  };

  /* ───────── 저장 ───────── */
  function load(key, def) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function drop(key) { try { localStorage.removeItem(key); } catch (e) {} }
  function saveBook() { save('냠냠_모아보기', A.book); }
  function saveSettings() { save('냠냠_설정', A.settings); }
  function saveRun() { if (A.run) save('냠냠_모험', { run: A.run, stageIdx: A.stageIdx, waveIdx: A.waveIdx, life: A.life }); }

  /* ───────── 도움 함수 ───────── */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function sprURL(id) { return G.Pixel.toURL('캐릭터/' + id, G.CharArt.sprite(id)); }
  function img(src, cls, w, h) { var i = el('img', cls); i.src = src; i.alt = ''; if (w) i.style.width = w + 'px'; if (h) i.style.height = h + 'px'; i.draggable = false; return i; }
  function gradeChip(key, text) { var g = G.grade(key); var s = el('span', 'gc', text); s.style.background = g.color; return s; }
  var FRAME_MARK = { normal: '●', epic: '★', unique: '✿', legendary: '♛' };   // 등급 테두리 모양 (색만으로 구분하지 않기)
  function sound(n) { G.Sound.play(n); }
  // 받침에 맞는 조사: 받침(대장, '을') / 받침없음('를')
  function hasBatchim(word) { var c = word.charCodeAt(word.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; }
  function eul(word) { return hasBatchim(word) ? '을' : '를'; }
  function ieyo(word) { return hasBatchim(word) ? '이에요' : '예요'; }
  function gamePos(node) {
    var r = node.getBoundingClientRect(), g = $('game').getBoundingClientRect();
    return { x: (r.left - g.left) / A.scale + r.width / A.scale / 2, y: (r.top - g.top) / A.scale + r.height / A.scale / 2 };
  }
  function toast(text, ms) {
    var t = $('toast'); t.textContent = text; t.classList.remove('hidden');
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, ms || 1800);
  }
  function confetti(n) {
    var fx = $('fx'), cols = ['#ff5a7a', '#ffd23f', '#4cc35a', '#4fb3ff', '#a46be8', '#ffffff'];
    for (var i = 0; i < (n || 60); i++) {
      var c = el('div', 'confetti'); c.style.left = Math.random() * 960 + 'px'; c.style.top = '-20px';
      c.style.background = cols[i % cols.length]; c.style.animationDelay = Math.random() * 0.6 + 's'; c.style.animationDuration = 1.2 + Math.random() * 0.9 + 's';
      fx.appendChild(c); setTimeout(function (x) { return function () { x.remove(); }; }(c), 2800);
    }
  }

  /* ───────── 화면 전환 ───────── */
  function show(id) {
    ['scr-title', 'scr-prep', 'scr-battle', 'scr-book', 'scr-settings', 'scr-result'].forEach(function (s) { $(s).classList.toggle('on', s === id); });
  }
  function setBackground(stageIdx) {
    G.Render.background($('bg').getContext('2d'), stageIdx);
  }
  function clearField() { $('field').getContext('2d').clearRect(0, 0, 960, 540); }

  var overlayStack = [];
  function openOverlay(node, onBack) {
    var o = $('overlay'); o.innerHTML = ''; o.appendChild(node); o.classList.remove('hidden');
    o.onclick = null;
  }
  function closeOverlay() { var o = $('overlay'); o.classList.add('hidden'); o.innerHTML = ''; o.onclick = null; }

  function dialog(title, text, buttons, cls) {
    var d = el('div', 'dialog ' + (cls || ''));
    if (title) d.appendChild(el('h2', '', title));
    if (text) d.appendChild(el('p', '', text));
    var b = el('div', 'btns' + (buttons.length === 2 && !cls ? ' row' : ''));
    buttons.forEach(function (bt) {
      var x = el('button', 'btn ' + (bt.cls || 'sky'), bt.text);
      x.onclick = function (ev) { ev.stopPropagation(); sound('click'); bt.fn(); };
      b.appendChild(x);
    });
    d.appendChild(b);
    openOverlay(d);
    return d;
  }

  /* ───────── 시작 화면 ───────── */
  function goTitle() {
    A.mode = 'title'; A.paused = false; A.battle = null; A.pendingEnd = null;
    closeOverlay(); clearField(); setBackground(0); show('scr-title');
    var saved = load('냠냠_모험', null), cb = $('btn-continue');
    if (saved && saved.run && C.stages[saved.stageIdx]) {
      var st = C.stages[saved.stageIdx];
      cb.innerHTML = '이어하기<small>난이도 ' + (saved.run.difficulty || C.defaultDifficulty) + ' · ' + st.name + ' · 무리 ' + (saved.waveIdx + 1) + '</small>';
      cb.disabled = false;
    } else { saved = null; cb.innerHTML = '이어하기<small>저장된 모험이 없어요</small>'; cb.disabled = true; }
    $('btn-start').textContent = saved ? '새로 시작하기' : '시작하기';
    $('save-note').classList.toggle('hidden', A.canSave);
    var box = $('title-heroes'); box.innerHTML = '';
    var heroes = [['n1', 150, 0], ['n3', 260, 0.15], ['n5', 370, 0.3], ['n7', 480, 0.45]];
    heroes.forEach(function (h) { var i = img(sprURL(h[0]), '', 128, 128); i.style.left = h[1] + 'px'; i.style.animationDelay = h[2] + 's'; box.appendChild(i); });
    [['pinkSlime', 650, 0.2], ['greenSlime', 740, 0.5]].forEach(function (m) {
      var i = img(G.Pixel.toURL('몬스터/' + m[0], G.MonsterArt.sprite(m[0])), '', 96, 96); i.style.left = m[1] + 'px'; i.style.animationDelay = m[2] + 's'; box.appendChild(i);
    });
  }
  // 문제 묶음 규칙 안내: 예) "새 문제 3개 (모두 맞히면 뽑기권 1개)"
  function isUnlimited() { return G.difficulty(A.run.difficulty).unlimited; }
  function ruleText(kind) {
    if (isUnlimited()) return '';
    var r = G.roundRule(A.run.difficulty, kind);
    return '새 문제 ' + r.count + '개 (' + (r.need === 1 ? '맞힐 때마다 뽑기권 ' + r.reward + '개'
      : r.need >= r.count ? '모두 맞히면 뽑기권 ' + r.reward + '개' : r.need + '문제씩 모두 맞히면 뽑기권 ' + r.reward + '개') + ')';
  }
  function giveRound(kind) { G.Collection.addRound(A.run, kind); }
  function chooseLevel() {
    var d = el('div', 'dialog level-dialog');
    d.appendChild(el('h2', '', '난이도를 골라요'));
    var grid = el('div', 'level-grid');
    C.difficulties.forEach(function (D) {
      var b = el('button', 'level-btn lv' + D.level, '<b>' + D.level + '단계</b><span class="lv-name">' + D.name + '</span><span class="lv-desc">' + D.desc + '</span>');
      b.onclick = function () { sound('click'); A.settings.lastLevel = D.level; saveSettings(); closeOverlay(); newGame(D.level); };
      if ((A.settings.lastLevel || C.defaultDifficulty) === D.level) b.classList.add('picked');
      grid.appendChild(b);
    });
    d.appendChild(grid);
    var back = el('button', 'btn small sky', '돌아가기'); back.onclick = function () { sound('click'); closeOverlay(); };
    d.appendChild(back);
    openOverlay(d);
  }
  function newGame(level) {
    A.run = G.Collection.newRun(level || A.settings.lastLevel || C.defaultDifficulty); A.stageIdx = 0; A.waveIdx = 0; A.life = C.lifePerStage;
    drop('냠냠_모험');
    goPrep();
    var D = G.difficulty(A.run.difficulty);
    var r0 = G.roundRule(D.level, 'first');
    toast(D.unlimited ? '문제를 맞히면 뽑기권! 친구를 뽑아 모험을 떠나요!' : '문제 ' + r0.count + '개를 모두 맞히면 뽑기권 ' + r0.reward + '개!', 2800);
  }
  function continueGame() {
    var s = load('냠냠_모험', null);
    if (!s || !s.run) return newGame();
    A.run = G.Collection.restore(s.run); A.stageIdx = s.stageIdx; A.waveIdx = s.waveIdx; A.life = s.life;
    goPrep();
    toast('지난 모험을 이어서 해요! ' + C.stages[A.stageIdx].name + ' ' + (A.waveIdx + 1) + '번째 무리', 2400);
  }
  function askNewGame() {
    if (!load('냠냠_모험', null)) return chooseLevel();
    dialog('새로 시작할까요?', '저장된 모험이 사라지고 1단계부터 다시 시작해요.<br>(캐릭터 모아보기 기록은 그대로 남아요)', [
      { text: '네, 새로 시작', cls: 'red', fn: function () { closeOverlay(); chooseLevel(); } },
      { text: '아니요', cls: 'green', fn: closeOverlay }
    ]);
  }

  /* ───────── 위쪽 정보 ───────── */
  function hearts(node, life) {
    node.innerHTML = '생명 ';
    for (var i = 0; i < C.lifePerStage; i++) node.appendChild(img(G.Pixel.toURL('기타/생명' + (i < life ? '' : '빈'), G.MiscArt.heart(i < life))));
  }
  function hud(prefix, life) {
    var st = C.stages[A.stageIdx];
    $(prefix + '-stage-no').textContent = st.no;
    $(prefix + '-stage-name').textContent = st.no + '단계 ' + st.name;
    $(prefix + '-wave').textContent = '무리 ' + (A.waveIdx + 1) + ' / ' + st.waves;
    var D = G.difficulty(A.run.difficulty); $(prefix + '-level').textContent = '난이도 ' + D.level + ' ' + D.name;
    hearts($(prefix + '-hearts'), life);
  }
  function gradeCounts(node) {
    node.innerHTML = '';
    C.grades.forEach(function (g) { node.appendChild(gradeChip(g.key, FRAME_MARK[g.key] + ' ' + g.name + ' ' + G.Collection.countGrade(A.run, g.key))); });
  }

  /* ───────── 수학 문제 ───────── */
  function MathBox(host, onTicket) {
    var p = null, answered = false, showHint = !!A.settings.hintAlways, hidden = false, flashTimer = null, result = null;
    var D = G.difficulty(A.run.difficulty), entry = '';
    // 직접 쓰기는 4~6단계의 계산 문제만. 그림 보고 식 만들기 문제는 난이도와 상관없이 항상 보기 고르기
    function isTyped() { return D.input === 'type' && !!p && p.kind !== 'picture'; }
    function left() { return G.Collection.problemsLeft(A.run); }
    function curRound() { return A.run.rounds && A.run.rounds[0]; }
    function exprStr(e) { return G.MathGen.exprText(e); }
    function answerText() { return p.kind === 'picture' ? exprStr(p.expr) : String(p.answer); }

    function labelHTML() {
      if (D.unlimited) return '문제를 맞히면 뽑기권을 받아요 · 맞힌 문제 ' + A.run.solved + '개';
      var r = curRound(), h = '남은 문제 <b class="quota">' + left() + '</b>개';
      if (r && r.need > 1) {
        h += ' · <span class="set-dots">';
        var marks = r.marks || [];
        for (var i = 0; i < r.need; i++) h += '<i class="' + (i < marks.length ? (marks[i] ? 'on' : 'miss') : '') + '"></i>';
        h += '</span> ' + r.need + '문제 모두 맞히면 뽑기권 ' + r.reward + '개!';
      } else if (r) h += ' · 맞힐 때마다 뽑기권 ' + r.reward + '개';
      return h;
    }
    function questionNode() {
      if (p.kind === 'picture') {
        var box = el('div', 'q-pic');
        box.appendChild(el('div', 'q-ask', '그림에 알맞은 식을 골라요!'));
        box.appendChild(G.Picture.render(p.expr ? p : p));
        return box;
      }
      if (hidden && !answered) return el('div', 'q-text q-hidden', '식을 기억해서 답을 써요!');
      var shown = answered === 'right' ? p.answer : (isTyped() && entry && !answered ? entry : '?');
      return el('div', 'q-text', p.a + ' ' + (p.op === '+' ? '+' : '−') + ' ' + p.b + ' = <span class="qm">' + shown + '</span>');
    }
    function choicesNode() {
      var ch = el('div', 'choices' + (p.kind === 'picture' ? ' expr-choices' : ''));
      var list = p.kind === 'picture' ? p.exprChoices : p.choices;
      list.forEach(function (v) {
        var txt = p.kind === 'picture' ? exprStr(v) : String(v);
        var isRight = p.kind === 'picture' ? G.MathGen.sameExpr(v, p.expr) : v === p.answer;
        var b = el('button', 'choice' + (p.kind === 'picture' ? ' expr' : ''), txt);
        if (answered) { b.disabled = true; if (isRight) b.classList.add(answered === 'right' ? 'right' : 'show-answer'); if (p.pickedText === txt && !isRight) b.classList.add('wrong'); }
        b.onclick = function () { p.pickedText = txt; submit(isRight, b); };
        ch.appendChild(b);
      });
      return ch;
    }
    // 직접 쓰기: 숫자 자판 (그림 문제는 + − 도 눌러 식을 만든다)
    function parseEntry() {
      if (p.kind !== 'picture') return /^\d{1,2}$/.test(entry) ? +entry : null;
      var m = entry.match(/^(\d{1,2})([+−])(\d{1,2})$/);
      return m ? { a: +m[1], op: m[2] === '+' ? '+' : '-', b: +m[3] } : null;
    }
    function press(k) {
      if (answered) return;
      if (k === '지우기') entry = entry.slice(0, -1);
      else if (k === '확인') {
        var v = parseEntry(); if (v === null) return;
        var ok = p.kind === 'picture' ? G.MathGen.sameExpr(v, p.expr) : v === p.answer;
        p.pickedText = p.kind === 'picture' ? exprStr(v) : String(v);
        submit(ok, host.querySelector('.entry'));
        return;
      } else if (k === '+' || k === '−') { if (/^\d{1,2}$/.test(entry)) entry += k; }
      else {
        var parts = entry.split(/[+−]/), last = parts[parts.length - 1];
        if (last.length < 2) entry += k;
      }
      sound('click'); render();
    }
    function keypadNode() {
      var pad = el('div', 'keypad' + (p.kind === 'picture' ? ' with-ops' : ''));
      var disp = el('div', 'entry' + (answered === 'wrong' ? ' bad' : answered === 'right' ? ' good' : ''));
      disp.textContent = answered ? (p.pickedText || '') : (entry ? entry.replace(/([+−])/g, ' $1 ') : (p.kind === 'picture' ? '식을 써요' : '답을 써요'));
      if (!entry && !answered) disp.classList.add('placeholder');
      pad.appendChild(disp);
      var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '지우기', '확인'];
      var grid = el('div', 'keys');
      keys.forEach(function (k) {
        var b = el('button', 'key' + (k === '확인' ? ' ok' : k === '지우기' ? ' del' : (k === '+' || k === '−') ? ' op' : ''), k);

        b.disabled = !!answered || (k === '확인' && parseEntry() === null);
        b.onclick = function () { press(k); };
        grid.appendChild(b);
      });
      pad.appendChild(grid);
      return pad;
    }
    function msgNode() {
      var msg = el('div', 'q-msg');
      if (answered === 'right') {
        msg.classList.add('good');
        msg.textContent = result.tickets ? '정답이에요! 뽑기권 ' + result.tickets + '개를 받았어요!'
          : result.groupDone ? '정답이에요! 하지만 이번 묶음에 틀린 문제가 있어 뽑기권은 없어요.'
          : '정답이에요! 계속 맞혀 봐요!';
      } else if (answered === 'wrong') {
        var r = curRound(), more = '';
        // 그림 문제는 칸이 좁아 짧게 (묶음을 놓친 것은 빨간 동그라미로 보인다)
        if (!D.unlimited && result && !result.groupDone && r && r.need > 1 && p.kind !== 'picture') more = ' 이번 묶음은 뽑기권을 못 받지만 끝까지 풀어 봐요.';
        var t = answerText();
        msg.classList.add('soft');
        msg.innerHTML = '<span>아쉬워요! ' + (p.kind === 'picture' ? '알맞은 식은 <b>' + t + '</b>' + josa(p.expr.b) : '정답은 <b>' + t + '</b>' + josa(p.answer)) + '.' + more + '</span>';
        var nx = el('button', 'btn small green', left() > 0 ? '다음 문제' : '확인'); nx.onclick = function () { sound('click'); next(); }; msg.appendChild(nx);
      }
      return msg;
    }
    function render() {
      host.innerHTML = '';
      if (left() <= 0 && !answered) { renderDone(); return; }
      var head = el('div', 'q-head');
      head.appendChild(el('div', 'q-label', labelHTML()));
      if (!D.flashSec && p.kind !== 'picture') {
        var hb = el('button', 'btn small yellow hint-btn', showHint ? '그림 숨기기' : '그림으로 보기');
        hb.onclick = function () { showHint = !showHint; sound('click'); render(); };
        head.appendChild(hb);
      }
      host.appendChild(head);
      var hint = el('div', 'hint-box');
      if (p.kind !== 'picture' && ((showHint && !D.flashSec) || answered === 'wrong')) drawHint(hint, p);
      if (isTyped()) {
        var row = el('div', 'q-typed'), leftCol = el('div', 'q-left');
        leftCol.appendChild(questionNode()); if (p.kind !== 'picture') leftCol.appendChild(hint); leftCol.appendChild(msgNode());
        row.appendChild(leftCol); row.appendChild(keypadNode());
        host.appendChild(row);
      } else {
        host.appendChild(questionNode()); if (p.kind !== 'picture') host.appendChild(hint); host.appendChild(choicesNode()); host.appendChild(msgNode());
      }
    }
    // 풀 수 있는 문제를 모두 푼 경우
    function renderDone() {
      // 친구도 뽑기권도 없으면 싸울 수 없으므로 문제를 다시 준다
      if (A.mode === 'prep' && !A.run.roster.length && !A.run.tickets && !D.unlimited) {
        giveRound('rescue'); saveRun();
        toast('친구가 있어야 싸울 수 있어요. 다시 도전! ' + ruleText('rescue'), 3200);
        next(); return;
      }
      var d = el('div', 'q-done');
      d.appendChild(el('div', 'q-done-big', '이번 문제를 모두 풀었어요!'));
      d.appendChild(el('div', '', A.mode === 'battle'
        ? '지금은 풀 문제가 없어요.<br>무리를 물리치면 새 문제가 생겨요!'
        : '뽑기권으로 친구를 뽑고 <b>전투 시작!</b>을 눌러요.<br>무리를 물리치면 새 문제가 생겨요.'));
      host.appendChild(d);
    }
    // 답하기: 맞혀도 틀려도 1문제 줄고, 묶음을 모두 맞혔을 때만 뽑기권 (바로 저장)
    function submit(ok, btn) {
      if (answered) return;
      clearTimeout(flashTimer);
      result = G.Collection.answer(A.run, ok);
      if (ok) { answered = 'right'; A.run.solved++; sound('correct'); } else { answered = 'wrong'; A.run.wrong++; sound('wrong'); }
      saveRun();
      var from = btn ? gamePos(btn) : { x: 300, y: 300 };
      render();
      if (result.tickets) onTicket(from, result.tickets);
      if (ok) setTimeout(function () { if (host.isConnected) next(); }, result.tickets ? 1100 : 900);
    }
    function next() {
      clearTimeout(flashTimer);
      answered = false; hidden = false; entry = ''; result = null;
      if (left() <= 0) { render(); return; }
      if (Math.random() < (C.pictureRate || 0)) p = G.MathGen.nextPicture();
      else { p = G.MathGen.next(); p.kind = 'calc'; }
      var valid = p.kind === 'picture' ? G.MathGen.validatePicture(p) : G.MathGen.validate(p);
      if (!valid) return next();   // 보여주기 전에 한 번 더 검사
      render();
      // 6단계: 계산식은 1초 뒤에 사라진다
      if (D.flashSec && p.kind !== 'picture') {
        var mine = p;
        flashTimer = setTimeout(function () { if (p === mine && !answered && host.isConnected) { hidden = true; render(); } }, D.flashSec * 1000);
      }
    }
    // 키보드로도 입력 (직접 쓰기 단계)
    function onKey(e) {
      if (!host.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (!isTyped() || answered || !p || $('overlay').querySelector('.reveal, .merge-stage, .level-dialog')) return;
      if (!$('overlay').classList.contains('hidden') && !host.closest('#overlay')) return;
      var k = e.key;
      if (/^[0-9]$/.test(k)) press(k);
      else if (k === 'Backspace') press('지우기');
      else if (k === 'Enter') press('확인');
      else if (k === '+') press('+');
      else if (k === '-') press('−');
      else return;
      e.preventDefault();
    }
    document.addEventListener('keydown', onKey);
    next();
    return { next: next };
  }
  // 숫자 뒤 받침에 맞는 말: 7이에요 / 5예요
  function josa(n) { var last = n % 10; return (n === 0 || [1, 3, 6, 7, 8].indexOf(last) >= 0 || (n >= 10 && last === 0)) ? '이에요' : '예요'; }
  function drawHint(box, p) {
    function dots(n, cls, crossedFrom) {
      var g = el('span', 'hint-group'), i, ten;
      if (n >= 10) {
        ten = el('span', 'ten');
        for (i = 0; i < 10; i++) ten.appendChild(el('span', 'dot ' + (crossedFrom !== undefined && i >= crossedFrom ? 'x' : cls)));
        g.appendChild(ten);
      }
      for (i = n >= 10 ? 10 : 0; i < n; i++) g.appendChild(el('span', 'dot ' + (crossedFrom !== undefined && i >= crossedFrom ? 'x' : cls)));
      return g;
    }
    if (p.op === '+') { box.appendChild(dots(p.a, 'a')); box.appendChild(el('span', 'hint-sep', '+')); box.appendChild(dots(p.b, 'b')); }
    else { box.appendChild(dots(p.a, 'a', p.a - p.b)); box.appendChild(el('span', 'hint-sep', '')); }
  }
  function flyTicket(from, toNode, done) {
    var to = gamePos(toNode), t = img(G.Pixel.toURL('기타/뽑기권', G.MiscArt.ticket()), 'fly-ticket');
    t.style.left = (from.x - 20) + 'px'; t.style.top = (from.y - 14) + 'px';
    $('fx').appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.style.left = (to.x - 20) + 'px'; t.style.top = (to.y - 14) + 'px'; t.style.transform = 'scale(1.4) rotate(360deg)'; }); });
    setTimeout(function () { t.remove(); done && done(); }, 650);
  }

  /* ───────── 준비 단계 ───────── */
  function goPrep() {
    A.mode = 'prep'; A.paused = false; A.battle = null;
    closeOverlay(); clearField(); setBackground(A.stageIdx); show('scr-prep');
    saveRun();
    A.prepMath = MathBox($('prep-math'), function (from) {
      flyTicket(from, $('prep-tickets'), function () { refreshPrep(); });
    });
    refreshPrep();
  }
  function refreshPrep() {
    hud('prep', A.life);
    $('prep-tickets').textContent = A.run.tickets;
    $('btn-draw').disabled = A.run.tickets <= 0 || A.busy;
    $('btn-draw-all').classList.toggle('hidden', A.run.tickets < 2);
    gradeCounts($('grade-counts'));
    var lu = G.Collection.lineup(A.run), box = $('lineup'); box.innerHTML = '';
    $('lineup-count').textContent = lu.length + ' / ' + C.maxLineup + (A.run.roster.length > lu.length ? ' · 쉬는 친구 ' + (A.run.roster.length - lu.length) + '명' : '');
    if (!lu.length) box.appendChild(el('div', 'empty-hint', '아직 친구가 없어요. 문제를 풀고 뽑기를 해 봐요!'));
    lu.forEach(function (u) {
      var c = G.charById(u.id), g = G.grade(c.grade), m = el('div', 'mini');
      m.style.borderColor = g.dark; m.style.background = g.light;
      m.appendChild(el('span', 'job', C.jobs[c.job].name));
      m.appendChild(img(sprURL(u.id)));
      var gn = el('div', 'gname', FRAME_MARK[c.grade] + ' ' + g.name); gn.style.background = g.color; m.appendChild(gn);
      m.title = c.name;
      box.appendChild(m);
    });
    // 자동 합성을 끈 경우: 합성 가능한 수와 큰 합성 버튼
    var mb = $('merge-box'), info = G.Collection.mergeableInfo(A.run).filter(function (x) { return x.times > 0; });
    if (!A.settings.autoMerge && info.length) {
      var f = info[0], up = C.grades[G.gradeIndex(f.grade) + 1];
      mb.innerHTML = '<span>합성할 수 있어요! <b>' + G.grade(f.grade).name + ' ' + f.need + '명 → ' + up.name + ' 1명</b><br><small>지금 ' + f.times + '번 합성할 수 있어요</small></span>';
      var b = el('button', 'btn big orange', '합성하기');
      b.onclick = function () { if (A.busy) return; var ev = G.Collection.mergeOnce(A.run, A.book, f.grade); saveBook(); playMerges([ev], function () { refreshPrep(); saveRun(); }); };
      mb.appendChild(b); mb.classList.remove('hidden');
    } else mb.classList.add('hidden');

    var st = C.stages[A.stageIdx], wave = G.Battle.buildWave(A.stageIdx, A.waveIdx, A.run.difficulty);
    var names = st.monsters.map(function (k) { return G.MONSTERS[k].name; }).join(', ');
    var normalCount = wave.list.filter(function (q) { return !q.boss; }).length;
    $('next-info').innerHTML = '다음 무리: ' + names + ' ' + normalCount + '마리' + (wave.isBossWave ? '<br><span class="boss">우두머리 「' + G.MONSTERS[st.boss].name + '」 등장!</span>' : '');
    $('btn-fight').disabled = !A.run.roster.length;
  }

  /* ───────── 뽑기 ───────── */
  function cardNode(charId, isNew, small) {
    var c = G.charById(charId), g = G.grade(c.grade), d = el('div', 'gcard');
    d.style.borderColor = g.dark; d.style.background = 'linear-gradient(#fff, ' + g.light + ')';
    var deco = el('div', 'frame-deco', FRAME_MARK[c.grade]); deco.style.color = g.color; d.appendChild(deco);
    d.appendChild(img(sprURL(charId)));
    d.appendChild(el('div', 'nm', c.name));
    var gr = el('div', 'gr', g.name); gr.style.background = g.color; d.appendChild(gr);
    if (!small) d.appendChild(el('div', 'jb', C.jobs[c.job].name));
    if (isNew) d.appendChild(el('div', 'new-badge', '새로운 친구!'));
    return d;
  }
  function raysFor(grade) {
    var g = G.grade(grade), r = el('div', 'rays');
    r.style.background = 'repeating-conic-gradient(' + g.color + ' 0 12deg, ' + g.light + ' 12deg 24deg)';
    return r;
  }
  function doDraw() {
    if (A.busy || A.run.tickets <= 0) return;
    A.busy = true;
    var res = G.Collection.draw(A.run, A.book); saveBook();
    var wrap = el('div', 'reveal');
    var ch = img(G.Pixel.toURL('기타/뽑기상자', G.MiscArt.chest()), 'chest-anim');
    wrap.appendChild(ch); openOverlay(wrap); sound('open');
    setTimeout(function () {
      wrap.innerHTML = '';
      if (res.grade !== 'normal') wrap.appendChild(raysFor(res.grade));
      var card = cardNode(res.charId, false); card.classList.add('card-big'); wrap.appendChild(card);
      if (res.isNew) { var nb = el('div', 'new-badge', '새로운 친구!'); nb.style.position = 'absolute'; nb.style.top = '40px'; nb.style.right = '120px'; nb.style.zIndex = 3; wrap.appendChild(nb); }
      var msg = res.grade === 'legendary' ? '전설의 친구가 나타났어요!' : res.grade === 'unique' ? '멋진 유니크 친구예요!' : res.grade === 'epic' ? '반짝반짝 에픽 친구예요!' : '새 친구가 왔어요!';
      if (res.isNew) msg += '<br>모아보기에 새로 등록되었어요!';
      wrap.appendChild(el('div', 'tap', msg + '<br><small>화면을 누르면 계속해요</small>'));
      if (res.grade === 'legendary') { sound('legend'); confetti(90); }
      else if (res.grade === 'unique' || res.grade === 'epic') sound('rare');
      else sound('click');
      if (res.isNew) setTimeout(function () { sound('newChar'); }, 300);
      setTimeout(function () {
        $('overlay').onclick = function () { $('overlay').onclick = null; afterDraws(); };
      }, 250);
    }, 450);
  }
  function doDrawAll() {
    if (A.busy || A.run.tickets <= 0) return;
    A.busy = true;
    var results = [];
    while (A.run.tickets > 0) results.push(G.Collection.draw(A.run, A.book));
    saveBook();
    var best = results.reduce(function (b, r) { return G.gradeIndex(r.grade) > G.gradeIndex(b) ? r.grade : b; }, 'normal');
    var d = el('div', 'reveal'); d.style.width = '860px';
    if (best !== 'normal') d.appendChild(raysFor(best)).style.left = '220px';
    d.appendChild(el('div', 'merge-title', results.length + '명의 친구가 왔어요!'));
    var grid = el('div', 'multi-grid'); grid.style.position = 'relative'; grid.style.zIndex = 2;
    results.sort(function (a, b) { return G.gradeIndex(b.grade) - G.gradeIndex(a.grade); })
      .forEach(function (r, i) { var c = cardNode(r.charId, r.isNew, true); c.style.animation = 'appear .35s ' + (i * 0.04) + 's both'; grid.appendChild(c); });
    d.appendChild(grid);
    d.appendChild(el('div', 'tap', '화면을 누르면 계속해요'));
    openOverlay(d); sound('open');
    setTimeout(function () { sound(best === 'legendary' ? 'legend' : best === 'normal' ? 'click' : 'rare'); if (best === 'legendary') confetti(90); }, 200);
    setTimeout(function () { $('overlay').onclick = function () { $('overlay').onclick = null; afterDraws(); }; }, 400);
  }
  function afterDraws() {
    var events = A.settings.autoMerge ? G.Collection.autoMerge(A.run, A.book) : [];
    saveBook();
    playMerges(events, function () {
      closeOverlay(); A.busy = false; saveRun();
      // 멈춤 중 문제 창에서 뽑았다면 문제 창으로 돌아간다
      if (A.mode === 'battle' && A.paused) { refreshBattleBottom(); openMathDialog(); }
      else refreshAfterChange();
    });
  }
  function refreshAfterChange() {
    if (A.mode === 'prep') refreshPrep();
    if (A.mode === 'battle') refreshBattleBottom();
  }

  /* ───────── 합성 연출 ───────── */
  function playMerges(events, done) {
    if (!events.length) { done(); return; }
    A.busy = true;
    var i = 0;
    function one(ev, long) {
      var st = el('div', 'merge-stage');
      var from = G.grade(ev.from), to = G.grade(ev.to);
      st.appendChild(el('div', 'merge-title', '합성! ' + from.name + ' ' + ev.materials.length + '명 → ' + to.name + ' 1명'));
      var mats = ev.materials.map(function (id, k) {
        var a = k / ev.materials.length * Math.PI * 2 - Math.PI / 2;
        var m = img(sprURL(id), 'mat'); m.style.left = (300 - 40 + Math.cos(a) * 170) + 'px'; m.style.top = (190 - 40 + Math.sin(a) * 120) + 'px';
        st.appendChild(m); return m;
      });
      var fl = el('div', 'merge-flash'); fl.style.background = to.color; st.appendChild(fl);
      openOverlay(st); sound('merge');
      var dur = long ? 550 : 250;
      mats.forEach(function (m) { m.style.transitionDuration = dur + 'ms'; });
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        mats.forEach(function (m) { m.style.left = '260px'; m.style.top = '150px'; m.style.opacity = '0.3'; m.style.transform = 'scale(.5)'; });
      }); });
      setTimeout(function () {
        fl.classList.add('go');
        mats.forEach(function (m) { m.remove(); });
        var card = cardNode(ev.result, ev.isNew); card.style.position = 'absolute'; card.style.left = '195px'; card.style.top = '40px'; card.classList.add('card-big');
        card.style.animation = 'appear .35s cubic-bezier(.2,1.6,.4,1)';
        st.appendChild(card);
        if (ev.to === 'legendary') { sound('legend'); confetti(80); }
        if (ev.isNew) setTimeout(function () { sound('newChar'); }, 200);
      }, dur + 30);
      return dur + (long ? 700 : 450) + (ev.isNew || ev.to === 'legendary' ? 500 : 0);
    }
    function step() {
      if (i >= events.length) { done(); return; }
      // 연속 합성이 많으면 처음 하나만 길게 보여주고 나머지는 짧게 (마지막에 모아서 보여줌)
      if (i >= 3) { summary(events.slice(i)); return; }
      var wait = one(events[i], i === 0);
      i++;
      setTimeout(step, wait);
    }
    function summary(rest) {
      var d = el('div', 'reveal'); d.style.width = '860px';
      d.appendChild(el('div', 'merge-title', '연속 합성! ' + rest.length + '번 더 합쳐졌어요'));
      var grid = el('div', 'multi-grid');
      rest.forEach(function (ev) { grid.appendChild(cardNode(ev.result, ev.isNew, true)); });
      d.appendChild(grid); d.appendChild(el('div', 'tap', '화면을 누르면 계속해요'));
      openOverlay(d); sound('merge');
      setTimeout(function () { $('overlay').onclick = function () { $('overlay').onclick = null; done(); }; }, 300);
    }
    step();
  }

  /* ───────── 전투 ───────── */
  function startBattle() {
    if (!A.run.roster.length || A.busy) return;
    var ids = G.Collection.lineup(A.run).map(function (u) { return u.id; });
    saveRun();
    A.battle = G.Battle.create(A.stageIdx, A.waveIdx, ids, A.life, A.run.difficulty);
    A.mode = 'battle'; A.paused = false; A.acc = 0; A.outcomeHandled = false; A.lastLife = A.life;
    closeOverlay(); show('scr-battle'); setBackground(A.stageIdx);
    hud('bt', A.life); refreshBattleBottom();
    var b = $('wave-banner');
    b.textContent = A.battle.isBossWave ? (A.stageIdx === 6 ? '최종 결전! 마왕이 온다!' : '우두머리 무리가 온다!') : (A.waveIdx + 1) + '번째 무리 시작!';
    b.classList.remove('hidden');
    $('boss-bar').classList.add('hidden');
    sound('click');
  }
  function refreshBattleBottom() {
    gradeCounts($('bt-grade-counts'));
    $('bt-tickets').textContent = A.run.tickets;
  }
  var SPEEDS = [{ name: '보통', v: 1 }, { name: '빠르게', v: 1.6 }];
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - (A.lastFrame || now)) / 1000); A.lastFrame = now;
    var s = A.battle;
    if (A.mode !== 'battle' || !s) return;
    if (!A.paused && !A.busy) {
      // 멈춤이 아닐 때만 전투 시간이 흐른다
      A.acc += dt * SPEEDS[A.settings.speed || 0].v;
      var step = 1 / 60;
      while (A.acc >= step) { G.Battle.update(s, step); A.acc -= step; }
      s.events.forEach(function (e) { sound(e); });
      s.events.length = 0;
      if (s.life !== A.lastLife) { A.lastLife = s.life; hud('bt', s.life); }
      $('wave-banner').classList.toggle('hidden', !(s.intro > 0));
      var boss = s.monsters.filter(function (m) { return m.boss && m.hp > 0; })[0];
      $('boss-bar').classList.toggle('hidden', !boss);
      if (boss) { $('boss-name').textContent = (boss.final ? '최종 우두머리 ' : '우두머리 ') + boss.name; $('boss-fill').style.width = (boss.hp / boss.maxHp * 100) + '%'; }
      if (s.outcome && !A.outcomeHandled) { A.outcomeHandled = true; setTimeout(function () { onBattleEnd(s); }, 900); }
    }
    G.Render.battle($('field').getContext('2d'), s);
  }
  function onBattleEnd(s) {
    if (A.mode !== 'battle' || A.battle !== s) return;
    if (A.paused) { A.pendingEnd = s; return; }   // 멈춤 중이면 계속하기를 누른 뒤 결과로
    A.pendingEnd = null;
    A.life = s.life;
    var st = C.stages[A.stageIdx];
    if (s.outcome === 'win') {
      if (A.waveIdx === st.waves - 1) {
        if (A.stageIdx === C.stages.length - 1) return victory();
        sound('stage'); confetti(70);
        A.mode = 'stageclear';
        giveRound('stageClear');
        A.stageIdx++; A.waveIdx = 0; A.life = C.lifePerStage; saveRun(); A.stageIdx--;
        dialog(st.name + ' 완료!', '우두머리 「' + G.MONSTERS[st.boss].name + '」' + eul(G.MONSTERS[st.boss].name) + ' 물리쳤어요!<br>다음 지역은 「' + C.stages[A.stageIdx + 1].name + '」' + ieyo(C.stages[A.stageIdx + 1].name) + '.',
          [{ text: '다음 지역으로', cls: 'green big', fn: function () { A.stageIdx++; A.waveIdx = 0; A.life = C.lifePerStage; goPrep(); if (!isUnlimited()) toast(ruleText('stageClear') + '가 생겼어요!', 2800); } }]);
      } else {
        A.waveIdx++;
        giveRound('wave');
        goPrep();
        toast(isUnlimited() ? '무리를 물리쳤어요! 다음 무리를 준비해요.' : '무리를 물리쳤어요! ' + ruleText('wave'), 2800);
      }
    } else defeat();
  }

  /* ───────── 멈춤 ───────── */
  function pause() {
    if (A.busy && A.mode !== 'battle') return;
    if (A.paused) return;
    A.paused = true; sound('pause');
    pauseMenu();
  }
  function pauseMenu() {
    var d = dialog('잠깐 쉬어가요!', null, [
      { text: '계속하기', cls: 'green', fn: resume },
      { text: '수학 문제 보기', cls: 'yellow', fn: openMathDialog },
      { text: '처음으로', cls: 'red', fn: askHome }
    ], 'pause-dialog');
    if (A.mode === 'battle') d.appendChild(el('div', 'pause-note', '멈춘 동안에는 전투가 완전히 멈춰 있어요. 천천히 생각해요!'));
  }
  function resume() {
    closeOverlay(); A.paused = false; A.mathDialogRefresh = null;
    if (A.mode === 'prep') refreshPrep();
    if (A.pendingEnd) { var pe = A.pendingEnd; A.pendingEnd = null; onBattleEnd(pe); }
  }
  function askHome() {
    dialog('처음 화면으로 갈까요?', (A.mode === 'battle' ? '지금 싸우던 무리의 진행은 사라지고, 다음에 이 무리를 처음부터 다시 해요.<br>' : '') +
      '모험은 저장되어 처음 화면의 <b>이어하기</b>로 계속할 수 있어요.', [
      { text: '네, 처음으로', cls: 'red', fn: function () { saveRun(); A.run = null; goTitle(); } },
      { text: '아니요', cls: 'green', fn: pauseMenu }
    ]);
  }
  function openMathDialog() {
    if (A.mode === 'prep') { resume(); return; }   // 준비 단계에서는 문제가 이미 화면에 있다
    var d = el('div', 'dialog math-dialog');
    var top = el('div', '', ''); top.style.cssText = 'display:flex;gap:12px;align-items:center;width:100%;justify-content:space-between';
    var tk = el('div', 'ticket-line', ''); tk.appendChild(img(G.Pixel.toURL('기타/뽑기권', G.MiscArt.ticket()), 'ticket-ico'));
    var cnt = el('b', '', String(A.run.tickets)); tk.appendChild(document.createTextNode(' 뽑기권 ')); tk.appendChild(cnt); tk.appendChild(document.createTextNode('개'));
    var drawB = el('button', 'btn small orange', '뽑기');
    drawB.onclick = function () { if (A.run.tickets > 0) { sound('click'); A.returnToMath = true; doDraw(); } };
    var back = el('button', 'btn small sky', '돌아가기'); back.onclick = function () { sound('click'); A.mathDialogRefresh = null; pauseMenu(); };
    top.appendChild(tk); top.appendChild(drawB); top.appendChild(back);
    d.appendChild(top);
    var inner = el('div', 'math-inner'); d.appendChild(inner);
    d.appendChild(el('div', 'pause-note', '전투는 멈춰 있어요. 새로 뽑은 친구는 다음 무리부터 함께 싸워요!')).style.color = '#b0603a';
    openOverlay(d);
    MathBox(inner, function (from) { flyTicket(from, cnt, function () { cnt.textContent = A.run.tickets; drawB.disabled = false; refreshBattleBottom(); }); });
    drawB.disabled = A.run.tickets <= 0;
    A.mathDialogRefresh = function () { openMathDialog(); };
  }

  /* ───────── 결과 ───────── */
  function defeat() {
    A.mode = 'result'; sound('lose'); closeOverlay(); clearField();
    var p = $('result-panel'); p.innerHTML = '';
    p.appendChild(el('h2', '', '아쉬워요! 다시 해 볼까요?'));
    var art = el('div', 'result-art');
    G.Collection.lineup(A.run).slice(0, 4).forEach(function (u) { art.appendChild(img(sprURL(u.id), '', 96, 96)); });
    p.appendChild(art);
    p.appendChild(el('p', '', '괜찮아요! 누구나 처음에는 어려워요.'));
    p.appendChild(el('p', '', (isUnlimited() ? '문제를 더 풀어서 ' : '다시 도전하면 ' + ruleText('retry') + '를 풀 수 있어요. ') + '친구를 더 모으고 합성하면 훨씬 강해져요!'));
    p.appendChild(el('p', '', '「' + C.stages[A.stageIdx].name + '」 첫 번째 무리부터 다시 도전해요. 모은 친구들은 그대로 함께해요.'));
    var b = el('div', 'btns');
    var again = el('button', 'btn big green', '다시 도전하기'); again.onclick = function () { sound('click'); A.waveIdx = 0; A.life = C.lifePerStage; goPrep(); };
    var home = el('button', 'btn big sky', '처음으로'); home.onclick = function () { sound('click'); A.run = null; goTitle(); };
    b.appendChild(again); b.appendChild(home); p.appendChild(b);
    A.waveIdx = 0; A.life = C.lifePerStage; giveRound('retry'); saveRun();
    show('scr-result');
  }
  function victory() {
    A.mode = 'result'; sound('victory'); closeOverlay(); clearField(); confetti(140); setTimeout(function () { confetti(100); }, 1200);
    drop('냠냠_모험');
    var p = $('result-panel'); p.innerHTML = '';
    p.appendChild(el('h2', '', '최종 승리! 축하해요!'));
    p.appendChild(el('p', '', '난이도 ' + A.run.difficulty + ' 「' + G.difficulty(A.run.difficulty).name + '」 완료!'));
    var art = el('div', 'result-art');
    G.Collection.lineup(A.run).slice(0, 5).forEach(function (u, i) { var x = img(sprURL(u.id), '', 100, 100); x.style.animationDelay = i * 0.12 + 's'; art.appendChild(x); });
    var dk = img(G.Pixel.toURL('몬스터/demonKing', G.MonsterArt.sprite('demonKing')), '', 110, 110); dk.style.transform = 'rotate(-12deg)'; dk.style.opacity = '.75'; art.appendChild(dk);
    p.appendChild(art);
    p.appendChild(el('p', '', '최종 우두머리 「최종 마왕」을 물리치고 일곱 지역을 모두 모험했어요!'));
    var found = G.CHARACTERS.filter(function (c) { return A.book.found[c.id]; }).length;
    var stats = el('div', 'result-stats');
    stats.appendChild(el('div', 'stat-box', '발견한 캐릭터 <b>' + found + '</b> / ' + G.CHARACTERS.length));
    stats.appendChild(el('div', 'stat-box', '맞힌 문제 <b>' + A.run.solved + '</b>개'));
    p.appendChild(stats);
    var gs = el('div', 'result-stats');
    C.grades.forEach(function (g) { var x = el('div', 'stat-box', '얻은 ' + g.name + ' <b>' + A.run.gainedByGrade[g.key] + '</b>명'); x.style.borderColor = g.color; x.style.background = g.light; gs.appendChild(x); });
    p.appendChild(gs);
    var b = el('div', 'btns');
    var again = el('button', 'btn big green', '다시 하기'); again.onclick = function () { sound('click'); A.run = null; goTitle(); chooseLevel(); };
    var book = el('button', 'btn big purple', '캐릭터 모아보기'); book.onclick = function () { sound('click'); A.run = null; openBook(true); };
    b.appendChild(again); b.appendChild(book); p.appendChild(b);
    show('scr-result');
  }

  /* ───────── 캐릭터 모아보기 ───────── */
  var bookTab = 'all';
  function openBook(fromResult) {
    A.bookReturn = fromResult ? 'title' : A.mode;
    A.mode = 'book'; show('scr-book');
    renderBook();
  }
  function ownedCount(id) { var r = A.run || (load('냠냠_모험', null) || {}).run; return r ? r.roster.filter(function (u) { return u.id === id; }).length : 0; }
  function renderBook() {
    var found = G.CHARACTERS.filter(function (c) { return A.book.found[c.id]; }).length;
    $('book-sum').innerHTML = '발견한 캐릭터 <b>' + found + '</b> / ' + G.CHARACTERS.length + '명';
    var tabs = $('book-tabs'); tabs.innerHTML = '';
    [{ key: 'all', name: '전체', color: '#7a6a90' }].concat(C.grades).forEach(function (g) {
      var t = el('button', 'tab' + (bookTab === g.key ? ' on' : ''), (g.key === 'all' ? '' : FRAME_MARK[g.key] + ' ') + g.name); t.style.background = g.color;
      t.onclick = function () { bookTab = g.key; sound('click'); renderBook(); };
      tabs.appendChild(t);
    });
    var grid = $('book-grid'); grid.innerHTML = '';
    G.CHARACTERS.filter(function (c) { return bookTab === 'all' || c.grade === bookTab; }).forEach(function (c) {
      var g = G.grade(c.grade), known = !!A.book.found[c.id], card = el('div', 'bcard' + (known ? '' : ' unknown'));
      card.style.borderColor = g.dark;
      if (known) card.style.background = 'linear-gradient(#fff, ' + g.light + ')';
      var gr = el('span', 'gr', FRAME_MARK[c.grade] + ' ' + g.name); gr.style.background = g.color; card.appendChild(gr);
      if (known) {
        card.appendChild(img(sprURL(c.id)));
        card.appendChild(el('div', 'nm', c.name));
        card.appendChild(el('div', 'cnt', '지금까지 모은 수 ' + (A.book.everOwned[c.id] || 0) + '명'));
        var oc = ownedCount(c.id);
        card.appendChild(el('span', 'owned', '보유 ' + oc));
        card.onclick = function () { sound('click'); detail(c); };
      } else {
        card.appendChild(img(G.Pixel.toURL('그림자/' + c.id, G.CharArt.shadow(c.id))));
        card.appendChild(el('div', 'qmark', '?'));
        card.appendChild(el('div', 'nm', '아직 못 만났어요'));
        card.appendChild(el('div', 'cnt', C.jobs[c.job].name));
      }
      grid.appendChild(card);
    });
  }
  function detail(c) {
    var g = G.grade(c.grade), s = G.unitStats(c.id), j = C.jobs[c.job];
    var d = el('div', 'dialog');
    var row = el('div', 'detail');
    row.appendChild(img(sprURL(c.id)));
    var info = el('div', 'stats');
    info.innerHTML = '<div style="font-size:30px">' + c.name + '</div>' +
      '<span class="gc" style="background:' + g.color + '">' + FRAME_MARK[c.grade] + ' ' + g.name + '</span> ' + j.name + '<br>' +
      c.desc + '<br>' +
      '공격력 ' + s.atk + ' · 체력 ' + s.hp + ' · 공격 간격 ' + s.interval + '초<br>' +
      '공격 방식: ' + j.style + '<br>' +
      '지금 보유: ' + ownedCount(c.id) + '명 · 지금까지 모은 수: ' + (A.book.everOwned[c.id] || 0) + '명';
    row.appendChild(info); d.appendChild(row);
    var b = el('button', 'btn sky', '닫기'); b.style.marginTop = '12px'; b.onclick = function () { sound('click'); closeOverlay(); };
    d.appendChild(b);
    openOverlay(d);
  }
  function closeBook() {
    var back = A.bookReturn;
    if (back === 'prep' && A.run) { A.mode = 'prep'; show('scr-prep'); refreshPrep(); }
    else goTitle();
  }

  /* ───────── 설정 ───────── */
  function openSettings() { A.mode = 'settings'; show('scr-settings'); renderSettings(); }
  function renderSettings() {
    function tg(id, on) { var b = $(id); b.textContent = on ? '켜짐' : '꺼짐'; b.className = 'toggle ' + (on ? 'on' : 'off'); }
    tg('set-merge', A.settings.autoMerge); tg('set-sound', A.settings.sound); tg('set-hint', A.settings.hintAlways);
    $('set-speed').textContent = SPEEDS[A.settings.speed || 0].name; $('set-speed').className = 'toggle wide';
  }

  /* ───────── 시작 ───────── */
  function fit() {
    // 창 가장자리에 붙어 잘리지 않도록 조금 여유를 둔다
    var s = Math.min((window.innerWidth - 16) / 960, (window.innerHeight - 16) / 540);
    A.scale = s; $('game').style.transform = 'scale(' + s + ')';
  }
  function init() {
    try { localStorage.setItem('냠냠_시험', '1'); localStorage.removeItem('냠냠_시험'); A.canSave = true; } catch (e) { A.canSave = false; }
    A.book = load('냠냠_모아보기', null) || G.Collection.newBook();
    A.settings = Object.assign({ autoMerge: true, sound: true, hintAlways: false, speed: 0 }, load('냠냠_설정', {}));
    G.Sound.setOn(A.settings.sound);
    fit(); window.addEventListener('resize', fit);

    $('chest-img').src = G.Pixel.toURL('기타/뽑기상자', G.MiscArt.chest());
    Array.prototype.forEach.call(document.querySelectorAll('.ticket-ico'), function (i) { i.src = G.Pixel.toURL('기타/뽑기권', G.MiscArt.ticket()); });

    document.addEventListener('pointerdown', function () { G.Sound.unlock(); }, { once: true });
    $('btn-start').onclick = function () { sound('click'); askNewGame(); };
    $('btn-continue').onclick = function () { sound('click'); continueGame(); };
    $('btn-book').onclick = function () { sound('click'); openBook(); };
    $('btn-settings').onclick = function () { sound('click'); openSettings(); };
    $('btn-draw').onclick = function () { doDraw(); };
    $('btn-draw-all').onclick = function () { doDrawAll(); };
    $('btn-fight').onclick = function () { startBattle(); };
    $('set-merge').onclick = function () { A.settings.autoMerge = !A.settings.autoMerge; saveSettings(); renderSettings(); sound('click'); };
    $('set-sound').onclick = function () { A.settings.sound = !A.settings.sound; G.Sound.setOn(A.settings.sound); saveSettings(); renderSettings(); sound('click'); };
    $('set-hint').onclick = function () { A.settings.hintAlways = !A.settings.hintAlways; saveSettings(); renderSettings(); sound('click'); };
    $('set-speed').onclick = function () { A.settings.speed = ((A.settings.speed || 0) + 1) % SPEEDS.length; saveSettings(); renderSettings(); sound('click'); };
    $('set-reset').onclick = function () {
      dialog('모아보기 기록을 지울까요?', '발견한 캐릭터 기록이 모두 사라져요.', [
        { text: '네, 지울래요', cls: 'red', fn: function () { A.book = G.Collection.newBook(); saveBook(); closeOverlay(); toast('기록을 지웠어요.'); } },
        { text: '아니요', cls: 'green', fn: closeOverlay }
      ]);
    };
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var act = t.dataset.act;
      if (act === 'pause') pause();
      if (act === 'book-close') { sound('click'); closeBook(); }
      if (act === 'settings-close') { sound('click'); goTitle(); }
    });
    // 휴대폰을 세로로 들면 "가로로 돌려 주세요" 안내 (전투 중이면 멈춤). 안내를 닫으면 이번에는 다시 띄우지 않는다
    var portrait = window.matchMedia('(orientation: portrait) and (max-width: 600px)'), rotateOff = false;
    function checkRotate() {
      var show = portrait.matches && !rotateOff;
      $('rotate-note').classList.toggle('hidden', !show);
      if (show && A.mode === 'battle' && !A.paused) pause();
    }
    $('rotate-ok').onclick = function () { rotateOff = true; sound('click'); checkRotate(); };
    if (portrait.addEventListener) portrait.addEventListener('change', checkRotate); else portrait.addListener(checkRotate);
    checkRotate();
    // 다른 창으로 넘어가면 전투를 자동으로 멈춘다
    document.addEventListener('visibilitychange', function () { if (document.hidden && A.mode === 'battle' && !A.paused) pause(); });
    // 키보드 도움: 스페이스·Esc = 멈춤
    document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === ' ') && A.mode === 'battle') { e.preventDefault(); if (A.paused) { if (!$('overlay').querySelector('.math-dialog')) resume(); } else pause(); } });

    goTitle();
    requestAnimationFrame(frame);
  }

  return { init: init, state: A, _test: { doDraw: doDraw, startBattle: startBattle, pause: pause, resume: resume, afterDraws: function () { A.busy = true; afterDraws(); }, refresh: refreshPrep } };
})();
