// Atölye — ana süreç: pencere, kalıcı veri saklama, dışa aktarma pencereleri.
const { app, BrowserWindow, ipcMain, dialog, nativeTheme, Menu, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Deneme çalıştırmalarında gerçek kullanıcı verisine dokunmamak için.
if (process.env.ATOLYE_VERI) app.setPath('userData', process.env.ATOLYE_VERI);

const veriKlasoru = () => path.join(app.getPath('userData'), 'veri');
const gorselKlasoru = () => path.join(app.getPath('userData'), 'gorseller');

const AD_KALIBI = /^[a-z0-9-]{1,40}$/;
const GORSEL_KALIBI = /^[a-f0-9]{16}\.(png|jpg|jpeg|webp|gif|bmp)$/;

function klasorleriHazirla() {
  fs.mkdirSync(veriKlasoru(), { recursive: true });
  fs.mkdirSync(gorselKlasoru(), { recursive: true });
}

function veriYolu(ad) {
  if (!AD_KALIBI.test(ad)) throw new Error('Geçersiz veri adı');
  return path.join(veriKlasoru(), ad + '.json');
}

function gorselYolu(kimlik) {
  if (!GORSEL_KALIBI.test(kimlik)) throw new Error('Geçersiz görsel kimliği');
  return path.join(gorselKlasoru(), kimlik);
}

let pencere = null;

function pencereOlustur() {
  pencere = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1040,
    minHeight: 660,
    title: 'Atölye',
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1b1a18' : '#f5f4f1',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  pencere.once('ready-to-show', () => pencere.show());
  pencere.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Uygulama çevrimdışıdır: dış bağlantılara ve yeni pencerelere izin verme.
  pencere.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  pencere.webContents.on('will-navigate', (olay) => olay.preventDefault());
  pencere.on('closed', () => { pencere = null; });
}

function ipcKur() {
  ipcMain.handle('veri:oku', (_o, ad) => {
    try {
      return JSON.parse(fs.readFileSync(veriYolu(ad), 'utf8'));
    } catch {
      return null;
    }
  });

  ipcMain.handle('veri:yaz', (_o, ad, veri) => {
    const hedef = veriYolu(ad);
    const gecici = hedef + '.tmp';
    fs.writeFileSync(gecici, JSON.stringify(veri), 'utf8');
    fs.renameSync(gecici, hedef);
    return true;
  });

  ipcMain.handle('gorsel:kaydet', (_o, tampon, uzanti) => {
    uzanti = String(uzanti || 'png').toLowerCase();
    if (!/^(png|jpg|jpeg|webp|gif|bmp)$/.test(uzanti)) uzanti = 'png';
    const kimlik = crypto.randomBytes(8).toString('hex') + '.' + uzanti;
    fs.writeFileSync(gorselYolu(kimlik), Buffer.from(tampon));
    return kimlik;
  });

  ipcMain.handle('gorsel:oku', (_o, kimlik) => {
    try {
      return fs.readFileSync(gorselYolu(kimlik));
    } catch {
      return null;
    }
  });

  ipcMain.handle('gorsel:sil', (_o, kimlik) => {
    try { fs.unlinkSync(gorselYolu(kimlik)); } catch { /* zaten yok */ }
    return true;
  });

  // Windows "Farklı kaydet" penceresiyle PNG dışa aktarma.
  ipcMain.handle('disa:png', async (_o, varsayilanAd, veriURL) => {
    const temizAd = String(varsayilanAd || 'atolye').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
    const sonuc = await dialog.showSaveDialog(pencere, {
      title: 'Farklı kaydet',
      defaultPath: path.join(app.getPath('pictures'), temizAd + '.png'),
      filters: [{ name: 'PNG görseli', extensions: ['png'] }],
    });
    if (sonuc.canceled || !sonuc.filePath) return null;
    const taban64 = String(veriURL).replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(sonuc.filePath, Buffer.from(taban64, 'base64'));
    return sonuc.filePath;
  });

  // Çalışmayı ayrı bir dosyaya (.atolye) kaydetme ve dosyadan açma.
  const ATOLYE_SUZGECI = [{ name: 'Atölye dosyası', extensions: ['atolye'] }];
  ipcMain.handle('dosya:kaydet', async (_o, varsayilanAd, metin) => {
    const temizAd = String(varsayilanAd || 'atolye').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
    const sonuc = await dialog.showSaveDialog(pencere, {
      title: 'Farklı kaydet',
      defaultPath: path.join(app.getPath('documents'), temizAd + '.atolye'),
      filters: ATOLYE_SUZGECI,
    });
    if (sonuc.canceled || !sonuc.filePath) return null;
    fs.writeFileSync(sonuc.filePath, String(metin), 'utf8');
    return sonuc.filePath;
  });

  ipcMain.handle('dosya:ac', async () => {
    const sonuc = await dialog.showOpenDialog(pencere, {
      title: 'Atölye dosyası aç',
      defaultPath: app.getPath('documents'),
      properties: ['openFile'],
      filters: ATOLYE_SUZGECI,
    });
    if (sonuc.canceled || !sonuc.filePaths[0]) return null;
    return { yol: sonuc.filePaths[0], metin: fs.readFileSync(sonuc.filePaths[0], 'utf8') };
  });

  // DWG / DXF içe aktarma: dosya seçilir, ana süreçte çözülür.
  ipcMain.handle('cad:ac', async () => {
    const sonuc = await dialog.showOpenDialog(pencere, {
      title: 'DWG veya DXF çizimi seç',
      properties: ['openFile'],
      filters: [{ name: 'CAD çizimi (DWG, DXF)', extensions: ['dwg', 'dxf'] }],
    });
    if (sonuc.canceled || !sonuc.filePaths[0]) return null;
    try {
      return await require('./cad.js').cadOku(sonuc.filePaths[0]);
    } catch (hata) {
      console.error(hata);
      return { hata: String(hata.message || hata) };
    }
  });

  ipcMain.handle('pano:kopyala', (_o, metin) => {
    clipboard.writeText(String(metin));
    return true;
  });

  ipcMain.handle('tema:ayarla', (_o, tema) => {
    nativeTheme.themeSource = tema === 'acik' ? 'light' : tema === 'koyu' ? 'dark' : 'system';
    return true;
  });

  ipcMain.handle('klasor:ac', () => shell.openPath(app.getPath('userData')));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (pencere) {
      if (pencere.isMinimized()) pencere.restore();
      pencere.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    klasorleriHazirla();
    ipcKur();
    pencereOlustur();
  });

  app.on('window-all-closed', () => app.quit());
}
