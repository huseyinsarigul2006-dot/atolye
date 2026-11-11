// Araç 1 — Ölçek ve alan hesaplayıcı: ölçek dönüşümü, alan/çevre ve metraj.
import { depo } from '../cekirdek/depo.js';
import { sayiYaz, sayiOku, gecikmeli, bildir, pencereAc, ogeOlustur } from '../cekirdek/arayuz.js';
import { cadIceAktar } from '../cekirdek/cad.js';

const OLCEKLER = [1, 5, 10, 20, 50, 100, 200, 500];
const MM = { mm: 1, cm: 10, m: 1000 };

const VARSAYILAN = {
  olcekSecim: '50',
  ozelOlcek: 25,
  gercek: 3.5,
  gercekBirim: 'm',
  cizimBirim: 'cm',
  sekil: 'dikdortgen',
  birim: 'm',
  dik: { en: 4, boy: 3.5 },
  l: { A: 6, B: 5, a: 2.5, b: 2 },
  cok: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 5.5, y: 2 }, { x: 4, y: 4 }, { x: 0, y: 4 }],
  metraj: {
    yukseklik: 2.7, bosluk: 3.5, kapiGenislik: 0.9,
    zeminFire: 10, kutu: 1.5,
    boyaFire: 10, kat: 2, sarfiyat: 10, tavan: false,
    supFire: 5, supBoy: 2.4,
  },
};

const birimSecenekleri = (secili) =>
  Object.keys(MM).map((b) => `<option ${b === secili ? 'selected' : ''}>${b}</option>`).join('');

/** Köşe listesinden alan (shoelace) ve çevre. */
export function cokgenOlc(noktalar) {
  let alan = 0;
  let cevre = 0;
  for (let i = 0; i < noktalar.length; i++) {
    const a = noktalar[i];
    const b = noktalar[(i + 1) % noktalar.length];
    alan += a.x * b.y - b.x * a.y;
    cevre += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return { alan: Math.abs(alan) / 2, cevre };
}

function sekilNoktalari(d) {
  if (d.sekil === 'dikdortgen') {
    const { en, boy } = d.dik;
    return [{ x: 0, y: 0 }, { x: en, y: 0 }, { x: en, y: boy }, { x: 0, y: boy }];
  }
  if (d.sekil === 'l') {
    const { A, B, a, b } = d.l;
    return [{ x: 0, y: 0 }, { x: A, y: 0 }, { x: A, y: B - b }, { x: A - a, y: B - b }, { x: A - a, y: B }, { x: 0, y: B }];
  }
  return d.cok;
}

function sekilSorunu(d) {
  const n = sekilNoktalari(d);
  if (d.sekil === 'dikdortgen' && !(d.dik.en > 0 && d.dik.boy > 0)) return 'En ve boy sıfırdan büyük olmalı.';
  if (d.sekil === 'l') {
    const { A, B, a, b } = d.l;
    if (!(A > 0 && B > 0 && a > 0 && b > 0)) return 'Tüm ölçüler sıfırdan büyük olmalı.';
    if (a >= A || b >= B) return 'Kesilen köşe, toplam ölçülerden küçük olmalı.';
  }
  if (d.sekil === 'cok' && n.length < 3) return 'En az üç köşe gerekli.';
  return null;
}

function onizlemeCiz(svg, noktalar, birim) {
  const G = 420, Y = 220, P = 34;
  const xs = noktalar.map((n) => n.x), ys = noktalar.map((n) => n.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const gen = Math.max(...xs) - minX || 1, yuk = Math.max(...ys) - minY || 1;
  const k = Math.min((G - 2 * P) / gen, (Y - 2 * P) / yuk);
  const ox = (G - gen * k) / 2, oy = (Y - yuk * k) / 2;
  const p = noktalar.map((n) => ({ x: ox + (n.x - minX) * k, y: oy + (n.y - minY) * k }));
  const mx = p.reduce((t, n) => t + n.x, 0) / p.length, my = p.reduce((t, n) => t + n.y, 0) / p.length;
  let etiketler = '';
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const uzunluk = Math.hypot(noktalar[(i + 1) % p.length].x - noktalar[i].x, noktalar[(i + 1) % p.length].y - noktalar[i].y);
    if (uzunluk * k < 26) continue;
    const ox2 = (a.x + b.x) / 2, oy2 = (a.y + b.y) / 2;
    // Etiketi kenarın dışına (ağırlık merkezinden uzağa) it.
    let nx = -(b.y - a.y), ny = b.x - a.x;
    const boy = Math.hypot(nx, ny) || 1;
    nx /= boy; ny /= boy;
    if ((ox2 - mx) * nx + (oy2 - my) * ny < 0) { nx = -nx; ny = -ny; }
    const hizala = nx > 0.5 ? 'start' : nx < -0.5 ? 'end' : 'middle';
    etiketler += `<text x="${ox2 + nx * (hizala === 'middle' ? 13 : 8)}" y="${oy2 + ny * 13 + 4}" text-anchor="${hizala}">${sayiYaz(uzunluk)} ${birim}</text>`;
  }
  svg.setAttribute('viewBox', `0 0 ${G} ${Y}`);
  svg.innerHTML = `
    <polygon points="${p.map((n) => `${n.x},${n.y}`).join(' ')}" fill="var(--vurgu-soluk)" stroke="var(--vurgu)" stroke-width="2" stroke-linejoin="round"/>
    ${p.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="2.6" fill="var(--vurgu)"/>`).join('')}
    ${etiketler}`;
}

export default {
  kimlik: 'olcek',
  baslik: 'Ölçek ve Alan',
  simge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7.5 12.5 2 2M10.5 9.5l2 2M13.5 6.5l2 2"/></svg>',

  async kur(kap) {
    const kayitli = await depo.oku('olcek', {});
    const d = {
      ...structuredClone(VARSAYILAN), ...kayitli,
      dik: { ...VARSAYILAN.dik, ...kayitli.dik },
      l: { ...VARSAYILAN.l, ...kayitli.l },
      metraj: { ...VARSAYILAN.metraj, ...kayitli.metraj },
    };
    const kaydet = gecikmeli(() => depo.yaz('olcek', d), 600);

    kap.innerHTML = `
      <header class="arac-baslik">
        <h1>Ölçek ve Alan Hesaplayıcı</h1>
        <span class="aciklama">Ölçek dönüşümü, alan–çevre ve metraj</span>
      </header>
      <div class="arac-govde">
        <div class="olcek-duzen">
          <section class="kart tam">
            <h2>Ölçek dönüşümü</h2>
            <div class="olcek-donusum">
              <div class="alan"><span>Ölçek</span>
                <div class="girdi-birim">
                  <select data-a="olcekSecim">
                    ${OLCEKLER.map((o) => `<option value="${o}">1:${o}</option>`).join('')}
                    <option value="ozel">Özel…</option>
                  </select>
                  <input type="number" data-a="ozelOlcek" min="0.01" step="any" aria-label="Özel ölçek paydası" title="Özel ölçek: 1 : n">
                </div>
              </div>
              <div class="alan"><span>Gerçek ölçü</span>
                <div class="girdi-birim"><input type="number" data-a="gercek" step="any" min="0"><select data-a="gercekBirim">${birimSecenekleri(d.gercekBirim)}</select></div>
              </div>
              <div class="esittir">⇄</div>
              <div class="alan"><span>Çizim ölçüsü</span>
                <div class="girdi-birim"><input type="number" data-a="cizim" step="any" min="0"><select data-a="cizimBirim">${birimSecenekleri(d.cizimBirim)}</select></div>
              </div>
            </div>
            <p class="olcek-ipucu" data-c="ipucu"></p>
          </section>

          <section class="kart">
            <h2>Alan ve çevre</h2>
            <div class="yigin">
              <div class="satir">
                <div class="bolmeli" data-a="sekil">
                  <button data-sekil="dikdortgen">Dikdörtgen</button>
                  <button data-sekil="l">L biçimli</button>
                  <button data-sekil="cok">Çok köşeli</button>
                </div>
                <div class="alan" style="flex:0 0 90px"><span>Birim</span><select data-a="birim">${birimSecenekleri(d.birim)}</select></div>
                <button class="dugme" data-a="cad" title="AutoCAD çizimindeki kapalı bir çoklu çizgiden (polyline) alan ve çevre al">DWG / DXF'ten al…</button>
              </div>
              <div data-c="sekil-girdi"></div>
              <svg class="sekil-onizleme" data-c="onizleme" role="img" aria-label="Oda biçimi önizlemesi"></svg>
              <div data-c="sekil-uyari"></div>
              <div class="izgara-2">
                <div class="sonuc"><span class="ad">Alan</span><span class="deger" data-c="alan"></span></div>
                <div class="sonuc"><span class="ad">Çevre</span><span class="deger" data-c="cevre"></span></div>
              </div>
            </div>
          </section>

          <section class="kart">
            <h2>Metraj</h2>
            <p class="kart-alt" style="margin:-8px 0 12px">Soldaki odanın alanı ve çevresi kullanılır.</p>
            <div class="yigin">
              <div class="metraj-bolum">
                <div class="izgara-3">
                  <label class="alan"><span>Tavan yüksekliği (m)</span><input type="number" data-m="yukseklik" step="any" min="0"></label>
                  <label class="alan"><span>Kapı + pencere alanı (m²)</span><input type="number" data-m="bosluk" step="any" min="0"></label>
                  <label class="alan"><span>Kapı genişlikleri (m)</span><input type="number" data-m="kapiGenislik" step="any" min="0"></label>
                </div>
              </div>
              <div class="metraj-bolum">
                <h3>Zemin kaplaması</h3>
                <div class="izgara-3">
                  <label class="alan"><span>Fire (%)</span><input type="number" data-m="zeminFire" step="any" min="0"></label>
                  <label class="alan"><span>Kutu içeriği (m²)</span><input type="number" data-m="kutu" step="any" min="0"></label>
                  <div class="sonuc"><span class="ad">Gereken</span><span class="deger" data-c="zemin"></span><span class="not" data-c="zemin-not"></span></div>
                </div>
              </div>
              <div class="metraj-bolum">
                <h3>Duvar boyası</h3>
                <div class="izgara-3">
                  <label class="alan"><span>Fire (%)</span><input type="number" data-m="boyaFire" step="any" min="0"></label>
                  <label class="alan"><span>Kat sayısı</span><input type="number" data-m="kat" step="1" min="1"></label>
                  <label class="alan"><span>Sarfiyat (m²/L)</span><input type="number" data-m="sarfiyat" step="any" min="0.1"></label>
                </div>
                <div class="izgara-2" style="margin-top:10px; align-items:center">
                  <label class="onay"><input type="checkbox" data-m="tavan"> Tavan da boyanacak</label>
                  <div class="sonuc"><span class="ad">Gereken</span><span class="deger" data-c="boya"></span><span class="not" data-c="boya-not"></span></div>
                </div>
              </div>
              <div class="metraj-bolum">
                <h3>Süpürgelik</h3>
                <div class="izgara-3">
                  <label class="alan"><span>Fire (%)</span><input type="number" data-m="supFire" step="any" min="0"></label>
                  <label class="alan"><span>Parça boyu (m)</span><input type="number" data-m="supBoy" step="any" min="0"></label>
                  <div class="sonuc"><span class="ad">Gereken</span><span class="deger" data-c="sup"></span><span class="not" data-c="sup-not"></span></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>`;

    const a = (ad) => kap.querySelector(`[data-a="${ad}"]`);
    const c = (ad) => kap.querySelector(`[data-c="${ad}"]`);
    const olcekDegeri = () => (d.olcekSecim === 'ozel' ? Math.max(0.0001, d.ozelOlcek) : Number(d.olcekSecim));

    // ---- Ölçek dönüşümü ----
    function cizimiHesapla() {
      const cizim = (d.gercek * MM[d.gercekBirim]) / olcekDegeri() / MM[d.cizimBirim];
      a('cizim').value = Number.isFinite(cizim) ? +cizim.toFixed(4) : '';
    }
    function olcekCiz() {
      a('ozelOlcek').style.display = d.olcekSecim === 'ozel' ? '' : 'none';
      const n = olcekDegeri();
      c('ipucu').textContent = `1:${sayiYaz(n)} ölçekte çizimdeki 1 cm, gerçekte ${sayiYaz(n)} cm (${sayiYaz(n / 100, 3)} m) eder.`;
    }
    a('olcekSecim').value = d.olcekSecim;
    a('ozelOlcek').value = d.ozelOlcek;
    a('gercek').value = d.gercek;

    a('olcekSecim').addEventListener('change', (o) => { d.olcekSecim = o.target.value; olcekCiz(); cizimiHesapla(); kaydet(); });
    a('ozelOlcek').addEventListener('input', (o) => { d.ozelOlcek = sayiOku(o.target.value, 1); olcekCiz(); cizimiHesapla(); kaydet(); });
    a('gercek').addEventListener('input', (o) => { d.gercek = sayiOku(o.target.value); cizimiHesapla(); kaydet(); });
    a('gercekBirim').addEventListener('change', (o) => { d.gercekBirim = o.target.value; cizimiHesapla(); kaydet(); });
    a('cizimBirim').addEventListener('change', (o) => { d.cizimBirim = o.target.value; cizimiHesapla(); kaydet(); });
    a('cizim').addEventListener('input', (o) => {
      // Ters yön: çizim ölçüsünden gerçek ölçü.
      d.gercek = +((sayiOku(o.target.value) * MM[d.cizimBirim] * olcekDegeri()) / MM[d.gercekBirim]).toFixed(4);
      a('gercek').value = d.gercek;
      kaydet();
    });

    // ---- Alan ve çevre ----
    function sekilGirdileriniCiz() {
      for (const b of a('sekil').children) b.classList.toggle('etkin', b.dataset.sekil === d.sekil);
      const kutu = c('sekil-girdi');
      const alan = (etiket, grup, anahtar) =>
        `<label class="alan"><span>${etiket}</span><input type="number" step="any" min="0" data-g="${grup}" data-k="${anahtar}" value="${d[grup][anahtar]}"></label>`;
      if (d.sekil === 'dikdortgen') {
        kutu.innerHTML = `<div class="izgara-2">${alan('En', 'dik', 'en')}${alan('Boy', 'dik', 'boy')}</div>`;
      } else if (d.sekil === 'l') {
        kutu.innerHTML = `<div class="izgara-2">${alan('Toplam en', 'l', 'A')}${alan('Toplam boy', 'l', 'B')}${alan('Kesilen köşe eni', 'l', 'a')}${alan('Kesilen köşe boyu', 'l', 'b')}</div>`;
      } else {
        kutu.innerHTML = `
          <div class="kose-tablo">
            <span></span><span class="baslik">X</span><span class="baslik">Y</span><span></span>
            ${d.cok.map((n, i) => `
              <span class="no">${i + 1}</span>
              <input type="number" step="any" data-kose="${i}" data-k="x" value="${n.x}" aria-label="${i + 1}. köşe X">
              <input type="number" step="any" data-kose="${i}" data-k="y" value="${n.y}" aria-label="${i + 1}. köşe Y">
              <button class="dugme kucuk" data-kose-sil="${i}" title="Köşeyi sil" ${d.cok.length <= 3 ? 'disabled' : ''}>×</button>`).join('')}
          </div>
          <div style="margin-top:8px"><button class="dugme kucuk" data-is="kose-ekle">+ Köşe ekle</button>
          <span class="kart-alt" style="margin-left:8px">Köşeleri sırayla, oda çevresini dolaşarak girin.</span></div>`;
      }
    }

    function hesapla() {
      const sorun = sekilSorunu(d);
      const noktalar = sekilNoktalari(d);
      c('sekil-uyari').innerHTML = sorun ? `<div class="uyari-satir">${sorun}</div>` : '';
      const kat = MM[d.birim] / 1000; // seçili birim → metre
      let alanM2 = 0, cevreM = 0;
      if (!sorun) {
        const olcu = cokgenOlc(noktalar);
        alanM2 = olcu.alan * kat * kat;
        cevreM = olcu.cevre * kat;
        onizlemeCiz(c('onizleme'), noktalar, d.birim);
      } else {
        c('onizleme').innerHTML = '';
      }
      c('alan').innerHTML = `${sayiYaz(alanM2)} <small>m²</small>`;
      c('cevre').innerHTML = `${sayiYaz(cevreM)} <small>m</small>`;

      // ---- Metraj ----
      const m = d.metraj;
      const zemin = alanM2 * (1 + m.zeminFire / 100);
      c('zemin').innerHTML = `${sayiYaz(zemin)} <small>m²</small>`;
      c('zemin-not').textContent = m.kutu > 0 ? `${Math.ceil(zemin / m.kutu - 1e-9)} kutu · net ${sayiYaz(alanM2)} m²` : `net ${sayiYaz(alanM2)} m²`;

      const duvar = Math.max(0, cevreM * m.yukseklik - m.bosluk) + (m.tavan ? alanM2 : 0);
      const boyanacak = duvar * Math.max(1, m.kat) * (1 + m.boyaFire / 100);
      const litre = m.sarfiyat > 0 ? boyanacak / m.sarfiyat : 0;
      c('boya').innerHTML = `${sayiYaz(litre, 1)} <small>L</small>`;
      c('boya-not').textContent = `Yüzey ${sayiYaz(duvar)} m² × ${Math.max(1, m.kat)} kat`;

      const supNet = Math.max(0, cevreM - m.kapiGenislik);
      const sup = supNet * (1 + m.supFire / 100);
      c('sup').innerHTML = `${sayiYaz(sup)} <small>m</small>`;
      c('sup-not').textContent = m.supBoy > 0 ? `${Math.ceil(sup / m.supBoy - 1e-9)} parça · net ${sayiYaz(supNet)} m` : `net ${sayiYaz(supNet)} m`;
    }

    a('sekil').addEventListener('click', (o) => {
      const sekil = o.target.dataset?.sekil;
      if (!sekil) return;
      d.sekil = sekil;
      sekilGirdileriniCiz(); hesapla(); kaydet();
    });
    a('birim').addEventListener('change', (o) => { d.birim = o.target.value; hesapla(); kaydet(); });
    c('sekil-girdi').addEventListener('input', (o) => {
      const t = o.target;
      if (t.dataset.g) d[t.dataset.g][t.dataset.k] = sayiOku(t.value);
      else if (t.dataset.kose) d.cok[+t.dataset.kose][t.dataset.k] = sayiOku(t.value);
      hesapla(); kaydet();
    });
    c('sekil-girdi').addEventListener('click', (o) => {
      const t = o.target;
      if (t.dataset.koseSil !== undefined) d.cok.splice(+t.dataset.koseSil, 1);
      else if (t.dataset.is === 'kose-ekle') {
        const son = d.cok[d.cok.length - 1], ilk = d.cok[0];
        d.cok.push({ x: +((son.x + ilk.x) / 2).toFixed(2), y: +((son.y + ilk.y) / 2).toFixed(2) });
      } else return;
      sekilGirdileriniCiz(); hesapla(); kaydet();
    });

    // ---- DWG / DXF'ten oda biçimi ----
    function cadBicimiYukle(bicim) {
      const kat = 10 / MM[d.birim]; // cm → seçili birim
      const basamak = d.birim === 'm' ? 3 : d.birim === 'cm' ? 1 : 0;
      const minX = Math.min(...bicim.noktalar.map((n) => n.x)), minY = Math.min(...bicim.noktalar.map((n) => n.y));
      d.cok = bicim.noktalar.map((n) => ({ x: +((n.x - minX) * kat).toFixed(basamak), y: +((n.y - minY) * kat).toFixed(basamak) }));
      d.sekil = 'cok';
      sekilGirdileriniCiz(); hesapla(); kaydet();
    }

    a('cad').addEventListener('click', async () => {
      const cad = await cadIceAktar();
      if (!cad) return;
      if (!cad.kapalilar.length) {
        bildir('Çizimde kapalı çoklu çizgi (polyline) bulunamadı. Oda çevresini AutoCAD’de kapalı polyline olarak çizin.', 'hata');
        return;
      }
      if (cad.kapalilar.length === 1) { cadBicimiYukle(cad.kapalilar[0]); bildir('Oda biçimi çizimden alındı.'); return; }
      const liste = ogeOlustur(`<div class="kayit-listesi">${cad.kapalilar.slice(0, 40).map((k, i) => `
        <div class="kayit"><div class="kayit-bilgi"><div class="kayit-ad">${sayiYaz(k.alan / 10000)} m²</div>
          <div class="kayit-ayrinti">çevre ${sayiYaz(k.cevre / 100)} m · ${k.noktalar.length} köşe</div></div>
          <button class="dugme kucuk birincil" data-bicim="${i}">Seç</button></div>`).join('')}</div>`);
      const p = pencereAc({ baslik: `${cad.ad} — kapalı alanlar`, govde: liste, boyut: 'orta' });
      liste.addEventListener('click', (o) => {
        const sira = o.target.dataset.bicim;
        if (sira === undefined) return;
        cadBicimiYukle(cad.kapalilar[+sira]);
        p.kapat();
        bildir('Oda biçimi çizimden alındı.');
      });
    });

    for (const girdi of kap.querySelectorAll('[data-m]')) {
      const anahtar = girdi.dataset.m;
      if (girdi.type === 'checkbox') girdi.checked = d.metraj[anahtar];
      else girdi.value = d.metraj[anahtar];
      girdi.addEventListener('input', () => {
        d.metraj[anahtar] = girdi.type === 'checkbox' ? girdi.checked : sayiOku(girdi.value);
        hesapla(); kaydet();
      });
    }

    olcekCiz();
    cizimiHesapla();
    sekilGirdileriniCiz();
    hesapla();
  },
};
