// Electron main process - Argus masaustu uygulamasi
// React UI'i bir BrowserWindow icinde yukler; dev modda Vite server'ini, prod modda dist/index.html'i kullanir.

const { app, BrowserWindow, shell, Menu, globalShortcut, dialog, ipcMain } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

// Sprint C.7: electron-updater (opsiyonel — kurulu degilse skip)
let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (_e) {
  // electron-updater henuz kurulu degil; npm install electron-updater ile eklenebilir.
}

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_URL || 'http://localhost:5173';

// Ultra Performance GPU Acceleration Switches
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-smooth-scrolling');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let mainWindow = null;
let backendProc = null;

/**
 * Backend'i baslatir (hem dev hem prod modda).
 */
async function startBackend() {
  if (
    process.env.ARGUS_NO_BACKEND === '1' ||
    process.env.UMTALAGENT_NO_BACKEND === '1' ||
    process.env.OPENCLAW_NO_BACKEND === '1'
  ) {
    console.log('[electron] NO_BACKEND=1 -> backend baslatilmadi');
    return;
  }

  let backendDir;
  let exe;
  let args;

  if (isDev) {
    const projectRoot = path.resolve(__dirname, '..', '..');
    backendDir = path.join(projectRoot, 'backend');
    exe =
      process.platform === 'win32'
        ? path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
        : path.join(projectRoot, '.venv', 'bin', 'python');
    args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'];
  } else {
    backendDir = path.join(process.resourcesPath, 'backend');
    const candidates =
      process.platform === 'win32'
        ? [
            path.join(backendDir, 'argus-backend', 'argus-backend.exe'),
            path.join(backendDir, 'argus-backend.exe'),
          ]
        : [
            path.join(backendDir, 'argus-backend', 'argus-backend'),
            path.join(backendDir, 'argus-backend'),
          ];

    let pyinstallerExe = undefined;
    for (const p of candidates) {
      try {
        await fs.promises.access(p, fs.constants.F_OK);
        pyinstallerExe = p;
        break;
      } catch (err) {}
    }

    if (pyinstallerExe) {
      exe = pyinstallerExe;
      args = [];
      backendDir = path.dirname(pyinstallerExe);
      console.log('[electron] PyInstaller binary kullanilacak:', pyinstallerExe);
    } else {
      exe =
        process.env.ARGUS_PYTHON ||
        process.env.UMTALAGENT_PYTHON ||
        (process.platform === 'win32' ? 'python.exe' : 'python3');
      args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'];
      console.warn('[electron] PyInstaller binary bulunamadi, sistem python kullanilacak:', exe);
    }
  }

  if (path.isAbsolute(exe)) {
    try {
      await fs.promises.access(exe, fs.constants.F_OK);
    } catch (err) {
      console.warn('[electron] Backend executable bulunamadi:', exe);
      return;
    }
  }

  console.log('[electron] backend baslatiliyor:', exe, args.join(' '), '@', backendDir);

  let stdio = 'inherit';
  if (!isDev) {
    try {
      const userData = app.getPath('userData');
      await fs.promises.mkdir(userData, { recursive: true });
      const logPath = path.join(userData, 'backend.log');
      const out = fs.openSync(logPath, 'a');
      stdio = ['ignore', out, out];
      console.log('[electron] backend logu:', logPath);
    } catch (err) {
      console.warn('[electron] log dosyasi acilamadi, stdio=inherit kullanilacak:', err);
    }
  }

  backendProc = spawn(exe, args, { cwd: backendDir, stdio });
  backendProc.on('exit', (code) => {
    console.log('[electron] backend cikti, kod:', code);
    backendProc = null;
  });
  backendProc.on('error', (err) => {
    console.error('[electron] backend baslatma hatasi:', err);
  });
}

function stopBackend() {
  if (backendProc && !backendProc.killed) {
    backendProc.kill();
    backendProc = null;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0b1120',
    title: 'Argus - Çoklu Ajan Sistemi',
    frame: false,
    autoHideMenuBar: true,
    hasShadow: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  const handleMinimize = () => mainWindow?.minimize();
  const handleMaximize = () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  };
  const handleClose = () => mainWindow?.close();

  ipcMain.on('window-minimize', handleMinimize);
  ipcMain.on('window:minimize', handleMinimize);
  ipcMain.on('window-maximize', handleMaximize);
  ipcMain.on('window:maximize', handleMaximize);
  ipcMain.on('window-close', handleClose);
  ipcMain.on('window:close', handleClose);

  if (isDev) {
    mainWindow.loadURL(DEV_URL).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
    if (process.env.ARGUS_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Dis linkleri varsayilan tarayicida ac
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        { role: 'reload', label: 'Yeniden Yukle' },
        { role: 'forceReload', label: 'Zorla Yenile' },
        { type: 'separator' },
        { role: 'quit', label: 'Cikis' },
      ],
    },
    {
      label: 'Goruntu',
      submenu: [
        { role: 'resetZoom', label: 'Zoom Sifirla' },
        { role: 'zoomIn', label: 'Yakinlastir' },
        { role: 'zoomOut', label: 'Uzaklastir' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' },
        { role: 'toggleDevTools', label: 'Gelistirici Araclari' },
      ],
    },
    {
      label: 'Yardim',
      submenu: [
        {
          label: 'API Dokumantasyonu (tarayicida)',
          click: () => shell.openExternal('http://localhost:8000/docs'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerGlobalHotkey() {
  const accelerator = process.env.ARGUS_HOTKEY || process.env.UMTALAGENT_HOTKEY || 'CommandOrControl+Shift+Space';
  try {
    const ok = globalShortcut.register(accelerator, () => {
      if (!mainWindow) {
        createMainWindow();
        return;
      }
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    });
    if (ok) {
      console.log('[electron] Global hotkey kayit edildi:', accelerator);
    } else {
      console.warn('[electron] Global hotkey kayit edilemedi:', accelerator);
    }
  } catch (err) {
    console.warn('[electron] Hotkey hatasi:', err);
  }
}

function setupAutoUpdater() {
  if (!autoUpdater || isDev) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', async (info) => {
    console.log('[updater] Yeni surum mevcut:', info.version);
    if (!mainWindow) return;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Guncelleme Mevcut',
      message: `Yeni surum yayinlandi: v${info.version}`,
      detail: 'Indirip yuklemek ister misin? Indirme arka planda devam eder.',
      buttons: ['Indir', 'Daha sonra'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) {
      autoUpdater.downloadUpdate().catch((err) => {
        console.error('[updater] indirme hatasi:', err);
      });
    }
  });

  autoUpdater.on('update-downloaded', async () => {
    if (!mainWindow) return;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Guncelleme Hazir',
      message: 'Yeni surum indirildi. Simdi yeniden baslatilsin mi?',
      buttons: ['Yeniden Baslat', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    console.warn('[updater] hata:', err?.message || err);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[updater] checkForUpdates hata:', err?.message || err);
    });
  }, 5000);
}

app.whenReady().then(async () => {
  await startBackend();
  buildMenu();
  createMainWindow();
  registerGlobalHotkey();
  setupAutoUpdater();

  ipcMain.handle('dialog:openFile', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options || {
      properties: ['openFile'],
      filters: [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle('dialog:saveFile', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options || {});
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});