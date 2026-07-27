// Electron main process - Argus masaustu uygulamasi
// React UI'i bir BrowserWindow icinde yukler; dev modda Vite server'ini, prod modda dist/index.html'i kullanir.

const { app, BrowserWindow, shell, Menu, globalShortcut, dialog } = require('electron');
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

let mainWindow = null;
let backendProc = null;

/**
 * Backend'i baslatir (hem dev hem prod modda).
 *
 * - Dev: workspace root'taki .venv\Scripts\python.exe ile uvicorn app.main:app
 * - Prod: PyInstaller ile paketlenmis argus-backend.exe (varsa)
 *         yoksa sistem python'una fallback (ARGUS_PYTHON env override)
 */
function startBackend() {
  if (
    process.env.ARGUS_NO_BACKEND === '1' ||
    process.env.UMTALAGENT_NO_BACKEND === '1' || // geriye donuk uyum
    process.env.OPENCLAW_NO_BACKEND === '1' // geriye donuk uyum
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
    // Production: extraResources/backend altinda
    backendDir = path.join(process.resourcesPath, 'backend');

    // Sprint C.2: Once PyInstaller binary'sini ara
    const candidates =
      process.platform === 'win32'
        ? [
            path.join(backendDir, 'argus-backend', 'argus-backend.exe'),
            path.join(backendDir, 'argus-backend.exe')]
        : [
            path.join(backendDir, 'argus-backend', 'argus-backend'),
            path.join(backendDir, 'argus-backend')];

    const pyinstallerExe = candidates.find((p) => fs.existsSync(p));

    if (pyinstallerExe) {
      exe = pyinstallerExe;
      args = []; // PyInstaller binary kendi entry'sini calistirir
      backendDir = path.dirname(pyinstallerExe);
      console.log('[electron] PyInstaller binary kullanilacak:', pyinstallerExe);
    } else {
      // Fallback: sistem Python
      exe =
        process.env.ARGUS_PYTHON ||
        process.env.UMTALAGENT_PYTHON ||
        (process.platform === 'win32' ? 'python.exe' : 'python3');
      args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'];
      console.warn('[electron] PyInstaller binary bulunamadi, sistem python kullanilacak:', exe);
    }
  }

  if (path.isAbsolute(exe) && !fs.existsSync(exe)) {
    console.warn('[electron] Backend executable bulunamadi:', exe);
    return;
  }

  console.log('[electron] backend baslatiliyor:', exe, args.join(' '), '@', backendDir);

  // Production: log dosyasina yaz
  let stdio = 'inherit';
  if (!isDev) {
    try {
      const userData = app.getPath('userData');
      fs.mkdirSync(userData, { recursive: true });
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
    backgroundColor: '#0f172a',
    title: 'Argus - Çoklu Ajan Sistemi',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc',
      height: 35
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const { ipcMain } = require('electron');
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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
  // FAZ 8.3: Global hotkey - Ctrl+Shift+Space ile pencereyi öne getir
  const accelerator = process.env.UMTALAGENT_HOTKEY || 'CommandOrControl+Shift+Space';
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

/**
 * Sprint C.7: Otomatik guncelleme.
 * Production'da GitHub Releases'a bakar; yeni surum varsa kullaniciya sorar.
 */
function setupAutoUpdater() {
  if (!autoUpdater || isDev) return;

  autoUpdater.autoDownload = false; // kullanici onaylasin
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
      cancelId: 1});
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
      cancelId: 1});
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    console.warn('[updater] hata:', err?.message || err);
  });

  // Baslangictan 5 saniye sonra kontrol et
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[updater] checkForUpdates hata:', err?.message || err);
    });
  }, 5000);
}

app.whenReady().then(() => {
  startBackend();
  buildMenu();
  createMainWindow();
  registerGlobalHotkey();
  setupAutoUpdater();

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