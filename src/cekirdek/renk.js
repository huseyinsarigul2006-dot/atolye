// Renk yardımcıları: dönüşümler, baskın renk çıkarma ve renk uyumları.

export const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

export function hexCoz(metin) {
  const m = /^#?([0-9a-f]{6})$/i.exec(metin);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbdenHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const ust = Math.max(r, g, b), alt = Math.min(r, g, b), fark = ust - alt;
  const l = (ust + alt) / 2;
  let h = 0, s = 0;
  if (fark) {
    s = fark / (1 - Math.abs(2 * l - 1));
    if (ust === r) h = ((g - b) / fark) % 6;
    else if (ust === g) h = (b - r) / fark + 2;
    else h = (r - g) / fark + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hsldenRgb({ h, s, l }) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export const rgbMetni = ({ r, g, b }) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
export function hslMetni(rgb) {
  const { h, s, l } = rgbdenHsl(rgb);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/** Zemin rengine göre okunaklı yazı rengi. */
export const yaziRengi = ({ r, g, b }) => ((r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1d1b18' : '#ffffff');

/** Seçilen renge göre uyum önerileri. */
export function uyumlar(rgb) {
  const t = rgbdenHsl(rgb);
  const don = (aci) => hsldenRgb({ ...t, h: t.h + aci });
  const ton = (l) => hsldenRgb({ ...t, l });
  return [
    { ad: 'Tamamlayıcı', aciklama: 'Renk çemberinde tam karşıdaki renk; güçlü kontrast.', renkler: [rgb, don(180)] },
    { ad: 'Analog', aciklama: 'Komşu renkler; sakin ve uyumlu geçişler.', renkler: [don(-30), rgb, don(30)] },
    { ad: 'Üçlü', aciklama: 'Çemberde eşit aralıklı üç renk; dengeli ve canlı.', renkler: [rgb, don(120), don(240)] },
    { ad: 'Tonlar', aciklama: 'Aynı rengin açık ve koyu tonları.', renkler: [ton(88), ton(72), ton(Math.round(t.l)), ton(34), ton(18)] },
  ];
}

/**
 * Görselden baskın renkleri çıkarır: pikseller renk kutularına toplanır,
 * kutular ağırlıklı k-ortalama ile `adet` kümeye ayrılır.
 * @returns {{r:number,g:number,b:number,oran:number}[]} yaygınlığa göre sıralı
 */
export function baskinRenkler(gorsel, adet) {
  const KENAR = 140;
  const kat = Math.min(1, KENAR / Math.max(gorsel.naturalWidth, gorsel.naturalHeight));
  const t = document.createElement('canvas');
  t.width = Math.max(1, Math.round(gorsel.naturalWidth * kat));
  t.height = Math.max(1, Math.round(gorsel.naturalHeight * kat));
  const c = t.getContext('2d', { willReadFrequently: true });
  c.drawImage(gorsel, 0, 0, t.width, t.height);
  const veri = c.getImageData(0, 0, t.width, t.height).data;

  const kutular = new Map();
  for (let i = 0; i < veri.length; i += 4) {
    if (veri[i + 3] < 125) continue;
    const anahtar = ((veri[i] >> 3) << 10) | ((veri[i + 1] >> 3) << 5) | (veri[i + 2] >> 3);
    let k = kutular.get(anahtar);
    if (!k) { k = { r: 0, g: 0, b: 0, n: 0 }; kutular.set(anahtar, k); }
    k.r += veri[i]; k.g += veri[i + 1]; k.b += veri[i + 2]; k.n++;
  }
  const noktalar = [...kutular.values()].map((k) => ({ r: k.r / k.n, g: k.g / k.n, b: k.b / k.n, n: k.n }));
  if (!noktalar.length) return [];
  adet = Math.min(adet, noktalar.length);
  const uzaklik = (a, b) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

  // Başlangıç merkezleri: en kalabalık kutu, sonra hem uzak hem kalabalık olanlar.
  noktalar.sort((a, b) => b.n - a.n);
  const merkezler = [{ ...noktalar[0] }];
  const enYakin = noktalar.map((p) => uzaklik(p, merkezler[0]));
  while (merkezler.length < adet) {
    let secilen = 0, enIyi = -1;
    for (let i = 0; i < noktalar.length; i++) {
      const puan = enYakin[i] * Math.sqrt(noktalar[i].n);
      if (puan > enIyi) { enIyi = puan; secilen = i; }
    }
    merkezler.push({ ...noktalar[secilen] });
    for (let i = 0; i < noktalar.length; i++) enYakin[i] = Math.min(enYakin[i], uzaklik(noktalar[i], noktalar[secilen]));
  }

  let toplamlar;
  for (let tur = 0; tur < 12; tur++) {
    toplamlar = merkezler.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const p of noktalar) {
      let en = 0, enU = Infinity;
      for (let m = 0; m < merkezler.length; m++) {
        const u = uzaklik(p, merkezler[m]);
        if (u < enU) { enU = u; en = m; }
      }
      const tp = toplamlar[en];
      tp.r += p.r * p.n; tp.g += p.g * p.n; tp.b += p.b * p.n; tp.n += p.n;
    }
    toplamlar.forEach((tp, m) => {
      if (tp.n) merkezler[m] = { r: tp.r / tp.n, g: tp.g / tp.n, b: tp.b / tp.n };
    });
  }
  const toplam = toplamlar.reduce((s, tp) => s + tp.n, 0) || 1;
  return merkezler
    .map((m, i) => ({ r: Math.round(m.r), g: Math.round(m.g), b: Math.round(m.b), oran: toplamlar[i].n / toplam }))
    .filter((m) => m.oran > 0)
    .sort((a, b) => b.oran - a.oran);
}
