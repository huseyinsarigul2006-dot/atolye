// DWG / DXF veritabanını (LibreDWG çıktısı) sade çoklu çizgilere indirger.
// Hem Windows sürümü (ana süreç) hem de web/iPad sürümü (tarayıcı) bu dosyayı kullanır.
// Yaylar, daireler, elipsler ve bloklar (INSERT) noktalara açılır; yazı, ölçü ve tarama alınmaz.

const EN_COK_NOKTA = 400000;
const BLOK_DERINLIGI = 5;
// ---- Dönüşüm matrisi [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f ----
const BIRIM = [1, 0, 0, 1, 0, 0];
const carp = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const uygula = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function yayNoktalari(cx, cy, r, a0, tarama) {
  const adim = Math.max(2, Math.ceil(Math.abs(tarama) / (Math.PI / 20)));
  const n = [];
  for (let i = 0; i <= adim; i++) {
    const a = a0 + (tarama * i) / adim;
    n.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return n;
}

/** Çoklu çizgi köşelerini (bulge = yay kabarıklığı dahil) düz noktalara açar. */
function koseleriAc(koseler, kapali) {
  const n = [];
  const adet = koseler.length;
  for (let i = 0; i < adet; i++) {
    const p = koseler[i];
    n.push([p.x, p.y]);
    const q = koseler[(i + 1) % adet];
    const son = i === adet - 1;
    if (!p.bulge || (son && !kapali)) continue;
    const kiris = Math.hypot(q.x - p.x, q.y - p.y);
    if (kiris < 1e-9) continue;
    const aci = 4 * Math.atan(p.bulge);
    const h = kiris / 2 / Math.tan(aci / 2);
    const cx = (p.x + q.x) / 2 - ((q.y - p.y) / kiris) * h;
    const cy = (p.y + q.y) / 2 + ((q.x - p.x) / kiris) * h;
    const yay = yayNoktalari(cx, cy, Math.hypot(p.x - cx, p.y - cy), Math.atan2(p.y - cy, p.x - cx), aci);
    n.push(...yay.slice(1, -1));
  }
  return n;
}

function varligiAc(v) {
  switch (v.type) {
    case 'LINE':
      return { n: [[v.startPoint.x, v.startPoint.y], [v.endPoint.x, v.endPoint.y]] };
    case 'LWPOLYLINE':
    case 'POLYLINE2D':
    case 'POLYLINE3D': {
      if (!v.vertices || v.vertices.length < 2) return null;
      const kapali = (v.flag & 1) === 1;
      return { n: koseleriAc(v.vertices, kapali), kapali, alan: kapali && v.vertices.length >= 3 };
    }
    case 'CIRCLE':
      return { n: yayNoktalari(v.center.x, v.center.y, v.radius, 0, Math.PI * 2), kapali: true };
    case 'ARC': {
      let tarama = v.endAngle - v.startAngle;
      if (tarama <= 0) tarama += Math.PI * 2;
      return { n: yayNoktalari(v.center.x, v.center.y, v.radius, v.startAngle, tarama) };
    }
    case 'ELLIPSE': {
      const mx = v.majorAxisEndPoint.x, my = v.majorAxisEndPoint.y;
      let tarama = v.endAngle - v.startAngle;
      if (tarama <= 0) tarama += Math.PI * 2;
      const adim = Math.max(8, Math.ceil(tarama / (Math.PI / 24)));
      const n = [];
      for (let i = 0; i <= adim; i++) {
        const t = v.startAngle + (tarama * i) / adim;
        n.push([
          v.center.x + mx * Math.cos(t) - my * v.axisRatio * Math.sin(t),
          v.center.y + my * Math.cos(t) + mx * v.axisRatio * Math.sin(t),
        ]);
      }
      return { n };
    }
    case 'SPLINE': {
      // Yaklaşık: eğri, geçiş (veya denetim) noktalarını birleştiren çizgiyle gösterilir.
      const kaynak = v.fitPoints && v.fitPoints.length >= 2 ? v.fitPoints : v.controlPoints;
      return kaynak && kaynak.length >= 2 ? { n: kaynak.map((p) => [p.x, p.y]) } : null;
    }
    case 'SOLID':
    case '3DFACE':
    case 'TRACE': {
      const k = [v.corner1, v.corner2, v.corner4 || v.corner3, v.corner3].filter(Boolean);
      return k.length >= 3 ? { n: k.map((p) => [p.x, p.y]), kapali: true } : null;
    }
    default:
      return null;
  }
}

function duzlestir(db) {
  const bloklar = new Map();
  for (const b of db.tables?.BLOCK_RECORD?.entries || []) bloklar.set(b.name, b);
  const model = [...bloklar.values()].find((b) => /^\*model_space$/i.test(b.name));
  const kok = model?.entities?.length ? model.entities : db.entities || [];

  const yollar = [];
  let noktaSayisi = 0;
  let atlanan = 0;

  const gez = (varliklar, m, derinlik) => {
    for (const v of varliklar) {
      if (noktaSayisi > EN_COK_NOKTA) return;
      if (v.isVisible === false) continue;
      if (v.type === 'INSERT') {
        const blok = bloklar.get(v.name);
        if (!blok?.entities?.length || derinlik >= BLOK_DERINLIGI) continue;
        const c = Math.cos(v.rotation || 0), s = Math.sin(v.rotation || 0);
        const xs = v.xScale || 1, ys = v.yScale || 1;
        const taban = blok.basePoint || { x: 0, y: 0 };
        const yerel = carp(
          [c * xs, s * xs, -s * ys, c * ys, v.insertionPoint.x, v.insertionPoint.y],
          [1, 0, 0, 1, -taban.x, -taban.y],
        );
        gez(blok.entities, carp(m, yerel), derinlik + 1);
        continue;
      }
      const yol = varligiAc(v);
      if (!yol) { atlanan++; continue; }
      const n = [];
      for (const [x, y] of yol.n) {
        const [tx, ty] = uygula(m, x, y);
        if (Number.isFinite(tx) && Number.isFinite(ty)) n.push(tx, ty);
      }
      if (n.length < 4) continue;
      noktaSayisi += n.length / 2;
      yollar.push({ n, k: !!yol.kapali, a: !!yol.alan });
    }
  };
  gez(kok, BIRIM, 0);
  return { yollar, atlanan, kesildi: noktaSayisi > EN_COK_NOKTA };
}

/**
 * @returns {{ ad: string, birim: number, yollar: { n: number[], k: boolean, a: boolean }[],
 *   sinir: { minX: number, minY: number, maxX: number, maxY: number }, atlanan: number, kesildi: boolean }}
 */
export function cizimiSadelestir(db, ad) {
  const { yollar, atlanan, kesildi } = duzlestir(db);
  if (!yollar.length) throw new Error('Çizimde kullanılabilir çizgi bulunamadı.');
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const y of yollar) {
    for (let i = 0; i < y.n.length; i += 2) {
      if (y.n[i] < minX) minX = y.n[i];
      if (y.n[i] > maxX) maxX = y.n[i];
      if (y.n[i + 1] < minY) minY = y.n[i + 1];
      if (y.n[i + 1] > maxY) maxY = y.n[i + 1];
    }
  }
  return { ad, birim: Number(db.header?.INSUNITS) || 0, yollar, sinir: { minX, minY, maxX, maxY }, atlanan, kesildi };
}

/** Dosya içeriğini (ArrayBuffer) verilen LibreDWG örneğiyle çözer. */
export function cizimiCoz(lib, turler, veri, ad) {
  const isaretci = lib.dwg_read_data(veri, /\.dxf$/i.test(ad) ? turler.DXF : turler.DWG);
  if (!isaretci) throw new Error('Dosya çözülemedi. Dosya bozuk veya desteklenmeyen bir sürümde olabilir.');
  let db;
  try {
    db = lib.convert(isaretci);
  } finally {
    try { lib.dwg_free(isaretci); } catch { /* bellek zaten bırakılmış */ }
  }
  return cizimiSadelestir(db, ad);
}