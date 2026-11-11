// Araç 6 — Moodboard düzenleyici: boş tuvale görseller; taşı, boyutlandır, döndür, sırala.
// Bilerek yalnızca görsel içerir: başlık, etiket veya bölüm öğesi yoktur.
import { depo, gorselYukle } from '../cekirdek/depo.js';
import { kacis, sinirla, yeniKimlik, gecikmeli, bildir, isimSor, onayla, kayitSec, tarihYaz, dosyaSec, gorselDosyalari } from '../cekirdek/arayuz.js';

import { dosyayaKaydet, dosyadanAc } from '../cekirdek/dosya.js';

// Kâğıt ölçüleri (mm, dikey).
const BOYUTLAR = { A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841] };
const EN_KUCUK = 10; // mm

const bosPano = () => ({ id: null, ad: 'Adsız pano', boyut: 'A3', yon: 'yatay', ogeler: [] });

function sayfaOlcusu(pano) {
  const [kisa, uzun] = BOYUTLAR[pano.boyut] || BOYUTLAR.A3;
  return pano.yon === 'yatay' ? { en: uzun, boy: kisa } : { en: kisa, boy: uzun };
}

export default {
  kimlik: 'moodboard',
  baslik: 'Moodboard',
  simge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="10" rx="1.500"/><rect x="13" y="3" width="8" height="6" rx="1.500"/><rect x="13" y="11" width="8" height="10" rx="1.500"/><rect x="3" y="15" width="8" height="6" rx="1.500"/></svg>',

  async kur(kap) {
    let pano = (await depo.oku('pano-taslak')) || bosPano();
    let seciliId = null;
    let s = 1; // piksel / mm
    let surukle = null;
    const dugumler = new Map(); // öğe kimliği → DOM düğümü
    const taslakKaydet = gecikmeli(() => depo.yaz('pano-taslak', pano), 500);

    kap.innerHTML = `
      <header class="arac-baslik">
        <h1>Moodboard Düzenleyici</h1>
        <input type="text" class="plan-ad" data-p="ad" maxlength="60" aria-label="Pano adı">
        <span class="bosluk"></span>
        <button class="dugme" data-is="yeni">Yeni</button>
        <button class="dugme" data-is="ac">Aç…</button>
        <button class="dugme birincil" data-is="kaydet">Kaydet</button>
        <span class="ayrac"></span>
        <button class="dugme" data-is="dosya-ac" title="Bilgisayardaki bir .atolye dosyasını aç">Dosya aç…</button>
        <button class="dugme" data-is="dosya-kaydet" title="Bu panoyu görselleriyle birlikte ayrı bir dosyaya kaydet">Dosya kaydet…</button>
        <button class="dugme" data-is="png">PNG dışa aktar</button>
      </header>
      <div class="pano-cubuk">
        <button class="dugme" data-is="ekle">+ Görsel ekle</button>
        <label class="pano-boyut"><span>Tuval</span>
          <select data-p="boyut">${Object.entries(BOYUTLAR).map(([k, [a, b]]) => `<option value="${k}">${k} (${a} × ${b} mm)</option>`).join('')}</select></label>
        <div class="bolmeli" data-p="yon"><button data-yon="yatay">Yatay</button><button data-yon="dikey">Dikey</button></div>
        <span class="ayrac"></span>
        <div class="pano-secili" data-p="secili-araclar">
          <button class="dugme" data-is="one" title="En öne getir">En öne</button>
          <button class="dugme" data-is="ileri" title="Bir kat öne">Öne</button>
          <button class="dugme" data-is="geri" title="Bir kat arkaya">Arkaya</button>
          <button class="dugme" data-is="arkaya" title="En arkaya gönder">En arkaya</button>
          <button class="dugme" data-is="cogalt">Çoğalt</button>
          <button class="dugme tehlike" data-is="sil">Sil</button>
        </div>
      </div>
      <div class="pano-alan" data-p="alan" tabindex="0" aria-label="Moodboard tuvali">
        <div class="pano-sayfa" data-p="sayfa">
          <div class="pano-bos" data-p="bos"><b>Fotoğraf ve eskizlerinizi buraya sürükleyin</b><span>veya “Görsel ekle” ile bilgisayarınızdan seçin</span></div>
          <div class="pano-maske"></div>
          <div class="pano-secim" data-p="secim" hidden>
            <span class="tut kose" data-tut="boyut" style="left:0;top:0"></span><span class="tut kose" data-tut="boyut" style="left:100%;top:0"></span>
            <span class="tut kose" data-tut="boyut" style="left:0;top:100%"></span><span class="tut kose" data-tut="boyut" style="left:100%;top:100%"></span>
            <span class="tut-sap"></span><span class="tut don" data-tut="don" title="Döndür (Shift: 15° adım)"></span>
          </div>
        </div>
      </div>
      <div class="pano-durum" data-p="durum"></div>`;

    const p = (ad) => kap.querySelector(`[data-p="${ad}"]`);
    const alan = p('alan'), sayfa = p('sayfa');
    const secili = () => pano.ogeler.find((o) => o.id === seciliId);

    // ---------- Çizim ----------
    function olcegiHesapla() {
      const { en, boy } = sayfaOlcusu(pano);
      const g = alan.clientWidth - 48, y = alan.clientHeight - 48;
      if (g <= 0 || y <= 0) return false;
      s = Math.min(g / en, y / boy);
      sayfa.style.width = en * s + 'px';
      sayfa.style.height = boy * s + 'px';
      return true;
    }

    function dugumOlustur(oge) {
      const d = document.createElement('div');
      d.className = 'pano-oge';
      d.dataset.id = oge.id;
      d.innerHTML = '<img alt="" draggable="false">';
      depo.gorselURL(oge.gorsel).then((url) => {
        if (url) d.querySelector('img').src = url;
        else d.classList.add('eksik');
      });
      sayfa.append(d);
      return d;
    }

    function ciz() {
      if (!olcegiHesapla()) return;
      const gecerli = new Set(pano.ogeler.map((o) => o.id));
      for (const [id, d] of dugumler) if (!gecerli.has(id)) { d.remove(); dugumler.delete(id); }
      pano.ogeler.forEach((o, sira) => {
        let d = dugumler.get(o.id);
        if (!d) { d = dugumOlustur(o); dugumler.set(o.id, d); }
        d.style.left = (o.x - o.en / 2) * s + 'px';
        d.style.top = (o.y - o.boy / 2) * s + 'px';
        d.style.width = o.en * s + 'px';
        d.style.height = o.boy * s + 'px';
        d.style.transform = `rotate(${o.aci}deg)`;
        d.style.zIndex = sira + 1;
      });
      // Seçim çerçevesi ve tutamaçlar, sayfa dışına taşsa da görünsün diye ayrı bir katmandadır.
      const sec = secili(), kutu = p('secim');
      kutu.hidden = !sec;
      if (sec) {
        const d = dugumler.get(sec.id);
        for (const ozellik of ['left', 'top', 'width', 'height', 'transform']) kutu.style[ozellik] = d.style[ozellik];
      }
      p('bos').hidden = pano.ogeler.length > 0;
      for (const d of p('secili-araclar').children) d.disabled = !secili();
      const { en, boy } = sayfaOlcusu(pano);
      const o = secili();
      p('durum').textContent = `${pano.boyut} ${pano.yon} · ${en} × ${boy} mm · ${pano.ogeler.length} görsel`
        + (o ? ` · Seçili: ${Math.round(o.en)} × ${Math.round(o.boy)} mm, ${Math.round(((o.aci % 360) + 360) % 360)}°` : '');
    }

    function guncelle() { ciz(); taslakKaydet(); }

    function panoyuYukle(yeni) {
      pano = yeni;
      seciliId = null;
      for (const d of dugumler.values()) d.remove();
      dugumler.clear();
      p('ad').value = pano.ad;
      p('boyut').value = pano.boyut;
      for (const d of p('yon').children) d.classList.toggle('etkin', d.dataset.yon === pano.yon);
      guncelle();
    }

    function sayfayaSigdir(o) {
      const { en, boy } = sayfaOlcusu(pano);
      o.x = sinirla(o.x, 0, en);
      o.y = sinirla(o.y, 0, boy);
    }

    // ---------- Görsel ekleme ----------
    async function gorselleriEkle(dosyalar, konum = null) {
      const { en, boy } = sayfaOlcusu(pano);
      let sira = 0;
      for (const dosya of dosyalar) {
        try {
          const gorsel = await depo.gorselKaydet(dosya);
          const g = await gorselYukle(await depo.gorselURL(gorsel));
          let genislik = en * 0.3, yukseklik = (genislik * g.naturalHeight) / g.naturalWidth;
          if (yukseklik > boy * 0.6) { yukseklik = boy * 0.6; genislik = (yukseklik * g.naturalWidth) / g.naturalHeight; }
          const kayma = sira++ * Math.min(en, boy) * 0.04;
          const oge = { id: yeniKimlik(), gorsel, en: genislik, boy: yukseklik, aci: 0, x: (konum?.x ?? en / 2) + kayma, y: (konum?.y ?? boy / 2) + kayma };
          sayfayaSigdir(oge);
          pano.ogeler.push(oge);
          seciliId = oge.id;
        } catch (hata) {
          console.error(hata);
          bildir(`“${dosya.name}” eklenemedi.`, 'hata');
        }
      }
      guncelle();
    }

    // ---------- Fare etkileşimi ----------
    const nokta = (o) => {
      const r = sayfa.getBoundingClientRect();
      return { x: (o.clientX - r.left) / s, y: (o.clientY - r.top) / s };
    };

    sayfa.addEventListener('pointerdown', (o) => {
      if (o.button !== 0) return;
      const n = nokta(o);
      const tut = o.target.closest('[data-tut]');
      const dugum = o.target.closest('.pano-oge');
      if (!tut) seciliId = dugum ? dugum.dataset.id : null;
      const oge = secili();
      if (oge) {
        const baslangic = { n, x: oge.x, y: oge.y, en: oge.en, boy: oge.boy, aci: oge.aci };
        surukle = { tur: tut ? tut.dataset.tut : 'tasi', oge, ...baslangic };
      } else {
        surukle = null;
      }
      try { sayfa.setPointerCapture(o.pointerId); } catch { /* yakalanamazsa sürükleme yine çalışır */ }
      alan.focus({ preventScroll: true });
      ciz();
    });

    sayfa.addEventListener('pointermove', (o) => {
      if (!surukle) return;
      const n = nokta(o);
      const { oge } = surukle;
      if (surukle.tur === 'tasi') {
        oge.x = surukle.x + (n.x - surukle.n.x);
        oge.y = surukle.y + (n.y - surukle.n.y);
        sayfayaSigdir(oge);
      } else if (surukle.tur === 'boyut') {
        // Merkez sabit, en-boy oranı korunarak ölçekle.
        const ilk = Math.hypot(surukle.n.x - oge.x, surukle.n.y - oge.y) || 1;
        const kat = Math.max(EN_KUCUK / Math.min(surukle.en, surukle.boy), Math.hypot(n.x - oge.x, n.y - oge.y) / ilk);
        oge.en = surukle.en * kat;
        oge.boy = surukle.boy * kat;
      } else {
        const aci = (q) => (Math.atan2(q.y - oge.y, q.x - oge.x) * 180) / Math.PI;
        let yeni = surukle.aci + aci(n) - aci(surukle.n);
        if (o.shiftKey) yeni = Math.round(yeni / 15) * 15;
        oge.aci = yeni;
      }
      ciz();
    });

    const birak = () => { if (surukle) { surukle = null; taslakKaydet(); } };
    sayfa.addEventListener('pointerup', birak);
    sayfa.addEventListener('pointercancel', birak);

    // ---------- Sıralama ve düzenleme ----------
    function siraDegistir(is) {
      const o = secili();
      if (!o) return;
      const i = pano.ogeler.indexOf(o);
      pano.ogeler.splice(i, 1);
      const hedef = is === 'one' ? pano.ogeler.length : is === 'arkaya' ? 0 : sinirla(i + (is === 'ileri' ? 1 : -1), 0, pano.ogeler.length);
      pano.ogeler.splice(hedef, 0, o);
      guncelle();
    }

    function seciliyiSil() {
      pano.ogeler = pano.ogeler.filter((o) => o.id !== seciliId);
      seciliId = null;
      guncelle();
    }

    function cogalt() {
      const o = secili();
      if (!o) return;
      const kopya = { ...o, id: yeniKimlik(), x: o.x + 8, y: o.y + 8 };
      sayfayaSigdir(kopya);
      pano.ogeler.push(kopya);
      seciliId = kopya.id;
      guncelle();
    }

    alan.addEventListener('keydown', (o) => {
      const oge = secili();
      if (!oge) return;
      const adim = o.shiftKey ? 10 : 1;
      const oklar = { ArrowLeft: [-adim, 0], ArrowRight: [adim, 0], ArrowUp: [0, -adim], ArrowDown: [0, adim] };
      if (o.key === 'Delete' || o.key === 'Backspace') seciliyiSil();
      else if (oklar[o.key]) { oge.x += oklar[o.key][0]; oge.y += oklar[o.key][1]; sayfayaSigdir(oge); guncelle(); }
      else if (o.key === ']') siraDegistir('ileri');
      else if (o.key === '[') siraDegistir('geri');
      else return;
      o.preventDefault();
    });

    // ---------- Sürükle-bırak ile dosya ----------
    alan.addEventListener('dragover', (o) => {
      if (!o.dataTransfer.types.includes('Files')) return;
      o.preventDefault();
      o.dataTransfer.dropEffect = 'copy';
      sayfa.classList.add('uzerinde');
    });
    alan.addEventListener('dragleave', (o) => { if (!alan.contains(o.relatedTarget)) sayfa.classList.remove('uzerinde'); });
    alan.addEventListener('drop', (o) => {
      o.preventDefault();
      sayfa.classList.remove('uzerinde');
      const dosyalar = gorselDosyalari(o.dataTransfer.files);
      if (!dosyalar.length) { bildir('Yalnızca görsel dosyaları eklenebilir (PNG, JPG, WebP).', 'hata'); return; }
      const n = nokta(o);
      const { en, boy } = sayfaOlcusu(pano);
      const icinde = n.x >= 0 && n.x <= en && n.y >= 0 && n.y <= boy;
      gorselleriEkle(dosyalar, icinde ? n : null);
    });

    // ---------- Tuval boyutu ----------
    p('boyut').addEventListener('change', (o) => {
      const eski = sayfaOlcusu(pano);
      pano.boyut = o.target.value;
      const kat = sayfaOlcusu(pano).en / eski.en; // A serisi aynı orandadır: düzen korunur
      for (const oge of pano.ogeler) { oge.x *= kat; oge.y *= kat; oge.en *= kat; oge.boy *= kat; }
      guncelle();
    });
    p('yon').addEventListener('click', (o) => {
      const yon = o.target.dataset.yon;
      if (!yon || yon === pano.yon) return;
      pano.yon = yon;
      for (const d of p('yon').children) d.classList.toggle('etkin', d.dataset.yon === yon);
      pano.ogeler.forEach(sayfayaSigdir);
      guncelle();
    });

    // ---------- Kaydet / aç / dışa aktar ----------
    async function kaydet() {
      const panolar = await depo.oku('panolar', []);
      let ad = p('ad').value.trim();
      if (!ad || (!pano.id && ad === 'Adsız pano')) {
        ad = await isimSor('Panoyu kaydet', '', 'Pano adı');
        if (!ad) return;
      }
      if (!panolar.some((k) => k.id === pano.id)) {
        const ayni = panolar.find((k) => k.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
        if (ayni && !(await onayla(`“${ad}” adında bir pano zaten var. Üzerine yazılsın mı?`, 'Üzerine yaz', 'Aynı adda pano var'))) return;
        pano.id = ayni ? ayni.id : yeniKimlik();
      }
      pano.ad = ad;
      pano.guncelleme = Date.now();
      p('ad').value = ad;
      const kopya = structuredClone(pano);
      const sira = panolar.findIndex((k) => k.id === pano.id);
      if (sira >= 0) panolar[sira] = kopya; else panolar.unshift(kopya);
      if (await depo.yaz('panolar', panolar)) bildir(`“${ad}” kaydedildi.`);
      depo.yaz('pano-taslak', pano);
    }

    async function ac() {
      const panolar = await depo.oku('panolar', []);
      panolar.sort((a, b) => (b.guncelleme || 0) - (a.guncelleme || 0));
      const secilen = await kayitSec({
        baslik: 'Kayıtlı panolar',
        kayitlar: panolar,
        bosMesaj: 'Henüz kaydedilmiş pano yok.',
        ayrinti: (k) => `${kacis(k.boyut)} ${kacis(k.yon)} · ${k.ogeler.length} görsel · ${tarihYaz(k.guncelleme)}`,
        sil: async (k) => {
          const kalanlar = (await depo.oku('panolar', [])).filter((x) => x.id !== k.id);
          await depo.yaz('panolar', kalanlar);
          if (pano.id === k.id) pano.id = null;
          // Başka hiçbir panoda kullanılmayan görselleri veri klasöründen temizle.
          const kullanilan = new Set([...kalanlar, pano].flatMap((x) => x.ogeler.map((o) => o.gorsel)));
          for (const g of new Set(k.ogeler.map((o) => o.gorsel))) if (!kullanilan.has(g)) depo.gorselSil(g);
        },
      });
      if (secilen) panoyuYukle(structuredClone(secilen));
    }

    async function pngDisaAktar() {
      if (!pano.ogeler.length) { bildir('Dışa aktarmak için panoya en az bir görsel ekleyin.', 'hata'); return; }
      const { en, boy } = sayfaOlcusu(pano);
      const k = Math.min(150 / 25.4, 4200 / Math.max(en, boy)); // 150 dpi, en çok 4200 px
      const t = document.createElement('canvas');
      t.width = Math.round(en * k);
      t.height = Math.round(boy * k);
      const c = t.getContext('2d');
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, t.width, t.height);
      c.imageSmoothingQuality = 'high';
      for (const o of pano.ogeler) {
        const url = await depo.gorselURL(o.gorsel);
        if (!url) continue;
        const g = await gorselYukle(url);
        c.save();
        c.translate(o.x * k, o.y * k);
        c.rotate((o.aci * Math.PI) / 180);
        c.drawImage(g, (-o.en / 2) * k, (-o.boy / 2) * k, o.en * k, o.boy * k);
        c.restore();
      }
      await depo.pngDisaAktar(pano.ad, t);
    }

    kap.querySelector('.arac-baslik').addEventListener('click', async (o) => {
      const is = o.target.dataset.is;
      if (is === 'kaydet') kaydet();
      else if (is === 'ac') ac();
      else if (is === 'png') pngDisaAktar();
      else if (is === 'dosya-kaydet') dosyayaKaydet('pano', pano.ad, pano, pano.ogeler.map((x) => x.gorsel));
      else if (is === 'dosya-ac') {
        const dosya = await dosyadanAc('pano');
        const v = dosya?.veri;
        if (!v) return;
        if (!Array.isArray(v.ogeler) || !BOYUTLAR[v.boyut]) { bildir('Dosyadaki pano okunamadı.', 'hata'); return; }
        // Gömülü görseller veri klasörüne alındı; öğeleri yeni görsel kimliklerine bağla.
        const ogeler = v.ogeler.map((x) => ({ ...x, id: yeniKimlik(), gorsel: dosya.gorselCevir(x.gorsel) || x.gorsel }));
        panoyuYukle({ ...v, id: null, ogeler });
        bildir(`“${pano.ad}” dosyadan açıldı.`);
      } else if (is === 'yeni') {
        if (pano.ogeler.length && !(await onayla('Açık pano kapatılıp boş bir pano başlatılacak. Kaydetmediğiniz değişiklikler kaybolur.', 'Yeni pano', 'Yeni pano'))) return;
        panoyuYukle(bosPano());
      }
    });
    kap.querySelector('.pano-cubuk').addEventListener('click', async (o) => {
      const is = o.target.dataset.is;
      if (is === 'ekle') gorselleriEkle(await dosyaSec({ coklu: true }));
      else if (is === 'sil') seciliyiSil();
      else if (is === 'cogalt') cogalt();
      else if (is) siraDegistir(is);
    });
    p('ad').addEventListener('input', (o) => { pano.ad = o.target.value.trim() || 'Adsız pano'; taslakKaydet(); });

    new ResizeObserver(() => ciz()).observe(alan);
    this.gosterildi = ciz;
    panoyuYukle(pano);
  },
};
