// Araç 3 — Renk paleti çıkarıcı: fotoğraftan baskın renkler, renk değerleri ve uyum önerileri.
import { depo, gorselYukle } from '../cekirdek/depo.js';
import { kacis, yeniKimlik, bildir, isimSor, onayla, dosyaSec, gorselDosyalari, tarihYaz } from '../cekirdek/arayuz.js';
import { dosyayaKaydet, dosyadanAc } from '../cekirdek/dosya.js';
import { hex, hexCoz, rgbMetni, hslMetni, yaziRengi, uyumlar, baskinRenkler } from '../cekirdek/renk.js';

export default {
  kimlik: 'palet',
  baslik: 'Renk Paleti',
  simge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1.2-1.8-1.2-3 0-1 .8-1.8 2-1.8H17a4 4 0 0 0 4-4c0-4-4-7.200-9-7.200Z"/><circle cx="7.500" cy="11.500" r="1"/><circle cx="10" cy="7.500" r="1"/><circle cx="15" cy="7.500" r="1"/></svg>',

  async kur(kap) {
    let paletler = await depo.oku('paletler', []);
    // Açık çalışma: görsel (yeni dosya veya kayıtlı kimlik) ve çıkarılan renkler.
    let calisma = { dosya: null, gorselKimlik: null, gorsel: null, renkler: [], ad: '' };
    let adet = 6;
    let secili = 0;

    kap.innerHTML = `
      <header class="arac-baslik">
        <h1>Renk Paleti Çıkarıcı</h1>
        <span class="aciklama">Fotoğraftaki baskın renkler ve uyum önerileri</span>
        <span class="bosluk"></span>
        <button class="dugme" data-is="sec">Fotoğraf seç…</button>
        <button class="dugme birincil" data-is="kaydet" disabled>Paleti kaydet</button>
        <span class="ayrac"></span>
        <button class="dugme" data-is="dosya-ac" title="Bilgisayardaki bir .atolye dosyasını aç">Dosya aç…</button>
        <button class="dugme" data-is="dosya-kaydet" title="Bu paleti fotoğrafıyla birlikte ayrı bir dosyaya kaydet" disabled>Dosya kaydet…</button>
      </header>
      <div class="arac-govde">
        <div class="palet-duzen">
          <div class="yigin">
            <section class="kart">
              <div class="birakma" data-p="birakma" tabindex="0" role="button" aria-label="Fotoğraf seç veya buraya sürükle">
                <div class="birakma-ipucu" data-p="ipucu">
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.500" cy="9.500" r="1.500"/><path d="m4 17 5-5 4 4 3-3 4 4"/></svg>
                  <b>Fotoğrafı buraya sürükleyin</b>
                  <span>veya tıklayıp bilgisayarınızdan seçin (PNG, JPG, WebP)</span>
                </div>
                <img data-p="onizleme" alt="Seçilen fotoğraf" hidden>
              </div>
              <div class="palet-adet">
                <label for="palet-adet">Renk sayısı</label>
                <input type="range" id="palet-adet" data-p="adet" min="5" max="8" step="1" value="6">
                <b data-p="adet-yazi">6</b>
              </div>
            </section>
            <section class="kart">
              <h2>Kayıtlı paletler</h2>
              <div class="kayitli-paletler" data-p="kayitli"></div>
            </section>
          </div>
          <div class="yigin">
            <section class="kart">
              <h2>Baskın renkler</h2>
              <div data-p="renkler"></div>
            </section>
            <section class="kart" data-p="uyum-kart" hidden>
              <h2>Renk uyumları <span class="kart-alt" data-p="uyum-renk"></span></h2>
              <div class="yigin" data-p="uyumlar"></div>
            </section>
          </div>
        </div>
      </div>`;

    const p = (ad) => kap.querySelector(`[data-p="${ad}"]`);
    const kaydetDugmesi = kap.querySelector('[data-is="kaydet"]');

    function renkleriCiz() {
      const { renkler } = calisma;
      kaydetDugmesi.disabled = !renkler.length;
      kap.querySelector('[data-is="dosya-kaydet"]').disabled = !renkler.length;
      p('adet').disabled = !calisma.gorsel;
      if (!renkler.length) {
        p('renkler').innerHTML = '<div class="bos-durum">Bir fotoğraf seçtiğinizde baskın renkleri burada görünür.</div>';
        p('uyum-kart').hidden = true;
        return;
      }
      secili = Math.min(secili, renkler.length - 1);
      p('renkler').innerHTML = `
        <div class="palet-serit">${renkler.map((r, i) => `<button class="${i === secili ? 'secili' : ''}" data-sec="${i}" style="background:${hex(r)}; flex:${Math.max(0.08, r.oran ?? 1)}" title="${hex(r)}" aria-label="${hex(r)} rengini seç"></button>`).join('')}</div>
        <div class="renk-liste">
          ${renkler.map((r, i) => `
            <div class="renk-satir ${i === secili ? 'secili' : ''}" data-sec="${i}">
              <span class="renk-kutu" style="background:${hex(r)}"></span>
              <button class="renk-deger" data-kopya="${hex(r)}" title="Kopyalamak için tıklayın">${hex(r)}</button>
              <button class="renk-deger" data-kopya="${rgbMetni(r)}" title="Kopyalamak için tıklayın">${rgbMetni(r)}</button>
              <button class="renk-deger" data-kopya="${hslMetni(r)}" title="Kopyalamak için tıklayın">${hslMetni(r)}</button>
              <span class="oran">${r.oran != null ? '%' + Math.round(r.oran * 100) : ''}</span>
            </div>`).join('')}
        </div>
        <p class="kart-alt" style="margin-top:10px">Değere tıklayınca panoya kopyalanır. Uyum önerileri için bir renk seçin.</p>`;
      uyumlariCiz();
    }

    function uyumlariCiz() {
      const renk = calisma.renkler[secili];
      p('uyum-kart').hidden = !renk;
      if (!renk) return;
      p('uyum-renk').textContent = `— ${hex(renk)} için`;
      p('uyumlar').innerHTML = uyumlar(renk).map((u) => `
        <div class="uyum">
          <div class="uyum-baslik"><b>${u.ad}</b><span>${u.aciklama}</span></div>
          <div class="uyum-renkler">${u.renkler.map((r) => `<button data-kopya="${hex(r)}" style="background:${hex(r)}; color:${yaziRengi(r)}" title="Kopyalamak için tıklayın">${hex(r)}</button>`).join('')}</div>
        </div>`).join('');
    }

    function kayitlilariCiz() {
      p('kayitli').innerHTML = paletler.length
        ? paletler.map((k) => `
          <div class="kayitli-palet" data-palet="${k.id}">
            <button class="kayitli-serit" data-is="yukle" aria-label="${kacis(k.ad)} paletini aç">${k.renkler.map((h) => `<span style="background:${h}"></span>`).join('')}</button>
            <div class="kayitli-alt"><div><b>${kacis(k.ad)}</b><span>${tarihYaz(k.tarih)}</span></div><button class="dugme kucuk tehlike" data-is="sil">Sil</button></div>
          </div>`).join('')
        : '<div class="bos-durum">Kaydettiğiniz paletler burada listelenir.</div>';
    }

    function cikar() {
      if (!calisma.gorsel) return;
      calisma.renkler = baskinRenkler(calisma.gorsel, adet);
      secili = 0;
      renkleriCiz();
    }

    async function gorseliGoster(url) {
      calisma.gorsel = await gorselYukle(url);
      p('onizleme').src = url;
      p('onizleme').hidden = false;
      p('ipucu').hidden = true;
    }

    async function dosyaYukle(dosya) {
      if (!dosya) return;
      const url = URL.createObjectURL(dosya);
      try {
        calisma = { dosya, gorselKimlik: null, gorsel: null, renkler: [], ad: dosya.name.replace(/\.[^.]+$/, '') };
        await gorseliGoster(url);
        cikar();
      } catch {
        bildir('Bu dosya görsel olarak açılamadı.', 'hata');
      }
    }

    async function kaydet() {
      const ad = await isimSor('Paleti kaydet', calisma.ad, 'Palet adı');
      if (!ad) return;
      if (calisma.dosya && !calisma.gorselKimlik) calisma.gorselKimlik = await depo.gorselKaydet(calisma.dosya);
      calisma.ad = ad;
      const kayit = {
        id: yeniKimlik(), ad, tarih: Date.now(), gorsel: calisma.gorselKimlik, adet,
        renkler: calisma.renkler.map(hex), oranlar: calisma.renkler.map((r) => r.oran ?? null),
      };
      const ayni = paletler.find((k) => k.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
      if (ayni) {
        if (!(await onayla(`“${ad}” adında bir palet zaten var. Üzerine yazılsın mı?`, 'Üzerine yaz', 'Aynı adda palet var'))) return;
        kayit.id = ayni.id;
        paletler[paletler.indexOf(ayni)] = kayit;
      } else {
        paletler.unshift(kayit);
      }
      if (await depo.yaz('paletler', paletler)) bildir(`“${ad}” paleti kaydedildi.`);
      kayitlilariCiz();
    }

    async function kayitliyiYukle(k) {
      calisma = {
        dosya: null, gorselKimlik: k.gorsel, gorsel: null, ad: k.ad,
        renkler: k.renkler.map((h, i) => ({ ...hexCoz(h), oran: k.oranlar?.[i] ?? null })),
      };
      const url = await depo.gorselURL(k.gorsel);
      if (url) await gorseliGoster(url);
      else { p('onizleme').hidden = true; p('ipucu').hidden = false; }
      if (k.adet) { adet = k.adet; p('adet').value = adet; p('adet-yazi').textContent = adet; }
      secili = 0;
      renkleriCiz();
    }

    // ---------- Olaylar ----------
    const sec = async () => dosyaYukle((await dosyaSec())[0]);
    kap.querySelector('[data-is="sec"]').addEventListener('click', sec);
    p('birakma').addEventListener('click', sec);
    p('birakma').addEventListener('keydown', (o) => { if (o.key === 'Enter' || o.key === ' ') { o.preventDefault(); sec(); } });
    kaydetDugmesi.addEventListener('click', kaydet);

    kap.querySelector('[data-is="dosya-kaydet"]').addEventListener('click', async () => {
      if (calisma.dosya && !calisma.gorselKimlik) calisma.gorselKimlik = await depo.gorselKaydet(calisma.dosya);
      const veri = {
        ad: calisma.ad || 'Palet', adet, gorsel: calisma.gorselKimlik,
        renkler: calisma.renkler.map(hex), oranlar: calisma.renkler.map((r) => r.oran ?? null),
      };
      dosyayaKaydet('palet', veri.ad, veri, [veri.gorsel]);
    });
    kap.querySelector('[data-is="dosya-ac"]').addEventListener('click', async () => {
      const dosya = await dosyadanAc('palet');
      const v = dosya?.veri;
      if (!v) return;
      if (!Array.isArray(v.renkler) || !v.renkler.every(hexCoz)) { bildir('Dosyadaki palet okunamadı.', 'hata'); return; }
      await kayitliyiYukle({ ...v, gorsel: dosya.gorselCevir(v.gorsel) });
      bildir(`“${v.ad}” dosyadan açıldı.`);
    });

    // Fotoğraf aracın herhangi bir yerine bırakılabilir.
    kap.addEventListener('dragover', (o) => {
      if (!o.dataTransfer.types.includes('Files')) return;
      o.preventDefault();
      o.dataTransfer.dropEffect = 'copy';
      p('birakma').classList.add('uzerinde');
    });
    kap.addEventListener('dragleave', (o) => { if (!kap.contains(o.relatedTarget)) p('birakma').classList.remove('uzerinde'); });
    kap.addEventListener('drop', (o) => {
      o.preventDefault();
      p('birakma').classList.remove('uzerinde');
      const dosya = gorselDosyalari(o.dataTransfer.files)[0];
      if (dosya) dosyaYukle(dosya);
      else bildir('Lütfen bir görsel dosyası bırakın (PNG, JPG, WebP).', 'hata');
    });

    p('adet').addEventListener('input', (o) => {
      adet = +o.target.value;
      p('adet-yazi').textContent = adet;
      cikar();
    });

    const kopyaVeyaSec = (o) => {
      const kopya = o.target.closest('[data-kopya]');
      if (kopya) { depo.kopyala(kopya.dataset.kopya); }
      const sat = o.target.closest('[data-sec]');
      if (sat && +sat.dataset.sec !== secili) { secili = +sat.dataset.sec; renkleriCiz(); }
    };
    p('renkler').addEventListener('click', kopyaVeyaSec);
    p('uyumlar').addEventListener('click', kopyaVeyaSec);

    p('kayitli').addEventListener('click', async (o) => {
      const kart = o.target.closest('[data-palet]');
      const is = o.target.closest('[data-is]')?.dataset.is;
      if (!kart || !is) return;
      const k = paletler.find((x) => x.id === kart.dataset.palet);
      if (is === 'yukle') kayitliyiYukle(k);
      else if (is === 'sil' && await onayla(`“${k.ad}” paleti silinsin mi?`)) {
        paletler = paletler.filter((x) => x !== k);
        await depo.yaz('paletler', paletler);
        if (k.gorsel && calisma.gorselKimlik !== k.gorsel) depo.gorselSil(k.gorsel);
        kayitlilariCiz();
      }
    });

    renkleriCiz();
    kayitlilariCiz();
  },
};
