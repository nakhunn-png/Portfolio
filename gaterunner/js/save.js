// 저장: 이 기기(브라우저)의 localStorage에 반·번호별로 저장한다. 서버로 가지 않는다.
(function (root) {
  'use strict';
  const P = 'gate1:';
  const key = (c, n) => `${P}c${c}:n${n}`;
  const read = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const blank = () => ({ v: 1, kid: 0, stages: {}, types: {}, wrong: [], owned: [], wear: null });

  root.GRS = {
    load(c, n) { const s = read(key(c, n)); return s && s.v === 1 ? s : null; },
    loadOrNew(c, n) { return this.load(c, n) || blank(); },
    store(c, n, s) { s.updated = Date.now(); return write(key(c, n), s); },
    remove(c, n) { try { localStorage.removeItem(key(c, n)); } catch (e) { /* 무시 */ } },
    listClass(c) { const out = []; for (let n = 1; n <= 30; n++) { const s = this.load(c, n); if (s) out.push({ num: n, s }); } return out; },
    removeClass(c) { for (let n = 1; n <= 30; n++) this.remove(c, n); },
    classesWithData() {
      const set = new Set();
      try { for (let i = 0; i < localStorage.length; i++) { const m = (localStorage.key(i) || '').match(/^gate1:c(\d+):n\d+$/); if (m) set.add(+m[1]); } } catch (e) { /* 무시 */ }
      return [...set].sort((a, b) => a - b);
    },
    // 이 기기 설정
    get lastClass() { return +(read(P + 'lastClass') || 0); },
    set lastClass(v) { write(P + 'lastClass', v); },
    get sound() { return read(P + 'sound') === true; },
    set sound(v) { write(P + 'sound', !!v); },
    get speed() { return read(P + 'speed') || 'normal'; },
    set speed(v) { write(P + 'speed', v); },
    get unlockAll() { return read(P + 'unlockAll') === true; },
    set unlockAll(v) { write(P + 'unlockAll', !!v); },
  };
})(window);
