const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const smokeTest = process.env.PUBLISHFLOW_SMOKE_TEST === '1';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

app.setAppUserModelId('cn.qxf.batchvideouploader');
app.setName('批量视频上传');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#f4f6fa',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    title: '批量视频上传 · 流量舱',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#f8f9fc', symbolColor: '#596277', height: 36 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (/^https:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.webContents.once('did-finish-load', () => {
    if (smokeTest) {
      console.log('PUBLISHFLOW_SMOKE_TEST=PASS');
      setTimeout(() => app.quit(), 250);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (!smokeTest) mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
