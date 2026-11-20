/* 시작: 교체 그림(assets 폴더)을 먼저 불러온 뒤 게임을 연다 */
(function () {
  var list = [].concat(G.CharArt.overrideList(), G.MonsterArt.overrideList(), G.BgArt.overrideList(), G.MiscArt.overrideList());
  var started = false;
  function go() { if (started) return; started = true; G.UI.init(); }
  G.Pixel.loadOverrides(list, go);
  setTimeout(go, 2500);   // 그림 불러오기가 늦어도 게임은 시작
})();
