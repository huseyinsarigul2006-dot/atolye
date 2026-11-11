// Çalışmaları ayrı dosyalara (.atolye) kaydetme ve dosyadan açma.
// Dosya tek başına taşınabilsin diye kullanılan görseller de içine gömülür.
import { bildir } from './arayuz.js';

const kopru = window.atolye;
const TUR_ADLARI = { plan: 'oda planı', pano: 'moodboard panosu', palet: 'renk paleti' };

function taban64Yap(baytlar) {
  let metin = '';
  for (let i = 0; i < baytlar.length; i += 0x8000) metin += String.fromCharCode(...baytlar.subarray(i, i + 0x8000));
  return btoa(metin);
}

function taban64Coz(metin) {
  const ikili = atob(metin);
  const baytlar = new Uint8Array(ikili.length);
  for (let i = 0; i < ikili.length; i++) baytlar[i] = ikili.charCodeAt(i);
  return baytlar;
}

/**
 * "Farklı kaydet" penceresiyle çalışmayı dosyaya yazar.
 * @param {'plan'|'pano'|'palet'} tur
 * @param {string[]} gorselKimlikleri  dosyaya gömülecek görseller
 */
export async function dosyayaKaydet(tur, ad, veri, gorselKimlikleri = []) {
  try {
    const gorseller = {};
    for (const kimlik of new Set(gorselKimlikleri.filter(Boolean))) {
      const baytlar = await kopru.gorselOku(kimlik);
      if (baytlar) gorseller[kimlik] = taban64Yap(baytlar);
    }
    const yol = await kopru.dosyaKaydet(ad, JSON.stringify({ uygulama: 'Atölye', surum: 1, tur, veri, gorseller }));
    if (yol) bildir('Dosya kaydedildi: ' + yol);
    return yol;
  } catch (hata) {
    console.error(hata);
    bildir('Dosya kaydedilemedi.', 'hata');
    return null;
  }
}

/**
 * Dosya seçtirip açar. Gömülü görseller veri klasörüne alınır;
 * `gorselCevir(eskiKimlik)` dosyadaki kimliği yeni kimliğe çevirir.
 * @returns {Promise<null | { veri: any, gorselCevir: (kimlik: string) => string | null }>}
 */
export async function dosyadanAc(tur) {
  let dosya;
  try {
    dosya = await kopru.dosyaAc();
  } catch (hata) {
    console.error(hata);
    bildir('Dosya açılamadı.', 'hata');
    return null;
  }
  if (!dosya) return null;
  let icerik;
  try {
    icerik = JSON.parse(dosya.metin);
  } catch {
    bildir('Bu dosya okunamadı; geçerli bir Atölye dosyası değil.', 'hata');
    return null;
  }
  if (icerik?.uygulama !== 'Atölye' || !icerik.veri) {
    bildir('Bu dosya geçerli bir Atölye dosyası değil.', 'hata');
    return null;
  }
  if (icerik.tur !== tur) {
    bildir(`Bu dosya bir ${TUR_ADLARI[icerik.tur] || 'başka tür çalışma'}; burada ${TUR_ADLARI[tur]} açılabilir.`, 'hata');
    return null;
  }
  const esleme = new Map();
  for (const [kimlik, taban64] of Object.entries(icerik.gorseller || {})) {
    try {
      esleme.set(kimlik, await kopru.gorselKaydet(taban64Coz(taban64), kimlik.split('.').pop()));
    } catch (hata) {
      console.error(hata);
    }
  }
  return { veri: icerik.veri, gorselCevir: (kimlik) => esleme.get(kimlik) || null };
}
