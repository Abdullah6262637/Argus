// Electron preload - renderer'a guvenli API expose eder.

const { contextBridge, ipcRenderer } = require('electron');

<<<<<<< HEAD
const apiPayload = {
=======
contextBridge.exposeInMainWorld('argus', {
  // Existing API
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
<<<<<<< HEAD
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
};

contextBridge.exposeInMainWorld('argus', apiPayload);
contextBridge.exposeInMainWorld('openclaw', apiPayload);
=======
  
  // File dialogs
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
