// Uygulama kabuğu: sol sekme menüsü, araçların yüklenmesi ve tema.
import { depo } from './cekirdek/depo.js';
import { kacis, bildir, bekleyenleriCalistir } from './cekirdek/arayuz.js';
import olcek from './araclar/olcek.js';
import planlayici from './araclar/planlayici.js';
import palet from './araclar/palet.js';
import malzeme from './araclar/malzeme.js';
import ergonomi from './araclar/ergonomi.js';
import moodboard from './araclar/moodboard.js';

const ARACLAR = [olcek, planlayici, palet, malzeme, ergonomi, moodboard];

const sekmeKap = document.getElementById('sekmeler');
const icerik = document.getElementById('icerik');
const kurulanlar = new Map();
let ayarlar = { tema: 'sistem', sonArac: ARACLAR[0].kimlik };

const koyuTercih = window.matchMedia('(prefers-color-scheme: dark)');

function temayiUygula() {
  const koyu = ayarlar.tema === 'koyu' || (ayarlar.tema === 'sistem' && koyuTercih.matches);
  document.documentElement.dataset.tema = koyu ? 'koyu' : 'acik';
  for (const d of document.querySelectorAll('#tema-secici button')) {
    d.classList.toggle('etkin', d.dataset.tema === ayarlar.tema);
  }
}

async function aracAc(kimlik) {
  const arac = ARACLAR.find((a) => a.kimlik === kimlik) || ARACLAR[0];
  if (!kurulanlar.has(arac.kimlik)) {
    const kap = document.createElement('section');
    kap.className = 'arac';
    kap.dataset.arac = arac.kimlik;
    icerik.append(kap);
    kurulanlar.set(arac.kimlik, kap);
    try {
      await arac.kur(kap);
    } catch (hata) {
      console.error(hata);
      kap.innerHTML = `<div class="bos-durum">Bu araç açılırken bir sorun oluştu: ${kacis(hata.message)}</div>`;
    }
  }
  for (const [k, kap] of kurulanlar) kap.classList.toggle('etkin', k === arac.kimlik);
  for (const d of sekmeKap.children) d.classList.toggle('etkin', d.dataset.arac === arac.kimlik);
  arac.gosterildi?.();
  if (ayarlar.sonArac !== arac.kimlik) {
    ayarlar.sonArac = arac.kimlik;
    depo.yaz('ayarlar', ayarlar);
  }
}

async function baslat() {
  ayarlar = { ...ayarlar, ...(await depo.oku('ayarlar', {})) };
  temayiUygula();
  depo.temaAyarla(ayarlar.tema);
  koyuTercih.addEventListener('change', temayiUygula);

  for (const arac of ARACLAR) {
    const d = document.createElement('button');
    d.className = 'sekme';
    d.dataset.arac = arac.kimlik;
    d.innerHTML = `${arac.simge}<span>${kacis(arac.baslik)}</span>`;
    d.addEventListener('click', () => aracAc(arac.kimlik));
    sekmeKap.append(d);
  }

  document.getElementById('tema-secici').addEventListener('click', (o) => {
    const tema = o.target.dataset?.tema;
    if (!tema) return;
    ayarlar.tema = tema;
    temayiUygula();
    depo.temaAyarla(tema);
    depo.yaz('ayarlar', ayarlar);
  });
  document.getElementById('veri-klasoru').addEventListener('click', () => depo.veriKlasorunuAc());

  // Pencereye bırakılan dosyanın tarayıcı gibi açılmasını engelle; araçlar kendi bırakma alanlarını yönetir.
  for (const olay of ['dragover', 'drop']) {
    window.addEventListener(olay, (o) => o.preventDefault());
  }
  // Kapanırken, gecikmeli kaydedilen taslakları kaybetme.
  window.addEventListener('beforeunload', bekleyenleriCalistir);
  // iPad'de uygulama arka plana alınırken "beforeunload" gelmeyebilir.
  window.addEventListener('pagehide', bekleyenleriCalistir);
  document.addEventListener('visibilitychange', () => { if (document.hidden) bekleyenleriCalistir(); });
  // Web sürümünde veriler tarayıcının içindedir; açılacak bir klasör yoktur.
  if (window.atolye.web) document.getElementById('veri-klasoru').hidden = true;
  window.addEventListener('unhandledrejection', (o) => {
    console.error(o.reason);
    bildir('Beklenmeyen bir hata oluştu.', 'hata');
  });

  await aracAc(ayarlar.sonArac);
}

baslat();
