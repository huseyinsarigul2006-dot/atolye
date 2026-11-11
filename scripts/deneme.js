// Geliştirme denemesi: uygulamayı gerçek penceresinde açar, bir senaryoyu adım adım
// çalıştırır, ekran görüntüsü alır ve konsol hatalarını raporlar.
// Kullanım: npx electron scripts/deneme.js scripts/senaryolar/<ad>.js
const path = require('path');
const fs = require('fs');
const os = require('os');
const { app } = require('electron');

const senaryo = require(path.resolve(process.argv[2]));
const cikti = process.env.ATOLYE_CIKTI || path.join(os.tmpdir(), 'atolye-deneme');
process.env.ATOLYE_VERI = process.env.ATOLYE_VERI || path.join(cikti, 'veri');
// Her deneme temiz veriyle başlar; kalıcılığı sınamak için --koru verilir.
if (!process.argv.includes('--koru')) fs.rmSync(process.env.ATOLYE_VERI, { recursive: true, force: true });
fs.mkdirSync(cikti, { recursive: true });

// "Farklı kaydet" penceresi denemede elle yanıtlanamaz; dosyayı çıktı klasörüne yönlendir.
const { dialog } = require('electron');
let disaAktarimSayisi = 0;
dialog.showSaveDialog = async (_p, secenek) => ({
  canceled: false,
  filePath: path.join(cikti, `disa-${++disaAktarimSayisi}-${path.basename(secenek.defaultPath)}`),
});

const ON_HAZIRLIK = `
  window.$t = {
    q: (s) => document.querySelector(s),
    qa: (s) => [...document.querySelectorAll(s)],
    bekle: (ms) => new Promise((r) => setTimeout(r, ms)),
    tikla: (s) => { const e = typeof s === 'string' ? document.querySelector(s) : s; if (!e) throw new Error('Bulunamadı: ' + s); e.click(); },
    yaz: (s, v) => {
      const e = typeof s === 'string' ? document.querySelector(s) : s;
      if (!e) throw new Error('Bulunamadı: ' + s);
      if (e.type === 'checkbox') e.checked = v; else e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
    },
    metin: (s) => document.querySelector(s)?.textContent.replace(/\\s+/g, ' ').trim(),
    fare: (el, tur, x, y, ek = {}) => el.dispatchEvent(new PointerEvent(tur, { bubbles: true, clientX: x, clientY: y, pointerId: 1, button: 0, buttons: tur === 'pointerup' ? 0 : 1, ...ek })),
  };
  0;
`;

// Dosya açma penceresi: DWG/DXF isteniyorsa ATOLYE_CAD'deki dosya, değilse en son kaydedilen .atolye dosyası.
dialog.showOpenDialog = async (_p, secenek) => {
  const cadMi = (secenek.filters || []).some((f) => f.extensions.includes('dwg'));
  if (cadMi) return { canceled: !process.env.ATOLYE_CAD, filePaths: process.env.ATOLYE_CAD ? [process.env.ATOLYE_CAD] : [] };
  const adaylar = fs.readdirSync(cikti).filter((d) => d.endsWith('.atolye'))
    .map((d) => path.join(cikti, d)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return { canceled: !adaylar.length, filePaths: adaylar.slice(0, 1) };
};

require('../main.js');

app.on('browser-window-created', (_o, pencere) => {
  const wc = pencere.webContents;
  const hatalar = [];
  wc.on('console-message', (o, duzey, mesaj) => {
    const d = o.level ?? duzey;
    const m = o.message ?? mesaj;
    if (d === 'error' || d === 3 || d === 'warning' || d === 2) hatalar.push(`[${d}] ${m}`);
  });
  wc.once('did-finish-load', async () => {
    const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
    let basarisiz = false;
    try {
      await bekle(700);
      await wc.executeJavaScript(ON_HAZIRLIK);
      for (const adim of senaryo) {
        if (adim.js) {
          const sonuc = await wc.executeJavaScript(`(async () => { ${adim.js} })()`);
          if (sonuc !== undefined) console.log(`• ${adim.ad || 'adım'}:`, JSON.stringify(sonuc));
        }
        if (adim.cek) {
          await bekle(adim.bekle ?? 350);
          const goruntu = await wc.capturePage();
          fs.writeFileSync(path.join(cikti, adim.cek + '.png'), goruntu.toPNG());
        }
      }
    } catch (hata) {
      basarisiz = true;
      console.log('SENARYO HATASI:', hata.message);
    }
    // Pencerenin kapanışını taklit et: bekleyen taslak kayıtları yazılsın.
    await wc.executeJavaScript(`window.dispatchEvent(new Event('beforeunload')); 0`).catch(() => {});
    await bekle(250);
    console.log(hatalar.length ? 'KONSOL HATALARI:\n' + hatalar.join('\n') : 'Konsol hatası yok.');
    console.log('Çıktı klasörü:', cikti);
    app.exit(basarisiz || hatalar.length ? 1 : 0);
  });
});
