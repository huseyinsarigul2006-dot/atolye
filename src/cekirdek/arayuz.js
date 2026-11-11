// Ortak arayüz yardımcıları: HTML kaçışı, sayı biçimi, bildirim ve pencereler.

const KACIS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const kacis = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => KACIS[c]);

export function sayiYaz(n, basamak = 2) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: basamak }).format(n);
}

/** Girdi değerini sayıya çevirir; boş veya geçersizse varsayılanı döndürür. */
export function sayiOku(deger, varsayilan = 0) {
  const n = parseFloat(String(deger).replace(',', '.'));
  return Number.isFinite(n) ? n : varsayilan;
}

export const sinirla = (n, alt, ust) => Math.min(ust, Math.max(alt, n));

export const yeniKimlik = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function ogeOlustur(htmlMetni) {
  const sablon = document.createElement('template');
  sablon.innerHTML = htmlMetni.trim();
  return sablon.content.firstElementChild;
}

const bekleyenler = new Set();

/** Art arda çağrıları birleştirir; bekleyen iş `bekleyenleriCalistir` ile hemen yapılabilir. */
export function gecikmeli(islev, sure = 400) {
  let zamanlayici;
  let bekleyen = null;
  const calistir = () => {
    clearTimeout(zamanlayici);
    bekleyenler.delete(calistir);
    const is = bekleyen;
    bekleyen = null;
    if (is) islev(...is);
  };
  return (...argumanlar) => {
    bekleyen = argumanlar;
    bekleyenler.add(calistir);
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(calistir, sure);
  };
}

/** Pencere kapanırken henüz yazılmamış kayıtları hemen yazdırır. */
export function bekleyenleriCalistir() {
  for (const calistir of [...bekleyenler]) calistir();
}

export function tarihYaz(zaman) {
  return new Date(zaman).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function bildir(mesaj, tur = 'bilgi') {
  const kap = document.getElementById('bildirimler');
  const oge = ogeOlustur(`<div class="bildirim ${tur === 'hata' ? 'hata' : ''}">${kacis(mesaj)}</div>`);
  kap.append(oge);
  setTimeout(() => oge.remove(), 2600);
}

/**
 * Genel pencere. `govde` bir HTML metni veya öğe olabilir.
 * `dugmeler`: [{ metin, sinif, tikla(kapat) }]
 */
export function pencereAc({ baslik, govde, dugmeler = [], boyut = '', kapaninca }) {
  const perde = ogeOlustur(`
    <div class="perde">
      <div class="pencere ${boyut}" role="dialog" aria-modal="true">
        <div class="pencere-baslik"><h2>${kacis(baslik)}</h2><button class="pencere-kapat" aria-label="Kapat">×</button></div>
        <div class="pencere-govde"></div>
        ${dugmeler.length ? '<div class="pencere-alt"></div>' : ''}
      </div>
    </div>`);
  const govdeKap = perde.querySelector('.pencere-govde');
  if (typeof govde === 'string') govdeKap.innerHTML = govde;
  else govdeKap.append(govde);

  const kapat = () => {
    if (!perde.isConnected) return;
    perde.remove();
    document.removeEventListener('keydown', tusDinle, true);
    kapaninca?.();
  };
  const tusDinle = (o) => {
    if (o.key === 'Escape') { o.stopPropagation(); kapat(); }
  };
  document.addEventListener('keydown', tusDinle, true);
  perde.addEventListener('mousedown', (o) => { if (o.target === perde) kapat(); });
  perde.querySelector('.pencere-kapat').addEventListener('click', kapat);

  const alt = perde.querySelector('.pencere-alt');
  for (const d of dugmeler) {
    const dugme = ogeOlustur(`<button class="dugme ${d.sinif || ''}">${kacis(d.metin)}</button>`);
    dugme.addEventListener('click', () => d.tikla(kapat));
    alt.append(dugme);
  }
  document.body.append(perde);
  (perde.querySelector('[data-odak]') || perde.querySelector('input, select, textarea, .pencere-alt .birincil'))?.focus();
  return { kapat, kok: perde, govde: govdeKap };
}

/** Ad sorar; iptal edilirse null döner. */
export function isimSor(baslik, varsayilan = '', etiket = 'Ad') {
  return new Promise((coz) => {
    let sonuc = null;
    const govde = ogeOlustur(`<label class="alan"><span>${kacis(etiket)}</span><input type="text" maxlength="60" data-odak value="${kacis(varsayilan)}"></label>`);
    const girdi = govde.querySelector('input');
    const tamam = (kapat) => {
      const ad = girdi.value.trim();
      if (!ad) { girdi.focus(); return; }
      sonuc = ad;
      kapat();
    };
    const p = pencereAc({
      baslik,
      govde,
      dugmeler: [
        { metin: 'Vazgeç', tikla: (kapat) => kapat() },
        { metin: 'Kaydet', sinif: 'birincil', tikla: tamam },
      ],
      kapaninca: () => coz(sonuc),
    });
    girdi.addEventListener('keydown', (o) => { if (o.key === 'Enter') tamam(p.kapat); });
    girdi.select();
  });
}

export function onayla(mesaj, onayMetni = 'Sil', baslik = 'Emin misiniz?') {
  return new Promise((coz) => {
    let sonuc = false;
    pencereAc({
      baslik,
      govde: `<p>${kacis(mesaj)}</p>`,
      dugmeler: [
        { metin: 'Vazgeç', tikla: (kapat) => kapat() },
        { metin: onayMetni, sinif: 'birincil', tikla: (kapat) => { sonuc = true; kapat(); } },
      ],
      kapaninca: () => coz(sonuc),
    });
  });
}

/**
 * Kayıtlı öğeler listesi (plan, pano vb.). Seçilen kaydı döndürür, kapatılırsa null.
 * `sil(kayit)` verilirse her satırda Sil düğmesi görünür.
 */
export function kayitSec({ baslik, kayitlar, ayrinti = () => '', bosMesaj = 'Henüz kayıt yok.', sil }) {
  return new Promise((coz) => {
    let secilen = null;
    const liste = ogeOlustur('<div class="kayit-listesi"></div>');
    const p = pencereAc({ baslik, govde: liste, boyut: 'orta', kapaninca: () => coz(secilen) });
    const ciz = () => {
      liste.innerHTML = kayitlar.length ? '' : `<div class="bos-durum">${kacis(bosMesaj)}</div>`;
      for (const k of kayitlar) {
        const satir = ogeOlustur(`
          <div class="kayit">
            <div class="kayit-bilgi" tabindex="0" role="button">
              <div class="kayit-ad">${kacis(k.ad)}</div>
              <div class="kayit-ayrinti">${ayrinti(k)}</div>
            </div>
            <button class="dugme kucuk birincil" data-is="ac">Aç</button>
            ${sil ? '<button class="dugme kucuk tehlike" data-is="sil">Sil</button>' : ''}
          </div>`);
        const ac = () => { secilen = k; p.kapat(); };
        satir.querySelector('.kayit-bilgi').addEventListener('click', ac);
        satir.querySelector('[data-is="ac"]').addEventListener('click', ac);
        satir.querySelector('[data-is="sil"]')?.addEventListener('click', async () => {
          if (!(await onayla(`“${k.ad}” kalıcı olarak silinsin mi?`))) return;
          await sil(k);
          kayitlar.splice(kayitlar.indexOf(k), 1);
          ciz();
        });
        liste.append(satir);
      }
    };
    ciz();
  });
}

/** Sürüklenen veya seçilen dosyalardan yalnızca görselleri ayıklar. */
export function gorselDosyalari(dosyaListesi) {
  return [...(dosyaListesi || [])].filter((d) => /^image\/(png|jpeg|webp|gif|bmp)$/.test(d.type));
}

/** Windows dosya seçme penceresini açar. */
export function dosyaSec({ coklu = false } = {}) {
  return new Promise((coz) => {
    const girdi = document.createElement('input');
    girdi.type = 'file';
    girdi.accept = 'image/png,image/jpeg,image/webp,image/gif,image/bmp';
    girdi.multiple = coklu;
    girdi.style.display = 'none';
    const bitir = (dosyalar) => { girdi.remove(); coz(dosyalar); };
    girdi.addEventListener('change', () => bitir(gorselDosyalari(girdi.files)));
    girdi.addEventListener('cancel', () => bitir([]));
    document.body.append(girdi); // iPad'de seçicinin sonuç döndürmesi için girdi sayfada olmalı
    girdi.click();
  });
}
