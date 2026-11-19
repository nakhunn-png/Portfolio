// 층 지도 만들기. 같은 씨앗(seed)이면 언제나 같은 지도가 나와서, 새로고침 뒤 이어 하기가 가능하다.
// 칸 (x, y)의 가운데가 월드 좌표 (x + 0.5, y + 0.5).
import { STAGES, THEMES } from './data.js';
import { compileLayout } from './layouts.js';

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// 방별 연출. 고정 가구는 실제 충돌 판정을 가진다. 퍼즐 규칙은 바꾸지 않는다.
const ESCAPE_ROOMS = {
  practice: [
    ['오리엔테이션', 'wood', ['desk','cabinet','board'], ['단서 연습 서랍','영양이 안내 보관함']],
    ['탈출 연습 구역', 'tile', ['cabinet','desk','crate'], ['쪽지 연습 상자','탈출 연습 서랍']]
  ],
  cafeteria: [
    ['급식실 출입 통제', 'tile', ['cabinet','desk','board'], ['출입 기록함','오늘의 식단 서랍']],
    ['식탁 구역', 'tile', ['table','table','table'], ['식탁 아래 보관함','식단 카드 상자']],
    ['배식 구역', 'tile', ['counter','counter','fridge'], ['배식대 서랍','수저 보관함']],
    ['손 씻는 구역', 'wet', ['sink','sink','cabinet'], ['위생용품 수납함','손 씻기 안내함']],
    ['식판 반납 구역', 'wet', ['sink','counter','crate'], ['식판 수레','세척 기록함']],
    ['조리 준비실', 'tile', ['stove','counter','fridge'], ['조리대 서랍','식재료 냉장고']]
  ],
  veggie: [
    ['채소 보관 구역', 'cold', ['crate','crate','shelf'], ['배추 보관 상자','채소 기록함']],
    ['뿌리채소 선반', 'cold', ['shelf','crate','crate'], ['당근 보관 상자','뿌리채소 서랍']],
    ['과일 저장 구역', 'cold', ['crate','shelf','crate'], ['사과 보관 상자','과일 기록함']],
    ['냉각 설비실', 'wet', ['fridge','fridge','cabinet'], ['얼음 틀 보관함','온도 점검함']],
    ['과채류 보관 구역', 'cold', ['shelf','crate','shelf'], ['수박 보관 상자','과채류 기록함']],
    ['재고 점검 구역', 'cold', ['desk','cabinet','shelf'], ['재고 기록 서랍','채소 분류함']]
  ],
  dairy: [
    ['우유 냉장 구역', 'cold', ['fridge','fridge','shelf'], ['우유 보관함','우유 기록함']],
    ['치즈 숙성 구역', 'cold', ['shelf','fridge','crate'], ['치즈 보관함','치즈 분류함']],
    ['달걀 보관 구역', 'cold', ['shelf','crate','shelf'], ['달걀판 보관함','달걀 기록함']],
    ['콩·두부 냉장 구역', 'cold', ['fridge','shelf','crate'], ['두부 보관함','콩 보관 상자']],
    ['생선 냉장 구역', 'wet', ['fridge','counter','sink'], ['생선 보관함','생선 점검함']],
    ['고기 냉장 구역', 'cold', ['fridge','counter','cabinet'], ['고기 보관함','냉장 기록함']]
  ],
  garden: [
    ['텃밭 관리소', 'stone', ['shed','bench','crate'], ['텃밭 관리 상자','씨앗 기록함']],
    ['상추 재배 구역', 'soil', ['bed','bed','bench'], ['상추 표지 상자','재배 기록함']],
    ['감자 재배 구역', 'soil', ['bed','bed','crate'], ['감자 수확 상자','감자 기록함']],
    ['딸기 재배 구역', 'soil', ['bed','bed','bench'], ['딸기 수확 상자','딸기 기록함']],
    ['옥수수 재배 구역', 'soil', ['bed','bed','shed'], ['옥수수 수확 상자','씨앗 보관함']],
    ['급수·도구 창고', 'stone', ['tank','shed','bench'], ['물뿌리개 보관함','도구 정리함']]
  ],
  market: [
    ['시장 안내 구역', 'stone', ['stall','bench','board'], ['시장 안내함','상점 지도 서랍']],
    ['과일 가게', 'stone', ['stall','crate','stall'], ['과일 가게 서랍','과일 재고 상자']],
    ['채소 가게', 'stone', ['stall','crate','stall'], ['채소 가게 서랍','채소 재고 상자']],
    ['생선 가게', 'wet', ['stall','sink','fridge'], ['생선 가게 서랍','냉장 점검함']],
    ['빵 가게', 'wood', ['stall','shelf','counter'], ['빵 가게 서랍','빵 재료 보관함']],
    ['시장 계산 구역', 'stone', ['desk','cabinet','crate'], ['계산대 서랍','영수증 보관함']]
  ],
  kitchen: [
    ['현관·식품 수납', 'wood', ['cabinet','bench','shelf'], ['현관 수납함','식품 목록 서랍']],
    ['가족 식탁', 'wood', ['table','table','cabinet'], ['식탁 서랍','식단 계획함']],
    ['설거지 구역', 'wet', ['sink','counter','cabinet'], ['개수대 수납함','세척용품 보관함']],
    ['냉장고 구역', 'tile', ['fridge','fridge','shelf'], ['냉장고 식품칸','보관 날짜 기록함']],
    ['가열 조리 구역', 'tile', ['stove','counter','counter'], ['조리대 서랍','조리 도구함']],
    ['찬장·식료품 창고', 'wood', ['cabinet','shelf','crate'], ['찬장 보관함','식료품 바구니']]
  ]
};
const pick = (r, a) => a[Math.floor(r() * a.length)];
function shuffle(r, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 지도 구조가 바뀌면 올린다. 저장된 진행 중 층의 mapVersion이 다르면 그 층을 새 지도로 다시 시작한다.
export const MAP_VERSION = 4;

// 칸 종류: 0 바닥, 1 벽, 2 소품(막힘)
export function buildStage(stageId) {
  const S = STAGES[stageId], T = THEMES[S.theme], r = rng(S.seed);
  const L = compileLayout(stageId), W = L.W, H = L.H;
  const g = new Uint8Array(W * H).fill(1);
  const room = Int8Array.from(L.room);
  for (let i = 0; i < W * H; i++) if (L.kind[i]) g[i] = L.kind[i] === 1 ? 0 : 2;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : g[y * W + x]);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = v; };

  // 방: 모양이 제각각이므로 칸을 직접 모아 범위와 가운데 칸, 안내판 자리를 구한다
  const rooms = S.rooms.map((name, id) => {
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (room[y * W + x] === id) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    let cx = x0, cy = y0, bd = 1e9, signX = x0, signY = y0, sd = 1e9;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (room[y * W + x] !== id || g[y * W + x] !== 0) continue;
      const d = (x - mx) ** 2 + (y - my) ** 2; if (d < bd) { bd = d; cx = x; cy = y; }
      // 안내판: 위쪽 벽에 붙은 바닥 칸 중 가장 왼쪽 위
      if (at(x, y - 1) === 1 && at(x + 1, y) === 0 && y * 100 + x < sd) { sd = y * 100 + x; signX = x; signY = y; }
    }
    return { id, x0, y0, x1, y1, cx, cy, name, signX, signY };
  });

  // 문틀: 복도 칸이 방 바닥에 닿고, 옆이 벽인 곳(복도가 방으로 들어가는 입구)
  const doors = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (g[i] !== 0 || room[i] >= 0) continue;
    for (const [dx, dy] of DIRS) {
      const j = (y + dy) * W + x + dx; if (room[j] < 0 || g[j] === 1) continue;
      const side = dx ? [at(x, y - 1), at(x, y + 1)] : [at(x - 1, y), at(x + 1, y)];
      if (side.includes(1)) { doors.push({ x, y, dx, dy, roomId: room[j] }); break; }
    }
  }

  const startTile = { x: L.start.x, y: L.start.y };
  const start = { x: startTile.x + 0.5, y: startTile.y + 0.5 };
  // 탈출문: 바깥 벽 칸. ix, iy = 바로 안쪽 바닥 칸, dir = 탈출문이 방의 어느 쪽 벽에 있는지
  const ex = L.exit, inner = DIRS.map(([dx, dy]) => ({ ix: ex.x - dx, iy: ex.y - dy, dx, dy })).find(n => at(n.ix, n.iy) === 0);
  set(ex.x, ex.y, 1);
  const exit = { x: ex.x, y: ex.y, ix: inner.ix, iy: inner.iy, dir: inner.dx > 0 ? 'e' : inner.dx < 0 ? 'w' : inner.dy > 0 ? 's' : 'n' };

  // 복도·문 앞·시작 자리·탈출문 앞은 비워 둔다
  const keep = new Uint8Array(W * H);
  const keepAround = (x, y, rad) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) keep[Y * W + X] = 1; } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 0 && room[y * W + x] === -1) keepAround(x, y, 1);
  keepAround(startTile.x, startTile.y, 2);
  keepAround(exit.ix, exit.iy, 1);

  const free = (x, y) => at(x, y) === 0 && !keep[y * W + x];
  const nearSolid = (x, y) => DIRS.some(([dx, dy]) => at(x + dx, y + dy) !== 0);
  const objects = []; // {kind:'search'|'hide'|'decor', x, y, emoji, name, id}
  const reachable = () => objects.every(o => o.kind === 'decor' || DIRS.some(([dx, dy]) => at(o.x + dx, o.y + dy) === 0));
  // 탐색 가구와 숨는 곳은 앞쪽 시도에서 벽이나 가구에 붙여 놓는다(방 한가운데 떠 있지 않게)
  const placeIn = (rm, kind, data, tries = 400) => {
    for (let t = 0; t < tries; t++) {
      const x = rm.x0 + Math.floor(r() * (rm.x1 - rm.x0 + 1)), y = rm.y0 + Math.floor(r() * (rm.y1 - rm.y0 + 1));
      if (room[y * W + x] !== rm.id || !free(x, y)) continue;
      if (kind !== 'decor' && t < tries * 0.6 && !nearSolid(x, y)) continue;
      set(x, y, 2);
      if (!connected(g, W, H, startTile) || !reachable()) { set(x, y, 0); continue; }
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
  for (const rm of rooms) { const n = stageId === 0 ? 2 : 3; for (let i = 0; i < n; i++) placeIn(rm, 'decor', { emoji: pick(r, T.decor), name: '' }, 40); }

  // 방 용도에 맞춘 바닥 무늬와 탐색 가구 이름(이전 패치의 방별 연출을 그대로 쓴다)
  const profiles = ESCAPE_ROOMS[S.theme] || ESCAPE_ROOMS.practice;
  for (const rm of rooms) {
    const profile = profiles[rm.id % profiles.length];
    rm.scene = profile[0]; rm.floorStyle = profile[1];
    objects.filter(o => o.kind === 'search' && room[o.y * W + o.x] === rm.id)
      .forEach((o, i) => { o.name = profile[3][i % profile[3].length]; o.art = /냉장|우유|고기|생선/.test(o.name) ? 'fridge' : /상자|바구니/.test(o.name) ? 'crate' : 'cabinet'; });
  }
  const fixtures = L.fixtures.map(f => ({ ...f, roomId: room[f.y * W + f.x] }));

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

  // 균 출발 자리: 시작 방이 아닌 방의 바닥
  const germSpots = [];
  const others = rooms.length > 1 ? rooms.slice(1) : rooms;
  for (let i = 0; i < 12; i++) {
    const rm = others[i % others.length];
    for (let t = 0; t < 80; t++) {
      const x = rm.x0 + Math.floor(r() * (rm.x1 - rm.x0 + 1)), y = rm.y0 + Math.floor(r() * (rm.y1 - rm.y0 + 1));
      if (at(x, y) === 0 && room[y * W + x] === rm.id) { germSpots.push({ x: x + 0.5, y: y + 0.5 }); break; }
    }
  }

  return {
    id: stageId, S, T, W, H, g, room, rooms, start, startTile, exit, objects, pickups, germSpots, doors, fixtures, layoutVersion: MAP_VERSION,
    at, solid: (x, y) => at(x, y) !== 0,
    roomAt(x, y) { const X = Math.floor(x), Y = Math.floor(y); if (X < 0 || Y < 0 || X >= W || Y >= H) return null; const id = room[Y * W + X]; return id >= 0 ? rooms[id] : nearestRoom(rooms, X, Y); },
  };
}

function nearestRoom(rooms, x, y) {
  let best = rooms[0], bd = 1e9;
  for (const rm of rooms) { const cx = (rm.x0 + rm.x1) / 2, cy = (rm.y0 + rm.y1) / 2, d = (cx - x) ** 2 + (cy - y) ** 2; if (d < bd) { bd = d; best = rm; } }
  return best;
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
