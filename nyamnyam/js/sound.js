// 효과음: Web Audio로 짧게 합성한다(파일이 없어 오프라인에서도 된다). 기본은 꺼짐.
import { Save } from './save.js';

let ctx = null;
export const Sound = {
  on: Save.sound,
  toggle() { this.on = !this.on; Save.sound = this.on; if (this.on) this.unlock(); return this.on; },
  unlock() { if (!this.on) return; try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch { ctx = null; } },
  tone(freqs, dur = 0.12, type = 'sine', vol = 0.15) {
    if (!this.on) return; this.unlock(); if (!ctx) return;
    let t = ctx.currentTime;
    for (const f of freqs) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur); t += dur * 0.8;
    }
  },
  pickup() { this.tone([880, 1320], 0.08, 'triangle'); },
  good() { this.tone([660, 880, 1100], 0.1, 'triangle'); },
  bad() { this.tone([300, 220], 0.15, 'square', 0.08); },
  pop() { this.tone([1200, 600], 0.06, 'sine', 0.12); },
  caught() { this.tone([440, 330, 220], 0.16, 'sawtooth', 0.07); },
  open() { this.tone([523, 659, 784, 1047], 0.12, 'triangle'); },
  spotted() { this.tone([700, 900], 0.07, 'square', 0.05); },
};
