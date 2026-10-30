// 게임 본체: 한 층의 판정(이동·균·숨기·비눗방울·쪽지)과 그리기.
// 화면 바깥 일(문제 창, 쪽지 창, 잡혔을 때 창, 결과 화면)은 ui 콜백으로 넘긴다.
import { buildStage, lineOfSight, findPath } from './map.js';
import { GERMS, DIFFS, PLAYER_SPEED, SEARCH_LOCK, STUN_TIME, WATER_TIME, MASK_TIME, THROW_RANGE, hideName, FOUND_LINES, MISS_LINES } from './data.js';
import { Sound } from './sound.js';

const IMG = {};
export function loadImages(names) {
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = () => res(); im.src = `img/${n}.png`;
  })));
}

const emojiCache = new Map();
function emojiCanvas(e, px) {
  px = Math.max(8, Math.round(px)); const k = e + px;
  let c = emojiCache.get(k);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = Math.ceil(px * 1.25);
    const g = c.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.fillText(e, c.width / 2, c.height / 2 + px * 0.06);
    emojiCache.set(k, c);
  }
  return c;
}

const rand = (a, b) => a + Math.random() * (b - a);
function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 연습 층 단계
export const TUTORIAL = [
  { ev: 'search', text: '감지기(화면 위)를 보면서 <b>?</b> 가구로 가서 <b>살펴보기</b>를 눌러요.' },
  { ev: 'hide', text: '<b>{hide}</b>에 들어가 보세요. 숨어 있으면 균이 나를 못 찾아요.' },
  { ev: 'unhide', text: '다시 <b>나오기</b>를 눌러 밖으로 나와요.' },
  { ev: 'stun', text: '균이 나타났어요! <b>🫧 비눗방울</b>을 던져서 멈춰 보세요. 맞은 균은 4초 동안 꼼짝 못 해요.' },
  { ev: 'water', text: '<b>💧 물 한 컵</b>을 받았어요. <b>아이템</b> 단추를 눌러 마셔 보세요. 5초 동안 빨라져요!' },
  { ev: 'mask', text: '<b>😷 마스크</b>를 받았어요. 써 보세요. 6초 동안 균이 나를 알아채지 못해요!' },
  { ev: 'allFound', text: '남은 쪽지 조각을 모두 찾아요. 감지기가 <b>가까워요</b>로 바뀌는 곳을 찾아봐요.' },
  { ev: 'noteSolved', text: '<b>📜 쪽지</b>를 열어 조각을 순서대로 붙이고 문제를 풀어요.' },
  { ev: 'exit', text: '탈출문이 열렸어요! <b>화살표</b>를 따라 탈출문으로 나가요.' },
];

export class Game {
  // opts: { stageId, band, diff, char, pool(문제 배열), run(저장된 상태 또는 null), ui }
  constructor(canvas, opts) {
    this.cv = canvas; this.cx = canvas.getContext('2d');
    this.o = opts; this.ui = opts.ui;
    this.map = buildStage(opts.stageId);
    this.tut = opts.stageId === 0;
    this.input = { x: 0, y: 0 };
    this.keys = new Set();
    this.fx = []; this.bubbles = [];
    this.paused = false; this.over = false;
    this.time = 0; this.saveT = 0; this.dirty = true;
    this.locks = {};
    this.run = opts.run && opts.run.stageId === opts.stageId ? opts.run : this.newRun();
    this.germs = this.run.germs.map(g => this.makeGerm(g.type, g.x, g.y));
    this.invuln = opts.run ? 3 : 1.5;
    this.waterT = 0; this.maskT = 0;
    this.face = 1; this.walkT = 0;
    this.resize();
    this._loop = (t) => this.loop(t);
    this.last = performance.now(); this.raf = requestAnimationFrame(this._loop);
  }

  newRun() {
    const m = this.map, nReal = this.tut ? 2 : 4;
    const searchIds = m.objects.filter(o => o.kind === 'search').map(o => o.id);
    const pool = this.o.pool, noteQ = Math.floor(Math.random() * pool.length);
    const germs = [];
    if (!this.tut) {
      const list = [...this.stageGermList()];
      list.forEach((type, i) => { const s = m.germSpots[i % m.germSpots.length]; germs.push({ type, x: s.x, y: s.y }); });
    }
    return {
      stageId: m.id, diff: this.o.diff, lives: DIFFS[this.o.diff].lives === Infinity ? -1 : DIFFS[this.o.diff].lives,
      px: m.start.x, py: m.start.y, soap: this.tut ? 0 : 3, soapGot: 0, soapTotal: m.pickups.filter(p => p.kind === 'soap').length,
      item: null, picked: [], searched: {}, realIds: shuffled(searchIds).slice(0, nReal),
      noteQ, deck: shuffled(pool.map((_, i) => i).filter(i => i !== noteQ)), deckPos: 0,
      disabled: [], noteSolved: false, exitOpen: false, wrong: 0, correct: 0, hidden: null, hideFrom: null,
      germs, tut: 0, tutSeen: [], scattered: 0,
    };
  }
  stageGermList() {
    const list = this.map.S.germs.slice();
    if (DIFFS[this.o.diff].extraGerms) list.push('basic', 'cavity');
    return list;
  }
  makeGerm(type, x, y) {
    return { type, def: GERMS[type], x, y, state: 'wander', path: null, repath: 0, stun: 0, seen: 0, chaseT: 0, tired: 0, cool: 0, lx: x, ly: y, bob: Math.random() * 6, alertT: 0 };
  }

  get found() { return this.run.realIds.filter(id => this.run.searched[id] === 'found').length; }
  get need() { return this.run.realIds.length; }
  get lives() { return this.run.lives < 0 ? Infinity : this.run.lives; }
  get hideLabel() { return hideName(this.o.band); }

  destroy() { cancelAnimationFrame(this.raf); this.over = true; }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = this.cv.clientWidth || innerWidth, h = this.cv.clientHeight || innerHeight;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.dpr = dpr; this.vw = w; this.vh = h;
    this.TS = Math.round(Math.max(36, Math.min(h / 10.5, w / 15)));
  }

  serialize() {
    const r = this.run;
    r.germs = this.germs.map(g => ({ type: g.type, x: +g.x.toFixed(2), y: +g.y.toFixed(2) }));
    r.px = +this.px.toFixed(2); r.py = +this.py.toFixed(2);
    return r;
  }
  get px() { return this.run.px; } set px(v) { this.run.px = v; }
  get py() { return this.run.py; } set py(v) { this.run.py = v; }

  // ---------- 루프 ----------
  loop(t) {
    if (this.over) return;
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    if (!this.paused) this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this._loop);
  }

  update(dt) {
    this.time += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.waterT = Math.max(0, this.waterT - dt);
    this.maskT = Math.max(0, this.maskT - dt);
    for (const k in this.locks) if ((this.locks[k] -= dt) <= 0) delete this.locks[k];
    this.movePlayer(dt);
    this.pickups();
    for (const g of this.germs) this.updateGerm(g, dt);
    this.updateBubbles(dt);
    this.fx = this.fx.filter(f => (f.t -= dt) > 0);
    this.checkCaught();
    if ((this.saveT += dt) > 2) { this.saveT = 0; this.dirty = true; }
  }

  movePlayer(dt) {
    if (this.run.hidden != null) return;
    let dx = this.input.x, dy = this.input.y;
    const K = this.keys;
    if (K.has('ArrowLeft') || K.has('KeyA')) dx -= 1;
    if (K.has('ArrowRight') || K.has('KeyD')) dx += 1;
    if (K.has('ArrowUp') || K.has('KeyW')) dy -= 1;
    if (K.has('ArrowDown') || K.has('KeyS')) dy += 1;
    const len = Math.hypot(dx, dy);
    if (len < 0.15) { this.walkT = 0; return; }
    if (len > 1) { dx /= len; dy /= len; }
    if (Math.abs(dx) > 0.2) this.face = dx > 0 ? 1 : -1;
    const sp = PLAYER_SPEED * (this.waterT > 0 ? 1.6 : 1) * dt;
    this.walkT += dt;
    this.slide(dx * sp, dy * sp);
  }
  slide(mx, my) {
    const r = 0.3, m = this.map;
    const blocked = (x, y) => m.solid(Math.floor(x - r), Math.floor(y - r)) || m.solid(Math.floor(x + r), Math.floor(y - r)) || m.solid(Math.floor(x - r), Math.floor(y + r)) || m.solid(Math.floor(x + r), Math.floor(y + r));
    if (!blocked(this.px + mx, this.py)) this.px += mx;
    if (!blocked(this.px, this.py + my)) this.py += my;
  }

  pickups() {
    const r = this.run;
    for (const p of this.map.pickups) {
      if (r.picked.includes(p.id)) continue;
      if (Math.hypot(p.x + 0.5 - this.px, p.y + 0.5 - this.py) > 0.65) continue;
      if (p.kind === 'soap') { r.soap++; r.soapGot++; this.float('🫧 +1', p.x + 0.5, p.y, '#2b7bd6'); }
      else {
        if (r.item) { if (!p.warned) { p.warned = true; this.ui.toast('아이템은 하나만 들 수 있어요. 먼저 쓰고 오세요!'); } continue; }
        r.item = p.kind; this.float(p.kind === 'water' ? '💧 물 한 컵!' : '😷 마스크!', p.x + 0.5, p.y, '#2b7bd6');
        this.ui.toast(p.kind === 'water' ? '💧 물 한 컵을 주웠어요! 아이템 단추로 마시면 5초 동안 빨라져요.' : '😷 마스크를 주웠어요! 쓰면 6초 동안 균이 나를 알아채지 못해요.');
      }
      r.picked.push(p.id); Sound.pickup(); this.dirty = true;
    }
  }

  // ---------- 균 ----------
  canSee(g) {
    if (this.run.hidden != null || this.maskT > 0 || this.invuln > 0 || g.cool > 0) return false;
    const d = Math.hypot(this.px - g.x, this.py - g.y);
    return d < g.def.sight && lineOfSight(this.map, g.x, g.y, this.px, this.py);
  }
  updateGerm(g, dt) {
    g.bob += dt * 4; g.alertT = Math.max(0, g.alertT - dt);
    if (g.stun > 0) { g.stun -= dt; return; }
    if (g.cool > 0) g.cool -= dt;
    if (g.tired > 0) { g.tired -= dt; return; }
    const spd = DIFFS[this.run.diff].speed * (this.tut ? 0.6 : 1);
    if (this.canSee(g)) {
      if (g.state !== 'chase') { g.alertT = 1; Sound.spotted(); }
      g.state = 'chase'; g.seen = 0; g.lx = this.px; g.ly = this.py;
    }
    if (g.state === 'chase') {
      g.seen += dt; g.chaseT += dt;
      if (g.def.tires && g.chaseT > 4) { g.tired = 3; g.chaseT = 0; g.state = 'wander'; g.path = null; this.float('헥헥…', g.x, g.y - 0.8, '#8a5cc7'); return; }
      if (g.seen > 3) { g.state = 'wander'; g.path = null; g.chaseT = 0; }
      if ((g.repath -= dt) <= 0) { g.repath = 0.35; g.path = findPath(this.map, g.x, g.y, g.lx, g.ly); }
      // 같은 칸이거나 막힘 없이 보이면 곧장 다가간다
      if (Math.floor(g.x) === Math.floor(g.lx) && Math.floor(g.y) === Math.floor(g.ly)) this.stepTo(g, g.lx, g.ly, g.def.run * spd * dt);
      else this.follow(g, g.def.run * spd * dt);
    } else {
      if (!g.path || !g.path.length) {
        for (let t = 0; t < 10; t++) {
          const tx = Math.floor(g.x + rand(-7, 7)), ty = Math.floor(g.y + rand(-6, 6));
          if (!this.map.solid(tx, ty)) { g.path = findPath(this.map, g.x, g.y, tx, ty, 60); if (g.path) break; }
        }
      }
      this.follow(g, g.def.walk * spd * dt);
    }
  }
  follow(g, step) {
    if (!g.path || !g.path.length) return;
    const n = g.path[0];
    if (this.stepTo(g, n.x, n.y, step)) g.path.shift();
  }
  stepTo(g, tx, ty, step) {
    const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
    if (d <= step) { g.x = tx; g.y = ty; return true; }
    g.x += dx / d * step; g.y += dy / d * step; g.face = dx >= 0 ? 1 : -1; return false;
  }
  checkCaught() {
    if (this.invuln > 0 || this.run.hidden != null || this.paused) return;
    for (const g of this.germs) {
      if (g.stun > 0 || g.tired > 0 || g.cool > 0) continue;
      if (Math.hypot(g.x - this.px, g.y - this.py) < 0.6) { this.caught(g); return; }
    }
  }
  caught(g) {
    Sound.caught();
    g.cool = 4; g.state = 'wander'; g.path = null;
    for (const o of this.germs) if (o.state === 'chase') { o.state = 'wander'; o.path = null; }
    if (this.tut) { this.respawn(); this.ui.toast(`${g.def.name}에게 잡혔어요! 연습이라 괜찮아요. 처음 자리에서 다시 해요.`); return; }
    if (this.run.lives > 0) this.run.lives--;
    this.dirty = true;
    this.paused = true;
    this.ui.onCaught({ name: g.def.name, lives: this.lives, diff: this.run.diff });
  }
  respawn() {
    this.px = this.map.start.x; this.py = this.map.start.y;
    this.run.hidden = null; this.invuln = 2.5; this.paused = false; this.dirty = true;
  }

  // ---------- 비눗방울·아이템 ----------
  throwBubble() {
    const r = this.run;
    if (this.paused || r.hidden != null) return;
    if (r.soap <= 0) { this.ui.toast('비눗방울이 없어요. 바닥의 🧼 비누를 주워요!'); Sound.bad(); return; }
    let best = null, bd = THROW_RANGE;
    for (const g of this.germs) {
      if (g.stun > 0) continue;
      const d = Math.hypot(g.x - this.px, g.y - this.py);
      if (d < bd && lineOfSight(this.map, this.px, this.py, g.x, g.y)) { bd = d; best = g; }
    }
    let vx = this.face, vy = 0;
    if (best) { const d = Math.hypot(best.x - this.px, best.y - this.py) || 1; vx = (best.x - this.px) / d; vy = (best.y - this.py) / d; }
    else if (Math.hypot(this.input.x, this.input.y) > 0.3) { const d = Math.hypot(this.input.x, this.input.y); vx = this.input.x / d; vy = this.input.y / d; }
    r.soap--; this.dirty = true;
    this.bubbles.push({ x: this.px, y: this.py - 0.2, vx: vx * 9, vy: vy * 9, dist: 0 });
    Sound.pop();
  }
  updateBubbles(dt) {
    for (const b of this.bubbles) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.dist += 9 * dt;
      if (this.map.at(Math.floor(b.x), Math.floor(b.y)) === 1 || b.dist > THROW_RANGE) { b.dead = true; this.float('퐁', b.x, b.y, '#5aa9e6'); continue; }
      for (const g of this.germs) {
        if (g.stun > 0) continue;
        if (Math.hypot(g.x - b.x, g.y - b.y) < 0.7) {
          g.stun = STUN_TIME; g.state = 'wander'; g.path = null; g.chaseT = 0; b.dead = true;
          this.float('뽀득! 멈춤', g.x, g.y - 0.9, '#2b7bd6'); Sound.good();
          this.event('stun'); break;
        }
      }
    }
    this.bubbles = this.bubbles.filter(b => !b.dead);
  }
  useItem() {
    const r = this.run;
    if (this.paused || !r.item) { if (!r.item) this.ui.toast('가진 아이템이 없어요.'); return; }
    const used = r.item; r.item = null;
    if (used === 'water') { this.waterT = WATER_TIME; this.float('💧 빨라졌어요!', this.px, this.py - 1, '#2b7bd6'); }
    else { this.maskT = MASK_TIME; this.float('😷 균이 못 알아봐요!', this.px, this.py - 1, '#2b7bd6'); for (const g of this.germs) if (g.state === 'chase') { g.state = 'wander'; g.path = null; } }
    Sound.good(); this.dirty = true; this.event(used);
  }

  // ---------- 상호작용 ----------
  nearby() {
    const r = this.run, m = this.map;
    if (r.hidden != null) return { type: 'unhide', label: '나오기' };
    const e = m.exit;
    if (r.exitOpen && Math.hypot(e.ix + 0.5 - this.px, e.iy + 0.5 - this.py) < 1.4) return { type: 'exit', label: '탈출!' };
    let best = null, bd = 1.45;
    for (const o of m.objects) {
      if (o.kind === 'decor') continue;
      if (o.kind === 'search' && r.searched[o.id]) continue;
      const d = Math.hypot(o.x + 0.5 - this.px, o.y + 0.5 - this.py);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return null;
    if (best.kind === 'hide') return { type: 'hide', obj: best, label: `${this.hideLabel}에 숨기` };
    return { type: 'search', obj: best, label: this.locks[best.id] ? `🔒 ${Math.ceil(this.locks[best.id])}초` : '살펴보기' };
  }
  interact() {
    if (this.paused) return;
    const n = this.nearby(); if (!n) return;
    const r = this.run;
    if (n.type === 'unhide') {
      const o = this.map.objects[r.hidden]; r.hidden = null;
      if (r.hideFrom) { this.px = r.hideFrom.x; this.py = r.hideFrom.y; }
      else { this.px = o.x + 0.5; this.py = o.y + 1.5; }
      this.invuln = Math.max(this.invuln, 0.8); this.dirty = true; this.event('unhide'); return;
    }
    if (n.type === 'hide') {
      r.hideFrom = { x: this.px, y: this.py }; r.hidden = n.obj.id;
      for (const g of this.germs) if (g.state === 'chase') g.seen = Math.max(g.seen, 2);
      this.float('쉿!', n.obj.x + 0.5, n.obj.y - 0.2, '#3a9a4a'); this.dirty = true; this.event('hide'); return;
    }
    if (n.type === 'exit') { this.clear(); return; }
    if (n.type === 'search') {
      if (this.locks[n.obj.id]) { this.ui.bigMsg(`🔒 아직 ${Math.ceil(this.locks[n.obj.id])}초 동안 뒤질 수 없어요!`, 'bad'); Sound.bad(); return; }
      this.askSearch(n.obj);
    }
  }
  nextQuestion() {
    const r = this.run, pool = this.o.pool;
    if (r.deckPos >= r.deck.length) { r.deck = shuffled(pool.map((_, i) => i).filter(i => i !== r.noteQ)); r.deckPos = 0; }
    return pool[r.deck[r.deckPos++]];
  }
  askSearch(obj) {
    const q = this.nextQuestion();
    this.paused = true;
    this.ui.openQuiz({ title: `${obj.emoji} ${obj.name} 살펴보기`, q, disabled: [] }, (ok) => {
      this.paused = false; this.invuln = Math.max(this.invuln, 1);
      const r = this.run;
      if (!ok) {
        r.wrong++; this.locks[obj.id] = SEARCH_LOCK; this.dirty = true;
        this.ui.bigMsg(`❌ 틀렸어요! ${SEARCH_LOCK}초 동안 이 가구를 뒤질 수 없어요!`, 'bad'); Sound.bad();
        this.event('search');
        return;
      }
      r.correct++;
      if (r.realIds.includes(obj.id)) {
        r.searched[obj.id] = 'found'; Sound.open();
        const n = this.found;
        this.ui.bigMsg(`📜 쪽지 조각을 찾았어요! (${n}/${this.need})`, 'good');
        this.ui.say(n >= this.need ? FOUND_LINES[3] : FOUND_LINES[Math.min(n - 1, 2)]);
        if (n >= this.need) this.event('allFound');
      } else {
        r.searched[obj.id] = 'miss';
        const roll = Math.random();
        if (roll < 0.5) { r.soap += 2; this.ui.bigMsg('꽝! 대신 🫧 비눗방울 2개를 얻었어요', 'info'); }
        else if (roll < 0.75 && !r.item && !this.tut) { r.item = Math.random() < 0.5 ? 'water' : 'mask'; this.ui.bigMsg(r.item === 'water' ? '꽝! 대신 💧 물 한 컵을 얻었어요' : '꽝! 대신 😷 마스크를 얻었어요', 'info'); }
        else { r.soap += 1; this.ui.bigMsg('꽝! 조각이 없어요 (🫧 +1)', 'info'); this.ui.say(MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)]); }
        Sound.pickup();
      }
      this.dirty = true; this.event('search');
    });
  }

  // 쪽지 문제를 풀었을 때(ui에서 부름)
  noteAnswer(choice, ok) {
    const r = this.run;
    if (ok) {
      r.noteSolved = true; r.exitOpen = true; this.dirty = true; Sound.open();
      this.ui.bigMsg('🚪 탈출문이 열렸어요! 화살표를 따라가요!', 'good');
      this.event('noteSolved');
      return 'open';
    }
    r.wrong++;
    if (r.diff === 'hell') {
      // 불지옥: 조각이 흩어진다
      const ids = this.map.objects.filter(o => o.kind === 'search').map(o => o.id);
      r.searched = {}; r.realIds = shuffled(ids).slice(0, this.need); r.scattered++; r.disabled.push(choice);
      this.dirty = true; Sound.bad();
      this.ui.bigMsg('🔥 틀렸어요! 쪽지 조각이 다시 흩어졌어요!', 'bad');
      return 'scatter';
    }
    r.disabled.push(choice); this.dirty = true; Sound.bad();
    return 'retry';
  }

  clear() {
    const r = this.run;
    this.paused = true; this.over = true; this.event('exit');
    const stars = 1 + (r.wrong <= 2 ? 1 : 0) + (r.soapTotal && r.soapGot / r.soapTotal >= 0.6 ? 1 : 0);
    Sound.open();
    this.ui.onClear({ stageId: r.stageId, stars, diff: r.diff, wrong: r.wrong, correct: r.correct, soapGot: r.soapGot, soapTotal: r.soapTotal });
  }

  // 감지기: 가장 가까운 (못 찾은) 진짜 조각까지 거리
  detector() {
    const r = this.run;
    if (r.exitOpen) return { level: 5, text: '탈출문이 열렸어요!', room: null };
    if (this.found >= this.need) return { level: 5, text: '쪽지를 열어 보세요!', room: null };
    let best = null, bd = 1e9;
    for (const id of r.realIds) {
      if (r.searched[id] === 'found') continue;
      const o = this.map.objects[id], d = Math.hypot(o.x + 0.5 - this.px, o.y + 0.5 - this.py);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return null;
    const room = this.map.roomAt(best.x + 0.5, best.y + 0.5).name;
    if (bd > 13) return { level: 1, text: '조각과 멀어요', room };
    if (bd > 8) return { level: 2, text: '조금 가까워요', room };
    if (bd > 4.5) return { level: 3, text: '가까워요!', room };
    if (bd > 2) return { level: 4, text: '아주 가까워요!', room };
    return { level: 5, text: '바로 여기예요!', room };
  }
  currentRoom() { return this.map.roomAt(this.px, this.py)?.name || ''; }
  exitAngle() {
    const e = this.map.exit;
    return { a: Math.atan2(e.y + 0.5 - this.py, e.x + 0.5 - this.px), d: Math.hypot(e.x + 0.5 - this.px, e.y + 0.5 - this.py) };
  }

  // ---------- 연습 층 ----------
  event(ev) {
    if (!this.tut) return;
    const r = this.run;
    if (!r.tutSeen.includes(ev)) r.tutSeen.push(ev);
    let changed = false;
    while (r.tut < TUTORIAL.length && r.tutSeen.includes(TUTORIAL[r.tut].ev)) { r.tut++; changed = true; this.enterTutStep(); }
    if (changed) { this.dirty = true; this.ui.tutorial(r.tut); }
  }
  enterTutStep() {
    const r = this.run, step = TUTORIAL[r.tut];
    if (!step) return;
    if (step.ev === 'stun') {
      if (r.soap < 3) r.soap = 3;
      if (!this.germs.length) {
        const rm = this.map.rooms[1] || this.map.rooms[0];
        this.germs.push(this.makeGerm('basic', (rm.x0 + rm.x1) / 2 + 0.5, (rm.y0 + rm.y1) / 2 + 0.5));
      }
    }
    if (step.ev === 'water') r.item = 'water';
    if (step.ev === 'mask') r.item = 'mask';
  }

  float(text, x, y, color = '#333') { this.fx.push({ text, x, y, t: 1.2, max: 1.2, color }); }

  // ---------- 그리기 ----------
  draw() {
    const c = this.cx, TS = this.TS, m = this.map, T = m.T, r = this.run;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = T.line; c.fillRect(0, 0, this.vw, this.vh);
    // 카메라
    // 주인공을 늘 화면 가운데에 둔다(가장자리에서도 안내창·단추에 가려지지 않게)
    const camX = this.px * TS - this.vw / 2, camY = this.py * TS - this.vh / 2;
    c.save(); c.translate(-Math.round(camX), -Math.round(camY));
    const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(m.W - 1, Math.ceil((camX + this.vw) / TS)), y1 = Math.min(m.H - 1, Math.ceil((camY + this.vh) / TS));
    // 바닥과 벽
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = m.at(x, y);
      if (v === 1) {
        // 벽 윗면은 밝게, 바닥과 맞닿은 앞면만 진하게
        const front = m.at(x, y + 1) !== 1;
        c.fillStyle = T.wallTop; c.fillRect(x * TS, y * TS, TS, TS);
        if (front) { c.fillStyle = T.wall; c.fillRect(x * TS, y * TS + TS * 0.55, TS, TS * 0.45); }
      } else {
        c.fillStyle = T.floor[(x + y) & 1]; c.fillRect(x * TS, y * TS, TS, TS);
      }
    }
    // 방 이름
    c.font = `${Math.round(TS * 0.32)}px "Ssurround",sans-serif`; c.textAlign = 'left'; c.textBaseline = 'top';
    for (const rm of m.rooms) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillText(rm.name, rm.x0 * TS + 6, rm.y0 * TS + 4); }
    // 탈출문
    this.drawExit(c, TS);
    // 줍는 것
    for (const p of m.pickups) {
      if (r.picked.includes(p.id)) continue;
      const bob = Math.sin(this.time * 3 + p.id) * TS * 0.06;
      const e = p.kind === 'soap' ? '🧼' : p.kind === 'water' ? '💧' : '😷';
      const im = emojiCanvas(e, TS * 0.5);
      c.fillStyle = 'rgba(0,0,0,0.08)'; c.beginPath(); c.ellipse((p.x + 0.5) * TS, (p.y + 0.8) * TS, TS * 0.22, TS * 0.08, 0, 0, 7); c.fill();
      c.drawImage(im, (p.x + 0.5) * TS - im.width / 2, (p.y + 0.5) * TS - im.height / 2 + bob);
    }
    // 소품·가구·숨는 곳·사람·균을 y 순서대로
    const list = [];
    for (const o of m.objects) list.push({ y: o.y + 0.9, d: () => this.drawObject(c, o, TS) });
    for (const g of this.germs) list.push({ y: g.y, d: () => this.drawGerm(c, g, TS) });
    if (r.hidden == null) list.push({ y: this.py, d: () => this.drawPlayer(c, TS) });
    list.sort((a, b) => a.y - b.y).forEach(it => it.d());
    // 비눗방울
    for (const b of this.bubbles) {
      c.fillStyle = 'rgba(160,215,255,0.55)'; c.strokeStyle = '#5aa9e6'; c.lineWidth = 2;
      c.beginPath(); c.arc(b.x * TS, b.y * TS, TS * 0.22, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x * TS - TS * 0.07, b.y * TS - TS * 0.07, TS * 0.05, 0, 7); c.fill();
    }
    // 이펙트 글자
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const f of this.fx) {
      const k = f.t / f.max;
      c.globalAlpha = Math.min(1, k * 2);
      this.label(c, f.text, f.x * TS, (f.y - (1 - k) * 0.6) * TS, Math.round(TS * 0.36), f.color);
    }
    c.globalAlpha = 1;
    c.restore();
  }
  label(c, text, x, y, size, color = '#333', stroke = '#fff') {
    c.font = `${size}px "Ssurround","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.28); c.strokeStyle = stroke; c.strokeText(text, x, y);
    c.fillStyle = color; c.fillText(text, x, y);
  }
  drawExit(c, TS) {
    const e = this.map.exit, open = this.run.exitOpen, x = e.x * TS, y = e.y * TS;
    c.fillStyle = open ? '#4cc36a' : '#9aa0a6'; c.fillRect(x + 3, y + 3, TS - 6, TS - 6);
    if (open) { c.strokeStyle = `rgba(76,195,106,${0.5 + 0.4 * Math.sin(this.time * 5)})`; c.lineWidth = 6; c.strokeRect(x - 2, y - 2, TS + 4, TS + 4); }
    const im = emojiCanvas(open ? '🚪' : '🔒', TS * 0.6); c.drawImage(im, x + TS / 2 - im.width / 2, y + TS / 2 - im.height / 2);
    const lx = e.ix * TS + TS / 2, ly = e.iy * TS + (e.dir === 's' ? -TS * 0.2 : e.dir === 'n' ? TS * 1.1 : -TS * 0.3);
    this.label(c, open ? '탈출문 열림!' : '탈출문', lx, ly, Math.round(TS * 0.3), open ? '#1f8a3a' : '#666');
  }
  drawObject(c, o, TS) {
    const r = this.run, cx = (o.x + 0.5) * TS, cy = (o.y + 0.5) * TS;
    if (o.kind === 'decor') {
      const im = emojiCanvas(o.emoji, TS * 0.75); c.drawImage(im, cx - im.width / 2, cy - im.height / 2); return;
    }
    if (o.kind === 'hide') {
      const hiding = r.hidden === o.id;
      c.fillStyle = hiding ? 'rgba(76,195,106,0.35)' : 'rgba(76,195,106,0.18)';
      c.strokeStyle = '#2e9a4a'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(o.x * TS + 2, o.y * TS + 2, TS - 4, TS - 4, TS * 0.2); c.fill(); c.stroke();
      const im = emojiCanvas(o.emoji, TS * 0.85); c.drawImage(im, cx - im.width / 2, cy - im.height / 2);
      this.label(c, hiding ? '숨는 중…' : this.hideLabel, cx, o.y * TS - TS * 0.28, Math.round(TS * 0.34), '#fff', '#1f7a36');
      if (hiding) { const p = IMG[this.o.char]; if (p) { c.globalAlpha = 0.45; const h = TS * 0.9, w = h * p.width / p.height; c.drawImage(p, cx - w / 2, cy - h / 2, w, h); c.globalAlpha = 1; } }
      return;
    }
    // ?가구
    const st = r.searched[o.id], lock = this.locks[o.id];
    c.fillStyle = st ? 'rgba(255,255,255,0.55)' : '#fff'; c.strokeStyle = st === 'found' ? '#4cc36a' : lock ? '#e0524a' : '#f0a640'; c.lineWidth = 3;
    c.beginPath(); c.roundRect(o.x * TS + 3, o.y * TS + 3, TS - 6, TS - 6, TS * 0.18); c.fill(); c.stroke();
    c.globalAlpha = st ? 0.5 : 1;
    const im = emojiCanvas(o.emoji, TS * 0.62); c.drawImage(im, cx - im.width / 2, cy - im.height / 2);
    c.globalAlpha = 1;
    if (lock) this.label(c, `🔒${Math.ceil(lock)}`, cx, o.y * TS - TS * 0.25, Math.round(TS * 0.34), '#e0524a');
    else if (!st) {
      const b = Math.sin(this.time * 4 + o.id) * TS * 0.06;
      c.fillStyle = '#ffb627'; c.beginPath(); c.arc(cx, o.y * TS - TS * 0.22 + b, TS * 0.2, 0, 7); c.fill();
      this.label(c, '?', cx, o.y * TS - TS * 0.22 + b, Math.round(TS * 0.3), '#fff', '#c97a00');
    } else if (st === 'found') this.label(c, '✓', cx, o.y * TS - TS * 0.2, Math.round(TS * 0.34), '#2e9a4a');
  }
  drawPlayer(c, TS) {
    const im = IMG[this.o.char];
    const blink = this.invuln > 0 && Math.floor(this.time * 10) % 2 === 0;
    const x = this.px * TS, y = this.py * TS;
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(x, y + TS * 0.3, TS * 0.32, TS * 0.1, 0, 0, 7); c.fill();
    if (this.maskT > 0) { c.fillStyle = 'rgba(120,180,255,0.25)'; c.beginPath(); c.arc(x, y - TS * 0.3, TS * 0.7, 0, 7); c.fill(); }
    if (blink) c.globalAlpha = 0.4;
    if (im) {
      const h = TS * 1.35, w = h * im.width / im.height, hop = this.walkT > 0 ? Math.abs(Math.sin(this.walkT * 12)) * TS * 0.08 : 0;
      c.save(); c.translate(x, y + TS * 0.35 - hop); c.scale(this.face, 1); c.drawImage(im, -w / 2, -h, w, h); c.restore();
    } else { c.fillStyle = '#ff8a3d'; c.beginPath(); c.arc(x, y, TS * 0.35, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    if (this.waterT > 0) this.label(c, '💧', x + TS * 0.45, y - TS * 1.0, Math.round(TS * 0.32));
    if (this.maskT > 0) this.label(c, '😷', x - TS * 0.45, y - TS * 1.0, Math.round(TS * 0.32));
  }
  drawGerm(c, g, TS) {
    const im = IMG[g.def.img], x = g.x * TS, y = g.y * TS, sz = TS * 1.0 * g.def.size;
    const squash = g.stun > 0 ? 1 : 1 + Math.sin(g.bob) * 0.05;
    c.fillStyle = g.state === 'chase' ? 'rgba(230,70,70,0.22)' : 'rgba(0,0,0,0.12)';
    c.beginPath(); c.ellipse(x, y + sz * 0.38, sz * 0.38, sz * 0.12, 0, 0, 7); c.fill();
    if (im) {
      c.save(); c.translate(x, y + sz * 0.4); c.scale((g.face || 1) * (2 - squash), squash);
      if (g.cool > 0) c.globalAlpha = 0.55;
      c.drawImage(im, -sz / 2, -sz, sz, sz); c.restore(); c.globalAlpha = 1;
    }
    if (g.stun > 0) {
      c.fillStyle = 'rgba(160,215,255,0.35)'; c.strokeStyle = '#5aa9e6'; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y - sz * 0.1, sz * 0.62, 0, 7); c.fill(); c.stroke();
      this.label(c, `🫧 ${Math.ceil(g.stun)}`, x, y - sz * 0.85, Math.round(TS * 0.3), '#2b7bd6');
    } else if (g.tired > 0) this.label(c, '헥헥 💤', x, y - sz * 0.85, Math.round(TS * 0.28), '#8a5cc7');
    else if (g.state === 'chase') this.label(c, '!', x, y - sz * 0.85 - (g.alertT > 0 ? TS * 0.15 : 0), Math.round(TS * 0.5), '#e0524a');
  }
}
