/* 맵 배치 검사: node tests/check-layout.js
 * 길 모양마다 출전 칸·영웅 자리·문제 풍선 자리가 길 위에 놓이지 않았는지,
 * 서로 겹치지 않는지, 화면 밖으로 나가지 않는지 본다. 영웅 능력도 한 번씩 써 본다. */
var path = require('path');
global.G = {};
require(path.join(__dirname, '../js/config.js'));
require(path.join(__dirname, '../js/battle.js'));
var C = G.CONFIG, B = G.Battle, fail = 0;

function nearPath(L, x, y) {
  var bd = 1e9;
  L.paths.forEach(function (P) { for (var s = 0; s < P.length; s += 4) { var q = P.at(s); bd = Math.min(bd, Math.hypot(q.x - x, q.y - y)); } });
  return bd;
}
function check(ok, msg) { if (!ok) { console.log('  실패  ' + msg); fail++; } }

C.stages.filter(function (st) { return st.ready; }).forEach(function (st) {
  var L = B.LAYOUTS[st.path]();
  console.log('스테이지 ' + st.no + ' ' + st.name + ' (' + st.path + ')');
  check(L.slots.length === C.slots, '출전 칸이 ' + C.slots + '개가 아님');
  check(!!L.extra, '출전 칸 +1 (도감 보상) 자리가 없음');
  if (L.extra) L.slots = L.slots.concat([L.extra]);   // 9번째 칸도 함께 검사한다
  // 받침(가로 40, 세로 15)이 길(두께 64)에 닿지 않아야 한다
  L.slots.forEach(function (s, i) { var d = nearPath(L, s.x, s.y); check(d >= 44, '칸 ' + i + ' 이 길에 너무 가까움 (' + Math.round(d) + ')'); });
  var hd = nearPath(L, L.hero.x, L.hero.y); check(hd >= 44, '영웅 자리가 길에 너무 가까움 (' + Math.round(hd) + ')');
  // 칸끼리, 칸과 영웅이 겹치지 않아야 한다 (가로 80 이상 또는 세로 70 이상 떨어짐)
  var spots = L.slots.concat([L.hero]);
  spots.forEach(function (a, i) { spots.forEach(function (b, j) { if (j <= i) return; check(Math.abs(a.x - b.x) >= 80 || Math.abs(a.y - b.y) >= 70, '자리 ' + i + '·' + j + ' 가 겹침'); }); });
  L.bubbles.forEach(function (bb) { spots.forEach(function (s, i) { check(Math.abs(bb.x - s.x) >= 60 || Math.abs(bb.y - s.y) >= 60, '풍선이 자리 ' + i + ' 를 가림'); }); });
  // 풍선(반지름 38)이 화면 아래 가운데 능력 버튼(x 420~540, y 450 이상)과 위쪽 버튼들(y 80 이하)에 닿지 않아야 한다
  L.bubbles.forEach(function (bb) {
    check(!(bb.x + 38 > 420 && bb.x - 38 < 540 && bb.y + 38 > 450), '풍선이 능력 버튼과 겹침 (' + bb.x + ',' + bb.y + ')');
    check(bb.y - 38 >= 60, '풍선이 위쪽 버튼과 겹침 (' + bb.x + ',' + bb.y + ')');
  });
  // 화면 안
  L.paths.forEach(function (P) { P.points.forEach(function (p) { check(p.x >= 30 && p.x <= 930 && p.y >= 60 && p.y <= 500, '길이 화면 밖 (' + Math.round(p.x) + ',' + Math.round(p.y) + ')'); }); });
  // 모든 칸에서 사거리가 가장 짧은 직업(200)으로도 길에 닿아야 한다
  spots.forEach(function (s, i) { check(nearPath(L, s.x, s.y) <= 200 - 30, '자리 ' + i + ' 에서 길이 너무 멂'); });
  // 영웅 능력 다섯 가지를 길 위 한 점에 써 본다
  C.heroOrder.forEach(function (h) {
    var bt = B.create(st.no, [], h); bt.hero.cd = 0;
    var q = bt.path.at(bt.path.length * 0.3);
    check(B.useSkill(bt, q.x, q.y) === true, h + ' 능력을 길 위에 쓸 수 없음');
  });
  // 방패병은 길이 아닌 곳에는 못 쓴다
  var bt2 = B.create(st.no, [], 'shield'); bt2.hero.cd = 0;
  check(B.useSkill(bt2, L.hero.x, L.hero.y) === false || nearPath(L, L.hero.x, L.hero.y) <= 70, '방패병을 길 밖에 쓸 수 있음');
});
console.log(fail ? '\n맵 배치 검사 실패 ' + fail + '건' : '\n맵 배치 검사 모두 통과');
process.exit(fail ? 1 : 0);
