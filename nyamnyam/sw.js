// 오프라인 작동: 한 번 열면 모든 파일을 저장해 두고, 인터넷이 끊겨도 저장된 파일로 연다.
// 파일을 고치면 VERSION을 올린다. 새 버전은 다음에 열 때(또는 새로고침 두 번) 적용된다.
const VERSION = 'nyam-v1';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/ui.js', 'js/game.js', 'js/map.js', 'js/data.js', 'js/questions.js', 'js/save.js', 'js/sound.js',
  'img/title.webp', 'img/yeongyang.png', 'img/boy1.png', 'img/boy2.png', 'img/girl1.png', 'img/girl2.png',
  'img/germ_basic.png', 'img/germ_mold.png', 'img/germ_cavity.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 저장본을 먼저 보여 주고, 뒤에서 새 파일을 받아 저장본을 갱신한다
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
