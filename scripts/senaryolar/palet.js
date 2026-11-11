const K = 'section[data-arac="palet"]';
// Bilinen renklerden oluşan bir deneme görseli üretip araca "bırakır".
const birak = `
  const t = document.createElement('canvas'); t.width = 400; t.height = 300; const c = t.getContext('2d');
  const renkler = [['#1F4E79', 0, 0, 400, 150], ['#D9A441', 0, 150, 200, 150], ['#F2EFE9', 200, 150, 120, 150], ['#7A8B5C', 320, 150, 80, 100], ['#B5532F', 320, 250, 80, 50]];
  for (const [r, x, y, w, h] of renkler) { c.fillStyle = r; c.fillRect(x, y, w, h); }
  const blob = await new Promise(r => t.toBlob(r, 'image/png'));
  const dt = new DataTransfer(); dt.items.add(new File([blob], 'deneme-oda.png', { type: 'image/png' }));
  $t.q('${K}').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  await $t.bekle(500);`;

module.exports = [
  { js: `$t.tikla('.sekme[data-arac="palet"]'); await $t.bekle(200);`, cek: 'palet-1-bos' },
  { ad: 'görsel bırak → renkler', js: `${birak} return $t.qa('${K} .renk-satir').map(s => s.textContent.replace(/\\s+/g, ' ').trim());`, cek: 'palet-2' },
  { ad: '8 renk', js: `$t.yaz('${K} [data-p="adet"]', '8'); return $t.qa('${K} .renk-satir').length;` },
  { ad: '5 renk, 2. rengi seç → uyumlar', js: `$t.yaz('${K} [data-p="adet"]', '5'); $t.tikla($t.qa('${K} .renk-satir')[1].querySelector('.renk-kutu')); return $t.qa('${K} .uyum').map(u => u.querySelector('b').textContent + ': ' + [...u.querySelectorAll('button')].map(b => b.textContent).join(' '));` },
  { ad: 'kopyala', js: `$t.tikla($t.q('${K} .renk-deger')); await $t.bekle(100); return $t.metin('.bildirim');` },
  { ad: 'kaydet', js: `$t.tikla('${K} [data-is="kaydet"]'); await $t.bekle(200); $t.yaz('.pencere input', 'Deneme paleti'); $t.tikla('.pencere-alt .birincil'); await $t.bekle(500); return $t.qa('${K} .kayitli-palet b').map(b => b.textContent);`, cek: 'palet-3-kayitli' },
];
