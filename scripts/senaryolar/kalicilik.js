// Önceki denemenin verisiyle (--koru) yeniden açılışta kayıtların durduğunu doğrular.
module.exports = [
  { ad: 'plan taslağı ve kayıtlı plan', js: `$t.tikla('.sekme[data-arac="planlayici"]'); await $t.bekle(400);
      const K = 'section[data-arac="planlayici"]'; const ad = $t.q(K + ' [data-p="ad"]').value; const mobilya = $t.qa(K + ' svg [data-id]').length;
      $t.tikla(K + ' [data-is="ac"]'); await $t.bekle(300); const kayitlar = $t.qa('.kayit-ad').map(k => k.textContent); $t.tikla('.pencere-kapat');
      return { ad, mobilya, kayitlar };`, cek: 'kalici-plan' },
  { ad: 'tema ve son araç', js: `return { tema: document.documentElement.dataset.tema, secili: $t.metin('#tema-secici .etkin') };` },
];
