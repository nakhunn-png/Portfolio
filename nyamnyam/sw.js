// 오프라인 작동: 한 번 열면 모든 파일을 저장해 두고, 인터넷이 끊겨도 저장된 파일로 연다.
// 파일을 고치면 VERSION을 올린다. 새 버전은 다음에 열 때(또는 새로고침 두 번) 적용된다.
const VERSION = 'nyam-v14';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/app.js',
  'img/title.webp', 'img/yeongyang.png', 'img/boy1.png', 'img/boy2.png', 'img/girl1.png', 'img/girl2.png',
  'img/germ_basic.png', 'img/germ_mold.png', 'img/germ_cavity.png',
  'fonts/Cafe24Ssurround.woff', 'fonts/Cafe24SsurroundAir.woff',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 인터넷이 되면 늘 새 파일을 먼저 받는다(고친 내용이 바로 보이게). 3초 안에 못 받거나 끊겨 있으면 저장본으로 연다
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const saved = () => c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    const slow = new Promise(res => setTimeout(res, 3000)).then(async () => (await saved()) || net);
    try { return await Promise.race([net, slow]); } catch { return (await saved()) || Response.error(); }
  }));
});
