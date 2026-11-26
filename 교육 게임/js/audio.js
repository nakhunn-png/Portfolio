/* 배경 음악: 뿅뿅 칩튠 (2026-11-26 사용자 요청)
 * 소리 파일 없이 Web Audio 로 바로 만든다. 네모파 멜로디 + 세모파 베이스 + 잡음 북.
 * 곡 3개: calm(처음·지도·준비) / battle(전투) / boss(보스전). 브라우저는 화면을 한 번 눌러야 소리를 내 준다.
 */
var G = globalThis.G || (globalThis.G = {});

G.Music = (function () {
  var ctx = null, master = null, noiseBuf = null, timer = null;
  var on = true, track = null, step = 0, nextT = 0, want = null;

  // 음 이름 → 주파수. 0 은 쉼표
  var N = {};
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(function (n, i) {
    for (var o = 2; o <= 6; o++) N[n + o] = 440 * Math.pow(2, (i - 9) / 12 + (o - 4));
  });
  function seq(str) { return str.split(' ').map(function (x) { return x === '.' ? 0 : N[x]; }); }

  /* 한 칸 = 16분음표. 멜로디 32칸(2마디)을 두 번, 베이스·북은 16칸 반복
   * 북: k = 큰북, s = 작은북, h = 찰찰 */
  var TRACKS = {
    calm: { bpm: 112, lead: 0.5, vol: 0.8,
      mel: seq('E5 . G5 . C6 . G5 . A5 . G5 . E5 . . . D5 . E5 . G5 . E5 . D5 . C5 . . . . . ' +
               'E5 . G5 . C6 . D6 . E6 . D6 . C6 . . . A5 . G5 . A5 . G5 . E5 . D5 . C5 . . .'),
      bass: seq('C3 . . . G2 . . . A2 . . . F2 . . . C3 . . . G2 . . . F2 . . . G2 . . .'),
      drum: 'k . h . s . h . k . h . s . h h' },
    battle: { bpm: 138, lead: 0.5, vol: 1,
      mel: seq('C5 . E5 G5 . E5 C6 . B5 . G5 . A5 . G5 . E5 . G5 A5 . G5 E5 . D5 . E5 . C5 . . . ' +
               'C5 . E5 G5 . E5 C6 . D6 . C6 . A5 . G5 . A5 . G5 E5 . D5 C5 . D5 . E5 . C5 . . .'),
      bass: seq('C3 . C3 . G2 . G2 . A2 . A2 . F2 . G2 . C3 . C3 . G2 . G2 . F2 . F2 . G2 . G2 .'),
      drum: 'k . h . s . h k k . h . s . h h' },
    boss: { bpm: 152, lead: 0.25, vol: 1,
      mel: seq('A4 . C5 . E5 . A5 . G5 . E5 . F5 . E5 . D5 . E5 . C5 . B4 . A4 . . . E5 . . . ' +
               'A4 . C5 . E5 . A5 . B5 . C6 . B5 . A5 . G5 . F5 . E5 . D5 . E5 . . . G#4 . . .'),
      bass: seq('A2 A2 . A2 A2 . A2 . F2 F2 . F2 G2 G2 . G2 A2 A2 . A2 A2 . A2 . E2 E2 . E2 G#2 . E2 .'),
      drum: 'k h s h k k s h k h s h k k s s' }
  };

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.11; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function tone(type, f, t, len, vol, duty) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + len + 0.02);
  }
  function drum(kind, t) {
    if (kind === 'k') {   // 큰북: 낮게 떨어지는 사인파
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.17);
      return;
    }
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gg = ctx.createGain();
    src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = kind === 'h' ? 7000 : 1800;
    var len = kind === 'h' ? 0.04 : 0.12;
    gg.gain.setValueAtTime(kind === 'h' ? 0.25 : 0.5, t); gg.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f); f.connect(gg); gg.connect(master); src.start(t); src.stop(t + len + 0.02);
  }
  function schedule() {
    if (!track) return;
    var T = TRACKS[track], sec = 60 / T.bpm / 4;
    while (nextT < ctx.currentTime + 0.15) {
      var m = T.mel[step % T.mel.length], b = T.bass[step % T.bass.length], k = T.drum.split(' ')[step % 16];
      if (m) tone('square', m, nextT, sec * 1.6, 0.22 * T.vol);
      if (b) tone('triangle', b, nextT, sec * 1.8, 0.55 * T.vol);
      if (k !== '.') drum(k, nextT);
      nextT += sec; step++;
    }
  }
  function start(name) {
    if (!ctx || !on || !name) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (track === name && timer) return;
    track = name; step = 0; nextT = ctx.currentTime + 0.05;
    if (!timer) timer = setInterval(schedule, 25);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } track = null; }

  // 곡 바꾸기 (화면이 바뀔 때 부른다). 아직 화면을 안 눌렀으면 기억해 두었다가 처음 누를 때 튼다
  function play(name) { want = name; if (ctx && on) start(name); }
  function unlock() { if (!ensure()) return; if (ctx.state === 'suspended') ctx.resume(); if (on && want && !timer) start(want); }
  function setOn(v) { on = !!v; if (!on) stop(); else if (ctx) start(want); }
  function isOn() { return on; }
  // 멈춤·숨김 동안은 조용히
  function pause(p) { if (!ctx) return; if (p) ctx.suspend(); else if (on) ctx.resume(); }

  return { play: play, unlock: unlock, setOn: setOn, isOn: isOn, pause: pause, TRACKS: TRACKS };
})();
