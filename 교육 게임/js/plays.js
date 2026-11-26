/* 도전 영역 화면과 만들어요 놀이 3개 (PRD 10장)
 * 문제 만들기는 js/challenge.js, 화면 도구는 G.UI.h 를 함께 쓴다.
 * 놀이로 얻은 코인은 「선물 코인」으로 모아 두었다가 다음 판을 시작할 때 받는다. */
var G = globalThis.G || (globalThis.G = {});

G.Plays = (function () {
  var C = G.CONFIG, Ch = G.Challenge;
  var P = null;   // 지금 하는 놀이 { key, round, score, earned }
  function h() { return G.UI.h; }
  function A() { return G.UI.state; }

  /* ───────── 도전 영역 첫 화면 ───────── */
  function open() {
    var H = h(), S = A(), el = H.el;
    S.mode = 'challenge'; S.B = null; S.tower = null; P = null;
    H.closeOverlay(); H.show('scr-challenge');
    G.Render.clear();
    var gift = S.progress.gift || 0;
    H.$('gift-note').textContent = gift ? '· 모아 둔 선물 코인 ' + gift + ' (판마다 ' + C.giftPerRun + '씩 받아요)' : '';

    // 도전 과제
    var list = H.$('ach-list'); list.innerHTML = '';
    C.achievements.forEach(function (a) {
      var done = Ch.achDone(S.progress, a.key), row = el('div', 'ach' + (done ? ' done' : ''));
      var ico = el('div', 'ach-ico');
      if (a.char) ico.appendChild(H.img(done ? H.charURL(a.char) : G.Pixel.toURL('그림자/' + a.char, G.CharArt.shadow(a.char)), '', 44, 44));
      else ico.textContent = a.gift ? '🪙' : '🌈';
      row.appendChild(ico);
      var txt = el('div', 'ach-txt');
      txt.appendChild(el('b', '', (done ? '✔ ' : '') + a.name));
      txt.appendChild(el('span', '', a.desc));
      var pr = Ch.achProgress(S.progress, a.key);
      txt.appendChild(el('small', '', done ? '받은 것: ' + reward(a) : '보상: ' + reward(a) + (pr ? ' · ' + pr : '')));
      row.appendChild(txt); list.appendChild(row);
    });

    // 도전의 탑
    var tb = H.$('tower-box'); tb.innerHTML = '';
    tb.appendChild(towerPicture(S.progress.tower ? S.progress.tower.floor : 0));
    var t = S.progress.tower;
    tb.appendChild(el('div', 'tower-best', t && t.floor ? '최고 ' + t.floor + '층' : '아직 안 올랐어요'));
    if (t && t.floor) tb.appendChild(el('div', 'tower-sub', (t.diff || '') + ' · ' + (t.speed || '')));
    tb.appendChild(el('div', 'tower-sub', '한 층 = 웨이브 1개 + 문제 3개. 5층마다 작은 보스!'));
    var go = el('button', 'btn big red', '탑 오르기');
    go.onclick = function () { H.goDiffSelect(G.TOWER_NO); };
    tb.appendChild(go);

    // 놀이
    var pl = H.$('play-list'); pl.innerHTML = '';
    C.plays.forEach(function (pc) {
      var b = el('button', 'play-btn p-' + pc.key);
      b.appendChild(el('b', '', pc.name));
      b.appendChild(el('span', '', pc.desc));
      var best = (S.progress.plays || {})[pc.key];
      b.appendChild(el('small', '', pc.unit + ' · ' + pc.rounds + '판' + (best !== undefined ? ' · 최고 ' + best + '/' + pc.rounds : '')));
      b.onclick = function () { startPlay(pc.key); };
      pl.appendChild(b);
    });
  }
  function reward(a) { return a.char ? '히든 「' + G.charById(a.char).name + '」' : a.gift ? '선물 코인 ' + a.gift : '도감 무지개 테'; }
  // 탑 그림: 30층까지 칸을 쌓고 오른 만큼 색칠
  function towerPicture(floor) {
    var box = h().el('div', 'tower-pic');
    for (var i = 6; i >= 1; i--) {
      var lv = h().el('div', 'tw-lv' + (floor >= i * 5 ? ' on' : floor > (i - 1) * 5 ? ' half' : ''), String(i * 5));
      box.appendChild(lv);
    }
    return box;
  }

  /* ───────── 놀이 공통 ───────── */
  function cfg(key) { return C.plays.filter(function (p) { return p.key === key; })[0]; }
  function startPlay(key) {
    var H = h();
    P = { key: key, round: 0, score: 0, earned: 0, cfg: cfg(key) };
    A().mode = 'play';
    H.$('play-title').textContent = P.cfg.name;
    H.show('scr-play');
    nextRound();
  }
  function scoreLine() {
    var s = h().$('play-score'); s.innerHTML = '';
    for (var i = 0; i < P.cfg.rounds; i++) s.appendChild(h().el('span', i < P.round - 1 || (i === P.round - 1 && P.roundDone) ? (P.hits[i] ? 'ok' : 'miss') : i === P.round - 1 ? 'now' : '', '●'));
  }
  function nextRound() {
    P.round++; P.roundDone = false; P.hits = P.hits || [];
    if (P.round > P.cfg.rounds) { endPlay(); return; }
    scoreLine();
    var area = h().$('play-area'); area.innerHTML = ''; area.className = 'play-area pa-' + P.key;
    ({ dice: diceRound, road: roadRound, command: commandRound })[P.key](area);
  }
  // 한 판 끝. ok: 처음 시도에 성공했나
  function roundEnd(ok, msgNode) {
    P.roundDone = true; P.hits[P.round - 1] = ok;
    if (ok) { P.score++; P.earned += P.cfg.coin; }
    scoreLine();
    var next = h().el('button', 'btn big green', P.round >= P.cfg.rounds ? '끝!' : '다음');
    next.onclick = nextRound;
    msgNode.appendChild(next);
  }
  function endPlay() {
    var H = h(), S = A();
    S.progress.plays = S.progress.plays || {};
    S.progress.plays[P.key] = Math.max(S.progress.plays[P.key] || 0, P.score);
    Ch.addGift(S.progress, P.earned);
    H.saveAll();
    H.dialog(P.score + ' / ' + P.cfg.rounds + ' 성공!', P.earned ? '선물 코인 ' + P.earned + '을 모았어요. 판을 시작할 때 ' + C.giftPerRun + '씩 받아요!' : '다음에는 더 잘할 수 있어요!', [
      { text: '한 번 더', cls: 'orange', fn: function () { H.closeOverlay(); startPlay(P.key); } },
      { text: '도전 영역', cls: 'green', fn: open }
    ]);
  }
  function msg(node, cls, text) { node.className = 'pl-msg ' + cls; node.textContent = text; }
  // 보기 3개 버튼. onPick(value, button)
  function choiceRow(choices, onPick) {
    var row = h().el('div', 'pl-choices');
    choices.forEach(function (c) { var b = h().el('button', 'choice', String(c)); b.onclick = function () { onPick(c, b); }; row.appendChild(b); });
    return row;
  }
  function lockRow(row) { Array.prototype.forEach.call(row.children, function (b) { b.disabled = true; }); }

  /* ───────── 1. 주사위 10 만들기 (2단원) ─────────
   * 주사위 세 개 중 더해서 10이 되는 두 개를 누른다 → 「10 + 남은 수」를 푼다 */
  function dieNode(n) {
    var d = h().el('button', 'die'), pos = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8], 7: [0, 2, 3, 4, 5, 6, 8], 8: [0, 1, 2, 3, 5, 6, 7, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8] }[n];
    for (var i = 0; i < 9; i++) d.appendChild(h().el('i', pos.indexOf(i) >= 0 ? 'pip' : ''));
    d.appendChild(h().el('span', 'die-n', String(n)));
    return d;
  }
  function diceRound(area) {
    var el = h().el, q = Ch.makeDice(), sel = -1, first = true;
    area.appendChild(el('div', 'pl-ask', '더해서 10이 되는 주사위 두 개를 눌러요'));
    var row = el('div', 'dice-row'), dice = [];
    var eq = el('div', 'pl-eq'), m = el('div', 'pl-msg');
    q.faces.forEach(function (f, i) {
      var d = dieNode(f); dice.push(d);
      d.onclick = function () {
        if (P.roundDone || row.dataset.lock) return;
        if (sel < 0) { sel = i; d.classList.add('sel'); return; }
        if (sel === i) { sel = -1; d.classList.remove('sel'); return; }
        var rest = Ch.diceRest(q.faces, sel, i);
        if (rest === null) {
          first = false;
          msg(m, 'soft', q.faces[sel] + ' + ' + f + ' = ' + (q.faces[sel] + f) + ', 10이 아니에요. 다시 골라 봐요!');
          dice[sel].classList.remove('sel'); sel = -1;
          row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
          return;
        }
        row.dataset.lock = '1';
        dice[sel].classList.add('ten'); d.classList.add('ten');
        dice.forEach(function (x, k) { if (k !== sel && k !== i) x.classList.add('rest'); });
        msg(m, 'good', q.faces[sel] + ' + ' + f + ' = 10! 이제 남은 수를 더해요.');
        eq.innerHTML = '<span class="ten-chip">10</span> + ' + rest + ' = <span class="qm">?</span>';
        var ch = choiceRow(q.choices, function (v, b) {
          if (P.roundDone) return;
          if (v === q.answer) { b.classList.add('right'); lockRow(ch); eq.innerHTML = '<span class="ten-chip">10</span> + ' + rest + ' = ' + q.answer; msg(m, 'good', first ? '정답! 선물 코인 +' + P.cfg.coin : '정답! 다음엔 한 번에 해 봐요.'); roundEnd(first, m); }
          else { b.classList.add('wrong'); b.disabled = true; first = false; msg(m, 'soft', '10에 ' + rest + '을 더하면 10 몇이 될까요?'); }
        });
        area.insertBefore(ch, m);
      };
      row.appendChild(d);
    });
    area.appendChild(row); area.appendChild(eq); area.appendChild(m);
  }

  /* ───────── 2. 덧셈과 뺄셈 길 (4단원) ─────────
   * 출발 수 → 1단계 카드 하나 → 2단계 카드 하나 → 도착 수. 카드를 고를 때마다 그 계산을 푼다 */
  function roadRound(area) {
    var el = h().el, q = Ch.makeRoad(), first = true;
    area.appendChild(el('div', 'pl-ask', '카드를 하나씩 골라 깃발 수 ' + q.target + '에 도착해요'));
    var road = el('div', 'road'), m = el('div', 'pl-msg'), calc = el('div', 'road-calc');
    var startN = el('div', 'road-node start', String(q.start)), midN = el('div', 'road-node mid', '?'), endN = el('div', 'road-node end', '?');
    var col1 = el('div', 'road-col'), col2 = el('div', 'road-col'), flag = el('div', 'road-node flag', '🚩 ' + q.target);
    road.appendChild(startN); road.appendChild(col1); road.appendChild(midN); road.appendChild(col2); road.appendChild(endN); road.appendChild(flag);
    area.appendChild(road); area.appendChild(calc); area.appendChild(m);
    var state = { stage: 1, mid: null };
    function cards(col, ops, stage) {
      col.innerHTML = '';
      ops.forEach(function (o) {
        var b = el('button', 'op-card ' + (o > 0 ? 'plus' : 'minus'), Ch.opText(o));
        b.onclick = function () {
          if (P.roundDone || state.stage !== stage || state.busy) return;
          state.busy = true; b.classList.add('sel');
          var from = stage === 1 ? q.start : state.mid, sc = Ch.stepChoices(from, o);
          calc.innerHTML = ''; calc.appendChild(el('div', 'pl-eq', from + ' ' + Ch.opText(o) + ' = ?'));
          var ch = choiceRow(sc.choices, function (v, bb) {
            if (v !== sc.answer) { bb.classList.add('wrong'); bb.disabled = true; first = false; msg(m, 'soft', '10을 만들고 남은 수를 생각해 봐요.'); return; }
            bb.classList.add('right'); lockRow(ch); state.busy = false;
            if (stage === 1) { state.mid = sc.answer; midN.textContent = String(sc.answer); state.stage = 2; msg(m, 'good', '좋아요! 다음 카드를 골라요.'); col2.classList.add('now'); col1.classList.remove('now'); }
            else {
              endN.textContent = String(sc.answer);
              if (sc.answer === q.target) { endN.classList.add('win'); msg(m, 'good', '깃발에 도착! ' + (first ? '선물 코인 +' + P.cfg.coin : '다음엔 한 번에 가 봐요.')); roundEnd(first, m); }
              else {
                first = false; endN.classList.add('lose');
                msg(m, 'soft', sc.answer + '에 왔어요. ' + q.target + '이 아니네요! 다른 길로 다시 가 봐요.');
                var again = el('button', 'btn small orange', '처음부터'); again.onclick = function () { reset(); }; m.appendChild(again);
              }
            }
          });
          calc.appendChild(ch);
        };
        col.appendChild(b);
      });
    }
    function reset() {
      state = { stage: 1, mid: null }; midN.textContent = '?'; endN.textContent = '?'; endN.className = 'road-node end'; calc.innerHTML = '';
      cards(col1, q.step1, 1); cards(col2, q.step2, 2); col1.classList.add('now'); col2.classList.remove('now');
      msg(m, '', '');
    }
    reset();
  }

  /* ───────── 3. 명령어 만들기 (6단원) ─────────
   * 1~100 수판. 「앞으로」 카드 하나와 「뒤로」 카드 하나를 골라 깃발 칸으로 캐릭터를 보낸다.
   * 고른 뒤 어디에 도착할지 먼저 맞혀 보고, 캐릭터가 움직인다 */
  function commandRound(area) {
    var el = h().el, q = Ch.makeCommand(), first = true, pick = { f: null, b: null };
    var wrap = el('div', 'cmd-wrap'), board = el('div', 'board100'), side = el('div', 'cmd-side');
    var cells = [];
    for (var n = 1; n <= 100; n++) { var c = el('div', 'cell', String(n)); cells[n] = c; board.appendChild(c); }
    cells[q.target].classList.add('flag');
    var who = h().img(h().charURL('n1'), 'cmd-who', 40, 40);
    function place(n) { cells[n].appendChild(who); }
    place(q.start);
    side.appendChild(el('div', 'pl-ask small', '앞으로 카드 하나, 뒤로 카드 하나를 골라 🚩 ' + q.target + '에 가요'));
    side.appendChild(el('div', 'cmd-start', '지금 ' + q.start + '번 칸'));
    var cardsBox = el('div', 'cmd-cards'), m = el('div', 'pl-msg'), calc = el('div', 'road-calc');
    function cardRow(list, kind) {
      var r = el('div', 'cmd-row');
      list.forEach(function (v, i) {
        var b = el('button', 'op-card ' + (kind === 'f' ? 'plus' : 'minus'), (kind === 'f' ? '앞으로 ' : '뒤로 ') + v + '칸');
        b.onclick = function () {
          if (P.roundDone || side.dataset.busy) return;
          Array.prototype.forEach.call(r.children, function (x) { x.classList.remove('sel'); });
          b.classList.add('sel'); pick[kind] = v; ask();
        };
        r.appendChild(b);
      });
      return r;
    }
    cardsBox.appendChild(cardRow(q.fw, 'f')); cardsBox.appendChild(cardRow(q.bw, 'b'));
    side.appendChild(cardsBox); side.appendChild(calc); side.appendChild(m);
    wrap.appendChild(board); wrap.appendChild(side); area.appendChild(wrap);

    function ask() {
      if (pick.f === null || pick.b === null) { msg(m, '', pick.f === null ? '앞으로 카드도 골라요.' : '뒤로 카드도 골라요.'); return; }
      var end = q.start + pick.f - pick.b, c = [end];
      [end + 10, end - 10, end + 1, end - 1].forEach(function (v) { if (c.length < 3 && v >= 1 && v <= 100 && c.indexOf(v) < 0) c.push(v); });
      c.sort(function () { return Math.random() - 0.5; });
      calc.innerHTML = '';
      calc.appendChild(el('div', 'pl-eq small', q.start + ' + ' + pick.f + ' − ' + pick.b + ' = ?'));
      calc.appendChild(el('div', 'pl-ask small', '어디에 도착할까요?'));
      var ch = choiceRow(c, function (v, b) {
        if (v !== end) { b.classList.add('wrong'); b.disabled = true; first = false; msg(m, 'soft', '십의 자리끼리, 일의 자리끼리 계산해 봐요.'); return; }
        b.classList.add('right'); lockRow(ch); side.dataset.busy = '1';
        move(q.start, q.start + pick.f, function () {
          move(q.start + pick.f, end, function () {
            if (end === q.target) { cells[end].classList.add('win'); msg(m, 'good', '깃발 도착! ' + (first ? '선물 코인 +' + P.cfg.coin : '다음엔 한 번에 가 봐요.')); roundEnd(first, m); }
            else {
              first = false; msg(m, 'soft', end + '번 칸이에요. 다른 카드로 다시 해 봐요!');
              var again = el('button', 'btn small orange', '다시 하기');
              again.onclick = function () { delete side.dataset.busy; cells.forEach(function (x) { if (x) x.classList.remove('trail'); }); place(q.start); calc.innerHTML = ''; msg(m, '', ''); };
              m.appendChild(again);
            }
          });
        });
      });
      calc.appendChild(ch);
    }
    // 십 칸씩, 그다음 한 칸씩 움직인다 (수판에서 10씩 위아래로 가는 것을 보여 준다)
    function move(from, to, done) {
      var steps = [], cur = from, dir = to > from ? 1 : -1, tens = Math.floor(Math.abs(to - from) / 10);
      for (var t = 0; t < tens; t++) { cur += 10 * dir; steps.push(cur); }
      while (cur !== to) { cur += dir; steps.push(cur); }
      var k = 0;
      (function tick() {
        if (k >= steps.length) { setTimeout(done, 250); return; }
        cells[steps[k]].classList.add('trail'); place(steps[k]); k++;
        setTimeout(tick, k <= tens ? 320 : 160);
      })();
    }
  }

  return { open: open };
})();
