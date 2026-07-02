// Electron preload - renderer'a guvenli API expose eder.
// Su anda sadece bir version/platform bilgisi paylasiyoruz.
// Ileride dosya IO veya native secret store gibi kanallar buraya eklenebilir.

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('openclaw', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});