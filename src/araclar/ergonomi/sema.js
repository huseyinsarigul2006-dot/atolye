// Ergonomi ölçüleri için basit SVG şemaları. Renkler tema değişkenlerinden gelir.
import { kacis } from '../../cekirdek/arayuz.js';

const G = 250, Y = 132;
const ZEMIN = 118;          // zemin çizgisinin y konumu
const KAT = 0.44;           // 1 cm = 0,44 birim (insan ölçeği sabit)
const cizgi = 'fill="none" stroke="var(--metin-2)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
const dolgu = 'fill="var(--yuzey-2)" stroke="var(--metin-2)" stroke-width="1.4" stroke-linejoin="round"';
const olcu = 'fill="none" stroke="var(--vurgu)" stroke-width="1.4" stroke-linecap="round"';
const yazi = (x, y, metin, ek = '') => `<text x="${x}" y="${y}" font-size="11" font-weight="650" fill="var(--vurgu-koyu)" ${ek}>${kacis(metin)}</text>`;
const ad = (x, y, metin) => `<text x="${x}" y="${y}" font-size="9.5" fill="var(--metin-2)" text-anchor="middle">${kacis(metin)}</text>`;
const h = (cm) => ZEMIN - cm * KAT;

/** Uçlarında mimari çentik bulunan ölçü çizgisi. */
function olcuCizgisi(x1, y1, x2, y2) {
  const c = (x, y) => `M${x - 3.5} ${y + 3.5}L${x + 3.5} ${y - 3.5}`;
  return `<path d="M${x1} ${y1}L${x2} ${y2}${c(x1, y1)}${c(x2, y2)}" ${olcu}/>`;
}

function figur(tur, x) {
  if (tur === 'ayakta') {
    const ust = h(170);
    return `<circle cx="${x}" cy="${ust + 5.5}" r="5.5" ${cizgi}/>
      <path d="M${x} ${ust + 11}V${h(82)}M${x} ${h(82)}L${x - 5} ${ZEMIN}M${x} ${h(82)}L${x + 5} ${ZEMIN}M${x} ${h(140)}L${x + 11} ${h(104)}" ${cizgi}/>`;
  }
  // Oturan: kalça 45 cm, omuz ~97 cm, baş ~120 cm
  const kalca = h(47), omuz = h(98);
  return `<circle cx="${x}" cy="${h(111)}" r="5.5" ${cizgi}/>
    <path d="M${x} ${omuz}V${kalca}H${x + 20}V${ZEMIN}M${x} ${h(90)}L${x + 15} ${h(72)}" ${cizgi}/>
    <path d="M${x - 7} ${h(85)}V${h(43)}H${x + 14}M${x - 7} ${h(43)}V${ZEMIN}M${x + 12} ${h(43)}V${ZEMIN}" fill="none" stroke="var(--cizgi-guclu)" stroke-width="1.2" stroke-linecap="round"/>`;
}

function dikey(s, deger) {
  const alt = s.alt || 0;
  const [o1, o2] = s.olcu || [0, s.bicim === 'blok' && alt ? alt : s.y];
  const bx = s.figur ? 82 : 56, bg = 62;
  // Şemaya sığması için değerin yalnızca sayısal kısmını yaz ("en az 65 cm yükseklik" → "65 cm").
  const kisa = /[\d.,]+(?:[–-][\d.,]+)?\s*cm/.exec(deger)?.[0] || deger;
  let nesne;
  if (s.bicim === 'masa') {
    nesne = `<rect x="${bx}" y="${h(s.y)}" width="${bg}" height="4" rx="1" ${dolgu}/><path d="M${bx + 6} ${h(s.y) + 4}V${ZEMIN}M${bx + bg - 6} ${h(s.y) + 4}V${ZEMIN}" ${cizgi}/>`;
  } else if (s.bicim === 'cizgi') {
    nesne = `<path d="M${bx} ${h(s.y)}H${bx + bg}" ${cizgi} stroke-dasharray="5 4"/><circle cx="${bx + bg / 2}" cy="${h(s.y)}" r="3.5" ${dolgu}/>`;
  } else {
    nesne = `<rect x="${bx}" y="${h(s.y)}" width="${bg}" height="${Math.max(3, (s.y - alt) * KAT)}" rx="2" ${dolgu}/>`;
  }
  const ox = bx + bg + 16;
  return `<path d="M14 ${ZEMIN}H${G - 14}" ${cizgi}/>
    ${s.figur ? figur(s.figur, s.figur === 'oturan' ? 40 : 48) : ''}${nesne}
    ${olcuCizgisi(ox, h(o1), ox, h(o2))}
    ${yazi(ox + 8, (h(o1) + h(o2)) / 2 + 4, s.etiket || kisa)}`;
}

function yatay(s, deger) {
  const blok = (x, metin) => metin === 'Duvar'
    ? `<rect x="${x < 100 ? 34 : 204}" y="22" width="12" height="84" fill="var(--metin-2)" opacity=".55"/>${ad(x < 100 ? 40 : 210, 118, 'Duvar')}`
    : `<rect x="${x}" y="34" width="62" height="60" rx="3" ${dolgu}/>${ad(x + 31, 68, metin)}`;
  const x1 = s.sol === 'Duvar' ? 46 : 86, x2 = s.sag === 'Duvar' ? 204 : 164;
  return `${blok(24, s.sol)}${blok(164, s.sag)}
    ${olcuCizgisi(x1 + 5, 64, x2 - 5, 64)}
    ${yazi(125, 21, s.etiket || deger, 'text-anchor="middle"')}`;
}

function kutu(s) {
  return `<rect x="28" y="38" width="96" height="70" rx="3" ${dolgu}/>
    ${ad(76, 77, s.ad || '')}
    ${olcuCizgisi(28, 27, 124, 27)}${yazi(76, 19, s.en, 'text-anchor="middle"')}
    ${olcuCizgisi(136, 38, 136, 108)}${yazi(144, 77, s.boy)}`;
}

function ucgen() {
  const n = [[52, 100, 'Evye'], [125, 28, 'Ocak'], [198, 100, 'Buzdolabı']];
  return `<path d="M52 100L125 28L198 100Z" ${olcu} stroke-dasharray="5 4"/>
    ${n.map(([x, y, m]) => `<circle cx="${x}" cy="${y}" r="13" ${dolgu}/>${ad(x, y === 28 ? 13 : 124, m)}`).join('')}
    ${yazi(125, 82, '120–270 cm', 'text-anchor="middle"')}`;
}

function merdiven() {
  return `<path d="M30 112H78V88H126V64H174V40H222" ${cizgi}/>
    ${olcuCizgisi(78, 100, 126, 100)}${yazi(84, 116, '27–30 cm')}
    ${olcuCizgisi(138, 88, 138, 64)}${yazi(146, 80, '16–18 cm')}`;
}

function daire(s) {
  return `<circle cx="125" cy="54" r="44" ${olcu} stroke-dasharray="5 4"/>
    <rect x="109" y="42" width="32" height="30" rx="5" ${dolgu}/><circle cx="125" cy="34" r="6" ${cizgi}/>
    ${olcuCizgisi(81, 108, 169, 108)}${yazi(125, 124, s.etiket, 'text-anchor="middle"')}`;
}

export function semaCiz(oge) {
  const s = oge.sema;
  const ic = s.tur === 'dikey' ? dikey(s, oge.deger)
    : s.tur === 'yatay' ? yatay(s, oge.deger)
    : s.tur === 'kutu' ? kutu(s)
    : s.tur === 'ucgen' ? ucgen()
    : s.tur === 'merdiven' ? merdiven()
    : daire(s);
  return `<svg viewBox="0 0 ${G} ${Y}" role="img" aria-label="${kacis(oge.ad)} şeması" font-family="Segoe UI, sans-serif">${ic}</svg>`;
}
