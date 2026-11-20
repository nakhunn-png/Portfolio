/* 도트 그림 엔진 + 그림 파일 교체 장치
 *
 * ▶ 그림 바꾸는 방법
 *   assets 폴더에 정해진 이름의 그림 파일(png)을 넣으면 자동으로 그 그림을 쓴다.
 *   파일이 없으면 이 파일에서 만든 임시 도트 그림을 쓴다.
 *   - 캐릭터:   assets/캐릭터/<캐릭터 번호>.png      예) assets/캐릭터/n1.png
 *   - 몬스터:   assets/몬스터/<몬스터 이름>.png      예) assets/몬스터/pinkSlime.png
 *   - 배경:     assets/배경/<스테이지 번호>.png      예) assets/배경/1.png
 *   - 기타:     assets/기타/<이름>.png               예) assets/기타/뽑기상자.png
 *   번호와 이름 목록은 assets/그림_목록.txt 에 있다.
 *   캐릭터·몬스터 그림은 배경이 투명한 png, 발이 그림 아래쪽 가운데에 오게 한다.
 */
var G = globalThis.G || (globalThis.G = {});

G.Pixel = (function () {
  var OUTLINE = '#3a2a3f';
  var cache = {};
  var files = {};      // 교체 그림 (불러오기에 성공한 것만)

  // 작은 격자 그림판
  function Grid(w, h) {
    this.w = w; this.h = h; this.d = new Array(w * h).fill(null);
  }
  Grid.prototype.px = function (x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  };
  Grid.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.d[y * this.w + x];
  };
  Grid.prototype.rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.px(x + i, y + j, c); };
  Grid.prototype.ellipse = function (cx, cy, rx, ry, c) {
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
  };
  Grid.prototype.hline = function (x1, x2, y, c) { for (var x = x1; x <= x2; x++) this.px(x, y, c); };
  Grid.prototype.vline = function (x, y1, y2, c) { for (var y = y1; y <= y2; y++) this.px(x, y, c); };
  Grid.prototype.line = function (x0, y0, x1, y1, c) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (var i = 0; i <= n; i++) this.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  };
  // 빈 칸 중 그림과 맞닿은 칸에 굵은 외곽선
  Grid.prototype.outline = function (color) {
    color = color || OUTLINE;
    var add = [];
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    var self = this;
    add.forEach(function (p) { self.d[p[1] * self.w + p[0]] = color; });
  };
  Grid.prototype.toCanvas = function () {
    var c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    var ctx = c.getContext('2d');
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) {
      var v = this.d[y * this.w + x];
      if (v) { ctx.fillStyle = v; ctx.fillRect(x, y, 1, 1); }
    }
    return c;
  };

  // 색 밝기 조절
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))); }
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  // 그림 가져오기: 교체 그림이 있으면 그것, 없으면 만든 도트 그림 (한 번 만들면 저장)
  function get(key, maker) {
    if (files[key]) return files[key];
    if (!cache[key]) cache[key] = maker();
    return cache[key];
  }

  // 교체 그림 미리 불러오기 (없는 파일은 조용히 넘어감)
  function loadOverrides(list, done) {
    if (!G.ASSET_SETTINGS || !G.ASSET_SETTINGS.useFiles) { done && done(); return; }
    var left = list.length;
    if (!left) { done && done(); return; }
    list.forEach(function (it) {
      var img = new Image();
      img.onload = function () { files[it.key] = img; if (--left === 0 && done) done(); };
      img.onerror = function () { if (--left === 0 && done) done(); };
      img.src = it.src;
    });
  }

  // 그림을 화면에 그리기 (발 위치 = x,y / 크기 = 높이 기준 픽셀)
  function drawSprite(ctx, img, x, y, height, flip) {
    var scale = height / img.height, w = img.width * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, Math.round(-w / 2), Math.round(-height), Math.round(w), Math.round(height));
    ctx.restore();
  }

  // 화면 요소(<img>나 <canvas>)로 쓰기 위해 데이터 주소로 변환
  var urlCache = {};
  function toURL(key, img) {
    if (urlCache[key]) return urlCache[key];
    if (img instanceof HTMLImageElement) return (urlCache[key] = img.src);
    try { return (urlCache[key] = img.toDataURL()); } catch (e) { return ''; }
  }

  return { Grid: Grid, shade: shade, get: get, loadOverrides: loadOverrides, drawSprite: drawSprite, toURL: toURL, OUTLINE: OUTLINE, files: files };
})();

// 그림 파일 사용 설정: 실제 그림을 assets 폴더에 넣었다면 useFiles 를 true 로 바꾼다.
// 지금은 넣은 그림이 없으므로 false (true 이면 없는 파일 50여 개를 찾느라 콘솔에 404 오류가 쌓이고 시작이 조금 느려진다)
G.ASSET_SETTINGS = { useFiles: false };
