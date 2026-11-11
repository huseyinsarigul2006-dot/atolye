// `web/` klasörünü bu bilgisayarda sunar (deneme için): node scripts/web-sun.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const kok = path.join(__dirname, '..', 'web');
const port = Number(process.argv[2]) || 5173;
const TURLER = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
};

http.createServer((istek, yanit) => {
  let yol = decodeURIComponent(new URL(istek.url, 'http://x').pathname);
  if (yol.endsWith('/')) yol += 'index.html';
  const dosya = path.join(kok, yol);
  if (!dosya.startsWith(kok) || !fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) {
    yanit.writeHead(404).end('Bulunamadı');
    return;
  }
  yanit.writeHead(200, { 'Content-Type': TURLER[path.extname(dosya)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(dosya).pipe(yanit);
}).listen(port, () => console.log(`Atölye web sürümü: http://localhost:${port}`));
