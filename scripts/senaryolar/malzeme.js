const K = 'section[data-arac="malzeme"]';
const sayi = `$t.metin('${K} [data-p="sayi"]')`;
const dosya = `
  const t = document.createElement('canvas'); t.width = 200; t.height = 200; const c = t.getContext('2d');
  c.fillStyle = '#8fa39a'; c.fillRect(0, 0, 200, 200); c.fillStyle = '#6f867c'; for (let i = 0; i < 200; i += 20) c.fillRect(i, 0, 8, 200);
  const blob = await new Promise(r => t.toBlob(r, 'image/png'));
  const dt = new DataTransfer(); dt.items.add(new File([blob], 'kumas.png', { type: 'image/png' }));`;

module.exports = [
  { ad: 'tümü', js: `$t.tikla('.sekme[data-arac="malzeme"]'); await $t.bekle(200); return ${sayi};`, cek: 'malzeme-1' },
  { ad: 'ara: "banyo"', js: `$t.yaz('${K} [data-p="ara"]', 'banyo'); return ${sayi} + ' → ' + $t.qa('${K} .mlz-kart h3').map(h => h.textContent).join(', ');` },
  { ad: 'kategori Ahşap + nem ≥ 3', js: `$t.yaz('${K} [data-p="ara"]', ''); $t.tikla('${K} [data-kategori="Ahşap"]'); $t.yaz('${K} [data-p="nem"]', '3'); return ${sayi} + ' → ' + $t.qa('${K} .mlz-kart h3').map(h => h.textContent).join(', ');` },
  { ad: 'maliyet ≤ ₺₺', js: `$t.tikla('${K} [data-kategori="Tümü"]'); $t.yaz('${K} [data-p="nem"]', '0'); $t.yaz('${K} [data-p="maliyet"]', '2'); const s = ${sayi}; $t.yaz('${K} [data-p="maliyet"]', '0'); return s;` },
  { ad: 'ayrıntı', js: `$t.tikla('${K} [data-id="mermer"] h3'); await $t.bekle(200);`, cek: 'malzeme-2-ayrinti' },
  { ad: '4 seçim denemesi → en çok 3', js: `$t.tikla('.pencere-kapat');
      for (const id of ['mese', 'mermer', 'porselen', 'granit']) $t.tikla('${K} [data-karsilastir="' + id + '"]');
      await $t.bekle(100); return { cubuk: $t.metin('${K} .mlz-cubuk-yazi'), uyari: $t.metin('.bildirim.hata') };` },
  { ad: 'karşılaştır', js: `$t.tikla('${K} [data-is="karsilastir"]'); await $t.bekle(200); return $t.qa('.mlz-karsilastirma tbody tr').map(r => r.cells[0].textContent + ': ' + r.cells.length);`, cek: 'malzeme-3-karsilastir' },
  { ad: 'kendi malzemeni ekle', js: `$t.tikla('.pencere-kapat'); $t.tikla('${K} [data-is="ekle"]'); await $t.bekle(200);
      ${dosya}
      $t.q('[data-f="foto"]').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
      $t.yaz('[data-f="ad"]', 'Adaçayı yeşili buklet kumaş'); $t.yaz('[data-f="kategori"]', 'Tekstil'); $t.yaz('[data-f="nem"]', '2');
      $t.yaz('[data-f="kullanim"]', 'Tekli koltuk döşemesi'); $t.yaz('[data-f="not"]', 'Tedarikçi numunesi, kod BK-204.');` , cek: 'malzeme-4-form' },
  { ad: 'kaydet → Eklediklerim', js: `$t.tikla('.pencere-alt .birincil'); await $t.bekle(500); $t.tikla('${K} [data-kategori="Eklediklerim"]'); await $t.bekle(300);
      return { sayi: ${sayi}, ad: $t.metin('${K} .mlz-kart h3'), foto: !!$t.q('${K} .mlz-kart img')?.src.startsWith('blob:') };`, cek: 'malzeme-5-benim' },
];
