// 맵 자동 검사. nyamnyam 폴더에서: node maptest/check-maps.mjs
import { pathToFileURL, fileURLToPath } from 'url';
const dir = process.argv[2] || fileURLToPath(new URL('./js', import.meta.url));
const { buildStage, findPath, lineOfSight } = await import(pathToFileURL(dir + '/map.js').href);
const { STAGES, COURSES, DIFFS, GERMS } = await import(pathToFileURL(dir + '/data.js').href);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let fails = 0;
const out = [];
function bfs(m, sx, sy) {
  const d = new Int32Array(m.W * m.H).fill(-1), q = [sy * m.W + sx]; d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) { const i = q[h], x = i % m.W, y = (i / m.W) | 0; for (const [dx, dy] of DIRS) { const X = x + dx, Y = y + dy; if (m.solid(X, Y)) continue; const j = Y * m.W + X; if (d[j] < 0) { d[j] = d[i] + 1; q.push(j); } } }
  return d;
}
// 의사 난수(검사 재현용)
let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

for (const sid of Object.keys(STAGES).map(Number)) {
  const m = buildStage(sid), S = STAGES[sid], errs = [], notes = [];
  const ok = (c, msg) => { if (!c) errs.push(msg); };
  const W = m.W;
  // 1. 연결성
  const d = bfs(m, m.startTile.x, m.startTile.y);
  let floor = 0, reach = 0; for (let i = 0; i < W * m.H; i++) if (m.g[i] === 0) { floor++; if (d[i] >= 0) reach++; }
  ok(floor === reach, `바닥 ${floor}칸 중 ${reach}칸만 이어짐`);
  // 2. 시작·탈출
  ok(!m.solid(m.startTile.x, m.startTile.y), '시작 칸이 막힘');
  const ed = d[m.exit.iy * W + m.exit.ix];
  ok(ed >= 0, '탈출문 앞 칸에 갈 수 없음');
  ok(m.at(m.exit.x, m.exit.y) === 1, '탈출문이 벽 칸이 아님');
  const outside = DIRS.some(([dx, dy]) => { const X = m.exit.x + dx, Y = m.exit.y + dy; return X < 0 || Y < 0 || X >= W || Y >= m.H || (m.g[Y * W + X] === 1 && !DIRS.some(([a, b]) => m.at(X + a, Y + b) === 0)); });
  ok(outside, '탈출문이 바깥 벽이 아님(안쪽 벽)');
  // 3. 각 방 연결, 방 수
  ok(m.rooms.length === S.rooms.length, '방 수가 데이터와 다름');
  for (const rm of m.rooms) { ok(rm.x1 >= 0, `${rm.name}: 바닥 없음`); ok(!m.solid(rm.cx, rm.cy), `${rm.name}: 가운데 칸 막힘`); }
  // 4. 탐색·숨는 곳 수와 접근
  const search = m.objects.filter(o => o.kind === 'search'), hide = m.objects.filter(o => o.kind === 'hide');
  ok(search.length === (sid === 0 ? 4 : 10), `?가구 ${search.length}개`);
  ok(hide.length === (sid === 0 ? 1 : 4), `숨는 곳 ${hide.length}개`);
  const searchRooms = new Set(search.map(o => m.room[o.y * W + o.x]));
  for (const o of [...search, ...hide]) {
    const n = DIRS.map(([dx, dy]) => [o.x + dx, o.y + dy]).filter(([x, y]) => !m.solid(x, y) && d[y * W + x] >= 0);
    ok(n.length > 0, `${o.kind} (${o.x},${o.y}) 앞에 설 자리 없음`);
    // 실제 상호작용 거리(1.45) 안에 플레이어 중심이 들어가는지: 옆 칸 가운데까지 거리 1
    ok(m.g[o.y * W + o.x] === 2, `${o.kind} (${o.x},${o.y}) 충돌 칸이 아님`);
  }
  // 5. 문 앞이 막히지 않았는지
  for (const dr of m.doors) { const X = dr.x + dr.dx, Y = dr.y + dr.dy; ok(!m.solid(X, Y), `문 (${dr.x},${dr.y}) 안쪽이 막힘`); }
  // 6. 통로 폭: 복도 칸마다 2×2 바닥 덩어리에 속하는지(1칸 폭 위치를 센다)
  const narrow = [];
  for (let y = 1; y < m.H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (m.solid(x, y) || m.room[y * W + x] >= 0) continue; // 복도 칸만
    const blk = [[0, 0], [-1, 0], [0, -1], [-1, -1]].some(([ox, oy]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => !m.solid(x + ox + a, y + oy + b)));
    if (!blk) narrow.push(`${x},${y}`);
  }
  // 7. 충돌·그리기 일치: 막힌 칸(2)은 모두 고정 가구나 물건이어야 한다
  const drawn = new Set();
  for (const f of m.fixtures) for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) { drawn.add(y * W + x); ok(m.g[y * W + x] === 2, `가구 ${f.type} (${x},${y}) 충돌 없음`); }
  for (const o of m.objects) drawn.add(o.y * W + o.x);
  for (let i = 0; i < W * m.H; i++) if (m.g[i] === 2 && !drawn.has(i)) ok(false, `보이지 않는 막힘 칸 ${i % W},${(i / W) | 0}`);
  // 8. 줍는 것, 균 자리
  for (const p of m.pickups) ok(!m.solid(p.x, p.y) && d[p.y * W + p.x] >= 0, `줍는 것 (${p.x},${p.y}) 접근 불가`);
  const maxGerms = S.germs.length + 2;
  ok(sid === 0 || m.germSpots.length >= maxGerms, `균 자리 ${m.germSpots.length}개 < ${maxGerms}`);
  let nearStart = 0;
  for (const s of m.germSpots) { const X = Math.floor(s.x), Y = Math.floor(s.y); ok(!m.solid(X, Y), `균 자리 (${X},${Y}) 막힘`); if (Math.hypot(s.x - m.start.x, s.y - m.start.y) < 8) nearStart++; }
  if (nearStart) notes.push(`출발 8칸 안 균 자리 ${nearStart}곳`);
  // 9. 균 이동 시뮬레이션: 돌아다니기 + 무작위 목표 쫓기, 120초
  let wallHits = 0, stuck = 0;
  if (sid !== 0) {
    const germs = m.germSpots.slice(0, maxGerms).map((s, i) => ({ x: s.x, y: s.y, path: null, idle: 0, def: GERMS[['basic', 'mold', 'cavity'][i % 3]] }));
    const dt = 0.05;
    for (let t = 0; t < 120; t += dt) {
      for (const g of germs) {
        const bx = g.x, by = g.y;
        if (!g.path || !g.path.length) {
          // 절반은 게임처럼 근처를 돌아다니고, 절반은 먼 곳(쫓기 대상)을 고른다
          const far = rnd() < 0.5;
          for (let k = 0; k < 10; k++) {
            const tx = far ? Math.floor(rnd() * W) : Math.floor(g.x + (rnd() * 14 - 7)), ty = far ? Math.floor(rnd() * m.H) : Math.floor(g.y + (rnd() * 12 - 6));
            if (!m.solid(tx, ty)) { g.path = findPath(m, g.x, g.y, tx, ty, far ? 400 : 60); if (g.path) break; }
          }
        }
        if (g.path && g.path.length) {
          let step = g.def.run * dt; const n = g.path[0], dx = n.x - g.x, dy = n.y - g.y, dd = Math.hypot(dx, dy);
          if (dd <= step) { g.x = n.x; g.y = n.y; g.path.shift(); } else { g.x += dx / dd * step; g.y += dy / dd * step; }
        }
        if (m.solid(Math.floor(g.x), Math.floor(g.y))) wallHits++;
        g.idle = Math.hypot(g.x - bx, g.y - by) < 1e-6 ? g.idle + dt : 0;
        if (g.idle > 5) { stuck++; g.idle = -1e9; }
      }
    }
  }
  ok(wallHits === 0, `균이 벽 안에 들어간 횟수 ${wallHits}`);
  ok(stuck === 0, `5초 넘게 멈춘 균 ${stuck}마리`);
  // 요약
  const pathLen = ed;
  const nodes = []; // 방 사이 연결(문 기준)
  const links = new Set();
  for (const dr of m.doors) links.add(dr.roomId);
  fails += errs.length;
  out.push(`[${sid}] ${S.name}  ${W}x${m.H}  바닥 ${floor}칸  시작→탈출 ${pathLen}걸음  ?가구 ${search.length}(방 ${searchRooms.size}곳) 숨는 곳 ${hide.length}  문틀 ${m.doors.length}  가구 ${m.fixtures.length}  복도 1칸 폭 ${narrow.length}칸${narrow.length ? ' (' + narrow.slice(0, 6).join(' ') + (narrow.length > 6 ? ' …' : '') + ')' : ''}`
    + (notes.length ? `\n     참고: ${notes.join(', ')}` : '')
    + (errs.length ? '\n     ✗ ' + errs.join('\n     ✗ ') : '\n     ✓ 모두 통과'));
}
console.log(out.join('\n'));
console.log(fails ? `\n실패 ${fails}건` : '\n전체 통과');
process.exit(fails ? 1 : 0);
