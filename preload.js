// Arayüz ile ana süreç arasındaki güvenli köprü.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atolye', {
  veriOku: (ad) => ipcRenderer.invoke('veri:oku', ad),
  veriYaz: (ad, veri) => ipcRenderer.invoke('veri:yaz', ad, veri),
  gorselKaydet: (tampon, uzanti) => ipcRenderer.invoke('gorsel:kaydet', tampon, uzanti),
  gorselOku: (kimlik) => ipcRenderer.invoke('gorsel:oku', kimlik),
  gorselSil: (kimlik) => ipcRenderer.invoke('gorsel:sil', kimlik),
  pngDisaAktar: (ad, veriURL) => ipcRenderer.invoke('disa:png', ad, veriURL),
  dosyaKaydet: (ad, metin) => ipcRenderer.invoke('dosya:kaydet', ad, metin),
  dosyaAc: () => ipcRenderer.invoke('dosya:ac'),
  cadAc: () => ipcRenderer.invoke('cad:ac'),
  panoyaKopyala: (metin) => ipcRenderer.invoke('pano:kopyala', metin),
  temaAyarla: (tema) => ipcRenderer.invoke('tema:ayarla', tema),
  veriKlasorunuAc: () => ipcRenderer.invoke('klasor:ac'),
});
