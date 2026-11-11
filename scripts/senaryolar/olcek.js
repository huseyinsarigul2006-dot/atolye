const sonuclar = `({ alan: $t.metin('[data-c="alan"]'), cevre: $t.metin('[data-c="cevre"]'), zemin: $t.metin('[data-c="zemin"]') + ' / ' + $t.metin('[data-c="zemin-not"]'), boya: $t.metin('[data-c="boya"]') + ' / ' + $t.metin('[data-c="boya-not"]'), sup: $t.metin('[data-c="sup"]') + ' / ' + $t.metin('[data-c="sup-not"]') })`;

module.exports = [
  { ad: 'ölçek 3,5 m @1:50', js: `$t.tikla('.sekme[data-arac="olcek"]'); await $t.bekle(200); return { cizim: $t.q('[data-a="cizim"]').value, ipucu: $t.metin('[data-c="ipucu"]') };` },
  { ad: 'dikdörtgen 4×3,5', js: `return ${sonuclar};`, cek: 'olcek-1' },
  { ad: 'ters dönüşüm 12 cm @1:100', js: `$t.yaz('[data-a="olcekSecim"]', '100'); $t.yaz('[data-a="cizim"]', '12'); return $t.q('[data-a="gercek"]').value;` },
  { ad: 'özel ölçek 1:25, 2 m → mm', js: `$t.yaz('[data-a="olcekSecim"]', 'ozel'); $t.yaz('[data-a="ozelOlcek"]', '25'); $t.yaz('[data-a="gercek"]', '2'); $t.yaz('[data-a="cizimBirim"]', 'mm'); return $t.q('[data-a="cizim"]').value;` },
  { ad: 'L biçimli 6×5 − 2,5×2', js: `$t.tikla('[data-sekil="l"]'); return ${sonuclar};`, cek: 'olcek-2' },
  { ad: 'çok köşeli', js: `$t.tikla('[data-sekil="cok"]'); $t.yaz('[data-m="tavan"]', true); return ${sonuclar};` },
  { ad: 'koyu tema', js: `$t.tikla('[data-tema="koyu"]');`, cek: 'olcek-3' },
  { js: `$t.tikla('[data-tema="acik"]'); $t.tikla('[data-sekil="dikdortgen"]'); $t.yaz('[data-m="tavan"]', false); $t.yaz('[data-a="olcekSecim"]', '50'); $t.yaz('[data-a="gercek"]', '3.5'); $t.yaz('[data-a="cizimBirim"]', 'cm'); await $t.bekle(900);` },
];
