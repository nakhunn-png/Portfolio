// 한 판의 진행과 그리기: 달리기(숫자 문), 문제 사이 이벤트(능력 문·균 무리·움직이는 친구 문·옷 문), 총알, 보스전.
// 화면(DOM)은 ui.js가 맡고, 여기서는 캔버스만 그린다. 알릴 일이 생기면 opts.on(이름, 값)을 부른다.
(function (root) {
  'use strict';
  const D = root.GRD, Q = root.GRQ;
  const CAM = 12;          // 원근 거리(작을수록 원근감이 세다. 크면 먼 문도 잘 보인다)
  const VRUN = 16;         // 달리는 속도(초당 거리)
  const GATE_LEAD = 3.5;   // 숫자 문은 도착 3.5초 전에 나타난다
  const EV_Z = 42;         // 이벤트가 나타나는 거리
  const ZFAR = 140;
  const MAX_SHOWN = 40;
  const BOSS_Z = 5, BOSS_H = 3.6; // 보스가 멈추는 거리, 보스 키(아이 키의 몇 배)
  const BULLET_V = 48, BULLET_MAXZ = 62;

  // 능력 문. max에 닿으면 더 나오지 않는다
  const POWERS = {
    fire: { name: '연사 UP', icon: '⚡', max: 4, color: '#ff9f1c' },
    pierce: { name: '관통탄', icon: '➶', max: 2, color: '#8a5cc7' },
    split: { name: '분열탄', icon: '✦', max: 2, color: '#2b9fd6' },
    shield: { name: '방어막', icon: '🛡', max: 99, color: '#3cb35a' },
    move: { name: '이동 UP', icon: '👟', max: 2, color: '#e0527d' },
  };

  let cv, g, W = 0, H = 0, DPR = 1;
  const img = {};
  let S = null;       // 한 판 상태
  let last = 0;

  function loadImages(list) {
    return Promise.all(list.map((src) => new Promise((res) => {
      const im = new Image(); im.onload = () => res(); im.onerror = () => res(); im.src = src; img[src] = im;
    })));
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ---------- 원근 ----------
  const L = () => {
    const portrait = H > W;
    const hY = H * (portrait ? 0.36 : 0.32);
    const gY = H * (portrait ? 0.8 : 0.78);
    const half = Math.min(W * (portrait ? 0.47 : 0.36), H * 0.62);
    const base = Math.min(H * (portrait ? 0.12 : 0.17), W * 0.16); // z=0에서 아이 키
    return { hY, gY, half, base, cx: W / 2 };
  };
  function proj(x, z, l) {
    const s = CAM / (z + CAM);
    return { x: l.cx + x * l.half * s, y: l.hY + (l.gY - l.hY) * s, s };
  }
  const laneX = (i, n) => (n === 2 ? [-0.5, 0.5] : [-0.66, 0, 0.66])[i];
  const rnd = (n) => Math.floor(Math.random() * n);
  const ease = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2); // 살짝 튀어나오는 easeOutBack

  // ---------- 한 판 시작 ----------
  function start(opts) {
    const st = D.STAGES[opts.stage];
    S = {
      opts, st, n: st.n, kid: opts.kid || 0, wear: opts.wear || null, owned: (opts.owned || []).slice(),
      mode: 'run', time: 0, dist: 0,
      queue: Q.pick(st.types, D.RUN_COUNT), qi: 0, retried: 0, done: 0,
      bossQs: Q.pick(st.types, D.BOSS_COUNT + 2), bi: 0,
      correct: 0, total: 0, streak: 0,
      lane: Math.floor(st.n / 2), crowdX: laneX(Math.floor(st.n / 2), st.n),
      members: [], lost: [], parts: [], texts: [], bullets: [], ev: [],
      stats: { fire: 0, pierce: 0, split: 0, shield: 0, move: 0 },
      gate: null, oldGate: null, cur: null, boss: null, shots: [],
      dash: false, shake: 0, timer: 0, fireT: 0, costumeDone: false,
    };
    for (let i = 0; i < D.START_FRIENDS; i++) addMember(0, 0, true);
    nextQuestion();
    emitStats();
  }

  // 친구 자리(해바라기 씨 배열). 0번은 주인공, 맨 앞 가운데
  function slot(i) {
    if (i === 0) return { dx: 0, dz: 0.6 };
    const r = 0.17 * Math.sqrt(i), a = i * 2.39996;
    return { dx: r * Math.cos(a) * 0.85, dz: 0.2 + r * Math.sin(a) * 1.3 - 0.35 };
  }
  // 새 친구: (x, z)에서 톡 튀어나와 무리로 달려온다
  function addMember(x, z, instant) {
    const kid = S.members.length === 0 ? S.kid : rnd(D.KIDS.length);
    const i = S.members.length, t = slot(i);
    S.members.push({ kid, x: instant ? S.crowdX + t.dx : x, z: instant ? t.dz : z, ph: Math.random() * 6, pop: instant ? 1 : 0, hop: instant ? 0 : 1 });
  }
  function gain(k, x, z) {
    for (let i = 0; i < k; i++) addMember(x + (Math.random() - 0.5) * 0.3, z + Math.random() * 1.5);
  }
  // 떨어져 나가는 친구: 데굴데굴 구르며 뒤로 사라진다
  function lose(k) {
    let n = 0;
    for (let i = 0; i < k && S.members.length > 1; i++, n++) {
      const m = S.members.pop();
      S.lost.push({ kid: m.kid, x: m.x, z: m.z, vx: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random()), vy: 3 + Math.random() * 2, y: 0, rot: 0, life: 1 });
    }
    return n;
  }
  const count = () => S.members.length;

  // ---------- 숫자 문 ----------
  function leadTime() {
    const mul = (D.SPEEDS[S.opts.speed] || D.SPEEDS.normal).mul;
    const bonus = Math.min(1.5, Math.max(0, S.streak - 4) * 0.3);
    return Math.max(GATE_LEAD + 1, S.st.t * mul - bonus);
  }

  function nextQuestion() {
    if (S.qi >= S.queue.length) return bossIntro();
    const q = S.queue[S.qi];
    S.cur = { q, ch: Q.choices(q, S.n), t: 0, need: leadTime() };
    S.gate = null; S.dash = false;
    spawnEvent();
    emit('question', { q, ch: S.cur.ch, no: S.done + 1, of: Math.max(S.queue.length, D.RUN_COUNT) });
  }
  function spawnGate() {
    S.gate = { q: S.cur.q, ch: S.cur.ch, z: VRUN * GATE_LEAD, judged: false, pick: -1, rects: [] };
  }

  function judgeGate() {
    const gt = S.gate; gt.judged = true;
    S.oldGate = gt; S.gate = null;
    let best = 0;
    for (let i = 1; i < S.n; i++) if (Math.abs(laneX(i, S.n) - S.crowdX) < Math.abs(laneX(best, S.n) - S.crowdX)) best = i;
    gt.pick = best;
    const c = gt.ch[best];
    answer(gt.q, c, 'run');
    S.qi++; S.done++;
    const gx = laneX(best, S.n);
    if (c.ok) {
      gain(D.GAIN, gx, 2.5);
      popup('정답! +' + D.GAIN, '#2e9e4f', gx, 1.5, 1.3);
      sparkle(gx, 1);
      nextQuestion();
    } else {
      const n = lose(D.LOSS);
      popup(n ? '−' + n : '앗!', '#e0524a', gx, 1.5, 1.3);
      S.shake = 0.4;
      if (S.retried < D.RETRY_MAX && !gt.q.retry) { S.queue.push(Object.assign({}, gt.q, { retry: true })); S.retried++; }
      S.mode = 'hint';
      emit('hint', { q: gt.q, picked: c, after: 'run' });
    }
  }

  // 정답·오답 기록(ui.js가 저장)
  function answer(q, c, where) {
    S.total++;
    if (c.ok) { S.correct++; S.streak++; root.GRSound.good(); } else { S.streak = 0; root.GRSound.bad(); }
    emit('answer', { q, c, where });
  }

  // ---------- 문제 사이 이벤트 ----------
  function powerChoices() {
    const st = S.stats;
    return Object.keys(POWERS).filter((k) => (k === 'shield' ? st.shield < 4 : st[k] < POWERS[k].max));
  }
  function spawnEvent() {
    const r = Math.random();
    const costumeLeft = D.COSTUMES.filter((c) => !S.owned.includes(c.k));
    if (!S.costumeDone && S.qi >= 3 && costumeLeft.length && Math.random() < 0.3) {
      S.costumeDone = true;
      const c = costumeLeft[0];
      return S.ev.push({ type: 'costume', z: EV_Z, x: laneX(rnd(S.n), S.n), c, req: c.req, done: false });
    }
    if (r < 0.38) {
      const list = Q.shuffle(powerChoices()).slice(0, S.n);
      if (list.length) return S.ev.push({ type: 'power', z: EV_Z, list, done: false, pick: -1 });
    }
    if (r < 0.7) {
      // 균 무리: 1~2마리, 줄마다 하나
      const lanes = Q.shuffle([...Array(S.n).keys()]).slice(0, 1 + rnd(Math.min(2, S.n)));
      const hp = 2 + Math.floor(S.opts.stage / 2);
      lanes.forEach((ln, k) => S.ev.push({ type: 'enemy', z: EV_Z + k * 4, x: laneX(ln, S.n), hp, max: hp, flash: 0, dead: false }));
      return;
    }
    // 좌우로 움직이는 친구 문: 총알을 맞힐수록 숫자가 커진다
    S.ev.push({ type: 'mgate', z: EV_Z, x: 0, ph: Math.random() * 6, val: 1, bump: 0, done: false });
  }

  function applyPower(k, x) {
    const st = S.stats, p = POWERS[k];
    if (k === 'shield') st.shield = Math.min(4, st.shield + 1);
    else st[k] = Math.min(p.max, st[k] + 1);
    popup(p.icon + ' ' + p.name, p.color, x, 1.5, 1.1);
    sparkle(x, 1);
    root.GRSound.good();
    emitStats();
  }
  function emitStats() { emit('stats', { ...S.stats }); }

  function updateEvents(dt, v) {
    for (const e of S.ev) {
      if (e.type === 'enemy') {
        if (e.dead) { e.life -= dt; continue; }
        e.z -= (v + 3) * dt;
        e.flash = Math.max(0, e.flash - dt);
        if (e.z <= 0.8 && Math.abs(e.x - S.crowdX) < 0.33) {
          e.dead = true; e.life = 0.4;
          if (S.stats.shield > 0) { S.stats.shield--; emitStats(); popup('🛡 막았다!', '#3cb35a', e.x, 1, 1); root.GRSound.move(); }
          else { const n = lose(2); popup(n ? '−' + n : '앗!', '#e0524a', e.x, 1, 1.1); S.shake = 0.35; root.GRSound.hit(); }
          burst(e.x, e.z, ['#9be15d', '#6cc644', '#fff']);
        }
        continue;
      }
      e.z -= v * dt;
      if (e.type === 'mgate') { e.ph += dt * 1.1; e.x = Math.sin(e.ph) * 0.62; e.bump = Math.max(0, e.bump - dt); }
      if (e.done || e.z > 0.6) continue;
      e.done = true;
      if (e.type === 'power') {
        let best = 0;
        for (let i = 1; i < e.list.length; i++) if (Math.abs(laneX(i, S.n) - S.crowdX) < Math.abs(laneX(best, S.n) - S.crowdX)) best = i;
        if (Math.abs(laneX(best, S.n) - S.crowdX) < 0.3) { e.pick = best; applyPower(e.list[best], laneX(best, S.n)); }
      }
      if (e.type === 'mgate' && Math.abs(e.x - S.crowdX) < 0.45) {
        e.hit = true; gain(e.val, e.x, 2); popup('친구 +' + e.val, '#2b7bd6', e.x, 1.5, 1.3); sparkle(e.x, 1); root.GRSound.good();
      }
      if (e.type === 'costume' && Math.abs(e.x - S.crowdX) < 0.3) {
        if (count() >= e.req) {
          e.hit = true; S.owned.push(e.c.k); S.wear = e.c.k;
          popup(e.c.icon + ' ' + e.c.name + '!', '#c8372d', e.x, 1.5, 1.3); sparkle(e.x, 1); sparkle(e.x, 1); root.GRSound.win();
          emit('costume', { k: e.c.k });
        } else {
          e.fail = true; popup(`친구 ${e.req}명이 필요해요`, '#5b6475', e.x, 1.5, 0.8); root.GRSound.bad();
        }
      }
    }
    S.ev = S.ev.filter((e) => (e.type === 'enemy' ? (!e.dead || e.life > 0) && e.z > -4 : e.z > -4));
  }

  // ---------- 총알 ----------
  function shoot(dt) {
    const st = S.stats;
    S.fireT -= dt;
    if (S.fireT > 0) return;
    S.fireT = 1 / (2.6 + st.fire * 1.3);
    const dirs = st.split === 0 ? [0] : st.split === 1 ? [-0.012, 0, 0.012] : [-0.02, -0.01, 0, 0.01, 0.02];
    for (const d of dirs) S.bullets.push({ x: S.crowdX, z: 1.2, vx: d, pierce: st.pierce, hitIds: [] });
  }
  function updateBullets(dt) {
    for (const b of S.bullets) {
      const dz = BULLET_V * dt;
      b.z += dz; b.x += b.vx * dz;
      for (const e of S.ev) {
        if (b.dead) break;
        if (e.type === 'enemy' && !e.dead && Math.abs(b.x - e.x) < 0.2 && Math.abs(b.z - e.z) < 1.5 && !b.hitIds.includes(e)) {
          b.hitIds.push(e);
          e.hp--; e.flash = 0.12;
          if (e.hp <= 0) { e.dead = true; e.life = 0.35; burst(e.x, e.z, ['#9be15d', '#ffd84a', '#fff']); root.GRSound.move(); }
          if (b.pierce > 0) b.pierce--; else b.dead = true;
        }
        if (e.type === 'mgate' && !e.done && Math.abs(b.x - e.x) < 0.3 && Math.abs(b.z - e.z) < 1.5) {
          e.val = Math.min(10, e.val + 1); e.bump = 0.15; b.dead = true;
        }
      }
    }
    S.bullets = S.bullets.filter((b) => !b.dead && b.z < BULLET_MAXZ && Math.abs(b.x) < 1.3);
  }

  // ---------- 보스 ----------
  function bossIntro() {
    S.gate = null; S.cur = null;
    const b = D.BOSSES[S.st.boss];
    S.boss = { ...b, key: S.st.boss, z: 45, hp: b.hp, max: b.hp, hurt: 0, out: 0 };
    S.center = true; // 무리를 길 가운데로 모은다
    S.mode = 'bossIn'; S.timer = 0;
    root.GRSound.boss();
    emit('bossIn', { name: b.name });
  }
  function bossAsk() {
    S.mode = 'bossQ';
    const q = S.bossQs[S.bi];
    S.bossCur = { q, ch: Q.choices(q, 3) };
    emit('bossQuestion', { q, ch: S.bossCur.ch, no: S.bi + 1, of: D.BOSS_COUNT, hp: S.boss.hp, max: S.boss.max });
  }
  // 보스에 주는 피해: 친구 수 × 능력 보너스
  const bossDamage = () => Math.round(count() * (1 + 0.15 * S.stats.fire + 0.2 * S.stats.pierce + 0.2 * S.stats.split));
  function bossAnswer(i) {
    if (!S || S.mode !== 'bossQ') return;
    const { q, ch } = S.bossCur; const c = ch[i];
    answer(q, c, 'boss');
    S.bi++;
    if (c.ok) {
      const l = L(), bp = proj(0, S.boss.z, l);
      const by = bp.y - l.base * BOSS_H * bp.s * 0.55;
      S.members.slice(0, 18).forEach((m, k) => {
        const p = proj(m.x, m.z, l);
        S.shots.push({ x0: p.x, y0: p.y - l.base * p.s, x1: bp.x + (Math.random() - 0.5) * 60, y1: by + (Math.random() - 0.5) * 50, t: -k * 0.04 });
      });
      S.mode = 'bossHit'; S.timer = 0; S.dmg = bossDamage();
    } else {
      const n = lose(D.LOSS); popup(n ? '−' + n : '앗!', '#e0524a', 0, 1.5, 1.2); S.shake = 0.5;
      S.mode = 'hint';
      emit('hint', { q, picked: c, after: 'boss' });
    }
  }
  function afterBossStep() {
    if (S.boss.hp <= 0 || S.bi >= D.BOSS_COUNT) { S.mode = 'bossOut'; S.timer = 0; root.GRSound.win(); for (let i = 0; i < 4; i++) sparkle(0, S.boss.z, true); }
    else bossAsk();
  }

  // 힌트 창을 닫으면 ui.js가 부른다
  function resume() {
    if (!S || S.mode !== 'hint') return;
    if (S.boss) { S.mode = 'bossQ'; afterBossStep(); }
    else { S.mode = 'run'; nextQuestion(); }
  }

  function finish() {
    const acc = S.total ? S.correct / S.total : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    S.mode = 'end';
    emit('end', { stage: S.opts.stage, correct: S.correct, total: S.total, acc, stars, friends: count(), beat: S.boss.hp <= 0 });
  }

  function emit(name, v) { if (S && S.opts.on) S.opts.on(name, v); }

  // ---------- 효과 ----------
  // 숫자 팝업: (x, z) 위에서 크게 튀어나왔다가 떠오르며 사라진다
  function popup(t, color, x, z, size) {
    const l = L(), p = proj(x, z, l);
    S.texts.push({ t, color, x: p.x, y: p.y - l.base * 1.5, life: 1.3, max: 1.3, size: size || 1 });
  }
  function sparkle(x, z, big) {
    const l = L(), p = proj(x, z, l);
    const cols = ['#ffd84a', '#ff8a3d', '#5cc8ff', '#7be07b', '#ff7eb6'];
    for (let i = 0; i < (big ? 30 : 18); i++) {
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
      S.parts.push({ x: p.x, y: p.y - l.base * (big ? 2 : 0.8), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.9 + Math.random() * 0.4, c: cols[i % cols.length], r: 4 + Math.random() * 5 });
    }
  }
  function burst(x, z, cols) {
    const l = L(), p = proj(x, z, l);
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160;
      S.parts.push({ x: p.x, y: p.y - l.base * 0.4 * p.s, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.5 + Math.random() * 0.3, c: cols[i % cols.length], r: 3 + Math.random() * 4 });
    }
  }

  // ---------- 조작 ----------
  function setLane(i) {
    if (!S || i < 0 || i >= S.n || i === S.lane) return;
    S.lane = i; root.GRSound.move();
  }
  function moveBy(d) { if (S) setLane(S.lane + d); }
  function tap(px, py) {
    if (!S || S.mode !== 'run') return;
    // 숫자 문을 직접 누르면 그 줄로 가면서 빨리 달린다(답을 아는 아이가 기다리지 않게)
    if (S.gate && !S.gate.judged) {
      const r = S.gate.rects.find((r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1);
      if (r) { setLane(r.i); S.dash = true; return; }
    }
    setLane(Math.min(S.n - 1, Math.floor((px / W) * S.n)));
  }

  // ---------- 매 프레임 ----------
  function update(dt) {
    S.time += dt;
    const l = L();
    S.shake = Math.max(0, S.shake - dt);
    const target = S.center ? 0 : laneX(S.lane, S.n);
    S.crowdX += (target - S.crowdX) * Math.min(1, dt * (9 + S.stats.move * 5));

    let v = 0;
    if (S.mode === 'run') v = VRUN;
    else if (S.mode === 'bossIn') v = VRUN * Math.max(0, 1 - S.timer / 1.6);
    S.dist += v * dt;

    if (S.mode === 'run') {
      S.cur.t += dt;
      if (!S.gate && S.cur.t >= S.cur.need - GATE_LEAD) spawnGate();
      if (S.gate) {
        S.gate.z -= v * (S.dash ? 2.5 : 1) * dt;
        if (!S.gate.judged && S.gate.z <= 0.6) judgeGate();
      }
      shoot(dt);
    }
    if (S.mode === 'run' || S.mode === 'bossIn') updateEvents(dt, v);
    updateBullets(dt);
    // 지나간 문은 뒤로 밀려나며 사라진다(힌트 창이 떠 있는 동안은 멈춤)
    if (S.oldGate) { S.oldGate.z -= (S.mode === 'hint' ? 0 : Math.max(v, 10)) * dt; if (S.oldGate.z < -4) S.oldGate = null; }

    // 친구들이 자리로 모인다. 새 친구는 톡 튀어나와 뛰어 온다
    S.members.forEach((m, i) => {
      const t = slot(i);
      m.x += (S.crowdX + t.dx - m.x) * Math.min(1, dt * 6);
      m.z += (t.dz - m.z) * Math.min(1, dt * 3);
      m.x = Math.max(-1, Math.min(1, m.x));
      if (m.pop < 1) m.pop = Math.min(1, m.pop + dt * 3.5);
      if (m.hop > 0) m.hop = Math.max(0, m.hop - dt * 1.8);
    });
    S.lost.forEach((m) => { m.z -= dt * 7; m.x += m.vx * dt; m.y += m.vy * dt; m.vy -= 14 * dt; m.rot += m.vx * dt * 6; m.life -= dt * 1.2; });
    S.lost = S.lost.filter((m) => m.life > 0);
    S.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; });
    S.parts = S.parts.filter((p) => p.life > 0);
    S.texts.forEach((t) => { t.y -= 45 * dt; t.life -= dt; });
    S.texts = S.texts.filter((t) => t.life > 0);

    if (S.boss) {
      const b = S.boss;
      b.hurt = Math.max(0, b.hurt - dt);
      if (S.mode === 'bossIn') { S.timer += dt; b.z += (BOSS_Z - b.z) * Math.min(1, dt * 2.2); if (S.timer > 1.8) bossAsk(); }
      if (S.mode === 'bossHit') {
        S.timer += dt;
        S.shots.forEach((s) => { s.t += dt; });
        if (S.timer > 0.75 && S.dmg) {
          b.hp = Math.max(0, b.hp - S.dmg); b.hurt = 0.5;
          const p = proj(0, b.z, l);
          S.texts.push({ t: '−' + S.dmg, color: '#ff4d4d', x: p.x + 70, y: p.y - l.base * BOSS_H * p.s, life: 1.3, max: 1.3, size: 1.4 });
          S.dmg = 0; root.GRSound.hit();
        }
        if (S.timer > 1.4) { S.shots = []; afterBossStep(); }
      }
      if (S.mode === 'bossOut') { S.timer += dt; b.out = Math.min(1, S.timer / 1.2); if (S.timer > 1.9) finish(); }
    }
  }

  // ---------- 그리기 ----------
  function drawBg(l) {
    const sky = g.createLinearGradient(0, 0, 0, l.hY);
    sky.addColorStop(0, '#8fd0ff'); sky.addColorStop(1, '#d9f0ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, l.hY + 2);
    const bg = img['img/bg.webp'];
    if (bg && bg.width) {
      const h = Math.max(l.hY / 0.78, W / (bg.width / bg.height));
      const w = h * (bg.width / bg.height);
      const x = Math.min(0, Math.max(W - w, W / 2 - w * 0.55));
      g.drawImage(bg, x, l.hY - h * 0.78, w, h);
    }
    const grass = g.createLinearGradient(0, l.hY, 0, H);
    grass.addColorStop(0, '#9ccf6a'); grass.addColorStop(1, '#5fae4a');
    g.fillStyle = grass; g.fillRect(0, l.hY, W, H - l.hY);
    const a = proj(-1.08, ZFAR, l), b = proj(1.08, ZFAR, l), c = proj(1.08, -3.5, l), d = proj(-1.08, -3.5, l);
    g.fillStyle = '#e9cf96';
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fill();
    g.strokeStyle = '#b8a37a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(d.x, d.y); g.moveTo(b.x, b.y); g.lineTo(c.x, c.y); g.stroke();
    // 달리는 느낌: 바닥 무늬·줄 점선·울타리 기둥이 다가온다
    const gap = 5, off = S.dist % gap;
    for (let k = 24; k >= 0; k--) {
      const z = k * gap - off;
      if (z < -3 || z > ZFAR) continue;
      const p1 = proj(-1, z, l), p2 = proj(1, z, l);
      g.fillStyle = 'rgba(160,120,60,0.18)';
      g.fillRect(p1.x, p1.y - 2 * p1.s, p2.x - p1.x, 4 * p1.s);
      g.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 1; i < S.n; i++) {
        const lx = (laneX(i - 1, S.n) + laneX(i, S.n)) / 2;
        const q1 = proj(lx, z, l), q2 = proj(lx, z + gap * 0.45, l);
        g.beginPath(); g.moveTo(q1.x - 4 * q1.s, q1.y); g.lineTo(q1.x + 4 * q1.s, q1.y); g.lineTo(q2.x + 4 * q2.s, q2.y); g.lineTo(q2.x - 4 * q2.s, q2.y); g.fill();
      }
      for (const sx of [-1.35, 1.35]) {
        const p = proj(sx, z, l), h = l.base * 0.75 * p.s, w = Math.max(2, 10 * p.s);
        g.fillStyle = '#8a5a32'; g.fillRect(p.x - w / 2, p.y - h, w, h);
      }
    }
    for (const sx of [-1.35, 1.35]) {
      g.strokeStyle = '#9b6a3c'; g.lineWidth = 4;
      for (const hy of [0.55, 0.3]) {
        const p = proj(sx, ZFAR, l), q = proj(sx, -3, l);
        g.beginPath(); g.moveTo(p.x, p.y - l.base * 0.75 * p.s * hy * 1.3); g.lineTo(q.x, q.y - l.base * 0.75 * q.s * hy * 1.3); g.stroke();
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  const fade = (z) => (z < 0 ? Math.max(0, 1 + z / 3.5) : 1);

  // 문 틀 하나 그리기: 기둥·지붕·살 + 가운데 판. 판 안 글씨는 label(그리기 함수)이 그린다
  function frame(cx, z, w, h, l, pillar, roof, board, label) {
    const c = proj(cx, z, l);
    const W2 = w * c.s, H2 = h * c.s;
    const x0 = c.x - W2 / 2, y0 = c.y - H2, pw = Math.max(3, W2 * 0.07);
    g.fillStyle = pillar;
    g.fillRect(x0, y0, pw, H2); g.fillRect(x0 + W2 - pw, y0, pw, H2);
    g.fillStyle = roof;
    g.beginPath(); g.moveTo(x0 - W2 * 0.06, y0 + H2 * 0.05); g.lineTo(x0 + W2 * 1.06, y0 + H2 * 0.05); g.lineTo(x0 + W2 * 0.94, y0 - H2 * 0.06); g.lineTo(x0 + W2 * 0.06, y0 - H2 * 0.06); g.closePath(); g.fill();
    g.fillStyle = pillar;
    g.fillRect(x0, y0 + H2 * 0.05, W2, H2 * 0.06);
    for (let k = 1; k < 7; k++) g.fillRect(x0 + (W2 * k) / 7 - pw * 0.2, y0 + H2 * 0.05, pw * 0.4, H2 * 0.16);
    const bw = W2 * 0.78, bh = H2 * 0.4, bx = c.x - bw / 2, by = y0 + H2 * 0.2;
    g.fillStyle = board; g.strokeStyle = pillar; g.lineWidth = Math.max(2, W2 * 0.04);
    roundRect(bx, by, bw, bh, bw * 0.12); g.fill(); g.stroke();
    label(c.x, by + bh * 0.54, bw, bh);
    return { x0, x1: x0 + W2, y0: y0 - H2 * 0.1, y1: c.y };
  }
  function text(t, x, y, size, color) {
    g.fillStyle = color; g.font = `900 ${Math.round(size)}px Ssurround, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
  }
  const laneW = (l) => (2 / S.n) * l.half * 0.86;

  // 홍살문 모양 숫자 문
  function drawGate(gt, l) {
    const out = [];
    if (gt.z < -3.5) return out;
    g.globalAlpha = fade(gt.z);
    for (let i = 0; i < S.n; i++) {
      const w = laneW(l), h = Math.min(w * 1.25, l.base * 2.4);
      let tint = null;
      if (gt.judged && i === gt.pick) tint = gt.ch[i].ok ? '#3cb35a' : '#e0524a';
      const r = frame(laneX(i, S.n), gt.z, w, h, l, tint || '#c8372d', '#3d4a63', '#fff6dc', (x, y, bw, bh) => text(String(gt.ch[i].v), x, y, bh * 0.8, '#2b2f3a'));
      out.push({ i, ...r });
    }
    g.globalAlpha = 1;
    return out;
  }

  // 능력 문: 파란 지붕, 판에 아이콘과 이름
  function drawPower(e, l) {
    if (e.z < -3.5) return;
    g.globalAlpha = fade(e.z);
    e.list.forEach((k, i) => {
      const p = POWERS[k], w = laneW(l) * 0.92, h = Math.min(w * 1.1, l.base * 2.1);
      const picked = e.pick === i;
      frame(laneX(i, S.n), e.z, w, h, l, picked ? '#ffd84a' : p.color, '#2f5d8a', '#ffffff', (x, y, bw, bh) => {
        text(p.icon, x, y - bh * 0.18, bh * 0.42, p.color);
        text(p.name, x, y + bh * 0.24, Math.min(bh * 0.28, bw * 0.2), '#2b2f3a');
      });
    });
    g.globalAlpha = 1;
  }

  // 움직이는 친구 문: 총알을 맞히면 숫자가 커진다
  function drawMgate(e, l) {
    if (e.z < -3.5) return;
    g.globalAlpha = fade(e.z);
    const w = laneW(l) * 0.95 * (1 + e.bump), h = Math.min(w * 1.05, l.base * 2);
    frame(e.x, e.z, w, h, l, e.hit ? '#ffd84a' : '#2b7bd6', '#1f3d66', '#eaf5ff', (x, y, bw, bh) => {
      text('친구', x, y - bh * 0.22, bh * 0.26, '#2b7bd6');
      text('+' + e.val, x, y + bh * 0.16, bh * 0.56, '#1f3d66');
    });
    // 좌우 화살표(움직이는 문 표시)
    const c = proj(e.x, e.z, l), a = 8 + 14 * c.s, ww = laneW(l) * c.s * 0.62;
    g.fillStyle = 'rgba(31,61,102,0.55)';
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(c.x + sd * (ww + a), c.y - a); g.lineTo(c.x + sd * ww, c.y - a * 1.6); g.lineTo(c.x + sd * ww, c.y - a * 0.4); g.closePath(); g.fill(); }
    g.globalAlpha = 1;
  }

  // 옷 문: 조건(친구 수)을 채우면 옷을 얻는다
  function drawCostume(e, l) {
    if (e.z < -3.5) return;
    g.globalAlpha = fade(e.z);
    const ok = count() >= e.req;
    const w = laneW(l) * 0.95, h = Math.min(w * 1.2, l.base * 2.3);
    frame(e.x, e.z, w, h, l, e.hit ? '#ffd84a' : '#8a5cc7', '#4a2d73', '#fff3fb', (x, y, bw, bh) => {
      text(e.c.icon, x, y - bh * 0.15, bh * 0.45, '#8a5cc7');
      text(`친구 ${e.req}명`, x, y + bh * 0.26, Math.min(bh * 0.24, bw * 0.18), ok ? '#2e9e4f' : '#e0524a');
    });
    g.globalAlpha = 1;
  }

  function drawEnemy(e, l) {
    const p = proj(e.x, e.z, l);
    const im = img['img/germ_basic.png'];
    if (!im || !im.width || e.z < -3.5) return;
    const k = e.dead ? Math.max(0, e.life / 0.4) : 1;
    const h = l.base * 0.9 * p.s * (e.dead ? 1 + (1 - k) * 0.6 : 1), w = h * (im.width / im.height);
    g.save(); g.globalAlpha = k;
    g.translate(p.x, p.y - Math.abs(Math.sin(S.time * 7 + e.x * 5)) * h * 0.12);
    if (e.flash) g.filter = 'brightness(1.8)';
    g.drawImage(im, -w / 2, -h, w, h); g.restore();
    if (!e.dead) {
      // 체력 숫자
      const r = Math.max(10, h * 0.2);
      g.fillStyle = '#e0524a'; g.beginPath(); g.arc(p.x, p.y - h - r * 0.6, r, 0, Math.PI * 2); g.fill();
      text(String(e.hp), p.x, p.y - h - r * 0.55, r * 1.3, '#fff');
    }
  }

  // 엽전 총알
  function drawBullet(b, l) {
    const p = proj(b.x, b.z, l);
    const r = Math.max(3, l.base * 0.1 * p.s);
    const y = p.y - l.base * 0.55 * p.s;
    g.fillStyle = '#ffcf3a'; g.strokeStyle = '#b07d10'; g.lineWidth = Math.max(1, r * 0.25);
    g.beginPath(); g.arc(p.x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#b07d10'; g.fillRect(p.x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.6);
  }

  // 옷: 주인공 머리·등 위에 그린다(뒷모습 그림 기준 위치)
  function drawWear(k, w, h) {
    if (k === 'gat') {
      g.fillStyle = 'rgba(25,25,30,0.88)';
      g.beginPath(); g.ellipse(0, -h * 0.83, w * 0.5, h * 0.05, 0, 0, Math.PI * 2); g.fill();
      g.fillRect(-w * 0.17, -h * 1.0, w * 0.34, h * 0.17);
      g.beginPath(); g.ellipse(0, -h * 1.0, w * 0.17, h * 0.025, 0, 0, Math.PI * 2); g.fill();
    }
    if (k === 'crown') {
      g.fillStyle = '#ffcf3a'; g.strokeStyle = '#b07d10'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-w * 0.22, -h * 0.9); g.lineTo(-w * 0.22, -h * 1.02); g.lineTo(-w * 0.11, -h * 0.95); g.lineTo(0, -h * 1.06); g.lineTo(w * 0.11, -h * 0.95); g.lineTo(w * 0.22, -h * 1.02); g.lineTo(w * 0.22, -h * 0.9); g.closePath(); g.fill(); g.stroke();
    }
    if (k === 'flower') {
      g.fillStyle = '#ff7eb6';
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.arc(w * 0.2 + Math.cos(a) * w * 0.06, -h * 0.86 + Math.sin(a) * w * 0.06, w * 0.05, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(w * 0.2, -h * 0.86, w * 0.035, 0, Math.PI * 2); g.fill();
    }
    if (k === 'horns') {
      g.fillStyle = '#ff6b5e';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * w * 0.12, -h * 0.9); g.lineTo(s * w * 0.2, -h * 1.03); g.lineTo(s * w * 0.24, -h * 0.86); g.closePath(); g.fill(); }
    }
    if (k === 'cape') {
      g.fillStyle = 'rgba(200,40,40,0.92)';
      g.beginPath(); g.moveTo(-w * 0.2, -h * 0.6); g.lineTo(w * 0.2, -h * 0.6); g.lineTo(w * 0.34, -h * 0.28); g.lineTo(-w * 0.34, -h * 0.28); g.closePath(); g.fill();
      g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(0, -h * 0.6, w * 0.04, 0, Math.PI * 2); g.fill();
    }
  }

  function drawKid(m, l, isLead) {
    const p = proj(m.x, m.z, l);
    const im = img[D.KIDS[m.kid].img];
    if (!im || !im.width) return;
    const running = S.mode === 'run' || S.mode === 'bossIn';
    const bob = running ? Math.abs(Math.sin(S.time * 13 + m.ph)) * 0.07 : 0;
    const gold = isLead && S.wear === 'gold';
    const h = l.base * p.s * (isLead ? 1.08 : 1) * (gold ? 1.25 : 1) * ease(m.pop);
    const w = h * (im.width / im.height);
    const hop = Math.sin(m.hop * Math.PI) * h * 0.5;
    const tilt = running ? Math.sin(S.time * 13 + m.ph) * 0.07 : 0;
    g.fillStyle = 'rgba(0,0,0,0.13)';
    g.beginPath(); g.ellipse(p.x, p.y, w * 0.38, h * 0.06, 0, 0, Math.PI * 2); g.fill();
    g.save();
    g.translate(p.x, p.y - h * bob - hop); g.rotate(tilt);
    if (gold) { const gr = g.createRadialGradient(0, -h * 0.5, 0, 0, -h * 0.5, h * 0.75); gr.addColorStop(0, 'rgba(255,216,74,0.75)'); gr.addColorStop(1, 'rgba(255,216,74,0)'); g.fillStyle = gr; g.fillRect(-h, -h * 1.3, h * 2, h * 1.6); }
    g.drawImage(im, -w / 2, -h, w, h);
    if (isLead && S.wear && !gold) drawWear(S.wear, w, h);
    g.restore();
  }
  function drawLost(m, l) {
    const p = proj(m.x, m.z, l), im = img[D.KIDS[m.kid].img];
    if (!im || !im.width) return;
    const h = l.base * p.s, w = h * (im.width / im.height);
    g.save(); g.globalAlpha = Math.max(0, m.life);
    g.translate(p.x, p.y - m.y * h * 0.25 - h / 2); g.rotate(m.rot);
    g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
  }

  function drawBoss(b, l) {
    const p = proj(0, b.z, l);
    const im = img[b.img];
    if (!im || !im.width) return;
    const k = 1 - b.out * 0.9;
    const h = l.base * BOSS_H * p.s * k, w = h * (im.width / im.height);
    const sx = b.hurt ? Math.sin(S.time * 60) * 10 : 0;
    g.save(); g.globalAlpha = 1 - b.out;
    g.translate(p.x + sx, p.y - (b.key === 'king' ? 0 : h * 0.05 * Math.abs(Math.sin(S.time * 3))));
    if (b.hurt) g.filter = 'brightness(1.6)';
    g.drawImage(im, -w / 2, -h, w, h);
    g.restore();
    if (b.out) return;
    const bw = Math.min(W * 0.6, 360), bh = 26, bx = p.x - bw / 2, by = Math.max(l.hY * 0.62, p.y - h - 46);
    g.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(bx - 3, by - 3, bw + 6, bh + 6, 16); g.fill();
    g.fillStyle = '#fff'; roundRect(bx, by, bw, bh, 13); g.fill();
    g.fillStyle = '#e0524a'; if (b.hp > 0) { roundRect(bx, by, Math.max(bh, bw * (b.hp / b.max)), bh, 13); g.fill(); }
    text(`${b.name}  ${b.hp}`, p.x, by + bh / 2 + 1, 18, '#2b2f3a');
  }

  function drawCount(l) {
    const p = proj(S.crowdX, 0.6, l);
    const y = p.y - l.base * 1.35 - 14;
    const t = `친구 ${count()}명`;
    g.font = `900 ${Math.round(Math.max(18, l.base * 0.2))}px Ssurround, sans-serif`;
    const w = g.measureText(t).width + 26, h = Math.max(30, l.base * 0.3);
    g.fillStyle = 'rgba(43,123,214,0.92)'; roundRect(p.x - w / 2, y - h / 2, w, h, h / 2); g.fill();
    text(t, p.x, y + 1, Math.max(18, l.base * 0.2), '#fff');
    // 방어막
    if (S.stats.shield > 0) {
      const ld = S.members[0], c = proj(ld.x, ld.z, l);
      g.strokeStyle = 'rgba(60,179,90,0.75)'; g.fillStyle = 'rgba(120,220,150,0.15)'; g.lineWidth = 4;
      g.beginPath(); g.ellipse(c.x, c.y - l.base * 0.55, l.base * 0.75, l.base * 0.8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  }

  function draw() {
    const l = L();
    g.save();
    if (S.shake) g.translate((Math.random() - 0.5) * 14 * S.shake, (Math.random() - 0.5) * 10 * S.shake);
    drawBg(l);
    // 먼 것부터 그린다
    const items = [];
    if (S.oldGate) items.push({ z: S.oldGate.z - 0.01, f: () => drawGate(S.oldGate, l) });
    if (S.gate) items.push({ z: S.gate.z - 0.01, f: () => { S.gate.rects = drawGate(S.gate, l); } });
    for (const e of S.ev) {
      const f = e.type === 'power' ? drawPower : e.type === 'mgate' ? drawMgate : e.type === 'costume' ? drawCostume : drawEnemy;
      items.push({ z: e.z - 0.01, f: () => f(e, l) });
    }
    for (const b of S.bullets) items.push({ z: b.z, f: () => drawBullet(b, l) });
    if (S.boss) items.push({ z: S.boss.z, f: () => drawBoss(S.boss, l) });
    S.members.slice(0, MAX_SHOWN).forEach((m, i) => items.push({ z: m.z, f: () => drawKid(m, l, i === 0) }));
    S.lost.forEach((m) => items.push({ z: m.z, f: () => drawLost(m, l) }));
    items.sort((a, b) => b.z - a.z).forEach((it) => it.f());
    if (S.mode !== 'bossOut' && S.mode !== 'end') drawCount(l);
    S.shots.forEach((s) => {
      const t = Math.max(0, Math.min(1, s.t / 0.7)); if (s.t < 0 || t >= 1) return;
      const x = s.x0 + (s.x1 - s.x0) * t, y = s.y0 + (s.y1 - s.y0) * t - Math.sin(t * Math.PI) * 120;
      star(x, y, 14, '#ffd84a');
    });
    S.parts.forEach((p) => { g.globalAlpha = Math.min(1, p.life * 1.5); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); });
    g.globalAlpha = 1;
    // 숫자 팝업: 처음에 크게 튀어나왔다가 제자리로
    S.texts.forEach((t) => {
      const age = t.max - t.life;
      const sc = age < 0.18 ? 0.3 + (age / 0.18) * 1.1 : Math.max(1, 1.4 - (age - 0.18) * 2.5);
      g.globalAlpha = Math.min(1, t.life * 2);
      g.save(); g.translate(t.x, t.y); g.scale(sc, sc);
      g.font = `900 ${Math.round(l.base * 0.38 * t.size)}px Ssurround, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 8; g.strokeStyle = '#fff'; g.lineJoin = 'round'; g.strokeText(t.t, 0, 0); g.fillStyle = t.color; g.fillText(t.t, 0, 0);
      g.restore();
    });
    g.globalAlpha = 1;
    g.restore();
  }

  function star(x, y, r, c) {
    g.fillStyle = c; g.strokeStyle = '#e0a400'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.stroke();
  }

  function frameLoop(t) {
    requestAnimationFrame(frameLoop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (!S || S.paused) return;
    if (cv.clientWidth !== W || cv.clientHeight !== H) resize();
    if (S.mode !== 'end') update(dt);
    draw();
  }

  root.GRGame = {
    POWERS,
    init(canvas) {
      cv = canvas; g = cv.getContext('2d');
      resize(); window.addEventListener('resize', resize);
      const list = ['img/bg.webp', 'img/king.png', 'img/germ_basic.png', 'img/germ_cavity.png', 'img/germ_mold.png', ...D.KIDS.map((k) => k.img)];
      requestAnimationFrame(frameLoop);
      return loadImages(list);
    },
    start, resume, bossAnswer, tap, moveBy,
    pause(v) { if (S) S.paused = v; },
    stop() { S = null; g && g.clearRect(0, 0, W, H); },
    get active() { return !!S && S.mode !== 'end'; },
    // 검사용: 화면이 숨어 있어도 시간을 sec초만큼 흘려 보낸다
    _step(sec) { for (let t = 0; t < sec && S && S.mode !== 'end'; t += 1 / 60) update(1 / 60); if (S) draw(); return S && { mode: S.mode, friends: S.members.length, gateZ: S.gate && S.gate.z, qi: S.qi, total: S.total, correct: S.correct }; },
    _state() { return S; },
  };
})(window);
