/* 화면과 흐름 (PRD 4, 5, 9, 11장)
 * 시작 → 스테이지 고르기 → 준비(문제·뽑기·배치) → 웨이브 → 웨이브 사이 문제 → … → (마무리 문제) → 결과 */
var G = globalThis.G || (globalThis.G = {});

G.UI = (function () {
  var C = G.CONFIG, Col = G.Collection, Bt = G.Battle, Ch = G.Challenge;
  var A = { mode: 'title', paused: false, selectedSlot: -1, t: 0 };
  var DEV = /[?&]dev=1/.test(location.search);

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function img(src, cls, w, h) { var i = el('img', 'pix ' + (cls || '')); i.src = src; i.alt = ''; if (w) i.width = w; if (h) i.height = h; return i; }
  function charURL(id) { return G.Pixel.toURL('캐릭터/' + id, G.CharArt.sprite(id)); }
  function shadowURL(id) { return G.Pixel.toURL('그림자/' + id, G.CharArt.shadow(id)); }

  /* ───────── 저장 ───────── */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function saveAll() { save('냠냠2_도감', A.book); save('냠냠2_진행', A.progress); save('냠냠2_설정', A.settings); }

  /* ───────── 화면 바꾸기 ───────── */
  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.toggle('on', s.id === id); });
    // 2026-11-26 배경 음악: 전투·보스전·나머지 화면마다 곡이 다르다
    if (G.Music) G.Music.play(id === 'scr-battle' ? (A.B && A.B.bossPhase ? 'boss' : 'battle') : 'calm');
  }
  function refreshMusic() {
    var on = A.settings.music !== false, b = $('btn-music');
    if (G.Music) G.Music.setOn(on);
    if (b) { b.textContent = on ? '🎵 음악 켜짐' : '🔇 음악 꺼짐'; b.classList.toggle('off', !on); }
  }
  function toggleMusic() { A.settings.music = A.settings.music === false; saveAll(); if (G.Music) G.Music.unlock(); refreshMusic(); }
  function toast(text, ms) {
    var t = $('toast'); t.textContent = text; t.classList.remove('hidden'); toast.at = performance.now();
    clearTimeout(toast.tm); toast.tm = setTimeout(function () { t.classList.add('hidden'); }, ms || 1800);
  }
  function floatText(x, y, text, cls) {
    var f = el('div', 'float-text ' + (cls || ''), text); f.style.left = x + 'px'; f.style.top = y + 'px';
    $('fx').appendChild(f); setTimeout(function () { f.remove(); }, 1000);
  }
  function overlay(node) { var o = $('overlay'); o.innerHTML = ''; o.appendChild(node); o.classList.remove('hidden'); }
  function closeOverlay() { $('overlay').classList.add('hidden'); $('overlay').innerHTML = ''; }
  function dialog(title, text, buttons) {
    var d = el('div', 'dialog'); d.appendChild(el('h2', '', title)); if (text) d.appendChild(el('p', '', text));
    var bs = el('div', 'btns');
    buttons.forEach(function (b) { var x = el('button', 'btn big ' + (b.cls || 'green'), b.text); x.onclick = b.fn; bs.appendChild(x); });
    d.appendChild(bs); overlay(d); return d;
  }

  /* ───────── 시작 화면 ───────── */
  function goTitle() {
    A.mode = 'title'; A.B = null; A.tower = null; show('scr-title'); closeOverlay();
    $('btn-challenge').classList.toggle('locked', !challengeOpen());
    var TL = Bt.LAYOUTS.loop(); G.Render.drawBackground(1, { paths: TL.paths, slots: [], hero: null }); G.Render.clear();   // 제목 화면에는 받침을 그리지 않는다
    var box = $('title-heroes'); box.innerHTML = '';
    ['n1', 'n9', 'e5', 'u2', 'n11', 'e2', 'l2'].forEach(function (id, i) {
      var im = img(charURL(id), '', 112, 112); im.style.left = (i * 132 + 10) + 'px'; im.style.animationDelay = (i * 0.15) + 's'; box.appendChild(im);
    });
  }

  /* ───────── 스테이지 고르기 ───────── */
  var UNIT_NAME = { 1: '덧뺄셈 1', 2: '덧뺄셈 2', 3: '덧뺄셈 3' };
  // 앞에 있는 「만든」 스테이지를 깨면 열린다 (보스 스테이지는 아직 만드는 중이라 건너뛴다)
  function stageOpen(st) {
    if (!st.ready) return false;
    if (DEV) return true;
    for (var n = st.no - 1; n >= 1; n--) { var prev = G.stageByNo(n); if (prev.ready) return !!A.progress.stars[n]; }
    return true;
  }
  /* 섬 지도: 섬 3개(단원 1·2·3). 섬을 누르면 그 섬의 스테이지를 차례로 한다(일반 → 일반 → 보스).
   * 앞 섬의 보스를 깨면 다음 섬이 열린다. 섬 안에서는 아직 안 깬 첫 스테이지부터 시작한다 */
  var ISLAND_NAME = { 1: '덧뺄셈 (1)', 2: '덧뺄셈 (2)', 3: '덧뺄셈 (3)' };
  function islandStages(u) { return C.stages.filter(function (st) { return st.unit === u && st.ready; }); }
  function islandOpen(u) { var f = islandStages(u)[0]; return !!f && stageOpen(f); }
  function islandDone(u) { return islandStages(u).every(function (st) { return !!A.progress.stars[st.no]; }); }
  function islandStart(u) { var list = islandStages(u), left = list.filter(function (st) { return !A.progress.stars[st.no]; }); return (left[0] || list[0]).no; }
  function nextInIsland(no) { var st = G.stageByNo(no), list = islandStages(st.unit), i = list.indexOf(st); return list[i + 1] || null; }
  // 섬 꾸미기 (단원 테마): 섬마다 그림 3개
  var ISLAND_DECO = { 1: ['🍭', '🌴', '🐙'], 2: ['⛄', '🌵', '🦂'], 3: ['🚀', '🎡', '👑'] };
  function goMap() {
    A.mode = 'map'; A.tower = null; show('scr-map');
    var g = $('map-grid'); g.innerHTML = '';
    var firstOpen = null;
    [1, 2, 3].forEach(function (u) {
      var open = islandOpen(u), done = islandDone(u);
      if (open && !done && firstOpen === null) firstOpen = u;
      var b = el('button', 'island i' + u + (open ? '' : ' locked') + (done ? ' done' : ''));
      var art = el('div', 'is-art');
      art.appendChild(el('div', 'is-water'));
      art.appendChild(el('div', 'is-sand'));
      var land = el('div', 'is-land');
      ISLAND_DECO[u].forEach(function (d, k) { land.appendChild(el('span', 'is-deco d' + k, d)); });
      art.appendChild(land);
      if (!open) art.appendChild(el('div', 'is-lock', '🔒'));
      b.appendChild(art);
      b.appendChild(el('div', 'is-name', ISLAND_NAME[u]));
      if (open) {
        var stars = islandStages(u).reduce(function (s, st) { return s + (A.progress.stars[st.no] || 0); }, 0), max = islandStages(u).length * 3;
        b.appendChild(el('div', 'is-stars', (done ? '✔ ' : '') + '★ ' + stars + ' / ' + max));
      } else b.appendChild(el('div', 'is-stars dim', '앞 섬을 깨면 열려요'));
      b.onclick = function () {
        if (!open) { toast('앞 섬을 먼저 깨요!'); return; }
        A.island = u; goDiffSelect(islandStart(u));
      };
      g.appendChild(b);
    });
    if (firstOpen !== null) { var f = g.children[firstOpen - 1]; f.classList.add('glow'); f.querySelector('.is-art').appendChild(el('div', 'is-badge', '여기부터!')); }
  }

  function challengeOpen() { return DEV || !!A.progress.stars[C.challengeUnlock]; }

  /* ───────── 배속 (9장) ───────── */
  function speedOpen(i) {
    var u = C.speeds[i].unlock;
    return DEV || !u || !!A.progress.stars[u];
  }
  function curSpeed() {
    var i = A.settings.speed || 0; if (!speedOpen(i)) i = 0;
    var s = C.speeds[i];
    // 보스와 싸우는 동안만 1.5배속까지 (2026-11-26: 전에는 보스 스테이지 부하 웨이브까지 묶여서 2배속을 열어도 1.5배속만 됐다)
    if (A.B && A.B.bossPhase && s.v > C.bossSpeedCap) return C.speeds[1];
    return s;
  }
  function cycleSpeed() {
    var i = A.settings.speed || 0;
    if (A.B && A.B.bossPhase && A.mode === 'battle') { toast('보스와 싸울 때는 1.5배속까지예요!', 2400); }
    else if (C.speeds[i].v === 1.5 && !speedOpen(2)) toast('과자 숲을 통과하면 2배속까지 지원해요!', 2400);
    for (var k = 1; k <= C.speeds.length; k++) { var j = (i + k) % C.speeds.length; if (speedOpen(j)) { A.settings.speed = j; break; } }
    saveAll(); refreshSpeed();
  }
  function refreshSpeed() {
    var s = curSpeed(); $('speed-label').textContent = s.name;
    $('speed-btn').className = 'speed-btn sp' + C.speeds.indexOf(s);
  }

  /* ───────── 영웅 고르기 (18장) ─────────
   * 물음표 칸(아크메이지 자리)을 secretClicks(5)번 누르고 비밀번호를 넣으면 숨은 영웅 아크메이지가 나타난다. 한 번 찾으면 계속 남는다 */
  function heroOpen(id) { return !C.heroes[id].secret || A.progress.secretArch || DEV; }
  function stageLabel(no) { var st = G.stageByNo(no); return st.tower ? st.name : (st.boss ? '보스' : no) + ' · ' + st.name; }
  // 2단계: 영웅 고르기
  function goHeroSelect(no) {
    A.mode = 'hero'; A.pendingStage = no; A.secretTaps = 0; show('scr-hero');
    $('hero-stage').textContent = stageLabel(no);
    if (!A.settings.hero || !heroOpen(A.settings.hero)) A.settings.hero = 'mage';
    var D = G.difficultyByKey(A.settings.diff);
    $('hero-diff').textContent = '난이도: ' + D.name; $('hero-diff').className = 'hud-chip diff-chip d-' + D.key;
    renderHeroCards();
    A.tutorial = !!D.tutorial;
    guide('hero', '#hero-cards', '영웅을 골라요', '영웅은 친구들과 함께 싸우고, 특별한 능력을 써요. 마음에 드는 영웅을 눌러 보세요!');
    guide('heroGo', '#btn-hero-go', '출발!', '다 골랐으면 「출발!」을 눌러요. 난이도를 바꾸고 싶으면 왼쪽 위 「◀ 난이도」를 눌러요.');
  }
  /* 1단계: 난이도 고르기 (19장). 재앙은 냠냠 마왕(덧뺄셈 (3) 섬)을 「아주 어려움」 이상으로 깨면 열린다.
   * 아직 별이 하나도 없는 친구는 「튜토리얼」이 먼저 골라져 있다 */
  function diffOpen(key) { var D = G.difficultyByKey(key); return !D.hidden || A.progress.disasterOpen || DEV; }
  function goDiffSelect(no) {
    A.mode = 'diff'; A.pendingStage = no; show('scr-diff'); closeOverlay();
    $('diff-stage').textContent = stageLabel(no);
    if (!A.progress.tutorialDone && !Object.keys(A.progress.stars).length && G.stageByNo(no).unit === 1) A.settings.diff = 'tutorial';
    if (A.settings.diff === 'tutorial' && G.stageByNo(no).unit !== 1) A.settings.diff = C.defaultDifficulty;   // 튜토리얼은 덧뺄셈 (1) 섬의 과자 숲에서만
    if (!A.settings.diff || !diffOpen(A.settings.diff)) A.settings.diff = C.defaultDifficulty;
    renderDiffs();
  }
  /* 난이도 화면: 맨 위 큰 칸 튜토리얼, 가운데 창문 4개(쉬움~아주 어려움), 맨 아래 재앙(덧뺄셈 (3) 섬을 아주 어려움으로 깨면 열림) */
  function renderDiffs() {
    var box = $('diff-cards'); box.innerHTML = '';
    var top = el('div', 'dsel-row top'), mid = el('div', 'dsel-row mid'), bot = el('div', 'dsel-row bot');
    C.difficulties.forEach(function (D, idx) {
      var row = D.tutorial ? top : D.hidden ? bot : mid;
      function card(cls, title, sub, locked) {
        var b = el('button', 'dcard ' + cls + (locked ? ' locked' : '') + (!locked && A.settings.diff === D.key ? ' sel' : ''));
        b.appendChild(el('div', 'dc-badge', locked ? '🔒' : D.tutorial ? '🎓' : D.hidden ? '!' : String(idx)));
        var t = el('div', 'dc-text'); t.appendChild(el('div', 'dc-title', title)); t.appendChild(el('div', 'dc-sub', sub)); b.appendChild(t);
        if (!locked) b.appendChild(el('div', 'dc-hearts', '♥'.repeat(D.life)));
        return b;
      }
      var c;
      if (D.tutorial && G.stageByNo(A.pendingStage).unit !== 1) { c = card('d-tutorial', '튜토리얼', '덧뺄셈 (1) 섬의 과자 숲에서 해요', true); c.onclick = function () { toast('튜토리얼은 덧뺄셈 (1) 섬에서 해요!'); }; }
      else if (D.hidden && !diffOpen(D.key)) { c = card('d-disaster', '? ? ?', '「아주 어려움」으로 덧뺄셈 (3) 섬을 깨면 열려요', true); c.onclick = function () { toast('아직 잠겨 있어요!'); }; }
      else {
        var sub = D.tutorial ? (A.progress.tutorialDone ? '✔ 끝냈어요 · 답을 알려 주는 연습 판' : '처음이라면 여기부터! 답을 알려 줘요 · 2분')
          : D.hidden ? '생명 1개 · 식이 2초 뒤 사라져요' : (D.keypad ? '답을 숫자로 써요' + (D.flash ? ' · 식이 ' + D.flash + '초 뒤 가려져요' : '') : '보기에서 답을 골라요');
        c = card('d-' + D.key, D.name, sub, false);
        c.onclick = function () { A.settings.diff = D.key; A.settings.diffChosen = true; saveAll(); renderDiffs(); };
      }
      row.appendChild(c);
    });
    box.appendChild(top); box.appendChild(mid); box.appendChild(bot);
    var D = G.difficultyByKey(A.settings.diff);
    $('diff-note').textContent = D.tutorial ? '튜토리얼은 답을 알려 주고 2분이면 끝나요.' : '고른 난이도: ' + D.name + ' — ' + D.desc;
  }
  function renderHeroCards(revealed) {
    var box = $('hero-cards'); box.innerHTML = '';
    C.heroOrder.forEach(function (id) {
      var H = C.heroes[id], open = heroOpen(id);
      if (!open) { var ph = el('div', 'hero-card secret-slot'); ph.appendChild(el('div', 'secret-q', '?')); ph.onclick = function (e) { e.stopPropagation(); secretTap(); }; box.appendChild(ph); return; }
      var c = el('button', 'hero-card' + (A.settings.hero === id ? ' sel' : '') + (H.secret ? ' secret' : '') + (revealed === id ? ' reveal' : ''));
      c.appendChild(img(charURL(id), '', 104, 104));
      c.appendChild(el('div', 'hc-name', H.name));
      c.appendChild(el('div', 'hc-skill', H.skillName));
      c.appendChild(el('div', 'hc-desc', H.desc));
      c.onclick = function (e) { e.stopPropagation(); A.settings.hero = id; saveAll(); renderHeroCards(); };
      box.appendChild(c);
    });
  }
  /* 2026-11-26 아크메이지 칸(물음표 칸)을 연속 5번 누르면 비밀번호 창이 뜬다. 비밀번호(secretPassword)가 맞아야 열린다 */
  function secretTap() {
    if (A.mode !== 'hero' || A.progress.secretArch) return;
    var now = performance.now();   // 5번 「연속」: 사이가 길면 처음부터 다시 센다
    if (A.secretLast && now - A.secretLast > C.secretGap * 1000) A.secretTaps = 0;
    A.secretLast = now; A.secretTaps++;
    if (A.secretTaps >= C.secretClicks) { A.secretTaps = 0; askSecret(); }
  }
  function askSecret() {
    var pw = String(C.secretPassword), typed = '';
    var d = el('div', 'dialog pw-dialog');
    d.appendChild(el('h2', '', '비밀번호를 입력하세요'));
    var dots = el('div', 'pw-dots'); d.appendChild(dots);
    function draw() { dots.innerHTML = ''; for (var i = 0; i < pw.length; i++) dots.appendChild(el('span', '', i < typed.length ? '●' : '')); }
    var pad = el('div', 'pw-pad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '지움', '0', '닫기'].forEach(function (k) {
      var b = el('button', 'btn ' + (k === '닫기' ? 'red' : k === '지움' ? 'white' : 'sky'), k);
      b.onclick = function () {
        if (k === '닫기') { closeOverlay(); return; }
        if (k === '지움') { typed = typed.slice(0, -1); draw(); return; }
        typed += k; draw();
        if (typed.length < pw.length) return;
        if (typed === pw) {
          closeOverlay();
          A.progress.secretArch = true; A.settings.hero = 'arch'; saveAll();
          renderHeroCards('arch');
          $('game').classList.remove('flash'); void $('game').offsetWidth; $('game').classList.add('flash');
          toast('숨은 영웅 아크메이지가 나타났어요!');
        } else {
          typed = ''; setTimeout(draw, 250);
          d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
          toast('비밀번호가 틀렸어요');
        }
      };
      pad.appendChild(b);
    });
    d.appendChild(pad); draw(); overlay(d);
  }

  /* ───────── 스테이지 시작 ───────── */
  function startStage(no, heroId, diffKey) {
    var st = G.stageByNo(no);
    A.stageNo = no; A.heroId = heroId || A.settings.hero || 'mage';
    A.diffKey = diffKey || A.settings.diff || C.defaultDifficulty;
    var D = G.difficultyByKey(A.diffKey);
    A.tutorial = !!D.tutorial;
    var extra = !!(A.progress.rewards && A.progress.rewards.slot9);
    A.run = Col.newRun(C.slots + (extra ? C.extraSlots : 0)); Col.addCoins(A.run, D.coins);
    // 선물 코인 (도감 보상·도전 과제·놀이로 모아 둔 것)을 이번 판에 쓴다
    var gift = A.progress.gift || 0, notes = [];
    if (gift > 0) { var pay = Math.min(gift, C.giftPerRun); Col.addCoins(A.run, pay); A.progress.gift = gift - pay; notes.push('선물 코인 +' + pay); saveAll(); }   // 한 판에 giftPerRun 까지만 (첫 웨이브가 너무 쉬워지지 않게)
    A.tower = st.tower ? { floor: 0 } : null;
    // 2026-11-26 친구 이어 가기: 지난번에 깬 판의 친구들이 함께 온다 (튜토리얼·탑 빼고). 대신 적도 그만큼 단단해진다
    var carry = !D.tutorial && !st.tower && A.progress.team && (A.progress.team.slots || []).some(Boolean);
    if (carry) { Col.loadTeam(A.run, A.progress.team); notes.push('지난 판 친구들이'); }
    A.B = Bt.create(st.tower ? Ch.towerTheme(1) : no, Col.lineup(A.run), A.heroId, A.diffKey, { extraSlot: extra, tower: !!st.tower, carry: !!carry });
    A.retried = false; hideBossUI();
    $('prep-diff').textContent = D.name; $('prep-diff').className = 'hud-chip diff-chip d-' + D.key;
    A.wavesDone = 0; A.realBattle = 0; A.stageStart = performance.now(); A.bubbleTimer = 0; A.selectedSlot = -1; A.targeting = false;
    G.Render.drawBackground(A.B.stageNo, A.B);
    $('prep-stage-no').textContent = $('bt-stage-no').textContent = st.tower ? '탑' : st.boss ? '!' : no;
    $('prep-stage-name').textContent = $('bt-stage-name').textContent = st.name;
    var H = C.heroes[A.heroId];
    $('skill-img').src = charURL(A.heroId); $('skill-name').textContent = H.skillName;
    goPrep('prep');
    var tip = st.tower ? '한 층을 지킬 때마다 문제 3개! 5층마다 작은 보스가 나와요.' : st.tip;
    if (notes.length) tip = notes.join(' · ') + ' 함께해요!' + (carry ? ' (적도 더 단단해요)' : '') + ' ' + (tip || '');
    if (tip) toast(tip, 4500);
  }

  /* ───────── 영웅 능력 버튼 ───────── */
  function refreshSkill() {
    var b = A.B; if (!b || !b.hero) return;
    var ready = Bt.skillReady(b), need = C.boss.pipsNeed;
    var k = b.bossPhase ? 1 - b.pips / need : b.hero.cd / b.hero.maxCd;
    $('skill-btn').classList.toggle('ready', ready);
    $('skill-cd').style.height = (k * 100) + '%';
    var label = b.bossPhase ? '필살기 ' + '●●●○○○'.substr(3 - b.pips, 3) : C.heroes[A.heroId].skillName;
    if ($('skill-name').textContent !== label) $('skill-name').textContent = label;
    // 능력이 이어지는 동안: 버튼 위에 줄어드는 막대와 남은 초
    var act = skillLeft(b), box = $('skill-timer');
    box.classList.toggle('hidden', !act);
    if (act) {
      $('skill-timer-fill').style.width = Math.max(0, act.left / act.total * 100) + '%';
      $('skill-timer-fill').className = act.left / act.total < 0.25 ? 'low' : '';
      $('skill-timer-name').textContent = act.name;
      $('skill-timer-sec').textContent = Math.ceil(act.left / curSpeed().v) + '초';
    }
    if (ready && A.mode === 'battle' && !A.paused)
      guide('skill', '#skill-btn', '능력이 준비됐어요!', '반짝이는 영웅 버튼을 눌러 보세요.' + (C.heroes[A.heroId].target ? ' 그다음 화면에서 능력을 쓸 곳을 눌러요.' : ''));
  }
  // 지금 이어지는 능력의 남은 시간 (게임 시간). 바로 끝나는 능력(화살비·메테오)은 null
  function skillLeft(b) {
    var H = C.heroes[b.hero.id], left = 0;
    if (!H.dur) return null;
    if (H.skill === 'cheer') left = b.cheerT;
    if (H.skill === 'slowZone') b.zones.forEach(function (z) { left = Math.max(left, z.life - z.t); });
    if (H.skill === 'block') b.barriers.forEach(function (x) { left = Math.max(left, x.life - x.t); });
    return left > 0 ? { left: left, total: H.dur, name: H.skillName } : null;
  }
  function afterSkill() {
    refreshSkill();
    if (C.heroes[A.heroId].dur) guide('gauge', '#skill-timer', '막대를 봐요', '능력은 이 막대가 다 줄어들 때까지 이어져요. 버튼이 다시 반짝이면 또 쓸 수 있어요.');
  }
  function pressSkill() {
    if (A.mode !== 'battle' || A.paused) return;
    if (!Bt.skillReady(A.B)) { toast(A.B.bossPhase ? '보스 문제를 맞혀 필살기 칸을 채워요' : '아직 힘을 모으는 중이에요'); return; }
    var H = C.heroes[A.heroId];
    if (!H.target) { Bt.useSkill(A.B); banner(H.skillName); afterSkill(); return; }
    A.targeting = true;   // 2026-11-26 능력 쓸 곳을 고르는 동안에도 전투는 계속 흘러간다
    $('target-layer').classList.remove('hidden');
    $('target-hint').textContent = H.skill === 'block' ? '막을 길을 눌러요' : '능력을 쓸 곳을 눌러요';
  }
  function cancelTarget() { A.targeting = false; $('target-layer').classList.add('hidden'); }
  function targetTap(e) {
    if (!A.targeting) return;
    if (e.target.closest('.target-cancel')) { cancelTarget(); return; }
    var r = $('game').getBoundingClientRect(), x = (e.clientX - r.left) / A.scale, y = (e.clientY - r.top) / A.scale;
    if (Bt.useSkill(A.B, x, y)) { cancelTarget(); banner(C.heroes[A.heroId].skillName); afterSkill(); }
    else toast('길 위를 눌러요!');
  }

  /* ───────── 문제 (3-3, 4장) ─────────
   * kind: prep(처음 5개) / wave(웨이브 사이 3개) / final(마무리: 정답이 15개가 될 때까지) */
  function TQ() { return A.tutorial && !A.tower ? C.tutorialQuick : null; }   // 튜토리얼 빠른 판 설정
  function problemsOf(k) { var t = TQ(); return t ? t[k] : C.problems[k]; }
  function minCorrect() { var t = TQ(); return t ? t.minCorrect : C.minCorrectToClear; }
  function newQuiz(kind) {
    var n = kind === 'prep' ? problemsOf('prep') : (kind === 'wave' || kind === 'boss' || kind === 'retry') ? problemsOf('betweenWaves') : 0;
    return { kind: kind, left: n, p: null, tries: 0, done: false, attempts: 0 };
  }
  function quizFinished(q) {
    if (q.kind === 'final') return A.run.correct >= minCorrect() || q.attempts >= 30;
    return q.left <= 0;
  }
  function stageFormat() { return G.stageByNo(A.stageNo).format || 'choice'; }
  function nextProblem(q) {
    var st = G.stageByNo(A.stageNo);
    var types = A.tower ? Ch.towerTypes(A.wavesDone + 1) : st.types;
    q.p = stageFormat() === 'pickExpr' ? G.MathGen.makePick(types) : G.MathGen.make(types);
    // 식 세우기·문장제 (2026-11-26): 준비·웨이브 사이·마무리 문제에서 난이도마다 정한 비율로 섞는다. 풍선·보스·탑은 빨리 풀어야 해서 뺀다
    var W = A.B && A.B.diff.word, r = Math.random();
    if (W && !A.tower && (q.kind === 'prep' || q.kind === 'wave' || q.kind === 'final' || q.kind === 'boss' || q.kind === 'retry')) {
      var unit = st.boss === 'demon' ? 1 + Math.floor(Math.random() * 3) : st.unit;
      if (r < W.story) q.p = G.MathGen.makeWord(unit, 'story');
      else if (r < W.story + W.setup) q.p = G.MathGen.makeWord(unit, 'setup');
    }
    q.tries = 0; q.input = '';
  }
  // 10칸 그림 (스테이지 4): 앞 수를 먼저 채우고, 뒤 수로 10을 채운 다음 남은 것을 둘째 칸에
  function tenFrame(p) {
    var box = el('div', 'tenframes'), a = p.nums[0], b = p.nums[1];
    for (var f = 0; f < 2; f++) {
      var fr = el('div', 'tenframe');
      for (var i = 0; i < 10; i++) {
        var n = f * 10 + i, cls = n < a ? 'a' : n < a + b ? 'b' : 'empty';
        fr.appendChild(el('span', 'dot ' + cls));
      }
      box.appendChild(fr);
    }
    return box;
  }

  /* 그림 도움 (틀렸을 때). 2026-11-26 그림이 보기·숫자 자판을 넘거나 가리던 것을 고침:
   * 20 이하는 점을 10개씩 줄 맞춰 작게, 20 보다 크면 10 묶음 막대 + 낱개 점으로 짧게 보여 준다 */
  function hintNode(p) {
    var box = el('div', 'hint-box'), colors = ['a', 'b', 'c'], nums = p.nums || [];
    var big = nums.some(function (n) { return n > 20; }) || p.type === 'C1' || p.type === 'C2';
    function dots(n, cls, crossFrom) {
      var g = el('div', 'hint-group');
      for (var i = 0; i < n; i++) g.appendChild(el('span', 'dot ' + (crossFrom !== undefined && i >= crossFrom ? 'x' : cls)));
      return g;
    }
    function sticks(n, cls) {
      var g = el('div', 'hint-group tens');
      for (var t = 0; t < Math.floor(n / 10); t++) g.appendChild(el('span', 'stick'));
      for (var o = 0; o < n % 10; o++) g.appendChild(el('span', 'dot ' + cls));
      return g;
    }
    function sep(t) { box.appendChild(el('span', 'hint-sep', t)); }
    var minus = p.op && p.op.indexOf('-') >= 0;
    if (big) {
      nums.forEach(function (n, k) { box.appendChild(sticks(n, colors[k % 3])); if (k < nums.length - 1) sep(minus ? '−' : '+'); });
    } else if (p.op === 'blank+') {
      var g = el('div', 'hint-group');
      for (var i = 0; i < 10; i++) g.appendChild(el('span', 'dot ' + (i < nums[0] ? 'a' : 'empty')));
      box.appendChild(g);
    } else if (minus) {
      var take = nums.slice(1).reduce(function (s, x) { return s + x; }, 0);
      box.appendChild(dots(nums[0], 'a', nums[0] - take));
    } else {
      nums.forEach(function (n, k) { box.appendChild(dots(n, colors[k % 3])); if (k < nums.length - 1) sep('+'); });
    }
    return box;
  }

  /* 문제 칸 그리기. container 안을 새로 채운다. onAnswer(correct) 는 답 하나마다, onDone 은 묶음이 끝났을 때 */
  /* 식 세우기 그림: 수가 작을 때(단원 1·2)만 그림으로 보여 준다. 덜어 낸 것은 흐리게 X */
  function wordPicture(p) {
    if (p.unit === 3) return null;
    var box = el('div', 'q-pic'), n = p.nums;
    function group(cnt, icon, crossFrom, cls) {
      var g = el('div', 'pic-group' + (cls ? ' ' + cls : ''));
      for (var i = 0; i < cnt; i++) { var c = el('span', 'pic' + (crossFrom !== undefined && i >= crossFrom ? ' gone' : ''), icon); g.appendChild(c); }
      return g;
    }
    function sep(t) { return el('span', 'pic-sep', t); }
    var k = p.kind;
    if (k === 'add' || k === 'join') { box.appendChild(group(n[0], p.icon)); box.appendChild(sep(k === 'add' ? '더 가져옴 →' : '와')); box.appendChild(group(n[1], p.icon2 || p.icon, undefined, 'more')); }
    else if (k === 'three') { box.appendChild(group(n[0], p.icon)); box.appendChild(sep('·')); box.appendChild(group(n[1], p.icon)); box.appendChild(sep('·')); box.appendChild(group(n[2], p.icon)); }
    else if (k === 'take' || k === 'three-') { var off = k === 'take' ? n[1] : n[1] + n[2]; box.appendChild(group(n[0], p.icon, n[0] - off)); }
    else if (k === 'from10') box.appendChild(group(10, p.icon, 10 - n[1]));
    else if (k === 'ten') { box.appendChild(group(n[0], p.icon)); var e = el('div', 'pic-group empty'); for (var j = n[0]; j < 10; j++) e.appendChild(el('span', 'pic hole', '')); box.appendChild(e); }
    else if (k === 'cmp') { var c2 = el('div', 'pic-cmp'); c2.appendChild(group(n[0], p.icon)); c2.appendChild(group(n[1], p.icon2 || p.icon)); box.appendChild(c2); }
    return box;
  }
  function renderQuiz(container, q, onDone) {
    container.innerHTML = '';
    if (quizFinished(q)) {
      q.done = true;
      var msg = el('div', 'q-done');
      msg.appendChild(el('div', 'q-done-big', q.kind === 'final' ? '마무리 문제 끝!' : q.kind === 'bubble' ? '좋아요!' : '문제 끝!'));
      msg.appendChild(el('div', 'q-done-small', q.kind === 'final' ? '결과를 보러 가요.' : q.kind === 'bubble' ? '전투로 돌아가요.' : '코인으로 뽑기를 하고 전투를 시작해요.'));
      container.appendChild(msg);
      if (onDone) onDone();
      return;
    }
    if (!q.p) nextProblem(q);
    var p = q.p, fmt = stageFormat();
    if (fmt === 'tenframe' && !(p.type === 'B1' || p.type === 'B2')) fmt = 'choice';
    if (fmt === 'column' && !(p.type === 'C1' || p.type === 'C2')) fmt = 'keypad';
    var D = A.B ? A.B.diff : null;
    if (p.word === 'story') fmt = 'choice';   // 문장제는 스테이지 형식(10칸 그림·세로셈)을 쓰지 않는다
    if (D && D.keypad && fmt === 'choice' && !p.pick) fmt = 'keypad';   // 어려움부터: 답을 직접 쓴다
    // 형식마다 문제 칸 배치를 바꾼다 (css 의 .fmt-…)
    container.className = container.className.replace(/\s*fmt-\S+/g, '') + ' fmt-' + (p.word ? 'word' + (p.word === 'story' && fmt === 'keypad' ? ' fmt-wordkey' : '') : p.pick ? 'pick' : fmt);
    var head = el('div', 'q-label');
    head.textContent = q.kind === 'final' ? '마무리 문제 · 정답 ' + A.run.correct + ' / ' + minCorrect()
      : q.kind === 'bubble' ? '보너스 문제!' + (A.B && A.B.gimmick === 'dark' ? ' 맞히면 조명이 켜져요' : '')
      : '문제 ' + q.left + '개 남음' + (A.run.combo >= 2 ? ' · ' + A.run.combo + '연속 정답!' : '');
    container.appendChild(head);
    var msg2 = el('div', 'q-msg'), hintSlot = el('div', 'hint-slot'), row = el('div', 'choices'), display = null;

    // 문제 모양
    if (p.word) {   // 식 세우기: 그림 + 글 → 알맞은 식 고르기 / 문장제: 글 → 답
      var wb = el('div', 'q-word');
      if (p.word === 'setup') { var pic = wordPicture(p); if (pic) wb.appendChild(pic); }
      wb.appendChild(el('div', 'q-story', p.story));
      var askT = el('div', 'q-ask'); askT.innerHTML = p.word === 'setup' ? p.ask + ' <span class="qm">알맞은 식을 골라요</span>' : p.ask;
      wb.appendChild(askT);
      if (fmt === 'keypad' && p.word === 'story') { var qin2 = el('div', 'q-ans-line'); qin2.innerHTML = '답: <span class="qin">?</span>'; wb.appendChild(qin2); display = function () { var x = qin2.querySelector('.qin'); x.textContent = q.input || '?'; x.classList.toggle('empty', !q.input); }; }
      container.appendChild(wb);
    } else if (p.pick) {
      var t0 = el('div', 'q-text small'); t0.innerHTML = '답이 <span class="qm">' + p.answer + '</span>인 식은?'; container.appendChild(t0);
    } else if (fmt === 'column') {
      var col = el('div', 'column-calc'), a = p.nums[0], b = p.nums[1], op = p.op === '-' ? '−' : '+';
      function digitRow(n, sign) { var r = el('div', 'cc-row'); r.appendChild(el('span', 'cc-op', sign || '')); r.appendChild(el('span', 'cc-d', n >= 10 ? String(Math.floor(n / 10)) : '')); r.appendChild(el('span', 'cc-d', String(n % 10))); return r; }
      col.appendChild(digitRow(a)); col.appendChild(digitRow(b, op)); col.appendChild(el('div', 'cc-line'));
      var ans = el('div', 'cc-row'); ans.appendChild(el('span', 'cc-op', ''));
      var tens = el('span', 'cc-box'), ones = el('span', 'cc-box'); ans.appendChild(tens); ans.appendChild(ones); col.appendChild(ans);
      display = function () { var s = q.input; ones.textContent = s.length >= 1 ? s[0] : ''; tens.textContent = s.length >= 2 ? s[1] : ''; ones.classList.toggle('now', s.length === 0); tens.classList.toggle('now', s.length === 1); };
      var wrap = el('div', 'column-wrap'); wrap.appendChild(col); container.appendChild(wrap);
    } else {
      var text = el('div', 'q-text');
      var tail = p.op === 'blank+' ? '' : fmt === 'keypad' ? ' = <span class="qin">?</span>' : ' = <span class="qm">?</span>';
      // 숫자 자판인데 빈칸 문제(4 + □ = 10)면 □ 자리가 답 쓰는 칸이 된다 (전에는 답 칸이 없어 멈췄다)
      text.innerHTML = p.text.replace('□', fmt === 'keypad' ? '<span class="qin">?</span>' : '<span class="qbox">□</span>') + tail;
      container.appendChild(text);
      if (fmt === 'keypad') { var qin = text.querySelector('.qin'); display = function () { qin.textContent = q.input || '?'; qin.classList.toggle('empty', !q.input); }; }
      if (fmt === 'tenframe') container.appendChild(tenFrame(p));
      // 재앙: 식이 잠깐 보였다가 사라진다 (틀려서 다시 풀 때는 계속 보인다)
      // 아주 어려움·재앙: 단순 계산 식만 잠깐 보였다가 가려진다. 그림이 있는 문제(10칸 그림)·식 세우기·문장제는 계속 보인다 (틀려서 다시 풀 때도 보인다)
      if (D && D.flash && q.tries === 0 && fmt !== 'tenframe') setTimeout(function () { text.classList.add('gone'); }, D.flash * 1000);
    }
    container.appendChild(hintSlot);
    if (q.tries > 0 && !p.pick) { hintSlot.appendChild(hintNode(p)); container.classList.add('has-hint'); } else container.classList.remove('has-hint');

    function next(ms) { setTimeout(function () { q.p = null; renderQuiz(container, q, onDone); }, ms); }
    // 답 하나 내기 (모든 형식이 함께 쓴다)
    function submit(ok, node) {
      if (row.dataset.lock) return;
      if (ok) {
        row.dataset.lock = '1'; if (node) node.classList.add('right');
        var got = Col.answer(A.run, true, p.type); q.attempts++;
        if (q.kind !== 'final') q.left--;
        msg2.className = 'q-msg good'; msg2.textContent = '정답! 코인 +' + got;
        if (node) { var r = node.getBoundingClientRect(), gr = $('game').getBoundingClientRect(); floatText((r.left - gr.left) / A.scale + 30, (r.top - gr.top) / A.scale - 10, '+' + got, 'coin'); }
        refreshCoins();
        if (q.onRight) q.onRight();
        next(650);
      } else {
        if (node && node.classList.contains('choice')) { node.classList.add('wrong'); node.disabled = true; }
        Col.answer(A.run, false, p.type); q.attempts++; q.tries++;
        if (q.tries === 1) {
          msg2.className = 'q-msg soft'; msg2.textContent = p.pick ? '괜찮아요! 식을 하나씩 계산해 봐요.' : '괜찮아요! 그림을 보고 다시 해 봐요.';
          if (!p.pick) { hintSlot.innerHTML = ''; hintSlot.appendChild(hintNode(p)); container.classList.add('has-hint'); }
          q.input = ''; if (display) display();
        } else {
          row.dataset.lock = '1';
          Array.prototype.forEach.call(row.children, function (x) { if (x.dataset.right) x.classList.add('show-answer'); });
          msg2.className = 'q-msg soft';
          msg2.textContent = p.pick ? '정답은 ' + p.text + ' 이에요.' : '정답은 ' + p.answer + '이에요. 다음 문제로 가요.';
          if (q.kind !== 'final') q.left--;
          next(1900);
        }
      }
    }

    // 답하는 방법
    if (p.pick) {
      p.exprs.forEach(function (e) {
        var b = el('button', 'choice wide', e.text); if (e.ans === p.answer) b.dataset.right = '1';
        b.onclick = function () { submit(e.ans === p.answer, b); }; row.appendChild(b);
      });
    } else if (fmt === 'keypad' || fmt === 'column') {
      row.className = 'keypad';
      var maxLen = String(p.answer).length > 1 || fmt === 'column' ? 2 : 2;
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(function (d) {
        var b = el('button', 'key', String(d));
        b.onclick = function () { if (row.dataset.lock || q.input.length >= maxLen) return; q.input += d; display(); };
        row.appendChild(b);
      });
      var del = el('button', 'key del', '지우기'); del.onclick = function () { q.input = q.input.slice(0, -1); display(); }; row.appendChild(del);
      var ok = el('button', 'key ok', '확인');
      ok.onclick = function () {
        if (!q.input) { msg2.className = 'q-msg soft'; msg2.textContent = '숫자를 먼저 눌러요.'; return; }
        var v = fmt === 'column' ? Number(q.input.split('').reverse().join('')) : Number(q.input);   // 세로셈은 일의 자리부터 쓴다
        submit(v === p.answer, ok);
      };
      row.appendChild(ok);
      display();
    } else {
      p.choices.forEach(function (c) {
        var b = el('button', 'choice', String(c)); if (c === p.answer) b.dataset.right = '1';
        b.onclick = function () { submit(c === p.answer, b); }; row.appendChild(b);
      });
    }
    container.appendChild(row); container.appendChild(msg2);
    if (A.tutorial) {   // 튜토리얼: 답을 알려 준다 (정답 단추가 반짝이고, 숫자로 쓰는 문제는 답을 보여 준다)
      Array.prototype.forEach.call(row.children, function (x) { if (x.dataset.right) x.classList.add('tut-answer'); });
      if (row.className === 'keypad') container.insertBefore(el('div', 'tut-answer-tip', '정답은 ' + p.answer + '! ' + (fmt === 'column' ? '일의 자리 ' + (p.answer % 10) + '부터 눌러요' : '숫자를 누르고 「확인」')), row);
      else if (!row.querySelector('.tut-answer')) container.insertBefore(el('div', 'tut-answer-tip', '정답은 ' + p.answer + '!'), row);
    }
    if (fmt === 'column') { var tip = el('div', 'q-tip', '일의 자리부터 써요'); container.appendChild(tip); }
  }

  /* ───────── 준비 시간 ───────── */
  function goPrep(kind) {
    A.mode = 'prep'; A.paused = false; show('scr-prep'); closeOverlay();
    A.quiz = newQuiz(kind);
    var waveText = A.tower ? (kind === 'prep' ? '1층 준비' : A.wavesDone + '층 성공') : kind === 'prep' ? '준비' : kind === 'final' ? '마무리' : kind === 'boss' ? '보스 준비' : kind === 'retry' ? '보스 다시 도전' : '웨이브 ' + A.wavesDone + ' 끝';
    $('prep-wave').textContent = waveText;
    renderQuiz($('prep-math'), A.quiz, refreshPrep);
    refreshPrep();
    if (kind === 'prep') guide('prep', '#prep-math', '문제를 풀어요', '맞히면 코인을 10개 받아요. 튜토리얼에서는 반짝이는 단추가 정답이에요. 눌러 보세요!');
    if (kind === 'wave') guide('wave', '#prep-math', '웨이브 성공!', '웨이브 사이에는 문제를 조금 더 풀어요. 모은 코인으로 친구를 더 뽑으면 더 강해져요.');
    if (kind === 'final') guide('final', '#prep-math', '마무리 문제', '정답이 ' + minCorrect() + '개가 될 때까지 문제를 조금 더 풀면 끝나요.');
    if (kind === 'boss') guide('bossPrep', '#next-info', '보스가 와요!', '다음은 보스예요! 보스는 아주 튼튼해요. 친구를 많이 뽑아 두고 「보스와 싸우기!」를 눌러요.');
  }
  function refreshCoins() { $('prep-coins').textContent = A.run.coins; $('bt-coins').textContent = A.run.coins; $('bt-correct').textContent = A.run.correct; refreshDrawBtns(); }
  function refreshDrawBtns() {
    var can = Col.canDraw(A.run) && !Col.full(A.run);   // 출전 칸이 가득 차면 뽑지 않는다
    $('btn-draw').disabled = !can; $('btn-draw-all').disabled = !can;
    $('btn-draw-all').textContent = Col.full(A.run) && Col.canDraw(A.run) ? '대기석까지 가득' : '모두 뽑기';
  }
  function hearts(box) {
    box.innerHTML = '';
    for (var i = 0; i < A.B.diff.life; i++) box.appendChild(img(G.Pixel.toURL('기타/생명' + (i < A.B.life ? '' : '빈'), G.MiscArt.heart(i < A.B.life))));
  }
  function refreshPrep() {
    refreshCoins(); hearts($('prep-hearts'));
    // 출전 칸
    var lu = $('lineup'); lu.innerHTML = ''; lu.style.gridTemplateColumns = 'repeat(' + A.run.slots.length + ', 1fr)';
    A.run.slots.forEach(function (uid, i) {
      var u = uid && A.run.roster.filter(function (x) { return x.uid === uid; })[0];
      var m = el('div', 'mini' + (A.selectedSlot === i ? ' sel' : '') + (u ? '' : ' empty'));
      if (u) {
        var ch = G.charById(u.id), gi = G.gradeInfo(ch.grade);
        m.style.borderColor = gi.dark;
        m.appendChild(el('span', 'job', C.jobs[ch.job].name));
        m.appendChild(img(charURL(u.id)));
        // 2026-11-26 출전 칸에 짧은 능력 (유니크부터는 자동 능력, ✨)
        var PV = C.passives, ord = ['normal', 'epic', 'unique', 'legendary', 'hidden'], pv = PV && PV[ch.job] && ord.indexOf(ch.grade) >= ord.indexOf(PV.minGrade) ? PV[ch.job] : null;
        var lg = pv && ch.grade !== 'unique' && PV.legend && PV.legend[ch.job];   // 레전더리·히든은 더 센 능력을 보여 준다
        m.appendChild(el('div', 'ability' + (lg ? ' legend' : pv ? ' passive' : ''), lg ? '🌟' + lg.short : pv ? '✨' + pv.short : C.jobs[ch.job].short));
        var gn = el('div', 'gname', gi.name); gn.style.background = gi.color; m.appendChild(gn);
      } else m.appendChild(el('div', 'empty-slot', '빈 칸'));
      m.onclick = function () { tapSlot(i); };
      lu.appendChild(m);
    });
    var gc = $('grade-counts'), cnt = Col.countByGrade(A.run); gc.innerHTML = '';
    C.grades.forEach(function (g) { if (!cnt[g.key]) return; var c = el('span', 'gc', g.name + ' ' + cnt[g.key]); c.style.background = g.color; gc.appendChild(c); });
    var bn = Col.benchCount(A.run); if (bn) { var bc = el('span', 'gc bench', '대기 ' + bn + '/' + C.bench); gc.appendChild(bc); }   // 대기석 (합성 재료)
    // 전투 시작 버튼
    var q = A.quiz, ready = q && quizFinished(q), fight = $('btn-fight');
    var units = A.run.slots.filter(Boolean).length;
    if (q.kind === 'final') { fight.textContent = '결과 보기'; fight.disabled = !ready; }
    else if (A.tower) { fight.textContent = A.wavesDone === 0 ? '탑 오르기!' : '다음 층!'; fight.disabled = !ready || units === 0; }
    else { fight.textContent = q.kind === 'boss' ? '보스와 싸우기!' : q.kind === 'retry' ? '다시 싸우기!' : A.wavesDone === 0 ? '전투 시작!' : '다음 웨이브!'; fight.disabled = !ready || units === 0; }
    // 뽑을 코인이 있으면 「모두 뽑기」가, 다 뽑았으면 「전투 시작」이 움직이며 반짝인다 (자연스럽게 누르게)
    var canDraw = Col.canDraw(A.run) && !Col.full(A.run);
    $('btn-draw-all').classList.toggle('pulse', !!ready && canDraw && q.kind !== 'final');
    fight.classList.toggle('pulse', !!ready && !fight.disabled && (!canDraw || q.kind === 'final'));
    if (ready && q.kind === 'prep') guide('draw', '.draw-panel', '친구를 뽑아요', '코인 30개로 친구 1명이 와요. 「모두 뽑기」를 누르면 코인을 다 써서 한꺼번에 뽑아요.');
    var info = $('next-info');
    if (!ready) info.textContent = q.kind === 'final' ? '정답 ' + minCorrect() + '개를 채우면 끝나요' : '문제를 먼저 풀어요';
    else if (!units) info.textContent = '뽑기로 친구를 데려와요!';
    else if (q.kind === 'boss' || q.kind === 'retry') info.innerHTML = '다음: <b class="boss">' + C.boss[A.B.bossType].name + '</b> · ' + curSpeed().name;
    else if (A.tower) { var nf = A.wavesDone + 1; info.innerHTML = '다음: <b>' + nf + '층</b>' + (nf % C.tower.miniEvery === 0 ? ' <b class="boss">작은 보스</b>' : '') + ' · ' + curSpeed().name; }
    else info.innerHTML = '다음: <b>웨이브 ' + (A.wavesDone + 1) + '</b> · ' + curSpeed().name;
  }
  function tapSlot(i) {
    if (A.selectedSlot < 0) { A.selectedSlot = i; }
    else if (A.selectedSlot === i) { A.selectedSlot = -1; }
    else { Col.swapSlots(A.run, A.selectedSlot, i); A.selectedSlot = -1; }
    refreshPrep();
  }

  /* ───────── 뽑기 (5장) ───────── */
  function cardNode(id, isNew) {
    var ch = G.charById(id), gi = G.gradeInfo(ch.grade), c = el('div', 'draw-card');
    c.style.borderColor = gi.dark; c.style.background = gi.light;
    if (isNew) c.appendChild(el('div', 'new-badge', '처음!'));
    c.appendChild(img(charURL(id), '', 96, 96));
    var g = el('div', 'dc-grade', gi.name); g.style.background = gi.color; c.appendChild(g);
    c.appendChild(el('div', 'dc-name', ch.name));
    c.appendChild(el('div', 'dc-job', C.jobs[ch.job].name + ' · ' + C.jobs[ch.job].style));
    var PV = C.passives, order = ['normal', 'epic', 'unique', 'legendary', 'hidden'];
    if (PV && PV[ch.job] && order.indexOf(ch.grade) >= order.indexOf(PV.minGrade)) c.appendChild(el('div', 'dc-passive', '✨ ' + PV[ch.job].name + ': ' + PV[ch.job].desc));   // 자동 능력
    var LG = PV && PV.legend && ch.grade !== 'unique' && order.indexOf(ch.grade) >= order.indexOf(PV.minGrade) && PV.legend[ch.job];
    if (LG) c.appendChild(el('div', 'dc-passive legend', '🌟 ' + LG.name + ': ' + LG.desc));   // 레전더리 능력
    return c;
  }
  function afterDraw(results) {
    var merges = (results.merges || []).concat(Col.autoMerge(A.run, A.book));
    var rewards = Ch.checkBook(A.book, A.progress);
    saveAll();
    if (rewards.length) setTimeout(function () { toast(rewards.map(function (x) { return x.text; }).join(' / ') + '!', 3500); }, 300);
    var d = el('div', 'dialog draw-dialog');
    d.appendChild(el('h2', '', results.length > 1 ? results.length + '명이 왔어요!' : '새 친구!'));
    // 2026-11-26 합성이 있으면 카드를 작게 (합성 그림과 「좋아요」가 화면 밖으로 밀려났다)
    var row = el('div', 'draw-row' + (results.length > 8 ? ' tiny' : results.length > 4 || (results.merges || []).length || merges.length ? ' many' : ''));
    results.forEach(function (r) { row.appendChild(cardNode(r.charId, r.isNew)); });
    d.appendChild(row);
    if (merges.length) d.appendChild(mergeAnim(merges));
    if (results.full) d.appendChild(el('div', 'full-note', '출전 칸과 대기석이 가득 찼어요! 남은 코인은 다음에 써요.'));
    var ok = el('button', 'btn big green', '좋아요'); ok.onclick = function () {
      closeOverlay(); refreshPrep();
      guide('lineup', '.roster-panel', '출전 칸', '뽑은 친구는 여기에 서서 싸워요. 같은 등급 친구가 모이면 저절로 합쳐져서 더 센 친구가 돼요. 두 칸을 차례로 누르면 자리를 바꿔요.');
      guide('fight', '#btn-fight', '전투 시작!', '준비가 끝나면 이 버튼을 눌러요. 전투가 시작돼요!');
    };
    d.appendChild(ok); overlay(d);
    // 「좋아요」는 늘 창 아래에 보이고, 나머지가 넘치면 그 칸만 굴린다
    var body = el('div', 'draw-body'); Array.prototype.slice.call(d.childNodes).forEach(function (n) { if (n !== ok) body.appendChild(n); }); d.insertBefore(body, ok);
    refreshPrep();
  }
  function doDraw() {
    if (Col.full(A.run)) { toast('출전 칸과 대기석이 가득 찼어요!'); return; }
    var r = Col.draw(A.run, A.book); if (r) afterDraw([r]);
  }
  /* 합성 애니메이션: 재료 친구들이 가운데로 모여 번쩍! 한 다음 새 친구가 튀어나온다. 합성이 여럿이면 차례로 */
  function mergeAnim(merges) {
    var box = el('div', 'merge-note');
    box.appendChild(el('div', 'merge-title', '합성!'));
    var list = el('div', 'merge-list');
    merges.slice(0, 2).forEach(function (m, k) {
      var delay = k * 1.1, row = el('div', 'merge-row');
      var mats = el('div', 'merge-mats');
      m.mats.forEach(function (id, i) {
        var im = img(charURL(id), 'merge-mat', 44, 44), mid = (m.mats.length - 1) / 2;
        im.style.setProperty('--dx', ((mid - i) * 48) + 'px'); im.style.animationDelay = (delay + 0.25) + 's';
        mats.appendChild(im);
      });
      row.appendChild(mats);
      var burst = el('div', 'merge-burst'); burst.style.animationDelay = (delay + 0.85) + 's'; row.appendChild(burst);
      var res = cardNode(m.result, m.isNew); res.classList.add('merge-res'); res.style.animationDelay = (delay + 0.95) + 's';
      row.appendChild(res);
      list.appendChild(row);
    });
    if (merges.length > 2) list.appendChild(el('div', 'merge-more', '그리고 ' + (merges.length - 2) + '번 더 합성했어요!'));
    box.appendChild(list);
    return box;
  }
  function doDrawAll() { var r = Col.drawAll(A.run, A.book); if (r.length) afterDraw(r); }

  /* ───────── 전투 ───────── */
  function startBattle() {
    if (A.quiz.kind === 'final') { finishStage(true); return; }
    if (A.quiz.kind === 'boss' || A.quiz.kind === 'retry') { startBossFight(A.quiz.kind === 'retry'); return; }
    A.selectedSlot = -1;
    if (A.tower) { startTowerFloor(); return; }
    Bt.setLineup(A.B, Col.lineup(A.run));
    var sp = curSpeed();
    Bt.startWave(A.B, sp, A.wavesDone >= C.battleTime.minWaves);
    A.mode = 'battle'; A.paused = false; show('scr-battle'); refreshSpeed(); cancelTarget(); refreshSkill(); fieldReady();
    $('bt-wave').textContent = '웨이브 ' + A.B.wave;
    hearts($('bt-hearts')); refreshCoins();
    banner('웨이브 ' + A.B.wave + (A.B.turbo ? ' · 터보!' : ''));
    battleGuides();
  }
  function battleGuides() {
    guide('path', { x: 50, y: 80, w: 860, h: 410 }, '적이 와요!', '적은 길을 따라 빙글빙글 돌아요. 친구들은 저절로 공격해요. 싸우는 중에도 친구를 끌어서 다른 칸에 놓으면 자리를 바꿔요.');
    guide('hearts', '#bt-hearts', '하트를 지켜요', '적이 길을 한 바퀴 다 돌 때마다 하트가 하나 줄어요. 적은 쓰러질 때까지 계속 돌아요. 하트가 다 없어지면 져요!');
    guide('speed', '#speed-btn', '빠르기와 멈춤', '▶▶ 버튼으로 전투를 빠르게 할 수 있어요. 쉬고 싶으면 옆의 「멈춤」을 눌러요.');
  }
  /* 도전의 탑 한 층 (10-2). 5층마다 배경(길과 적)이 바뀐다: 생명·영웅 힘은 이어 간다 */
  function startTowerFloor() {
    var floor = A.wavesDone + 1, th = Ch.towerTheme(floor), old = A.B;
    if (th !== old.stageNo) {
      A.B = Bt.create(th, Col.lineup(A.run), A.heroId, A.diffKey, { extraSlot: A.run.slots.length > C.slots, tower: true });
      A.B.life = old.life; A.B.lifeLost = old.lifeLost; A.B.hero.cd = old.hero.cd;
      G.Render.drawBackground(th, A.B);
    }
    Bt.setLineup(A.B, Col.lineup(A.run));
    Bt.startTowerFloor(A.B, floor, curSpeed());
    A.tower.floor = floor;
    A.mode = 'battle'; A.paused = false; show('scr-battle'); refreshSpeed(); cancelTarget(); refreshSkill(); fieldReady();
    $('bt-wave').textContent = floor + '층';
    hearts($('bt-hearts')); refreshCoins();
    banner(floor + '층' + (floor % C.tower.miniEvery === 0 ? ' · 작은 보스!' : th !== old.stageNo ? ' · ' + G.stageByNo(th).name : ''));
    battleGuides();
  }
  function banner(text) {
    var b = $('wave-banner'); b.textContent = text; b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(banner.tm); banner.tm = setTimeout(function () { b.classList.add('hidden'); }, 1400);
  }
  function onEvents(evs) {
    evs.forEach(function (e) {
      if (e.type === 'escape') { hearts($('bt-hearts')); $('game').classList.remove('shake'); void $('game').offsetWidth; $('game').classList.add('shake'); }
      if (e.type === 'turboCoin') { A.run.coins += e.coin; floatText(e.x, e.y - 50, '+' + e.coin, 'coin'); refreshCoins(); }
      if (e.type === 'gimmick') banner(e.text);
      if (e.type === 'lose') { A.mode = 'over'; setTimeout(function () { finishStage(false); }, 600); }
      if (e.type === 'heroHit') banner('영웅이 맞아서 잠깐 기절했어요!');
      if (e.type === 'bossDown') {
        A.mode = 'between'; hideBossUI(); clearBubbles();
        banner(C.boss[A.B.bossType].name + '를 물리쳤어요!');
        setTimeout(function () { if (A.run.correct < minCorrect()) goPrep('final'); else finishStage(true); }, 1500);
      }
      if (e.type === 'waveEnd' && A.tower) {
        A.wavesDone++; clearBubbles(); A.mode = 'between';
        banner(A.wavesDone + '층 성공!');
        setTimeout(function () { goPrep('wave'); }, 900);
        return;
      }
      if (e.type === 'waveEnd' && A.B.bossType && !A.B.bossPhase) {   // 보스 스테이지: 부하 웨이브 2개 → 보스
        A.wavesDone++; clearBubbles(); A.mode = 'between';
        var toBoss = A.wavesDone >= (TQ() ? TQ().minionWaves : C.boss.minionWaves);
        banner(toBoss ? '보스가 다가와요!' : '웨이브 ' + A.wavesDone + ' 성공!');
        setTimeout(function () { goPrep(toBoss ? 'boss' : 'wave'); }, 1000);
        return;
      }
      if (e.type === 'waveEnd' && !A.B.bossType) {
        A.wavesDone++;
        clearBubbles();
        if (TQ() ? A.wavesDone < TQ().waves : Bt.wantsAnotherWave(A.wavesDone, A.B.plannedReal, curSpeed())) { banner('웨이브 ' + A.wavesDone + ' 성공!'); A.mode = 'between'; setTimeout(function () { goPrep('wave'); }, 900); }
        else {
          A.mode = 'between';
          banner('모든 웨이브 성공!');
          setTimeout(function () { if (A.run.correct < minCorrect()) goPrep('final'); else finishStage(true); }, 1100);
        }
      }
    });
  }

  /* ───────── 보스전 화면 (8장) ─────────
   * 위: 보스 체력 막대 / 왼쪽 아래: 보스 문제 칸 (전투를 멈추지 않는다) / 오른쪽 아래: 문어 다리 (문어 대장)
   * 화면을 누르거나 끌면 영웅이 그쪽으로 움직인다 */
  function startBossFight(retry) {
    var B = A.B;
    Bt.setLineup(B, Col.lineup(A.run));
    if (retry) {   // 다시 도전: 생명을 채우고 보스 체력은 절반부터
      B.life = B.diff.life; B.boss.hp = Math.min(B.boss.hp, B.boss.maxHp * 0.5); B.boss.s = 0; B.boss.stunT = 0;
      B.enemies = [B.boss]; B.hazards = []; B.bossPhase = true; B.pips = 0; B.combo = 0;
      B.hero.x = B.heroPos.x; B.hero.y = B.heroPos.y; B.hero.tx = B.hero.x; B.hero.ty = B.hero.y; B.hero.stunT = 0;
      A.retried = true;
    } else Bt.startBoss(B);
    A.mode = 'battle'; A.paused = false; show('scr-battle'); refreshSpeed(); cancelTarget(); clearBubbles(); fieldReady();
    $('bt-wave').textContent = '보스전'; hearts($('bt-hearts')); refreshCoins();
    $('boss-ui').classList.remove('hidden'); $('drag-layer').classList.remove('hidden');
    $('boss-name').textContent = C.boss[B.bossType].name;
    $('legs-panel').classList.toggle('hidden', B.bossType !== 'octopus');
    A.legSel = -1; A.legSig = '';
    newBossProblem();
    banner(C.boss[B.bossType].name + ' 등장!');
    guide('bossQuiz', '#boss-quiz', '보스 문제', '보스전에서는 문제를 푸는 동안에도 전투가 이어져요. 맞힐 때마다 필살기 칸이 차고, 3칸이 다 차면 영웅 능력을 쓸 수 있어요.');
    if (B.bossType === 'octopus') guide('legs', '#legs-panel', '문어 다리 자르기', '더해서 10이 되는 다리 두 개를 눌러요. 다리를 다 자르면 문어가 기절해서 공격이 훨씬 잘 들어가요!');
    else guide('move', { x: 50, y: 80, w: 860, h: 410 }, '영웅 움직이기', '화면을 누르거나 끌면 영웅이 그쪽으로 걸어가요. 빨간 원이 생기면 얼른 피해요!');
    toast(B.bossType === 'scorpion' ? '영웅을 끌어서 빨간 원을 피해요!' : B.bossType === 'octopus' ? '다리 숫자 두 개로 10을 만들면 싹둑!' : '문제를 맞혀 필살기를 모아요!', 3500);
  }
  function hideBossUI() { $('boss-ui').classList.add('hidden'); if (A.B) A.B.drag = null; }
  function newBossProblem() {
    var st = G.stageByNo(A.stageNo), p = G.MathGen.make(st.types), box = $('boss-quiz');
    A.bq = { p: p, lock: false, timeLeft: A.B.bossType === 'scorpion' ? C.boss.scorpion.quickSec : 0 };
    box.innerHTML = '';
    var head = el('div', 'bq-head');
    head.appendChild(el('span', '', '보스 문제'));
    if (A.B.bossType === 'demon' && A.B.demonPhase === 3) head.appendChild(el('span', 'bq-combo', '연속 정답 ' + A.B.combo + ' / ' + C.boss.demon.comboNeed));
    box.appendChild(head);
    box.appendChild(el('div', 'bq-text', p.text.replace('□', '□') + (p.op === 'blank+' ? '' : ' = ?')));
    if (A.bq.timeLeft) { var bar = el('div', 'bq-timer'); bar.appendChild(el('i', '')); box.appendChild(bar); }
    var row = el('div', 'bq-choices');
    p.choices.forEach(function (c) {
      var b = el('button', 'choice small', String(c));
      b.onclick = function () {
        if (A.bq.lock || A.mode !== 'battle') return;
        A.bq.lock = true;
        var ok = c === p.answer, evs = [];
        Col.answer(A.run, ok, p.type);
        var r = Bt.bossAnswer(A.B, ok, evs);
        b.classList.add(ok ? 'right' : 'wrong');
        if (ok) { var rr = b.getBoundingClientRect(), gr = $('game').getBoundingClientRect(); floatText((rr.left - gr.left) / A.scale + 10, (rr.top - gr.top) / A.scale - 20, '필살기 +1', 'coin'); }
        refreshCoins(); refreshSkill();
        if (r.final) banner('마지막 일격!');
        onEvents(evs);
        setTimeout(function () { if (A.mode === 'battle' && A.B.bossPhase) newBossProblem(); }, ok ? 450 : 900);
      };
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  function renderLegs() {
    var B = A.B, sig = B.legs.map(function (l) { return l.n + (l.cut ? 'x' : ''); }).join(',') + '|' + A.legSel;
    if (sig === A.legSig) return; A.legSig = sig;
    var box = $('legs-panel'); box.innerHTML = '';
    var allCut = B.legs.every(function (l) { return l.cut; });
    box.appendChild(el('div', 'legs-head', allCut ? '다리를 다 잘랐어요! 문어가 기절!' : '더해서 10이 되는 다리 두 개를 눌러요'));
    var row = el('div', 'legs-row');
    B.legs.forEach(function (l, i) {
      var b = el('button', 'leg' + (l.cut ? ' cut' : '') + (A.legSel === i ? ' sel' : ''), l.cut ? '✂' : String(l.n));
      b.onclick = function () {
        if (l.cut || A.mode !== 'battle') return;
        if (A.legSel < 0) { A.legSel = i; renderLegs(); return; }
        if (A.legSel === i) { A.legSel = -1; renderLegs(); return; }
        var ok = Bt.cutLegs(A.B, A.legSel, i);
        Col.answer(A.run, ok, 'A3'); refreshCoins();
        if (ok) { banner('싹둑! ' + B.legs[A.legSel].n + ' + ' + l.n + ' = 10'); if (B.legs.every(function (x) { return x.cut; })) setTimeout(function () { banner('문어 대장 기절! 지금이에요!'); }, 900); }
        else { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); toast(B.legs[A.legSel].n + ' + ' + l.n + ' = ' + (B.legs[A.legSel].n + l.n) + ', 10이 아니에요'); }
        A.legSel = -1; renderLegs();
      };
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  function refreshBossUI(realDt) {
    var B = A.B; if (!B || !B.bossPhase || !B.boss) return;
    $('boss-fill').style.width = Math.max(0, B.boss.hp / B.boss.maxHp * 100) + '%';
    var phase = B.bossType === 'demon' ? ' · ' + B.demonPhase + '단계' : B.boss.stunT > 0 ? ' · 기절!' : '';
    var nm = C.boss[B.bossType].name + phase; if ($('boss-name').textContent !== nm) $('boss-name').textContent = nm;
    if (B.bossType === 'octopus') renderLegs();
    if (A.bq && A.bq.timeLeft && !A.bq.lock) {   // 전갈 왕: 빨리 맞히기
      A.bq.timeLeft -= realDt;
      var bar = document.querySelector('#boss-quiz .bq-timer i'); if (bar) bar.style.width = Math.max(0, A.bq.timeLeft / C.boss.scorpion.quickSec * 100) + '%';
      if (A.bq.timeLeft <= 0) newBossProblem();
    }
    var combo = document.querySelector('#boss-quiz .bq-combo');
    if (B.bossType === 'demon' && B.demonPhase === 3 && !combo && !A.bq.lock) newBossProblem();
  }
  /* 2026-11-26 전투 중 친구 끌어다 놓기 (마우스는 드래그 앤 드롭, 패드는 손가락으로 끌기).
   * 친구를 누른 채 다른 칸에 놓으면 자리를 바꾼다. 친구가 아닌 곳을 누르면 (보스전에서) 영웅이 움직인다 */
  function fieldReady() { $('drag-layer').classList.remove('hidden'); if (A.B) A.B.drag = null; }
  function gamePoint(e) { var r = $('game').getBoundingClientRect(); return { x: (e.clientX - r.left) / A.scale, y: (e.clientY - r.top) / A.scale }; }
  function fieldDown(e) {
    if (!A.B || A.mode !== 'battle' || A.paused) return;
    var q = gamePoint(e), i = Bt.slotAt(A.B, q.x, q.y, 52), u = null;
    A.B.units.forEach(function (x) { if (x.slot === i && !(x.eaten > 0)) u = x; });
    if (u) {
      A.B.drag = { slot: i, id: u.id, x: q.x, y: q.y, over: i };
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault(); return;
    }
    dragHero(e);
  }
  function fieldMove(e) {
    if (A.B && A.B.drag) { var q = gamePoint(e); A.B.drag.x = q.x; A.B.drag.y = q.y; A.B.drag.over = Bt.slotAt(A.B, q.x, q.y, 75); e.preventDefault(); return; }
    dragHero(e);
  }
  function fieldUp() {
    var d = A.B && A.B.drag; if (!d) return;
    A.B.drag = null;
    if (A.mode !== 'battle' || d.over < 0 || d.over === d.slot) return;
    if (Bt.moveUnit(A.B, d.slot, d.over)) { Col.swapSlots(A.run, d.slot, d.over); A.selectedSlot = -1; }
  }
  function dragHero(e) {
    if (!A.B || !A.B.bossPhase || A.mode !== 'battle' || A.paused) return;
    if (e.type === 'pointermove' && !(e.buttons & 1)) return;
    var r = $('game').getBoundingClientRect();
    Bt.moveHero(A.B, (e.clientX - r.left) / A.scale, (e.clientY - r.top) / A.scale);
  }

  /* 전투 중 문제 풍선 (실제 시간 20초마다, 10초 뒤 사라짐) */
  function clearBubbles() { $('bubble-layer').innerHTML = ''; A.bubble = null; }
  function spawnBubble() {
    // 출전 칸을 가리지 않도록 스테이지마다 정한 빈 곳에 띄운다
    var spots = A.B.bubbleSpots, s = spots[Math.floor(Math.random() * spots.length)];
    var b = el('button', 'q-bubble', '?');
    b.style.left = s.x + 'px'; b.style.top = s.y + 'px';
    b.onclick = function () { clearBubbles(); bubbleQuiz(); };
    $('bubble-layer').appendChild(b);
    A.bubble = { node: b, life: C.questionBubbleLife };
    guide('bubble', b, '보너스 문제!', '물음표 풍선을 누르면 보너스 문제가 나와요. 맞히면 코인을 더 받아요. 풍선은 금방 사라지니 얼른 눌러요!');
  }
  function bubbleQuiz() {
    A.paused = true;
    var d = el('div', 'dialog math-dialog'), box = el('div', 'math-panel in-dialog');
    d.appendChild(box);
    var q = newQuiz('bubble'); q.left = 1; A.bubbleQ = q;
    // 밤 놀이공원: 맞히면 조명이 12초(게임 시간) 켜진다
    if (A.B.gimmick === 'dark') q.onRight = function () { Bt.light(A.B, 12); setTimeout(function () { banner('조명 켜짐!'); }, 700); };
    renderQuiz(box, q, function () {
      setTimeout(function () { closeOverlay(); A.paused = false; }, 500);
    });
    overlay(d);
  }

  /* ───────── 멈춤 ───────── */
  function pause() {
    if (A.mode !== 'battle' && A.mode !== 'prep') return;
    if (A.targeting) cancelTarget();
    if (A.B) A.B.drag = null;
    var wasPaused = A.paused; A.paused = true;
    var d = dialog('멈춤', '', [
      { text: '계속하기', cls: 'green', fn: function () { closeOverlay(); A.paused = wasPaused && A.mode !== 'battle'; } },
      { text: A.tower ? '탑 그만 오르기' : '스테이지 나가기', cls: 'red', fn: function () { closeOverlay(); if (A.tower) finishTower(); else goMap(); } }
    ]);
    var mb = el('button', 'btn small ' + (A.settings.music === false ? 'white' : 'sky') + ' pause-music', A.settings.music === false ? '🔇 음악 꺼짐' : '🎵 음악 켜짐');
    mb.onclick = function () { toggleMusic(); mb.textContent = A.settings.music === false ? '🔇 음악 꺼짐' : '🎵 음악 켜짐'; mb.className = 'btn small ' + (A.settings.music === false ? 'white' : 'sky') + ' pause-music'; };
    d.insertBefore(mb, d.querySelector('.btns'));
    if (A.mode === 'battle') {
      var sp = el('div', 'pause-speed');
      sp.appendChild(el('div', 'pause-speed-label', '전투 속도'));
      var row = el('div', 'pause-speed-options');
      C.speeds.forEach(function (s, i) {
        var open = speedOpen(i), b = el('button', 'btn small ' + ((A.settings.speed || 0) === i ? 'yellow' : 'white'), s.name + (open ? '' : ' 🔒'));
        if (!open) b.disabled = true;
        b.onclick = function () { A.settings.speed = i; saveAll(); refreshSpeed(); closeOverlay(); pause(); };
        row.appendChild(b);
      });
      sp.appendChild(row);
      if (A.B && A.B.bossPhase) sp.appendChild(el('div', 'pause-note', '보스와 싸울 때는 1.5배속까지만 돼요.'));
      d.insertBefore(sp, d.querySelector('.btns'));
    }
  }

  /* ───────── 결과 (11장) ───────── */
  // 얻은 보상을 결과 화면에 보여 준다
  function rewardBox(list) {
    var box = el('div', 'reward-box');
    list.forEach(function (x) {
      var row = el('div', 'reward-row');
      if (x.charId) row.appendChild(img(charURL(x.charId), '', 48, 48));
      row.appendChild(el('span', '', x.text)); box.appendChild(row);
    });
    return box;
  }
  /* 2026-11-26 결과 화면: 보상·안내가 많으면 단추가 화면 밖으로 밀려났다.
   * 단추 줄은 칸 아래에 붙이고, 나머지는 위 칸에 넣어 넘치면 먼저 작게(compact), 그래도 넘치면 그 칸만 굴려 본다 */
  function fitResult(p) {
    var body = el('div', 'result-body'), bs = p.querySelector('.result-btns');
    Array.prototype.slice.call(p.childNodes).forEach(function (n) { if (n !== bs) body.appendChild(n); });
    p.insertBefore(body, bs);
    p.classList.remove('compact');
    if (body.scrollHeight > body.clientHeight + 1) p.classList.add('compact');
  }
  /* 도전의 탑 끝 (지거나 그만두면) */
  function finishTower() {
    A.mode = 'result'; clearBubbles(); closeOverlay(); hideBossUI();
    var floor = A.wavesDone, old = (A.progress.tower && A.progress.tower.floor) || 0;
    var got = Ch.record(A.progress, A.book, { towerFloor: floor, speedName: curSpeed().name, diffName: G.difficultyByKey(A.diffKey).name, bestCombo: A.run.bestCombo });
    got = got.concat(Ch.checkBook(A.book, A.progress));
    saveAll(); show('scr-result');
    var p = $('result-panel'); p.innerHTML = '';
    p.appendChild(el('h2', '', floor > 0 ? floor + '층까지 올랐어요!' : '1층부터 다시 도전해요!'));
    p.appendChild(el('div', 'tower-big', floor > old ? '최고 기록!' : '최고 기록 ' + old + '층'));
    var stats = el('div', 'result-stats');
    [['맞힌 문제', A.run.correct + '개'], ['가장 긴 연속 정답', A.run.bestCombo + '개'], ['난이도 · 속도', G.difficultyByKey(A.diffKey).name + ' · ' + curSpeed().name],
      ['30층까지', floor >= C.tower.goal ? '성공!' : (C.tower.goal - floor) + '층 남음']].forEach(function (r) {
      var row = el('div', 'rs-row'); row.appendChild(el('span', '', r[0])); row.appendChild(el('b', '', r[1])); stats.appendChild(row);
    });
    p.appendChild(stats);
    if (got.length) p.appendChild(rewardBox(got));
    var bs = el('div', 'result-btns');
    var again = el('button', 'btn big orange', '다시 오르기'); again.onclick = function () { startStage(G.TOWER_NO, A.heroId, A.diffKey); };
    var back = el('button', 'btn big green', '도전 영역'); back.onclick = function () { G.Plays.open(); };
    bs.appendChild(again); bs.appendChild(back); p.appendChild(bs);
    fitResult(p);
  }
  function finishStage(win) {
    if (A.tower) { finishTower(); return; }
    A.mode = 'result'; clearBubbles(); closeOverlay();
    var run = A.run, total = run.correct + run.wrong, acc = total ? run.correct / total : 0;
    var stars = win ? 1 + (A.B.lifeLost === 0 ? 1 : 0) + (acc >= 0.8 ? 1 : 0) : 0;
    var newlyOpen = [], tutWin = win && A.tutorial;
    if (tutWin && !A.progress.tutorialDone) { A.progress.tutorialDone = true; newlyOpen.push('본 게임'); }
    if (win && !A.tutorial) {   // 튜토리얼은 연습이라 별·기록에 넣지 않는다
      A.progress.team = Col.saveTeam(run);   // 친구 이어 가기: 다음 판에 함께 간다
      var before = C.speeds.map(function (s, i) { return speedOpen(i); });
      A.progress.stars[A.stageNo] = Math.max(A.progress.stars[A.stageNo] || 0, stars);
      C.speeds.forEach(function (s, i) { if (!before[i] && speedOpen(i)) newlyOpen.push(s.name); });
      var di = C.difficulties.map(function (d) { return d.key; }).indexOf(A.diffKey);
      A.progress.diffBest = A.progress.diffBest || {};
      A.progress.diffBest[A.stageNo] = Math.max(A.progress.diffBest[A.stageNo] === undefined ? -1 : A.progress.diffBest[A.stageNo], di);
      if (G.stageByNo(A.stageNo).boss === 'demon' && di >= C.difficulties.map(function (d) { return d.key; }).indexOf('veryhard') && !A.progress.disasterOpen) { A.progress.disasterOpen = true; newlyOpen.push('숨은 난이도 「재앙」'); }
      var key = A.stageNo + '_' + curSpeed().name, best = A.progress.best[key];
      if (!best || run.correct > best.correct) A.progress.best[key] = { correct: run.correct, life: A.B.life };
    }
    var got = Ch.record(A.progress, A.book, { stageNo: A.stageNo, win: win, bossType: win ? A.B.bossType : null, speedV: curSpeed().v,
      lifeLost: A.B.lifeLost, heroHits: A.B.heroHits, bestCombo: run.bestCombo }).concat(Ch.checkBook(A.book, A.progress));
    if (win && A.stageNo === C.challengeUnlock && !A.progress.challengeSeen) { A.progress.challengeSeen = true; got.push({ text: '도전 영역이 열렸어요! 처음 화면에서 들어가요.' }); }
    saveAll();
    show('scr-result');
    var p = $('result-panel'); p.innerHTML = '';
    p.appendChild(el('h2', '', tutWin ? '튜토리얼 끝! 잘했어요' : win ? G.stageByNo(A.stageNo).name + ' 성공!' : '아쉬워요! 다시 해 봐요'));
    var st = el('div', 'result-stars');
    for (var i = 0; i < 3; i++) st.appendChild(el('span', i < stars ? 'on' : '', '★'));
    p.appendChild(st);
    var why = el('div', 'result-why');
    [['깨기', win], ['생명 지키기', win && A.B.lifeLost === 0], ['정답률 80%', win && acc >= 0.8]].forEach(function (r) {
      why.appendChild(el('span', r[1] ? 'ok' : '', (r[1] ? '✔ ' : '· ') + r[0]));
    });
    p.appendChild(why);
    var secs = Math.round((performance.now() - A.stageStart) / 1000);
    var stats = el('div', 'result-stats');
    [['맞힌 문제', run.correct + '개'], ['정답률', Math.round(acc * 100) + '%'], ['가장 긴 연속 정답', run.bestCombo + '개'],
      ['난이도 · 속도', G.difficultyByKey(A.diffKey).name + ' · ' + curSpeed().name], ['걸린 시간', Math.floor(secs / 60) + '분 ' + (secs % 60) + '초']].forEach(function (r) {
      var row = el('div', 'rs-row'); row.appendChild(el('span', '', r[0])); row.appendChild(el('b', '', r[1])); stats.appendChild(row);
    });
    p.appendChild(stats);
    if (newlyOpen.length) p.appendChild(el('div', 'legend-open', newlyOpen.join(', ') + '이 열렸어요!'));
    if (got.length) p.appendChild(rewardBox(got));
    if (win && !A.tutorial) p.appendChild(el('div', 'retry-note', '뽑은 친구들이 다음 판에도 함께 가요!'));
    if (win) guide('result', '#result-panel', '튜토리얼 끝!', '이제 진짜 모험이에요! 「본 게임 시작!」을 누르고 난이도를 골라요. 별 1개: 깨기, 별 2개: 하트 지키기, 별 3개: 정답 80% 넘기.');
    var bs = el('div', 'result-btns');
    /* 2026-11-26 졌을 때 이어 하는 단추는 「강화하기」(사용자 요청, 전: 보스 다시 도전).
     * 보스에게 지면 보스 체력 절반부터, 웨이브에서 지면 그 웨이브부터 다시. 하트를 채우고 문제를 풀어 더 뽑은 뒤 이어 간다 */
    if (!win && !A.tutorial) {
      var cb = el('button', 'btn big purple pulse', '강화하기');
      cb.onclick = A.B.bossPhase ? function () { A.B.life = A.B.diff.life; goPrep('retry'); $('prep-wave').textContent = '강화하기'; }
        : function () { Bt.rewindWave(A.B); A.retried = true; goPrep('wave'); $('prep-wave').textContent = '강화하기'; };
      bs.appendChild(cb);
      p.appendChild(el('div', 'retry-note', A.B.bossPhase ? '강화하기: 친구를 더 뽑고 보스 체력 절반부터 다시 싸워요' : '강화하기: 친구를 더 뽑고 이 웨이브부터 다시 싸워요'));
    }
    var again = el('button', 'btn big orange', '다시 하기'); again.onclick = function () { startStage(A.stageNo, A.heroId, A.diffKey); };
    var map = el('button', 'btn big ' + (win ? 'sky' : 'green'), '섬 지도'); map.onclick = goMap;
    bs.appendChild(again); bs.appendChild(map);
    var nx = win && !tutWin ? nextInIsland(A.stageNo) : null;   // 섬 안의 다음 스테이지로 바로 이어 간다
    if (tutWin) {   // 튜토리얼이 끝나면 본 게임: 덧뺄셈 (1) 섬을 진짜 난이도로 처음부터
      var real = el('button', 'btn big green pulse', '본 게임 시작! ▶');
      real.onclick = function () { A.settings.diff = C.defaultDifficulty; A.settings.diffChosen = true; saveAll(); A.island = 1; goDiffSelect(islandStart(1)); };
      bs.appendChild(real);
    } else if (nx) { var go = el('button', 'btn big green pulse', '다음: ' + nx.name + ' ▶'); go.onclick = function () { startStage(nx.no, A.heroId, A.diffKey); }; bs.appendChild(go); }
    else if (win) p.appendChild(el('div', 'legend-open', ISLAND_NAME[G.stageByNo(A.stageNo).unit] + ' 섬을 모두 깼어요!' + (G.stageByNo(A.stageNo).unit < 3 ? ' 다음 섬이 열렸어요.' : '')));
    p.appendChild(bs);
    fitResult(p);
  }

  /* ───────── 튜토리얼 안내 창 ─────────
   * 튜토리얼 난이도에서만 나온다. 가리키는 곳만 밝게 두고 나머지는 어둡게 덮는다.
   * 안내가 떠 있는 동안 전투는 멈추고, 「알겠어요!」를 누르면 다음 안내 또는 전투로 돌아간다.
   * target: 선택자 / 요소 / { x, y, w, h } (게임 좌표) */
  var GQ = [];
  function guide(key, target, title, text) {
    if (!A.tutorial || A.tutSeen[key]) return;
    A.tutSeen[key] = true;
    GQ.push({ target: target, title: title, text: text });
    if (GQ.length === 1) showGuide();
  }
  function rectOf(t) {
    if (!t) return null;
    if (t.x !== undefined) return t;
    var n = typeof t === 'string' ? document.querySelector(t) : t;
    if (!n || !n.offsetParent) return null;
    var r = n.getBoundingClientRect(), gr = $('game').getBoundingClientRect();
    return { x: (r.left - gr.left) / A.scale, y: (r.top - gr.top) / A.scale, w: r.width / A.scale, h: r.height / A.scale };
  }
  function showGuide() {
    var g = GQ[0], layer = $('guide'); if (!g) return;
    if (!A.guideOn) A.guideWasPaused = A.paused;
    A.guideOn = true; A.paused = true;
    layer.innerHTML = ''; layer.classList.remove('hidden');
    var r = rectOf(g.target), hole = el('div', 'g-hole' + (r ? '' : ' none'));
    if (r) { hole.style.left = (r.x - 8) + 'px'; hole.style.top = (r.y - 8) + 'px'; hole.style.width = (r.w + 16) + 'px'; hole.style.height = (r.h + 16) + 'px'; }
    layer.appendChild(hole);
    var card = el('div', 'g-card');
    var face = img(charURL(A.heroId || A.settings.hero || 'mage'), 'g-face', 72, 72); card.appendChild(face);
    var body = el('div', 'g-body');
    body.appendChild(el('h3', '', g.title)); body.appendChild(el('p', '', g.text));
    var ok = el('button', 'btn small green', '알겠어요!');
    ok.onclick = function (e) {
      e.stopPropagation(); GQ.shift();
      if (GQ.length) { showGuide(); return; }
      layer.classList.add('hidden'); layer.innerHTML = ''; A.guideOn = false; A.paused = A.guideWasPaused;
    };
    body.appendChild(ok); card.appendChild(body);
    layer.appendChild(card);
    // 가리키는 곳 아래(공간이 없으면 위, 큰 곳이면 가운데)에 안내 카드
    var cw = 460, ch = card.offsetHeight || 150, cx, cy;
    if (!r || r.h > 300) { cx = 480 - cw / 2; cy = 270 - ch / 2; }
    else {
      cx = Math.max(12, Math.min(960 - cw - 12, r.x + r.w / 2 - cw / 2));
      var below = 530 - (r.y + r.h), above = r.y - 10;
      if (below >= ch + 18) cy = r.y + r.h + 18;
      else if (above >= ch + 18) cy = r.y - ch - 18;
      else cy = below >= above ? 530 - ch : 10;   // 둘 다 모자라면 더 넓은 쪽 끝에 붙인다
    }
    card.style.left = cx + 'px'; card.style.top = cy + 'px';
  }

  /* ───────── 도감 (6-3) ───────── */
  function openBook(from) {
    A.bookFrom = from || 'title'; A.mode = 'book'; show('scr-book');
    var found = Ch.bookCount(A.book);
    Ch.checkBook(A.book, A.progress); saveAll();
    var sum = $('book-sum'); sum.innerHTML = '';
    sum.appendChild(el('b', '', found + ' / ' + G.CHARACTERS.length));
    C.bookRewards.forEach(function (r) {
      var has = A.progress.rewards && A.progress.rewards[r.key];
      var chip = el('span', 'book-reward' + (has ? ' got' : ''), (has ? '✔ ' : '') + r.need + '종 · ' + r.text); chip.title = r.desc; sum.appendChild(chip);
    });
    $('scr-book').classList.toggle('gold', !!(A.progress.rewards && A.progress.rewards.gold));
    $('scr-book').classList.toggle('rainbow', !!A.progress.rainbow);
    var grid = $('book-grid'); grid.innerHTML = '';
    C.grades.forEach(function (g) {
      var list = G.charsOfGrade(g.key);
      var head = el('div', 'book-grade', g.name + ' ' + list.filter(function (c) { return A.book.found[c.id]; }).length + ' / ' + list.length);
      head.style.background = g.color; grid.appendChild(head);
      list.forEach(function (ch) {
        var has = A.book.found[ch.id], c = el('button', 'book-cell' + (has ? '' : ' unknown'));
        c.style.borderColor = g.dark;
        c.appendChild(img(has ? charURL(ch.id) : shadowURL(ch.id), '', 72, 72));
        c.appendChild(el('div', 'bc-name', has ? ch.name : '?'));
        c.onclick = function () {
          if (has) dialog(ch.name, g.name + ' · ' + C.jobs[ch.job].name + ' — ' + ch.desc, [{ text: '닫기', cls: 'sky', fn: closeOverlay }]);
          else dialog('아직 못 만났어요', ch.hint ? '힌트: ' + ch.hint : '뽑기나 합성으로 만날 수 있어요.', [{ text: '닫기', cls: 'sky', fn: closeOverlay }]);
        };
        grid.appendChild(c);
      });
    });
  }

  /* ───────── 매 장면 ───────── */
  function frame(now) {
    requestAnimationFrame(frame);
    var realDt = Math.min(0.1, ((now - (A.last || now)) / 1000)); A.last = now;
    update(realDt);
  }
  // realDt: 실제로 흐른 시간(초). 시험할 때는 _test.tick 으로 직접 흘려 보낸다
  function update(realDt) {
    A.t += realDt;
    if (!A.B) return;
    if (A.mode === 'battle' && !A.paused) {
      A.realBattle += realDt;
      var sp = curSpeed(), left = realDt * sp.v;
      while (left > 0 && A.mode === 'battle') { var d = Math.min(left, 1 / 60); left -= d; onEvents(Bt.step(A.B, d)); }
      // 문제 풍선
      // 밤 놀이공원은 조명을 켤 기회를 자주 준다 (12초마다)
      var every = A.B.gimmick === 'dark' ? 12 : C.questionBubbleSec;
      if (A.B.bossPhase) refreshBossUI(realDt);   // 보스전에는 문제 풍선 대신 보스 문제 칸
      else if (A.bubble) { A.bubble.life -= realDt; if (A.bubble.life <= 0) clearBubbles(); }
      else { A.bubbleTimer += realDt; if (A.bubbleTimer >= every) { A.bubbleTimer = 0; spawnBubble(); } }
      refreshSkill();
    }
    if (A.targeting && (A.mode !== 'battle' || !Bt.skillReady(A.B))) cancelTarget();   // 웨이브가 끝나거나 기절하면 고르기를 그만둔다
    if (A.mode === 'battle' || A.mode === 'between' || A.mode === 'over') G.Render.frame(A.B, A.t);
    else if (A.mode === 'prep') { G.Render.clear(); G.Render.drawUnits(A.B, Col.lineup(A.run), A.heroId, A.t, A.selectedSlot); }
    else G.Render.clear();
  }

  function fit() {
    var s = Math.min((window.innerWidth - 16) / 960, (window.innerHeight - 16) / 540);
    A.scale = s; $('game').style.transform = 'scale(' + s + ')';
  }

  function init() {
    try { localStorage.setItem('냠냠2_시험', '1'); localStorage.removeItem('냠냠2_시험'); } catch (e) { $('save-note').classList.remove('hidden'); }
    A.book = load('냠냠2_도감', null) || Col.newBook();
    A.progress = Object.assign({ stars: {}, best: {} }, load('냠냠2_진행', {}));
    A.settings = Object.assign({ speed: 0, diff: C.defaultDifficulty }, load('냠냠2_설정', {}));
    if (A.progress.diffVer !== 2) {
      Object.keys(A.progress.diffBest || {}).forEach(function (k) { if (A.progress.diffBest[k] >= 0) A.progress.diffBest[k]++; });
      A.progress.diffVer = 2; saveAll();
    }
    A.tutSeen = {};
    G.Render.init(); fit(); window.addEventListener('resize', fit);

    $('chest-img').src = G.Pixel.toURL('기타/뽑기상자', G.MiscArt.chest());
    Array.prototype.forEach.call(document.querySelectorAll('.coin-ico'), function (i) { i.src = G.Pixel.toURL('기타/코인', G.MiscArt.coin()); });
    $('btn-start').onclick = goMap;
    $('btn-book').onclick = function () { openBook('title'); };
    $('btn-challenge').onclick = function () {
      if (challengeOpen()) G.Plays.open(); else toast('스테이지 ' + C.challengeUnlock + ' 「' + G.stageByNo(C.challengeUnlock).name + '」을 깨면 열려요!');
    };
    $('btn-music').onclick = toggleMusic; refreshMusic();
    document.addEventListener('pointerdown', function () {
      if (G.Music) G.Music.unlock();
      // 2026-11-26 알림 글은 화면을 누르면 바로 사라진다 (뜬 지 0.4초 지나서부터: 알림을 띄운 그 터치로는 안 사라지게)
      if (toast.at && performance.now() - toast.at > 400) $('toast').classList.add('hidden');
    }, true);   // 브라우저는 한 번 눌러야 소리를 낸다
    $('btn-draw').onclick = doDraw;
    $('btn-draw-all').onclick = doDrawAll;
    $('btn-fight').onclick = startBattle;
    $('speed-btn').onclick = cycleSpeed;
    $('skill-btn').onclick = pressSkill;
    $('target-layer').onclick = targetTap;
    $('btn-diff-next').onclick = function () { goHeroSelect(A.pendingStage); };
    $('btn-hero-go').onclick = function (e) { e.stopPropagation(); startStage(A.settings.diff === 'tutorial' ? 1 : A.pendingStage, A.settings.hero, A.settings.diff); };   // 튜토리얼은 언제나 과자 숲(1-1)
    $('drag-layer').addEventListener('pointerdown', fieldDown); $('drag-layer').addEventListener('pointermove', fieldMove);
    $('drag-layer').addEventListener('pointerup', fieldUp); $('drag-layer').addEventListener('pointercancel', fieldUp);
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var act = t.dataset.act;
      if (act === 'pause') pause();
      if (act === 'title') goTitle();
      if (act === 'map') { if (A.mode === 'diff' && A.pendingStage === G.TOWER_NO) G.Plays.open(); else goMap(); }
      if (act === 'diff') goDiffSelect(A.pendingStage);
      if (act === 'book-close') goTitle();
      if (act === 'challenge') G.Plays.open();
    });
    var portrait = window.matchMedia('(orientation: portrait) and (max-width: 600px)'), rotateOff = false;
    function checkRotate() {
      var showIt = portrait.matches && !rotateOff;
      $('rotate-note').classList.toggle('hidden', !showIt);
      if (showIt && A.mode === 'battle' && !A.paused) pause();
    }
    $('rotate-ok').onclick = function () { rotateOff = true; checkRotate(); };
    if (portrait.addEventListener) portrait.addEventListener('change', checkRotate); else portrait.addListener(checkRotate);
    checkRotate();
    document.addEventListener('visibilitychange', function () { if (G.Music) G.Music.pause(document.hidden); if (document.hidden && A.mode === 'battle' && !A.paused) pause(); });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === ' ') && A.mode === 'battle' && !A.guideOn) { e.preventDefault(); if (A.targeting) cancelTarget(); else if (!A.paused) pause(); }
    });

    goTitle();
    requestAnimationFrame(frame);
  }

  // 도전 영역 화면 (js/plays.js) 이 함께 쓰는 것
  var helpers = { $: $, el: el, img: img, charURL: charURL, show: show, toast: toast, dialog: dialog, overlay: overlay, closeOverlay: closeOverlay,
    saveAll: saveAll, goTitle: goTitle, goHeroSelect: goHeroSelect, goDiffSelect: goDiffSelect, floatText: floatText, scale: function () { return A.scale; } };
  return { init: init, state: A, h: helpers, _test: { startStage: startStage, startBattle: startBattle, goPrep: goPrep, finishStage: finishStage, goHeroSelect: goHeroSelect, startBossFight: startBossFight, goDiffSelect: goDiffSelect,
    tick: function (sec) { for (var s = 0; s < sec; s += 0.05) update(0.05); } } };
})();
