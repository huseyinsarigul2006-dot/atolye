const K = 'section[data-arac="planlayici"]';
const durum = `({ mobilya: $t.qa('${K} svg [data-id]').length, uyarilar: $t.qa('${K} .uyari').map(u => u.textContent.trim()) })`;
// Bir mobilyayı (sıra numarasıyla) ekrandaki dx,dy piksel kadar sürükler.
const surukle = (sira, dx, dy) => `
  { const svg = $t.q('${K} svg'); const g = $t.qa('${K} svg [data-id]')[${sira}]; const r = g.querySelector('rect[fill="transparent"]');
    const b = r.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
    $t.fare(r, 'pointerdown', x, y);
    for (let i = 1; i <= 5; i++) $t.fare(svg, 'pointermove', x + ${dx} * i / 5, y + ${dy} * i / 5);
    $t.fare(svg, 'pointerup', x + ${dx}, y + ${dy}); await $t.bekle(50); }`;

module.exports = [
  { js: `$t.tikla('.sekme[data-arac="planlayici"]'); await $t.bekle(300);`, cek: 'plan-1-bos' },
  { ad: 'oda 450×380', js: `$t.yaz('${K} [data-p="en"]', '450'); $t.yaz('${K} [data-p="boy"]', '380'); return $t.q('${K} svg').getAttribute('width');` },
  { ad: 'yatak + gardırop + komodin ekle', js: `$t.tikla('[data-ekle="yatak-cift"]'); $t.tikla('[data-ekle="gardirop-3"]'); $t.tikla('[data-ekle="komodin"]'); return ${durum};` },
  { ad: 'yatağı sol üste sürükle', js: `${surukle(0, -400, -400)} return ${durum};` },
  { ad: 'gardırobu sağ alta sürükle', js: `${surukle(1, 400, 400)} return ${durum};`, cek: 'plan-2-uyari' },
  { ad: 'komodini döndür (R) ve yatağın yanına al', js: `
      $t.q('${K} [data-p="tuval"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
      const once = [...$t.qa('${K} [data-alan]')].map(i => i.dataset.alan + '=' + i.value).join(' ');
      $t.yaz('${K} [data-alan="x"]', '160'); $t.yaz('${K} [data-alan="y"]', '0');
      return { once, sonra: ${durum} };` },
  { ad: 'bırakarak kanepe ekle', js: `
      const tuval = $t.q('${K} [data-p="tuval"]'); const b = $t.q('${K} svg').getBoundingClientRect();
      const dt = new DataTransfer(); dt.setData('application/x-atolye-mobilya', 'kanepe-2');
      tuval.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: b.left + b.width * 0.72, clientY: b.top + b.height * 0.3, bubbles: true, cancelable: true }));
      return ${durum};` },
  { ad: 'pencere ekle, sağ duvara al; kapıyı çevir', js: `
      $t.tikla('${K} [data-is="pencere"]'); $t.yaz('${K} [data-alan="duvar"]', 'sag'); $t.yaz('${K} [data-alan="konum"]', '60');
      return $t.qa('${K} svg [data-acik]').length;`, cek: 'plan-3-dolu' },
  { ad: 'boyut değiştir (kanepe 200×95)', js: `
      const g = $t.qa('${K} svg [data-id]').pop().querySelector('rect[fill="transparent"]'); const b = g.getBoundingClientRect();
      $t.fare(g, 'pointerdown', b.left + 5, b.top + 5); $t.fare($t.q('${K} svg'), 'pointerup', b.left + 5, b.top + 5);
      $t.yaz('${K} [data-alan="en"]', '200'); $t.yaz('${K} [data-alan="boy"]', '95');
      return [...$t.qa('${K} [data-alan]')].map(i => i.dataset.alan + '=' + i.value).join(' ');` },
  { ad: 'kaydet', js: `$t.yaz('${K} [data-p="ad"]', 'Yatak odası denemesi'); $t.tikla('${K} [data-is="kaydet"]'); await $t.bekle(400); return $t.metin('.bildirim');` },
  { ad: 'PNG dışa aktar', js: `$t.tikla('${K} [data-is="png"]'); await $t.bekle(1200); return $t.qa('.bildirim').map(b => b.textContent);` },
  { ad: 'yeni plan', js: `$t.tikla('${K} [data-is="yeni"]'); await $t.bekle(200); $t.tikla('.pencere-alt .birincil'); await $t.bekle(200); return ${durum};` },
  { ad: 'kayıtlı planı aç', js: `$t.tikla('${K} [data-is="ac"]'); await $t.bekle(300); const ayr = $t.metin('.kayit-ayrinti'); $t.tikla('.kayit [data-is="ac"]'); await $t.bekle(300); return { ayr, ad: $t.q('${K} [data-p="ad"]').value, ...${durum} };` },
  { ad: 'sil (Delete)', js: `
      const g = $t.qa('${K} svg [data-id]')[0].querySelector('rect[fill="transparent"]'); const b = g.getBoundingClientRect();
      $t.fare(g, 'pointerdown', b.left + 5, b.top + 5); $t.fare($t.q('${K} svg'), 'pointerup', b.left + 5, b.top + 5);
      $t.q('${K} [data-p="tuval"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      return ${durum}.mobilya;` },
  { js: `$t.tikla('[data-tema="koyu"]');`, cek: 'plan-4-koyu' },
];
