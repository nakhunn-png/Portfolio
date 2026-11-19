// 소리: Web Audio로 효과음과 배경음악을 합성한다(파일이 없어 오프라인에서도 된다). 기본은 꺼짐.
// 소리를 켜면 효과음과 배경음악이 함께 나온다. 브라우저 규칙상 화면을 한 번 누른 뒤부터 소리가 난다.
import { Save } from './save.js';

let ctx = null;
let bgm = null; // { gain, step, next, timer }

// 배경음악: 8마디 반복. 한 칸 = 8분음표, 0 = 쉼표. 숫자는 MIDI 음 번호(72 = 도5)
const BPM = 132, STEP = 60 / BPM / 2;
const LEAD = [
  76, 0, 79, 0, 84, 83, 81, 79, // C
  77, 0, 81, 0, 84, 0, 81, 0,   // F
  79, 0, 83, 0, 86, 84, 83, 81, // G
  79, 0, 76, 0, 72, 0, 0, 0,    // C
  76, 0, 81, 0, 84, 0, 81, 76,  // Am
  77, 0, 81, 0, 84, 83, 81, 77, // F
  79, 81, 83, 84, 86, 0, 83, 0, // G
  84, 0, 79, 0, 72, 0, 0, 0,    // C
];
// 4분음표마다 한 음(근음·5음)
const BASS = [
  48, 55, 48, 55, 53, 60, 53, 60, 55, 62, 55, 62, 48, 55, 48, 55,
  57, 64, 57, 64, 53, 60, 53, 60, 55, 62, 55, 62, 48, 55, 48, 48,
];
const midi = (m) => 440 * 2 ** ((m - 69) / 12);

function note(m, t, dur, type, vol, out) {
  if (!m) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = midi(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.02);
}

export const Sound = {
  on: Save.sound,
  get playing() { return !!bgm; },
  toggle() {
    this.on = !this.on; Save.sound = this.on;
    if (this.on) this.unlock(); else this.bgmStop();
    return this.on;
  },
  unlock() {
    if (!this.on) return;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch { ctx = null; }
    this.bgmStart();
  },
  bgmStart() {
    if (!this.on || !ctx || bgm) return;
    const gain = ctx.createGain(); gain.gain.value = 0.07; gain.connect(ctx.destination);
    bgm = { gain, step: 0, next: ctx.currentTime + 0.1, timer: setInterval(() => this.bgmTick(), 50) };
  },
  // 0.25초 앞까지 음을 미리 예약한다(타이머가 조금 늦어도 박자가 흔들리지 않게)
  bgmTick() {
    if (!bgm || !ctx) return;
    const now = ctx.currentTime;
    if (bgm.next < now - 0.3) bgm.next = now + 0.05; // 오래 멈췄다 돌아오면 밀린 음을 한꺼번에 내지 않는다
    while (bgm.next < now + 0.25) {
      const i = bgm.step % LEAD.length;
      note(LEAD[i], bgm.next, STEP * 0.9, 'triangle', 0.9, bgm.gain);
      if (i % 2 === 0) note(BASS[i / 2], bgm.next, STEP * 1.8, 'square', 0.25, bgm.gain);
      bgm.step++; bgm.next += STEP;
    }
  },
  bgmStop() {
    if (!bgm) return;
    clearInterval(bgm.timer);
    const g = bgm.gain; bgm = null;
    try { g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); setTimeout(() => g.disconnect(), 400); } catch { /* 무시 */ }
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
  pickup() { this.tone([880, 1320], 0.08, 'triangle'); },
  good() { this.tone([660, 880, 1100], 0.1, 'triangle'); },
  bad() { this.tone([300, 220], 0.15, 'square', 0.08); },
  pop() { this.tone([1200, 600], 0.06, 'sine', 0.12); },
  caught() { this.tone([440, 330, 220], 0.16, 'sawtooth', 0.07); },
  door() { this.tone([294, 392], 0.07, 'triangle', 0.09); },
  open() { this.tone([523, 659, 784, 1047], 0.12, 'triangle'); },
  spotted() { this.tone([700, 900], 0.07, 'square', 0.05); },
};

// 다른 앱으로 넘어가거나 화면을 끄면 소리를 멈추고, 돌아오면 이어서 낸다
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    try { if (document.hidden) ctx.suspend(); else if (Sound.on) ctx.resume(); } catch { /* 무시 */ }
  });
}
