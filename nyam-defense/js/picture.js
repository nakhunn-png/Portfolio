/* 그림 보고 식 만들기 문제의 그림 (블록 비교·블록 합치기·구슬 틀)
 * 화면 요소(DOM)로 그린다. 숫자 받침에 맞게 조사를 붙인다.
 */
var G = globalThis.G || (globalThis.G = {});

G.Picture = (function () {
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  // 숫자를 읽었을 때 받침이 있는지 (일·삼·육·칠·팔·십·영은 받침 있음)
  function numBatchim(n) { var d = n % 10; return d === 0 ? true : [1, 3, 6, 7, 8].indexOf(d) >= 0; }
  function gwa(n) { return numBatchim(n) ? '과' : '와'; }
  function eun(n) { return numBatchim(n) ? '은' : '는'; }
  function eul(n) { return numBatchim(n) ? '을' : '를'; }

  function tag(n) { return el('div', 'pic-tag', String(n)); }
  function cubeRow(n, cls, ghost) {
    var row = el('div', 'cube-row');
    for (var i = 0; i < n; i++) row.appendChild(el('span', 'cube ' + cls));
    for (i = 0; i < (ghost || 0); i++) row.appendChild(el('span', 'cube ghost'));
    return row;
  }
  function line(n, cls, ghost) { var l = el('div', 'pic-line'); l.appendChild(tag(n)); l.appendChild(cubeRow(n, cls, ghost)); return l; }

  // 구슬 틀: beads = [{color, take}] 를 10개씩 두 줄로
  function rack(beads, label) {
    var box = el('div', 'rack');
    if (label !== undefined) box.appendChild(el('div', 'rack-label', String(label)));
    var rows = [beads.slice(0, 10), beads.slice(10, 20)];
    rows.forEach(function (rb) {
      var r = el('div', 'rack-row'); r.appendChild(el('i', 'rod'));
      var taken = null;
      rb.forEach(function (b) {
        var bead = el('span', 'bead ' + b.color);
        if (b.take) { if (!taken) { taken = el('span', 'taken'); r.appendChild(taken); } taken.appendChild(bead); }
        else r.appendChild(bead);
      });
      if (taken) taken.insertAdjacentHTML('beforeend', '<svg class="take-arrow" viewBox="0 0 60 40"><path d="M6 32 Q 26 0 50 18" fill="none" stroke="#2fa8f0" stroke-width="7" stroke-linecap="round"/><path d="M40 6 L56 22 L36 26 Z" fill="#2fa8f0"/></svg>');
      box.appendChild(r);
    });
    box.insertBefore(el('i', 'post left'), box.firstChild); box.appendChild(el('i', 'post right'));
    return box;
  }

  function render(p) {
    var a = p.expr.a, b = p.expr.b, wrap = el('div', 'pic pic-' + p.tpl), bubble;
    if (p.tpl === 'cubeDiff') {
      // 큰 수와 작은 수 블록을 나란히 놓고 빈칸(점선)으로 차이를 보여 준다 (예: 7과 12는 얼마만큼 차이가 나?)
      wrap.appendChild(line(a, 'red'));
      wrap.appendChild(line(b, 'green', a - b));
      bubble = b + gwa(b) + ' ' + a + eun(a) + ' 얼마만큼 차이가 나?';
    } else if (p.tpl === 'cubeJoin') {
      wrap.appendChild(line(a, 'red'));
      wrap.appendChild(line(b, 'green'));
      bubble = a + gwa(a) + ' ' + b + eul(b) + ' 모두 합하면?';
    } else if (p.tpl === 'beadTake') {
      // 구슬 a개 중 윗줄 끝의 b개를 동그라미 치고 화살표로 덜어 낸다 (예: 13에서 5개)
      var top = Math.min(a, 10), beads = [];
      for (var i = 0; i < a; i++) beads.push({ color: i < top && i >= top - b ? 'gray' : 'red', take: i < top && i >= top - b });
      wrap.appendChild(rack(beads, a));
      bubble = '동그라미 친 구슬을 덜어 내요.';
    } else {
      var list = [];
      for (var k = 0; k < a + b; k++) list.push({ color: k < a ? 'red' : 'blue' });
      wrap.appendChild(rack(list));
      bubble = '빨간 구슬과 파란 구슬을 모두 합하면?';
    }
    wrap.appendChild(el('div', 'pic-bubble', bubble));
    return wrap;
  }

  return { render: render, numBatchim: numBatchim };
})();
