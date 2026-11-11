// DWG/DXF içe aktarma (ATOLYE_CAD ile verilen çizim) ve dosyaya kaydet / dosyadan aç denemesi.
const P = 'section[data-arac="planlayici"]';
const O = 'section[data-arac="olcek"]';
const M = 'section[data-arac="moodboard"]';
const planDurumu = `({ ad: $t.q('${P} [data-p="ad"]').value, en: $t.q('${P} [data-p="en"]').value, boy: $t.q('${P} [data-p="boy"]').value,
  altlik: $t.metin('${P} [data-p="altlik"]'), altlikCizgi: ($t.q('${P} svg [data-kat="zemin"] path[vector-effect]')?.getAttribute('d') || '').length,
  mobilya: $t.qa('${P} svg [data-id]').length, kapiKapali: $t.q('${P} [data-is="kapi"]').disabled, uyarilar: $t.qa('${P} .uyari').map(u => u.textContent.trim()) })`;

module.exports = [
  { ad: 'plan: çizimi içe aktar', js: `$t.tikla('.sekme[data-arac="planlayici"]'); await $t.bekle(300); $t.tikla('${P} [data-is="cad"]'); await $t.bekle(2500);
      const pencere = { birim: $t.q('.pencere select')?.value, boyut: $t.metin('.pencere [data-c="boyut"]'), bilgi: $t.metin('.pencere .kart-alt') };
      return pencere;`, cek: 'cad-1-birim' },
  { ad: 'plan: altlık yüklendi', js: `$t.tikla('.pencere-alt .birincil'); await $t.bekle(500); return ${planDurumu};`, cek: 'cad-2-altlik' },
  { ad: 'plan: mobilya ekle ve taşı', js: `$t.tikla('[data-ekle="yatak-cift"]'); $t.tikla('[data-ekle="gardirop-2"]');
      $t.yaz('${P} [data-alan="x"]', '20'); $t.yaz('${P} [data-alan="y"]', '330'); return ${planDurumu};`, cek: 'cad-3-mobilya' },
  { ad: 'plan: dosyaya kaydet + PNG', js: `$t.tikla('${P} [data-is="dosya-kaydet"]'); await $t.bekle(600); $t.tikla('${P} [data-is="png"]'); await $t.bekle(1500); return $t.qa('.bildirim').map(b => b.textContent.slice(0, 28));` },
  { ad: 'plan: yeni → dosyadan aç', js: `$t.tikla('${P} [data-is="yeni"]'); await $t.bekle(200); $t.tikla('.pencere-alt .birincil'); await $t.bekle(300); const bos = ${planDurumu};
      $t.tikla('${P} [data-is="dosya-ac"]'); await $t.bekle(900); return { bos: [bos.en, bos.altlik, bos.mobilya], acilan: ${planDurumu} };`, cek: 'cad-4-dosyadan' },
  { ad: 'plan: altlığı kaldır', js: `$t.tikla('${P} [data-is="altlik-kaldir"]'); await $t.bekle(300); const d = ${planDurumu}; return [d.en, d.boy, d.altlik, d.kapiKapali, d.altlikCizgi];` },
  { ad: 'ölçek: çizimden alan', js: `$t.tikla('.sekme[data-arac="olcek"]'); await $t.bekle(300); $t.tikla('${O} [data-a="cad"]'); await $t.bekle(1500); $t.tikla('.pencere-alt .birincil'); await $t.bekle(500);
      const secenekler = $t.qa('.kayit').map(k => k.textContent.replace(/\\s+/g, ' ').trim());`, cek: 'cad-5-alanlar' },
  { ad: 'ölçek: en büyük alanı seç', js: `const secenekler = $t.qa('.kayit').map(k => k.textContent.replace(/\\s+/g, ' ').trim()); $t.tikla('.kayit [data-bicim="0"]'); await $t.bekle(300);
      return { secenekler, alan: $t.metin('${O} [data-c="alan"]'), cevre: $t.metin('${O} [data-c="cevre"]'), kose: $t.qa('${O} [data-kose][data-k="x"]').length };`, cek: 'cad-6-olcek' },
  { ad: 'pano: dosyaya kaydet → yeni → dosyadan aç', js: `$t.tikla('.sekme[data-arac="moodboard"]'); await $t.bekle(300);
      const dt = new DataTransfer();
      for (const renk of ['#7A8B5C', '#1F4E79']) { const t = document.createElement('canvas'); t.width = 300; t.height = 200; const c = t.getContext('2d'); c.fillStyle = renk; c.fillRect(0, 0, 300, 200);
        dt.items.add(new File([await new Promise(r => t.toBlob(r, 'image/png'))], 'g.png', { type: 'image/png' })); }
      $t.q('${M} [data-p="alan"]').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true, clientX: 600, clientY: 400 })); await $t.bekle(700);
      $t.yaz('${M} [data-p="ad"]', 'Dosya denemesi'); $t.tikla('${M} [data-is="dosya-kaydet"]'); await $t.bekle(700);
      $t.tikla('${M} [data-is="yeni"]'); await $t.bekle(200); $t.tikla('.pencere-alt .birincil'); await $t.bekle(300); const bos = $t.metin('${M} [data-p="durum"]');
      $t.tikla('${M} [data-is="dosya-ac"]'); await $t.bekle(1200);
      return { bos, sonra: $t.metin('${M} [data-p="durum"]'), ad: $t.q('${M} [data-p="ad"]').value, yuklu: $t.qa('${M} .pano-oge img').filter(i => i.naturalWidth > 0).length };`, cek: 'cad-7-pano' },
  { ad: 'yanlış türde dosya (pano dosyası planlayıcıda)', js: `$t.tikla('.sekme[data-arac="planlayici"]'); await $t.bekle(200); $t.tikla('${P} [data-is="dosya-ac"]'); await $t.bekle(700); return $t.qa('.bildirim.hata').map(b => b.textContent);` },
];
