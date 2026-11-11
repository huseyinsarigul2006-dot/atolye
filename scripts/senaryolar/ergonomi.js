const K = 'section[data-arac="ergonomi"]';
const kartlar = `$t.qa('${K} .ergo-kart').length`;
const kaydir = (y) => `$t.q('${K} .arac-govde').scrollTop = ${y};`;

module.exports = [
  { ad: 'tümü', js: `$t.tikla('.sekme[data-arac="ergonomi"]'); await $t.bekle(200); return { kart: ${kartlar}, sema: $t.qa('${K} .ergo-kart svg').length };`, cek: 'ergo-1' },
  { js: kaydir(620), cek: 'ergo-2' },
  { ad: 'Mutfak', js: `${kaydir(0)} $t.tikla('${K} [data-kategori="Mutfak"]'); return ${kartlar};`, cek: 'ergo-3-mutfak' },
  { ad: 'Dolaşım', js: `$t.tikla('${K} [data-kategori="Dolaşım"]'); return ${kartlar};`, cek: 'ergo-4-dolasim' },
  { js: kaydir(500), cek: 'ergo-5-dolasim' },
  { ad: 'ara: "tezgâh"', js: `${kaydir(0)} $t.tikla('${K} [data-kategori="Tümü"]'); $t.yaz('${K} [data-p="ara"]', 'tezgâh'); return $t.qa('${K} .ergo-kart h3').map(h => h.textContent);` },
  { ad: 'boy 160', js: `$t.yaz('${K} [data-p="ara"]', ''); $t.yaz('${K} [data-p="boy"]', '160'); return $t.qa('${K} .ergo-kisisel .sonuc').map(s => s.querySelector('.ad').textContent + ': ' + s.querySelector('.deger').textContent);` },
  { ad: 'boy 185', js: `$t.yaz('${K} [data-p="boy"]', '185'); return $t.qa('${K} .ergo-kisisel .sonuc').map(s => s.querySelector('.ad').textContent + ': ' + s.querySelector('.deger').textContent);`, cek: 'ergo-6-boy' },
  { js: `$t.tikla('[data-tema="koyu"]'); $t.tikla('${K} [data-kategori="Banyo"]'); ${kaydir(380)}`, cek: 'ergo-7-koyu' },
];
