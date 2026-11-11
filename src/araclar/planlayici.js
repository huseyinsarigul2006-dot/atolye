// Araç 2 — Oda yerleşim planlayıcı: ölçekli 2B plan, kapı/pencere, sürükle-bırak mobilya.
import { depo, gorselYukle } from '../cekirdek/depo.js';
import { kacis, sayiYaz, sayiOku, sinirla, yeniKimlik, gecikmeli, bildir, isimSor, onayla, kayitSec, tarihYaz } from '../cekirdek/arayuz.js';
import { MOBILYA_GRUPLARI, MOBILYA_SOZLUGU } from '../veri/mobilyalar.js';
import { denetle, duvarGeometrisi } from './plan/denetim.js';
import { planSvg, olcekHesapla } from './plan/cizim.js';
import { cadIceAktar } from '../cekirdek/cad.js';
import { dosyayaKaydet, dosyadanAc } from '../cekirdek/dosya.js';

const SURUKLE_TURU = 'application/x-atolye-mobilya';
const DUVARLAR = { ust: 'Üst', sag: 'Sağ', alt: 'Alt', sol: 'Sol' };

const bosPlan = () => ({
  id: null,
  ad: 'Adsız plan',
  oda: { en: 400, boy: 350 },
  acikliklar: [
    { id: yeniKimlik(), tur: 'kapi', duvar: 'alt', konum: 30, genislik: 90, ters: false },
    { id: yeniKimlik(), tur: 'pencere', duvar: 'ust', konum: 140, genislik: 120 },
  ],
  mobilyalar: [],
});

export default {
  kimlik: 'planlayici',
  baslik: 'Oda Planlayıcı',
  simge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 10h7v4M14 21v-6h7M14 3v5"/></svg>',

  async kur(kap) {
    let plan = (await depo.oku('plan-taslak')) || bosPlan();
    let seciliId = null;
    let izgara = true;
    let yakala = true;
    let surukle = null;
    let denetim = denetle(plan);
    let gorunum = { s: 1, ox: 0, oy: 0 };
    let sonZemin = null;
    const taslakKaydet = gecikmeli(() => depo.yaz('plan-taslak', plan), 500);

    kap.innerHTML = `
      <header class="arac-baslik">
        <h1>Oda Yerleşim Planlayıcı</h1>
        <input type="text" class="plan-ad" data-p="ad" maxlength="60" aria-label="Plan adı">
        <span class="bosluk"></span>
        <button class="dugme" data-is="yeni">Yeni</button>
        <button class="dugme" data-is="ac">Aç…</button>
        <button class="dugme birincil" data-is="kaydet">Kaydet</button>
        <span class="ayrac"></span>
        <button class="dugme" data-is="dosya-ac" title="Bilgisayardaki bir .atolye dosyasını aç">Dosya aç…</button>
        <button class="dugme" data-is="dosya-kaydet" title="Bu planı ayrı bir dosyaya kaydet">Dosya kaydet…</button>
        <button class="dugme" data-is="png">PNG dışa aktar</button>
      </header>
      <div class="plan-duzen">
        <aside class="plan-sol">
          <section class="kart">
            <h2>Oda</h2>
            <div class="izgara-2">
              <label class="alan"><span>En (cm)</span><input type="number" data-p="en" min="100" max="3000" step="5"></label>
              <label class="alan"><span>Boy (cm)</span><input type="number" data-p="boy" min="100" max="3000" step="5"></label>
            </div>
            <div class="plan-secenekler">
              <label class="onay"><input type="checkbox" data-p="izgara" checked> Izgara</label>
              <label class="onay"><input type="checkbox" data-p="yakala" checked> 5 cm'ye yakala</label>
            </div>
            <div class="izgara-2">
              <button class="dugme" data-is="kapi">+ Kapı</button>
              <button class="dugme" data-is="pencere">+ Pencere</button>
            </div>
            <button class="dugme plan-cad" data-is="cad" title="AutoCAD çizimini (DWG veya DXF) ölçekli altlık olarak aç">DWG / DXF içe aktar…</button>
            <div class="plan-altlik" data-p="altlik" hidden></div>
          </section>
          <section class="kart plan-kutuphane">
            <h2>Mobilyalar</h2>
            <input type="search" data-p="ara" placeholder="Mobilya ara…" aria-label="Mobilya ara">
            <p class="kart-alt">Plana sürükleyin veya + ile ekleyin.</p>
            <div class="mobilya-liste" data-p="liste"></div>
          </section>
        </aside>
        <div class="plan-tuval" data-p="tuval" tabindex="0" aria-label="Plan çizimi"><svg xmlns="http://www.w3.org/2000/svg"><g data-kat="zemin"></g><g data-kat="ust"></g></svg></div>
        <aside class="plan-sag">
          <section class="kart"><h2>Seçili öğe</h2><div data-p="ozellik"></div></section>
          <section class="kart plan-uyarilar"><h2>Uyarılar <span class="rozet" data-p="uyari-sayi"></span></h2><div data-p="uyarilar"></div></section>
        </aside>
      </div>`;

    const p = (ad) => kap.querySelector(`[data-p="${ad}"]`);
    const tuval = p('tuval');
    const svg = tuval.querySelector('svg');

    const seciliMobilya = () => plan.mobilyalar.find((m) => m.id === seciliId);
    const seciliAciklik = () => plan.acikliklar.find((a) => a.id === seciliId);
    const hizala = (v) => (yakala ? Math.round(v / 5) * 5 : Math.round(v));

    function sinirIcineAl(m) {
      m.en = sinirla(m.en, 10, 1000);
      m.boy = sinirla(m.boy, 10, 1000);
      m.x = sinirla(m.x, 0, Math.max(0, plan.oda.en - m.en));
      m.y = sinirla(m.y, 0, Math.max(0, plan.oda.boy - m.boy));
    }
    function aciklikSinirla(a) {
      const uzunluk = duvarGeometrisi(plan.oda, a.duvar).uzunluk;
      a.genislik = sinirla(a.genislik, 30, uzunluk);
      a.konum = sinirla(a.konum, 0, uzunluk - a.genislik);
    }

    // ---------- Çizim ----------
    function svgCiz() {
      const g = tuval.clientWidth - 24, y = tuval.clientHeight - 24;
      if (g <= 0 || y <= 0) return;
      const s = olcekHesapla(plan.oda, g, y);
      const cizim = planSvg(plan, { s, izgara, seciliId, denetim });
      svg.setAttribute('width', cizim.genislik);
      svg.setAttribute('height', cizim.yukseklik);
      // Zemin katmanı (ızgara + DWG altlığı) yalnızca değiştiğinde yeniden kurulur; sürükleme akıcı kalır.
      if (cizim.zemin !== sonZemin) {
        sonZemin = cizim.zemin;
        svg.children[0].innerHTML = cizim.zemin;
      }
      svg.children[1].innerHTML = cizim.icerik;
      gorunum = { s, ox: cizim.ox, oy: cizim.oy };
    }

    function uyarilariCiz() {
      const { uyarilar } = denetim;
      p('uyari-sayi').textContent = uyarilar.length || '';
      p('uyari-sayi').style.display = uyarilar.length ? '' : 'none';
      p('uyarilar').innerHTML = uyarilar.length
        ? uyarilar.map((u, i) => `<button class="uyari ${u.tur}" data-uyari="${i}"><span class="nokta"></span><span>${kacis(u.mesaj)}</span></button>`).join('')
        : `<p class="uyari-yok">${plan.mobilyalar.length ? 'Sorun yok: çakışma veya dar geçiş bulunmuyor.' : 'Mobilya eklediğinizde çakışmalar ve 60 cm’den dar geçişler burada listelenir.'}</p>`;
    }

    function ozellikleriCiz() {
      const kutu = p('ozellik');
      const m = seciliMobilya(), a = seciliAciklik();
      const sayi = (etiket, alan, deger, ek = '') => `<label class="alan"><span>${etiket}</span><input type="number" step="1" data-alan="${alan}" value="${Math.round(deger)}" ${ek}></label>`;
      if (m) {
        kutu.innerHTML = `
          <div class="yigin">
            <label class="alan"><span>Ad</span><input type="text" data-alan="ad" maxlength="40" value="${kacis(m.ad)}"></label>
            <div class="izgara-2">${sayi('En (cm)', 'en', m.en, 'min="10"')}${sayi('Boy (cm)', 'boy', m.boy, 'min="10"')}${sayi('Sol duvardan (cm)', 'x', m.x, 'min="0"')}${sayi('Üst duvardan (cm)', 'y', m.y, 'min="0"')}</div>
            <div class="izgara-2">
              <button class="dugme" data-is="dondur">90° döndür</button>
              <button class="dugme" data-is="cogalt">Çoğalt</button>
            </div>
            <button class="dugme tehlike" data-is="sil">Sil</button>
          </div>`;
      } else if (a) {
        kutu.innerHTML = `
          <div class="yigin">
            <div class="kart-alt">${a.tur === 'kapi' ? 'Kapı' : 'Pencere'}</div>
            <label class="alan"><span>Duvar</span><select data-alan="duvar">${Object.entries(DUVARLAR).map(([k, v]) => `<option value="${k}" ${k === a.duvar ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <div class="izgara-2">${sayi('Konum (cm)', 'konum', a.konum, 'min="0"')}${sayi('Genişlik (cm)', 'genislik', a.genislik, 'min="30"')}</div>
            ${a.tur === 'kapi' ? '<button class="dugme" data-is="cevir">Açılış yönünü çevir</button>' : ''}
            <button class="dugme tehlike" data-is="sil">Sil</button>
          </div>`;
      } else {
        kutu.innerHTML = `<p class="kart-alt">Düzenlemek için plandaki bir mobilyaya, kapıya veya pencereye tıklayın.<br><br><b>Kısayollar:</b> R döndür · Delete sil · ok tuşları kaydır</p>`;
      }
    }

    function guncelle({ ozellik = true } = {}) {
      denetim = denetle(plan);
      svgCiz();
      uyarilariCiz();
      if (ozellik) ozellikleriCiz();
      taslakKaydet();
    }

    function planiYukle(yeni) {
      plan = yeni;
      seciliId = null;
      p('ad').value = plan.ad;
      p('en').value = Math.round(plan.oda.en);
      p('boy').value = Math.round(plan.oda.boy);
      altligiCiz();
      guncelle();
    }

    // İçe aktarılmış çizim varken oda ölçüsü çizimden gelir; kapı/pencere de çizimin içindedir.
    function altligiCiz() {
      const var_ = !!plan.altlik;
      for (const ad of ['en', 'boy']) p(ad).disabled = var_;
      for (const is of ['kapi', 'pencere']) kap.querySelector(`.plan-sol [data-is="${is}"]`).disabled = var_;
      p('altlik').hidden = !var_;
      if (var_) {
        p('altlik').innerHTML = `<div><b>${kacis(plan.altlik.ad)}</b><span>Çizim altlığı · birim ${kacis(plan.altlik.birim)}</span></div><button class="dugme kucuk tehlike" data-is="altlik-kaldir">Kaldır</button>`;
      }
    }

    async function cadAc() {
      const cad = await cadIceAktar();
      if (!cad) return;
      if (cad.en < 20 || cad.boy < 20 || cad.en > 20000 || cad.boy > 20000) {
        bildir(`Çizim ${sayiYaz(cad.en / 100)} × ${sayiYaz(cad.boy / 100)} m çıktı; 0,2–200 m arası olmalı. Çizim birimini kontrol edin.`, 'hata');
        return;
      }
      plan.altlik = { ad: cad.ad, birim: cad.birim, yollar: cad.yollar };
      plan.oda = { en: Math.round(cad.en * 10) / 10, boy: Math.round(cad.boy * 10) / 10 };
      plan.acikliklar = [];
      plan.mobilyalar.forEach(sinirIcineAl);
      if (plan.ad === 'Adsız plan') plan.ad = cad.ad.replace(/\.[^.]+$/, '');
      planiYukle(plan);
      bildir(`“${cad.ad}” içe aktarıldı: ${sayiYaz(cad.en / 100)} × ${sayiYaz(cad.boy / 100)} m.`);
    }

    // ---------- Mobilya listesi ----------
    function listeyiCiz() {
      const aranan = p('ara').value.trim().toLocaleLowerCase('tr');
      const html = MOBILYA_GRUPLARI.map((g) => {
        const ogeler = g.ogeler.filter((o) => !aranan || o.ad.toLocaleLowerCase('tr').includes(aranan));
        if (!ogeler.length) return '';
        return `<div class="mobilya-grup">${kacis(g.ad)}</div>` + ogeler.map((o) => `
          <div class="mobilya-oge" draggable="true" data-tur="${o.tur}">
            <div><div class="mobilya-ad">${kacis(o.ad)}</div><div class="mobilya-olcu">${o.yuvarlak ? 'Ø ' + o.en : o.en + ' × ' + o.boy} cm</div></div>
            <button class="dugme kucuk" data-ekle="${o.tur}" title="Odanın ortasına ekle" aria-label="${kacis(o.ad)} ekle">+</button>
          </div>`).join('');
      }).join('');
      p('liste').innerHTML = html || '<div class="bos-durum">Eşleşen mobilya yok.</div>';
    }

    function mobilyaEkle(tur, merkezX, merkezY) {
      const t = MOBILYA_SOZLUGU[tur];
      if (!t) return;
      const m = { id: yeniKimlik(), tur, ad: t.ad, en: t.en, boy: t.boy, aci: 0, x: hizala(merkezX - t.en / 2), y: hizala(merkezY - t.boy / 2) };
      sinirIcineAl(m);
      plan.mobilyalar.push(m);
      seciliId = m.id;
      guncelle();
    }

    function dondur(m) {
      const cx = m.x + m.en / 2, cy = m.y + m.boy / 2;
      [m.en, m.boy] = [m.boy, m.en];
      m.aci = (m.aci + 90) % 360;
      m.x = hizala(cx - m.en / 2);
      m.y = hizala(cy - m.boy / 2);
      sinirIcineAl(m);
    }

    function seciliyiSil() {
      plan.mobilyalar = plan.mobilyalar.filter((m) => m.id !== seciliId);
      plan.acikliklar = plan.acikliklar.filter((a) => a.id !== seciliId);
      seciliId = null;
      guncelle();
    }

    // ---------- Fare etkileşimi ----------
    const nokta = (o) => {
      const r = svg.getBoundingClientRect();
      return { x: (o.clientX - r.left - gorunum.ox) / gorunum.s, y: (o.clientY - r.top - gorunum.oy) / gorunum.s };
    };

    svg.addEventListener('pointerdown', (o) => {
      if (o.button !== 0) return;
      const n = nokta(o);
      const mobilyaG = o.target.closest('[data-id]');
      const aciklikG = o.target.closest('[data-acik]');
      if (o.target.closest('[data-tut]') && seciliMobilya()) {
        surukle = { tur: 'boyut', m: seciliMobilya() };
      } else if (mobilyaG) {
        seciliId = mobilyaG.dataset.id;
        const m = seciliMobilya();
        surukle = { tur: 'tasi', m, dx: n.x - m.x, dy: n.y - m.y };
      } else if (aciklikG) {
        seciliId = aciklikG.dataset.acik;
        const a = seciliAciklik();
        const g = duvarGeometrisi(plan.oda, a.duvar);
        surukle = { tur: 'acik', a, fark: (g.dx ? n.x : n.y) - a.konum };
      } else {
        seciliId = null;
        surukle = null;
      }
      try { svg.setPointerCapture(o.pointerId); } catch { /* yakalanamazsa sürükleme yine çalışır */ }
      tuval.focus({ preventScroll: true });
      guncelle();
    });

    svg.addEventListener('pointermove', (o) => {
      if (!surukle) return;
      const n = nokta(o);
      if (surukle.tur === 'tasi') {
        surukle.m.x = hizala(n.x - surukle.dx);
        surukle.m.y = hizala(n.y - surukle.dy);
        sinirIcineAl(surukle.m);
      } else if (surukle.tur === 'boyut') {
        const m = surukle.m;
        m.en = sinirla(hizala(n.x - m.x), 10, Math.max(10, plan.oda.en - m.x));
        m.boy = sinirla(hizala(n.y - m.y), 10, Math.max(10, plan.oda.boy - m.y));
      } else {
        const a = surukle.a;
        const g = duvarGeometrisi(plan.oda, a.duvar);
        a.konum = hizala((g.dx ? n.x : n.y) - surukle.fark);
        aciklikSinirla(a);
      }
      guncelle();
    });

    const birak = () => { surukle = null; };
    svg.addEventListener('pointerup', birak);
    svg.addEventListener('pointercancel', birak);

    tuval.addEventListener('keydown', (o) => {
      const m = seciliMobilya();
      if ((o.key === 'Delete' || o.key === 'Backspace') && seciliId) { seciliyiSil(); o.preventDefault(); return; }
      if (!m) return;
      const adim = o.shiftKey ? 10 : 1;
      const oklar = { ArrowLeft: [-adim, 0], ArrowRight: [adim, 0], ArrowUp: [0, -adim], ArrowDown: [0, adim] };
      if (o.key.toLowerCase() === 'r') dondur(m);
      else if (oklar[o.key]) { m.x += oklar[o.key][0]; m.y += oklar[o.key][1]; sinirIcineAl(m); }
      else return;
      o.preventDefault();
      guncelle();
    });

    // ---------- Listeden sürükle-bırak ----------
    p('liste').addEventListener('dragstart', (o) => {
      const oge = o.target.closest('[data-tur]');
      if (!oge) return;
      o.dataTransfer.setData(SURUKLE_TURU, oge.dataset.tur);
      o.dataTransfer.effectAllowed = 'copy';
    });
    p('liste').addEventListener('click', (o) => {
      const tur = o.target.dataset?.ekle;
      if (tur) mobilyaEkle(tur, plan.oda.en / 2, plan.oda.boy / 2);
    });
    p('liste').addEventListener('dblclick', (o) => {
      const oge = o.target.closest('[data-tur]');
      if (oge && !o.target.dataset.ekle) mobilyaEkle(oge.dataset.tur, plan.oda.en / 2, plan.oda.boy / 2);
    });
    tuval.addEventListener('dragover', (o) => {
      if (!o.dataTransfer.types.includes(SURUKLE_TURU)) return;
      o.preventDefault();
      o.dataTransfer.dropEffect = 'copy';
    });
    tuval.addEventListener('drop', (o) => {
      const tur = o.dataTransfer.getData(SURUKLE_TURU);
      if (!tur) return;
      o.preventDefault();
      const n = nokta(o);
      mobilyaEkle(tur, n.x, n.y);
      tuval.focus({ preventScroll: true });
    });
    p('ara').addEventListener('input', listeyiCiz);

    // ---------- Oda ve seçenekler ----------
    const odaDegisti = () => {
      if (plan.altlik) return;
      plan.oda.en = sinirla(sayiOku(p('en').value, 400), 100, 3000);
      plan.oda.boy = sinirla(sayiOku(p('boy').value, 350), 100, 3000);
      plan.mobilyalar.forEach(sinirIcineAl);
      plan.acikliklar.forEach(aciklikSinirla);
      guncelle();
    };
    p('en').addEventListener('change', () => { odaDegisti(); p('en').value = plan.oda.en; });
    p('boy').addEventListener('change', () => { odaDegisti(); p('boy').value = plan.oda.boy; });
    p('izgara').addEventListener('change', (o) => { izgara = o.target.checked; svgCiz(); });
    p('yakala').addEventListener('change', (o) => { yakala = o.target.checked; });
    p('ad').addEventListener('input', (o) => { plan.ad = o.target.value.trim() || 'Adsız plan'; taslakKaydet(); });

    // ---------- Özellik paneli ----------
    p('ozellik').addEventListener('input', (o) => {
      const alan = o.target.dataset.alan;
      const m = seciliMobilya(), a = seciliAciklik();
      if (!alan) return;
      if (m) {
        if (alan === 'ad') m.ad = o.target.value.trim() || MOBILYA_SOZLUGU[m.tur]?.ad || 'Mobilya';
        else { m[alan] = sayiOku(o.target.value, m[alan]); sinirIcineAl(m); }
      } else if (a) {
        if (alan === 'duvar') a.duvar = o.target.value;
        else a[alan] = sayiOku(o.target.value, a[alan]);
        aciklikSinirla(a);
      }
      guncelle({ ozellik: false });
    });
    p('ozellik').addEventListener('change', ozellikleriCiz);
    p('ozellik').addEventListener('click', (o) => {
      const is = o.target.dataset.is;
      const m = seciliMobilya(), a = seciliAciklik();
      if (is === 'sil') return seciliyiSil();
      if (is === 'dondur' && m) dondur(m);
      else if (is === 'cogalt' && m) {
        const kopya = { ...m, id: yeniKimlik(), x: m.x + 20, y: m.y + 20 };
        sinirIcineAl(kopya);
        plan.mobilyalar.push(kopya);
        seciliId = kopya.id;
      } else if (is === 'cevir' && a) a.ters = !a.ters;
      else return;
      guncelle();
    });

    p('uyarilar').addEventListener('click', (o) => {
      const d = o.target.closest('[data-uyari]');
      if (!d) return;
      seciliId = denetim.uyarilar[+d.dataset.uyari].kimlikler[0];
      guncelle();
    });

    // ---------- Üst düğmeler ----------
    function aciklikEkle(tur) {
      const duvar = tur === 'kapi' ? 'alt' : 'ust';
      const genislik = tur === 'kapi' ? 90 : 120;
      const a = { id: yeniKimlik(), tur, duvar, genislik, konum: hizala((plan.oda.en - genislik) / 2), ters: false };
      aciklikSinirla(a);
      plan.acikliklar.push(a);
      seciliId = a.id;
      guncelle();
    }

    async function kaydet() {
      const planlar = await depo.oku('planlar', []);
      let ad = p('ad').value.trim();
      if (!ad || (!plan.id && ad === 'Adsız plan')) {
        ad = await isimSor('Planı kaydet', '', 'Plan adı');
        if (!ad) return;
      }
      if (!planlar.some((k) => k.id === plan.id)) {
        const ayni = planlar.find((k) => k.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
        if (ayni && !(await onayla(`“${ad}” adında bir plan zaten var. Üzerine yazılsın mı?`, 'Üzerine yaz', 'Aynı adda plan var'))) return;
        plan.id = ayni ? ayni.id : yeniKimlik();
      }
      plan.ad = ad;
      plan.guncelleme = Date.now();
      p('ad').value = ad;
      const kopya = structuredClone(plan);
      const sira = planlar.findIndex((k) => k.id === plan.id);
      if (sira >= 0) planlar[sira] = kopya; else planlar.unshift(kopya);
      if (await depo.yaz('planlar', planlar)) bildir(`“${ad}” kaydedildi.`);
      depo.yaz('plan-taslak', plan);
    }

    async function ac() {
      const planlar = await depo.oku('planlar', []);
      planlar.sort((a, b) => (b.guncelleme || 0) - (a.guncelleme || 0));
      const secilen = await kayitSec({
        baslik: 'Kayıtlı planlar',
        kayitlar: planlar,
        bosMesaj: 'Henüz kaydedilmiş plan yok.',
        ayrinti: (k) => `${sayiYaz(k.oda.en / 100)} × ${sayiYaz(k.oda.boy / 100)} m · ${k.mobilyalar.length} mobilya · ${tarihYaz(k.guncelleme)}`,
        sil: async (k) => {
          await depo.yaz('planlar', (await depo.oku('planlar', [])).filter((x) => x.id !== k.id));
          if (plan.id === k.id) plan.id = null;
        },
      });
      if (secilen) planiYukle(structuredClone(secilen));
    }

    async function pngDisaAktar() {
      const s = olcekHesapla(plan.oda, 1200, 1000);
      const cizim = planSvg(plan, { s, izgara, etkilesimli: false, baslik: plan.ad });
      const metin = `<svg xmlns="http://www.w3.org/2000/svg" width="${cizim.genislik}" height="${cizim.yukseklik}" viewBox="0 0 ${cizim.genislik} ${cizim.yukseklik}">${cizim.zemin}${cizim.icerik}</svg>`;
      const url = URL.createObjectURL(new Blob([metin], { type: 'image/svg+xml' }));
      try {
        const gorsel = await gorselYukle(url);
        const kat = 2.5;
        const t = document.createElement('canvas');
        t.width = Math.round(cizim.genislik * kat);
        t.height = Math.round(cizim.yukseklik * kat);
        const c = t.getContext('2d');
        c.fillStyle = '#fff';
        c.fillRect(0, 0, t.width, t.height);
        c.drawImage(gorsel, 0, 0, t.width, t.height);
        await depo.pngDisaAktar(plan.ad, t);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    kap.querySelector('.arac-baslik').addEventListener('click', async (o) => {
      const is = o.target.dataset.is;
      if (is === 'kaydet') kaydet();
      else if (is === 'ac') ac();
      else if (is === 'png') pngDisaAktar();
      else if (is === 'dosya-kaydet') dosyayaKaydet('plan', plan.ad, plan);
      else if (is === 'dosya-ac') {
        const dosya = await dosyadanAc('plan');
        const v = dosya?.veri;
        if (!v) return;
        if (!v.oda || !Array.isArray(v.mobilyalar) || !Array.isArray(v.acikliklar)) { bildir('Dosyadaki plan okunamadı.', 'hata'); return; }
        // Dosyadan gelen plan, kayıtlı planlardan bağımsız bir kopyadır.
        planiYukle({ ...v, id: null });
        bildir(`“${plan.ad}” dosyadan açıldı.`);
      } else if (is === 'yeni') {
        if ((plan.mobilyalar.length || plan.altlik) && !(await onayla('Açık plan kapatılıp boş bir plan başlatılacak. Kaydetmediğiniz değişiklikler kaybolur.', 'Yeni plan', 'Yeni plan'))) return;
        planiYukle(bosPlan());
      }
    });
    kap.querySelector('.plan-sol').addEventListener('click', (o) => {
      const is = o.target.dataset.is;
      if (is === 'kapi' || is === 'pencere') aciklikEkle(is);
      else if (is === 'cad') cadAc();
      else if (is === 'altlik-kaldir') {
        delete plan.altlik;
        plan.oda = { en: sinirla(Math.round(plan.oda.en / 5) * 5, 100, 3000), boy: sinirla(Math.round(plan.oda.boy / 5) * 5, 100, 3000) };
        plan.mobilyalar.forEach(sinirIcineAl);
        planiYukle(plan);
      }
    });

    new ResizeObserver(() => svgCiz()).observe(tuval);
    this.gosterildi = svgCiz;

    listeyiCiz();
    planiYukle(plan);
  },
};
