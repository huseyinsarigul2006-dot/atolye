// DWG / DXF içe aktarma (arayüz tarafı): dosyayı seçtirir, çizim birimini sorar ve
// geometriyi santimetreye, sol üst köşesi (0,0) olacak biçimde çevirir.
import { pencereAc, bildir, kacis, sayiYaz, ogeOlustur } from './arayuz.js';

const CM = { mm: 0.1, cm: 1, m: 100 };
const INSUNITS = { 4: 'mm', 5: 'cm', 6: 'm' };

function birimTahmini(ham) {
  if (INSUNITS[ham.birim]) return INSUNITS[ham.birim];
  const buyuk = Math.max(ham.sinir.maxX - ham.sinir.minX, ham.sinir.maxY - ham.sinir.minY);
  return buyuk > 2500 ? 'mm' : buyuk > 250 ? 'cm' : 'm';
}

/** Çizim biriminin ne olduğunu sorar; vazgeçilirse null döner. */
function birimSor(ham) {
  return new Promise((coz) => {
    let secim = null;
    const gen = ham.sinir.maxX - ham.sinir.minX, yuk = ham.sinir.maxY - ham.sinir.minY;
    const govde = ogeOlustur(`
      <div class="yigin">
        <p><b>${kacis(ham.ad)}</b><br><span class="kart-alt">${ham.yollar.length} çizgi/eğri okundu${ham.atlanan ? `, ${ham.atlanan} öğe (yazı, ölçü, tarama vb.) alınmadı` : ''}${ham.kesildi ? '. Çizim çok büyük olduğu için bir kısmı alındı' : ''}.</span></p>
        <label class="alan"><span>Çizim birimi (çizimdeki 1 birim neye eşit?)</span>
          <select data-odak>
            <option value="mm">Milimetre</option><option value="cm">Santimetre</option><option value="m">Metre</option>
          </select></label>
        <div class="sonuc"><span class="ad">Bu birimle çizimin gerçek boyutu</span><span class="deger" data-c="boyut"></span>
          <span class="not">Boyut mantıklı görünmüyorsa birimi değiştirin.</span></div>
      </div>`);
    const sec = govde.querySelector('select');
    const yaz = () => {
      const k = CM[sec.value] / 100;
      govde.querySelector('[data-c="boyut"]').innerHTML = `${sayiYaz(gen * k)} × ${sayiYaz(yuk * k)} <small>m</small>`;
    };
    sec.value = birimTahmini(ham);
    sec.addEventListener('change', yaz);
    yaz();
    pencereAc({
      baslik: 'Çizimi içe aktar',
      govde,
      dugmeler: [
        { metin: 'Vazgeç', tikla: (kapat) => kapat() },
        { metin: 'İçe aktar', sinif: 'birincil', tikla: (kapat) => { secim = sec.value; kapat(); } },
      ],
      kapaninca: () => coz(secim),
    });
  });
}

function olc(noktalar) {
  let alan = 0, cevre = 0;
  for (let i = 0; i < noktalar.length; i++) {
    const a = noktalar[i], b = noktalar[(i + 1) % noktalar.length];
    alan += a.x * b.y - b.x * a.y;
    cevre += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return { alan: Math.abs(alan) / 2, cevre };
}

/**
 * @returns {Promise<null | {
 *   ad: string, birim: string, en: number, boy: number,
 *   yollar: { n: number[], k: boolean }[],            // cm, y aşağı doğru
 *   kapalilar: { noktalar: {x:number,y:number}[], alan: number, cevre: number }[]  // cm, büyükten küçüğe
 * }>}
 */
export async function cadIceAktar() {
  const ham = await window.atolye.cadAc();
  if (!ham) return null;
  if (ham.hata) { bildir('Çizim açılamadı: ' + ham.hata, 'hata'); return null; }
  const birim = await birimSor(ham);
  if (!birim) return null;

  const k = CM[birim];
  const { minX, maxX, minY, maxY } = ham.sinir;
  const yuvarla = (v) => Math.round(v * 10) / 10;
  const yollar = [];
  const kapalilar = [];
  for (const y of ham.yollar) {
    const n = new Array(y.n.length);
    for (let i = 0; i < y.n.length; i += 2) {
      n[i] = yuvarla((y.n[i] - minX) * k);
      n[i + 1] = yuvarla((maxY - y.n[i + 1]) * k);
    }
    yollar.push({ n, k: y.k });
    if (y.a) {
      const noktalar = [];
      for (let i = 0; i < n.length; i += 2) noktalar.push({ x: n[i], y: n[i + 1] });
      const olcu = olc(noktalar);
      if (olcu.alan > 1) kapalilar.push({ noktalar, ...olcu });
    }
  }
  kapalilar.sort((a, b) => b.alan - a.alan);
  return { ad: ham.ad, birim, en: (maxX - minX) * k, boy: (maxY - minY) * k, yollar, kapalilar };
}
