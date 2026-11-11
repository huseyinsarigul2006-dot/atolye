const K = 'section[data-arac="moodboard"]';
const durum = `$t.metin('${K} [data-p="durum"]')`;
// Düz renkli, üzerinde çapraz çizgi olan deneme görselleri üretir ve tuvale bırakır.
const birak = (renkler, xo, yo) => `
  { const dt = new DataTransfer();
    for (const [renk, w, h] of ${JSON.stringify(renkler)}) {
      const t = document.createElement('canvas'); t.width = w; t.height = h; const c = t.getContext('2d');
      c.fillStyle = renk; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28);
      c.beginPath(); c.moveTo(14, 14); c.lineTo(w - 14, h - 14); c.stroke();
      const blob = await new Promise(r => t.toBlob(r, 'image/png'));
      dt.items.add(new File([blob], 'gorsel.png', { type: 'image/png' }));
    }
    const b = $t.q('${K} [data-p="sayfa"]').getBoundingClientRect();
    $t.q('${K} [data-p="alan"]').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true, clientX: b.left + b.width * ${xo}, clientY: b.top + b.height * ${yo} }));
    await $t.bekle(700); }`;
const surukle = (secici, dx, dy, ek = '{}') => `
  { const sayfa = $t.q('${K} [data-p="sayfa"]'); const e = ${secici}; const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
    $t.fare(e, 'pointerdown', x, y); for (let i = 1; i <= 4; i++) $t.fare(sayfa, 'pointermove', x + ${dx} * i / 4, y + ${dy} * i / 4, ${ek});
    $t.fare(sayfa, 'pointerup', x + ${dx}, y + ${dy}); await $t.bekle(60); }`;
const oge = (i) => `$t.qa('${K} .pano-oge')[${i}]`;

module.exports = [
  { js: `$t.tikla('.sekme[data-arac="moodboard"]'); await $t.bekle(300);`, cek: 'pano-1-bos' },
  { ad: '3 görsel bırak', js: `${birak([['#7A8B5C', 600, 400]], 0.25, 0.3)} ${birak([['#B5532F', 400, 500], ['#1F4E79', 500, 500]], 0.6, 0.5)} return ${durum};` },
  { ad: 'taşı', js: `${surukle(oge(0), 60, 150)} return ${durum};` },
  { ad: 'boyutlandır (köşe)', js: `${surukle(`$t.qa('${K} .pano-secim .kose')[3]`, 50, 34)} return ${durum};` },
  { ad: 'döndür (Shift ile 15° adım)', js: `${surukle(`$t.q('${K} .pano-secim .don')`, 90, 60, '{ shiftKey: true }')} return ${durum};` },
  { ad: 'en öne getir', js: `$t.tikla('${K} [data-is="one"]'); return $t.qa('${K} .pano-oge').map(d => d.style.zIndex).join(',');`, cek: 'pano-2-duzen' },
  { ad: 'A2 dikey', js: `$t.yaz('${K} [data-p="boyut"]', 'A2'); $t.tikla('${K} [data-yon="dikey"]'); return ${durum};`, cek: 'pano-3-dikey' },
  { ad: 'çoğalt + sil', js: `$t.tikla('${K} [data-is="cogalt"]'); const a = ${durum}; $t.q('${K} [data-p="alan"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })); return [a, ${durum}];` },
  { ad: 'kaydet + PNG', js: `$t.tikla('${K} [data-yon="yatay"]'); $t.yaz('${K} [data-p="ad"]', 'Salon konsepti'); $t.tikla('${K} [data-is="kaydet"]'); await $t.bekle(400); $t.tikla('${K} [data-is="png"]'); await $t.bekle(1500); return $t.qa('.bildirim').map(b => b.textContent.slice(0, 40));` },
  { ad: 'yeni → aç', js: `$t.tikla('${K} [data-is="yeni"]'); await $t.bekle(200); $t.tikla('.pencere-alt .birincil'); await $t.bekle(200); const bos = ${durum};
      $t.tikla('${K} [data-is="ac"]'); await $t.bekle(300); const ayr = $t.metin('.kayit-ayrinti'); $t.tikla('.kayit [data-is="ac"]'); await $t.bekle(600);
      return { bos, ayr, sonra: ${durum}, yuklu: $t.qa('${K} .pano-oge img').filter(i => i.naturalWidth > 0).length };`, cek: 'pano-4-acildi' },
  { ad: 'etiket/başlık aracı yok', js: `return $t.qa('${K} button, ${K} select').map(e => e.textContent.trim().slice(0, 14)).filter(t => /başlık|etiket|bölüm|kategori|metin/i.test(t));` },
];
