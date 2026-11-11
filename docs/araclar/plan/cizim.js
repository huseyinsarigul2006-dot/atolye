// Plan çizimi: ölçekli 2B planı SVG olarak üretir (ekran ve PNG dışa aktarma için ortak).
import { MOBILYA_SOZLUGU } from '../../veri/mobilyalar.js';
import { duvarGeometrisi } from './denetim.js';
import { kacis, sayiYaz, sinirla } from '../../cekirdek/arayuz.js';

// Kenar payları: cetvel için ön boşluk; duvar kalınlığı ayrıca eklenir.
const ON = 44, SAG = 16, ALT = 34, DUVAR_CM = 12;

const MUREKKEP = '#35322e';
const INCE = '#8a857c';
const SECIM = '#2463c9';
const YAZI = 'font-family="Segoe UI, sans-serif"';

/** Verilen alana sığacak piksel/cm oranı. */
export function olcekHesapla(oda, genislik, yukseklik) {
  const s = Math.min(
    (genislik - ON - SAG - 4) / (oda.en + 2 * DUVAR_CM),
    (yukseklik - ON - ALT - 4) / (oda.boy + 2 * DUVAR_CM),
  );
  return sinirla(s, 0.05, 3.2);
}

function sembolCiz(tur, w, h) {
  const c = `fill="none" stroke="${INCE}" stroke-width="1"`;
  const kutu = (x, y, ww, hh, rx = 2) => `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="${rx}" ${c}/>`;
  const cizgi = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${c}/>`;
  const elips = (cx, cy, rx, ry = rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${c}/>`;
  switch (tur) {
    case 'yatak': {
      const yastik = w / h > 0.62
        ? kutu(w * 0.08, h * 0.05, w * 0.38, h * 0.15, 3) + kutu(w * 0.54, h * 0.05, w * 0.38, h * 0.15, 3)
        : kutu(w * 0.15, h * 0.05, w * 0.7, h * 0.15, 3);
      return yastik + cizgi(0, h * 0.27, w, h * 0.27);
    }
    case 'koltuk': {
      const arka = h * 0.24, kol = Math.min(w * 0.14, h * 0.2);
      const n = Math.max(1, Math.round((w / h) * 1.15));
      let s = cizgi(0, arka, w, arka) + cizgi(kol, arka, kol, h) + cizgi(w - kol, arka, w - kol, h);
      for (let i = 1; i < n; i++) { const x = kol + ((w - 2 * kol) * i) / n; s += cizgi(x, arka, x, h); }
      return s;
    }
    case 'kose':
      return cizgi(0, h * 0.13, w * 0.91, h * 0.13) + cizgi(w * 0.91, h * 0.13, w * 0.91, h) + cizgi(w * 0.64, h * 0.13, w * 0.64, h * 0.52) + cizgi(w * 0.32, h * 0.13, w * 0.32, h * 0.52);
    case 'sandalye': return cizgi(0, h * 0.2, w, h * 0.2);
    case 'dolap': return cizgi(w * 0.05, h / 2, w * 0.95, h / 2) + cizgi(0, h * 0.92, w, h * 0.92);
    case 'cekmece': return cizgi(0, h * 0.88, w, h * 0.88);
    case 'kitaplik': {
      const n = Math.max(2, Math.round(w / h / 1.4));
      let s = '';
      for (let i = 1; i < n; i++) s += cizgi((w * i) / n, 0, (w * i) / n, h);
      return s;
    }
    case 'tv': return kutu(w * 0.2, h * 0.3, w * 0.6, h * 0.16, 1);
    case 'evye': return kutu(w * 0.08, h * 0.15, w * 0.52, h * 0.64, 4) + elips(w * 0.34, h * 0.47, 2) + [0.7, 0.78, 0.86].map((x) => cizgi(w * x, h * 0.2, w * x, h * 0.76)).join('');
    case 'ocak': {
      const r = Math.min(w, h) * 0.13;
      return [[0.28, 0.3], [0.72, 0.3], [0.28, 0.7], [0.72, 0.7]].map(([x, y]) => elips(w * x, h * y, r)).join('');
    }
    case 'buzdolabi': return cizgi(0, h * 0.9, w, h * 0.9);
    case 'makine': return elips(w / 2, h / 2, Math.min(w, h) * 0.3);
    case 'lavabo': return elips(w / 2, h * 0.56, w * 0.34, h * 0.3) + elips(w / 2, h * 0.13, 1.5);
    case 'klozet': return kutu(w * 0.05, 0, w * 0.9, h * 0.26, 2) + elips(w / 2, h * 0.63, w * 0.42, h * 0.33);
    case 'dus': return cizgi(0, 0, w, h) + cizgi(w, 0, 0, h) + elips(w / 2, h / 2, 3);
    case 'kuvet': return kutu(w * 0.05, h * 0.1, w * 0.9, h * 0.8, Math.min(w, h) * 0.3) + elips(w * 0.14, h / 2, 2);
    case 'hali': return `<rect x="5" y="5" width="${Math.max(0, w - 10)}" height="${Math.max(0, h - 10)}" fill="none" stroke="${INCE}" stroke-width="1" stroke-dasharray="5 4"/>`;
    case 'bitki': return elips(w / 2, h / 2, w * 0.24, h * 0.24);
    case 'piyano': return cizgi(0, h * 0.72, w, h * 0.72);
    default: return '';
  }
}

function mobilyaCiz(m, s, ox, oy, durum, secili, etkilesimli) {
  const tanim = MOBILYA_SOZLUGU[m.tur] || {};
  const yatay = m.aci % 180 === 0;
  const W = (yatay ? m.en : m.boy) * s, H = (yatay ? m.boy : m.en) * s;
  const x = ox + m.x * s, y = oy + m.y * s, w = m.en * s, h = m.boy * s;
  const cx = x + w / 2, cy = y + h / 2;

  let dolgu = tanim.zemin ? '#f1ece3' : '#fbfaf7', kenar = tanim.zemin ? INCE : MUREKKEP, kalinlik = 1.3;
  if (durum === 'cakisma') { dolgu = '#fbe1de'; kenar = '#c0392b'; kalinlik = 2; }
  else if (durum === 'dar') { dolgu = '#fcf0d4'; kenar = '#b97400'; kalinlik = 1.8; }
  const boya = `fill="${dolgu}" stroke="${kenar}" stroke-width="${kalinlik}" stroke-linejoin="round"`;

  let govde;
  if (tanim.yuvarlak) govde = `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2}" ry="${H / 2}" ${boya}/>`;
  else if (tanim.sembol === 'kose') govde = `<path d="M0 0H${W}V${H}H${W * 0.64}V${H * 0.52}H0Z" ${boya}/>`;
  else govde = `<rect width="${W}" height="${H}" rx="1.5" ${boya}/>`;

  // Etiket: sığdığı kadarını yaz.
  let etiket = '';
  const ad = m.ad === tanim.ad ? (tanim.kisa || m.ad) : m.ad;
  const sigan = Math.floor(w / 6.3);
  if (sigan >= 4 && h >= 16) {
    const metin = ad.length > sigan ? ad.slice(0, Math.max(1, sigan - 1)) + '…' : ad;
    const olcuVar = h >= 34 && w >= 46;
    const stil = `text-anchor="middle" ${YAZI} paint-order="stroke" stroke="${dolgu}" stroke-width="3" stroke-linejoin="round"`;
    etiket = `<text x="${cx}" y="${cy + (olcuVar ? -2 : 4)}" font-size="11" font-weight="600" fill="${MUREKKEP}" ${stil}>${kacis(metin)}</text>`;
    if (olcuVar) etiket += `<text x="${cx}" y="${cy + 11}" font-size="9.5" fill="${INCE}" ${stil}>${sayiYaz(m.en, 0)}×${sayiYaz(m.boy, 0)}</text>`;
  }

  let secim = '';
  if (secili && etkilesimli) {
    secim = `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="none" stroke="${SECIM}" stroke-width="1.5" stroke-dasharray="5 3"/>
      <rect data-tut="boyut" x="${x + w - 2}" y="${y + h - 2}" width="10" height="10" rx="2" fill="#fff" stroke="${SECIM}" stroke-width="1.5" style="cursor:nwse-resize"/>
      <rect data-tut="boyut" x="${x + w - 12}" y="${y + h - 12}" width="30" height="30" fill="transparent" style="cursor:nwse-resize"/>`;
  }
  const tutma = etkilesimli ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent" style="cursor:move"/>` : '';
  return `<g data-id="${m.id}">
    <g transform="translate(${cx} ${cy}) rotate(${m.aci}) translate(${-W / 2} ${-H / 2})">${govde}${sembolCiz(tanim.sembol, W, H)}</g>
    ${etiket}${tutma}${secim}</g>`;
}

function aciklikCiz(a, oda, s, ox, oy, D, secili, etkilesimli) {
  const g = duvarGeometrisi(oda, a.duvar);
  const P = [ox + (g.x0 + g.dx * a.konum) * s, oy + (g.y0 + g.dy * a.konum) * s];
  const Q = [P[0] + g.dx * a.genislik * s, P[1] + g.dy * a.genislik * s];
  const disari = (n, k) => [n[0] - g.nx * k, n[1] - g.ny * k];
  const dortgen = (ic, dis) => [disari(P, -ic), disari(Q, -ic), disari(Q, dis), disari(P, dis)].map((n) => n.join(',')).join(' ');
  let s2 = `<polygon points="${dortgen(0.8, D + 0.8)}" fill="#ffffff"/>`;
  const kenar = secili && etkilesimli ? SECIM : MUREKKEP;
  if (a.tur === 'pencere') {
    const o1 = disari(P, D / 2), o2 = disari(Q, D / 2);
    s2 += `<polygon points="${dortgen(0, D)}" fill="#e6f0f6" stroke="${kenar}" stroke-width="1.3"/>
      <line x1="${o1[0]}" y1="${o1[1]}" x2="${o2[0]}" y2="${o2[1]}" stroke="${kenar}" stroke-width="1.3"/>`;
  } else {
    const H = a.ters ? Q : P, E = a.ters ? P : Q;
    const r = a.genislik * s;
    const T = [H[0] + g.nx * r, H[1] + g.ny * r];
    const capraz = (T[0] - H[0]) * (E[1] - H[1]) - (T[1] - H[1]) * (E[0] - H[0]);
    const p1 = disari(P, D), q1 = disari(Q, D);
    s2 += `<line x1="${P[0]}" y1="${P[1]}" x2="${p1[0]}" y2="${p1[1]}" stroke="${kenar}" stroke-width="1.3"/>
      <line x1="${Q[0]}" y1="${Q[1]}" x2="${q1[0]}" y2="${q1[1]}" stroke="${kenar}" stroke-width="1.3"/>
      <path d="M${T[0]} ${T[1]}A${r} ${r} 0 0 ${capraz > 0 ? 1 : 0} ${E[0]} ${E[1]}" fill="none" stroke="${INCE}" stroke-width="1" stroke-dasharray="4 3"/>
      <line x1="${H[0]}" y1="${H[1]}" x2="${T[0]}" y2="${T[1]}" stroke="${kenar}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  if (etkilesimli) {
    s2 += `<polygon points="${dortgen(5, D + 5)}" fill="transparent" style="cursor:${g.dx ? 'ew-resize' : 'ns-resize'}"/>`;
  }
  return `<g data-acik="${a.id}">${s2}</g>`;
}

// İçe aktarılan çizimin (DWG/DXF altlığı) yol verisi; santimetre cinsinden bir kez üretilir.
const altlikOnbellek = new WeakMap();
function altlikYolu(altlik) {
  let d = altlikOnbellek.get(altlik);
  if (d === undefined) {
    const parcalar = [];
    for (const y of altlik.yollar) {
      let p = `M${y.n[0]} ${y.n[1]}`;
      for (let i = 2; i < y.n.length; i += 2) p += `L${y.n[i]} ${y.n[i + 1]}`;
      parcalar.push(y.k ? p + 'Z' : p);
    }
    d = parcalar.join('');
    altlikOnbellek.set(altlik, d);
  }
  return d;
}

/**
 * `zemin` (arka plan, ızgara, çizim altlığı) seyrek değişir; `icerik` her harekette yeniden çizilir.
 * @returns {{ genislik: number, yukseklik: number, ox: number, oy: number, zemin: string, icerik: string }}
 */
export function planSvg(plan, { s, izgara = true, seciliId = null, denetim = null, etkilesimli = true, baslik = null }) {
  const { en, boy } = plan.oda;
  const W = en * s, H = boy * s;
  const D = Math.max(5, DUVAR_CM * s);
  const ox = ON + D, oy = ON + D + (baslik ? 24 : 0);
  const genislik = Math.ceil(ox + W + D + SAG), yukseklik = Math.ceil(oy + H + D + ALT);
  let c = `<rect width="${genislik}" height="${yukseklik}" fill="#ffffff"/>`;
  if (baslik) c += `<text x="${ox - D}" y="22" font-size="15" font-weight="700" fill="${MUREKKEP}" ${YAZI}>${kacis(baslik)}</text>`;

  // Izgara
  const adim = s * 10 >= 5 ? 10 : s * 50 >= 5 ? 50 : 100;
  if (izgara) {
    const yollar = { ince: '', orta: '', kalin: '' };
    const sinif = (v) => (v % 100 === 0 ? 'kalin' : v % 50 === 0 ? 'orta' : 'ince');
    for (let x = adim; x < en; x += adim) yollar[sinif(x)] += `M${ox + x * s} ${oy}v${H}`;
    for (let y = adim; y < boy; y += adim) yollar[sinif(y)] += `M${ox} ${oy + y * s}h${W}`;
    c += `<path d="${yollar.ince}" stroke="#efede9" stroke-width="1"/><path d="${yollar.orta}" stroke="#e2dfd8" stroke-width="1"/><path d="${yollar.kalin}" stroke="#cfcbc2" stroke-width="1"/>`;
  }
  if (plan.altlik) {
    c += `<path d="${altlikYolu(plan.altlik)}" transform="translate(${ox} ${oy}) scale(${s})" fill="none" stroke="${MUREKKEP}" stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }
  const zemin = c;
  c = '';

  // Mobilyalar: önce zemin öğeleri (halı), sonra diğerleri.
  const sirali = [...plan.mobilyalar].sort((a, b) => (MOBILYA_SOZLUGU[b.tur]?.zemin ? 1 : 0) - (MOBILYA_SOZLUGU[a.tur]?.zemin ? 1 : 0));
  for (const m of sirali) {
    const durum = denetim?.cakisan.has(m.id) ? 'cakisma' : denetim?.dar.has(m.id) ? 'dar' : null;
    c += mobilyaCiz(m, s, ox, oy, durum, m.id === seciliId, etkilesimli);
  }

  // Duvarlar ve açıklıklar (içe aktarılan çizimde duvarlar çizimin kendisinden gelir)
  if (!plan.altlik) c += `<path fill-rule="evenodd" fill="${MUREKKEP}" d="M${ox - D} ${oy - D}h${W + 2 * D}v${H + 2 * D}h${-(W + 2 * D)}zM${ox} ${oy}h${W}v${H}h${-W}z"/>`;
  if (!plan.altlik) for (const a of plan.acikliklar) c += aciklikCiz(a, plan.oda, s, ox, oy, D, a.id === seciliId, etkilesimli);

  // Cetveller (metre)
  const etiketAdim = [50, 100, 200, 500, 1000].find((v) => v * s >= 38) || 1000;
  const cy = oy - D - 8, cx = ox - D - 8;
  let cetvel = `M${ox} ${cy}h${W}M${cx} ${oy}v${H}`;
  let yazilar = '';
  const isaret = (v) => (v % 100 === 0 ? 9 : v % 50 === 0 ? 6 : 3.5);
  for (let x = 0; x <= en + 0.01; x += adim) {
    cetvel += `M${ox + x * s} ${cy}v${-isaret(x)}`;
    if (x % etiketAdim === 0) yazilar += `<text x="${ox + x * s}" y="${cy - 13}" text-anchor="middle">${sayiYaz(x / 100)}</text>`;
  }
  for (let y = 0; y <= boy + 0.01; y += adim) {
    cetvel += `M${cx} ${oy + y * s}h${-isaret(y)}`;
    if (y % etiketAdim === 0) yazilar += `<text x="${cx - 13}" y="${oy + y * s + 3.5}" text-anchor="end">${sayiYaz(y / 100)}</text>`;
  }
  c += `<path d="${cetvel}" stroke="${INCE}" stroke-width="1" fill="none"/>
    <g font-size="10" fill="${INCE}" ${YAZI}>${yazilar}<text x="${cx - 13}" y="${cy - 13}" text-anchor="end" font-weight="600">m</text></g>`;

  // Ölçek çubuğu ve oda özeti
  const cubuk = en >= 100 ? 100 : 50;
  const by = oy + H + D + 18;
  c += `<path d="M${ox} ${by - 4}v8M${ox} ${by}h${cubuk * s}M${ox + cubuk * s} ${by - 4}v8" stroke="${MUREKKEP}" stroke-width="1.4" fill="none"/>
    <text x="${ox + cubuk * s + 7}" y="${by + 4}" font-size="11" fill="${MUREKKEP}" ${YAZI}>${cubuk === 100 ? '1 m' : '50 cm'}</text>
    <text x="${ox + W}" y="${by + 4}" text-anchor="end" font-size="11" fill="${MUREKKEP}" ${YAZI}>${plan.altlik ? `Çizim ${sayiYaz(en / 100)} × ${sayiYaz(boy / 100)} m` : `Oda ${sayiYaz(en / 100)} × ${sayiYaz(boy / 100)} m · ${sayiYaz((en * boy) / 10000)} m²`}</text>`;

  return { genislik, yukseklik, ox, oy, zemin, icerik: c };
}
