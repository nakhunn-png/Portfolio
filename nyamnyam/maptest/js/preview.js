// 전체 지도 미리보기: 게임과 같은 그리기 함수로 층마다 지도 전체를 한 장에 그린다.
import { Game } from './game.js';
import { buildStage } from './map.js';
import { STAGES, COURSES } from './data.js';

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
}

const TS = 20;
const lastOf = Object.fromEntries(Object.entries(COURSES).map(([k, c]) => [c.stages[c.stages.length - 1], c.name]));
const inCourse = (id) => Object.values(COURSES).filter(c => c.stages.includes(+id)).map(c => c.name);

function render(id, box) {
  const m = buildStage(id);
  // 게임 그리기 함수를 그대로 쓰기 위한 가짜 게임(움직이지 않는다)
  const g = Object.create(Game.prototype);
  Object.assign(g, { map: m, run: { searched: {}, exitOpen: false, hidden: null }, locks: {}, time: 0, o: { band: 'mid' }, germs: [] });
  const cv = document.createElement('canvas'); cv.width = m.W * TS; cv.height = m.H * TS;
  const c = cv.getContext('2d');
  c.fillStyle = g.voidColor(); c.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) g.drawSceneTile(c, x, y, m.at(x, y), TS);
  g.drawArchitecture(c, TS);
  g.drawExit(c, TS);
  const list = [];
  for (const f of m.fixtures) list.push({ y: f.h > 2 ? f.y + 1 : f.y + f.h - 0.05, d: () => g.drawFixture(c, f, TS) });
  for (const o of m.objects) list.push({ y: o.y + 0.9, d: () => g.drawObject(c, o, TS) });
  list.sort((a, b) => a.y - b.y).forEach(it => it.d());
  // 출발 자리와 균 출발 자리
  g.label(c, '★ 출발', m.start.x * TS, m.start.y * TS, 13, '#fff', '#d0532a');
  for (const s of m.germSpots.slice(0, m.S.germs.length + 2)) { c.fillStyle = 'rgba(200,40,60,.75)'; c.beginPath(); c.arc(s.x * TS, s.y * TS, 4, 0, 7); c.fill(); }

  const sec = document.createElement('section');
  const tags = inCourse(id).map(n => `<span class="tag">${n}</span>`).join('') + (lastOf[id] ? `<span class="tag dark">🌑 ${lastOf[id]} 마지막 층: 불 꺼짐</span>` : '');
  sec.innerHTML = `<h2>${STAGES[id].name}</h2><p class="meta">${tags} <span>가로 ${m.W} · 세로 ${m.H}칸 · 방 ${m.rooms.length}개 · ?가구 ${m.objects.filter(o => o.kind === 'search').length}개 · 숨는 곳 ${m.objects.filter(o => o.kind === 'hide').length}개 · 고정 가구 ${m.fixtures.length}개</span></p>
    <p class="rooms">${m.rooms.map(r => `<b>${String(r.id + 1).padStart(2, '0')}</b> ${r.name}`).join(' · ')}</p>`;
  const wrap = document.createElement('div'); wrap.className = 'cv'; wrap.appendChild(cv); sec.appendChild(wrap);
  box.appendChild(sec);
}

const box = document.getElementById('maps');
Promise.resolve(document.fonts && document.fonts.load('20px "Ssurround"')).catch(() => {}).finally(() => { const one = new URLSearchParams(location.search).get('id'); for (const id of Object.keys(STAGES)) if (one == null || one === id) render(+id, box); });
