// 효과음: Web Audio로 합성(파일 없음). 기본은 꺼짐. 선생님 메뉴에서만 켠다.
(function (root) {
  'use strict';
  let ctx = null;
  const Sound = {
    get on() { return root.GRS.sound; },
    unlock() {
      if (!this.on) return;
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { ctx = null; }
    },
    tone(freqs, dur = 0.12, type = 'sine', vol = 0.15) {
      if (!this.on) return; this.unlock(); if (!ctx) return;
      let t = ctx.currentTime;
      for (const f of freqs) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur); t += dur * 0.8;
      }
    },
    good() { this.tone([660, 880, 1100], 0.1, 'triangle'); },
    bad() { this.tone([300, 220], 0.15, 'square', 0.08); },
    hit() { this.tone([200, 150], 0.1, 'square', 0.07); },
    move() { this.tone([520], 0.04, 'sine', 0.05); },
    boss() { this.tone([220, 196, 175], 0.18, 'sawtooth', 0.06); },
    win() { this.tone([523, 659, 784, 1047], 0.12, 'triangle'); },
  };
  document.addEventListener('visibilitychange', () => { if (!ctx) return; try { if (document.hidden) ctx.suspend(); else if (Sound.on) ctx.resume(); } catch (e) { /* 무시 */ } });
  root.GRSound = Sound;
})(window);
