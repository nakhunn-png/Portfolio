// 저장: 이 기기(브라우저)의 localStorage에 반·번호별로 저장한다. 새로고침해도 이어 할 수 있다.
import { SAVE_VERSION } from './data.js';

const PREFIX = 'nyam1:';
const key = (cls, num) => `${PREFIX}c${cls}:n${num}`;

function read(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }

export const Save = {
  load(cls, num) { const s = read(key(cls, num)); return s && s.v === SAVE_VERSION ? s : null; },
  store(cls, num, data) { data.v = SAVE_VERSION; data.updated = Date.now(); return write(key(cls, num), data); },
  remove(cls, num) { try { localStorage.removeItem(key(cls, num)); } catch { /* 무시 */ } },
  // 반 전체 목록(선생님 화면)
  listClass(cls) {
    const out = [];
    for (let n = 1; n <= 30; n++) { const s = this.load(cls, n); if (s) out.push({ num: n, s }); }
    return out;
  },
  removeClass(cls) { for (let n = 1; n <= 30; n++) this.remove(cls, n); },
  classesWithData() {
    const set = new Set();
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); const m = k && k.match(/^nyam1:c(\d+):n\d+$/); if (m) set.add(+m[1]); } } catch { /* 무시 */ }
    return [...set].sort((a, b) => a - b);
  },
  // 마지막으로 고른 반(다음에 바로 보이게)
  get lastClass() { return +(read(PREFIX + 'lastClass') || 0); },
  set lastClass(v) { write(PREFIX + 'lastClass', v); },
  get sound() { return read(PREFIX + 'sound') === true; },
  set sound(v) { write(PREFIX + 'sound', !!v); },
  get diff() { return read(PREFIX + 'diff') || 'easy'; },
  set diff(v) { write(PREFIX + 'diff', v); },
};
