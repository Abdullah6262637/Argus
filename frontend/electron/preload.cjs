// Electron preload - renderer'a guvenli API expose eder.

const { contextBridge, ipcRenderer } = require('electron');

const apiPayload = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  
  // File dialogs
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Window controls (supporting direct and nested windowControls)
  minimize: () => {
    ipcRenderer.send('window-minimize');
    ipcRenderer.send('window:minimize');
  },
  maximize: () => {
    ipcRenderer.send('window-maximize');
    ipcRenderer.send('window:maximize');
  },
  close: () => {
    ipcRenderer.send('window-close');
    ipcRenderer.send('window:close');
  },
  windowControls: {
    minimize: () => {
      ipcRenderer.send('window-minimize');
      ipcRenderer.send('window:minimize');
    },
    maximize: () => {
      ipcRenderer.send('window-maximize');
      ipcRenderer.send('window:maximize');
    },
    close: () => {
      ipcRenderer.send('window-close');
      ipcRenderer.send('window:close');
    },
  },
};

contextBridge.exposeInMainWorld('argus', apiPayload);
contextBridge.exposeInMainWorld('openclaw', apiPayload);
