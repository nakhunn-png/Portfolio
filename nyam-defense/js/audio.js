/* 효과음 (소리 파일 없이 만든 간단한 소리, 기획서 14장) */
var G = globalThis.G || (globalThis.G = {});

G.Sound = (function () {
  var ac = null, on = true, last = {};
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    var a = ctx(); if (!a || !on) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + start;
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function seq(notes, type, vol, gap) { notes.forEach(function (f, i) { if (f) tone(f, i * (gap || 0.09), (gap || 0.09) * 1.6, type, vol); }); }
  var S = {
    correct: function () { seq([1047, 1319, 1568], 'triangle', 0.12, 0.08); },
    wrong:   function () { tone(392, 0, 0.18, 'sine', 0.07); tone(330, 0.16, 0.25, 'sine', 0.07); },
    open:    function () { tone(180, 0, 0.12, 'square', 0.05, 320); seq([0, 660, 880], 'triangle', 0.08, 0.07); },
    rare:    function () { seq([880, 1109, 1319, 1760, 2093], 'triangle', 0.09, 0.06); },
    legend:  function () { seq([784, 988, 1175, 1568, 1976, 2349, 2637], 'square', 0.06, 0.07); },
    merge:   function () { tone(300, 0, 0.5, 'sine', 0.08, 1200); seq([0, 0, 0, 0, 1319, 1760], 'triangle', 0.08, 0.08); },
    newChar: function () { seq([1319, 1568, 2093], 'triangle', 0.1, 0.1); },
    shoot:   function () { tone(900, 0, 0.06, 'square', 0.02, 500); },
    magic:   function () { tone(500, 0, 0.18, 'sine', 0.04, 1300); },
    hit:     function () { tone(220, 0, 0.05, 'square', 0.025, 140); },
    kill:    function () { tone(660, 0, 0.08, 'triangle', 0.05, 1320); },
    ouch:    function () { tone(160, 0, 0.06, 'triangle', 0.025); },
    leak:    function () { tone(300, 0, 0.3, 'sawtooth', 0.04, 120); },
    slam:    function () { tone(110, 0, 0.25, 'sawtooth', 0.07, 50); },
    boss:    function () { seq([196, 0, 196, 247], 'square', 0.05, 0.12); },
    bossDown:function () { seq([523, 659, 784, 1047], 'square', 0.07, 0.09); },
    stage:   function () { seq([523, 659, 784, 0, 659, 1047], 'square', 0.06, 0.11); },
    victory: function () { seq([523, 523, 784, 784, 880, 880, 784, 0, 1047, 1175, 1319, 1568], 'square', 0.06, 0.13); },
    lose:    function () { seq([523, 494, 440, 392], 'triangle', 0.07, 0.18); },
    click:   function () { tone(700, 0, 0.04, 'triangle', 0.05); },
    pause:   function () { tone(520, 0, 0.08, 'triangle', 0.06); tone(390, 0.08, 0.1, 'triangle', 0.06); }
  };
  function play(name) {
    if (!on || !S[name]) return;
    var now = Date.now();
    if (last[name] && now - last[name] < 60) return;   // 같은 소리가 너무 많이 겹치지 않게
    last[name] = now;
    try { S[name](); } catch (e) {}
  }
  return { play: play, setOn: function (v) { on = v; }, isOn: function () { return on; }, unlock: ctx };
})();
