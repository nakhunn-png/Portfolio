// 오프라인 작동: 한 번 열면 모든 파일을 저장해 두고, 인터넷이 끊겨도 저장된 파일로 연다.
// 파일을 고치면 VERSION을 올린다.
const VERSION = 'gate-v1';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/questions.js', 'js/data.js', 'js/save.js', 'js/sound.js', 'js/game.js', 'js/ui.js',
  'img/bg.webp', 'img/king.png', 'img/kid1.png', 'img/kid2.png', 'img/kid3.png', 'img/kid4.png',
  'img/germ_basic.png', 'img/germ_cavity.png', 'img/germ_mold.png',
  'fonts/Cafe24Ssurround.woff', 'fonts/Cafe24SsurroundAir.woff',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// 인터넷이 되면 새 파일을 먼저 받는다. 3초 안에 못 받거나 끊겨 있으면 저장본으로 연다
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const saved = () => c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
    const slow = new Promise((res) => setTimeout(res, 3000)).then(async () => (await saved()) || net);
    try { return await Promise.race([net, slow]); } catch (err) { return (await saved()) || Response.error(); }
  }));
});
