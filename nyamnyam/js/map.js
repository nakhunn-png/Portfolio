// 층 지도 만들기. 같은 씨앗(seed)이면 언제나 같은 지도가 나와서, 새로고침 뒤 이어 하기가 가능하다.
// 칸 (x, y)의 가운데가 월드 좌표 (x + 0.5, y + 0.5).
import { STAGES, THEMES } from './data.js';

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
function shuffle(r, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 칸 종류: 0 바닥, 1 벽, 2 소품(막힘)
export function buildStage(stageId) {
  const S = STAGES[stageId], T = THEMES[S.theme], r = rng(S.seed);
  const W = S.cols * (S.rw + 1) + 1, H = S.rows * (S.rh + 1) + 1;
  const g = new Uint8Array(W * H).fill(1);
  const room = new Int8Array(W * H).fill(-1);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : g[y * W + x]);
  const set = (x, y, v) => { g[y * W + x] = v; };
  const rooms = [];
  for (let ry = 0; ry < S.rows; ry++) for (let rx = 0; rx < S.cols; rx++) {
    const x0 = rx * (S.rw + 1) + 1, y0 = ry * (S.rh + 1) + 1, id = rooms.length;
    rooms.push({ id, rx, ry, x0, y0, x1: x0 + S.rw - 1, y1: y0 + S.rh - 1, name: S.rooms[id] || `방 ${id + 1}` });
    for (let y = y0; y < y0 + S.rh; y++) for (let x = x0; x < x0 + S.rw; x++) { set(x, y, 0); room[y * W + x] = id; }
  }
  // 방 사이 문: 무작위 신장 트리 + 몇 개 더
  const idx = (rx, ry) => ry * S.cols + rx;
  const links = [];
  const seen = new Set([0]), stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1], c = rooms[cur];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [c.rx + dx, c.ry + dy])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < S.cols && y < S.rows && !seen.has(idx(x, y)));
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny] = pick(r, nb), n = idx(nx, ny);
    links.push([cur, n]); seen.add(n); stack.push(n);
  }
  for (let a = 0; a < rooms.length; a++) for (let b = a + 1; b < rooms.length; b++) {
    const A = rooms[a], B = rooms[b];
    if (Math.abs(A.rx - B.rx) + Math.abs(A.ry - B.ry) !== 1) continue;
    if (links.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) continue;
    if (r() < 0.45) links.push([a, b]);
  }
  for (const [a, b] of links) {
    const A = rooms[a], B = rooms[b];
    if (A.ry === B.ry) { // 좌우: 세로 벽에 2칸 문
      const wx = (A.rx < B.rx ? A : B).x1 + 1;
      const y = A.y0 + 1 + Math.floor(r() * (S.rh - 3));
      set(wx, y, 0); set(wx, y + 1, 0);
    } else { // 위아래: 가로 벽에 2칸 문
      const top = A.ry < B.ry ? A : B, wy = top.y1 + 1;
      const x = A.x0 + 1 + Math.floor(r() * (S.rw - 3));
      set(x, wy, 0); set(x + 1, wy, 0);
    }
  }

  const start = { x: rooms[0].x0 + 1.5, y: rooms[0].y0 + 1.5 };
  const startTile = { x: rooms[0].x0 + 1, y: rooms[0].y0 + 1 };
  // 출구: 시작 방에서 가장 먼 방의 바깥 벽
  const far = farthestRoom(rooms, links);
  const exit = exitTile(rooms[far], S, W, H);

  // 문 앞·시작 자리 주변은 비워 둔다
  const keep = new Uint8Array(W * H);
  const keepAround = (x, y, rad) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) keep[Y * W + X] = 1; } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 0 && room[y * W + x] === -1) keepAround(x, y, 1);
  keepAround(startTile.x, startTile.y, 2);
  keepAround(exit.ix, exit.iy, 1);

  const free = (x, y) => at(x, y) === 0 && !keep[y * W + x];
  const objects = []; // {kind:'search'|'hide'|'decor', x, y, emoji, name, id}
  const occupied = new Set();
  const placeIn = (rm, kind, data, tries = 60) => {
    for (let t = 0; t < tries; t++) {
      const x = rm.x0 + 1 + Math.floor(r() * (S.rw - 2)), y = rm.y0 + 1 + Math.floor(r() * (S.rh - 2));
      if (!free(x, y) || occupied.has(y * W + x)) continue;
      set(x, y, 2);
      if (!connected(g, W, H, startTile)) { set(x, y, 0); continue; }
      occupied.add(y * W + x);
      const o = { kind, x, y, ...data, id: objects.length };
      objects.push(o); keepAround(x, y, 0);
      return o;
    }
    return null;
  };

  // ?가구: 연습 층 4개, 나머지 10개. 방마다 고르게
  const nSearch = stageId === 0 ? 4 : 10;
  const ids = rooms.map(rm => rm.id), pool = stageId === 0 ? ids : ids.slice(1);
  const order = stageId === 0 ? [] : [0];
  while (order.length < nSearch) order.push(...shuffle(r, pool.slice()));
  order.length = nSearch;
  order.forEach((rid, i) => { const [emoji, name] = T.search[i % T.search.length]; placeIn(rooms[rid], 'search', { emoji, name }); });
  // 숨는 곳: 연습 층 1개, 나머지 4개
  const nHide = stageId === 0 ? 1 : 4;
  shuffle(r, rooms.slice(stageId === 0 ? 0 : 1)).slice(0, nHide).forEach(rm => placeIn(rm, 'hide', { emoji: T.hide[0], name: T.hide[1] }));
  if (stageId === 0 && !objects.some(o => o.kind === 'hide')) placeIn(rooms[0], 'hide', { emoji: T.hide[0], name: T.hide[1] });
  // 꾸밈 소품
  for (const rm of rooms) { const n = stageId === 0 ? 2 : 3; for (let i = 0; i < n; i++) placeIn(rm, 'decor', { emoji: pick(r, T.decor), name: '' }, 20); }

  // 줍는 것: 비누(비눗방울 재료), 아이템
  const pickups = [];
  const floorTiles = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 0 && room[y * W + x] >= 0 && !(x === startTile.x && y === startTile.y)) floorTiles.push({ x, y });
  shuffle(r, floorTiles);
  const nSoap = stageId === 0 ? 3 : 12;
  for (let i = 0; i < nSoap && i < floorTiles.length; i++) pickups.push({ id: i, kind: 'soap', x: floorTiles[i].x, y: floorTiles[i].y });
  if (stageId !== 0) {
    pickups.push({ id: nSoap, kind: 'water', x: floorTiles[nSoap].x, y: floorTiles[nSoap].y });
    pickups.push({ id: nSoap + 1, kind: 'mask', x: floorTiles[nSoap + 1].x, y: floorTiles[nSoap + 1].y });
  }

  // 균 출발 자리: 시작 방이 아닌 방들
  const germSpots = [];
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;
  for (let i = 0; i < 12; i++) {
    const rm = others[i % others.length];
    for (let t = 0; t < 40; t++) {
      const x = rm.x0 + Math.floor(r() * S.rw), y = rm.y0 + Math.floor(r() * S.rh);
      if (at(x, y) === 0) { germSpots.push({ x: x + 0.5, y: y + 0.5 }); break; }
    }
  }

  return {
    id: stageId, S, T, W, H, g, room, rooms, start, startTile, exit, objects, pickups, germSpots,
    at, solid: (x, y) => at(x, y) !== 0,
    roomAt(x, y) { const X = Math.floor(x), Y = Math.floor(y); if (X < 0 || Y < 0 || X >= W || Y >= H) return null; const id = room[Y * W + X]; return id >= 0 ? rooms[id] : nearestRoom(rooms, X, Y); },
  };
}

function nearestRoom(rooms, x, y) {
  let best = rooms[0], bd = 1e9;
  for (const rm of rooms) { const cx = (rm.x0 + rm.x1) / 2, cy = (rm.y0 + rm.y1) / 2, d = (cx - x) ** 2 + (cy - y) ** 2; if (d < bd) { bd = d; best = rm; } }
  return best;
}

function farthestRoom(rooms, links) {
  const dist = new Array(rooms.length).fill(-1); dist[0] = 0; const q = [0];
  while (q.length) { const c = q.shift(); for (const [a, b] of links) { const n = a === c ? b : b === c ? a : -1; if (n >= 0 && dist[n] < 0) { dist[n] = dist[c] + 1; q.push(n); } } }
  let best = 0; dist.forEach((d, i) => { if (d > dist[best] || (d === dist[best] && i > best)) best = i; });
  return best;
}

// 출구 칸: 방이 맞닿은 바깥 벽 가운데. ix, iy = 출구 바로 안쪽 바닥 칸
function exitTile(rm, S, W, H) {
  const mx = Math.floor((rm.x0 + rm.x1) / 2), my = Math.floor((rm.y0 + rm.y1) / 2);
  if (rm.rx === S.cols - 1) return { x: rm.x1 + 1, y: my, ix: rm.x1, iy: my, dir: 'e' };
  if (rm.ry === S.rows - 1) return { x: mx, y: rm.y1 + 1, ix: mx, iy: rm.y1, dir: 's' };
  if (rm.ry === 0) return { x: mx, y: rm.y0 - 1, ix: mx, iy: rm.y0, dir: 'n' };
  return { x: rm.x0 - 1, y: my, ix: rm.x0, iy: my, dir: 'w' };
}

function connected(g, W, H, s) {
  let total = 0; for (let i = 0; i < g.length; i++) if (g[i] === 0) total++;
  const seen = new Uint8Array(W * H), q = [s.y * W + s.x]; seen[q[0]] = 1; let n = 0;
  while (q.length) {
    const i = q.pop(); n++; const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const j = Y * W + X; if (!seen[j] && g[j] === 0) { seen[j] = 1; q.push(j); }
    }
  }
  return n === total;
}

// 벽만 시야를 막는다(소품은 낮아서 보인다)
export function lineOfSight(map, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), steps = Math.ceil(d / 0.2);
  for (let i = 1; i < steps; i++) {
    const t = i / steps, x = Math.floor(ax + (bx - ax) * t), y = Math.floor(ay + (by - ay) * t);
    if (map.at(x, y) === 1) return false;
  }
  return true;
}

// 너비 우선 길찾기: 다음에 갈 칸들의 목록(시작 칸 제외)
export function findPath(map, sx, sy, tx, ty, maxLen = 400) {
  const { W, H } = map;
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  if (map.solid(tx, ty)) return null;
  const prev = new Int32Array(W * H).fill(-1), s = sy * W + sx, t = ty * W + tx;
  prev[s] = s; const q = [s]; let head = 0;
  while (head < q.length && head < maxLen * 8) {
    const i = q[head++]; if (i === t) break;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (map.solid(X, Y)) continue;
      const j = Y * W + X; if (prev[j] < 0) { prev[j] = i; q.push(j); }
    }
  }
  if (prev[t] < 0) return null;
  const path = []; for (let i = t; i !== s; i = prev[i]) path.push({ x: (i % W) + 0.5, y: ((i / W) | 0) + 0.5 });
  return path.reverse();
}
