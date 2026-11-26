/* 시작 */
(function () {
  var started = false;
  function go() { if (started) return; started = true; G.UI.init(); }
  G.Pixel.loadOverrides(G.CharArt.overrideList(), go);
  setTimeout(go, 2500);   // 그림 불러오기가 늦어도 게임은 시작
})();
