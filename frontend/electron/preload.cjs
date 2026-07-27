// Electron preload - renderer'a guvenli API expose eder.

const { contextBridge, ipcRenderer } = require('electron');

const apiPayload = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
};

contextBridge.exposeInMainWorld('argus', apiPayload);
contextBridge.exposeInMainWorld('openclaw', apiPayload);