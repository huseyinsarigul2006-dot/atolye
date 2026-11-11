// DWG / DXF okuma (ana süreç). Çizimi LibreDWG (WebAssembly) ile çözer;
// geometriyi sadeleştiren kod web sürümüyle ortaktır (src/ortak/cad-duzlestir.mjs).
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Paketlenmiş uygulamada bu dosyalar asar arşivinin dışında durur (package.json → asarUnpack).
const disari = (yol) => yol.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
const paketKoku = disari(path.join(__dirname, 'node_modules', '@mlightcad', 'libredwg-web'));
const ortakYol = disari(path.join(__dirname, 'src', 'ortak', 'cad-duzlestir.mjs'));

let hazir = null;
function yukle() {
  hazir ||= (async () => {
    const modul = await import(pathToFileURL(path.join(paketKoku, 'dist', 'libredwg-web.js')).href);
    const ortak = await import(pathToFileURL(ortakYol).href);
    const lib = await modul.LibreDwg.create(path.join(paketKoku, 'wasm') + path.sep);
    return { lib, turler: modul.Dwg_File_Type, cizimiCoz: ortak.cizimiCoz };
  })();
  return hazir;
}

/** Dosyayı okur ve sadeleştirilmiş çizimi döndürür. */
async function cadOku(dosyaYolu) {
  const { lib, turler, cizimiCoz } = await yukle();
  const tampon = fs.readFileSync(dosyaYolu);
  const veri = tampon.buffer.slice(tampon.byteOffset, tampon.byteOffset + tampon.byteLength);
  return cizimiCoz(lib, turler, veri, path.basename(dosyaYolu));
}

module.exports = { cadOku };