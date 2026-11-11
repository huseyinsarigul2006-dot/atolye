// Araç 4 — Malzeme kütüphanesi: hazır malzemeler, arama/filtre, karşılaştırma ve kullanıcı malzemeleri.
import { depo } from '../cekirdek/depo.js';
import { kacis, ogeOlustur, yeniKimlik, bildir, onayla, pencereAc, dosyaSec } from '../cekirdek/arayuz.js';
import { MALZEMELER, KATEGORILER } from '../veri/malzemeler.js';

const SEVIYE = ['', 'Çok düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok yüksek'];
const MALIYET = ['', 'Ekonomik', 'Orta', 'Yüksek', 'Çok yüksek'];
const EN_COK = 3;

const kucuk = (s) => String(s || '').toLocaleLowerCase('tr');
const noktalar = (deger, toplam = 5) =>
  `<span class="noktalar" aria-hidden="true">${Array.from({ length: toplam }, (_, i) => `<i class="${i < deger ? 'dolu' : ''}"></i>`).join('')}</span>`;
const maliyetYaz = (d) => `<span class="lira"><b>${'₺'.repeat(d)}</b>${'₺'.repeat(4 - d)}</span>`;

function ornekStili(mlz) {
  const [a, b] = mlz.renk || ['#d9d4ca', '#bdb6a8'];
  if (mlz.doku === 'ahsap') {
    return `background: repeating-linear-gradient(92deg, transparent 0 9px, rgba(0,0,0,.05) 9px 10px, transparent 10px 23px, rgba(255,255,255,.07) 23px 25px), linear-gradient(180deg, ${a}, ${b});`;
  }
  if (mlz.doku === 'tas') {
    return `background: radial-gradient(circle at 22% 30%, rgba(255,255,255,.22) 0 9%, transparent 10%), radial-gradient(circle at 68% 62%, rgba(0,0,0,.08) 0 12%, transparent 13%), radial-gradient(circle at 45% 82%, rgba(255,255,255,.16) 0 7%, transparent 8%), linear-gradient(135deg, ${a}, ${b});`;
  }
  return `background: linear-gradient(135deg, ${a}, ${b});`;
}

const ornek = (mlz, sinif = '') => mlz.gorsel
  ? `<div class="mlz-ornek ${sinif}"><img data-gorsel="${kacis(mlz.gorsel)}" alt=""></div>`
  : `<div class="mlz-ornek ${sinif}" style="${ornekStili(mlz)}"></div>`;

/** data-gorsel taşıyan <img> öğelerine kayıtlı fotoğrafları yükler. */
async function gorselleriDoldur(kok) {
  for (const img of kok.querySelectorAll('img[data-gorsel]')) {
    const url = await depo.gorselURL(img.dataset.gorsel);
    if (url) img.src = url;
  }
}

export default {
  kimlik: 'malzeme',
  baslik: 'Malzeme Kütüphanesi',
  simge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12.500 9 5 9-5M3 17l9 5 9-5"/></svg>',

  async kur(kap) {
    let ozel = await depo.oku('malzemeler', []);
    const filtre = { ara: '', kategori: 'Tümü', nem: 0, maliyet: 0 };
    let karsilastir = [];

    const hepsi = () => [...ozel, ...MALZEMELER];
    const bul = (id) => hepsi().find((x) => x.id === id);

    kap.innerHTML = `
      <header class="arac-baslik">
        <h1>Malzeme Kütüphanesi</h1>
        <input type="search" class="mlz-ara" data-p="ara" placeholder="Malzeme, kullanım alanı veya özellik ara…" aria-label="Malzeme ara">
        <span class="bosluk"></span>
        <button class="dugme birincil" data-is="ekle">+ Malzeme ekle</button>
      </header>
      <div class="mlz-filtre">
        <div class="cipler" data-p="kategoriler"></div>
        <label class="alan"><span>Neme dayanım</span>
          <select data-p="nem"><option value="0">Tümü</option><option value="3">Orta ve üzeri</option><option value="4">Yüksek ve üzeri</option><option value="5">Çok yüksek</option></select></label>
        <label class="alan"><span>Maliyet</span>
          <select data-p="maliyet"><option value="0">Tümü</option><option value="1">₺ Ekonomik</option><option value="2">₺₺ ve altı</option><option value="3">₺₺₺ ve altı</option></select></label>
      </div>
      <div class="arac-govde">
        <div class="mlz-sayi" data-p="sayi"></div>
        <div class="mlz-izgara" data-p="izgara"></div>
      </div>
      <div class="mlz-cubuk" data-p="cubuk" hidden></div>`;

    const p = (ad) => kap.querySelector(`[data-p="${ad}"]`);

    function suzulmus() {
      const aranan = kucuk(filtre.ara.trim());
      return hepsi().filter((x) => {
        if (filtre.kategori === 'Eklediklerim' ? !x.ozel : filtre.kategori !== 'Tümü' && x.kategori !== filtre.kategori) return false;
        if (filtre.nem && x.nem < filtre.nem) return false;
        if (filtre.maliyet && x.maliyet > filtre.maliyet) return false;
        if (!aranan) return true;
        return [x.ad, x.kategori, x.kullanim, x.bakim, x.surdurulebilirlik, x.not].some((alan) => kucuk(alan).includes(aranan));
      });
    }

    function kategorileriCiz() {
      const liste = ['Tümü', ...KATEGORILER, 'Eklediklerim'];
      p('kategoriler').innerHTML = liste.map((k) => `<button class="cip ${k === filtre.kategori ? 'etkin' : ''}" data-kategori="${k}">${k}</button>`).join('');
    }

    function izgarayiCiz() {
      const liste = suzulmus();
      p('sayi').textContent = `${liste.length} malzeme`;
      p('izgara').innerHTML = liste.length
        ? liste.map((x) => `
          <article class="mlz-kart ${karsilastir.includes(x.id) ? 'secili' : ''}" data-id="${kacis(x.id)}" tabindex="0">
            ${ornek(x)}
            <div class="mlz-icerik">
              <div class="mlz-ust"><h3>${kacis(x.ad)}</h3>${x.ozel ? '<span class="etiket">Benim</span>' : ''}</div>
              <div class="mlz-kategori">${kacis(x.kategori)}</div>
              <dl class="mlz-olcu">
                <dt>Dayanıklılık</dt><dd>${noktalar(x.dayaniklilik)}</dd>
                <dt>Neme dayanım</dt><dd>${noktalar(x.nem)}</dd>
                <dt>Maliyet</dt><dd>${maliyetYaz(x.maliyet)}</dd>
              </dl>
              <label class="onay mlz-sec"><input type="checkbox" data-karsilastir="${kacis(x.id)}" ${karsilastir.includes(x.id) ? 'checked' : ''}> Karşılaştır</label>
            </div>
          </article>`).join('')
        : '<div class="bos-durum">Bu ölçütlere uyan malzeme bulunamadı.</div>';
      gorselleriDoldur(p('izgara'));
    }

    function cubuguCiz() {
      const cubuk = p('cubuk');
      karsilastir = karsilastir.filter(bul);
      cubuk.hidden = !karsilastir.length;
      if (!karsilastir.length) return;
      cubuk.innerHTML = `
        <span class="mlz-cubuk-yazi">Karşılaştırma (${karsilastir.length}/${EN_COK}):</span>
        <div class="cipler">${karsilastir.map((id) => `<button class="cip" data-cikar="${kacis(id)}" title="Listeden çıkar">${kacis(bul(id).ad)} ×</button>`).join('')}</div>
        <span class="bosluk"></span>
        <button class="dugme" data-is="temizle">Temizle</button>
        <button class="dugme birincil" data-is="karsilastir" ${karsilastir.length < 2 ? 'disabled' : ''}>Yan yana karşılaştır</button>`;
    }

    const yenile = () => { kategorileriCiz(); izgarayiCiz(); cubuguCiz(); };

    // ---------- Ayrıntı ----------
    function ayrintiAc(x) {
      const govde = ogeOlustur(`
        <div class="mlz-ayrinti">
          ${ornek(x, 'buyuk')}
          <div class="mlz-kategori">${kacis(x.kategori)}</div>
          <dl class="mlz-bilgi">
            <dt>Kullanım alanı</dt><dd>${kacis(x.kullanim) || '—'}</dd>
            <dt>Dayanıklılık</dt><dd>${noktalar(x.dayaniklilik)} ${SEVIYE[x.dayaniklilik]}</dd>
            <dt>Bakım</dt><dd>${kacis(x.bakim) || '—'}</dd>
            <dt>Neme dayanım</dt><dd>${noktalar(x.nem)} ${SEVIYE[x.nem]}</dd>
            <dt>Sürdürülebilirlik</dt><dd>${kacis(x.surdurulebilirlik) || '—'}</dd>
            <dt>Yaklaşık maliyet</dt><dd>${maliyetYaz(x.maliyet)} ${MALIYET[x.maliyet]}</dd>
            ${x.not ? `<dt>Not</dt><dd>${kacis(x.not)}</dd>` : ''}
          </dl>
        </div>`);
      const dugmeler = x.ozel
        ? [
          { metin: 'Sil', sinif: 'tehlike', tikla: async (kapat) => {
            if (!(await onayla(`“${x.ad}” kütüphanenizden silinsin mi?`))) return;
            ozel = ozel.filter((k) => k.id !== x.id);
            await depo.yaz('malzemeler', ozel);
            if (x.gorsel) depo.gorselSil(x.gorsel);
            kapat(); yenile();
          } },
          { metin: 'Düzenle', tikla: (kapat) => { kapat(); formAc(x); } },
          { metin: 'Kapat', sinif: 'birincil', tikla: (kapat) => kapat() },
        ]
        : [{ metin: 'Kapat', sinif: 'birincil', tikla: (kapat) => kapat() }];
      pencereAc({ baslik: x.ad, govde, boyut: 'orta', dugmeler });
      gorselleriDoldur(govde);
    }

    // ---------- Karşılaştırma ----------
    function karsilastirmaAc() {
      const secilenler = karsilastir.map(bul);
      const satir = (baslik, hucre) => `<tr><th>${baslik}</th>${secilenler.map((x) => `<td>${hucre(x)}</td>`).join('')}</tr>`;
      const govde = ogeOlustur(`
        <table class="tablo mlz-karsilastirma">
          <thead><tr><th></th>${secilenler.map((x) => `<th>${ornek(x, 'serit')}<div class="mlz-kb">${kacis(x.ad)}</div></th>`).join('')}</tr></thead>
          <tbody>
            ${satir('Kategori', (x) => kacis(x.kategori))}
            ${satir('Kullanım alanı', (x) => kacis(x.kullanim) || '—')}
            ${satir('Dayanıklılık', (x) => `${noktalar(x.dayaniklilik)}<br>${SEVIYE[x.dayaniklilik]}`)}
            ${satir('Bakım', (x) => kacis(x.bakim) || '—')}
            ${satir('Neme dayanım', (x) => `${noktalar(x.nem)}<br>${SEVIYE[x.nem]}`)}
            ${satir('Sürdürülebilirlik', (x) => kacis(x.surdurulebilirlik) || '—')}
            ${satir('Yaklaşık maliyet', (x) => `${maliyetYaz(x.maliyet)}<br>${MALIYET[x.maliyet]}`)}
          </tbody>
        </table>`);
      pencereAc({ baslik: 'Malzeme karşılaştırması', govde, boyut: 'genis', dugmeler: [{ metin: 'Kapat', sinif: 'birincil', tikla: (kapat) => kapat() }] });
      gorselleriDoldur(govde);
    }

    // ---------- Kullanıcı malzemesi formu ----------
    function formAc(mevcut = null) {
      const x = mevcut || { ad: '', kategori: 'Diğer', dayaniklilik: 3, nem: 3, maliyet: 2, kullanim: '', bakim: '', surdurulebilirlik: '', not: '', gorsel: null };
      let yeniDosya = null;
      const secenek = (liste, secili, bas = 1) => liste.slice(bas).map((ad, i) => `<option value="${i + bas}" ${i + bas === secili ? 'selected' : ''}>${i + bas} — ${ad}</option>`).join('');
      const govde = ogeOlustur(`
        <form class="yigin mlz-form">
          <div class="mlz-form-ust">
            <div class="mlz-foto" data-f="foto" tabindex="0" role="button" aria-label="Fotoğraf seç">${x.gorsel ? `<img data-gorsel="${kacis(x.gorsel)}" alt="">` : '<span>Fotoğraf<br>ekle</span>'}</div>
            <div class="yigin" style="flex:1">
              <label class="alan"><span>Malzeme adı</span><input type="text" data-f="ad" maxlength="60" data-odak value="${kacis(x.ad)}"></label>
              <label class="alan"><span>Kategori</span><select data-f="kategori">${KATEGORILER.map((k) => `<option ${k === x.kategori ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
            </div>
          </div>
          <div class="izgara-3">
            <label class="alan"><span>Dayanıklılık</span><select data-f="dayaniklilik">${secenek(SEVIYE, x.dayaniklilik)}</select></label>
            <label class="alan"><span>Neme dayanım</span><select data-f="nem">${secenek(SEVIYE, x.nem)}</select></label>
            <label class="alan"><span>Maliyet</span><select data-f="maliyet">${secenek(MALIYET, x.maliyet)}</select></label>
          </div>
          <label class="alan"><span>Kullanım alanı</span><input type="text" data-f="kullanim" maxlength="200" value="${kacis(x.kullanim)}"></label>
          <label class="alan"><span>Bakım</span><input type="text" data-f="bakim" maxlength="200" value="${kacis(x.bakim)}"></label>
          <label class="alan"><span>Sürdürülebilirlik notu</span><input type="text" data-f="surdurulebilirlik" maxlength="200" value="${kacis(x.surdurulebilirlik)}"></label>
          <label class="alan"><span>Not</span><textarea data-f="not" rows="3" maxlength="600" placeholder="Tedarikçi, ürün kodu, gözlemleriniz…">${kacis(x.not)}</textarea></label>
        </form>`);
      const f = (ad) => govde.querySelector(`[data-f="${ad}"]`);
      govde.addEventListener('submit', (o) => o.preventDefault());

      const fotoSec = async () => {
        const [dosya] = await dosyaSec();
        if (!dosya) return;
        yeniDosya = dosya;
        f('foto').innerHTML = `<img src="${URL.createObjectURL(dosya)}" alt="">`;
      };
      f('foto').addEventListener('click', fotoSec);
      f('foto').addEventListener('keydown', (o) => { if (o.key === 'Enter' || o.key === ' ') { o.preventDefault(); fotoSec(); } });
      // Denemelerde ve sürükle-bırakta da fotoğraf atanabilsin.
      f('foto').addEventListener('drop', (o) => {
        o.preventDefault();
        const dosya = [...o.dataTransfer.files].find((d) => d.type.startsWith('image/'));
        if (dosya) { yeniDosya = dosya; f('foto').innerHTML = `<img src="${URL.createObjectURL(dosya)}" alt="">`; }
      });

      pencereAc({
        baslik: mevcut ? 'Malzemeyi düzenle' : 'Kendi malzemeni ekle',
        govde,
        boyut: 'orta',
        dugmeler: [
          { metin: 'Vazgeç', tikla: (kapat) => kapat() },
          { metin: 'Kaydet', sinif: 'birincil', tikla: async (kapat) => {
            const ad = f('ad').value.trim();
            if (!ad) { f('ad').focus(); bildir('Malzeme adı gerekli.', 'hata'); return; }
            let gorsel = x.gorsel;
            if (yeniDosya) {
              gorsel = await depo.gorselKaydet(yeniDosya);
              if (x.gorsel) depo.gorselSil(x.gorsel);
            }
            const kayit = {
              id: mevcut?.id || 'k-' + yeniKimlik(), ozel: true, ad, gorsel,
              kategori: f('kategori').value,
              dayaniklilik: +f('dayaniklilik').value, nem: +f('nem').value, maliyet: +f('maliyet').value,
              kullanim: f('kullanim').value.trim(), bakim: f('bakim').value.trim(),
              surdurulebilirlik: f('surdurulebilirlik').value.trim(), not: f('not').value.trim(),
            };
            if (mevcut) ozel[ozel.findIndex((k) => k.id === mevcut.id)] = kayit;
            else ozel.unshift(kayit);
            if (await depo.yaz('malzemeler', ozel)) bildir(`“${ad}” kütüphaneye kaydedildi.`);
            kapat(); yenile();
          } },
        ],
      });
      gorselleriDoldur(govde);
    }

    // ---------- Olaylar ----------
    p('ara').addEventListener('input', (o) => { filtre.ara = o.target.value; izgarayiCiz(); });
    p('nem').addEventListener('change', (o) => { filtre.nem = +o.target.value; izgarayiCiz(); });
    p('maliyet').addEventListener('change', (o) => { filtre.maliyet = +o.target.value; izgarayiCiz(); });
    p('kategoriler').addEventListener('click', (o) => {
      const k = o.target.dataset.kategori;
      if (!k) return;
      filtre.kategori = k;
      kategorileriCiz(); izgarayiCiz();
    });
    kap.querySelector('[data-is="ekle"]').addEventListener('click', () => formAc());

    p('izgara').addEventListener('click', (o) => {
      if (o.target.closest('.mlz-sec')) return; // onay kutusu kendi olayını yönetir
      const kart = o.target.closest('[data-id]');
      if (kart) ayrintiAc(bul(kart.dataset.id));
    });
    p('izgara').addEventListener('keydown', (o) => {
      if (o.key === 'Enter' && o.target.matches('.mlz-kart')) ayrintiAc(bul(o.target.dataset.id));
    });
    p('izgara').addEventListener('change', (o) => {
      const id = o.target.dataset.karsilastir;
      if (!id) return;
      if (o.target.checked) {
        if (karsilastir.length >= EN_COK) {
          o.target.checked = false;
          bildir(`En çok ${EN_COK} malzeme karşılaştırılabilir.`, 'hata');
          return;
        }
        karsilastir.push(id);
      } else {
        karsilastir = karsilastir.filter((k) => k !== id);
      }
      o.target.closest('.mlz-kart').classList.toggle('secili', o.target.checked);
      cubuguCiz();
    });
    p('cubuk').addEventListener('click', (o) => {
      const is = o.target.dataset.is;
      if (o.target.dataset.cikar) karsilastir = karsilastir.filter((k) => k !== o.target.dataset.cikar);
      else if (is === 'temizle') karsilastir = [];
      else if (is === 'karsilastir') return karsilastirmaAc();
      else return;
      izgarayiCiz(); cubuguCiz();
    });

    yenile();
  },
};
