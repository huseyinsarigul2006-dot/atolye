// Atölye servis çalışanı (otomatik üretilir — scripts/web-derle.js). Uygulamayı çevrimdışı çalıştırır.
const ONBELLEK = 'atolye-1.1.1-7e18e0ff7d';
const DOSYALAR = ["./","app.js","araclar/ergonomi/sema.js","araclar/ergonomi.js","araclar/malzeme.js","araclar/moodboard.js","araclar/olcek.js","araclar/palet.js","araclar/plan/cizim.js","araclar/plan/denetim.js","araclar/planlayici.js","cekirdek/arayuz.js","cekirdek/cad.js","cekirdek/depo.js","cekirdek/dosya.js","cekirdek/renk.js","index.html","kutuphane/libredwg/dist/libredwg-web.js","kutuphane/libredwg/wasm/libredwg-web.js","kutuphane/libredwg/wasm/libredwg-web.wasm","manifest.webmanifest","ortak/cad-duzlestir.mjs","simgeler/icon-512.png","simgeler/icon-kare-512.png","stiller/ergonomi.css","stiller/malzeme.css","stiller/moodboard.css","stiller/olcek.css","stiller/palet.css","stiller/planlayici.css","stiller/temel.css","veri/ergonomi.js","veri/malzemeler.js","veri/mobilyalar.js","web/kopru.js","web/web.css"];

self.addEventListener('install', (olay) => {
  olay.waitUntil(caches.open(ONBELLEK).then((o) => o.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a.startsWith('atolye-') && a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  if (istek.method !== 'GET' || new URL(istek.url).origin !== location.origin) return;
  olay.respondWith(
    caches.match(istek, { ignoreSearch: true }).then((yanit) =>
      yanit || fetch(istek).catch(() => (istek.mode === 'navigate' ? caches.match('./') : Response.error()))),
  );
});
