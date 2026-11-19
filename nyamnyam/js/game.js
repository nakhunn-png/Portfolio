// 게임 본체: 한 층의 판정(이동·균·숨기·비눗방울·쪽지)과 그리기.
// 화면 바깥 일(문제 창, 쪽지 창, 잡혔을 때 창, 결과 화면)은 ui 콜백으로 넘긴다.
import { buildStage, lineOfSight, findPath, MAP_VERSION } from './map.js';
import { GERMS, DIFFS, PLAYER_SPEED, GERM_SPEED, SEARCH_LOCK, STUN_TIME, WATER_TIME, MASK_TIME, THROW_RANGE, hideName, FOUND_LINES, MISS_LINES } from './data.js';
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
    this.dark = !!opts.dark && !this.tut; // 마지막 층: 불이 꺼지고 내 주변만 보인다
    this.input = { x: 0, y: 0 };
    this.keys = new Set();
    this.fx = []; this.bubbles = [];
    this.paused = false; this.over = false;
    this.time = 0; this.saveT = 0; this.dirty = true;
    this.locks = {};
    this.doorUnits = groupDoors(this.map.doors);
    this.run = opts.run && opts.run.stageId === opts.stageId && opts.run.mapVersion === MAP_VERSION ? opts.run : this.newRun();
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
      mapVersion: MAP_VERSION, stageId: m.id, diff: this.o.diff, lives: DIFFS[this.o.diff].lives === Infinity ? -1 : DIFFS[this.o.diff].lives,
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
    this.updateDoors(dt);
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
    const sp = PLAYER_SPEED * (DIFFS[this.run.diff].player || 1) * (this.waterT > 0 ? 1.6 : 1) * dt;
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
    const spd = DIFFS[this.run.diff].speed * GERM_SPEED * (this.tut ? 0.6 : 1);
    if (this.canSee(g)) {
      if (g.state !== 'chase') { g.alertT = 1; Sound.spotted(); }
      g.state = 'chase'; g.seen = 0; g.lx = this.px; g.ly = this.py;
    }
    if (g.state === 'chase') {
      g.seen += dt; g.chaseT += dt;
      if (g.def.tires && g.chaseT > 4) { g.tired = 3 * (DIFFS[this.run.diff].tired || 1); g.chaseT = 0; g.state = 'wander'; g.path = null; this.float('헥헥…', g.x, g.y - 0.8, '#8a5cc7'); return; }
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
    if (this.tut) { this.respawn(); this.ui.toast(`${g.def.name}에게 잡혔어요! 튜토리얼이라 괜찮아요. 처음 자리에서 다시 해요.`); return; }
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
        this.germs.push(this.makeGerm('basic', rm.cx + 0.5, rm.cy + 0.5));
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
    c.fillStyle = this.voidColor(); c.fillRect(0, 0, this.vw, this.vh); // 지도 바깥도 건물 바깥처럼 어둡게
    // 카메라
    // 주인공을 늘 화면 가운데에 둔다(가장자리에서도 안내창·단추에 가려지지 않게)
    const camX = this.px * TS - this.vw / 2, camY = this.py * TS - this.vh / 2;
    c.save(); c.translate(-Math.round(camX), -Math.round(camY));
    const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(m.W - 1, Math.ceil((camX + this.vw) / TS)), y1 = Math.min(m.H - 1, Math.ceil((camY + this.vh) / TS));
    // 테마 바닥, 벽, 문틀, 방별 안내판
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.drawSceneTile(c,x,y,m.at(x,y),TS);
    this.drawArchitecture(c,TS);
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
    // 큰 설비는 윗줄 기준으로 세워서 옆을 지나는 사람이 가려지지 않게 한다
    for (const f of m.fixtures) list.push({ y: f.h > 2 ? f.y + 1 : f.y + f.h - 0.05, d: () => this.drawFixture(c, f, TS) });
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
    if (this.dark) this.drawDark(c, TS, camX, camY);
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
    this.drawFixture(c,{x:o.x,y:o.y,w:1,h:1,type:o.art||'cabinet'},TS);
    c.strokeStyle = st === 'found' ? '#4cc36a' : lock ? '#e0524a' : '#d9b869'; c.lineWidth = 2;
    c.strokeRect(o.x*TS+2,o.y*TS+2,TS-4,TS-4);
    // 작은 단서 봉투로 탐색 가능한 가구를 구별한다.
    c.fillStyle = st ? '#a7b6aa' : '#f9ecc8';c.fillRect(cx-TS*.16,cy-TS*.1,TS*.32,TS*.23);
    c.strokeStyle='#9c8052';c.beginPath();c.moveTo(cx-TS*.16,cy-TS*.1);c.lineTo(cx,cy+TS*.02);c.lineTo(cx+TS*.16,cy-TS*.1);c.stroke();
    if (lock) this.label(c, `🔒${Math.ceil(lock)}`, cx, o.y * TS - TS * 0.25, Math.round(TS * 0.34), '#e0524a');
    else if (!st) {
      const b = Math.sin(this.time * 4 + o.id) * TS * 0.06;
      c.fillStyle = '#ffb627'; c.beginPath(); c.arc(cx, o.y * TS - TS * 0.22 + b, TS * 0.2, 0, 7); c.fill();
      this.label(c, '?', cx, o.y * TS - TS * 0.22 + b, Math.round(TS * 0.3), '#fff', '#c97a00');
    } else if (st === 'found') this.label(c, '✓', cx, o.y * TS - TS * 0.2, Math.round(TS * 0.34), '#2e9a4a');
  }

  // 외부 이미지 없이 그리는 테마별 공간과 가구.
  drawSceneTile(c,x,y,v,TS) {
    const m=this.map, T=m.T, rm=m.roomAt(x,y), style=m.room[y*m.W+x]<0 ? (m.S.theme==='garden'?'stone':m.S.theme==='market'?'stone':'wood') : rm?.floorStyle || 'tile';
    const px=x*TS, py=y*TS, garden=m.S.theme==='garden', market=m.S.theme==='market';
    if(v===1) {
      let boundary=false;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(m.at(x+dx,y+dy)!==1) boundary=true;
      if(!boundary){
        c.fillStyle=garden?'#43644b':market?'#514b47':'#25313a';c.fillRect(px,py,TS,TS);
        if(garden && (x*7+y*3)%11===0){c.fillStyle='#628357';c.fillRect(px+TS*.25,py+TS*.2,TS*.2,TS*.12);c.fillRect(px+TS*.38,py+TS*.35,TS*.2,TS*.12);}
        return;
      }
      c.fillStyle=garden?'#536b40':market?'#80574c':'#3c4f60'; c.fillRect(px,py,TS,TS);
      c.fillStyle=garden?'#96b875':T.wallTop; c.fillRect(px+1,py+1,TS-2,TS*.58);
      c.strokeStyle=garden?'#607f47':'rgba(45,62,75,.20)'; c.lineWidth=1;
      c.strokeRect(px+1,py+1,TS-2,TS*.58);
      if(m.at(x,y+1)!==1) {
        c.fillStyle=garden?'#7c5b39':T.wall; c.fillRect(px+1,py+TS*.58,TS-2,TS*.35);
        c.fillStyle='rgba(0,0,0,.15)';c.fillRect(px,py+TS*.93,TS,TS*.07);
      }
      if(garden) { c.fillStyle='#e0c99b';c.fillRect(px+TS*.16,py+TS*.18,TS*.14,TS*.72);c.fillRect(px+TS*.67,py+TS*.18,TS*.14,TS*.72); }
      else {c.fillStyle='rgba(255,255,255,.26)';c.fillRect(px+2,py+2,TS-4,2);}
      return;
    }
    const palettes={wood:['#c7a57b','#d1b18b'],tile:['#e0ddd1','#ebe7da'],wet:['#b7d5d9','#c3e0e1'],cold:['#d0e4e9','#e0eef1'],soil:['#82684a','#8c7050'],stone:['#b8b7a4','#c5c1ad']};
    const pal=palettes[style] || T.floor;
    c.fillStyle=pal[(x+y)&1];c.fillRect(px,py,TS,TS);
    c.strokeStyle=style==='soil'?'#63543d':'rgba(61,76,82,.14)';c.lineWidth=1;
    if(style==='wood') {
      c.beginPath();c.moveTo(px,py+TS*.5);c.lineTo(px+TS,py+TS*.5);c.moveTo(px+TS*((y&1)?.25:.75),py);c.lineTo(px+TS*((y&1)?.25:.75),py+TS*.5);c.stroke();
      c.fillStyle='rgba(94,62,28,.10)';c.fillRect(px+TS*.16,py+TS*.18,TS*.46,1);
    } else if(style==='soil') {
      c.fillStyle='#aa8b63';for(let i=0;i<3;i++)c.fillRect(px+TS*.12,py+TS*(.18+i*.28),TS*.76,TS*.06);
    } else {
      c.strokeRect(px+1,py+1,TS-2,TS-2);
      if(style==='cold' && (x+y)%5===0) {c.fillStyle='rgba(255,255,255,.6)';c.fillRect(px+TS*.22,py+TS*.28,TS*.2,2);}
      if(style==='wet' && (x*3+y)%7===0) {c.fillStyle='#728e96';c.fillRect(px+TS*.35,py+TS*.35,TS*.3,TS*.3);c.fillStyle='#b7d5d9';for(let j=0;j<3;j++)c.fillRect(px+TS*.38,py+TS*(.4+j*.08),TS*.24,1);}
    }
    // 방 가장자리는 띠로 구분한다.
    if(rm && m.room[y*m.W+x]>=0 && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>m.at(x+dx,y+dy)===1)) {c.fillStyle='rgba(51,61,57,.10)';c.fillRect(px,py,TS,TS);}
  }
  drawArchitecture(c,TS) {
    const m=this.map;
    for(const rm of m.rooms) {
      const x=((rm.signX??rm.x0)+.15)*TS,y=((rm.signY??rm.y0)+.08)*TS,w=Math.min(rm.name.length*.28+1.2,rm.x1-rm.x0)*TS;
      c.fillStyle='#334653';c.fillRect(x,y,w,TS*.55);c.fillStyle='#d8b76c';c.fillRect(x,y,TS*.09,TS*.55);
      this.label(c,`${String(rm.id+1).padStart(2,'0')}  ${rm.name}`,x+w/2,y+TS*.27,Math.round(TS*.23),'#fff','#334653');
      // 방 번호와 안내 게시판은 시각 연출이다.
      const bx=((rm.signX??rm.x0)+.2)*TS,by=((rm.signY??rm.y0)+.85)*TS;
      c.fillStyle='#765f47';c.fillRect(bx,by,TS*.56,TS*.67);c.fillStyle='#f3e5ba';c.fillRect(bx+TS*.06,by+TS*.06,TS*.44,TS*.55);
      c.fillStyle='#a47a43';for(let i=0;i<3;i++)c.fillRect(bx+TS*.12,by+TS*(.2+i*.1),TS*.29,TS*.025);
    }
    // 문틀: 복도가 방으로 들어가는 칸마다 문지방을 깔고, 방 쪽 가장자리에 문턱을 그린다
    const garden = m.S.theme === 'garden';
    for (const d of m.doors) {
      const x = d.x * TS, y = d.y * TS;
      c.fillStyle = garden ? '#8a6a43' : '#9b8259'; c.fillRect(x, y, TS, TS);
      c.fillStyle = garden ? '#c9a873' : '#ddc69a'; c.fillRect(x + TS * 0.1, y + TS * 0.1, TS * 0.8, TS * 0.8);
      c.fillStyle = garden ? '#5e4428' : '#344c58';
      if (d.dx) c.fillRect(d.dx > 0 ? x + TS * 0.86 : x, y, TS * 0.14, TS);
      else c.fillRect(x, d.dy > 0 ? y + TS * 0.86 : y, TS, TS * 0.14);
    }
    // 미닫이문: 닫혀 있다가 가까이 가면 양쪽으로 열린다(t: 0 닫힘 ~ 1 열림)
    for (const u of this.doorUnits || []) this.drawDoorLeaves(c, u, TS, garden);
    const e=m.exit, x=e.ix*TS,y=e.iy*TS;
    c.fillStyle='rgba(222,178,61,.26)';c.fillRect(x,y,TS,TS);
    c.strokeStyle='#a58b42';c.lineWidth=2;c.strokeRect(x+3,y+3,TS-6,TS-6);
  }
  // 주인공이나 균이 가까이 오면 문이 열리고, 멀어지면 닫힌다. 주인공이 열 때만 소리를 낸다
  updateDoors(dt) {
    this.doorSndT = Math.max(0, (this.doorSndT || 0) - dt);
    for (const u of this.doorUnits) {
      const hidden = this.run.hidden != null;
      const byPlayer = !hidden && Math.hypot(this.px - u.cx, this.py - u.cy) < 1.9;
      const byGerm = this.germs.some(g => Math.hypot(g.x - u.cx, g.y - u.cy) < 1.5);
      const want = byPlayer || byGerm ? 1 : 0;
      // 짧은 복도 양 끝 문이 같이 열릴 때 소리가 겹치지 않게 0.4초 쉰다
      if (want && !u.opening && u.t < 0.3 && byPlayer && !this.doorSndT) { Sound.door(); this.doorSndT = 0.4; }
      u.opening = !!want;
      u.t = Math.max(0, Math.min(1, u.t + (want ? 4 : -2.5) * dt));
    }
  }
  drawDoorLeaves(c, u, TS, garden) {
    if (u.t >= 0.99) return;
    const k = 1 - u.t, n = u.n, half = n / 2 * k;  // 문짝 한쪽이 덮는 길이(칸)
    // 문짝은 방 쪽 문턱 바로 앞의 띠(두께 0.32칸)에 그린다
    const band = (dir) => dir > 0 ? 0.52 : 0.16;
    const leaf = (a0, a1) => {
      if (a1 - a0 <= 0.01) return;
      let x, y, w, h;
      if (u.dx) { x = (u.x + band(u.dx)) * TS; w = TS * 0.32; y = a0 * TS; h = (a1 - a0) * TS; }
      else { y = (u.y + band(u.dy)) * TS; h = TS * 0.32; x = a0 * TS; w = (a1 - a0) * TS; }
      c.fillStyle = garden ? '#7a5634' : '#8c5a2e'; c.fillRect(x, y, w, h);
      c.fillStyle = garden ? '#c79a62' : '#d39a5c'; c.fillRect(x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4));
      c.fillStyle = '#5b3a1c';
      if (u.dx) c.fillRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4); else c.fillRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4);
    };
    const a = u.dx ? u.y : u.x, b = a + n;
    leaf(a, a + half); leaf(b - half, b);
  }
  voidColor() { const t = this.map.S.theme; return t === 'garden' ? '#43644b' : t === 'market' ? '#514b47' : '#25313a'; }
  // 불 꺼진 층: 주인공 둘레만 밝고 나머지는 어둡다. 쫓아오는 균의 '!'와 열린 탈출문은 어둠 위에 다시 그린다
  drawDark(c, TS, camX, camY) {
    const x = this.px * TS, y = (this.py - 0.35) * TS, f = Math.sin(this.time * 2.2) * 0.08;
    const grd = c.createRadialGradient(x, y, TS * (1.9 + f), x, y, TS * (3.7 + f));
    grd.addColorStop(0, 'rgba(6,8,22,0)'); grd.addColorStop(0.55, 'rgba(6,8,22,0.75)'); grd.addColorStop(1, 'rgba(6,8,22,0.96)');
    c.fillStyle = grd; c.fillRect(Math.round(camX) - 2, Math.round(camY) - 2, this.vw + 4, this.vh + 4);
    for (const g of this.germs) if (g.state === 'chase' && g.stun <= 0 && g.tired <= 0) this.label(c, '!', g.x * TS, (g.y - g.def.size * 0.85) * TS, Math.round(TS * 0.5), '#ff6b5e', '#2a0d0d');
    if (this.run.exitOpen) this.drawExit(c, TS);
  }
  drawFixture(c,f,TS) {
    const x=f.x*TS,y=f.y*TS,w=(f.w||1)*TS,h=(f.h||1)*TS,type=f.type||'cabinet',theme=this.map.S.theme;
    c.save();
    c.fillStyle='rgba(22,31,36,.18)';c.fillRect(x+TS*.1,y+TS*.16,w-TS*.04,h-TS*.06);
    const metal=['fridge','sink','stove','counter','tank'].includes(type);
    const base=metal?'#637f8b':type==='bed'?'#65503a':'#745a43';
    c.fillStyle=base;c.fillRect(x+2,y+2,w-4,h-4);
    c.fillStyle=metal?'#c2d4d8':type==='bed'?'#947552':'#ba9569';c.fillRect(x+4,y+4,w-8,h-TS*.22-4);
    c.strokeStyle=metal?'#425d68':'#654a35';c.lineWidth=Math.max(1,TS*.035);c.strokeRect(x+2,y+2,w-4,h-4);
    if(type==='fridge'||type==='cabinet'||type==='shed') {
      c.beginPath();c.moveTo(x+w*.5,y+4);c.lineTo(x+w*.5,y+h-4);c.stroke();
      c.fillStyle=type==='fridge'?'#557887':'#e3c991';c.fillRect(x+w*.42,y+h*.42,TS*.06,TS*.25);c.fillRect(x+w*.55,y+h*.42,TS*.06,TS*.25);
      if(type==='fridge'){c.fillStyle='#36545e';c.fillRect(x+w*.63,y+h*.15,w*.23,h*.16);c.fillStyle='#78d3c7';c.fillRect(x+w*.67,y+h*.19,w*.12,h*.06);}
    } else if(type==='table'||type==='desk'||type==='bench') {
      c.strokeRect(x+TS*.13,y+TS*.13,w-TS*.26,h-TS*.35);
      if(type==='table') {for(let i=0;i<2;i++){c.fillStyle='#f6eee0';c.beginPath();c.arc(x+w*(.3+i*.4),y+h*.43,TS*.2,0,7);c.fill();c.stroke();}}
      else if(type==='desk'){c.fillStyle='#f3e6c6';c.fillRect(x+w*.25,y+h*.2,w*.35,h*.42);c.fillStyle='#8d6e4b';c.fillRect(x+w*.3,y+h*.3,w*.2,2);}
    } else if(type==='sink') {
      c.fillStyle='#536e79';c.fillRect(x+w*.19,y+h*.2,w*.62,h*.47);c.fillStyle='#a9dbe5';c.fillRect(x+w*.25,y+h*.27,w*.5,h*.3);
      c.fillStyle='#e6eff2';c.fillRect(x+w*.47,y+h*.08,w*.06,h*.27);
    } else if(type==='stove') {
      for(let i=0;i<2;i++){c.fillStyle='#354b55';c.beginPath();c.arc(x+w*(.3+i*.4),y+h*.42,TS*.22,0,7);c.fill();c.strokeStyle='#95a5ad';c.beginPath();c.arc(x+w*(.3+i*.4),y+h*.42,TS*.12,0,7);c.stroke();}
    } else if(type==='shelf'||type==='crate'||type==='stall') {
      for(let i=1;i<3;i++){c.fillStyle='#795736';c.fillRect(x+3,y+h*i/3,w-6,TS*.045);}
      const colors=theme==='dairy'?['#f0eee1','#d6b459','#d0d8d1']:theme==='market'?['#ce704c','#8aa362','#e1b261']:['#89a866','#d3914b','#b96157'];
      for(let i=0;i<6;i++){c.fillStyle=colors[i%3];c.fillRect(x+w*(.12+(i%3)*.27),y+h*(.17+Math.floor(i/3)*.34),w*.17,h*.2);}
      if(type==='stall'){c.fillStyle='#bd6752';c.fillRect(x+2,y+2,w-4,h*.22);for(let i=0;i<5;i++){c.fillStyle=i%2?'#bd6752':'#f0d7ae';c.fillRect(x+2+i*(w-4)/5,y+2,(w-4)/5,h*.22);}}
    } else if(type==='bed') {
      for(let i=0;i<6;i++){const X=x+w*(.17+(i%3)*.32),Y=y+h*(.3+Math.floor(i/3)*.4);c.fillStyle='#476942';c.fillRect(X-TS*.1,Y-TS*.04,TS*.2,TS*.26);c.fillStyle=theme==='garden'&&f.roomId===3?'#cf6150':'#79a05d';c.beginPath();c.ellipse(X,Y,TS*.18,TS*.1,-.5,0,7);c.fill();}
    } else if(type==='tank') {c.fillStyle='#94b7bf';c.beginPath();c.ellipse(x+w/2,y+h*.42,w*.35,h*.28,0,0,7);c.fill();c.stroke();}
    else if(type==='cooler') {
      // 가운데 냉장 설비: 환기구 줄과 온도 표시창
      c.fillStyle='#9fc3cf';c.fillRect(x+TS*.3,y+TS*.3,w-TS*.6,h-TS*.6);
      c.fillStyle='#6f95a3';for(let i=1;i<h/TS-1;i++)c.fillRect(x+TS*.6,y+i*TS+TS*.2,w-TS*1.2,TS*.08);
      c.fillStyle='#2f4752';c.fillRect(x+w/2-TS*1.3,y+TS*.45,TS*2.6,TS*.7);
      this.label(c,'❄ 냉장 설비',x+w/2,y+TS*.8,Math.round(TS*.3),'#bff3ff','#2f4752');
    }
    else if(type==='board') {c.fillStyle='#f0e2bd';c.fillRect(x+w*.12,y+h*.15,w*.76,h*.58);c.fillStyle='#93744b';for(let i=0;i<3;i++)c.fillRect(x+w*.22,y+h*(.27+i*.12),w*.48,1);}
    c.restore();
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

// 붙어 있는 문 칸(같은 방향)을 문 하나로 묶는다
function groupDoors(doors) {
  const units = [], used = new Set(), key = (d) => `${d.x},${d.y}`;
  const byKey = new Map(doors.map(d => [key(d), d]));
  for (const d of doors) {
    if (used.has(key(d))) continue;
    const cells = [d]; used.add(key(d));
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      for (const [ox, oy] of d.dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]) {
        const n = byKey.get(`${c.x + ox},${c.y + oy}`);
        if (n && !used.has(key(n)) && n.dx === d.dx && n.dy === d.dy) { used.add(key(n)); cells.push(n); }
      }
    }
    const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    units.push({ x, y, dx: d.dx, dy: d.dy, n: cells.length, cx: (x + Math.max(...xs) + 1) / 2, cy: (y + Math.max(...ys) + 1) / 2, t: 0, opening: false });
  }
  return units;
}
