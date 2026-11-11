// Hazır mobilya listesi. Ölçüler santimetre (en × derinlik), yaygın piyasa ölçüleridir.
// sembol: plan üzerindeki çizim biçimi · yuvarlak: gövde elips çizilir · zemin: çakışma denetimine girmez (halı).
export const MOBILYA_GRUPLARI = [
  {
    ad: 'Yatak odası',
    ogeler: [
      { tur: 'yatak-tek', ad: 'Tek kişilik yatak', kisa: 'Yatak', en: 90, boy: 190, sembol: 'yatak' },
      { tur: 'yatak-cift', ad: 'Çift kişilik yatak', kisa: 'Yatak', en: 160, boy: 200, sembol: 'yatak' },
      { tur: 'yatak-king', ad: 'King yatak', kisa: 'Yatak', en: 180, boy: 200, sembol: 'yatak' },
      { tur: 'komodin', ad: 'Komodin', kisa: 'Komodin', en: 45, boy: 40, sembol: 'duz' },
      { tur: 'gardirop-2', ad: 'Gardırop (2 kapaklı)', kisa: 'Gardırop', en: 100, boy: 60, sembol: 'dolap' },
      { tur: 'gardirop-3', ad: 'Gardırop (3 kapaklı)', kisa: 'Gardırop', en: 150, boy: 60, sembol: 'dolap' },
      { tur: 'sifonyer', ad: 'Şifonyer', kisa: 'Şifonyer', en: 100, boy: 50, sembol: 'cekmece' },
      { tur: 'besik', ad: 'Bebek karyolası', kisa: 'Karyola', en: 70, boy: 130, sembol: 'yatak' },
    ],
  },
  {
    ad: 'Oturma',
    ogeler: [
      { tur: 'koltuk-tek', ad: 'Tekli koltuk', kisa: 'Koltuk', en: 85, boy: 85, sembol: 'koltuk' },
      { tur: 'kanepe-2', ad: 'İkili kanepe', kisa: 'Kanepe', en: 160, boy: 90, sembol: 'koltuk' },
      { tur: 'kanepe-3', ad: 'Üçlü kanepe', kisa: 'Kanepe', en: 220, boy: 95, sembol: 'koltuk' },
      { tur: 'kose-koltuk', ad: 'Köşe koltuk', kisa: 'Köşe koltuk', en: 270, boy: 180, sembol: 'kose' },
      { tur: 'puf', ad: 'Puf', kisa: 'Puf', en: 50, boy: 50, sembol: 'duz', yuvarlak: true },
      { tur: 'orta-sehpa', ad: 'Orta sehpa', kisa: 'Sehpa', en: 110, boy: 60, sembol: 'duz' },
      { tur: 'yan-sehpa', ad: 'Yan sehpa', kisa: 'Sehpa', en: 50, boy: 50, sembol: 'duz' },
      { tur: 'tv-unitesi', ad: 'TV ünitesi', kisa: 'TV ünitesi', en: 180, boy: 45, sembol: 'tv' },
    ],
  },
  {
    ad: 'Yemek',
    ogeler: [
      { tur: 'masa-4', ad: 'Yemek masası (4 kişilik)', kisa: 'Masa', en: 120, boy: 80, sembol: 'duz' },
      { tur: 'masa-6', ad: 'Yemek masası (6 kişilik)', kisa: 'Masa', en: 180, boy: 90, sembol: 'duz' },
      { tur: 'masa-yuvarlak', ad: 'Yuvarlak masa', kisa: 'Masa', en: 110, boy: 110, sembol: 'duz', yuvarlak: true },
      { tur: 'sandalye', ad: 'Sandalye', kisa: 'Sand.', en: 45, boy: 50, sembol: 'sandalye' },
      { tur: 'bufe', ad: 'Konsol / büfe', kisa: 'Konsol', en: 160, boy: 45, sembol: 'cekmece' },
    ],
  },
  {
    ad: 'Çalışma',
    ogeler: [
      { tur: 'calisma-masasi', ad: 'Çalışma masası', kisa: 'Çalışma m.', en: 140, boy: 70, sembol: 'duz' },
      { tur: 'cizim-masasi', ad: 'Çizim masası', kisa: 'Çizim m.', en: 150, boy: 80, sembol: 'duz' },
      { tur: 'ofis-koltugu', ad: 'Ofis koltuğu', kisa: 'Koltuk', en: 60, boy: 60, sembol: 'sandalye' },
      { tur: 'kitaplik', ad: 'Kitaplık', kisa: 'Kitaplık', en: 80, boy: 30, sembol: 'kitaplik' },
      { tur: 'kitaplik-genis', ad: 'Geniş kitaplık', kisa: 'Kitaplık', en: 120, boy: 35, sembol: 'kitaplik' },
    ],
  },
  {
    ad: 'Mutfak',
    ogeler: [
      { tur: 'tezgah', ad: 'Tezgâh modülü', kisa: 'Tezgâh', en: 60, boy: 60, sembol: 'duz' },
      { tur: 'evye', ad: 'Evye', kisa: 'Evye', en: 80, boy: 60, sembol: 'evye' },
      { tur: 'ocak', ad: 'Ocak / fırın', kisa: 'Ocak', en: 60, boy: 60, sembol: 'ocak' },
      { tur: 'buzdolabi', ad: 'Buzdolabı', kisa: 'Buzd.', en: 70, boy: 70, sembol: 'buzdolabi' },
      { tur: 'bulasik', ad: 'Bulaşık makinesi', kisa: 'Bulaşık m.', en: 60, boy: 60, sembol: 'makine' },
      { tur: 'ada', ad: 'Mutfak adası', kisa: 'Ada', en: 180, boy: 90, sembol: 'duz' },
    ],
  },
  {
    ad: 'Banyo',
    ogeler: [
      { tur: 'lavabo', ad: 'Lavabo', kisa: 'Lavabo', en: 60, boy: 45, sembol: 'lavabo' },
      { tur: 'klozet', ad: 'Klozet', kisa: 'Klozet', en: 40, boy: 65, sembol: 'klozet' },
      { tur: 'dus', ad: 'Duş teknesi', kisa: 'Duş', en: 90, boy: 90, sembol: 'dus' },
      { tur: 'kuvet', ad: 'Küvet', kisa: 'Küvet', en: 170, boy: 75, sembol: 'kuvet' },
      { tur: 'camasir', ad: 'Çamaşır makinesi', kisa: 'Çamaşır m.', en: 60, boy: 60, sembol: 'makine' },
    ],
  },
  {
    ad: 'Diğer',
    ogeler: [
      { tur: 'hali', ad: 'Halı', kisa: 'Halı', en: 200, boy: 140, sembol: 'hali', zemin: true },
      { tur: 'bitki', ad: 'Saksı bitkisi', kisa: 'Bitki', en: 40, boy: 40, sembol: 'bitki', yuvarlak: true },
      { tur: 'lambader', ad: 'Lambader', kisa: 'Lamba', en: 35, boy: 35, sembol: 'bitki', yuvarlak: true },
      { tur: 'piyano', ad: 'Duvar piyanosu', kisa: 'Piyano', en: 150, boy: 60, sembol: 'piyano' },
    ],
  },
];

export const MOBILYA_SOZLUGU = Object.fromEntries(
  MOBILYA_GRUPLARI.flatMap((g) => g.ogeler.map((o) => [o.tur, o])),
);
