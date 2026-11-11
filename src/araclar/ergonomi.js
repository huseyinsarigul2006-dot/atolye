// Araç 5 — Ergonomi ölçü rehberi: standart ölçüler, şemalar, arama ve boya göre öneriler.
import { depo } from '../cekirdek/depo.js';
import { kacis, sayiOku, gecikmeli } from '../cekirdek/arayuz.js';
import { ERGONOMI, ERGONOMI_KATEGORILERI } from '../veri/ergonomi.js';
import { semaCiz } from './ergonomi/sema.js';

const BOY_ALT = 120, BOY_UST = 220;
const kucuk = (s) => String(s || '').toLocaleLowerCase('tr');

/** Boya göre önerilen aralığı "88–93 cm" biçiminde yazar. */
function kisiselYaz(oge, boy) {
  const [a, b] = oge.kisisel(boy).map(Math.round);
  return a === b ? `${a} cm` : `${a}–${b} cm`;
}

export default {
  kimlik: 'ergonomi',
  baslik: 'Ergonomi Rehberi',
  simge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.500" r="2"/><path d="M5 9h14M12 9v6M12 15l-3.500 6M12 15l3.500 6"/></svg>',

  async kur(kap) {
    const kayit = await depo.oku('ergonomi', {});
    let boy = kayit.boy || null;
    let kategori = 'Tümü';
    let aranan = '';
    const kaydet = gecikmeli(() => depo.yaz('ergonomi', { boy }), 500);

    kap.innerHTML = `
      <header class="arac-baslik">
        <h1>Ergonomi Ölçü Rehberi</h1>
        <input type="search" class="ergo-ara" data-p="ara" placeholder="Ölçü ara: tezgâh, koridor, masa…" aria-label="Ölçü ara">
        <span class="bosluk"></span>
        <label class="ergo-boy"><span>Boyunuz</span><input type="number" data-p="boy" min="${BOY_ALT}" max="${BOY_UST}" step="1" placeholder="örn. 170" value="${boy || ''}"><span>cm</span></label>
      </header>
      <div class="ergo-filtre"><div class="cipler" data-p="kategoriler"></div></div>
      <div class="arac-govde">
        <section class="kart ergo-kisisel" data-p="kisisel" hidden></section>
        <div class="ergo-izgara" data-p="izgara"></div>
        <p class="ergo-dipnot">Ölçüler genel tasarım kabulleridir; uygulamadan önce proje koşullarına ve yürürlükteki yönetmeliklere göre doğrulayın.</p>
      </div>`;

    const p = (ad) => kap.querySelector(`[data-p="${ad}"]`);
    const boyGecerli = () => boy >= BOY_ALT && boy <= BOY_UST;

    function kategorileriCiz() {
      p('kategoriler').innerHTML = ['Tümü', ...ERGONOMI_KATEGORILERI]
        .map((k) => `<button class="cip ${k === kategori ? 'etkin' : ''}" data-kategori="${k}">${k}</button>`).join('');
    }

    function kisiseliCiz() {
      const kutu = p('kisisel');
      kutu.hidden = !boyGecerli();
      if (!boyGecerli()) return;
      const ogeler = ERGONOMI.filter((o) => o.kisisel);
      kutu.innerHTML = `
        <h2>Size göre öneriler <span class="kart-alt">— boy ${boy} cm</span></h2>
        <div class="ergo-kisisel-liste">
          ${ogeler.map((o) => `<div class="sonuc"><span class="ad">${kacis(o.ad)}</span><span class="deger">${kisiselYaz(o, boy)}</span><span class="not">Standart: ${kacis(o.deger)}</span></div>`).join('')}
        </div>
        <p class="kart-alt" style="margin-top:10px">Öneriler vücut oranlarına dayalı yaklaşık değerlerdir (ör. tezgâh = dirsek hizasının 12–18 cm altı).</p>`;
    }

    function izgarayiCiz() {
      const a = kucuk(aranan.trim());
      const liste = ERGONOMI.filter((o) =>
        (kategori === 'Tümü' || o.kategori === kategori) &&
        (!a || [o.ad, o.kategori, o.deger, o.aciklama].some((alan) => kucuk(alan).includes(a))));
      p('izgara').innerHTML = liste.length
        ? liste.map((o) => `
          <article class="ergo-kart">
            <div class="ergo-sema">${semaCiz(o)}</div>
            <div class="ergo-icerik">
              <div class="mlz-kategori">${kacis(o.kategori)}</div>
              <h3>${kacis(o.ad)}</h3>
              <div class="ergo-deger">${kacis(o.deger)}</div>
              ${o.kisisel && boyGecerli() ? `<div class="ergo-size">Size göre: <b>${kisiselYaz(o, boy)}</b></div>` : ''}
              <p>${kacis(o.aciklama)}</p>
            </div>
          </article>`).join('')
        : '<div class="bos-durum">Aramanıza uyan ölçü bulunamadı.</div>';
    }

    p('ara').addEventListener('input', (o) => { aranan = o.target.value; izgarayiCiz(); });
    p('kategoriler').addEventListener('click', (o) => {
      const k = o.target.dataset.kategori;
      if (!k) return;
      kategori = k;
      kategorileriCiz(); izgarayiCiz();
    });
    p('boy').addEventListener('input', (o) => {
      boy = o.target.value === '' ? null : Math.round(sayiOku(o.target.value));
      kisiseliCiz(); izgarayiCiz(); kaydet();
    });

    kategorileriCiz();
    kisiseliCiz();
    izgarayiCiz();
  },
};
