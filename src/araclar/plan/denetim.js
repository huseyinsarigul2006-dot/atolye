// Plan denetimi: mobilya çakışmaları ve 60 cm'nin altındaki dolaşım mesafeleri.
import { MOBILYA_SOZLUGU } from '../../veri/mobilyalar.js';

export const DOLASIM_SINIRI = 60; // cm
const BITISIK = 5; // cm — bundan yakın duranlar bilerek yan yana konmuş sayılır
const PAY = 0.5;

const DUVAR_ADLARI = { ust: 'üst duvar', sag: 'sağ duvar', alt: 'alt duvar', sol: 'sol duvar' };

/** Duvarın oda içi koordinatlarındaki başlangıcı, yönü ve içe bakan normali. */
export function duvarGeometrisi(oda, duvar) {
  switch (duvar) {
    case 'ust': return { x0: 0, y0: 0, dx: 1, dy: 0, nx: 0, ny: 1, uzunluk: oda.en };
    case 'alt': return { x0: 0, y0: oda.boy, dx: 1, dy: 0, nx: 0, ny: -1, uzunluk: oda.en };
    case 'sol': return { x0: 0, y0: 0, dx: 0, dy: 1, nx: 1, ny: 0, uzunluk: oda.boy };
    default: return { x0: oda.en, y0: 0, dx: 0, dy: 1, nx: -1, ny: 0, uzunluk: oda.boy };
  }
}

/** Kapının oda içinde süpürdüğü kare alan. */
export function kapiAlani(oda, kapi) {
  const g = duvarGeometrisi(oda, kapi.duvar);
  const bx = g.x0 + g.dx * kapi.konum, by = g.y0 + g.dy * kapi.konum;
  const ux = bx + g.dx * kapi.genislik + g.nx * kapi.genislik;
  const uy = by + g.dy * kapi.genislik + g.ny * kapi.genislik;
  return { x: Math.min(bx, ux), y: Math.min(by, uy), en: Math.abs(ux - bx), boy: Math.abs(uy - by) };
}

const ortusme = (a, b) => ({
  x: Math.min(a.x + a.en, b.x + b.en) - Math.max(a.x, b.x),
  y: Math.min(a.y + a.boy, b.y + b.boy) - Math.max(a.y, b.y),
});

export function denetle(plan) {
  const uyarilar = [];
  const cakisan = new Set();
  const dar = new Set();
  const esyalar = plan.mobilyalar.filter((m) => !MOBILYA_SOZLUGU[m.tur]?.zemin);
  const cm = (n) => Math.round(n);

  for (let i = 0; i < esyalar.length; i++) {
    const a = esyalar[i];
    for (let j = i + 1; j < esyalar.length; j++) {
      const b = esyalar[j];
      const o = ortusme(a, b);
      if (o.x > PAY && o.y > PAY) {
        cakisan.add(a.id); cakisan.add(b.id);
        uyarilar.push({ tur: 'cakisma', kimlikler: [a.id, b.id], mesaj: `${a.ad} ile ${b.ad} çakışıyor.` });
        continue;
      }
      // Karşı karşıya duran (bir eksende örtüşen) eşyalar arasındaki boşluk.
      const bosluk = o.y > PAY ? -o.x : o.x > PAY ? -o.y : null;
      if (bosluk !== null && bosluk >= BITISIK && bosluk < DOLASIM_SINIRI - PAY) {
        dar.add(a.id); dar.add(b.id);
        uyarilar.push({ tur: 'dar', kimlikler: [a.id, b.id], mesaj: `${a.ad} ile ${b.ad} arası ${cm(bosluk)} cm — dolaşım için en az ${DOLASIM_SINIRI} cm bırakın.` });
      }
    }

    // İçe aktarılan çizimde gerçek duvarların yeri bilinmediği için duvar ve kapı denetimi yapılmaz.
    if (plan.altlik) continue;
    const duvarBosluklari = { sol: a.x, sag: plan.oda.en - (a.x + a.en), ust: a.y, alt: plan.oda.boy - (a.y + a.boy) };
    for (const [duvar, bosluk] of Object.entries(duvarBosluklari)) {
      if (bosluk >= BITISIK && bosluk < DOLASIM_SINIRI - PAY) {
        dar.add(a.id);
        uyarilar.push({ tur: 'dar', kimlikler: [a.id], mesaj: `${a.ad} ile ${DUVAR_ADLARI[duvar]} arası ${cm(bosluk)} cm — geçiş için dar.` });
      }
    }

    for (const acik of plan.acikliklar) {
      if (acik.tur !== 'kapi') continue;
      const o = ortusme(a, kapiAlani(plan.oda, acik));
      if (o.x > PAY && o.y > PAY) {
        cakisan.add(a.id);
        uyarilar.push({ tur: 'cakisma', kimlikler: [a.id], mesaj: `${a.ad}, ${DUVAR_ADLARI[acik.duvar].replace(' duvar', ' duvardaki')} kapının açılma alanını kapatıyor.` });
      }
    }
  }
  // Önce çakışmalar.
  uyarilar.sort((x, y) => (x.tur === y.tur ? 0 : x.tur === 'cakisma' ? -1 : 1));
  return { uyarilar, cakisan, dar };
}
