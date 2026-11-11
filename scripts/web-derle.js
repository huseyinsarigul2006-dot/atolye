// Web / iPad sürümünü (PWA) üretir: node scripts/web-derle.js
// Çıktı `web/` klasörüdür; bu klasör olduğu gibi bir web sunucusuna (GitHub Pages, Netlify vb.) yüklenir.
// Windows sürümüyle aynı `src/` kodunu kullanır; yalnızca köprü (src/web/kopru.js) ve birkaç etiket eklenir.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const kok = path.join(__dirname, '..');
// Varsayılan çıktı web/; GitHub Pages için "node scripts/web-derle.js docs" (npm run web:yayin) kullanılır.
const cikti = path.join(kok, process.argv[2] === 'docs' ? 'docs' : 'web');
const paket = require(path.join(kok, 'package.json'));

fs.rmSync(cikti, { recursive: true, force: true });
fs.cpSync(path.join(kok, 'src'), cikti, { recursive: true });

// DWG/DXF okuyucu (LibreDWG, WebAssembly)
const dwg = path.join(kok, 'node_modules', '@mlightcad', 'libredwg-web');
const dwgHedef = path.join(cikti, 'kutuphane', 'libredwg');
// Kütüphane kendi içinde "../wasm/libredwg-web.js" yolunu kullandığı için klasör düzeni korunur.
for (const [klasor, ad] of [['dist', 'libredwg-web.js'], ['wasm', 'libredwg-web.js'], ['wasm', 'libredwg-web.wasm']]) {
  fs.mkdirSync(path.join(dwgHedef, klasor), { recursive: true });
  fs.copyFileSync(path.join(dwg, klasor, ad), path.join(dwgHedef, klasor, ad));
}

// Simgeler
fs.mkdirSync(path.join(cikti, 'simgeler'), { recursive: true });
fs.copyFileSync(path.join(kok, 'build', 'icon.png'), path.join(cikti, 'simgeler', 'icon-512.png'));
fs.copyFileSync(path.join(kok, 'build', 'icon-kare.png'), path.join(cikti, 'simgeler', 'icon-kare-512.png'));

// index.html: web'e özgü güvenlik politikası, ana ekran etiketleri ve köprü.
// 'unsafe-eval': DWG kütüphanesinin WebAssembly bağlayıcısı (embind) çalışırken işlev üretir.
let html = fs.readFileSync(path.join(cikti, 'index.html'), 'utf8');
const degistir = (eski, yeni) => {
  if (!html.includes(eski)) throw new Error('index.html içinde bulunamadı: ' + eski);
  html = html.replace(eski, yeni);
};
degistir(/content="default-src[^"]*"/.exec(html)[0],
  `content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' data: blob:; worker-src 'self'; manifest-src 'self'"`);
degistir('<title>Atölye</title>', `<title>Atölye</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Atölye">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#f5f4f1" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#1b1a18" media="(prefers-color-scheme: dark)">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="simgeler/icon-512.png">
  <link rel="apple-touch-icon" href="simgeler/icon-kare-512.png">`);
degistir('<link rel="stylesheet" href="stiller/moodboard.css">', '<link rel="stylesheet" href="stiller/moodboard.css">\n  <link rel="stylesheet" href="web/web.css">');
degistir('<script type="module" src="app.js"></script>', '<script type="module" src="web/kopru.js"></script>\n  <script type="module" src="app.js"></script>');
fs.writeFileSync(path.join(cikti, 'index.html'), html);

fs.writeFileSync(path.join(cikti, 'manifest.webmanifest'), JSON.stringify({
  name: 'Atölye',
  short_name: 'Atölye',
  description: paket.description,
  lang: 'tr',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#f5f4f1',
  theme_color: '#a6502c',
  icons: [
    { src: 'simgeler/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'simgeler/icon-kare-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
fs.writeFileSync(path.join(cikti, '.nojekyll'), '');

// Çevrimdışı önbellek: tüm dosyaların listesi ve içerikten türetilen sürüm
const dosyalar = [];
const gez = (klasor) => {
  for (const ad of fs.readdirSync(klasor)) {
    const tam = path.join(klasor, ad);
    if (fs.statSync(tam).isDirectory()) gez(tam);
    else if (ad !== '.nojekyll') dosyalar.push(path.relative(cikti, tam).split(path.sep).join('/'));
  }
};
gez(cikti);
const ozet = crypto.createHash('sha1');
for (const d of dosyalar) ozet.update(d).update(fs.readFileSync(path.join(cikti, d)));
const surum = `${paket.version}-${ozet.digest('hex').slice(0, 10)}`;

fs.writeFileSync(path.join(cikti, 'sw.js'), `// Atölye servis çalışanı (otomatik üretilir — scripts/web-derle.js). Uygulamayı çevrimdışı çalıştırır.
const ONBELLEK = 'atolye-${surum}';
const DOSYALAR = ${JSON.stringify(['./', ...dosyalar])};

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
`);

const boyut = dosyalar.reduce((t, d) => t + fs.statSync(path.join(cikti, d)).size, 0);
console.log(`Web sürümü hazır: ${cikti}\n${dosyalar.length + 1} dosya, ${(boyut / 1048576).toFixed(1)} MB, önbellek sürümü ${surum}`);
