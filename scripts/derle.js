// Windows kurulum dosyasını (NSIS) üretir: node scripts/derle.js [çıktı-klasörü]
//
// electron-builder, kaldırıcıyı üretmek için yeni derlediği küçük bir .exe'yi hemen çalıştırır.
// Bazı bilgisayarlarda bu dosya o anda virüs taramasında olduğu için "spawn UNKNOWN" hatası alınır.
// Burada o adım birkaç kez yeniden denenir; yine olmazsa kaldırıcı dosyadan doğrudan çıkarılır.
const path = require('path');
const builder = require('electron-builder');
const { WineVmManager } = require('app-builder-lib/out/vm/WineVm');
const { UninstallerReader } = require('app-builder-lib/out/targets/nsis/nsisUtil');

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const asil = WineVmManager.prototype.exec;

WineVmManager.prototype.exec = async function (dosya, argumanlar, secenekler) {
  let sonHata;
  for (let deneme = 1; deneme <= 6; deneme++) {
    try {
      return await asil.call(this, dosya, argumanlar, secenekler);
    } catch (hata) {
      if (!/spawn/i.test(String(hata.message))) throw hata;
      sonHata = hata;
      console.log(`  • kaldırıcı üretimi yeniden deneniyor (${deneme}/6): ${hata.message}`);
      await bekle(2000);
    }
  }
  console.log('  • çalıştırılamadı, kaldırıcı dosyadan çıkarılıyor:', sonHata.message);
  const hedef = path.join(path.dirname(dosya), `${path.basename(dosya, 'exe')}__uninstaller.exe`);
  await UninstallerReader.exec(dosya, hedef);
};

const cikti = process.argv[2];
builder
  .build({
    targets: builder.Platform.WINDOWS.createTarget('nsis', builder.Arch.x64),
    config: cikti ? { directories: { output: path.resolve(cikti) } } : undefined,
  })
  .then((dosyalar) => console.log('Üretilen dosyalar:\n' + dosyalar.join('\n')))
  .catch((hata) => {
    console.error(hata);
    process.exit(1);
  });
