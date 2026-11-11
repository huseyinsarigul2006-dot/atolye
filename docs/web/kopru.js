// Web / iPad sürümü köprüsü: Windows sürümünde preload.js'in sağladığı `window.atolye`
// arabirimini tarayıcı olanaklarıyla (IndexedDB, dosya seçici, paylaşım) karşılar.
// Yalnızca web derlemesinde sayfaya eklenir (scripts/web-derle.js).

const VT_ADI = 'atolye';
let vt = null;

function vtAc() {
  vt ||= new Promise((coz, reddet) => {
    const istek = indexedDB.open(VT_ADI, 1);
    istek.onupgradeneeded = () => {
      istek.result.createObjectStore('veri');
      istek.result.createObjectStore('gorseller');
    };
    istek.onsuccess = () => coz(istek.result);
    istek.onerror = () => reddet(istek.error);
  });
  return vt;
}

async function islem(depo, kip, is) {
  const baglanti = await vtAc();
  return new Promise((coz, reddet) => {
    const tx = baglanti.transaction(depo, kip);
    const istek = is(tx.objectStore(depo));
    tx.oncomplete = () => coz(istek?.result);
    tx.onerror = tx.onabort = () => reddet(tx.error);
  });
}

const temizAd = (ad, varsayilan) => String(ad || varsayilan).replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);

/**
 * Dosyayı kullanıcıya verir: iPad'de paylaşım sayfası ("Dosyalar'a Kaydet", "Görüntüyü Kaydet"),
 * desteklenmiyorsa normal indirme. Vazgeçilirse null döner.
 */
async function dosyaVer(blob, dosyaAdi) {
  const dosya = new File([blob], dosyaAdi, { type: blob.type });
  const dokunmatik = matchMedia('(pointer: coarse)').matches;
  if (dokunmatik && navigator.canShare?.({ files: [dosya] })) {
    try {
      await navigator.share({ files: [dosya] });
      return dosyaAdi;
    } catch (hata) {
      if (hata.name === 'AbortError') return null;
      // Paylaşım kullanılamadıysa indirmeye düş.
    }
  }
  const url = URL.createObjectURL(blob);
  const baglanti = document.createElement('a');
  baglanti.href = url;
  baglanti.download = dosyaAdi;
  document.body.append(baglanti);
  baglanti.click();
  baglanti.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return dosyaAdi;
}

/** Dosya seçtirir; vazgeçilirse null. iOS'ta girdinin sayfada bulunması gerekir. */
function dosyaSectir() {
  return new Promise((coz) => {
    const girdi = document.createElement('input');
    girdi.type = 'file';
    girdi.style.display = 'none';
    const bitir = (dosya) => { girdi.remove(); coz(dosya); };
    girdi.addEventListener('change', () => bitir(girdi.files[0] || null));
    girdi.addEventListener('cancel', () => bitir(null));
    document.body.append(girdi);
    girdi.click();
  });
}

let cadHazir = null;
function cadYukle() {
  cadHazir ||= (async () => {
    const [kutuphane, ortak] = await Promise.all([
      import('../kutuphane/libredwg/dist/libredwg-web.js'),
      import('../ortak/cad-duzlestir.mjs'),
    ]);
    const klasor = new URL('../kutuphane/libredwg/wasm', import.meta.url).href;
    const lib = await kutuphane.LibreDwg.create(klasor);
    return { lib, turler: kutuphane.Dwg_File_Type, cizimiCoz: ortak.cizimiCoz };
  })();
  cadHazir.catch(() => { cadHazir = null; });
  return cadHazir;
}

/** Çizim içeriğini çözer (denemelerde doğrudan da çağrılır). */
export async function cadCoz(veri, ad) {
  const { lib, turler, cizimiCoz } = await cadYukle();
  return cizimiCoz(lib, turler, veri, ad);
}

window.atolye = {
  web: true,

  veriOku: (ad) => islem('veri', 'readonly', (d) => d.get(ad)).then((v) => v ?? null),
  veriYaz: (ad, veri) => islem('veri', 'readwrite', (d) => d.put(veri, ad)).then(() => true),

  async gorselKaydet(tampon, uzanti) {
    uzanti = String(uzanti || 'png').toLowerCase();
    if (!/^(png|jpg|jpeg|webp|gif|bmp)$/.test(uzanti)) uzanti = 'png';
    const rastgele = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
    const kimlik = `${rastgele}.${uzanti}`;
    const baytlar = tampon instanceof Uint8Array ? tampon : new Uint8Array(tampon);
    await islem('gorseller', 'readwrite', (d) => d.put(baytlar, kimlik));
    return kimlik;
  },
  gorselOku: (kimlik) => islem('gorseller', 'readonly', (d) => d.get(kimlik)).then((v) => v ?? null),
  gorselSil: (kimlik) => islem('gorseller', 'readwrite', (d) => d.delete(kimlik)).then(() => true),

  async pngDisaAktar(ad, veriURL) {
    const blob = await (await fetch(veriURL)).blob();
    return dosyaVer(blob, temizAd(ad, 'atolye') + '.png');
  },

  dosyaKaydet: (ad, metin) =>
    dosyaVer(new Blob([metin], { type: 'application/json' }), temizAd(ad, 'atolye') + '.atolye'),

  async dosyaAc() {
    const dosya = await dosyaSectir();
    return dosya ? { yol: dosya.name, metin: await dosya.text() } : null;
  },

  async cadAc() {
    const dosya = await dosyaSectir();
    if (!dosya) return null;
    if (!/\.(dwg|dxf)$/i.test(dosya.name)) return { hata: 'Lütfen bir DWG veya DXF dosyası seçin.' };
    try {
      return await cadCoz(await dosya.arrayBuffer(), dosya.name);
    } catch (hata) {
      console.error(hata);
      return { hata: String(hata.message || hata) };
    }
  },

  async panoyaKopyala(metin) {
    try { await navigator.clipboard.writeText(String(metin)); } catch { /* izin verilmediyse sessizce geç */ }
    return true;
  },

  temaAyarla: async () => true,
  veriKlasorunuAc: async () => true,
};

// Tarayıcının depolama alanını boşaltırken bu uygulamanın verisini silmemesini iste.
navigator.storage?.persist?.().catch(() => {});

// Çevrimdışı çalışma için dosyaları önbelleğe alan servis çalışanı.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((hata) => console.warn(hata)));
}
