// Kalıcı veri katmanı: JSON kayıtları ve görseller uygulamanın veri klasöründe tutulur.
import { bildir } from './arayuz.js';

const kopru = window.atolye;
const urlOnbellek = new Map();
const TURLER = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp' };

export const depo = {
  async oku(ad, varsayilan = null) {
    const veri = await kopru.veriOku(ad);
    return veri ?? varsayilan;
  },

  async yaz(ad, veri) {
    try {
      await kopru.veriYaz(ad, veri);
      return true;
    } catch (hata) {
      console.error(hata);
      bildir('Kaydedilemedi: veri klasörüne yazılamıyor.', 'hata');
      return false;
    }
  },

  /** Dosyayı veri klasörüne kopyalar ve görsel kimliğini döndürür. */
  async gorselKaydet(dosya) {
    const uzanti = (dosya.name?.split('.').pop() || dosya.type?.split('/').pop() || 'png').toLowerCase();
    return kopru.gorselKaydet(await dosya.arrayBuffer(), uzanti);
  },

  /** Görsel için tuvale güvenle çizilebilen bir adres döndürür (yoksa null). */
  async gorselURL(kimlik) {
    if (!kimlik) return null;
    if (urlOnbellek.has(kimlik)) return urlOnbellek.get(kimlik);
    const tampon = await kopru.gorselOku(kimlik);
    if (!tampon) return null;
    const tur = TURLER[kimlik.split('.').pop()] || 'image/png';
    const url = URL.createObjectURL(new Blob([tampon], { type: tur }));
    urlOnbellek.set(kimlik, url);
    return url;
  },

  async gorselSil(kimlik) {
    const url = urlOnbellek.get(kimlik);
    if (url) { URL.revokeObjectURL(url); urlOnbellek.delete(kimlik); }
    await kopru.gorselSil(kimlik);
  },

  /** "Farklı kaydet" penceresiyle PNG kaydeder; kaydedildiyse dosya yolunu döndürür. */
  async pngDisaAktar(ad, tuval) {
    try {
      const yol = await kopru.pngDisaAktar(ad, tuval.toDataURL('image/png'));
      if (yol) bildir('PNG kaydedildi: ' + yol);
      return yol;
    } catch (hata) {
      console.error(hata);
      bildir('PNG kaydedilemedi.', 'hata');
      return null;
    }
  },

  kopyala(metin) {
    kopru.panoyaKopyala(metin);
    bildir(`Kopyalandı: ${metin}`);
  },

  temaAyarla: (tema) => kopru.temaAyarla(tema),
  veriKlasorunuAc: () => kopru.veriKlasorunuAc(),
};

/** Görsel adresini yükleyip HTMLImageElement döndürür. */
export function gorselYukle(url) {
  return new Promise((coz, reddet) => {
    const g = new Image();
    g.onload = () => coz(g);
    g.onerror = () => reddet(new Error('Görsel yüklenemedi'));
    g.src = url;
  });
}
