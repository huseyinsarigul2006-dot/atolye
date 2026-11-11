// Uygulama simgesini (build/icon.png, 512×512) SVG'den üretir.
// Kullanım: npx electron scripts/simge-uret.js
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b85c35"/><stop offset="1" stop-color="#96441f"/></linearGradient></defs>
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#g)"/>
  <path d="M132 372 256 132l124 240M181 278h150" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M112 404h288" stroke="#fff" stroke-opacity=".55" stroke-width="14" stroke-linecap="round"/>
  <path d="M152 404v-16M204 404v-10M256 404v-16M308 404v-10M360 404v-16" stroke="#fff" stroke-opacity=".55" stroke-width="10" stroke-linecap="round"/>
</svg>`;

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const hedef = path.join(__dirname, '..', 'build');
  fs.mkdirSync(hedef, { recursive: true });
  const pencere = new BrowserWindow({ width: 512, height: 512, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
  const uret = async (svg, dosya) => {
    const sayfa = `<html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`;
    await pencere.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(sayfa));
    await new Promise((r) => setTimeout(r, 400));
    const goruntu = (await pencere.webContents.capturePage()).resize({ width: 512, height: 512, quality: 'best' });
    fs.writeFileSync(path.join(hedef, dosya), goruntu.toPNG());
    console.log('Simge yazıldı:', path.join(hedef, dosya), goruntu.getSize());
  };
  await uret(SVG, 'icon.png');
  // iPad ana ekranı köşeleri kendisi yuvarlar; saydam köşe siyah görüneceği için tam kare sürüm.
  await uret(SVG.replace('x="16" y="16" width="480" height="480" rx="108"', 'x="0" y="0" width="512" height="512"'), 'icon-kare.png');
  app.exit(0);
});
