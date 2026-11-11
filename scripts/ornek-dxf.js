// Denemeler için küçük bir DXF çizimi üretir (mm): L biçimli oda, kolon, kapı yayı, iç duvar.
// Kullanım: node scripts/ornek-dxf.js <hedef.dxf>
const fs = require('fs');

const s = [];
const ekle = (...ciftler) => s.push(...ciftler.map(String));
const cizgi = (x1, y1, x2, y2) => ekle(0, 'LINE', 8, 'DUVAR', 10, x1, 20, y1, 30, 0, 11, x2, 21, y2, 31, 0);
const kapaliCokluCizgi = (noktalar) => {
  ekle(0, 'POLYLINE', 8, 'ODA', 66, 1, 70, 1, 10, 0, 20, 0, 30, 0);
  for (const [x, y] of noktalar) ekle(0, 'VERTEX', 8, 'ODA', 10, x, 20, y, 30, 0);
  ekle(0, 'SEQEND');
};

ekle(0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1009', 9, '$INSUNITS', 70, 4, 0, 'ENDSEC');
ekle(0, 'SECTION', 2, 'ENTITIES');
// L biçimli oda: 6,00 × 5,00 m, sağ üst köşeden 2,50 × 2,00 m eksik → 25 m², çevre 22 m
kapaliCokluCizgi([[0, 0], [6000, 0], [6000, 3000], [3500, 3000], [3500, 5000], [0, 5000]]);
// Kolon 40 × 40 cm
kapaliCokluCizgi([[2800, 2000], [3200, 2000], [3200, 2400], [2800, 2400]]);
// İç duvar ve kapı
cizgi(0, 1800, 1500, 1800);
cizgi(2400, 1800, 2800, 1800);
ekle(0, 'ARC', 8, 'KAPI', 10, 1500, 20, 1800, 30, 0, 40, 900, 50, 0, 51, 90);
cizgi(1500, 1800, 1500, 2700);
// Yuvarlak masa
ekle(0, 'CIRCLE', 8, 'MOBILYA', 10, 4800, 20, 1400, 30, 0, 40, 550);
ekle(0, 'ENDSEC', 0, 'EOF');

fs.writeFileSync(process.argv[2], s.join('\n') + '\n');
console.log('Yazıldı:', process.argv[2]);
