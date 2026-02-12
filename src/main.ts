import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  screen,
  ipcMain,
  dialog,
} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { loadSettings, patchSettings } from './main/settings';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let tray: Tray | null = null;
let window: BrowserWindow | null = null;

const getAssetPath = (...paths: string[]) => {
  // In dev, this file is built to .vite/build/main.js, so ../../ points at the project root.
  // In prod, packaged assets live in process.resourcesPath.
  return app.isPackaged
    ? path.join(process.resourcesPath, ...paths)
    : path.join(__dirname, '../../', ...paths);
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 260,
    height: 120,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#111111',
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Auto-hide when it loses focus (common tray-app behavior)
  window.on('blur', () => {
    if (window && window.isVisible()) window.hide();
  });
};

const positionWindow = () => {
  if (!tray || !window) return;

  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();

  // Center horizontally under/above the tray icon
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);

  // On macOS the tray is at the top; on Windows/Linux it's usually at the bottom.
  const y = process.platform === 'darwin'
    ? Math.round(trayBounds.y + trayBounds.height + 4)
    : Math.round(trayBounds.y - windowBounds.height - 4);

  // Keep it on-screen
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const workArea = display.workArea;

  const clampedX = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - windowBounds.width);
  const clampedY = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - windowBounds.height);

  window.setPosition(clampedX, clampedY, false);
};

const toggleWindow = () => {
  if (!window) return;

  if (window.isVisible()) {
    window.hide();
    return;
  }

  positionWindow();
  window.show();
  window.focus();
};

const createTray = () => {
  const iconPath = getAssetPath('assets', 'tray.png');
  const image = nativeImage.createFromPath(iconPath);

  tray = new Tray(image.isEmpty() ? iconPath : image);

  // Tray apps usually have no top menu
  Menu.setApplicationMenu(null);
  tray.setToolTip('Zuri');

  tray.on('click', toggleWindow);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
};

app.on('ready', async () => {
  // On Windows, helps with notifications + taskbar grouping
  app.setAppUserModelId('com.iamkaf.zuri');

  // IPC: settings
  ipcMain.handle('zuri:settings:get', async () => loadSettings());
  ipcMain.handle('zuri:settings:set', async (_evt, patch) => patchSettings(patch));
  ipcMain.handle('zuri:settings:pickMarkdown', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Markdown file',
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const picked = result.filePaths[0];
    await patchSettings({ markdownPath: picked });
    return picked;
  });

  createWindow();
  createTray();
});

// Keep the app running even if all windows are closed (tray app)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('activate', () => {
  if (!window) createWindow();
  toggleWindow();
});
