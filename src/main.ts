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
import { ensureFile, readDoc, watchMarkdownFile, writeDoc } from './main/tasks';
import { rescheduleNotifications } from './main/notify';
import type { DocModel, Task } from './main/markdown';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let tray: Tray | null = null;
let window: BrowserWindow | null = null;
let stopWatching: null | (() => void) = null;

const getAssetPath = (...paths: string[]) => {
  // In dev, this file is built to .vite/build/main.js, so ../../ points at the project root.
  // In prod, packaged assets live in process.resourcesPath.
  return app.isPackaged
    ? path.join(process.resourcesPath, ...paths)
    : path.join(__dirname, '../../', ...paths);
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 380,
    height: 520,
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
  if (!window) return;

  const windowBounds = window.getBounds();
  const cursor = screen.getCursorScreenPoint();

  // Tray bounds can be bogus on Linux (0,0,0,0). Fallback to cursor anchoring.
  const trayBounds = tray?.getBounds();
  const trayBoundsValid =
    trayBounds &&
    Number.isFinite(trayBounds.width) &&
    Number.isFinite(trayBounds.height) &&
    trayBounds.width > 0 &&
    trayBounds.height > 0;

  const anchorPoint = trayBoundsValid && trayBounds
    ? { x: trayBounds.x, y: trayBounds.y }
    : cursor;

  const display = screen.getDisplayNearestPoint(anchorPoint);
  const workArea = display.workArea;

  let x: number;
  let y: number;

  if (trayBoundsValid && trayBounds) {
    // Center horizontally under/above the tray icon
    x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);

    // On macOS the tray is at the top; on Windows/Linux it's usually at the bottom.
    y =
      process.platform === 'darwin'
        ? Math.round(trayBounds.y + trayBounds.height + 4)
        : Math.round(trayBounds.y - windowBounds.height - 4);
  } else {
    // Cursor-anchored placement: pop "near the click" and keep inside work area.
    x = Math.round(cursor.x - windowBounds.width + 14);
    y = Math.round(cursor.y - windowBounds.height - 14);
  }

  const clampedX = Math.min(
    Math.max(x, workArea.x),
    workArea.x + workArea.width - windowBounds.width,
  );
  const clampedY = Math.min(
    Math.max(y, workArea.y),
    workArea.y + workArea.height - windowBounds.height,
  );

  window.setPosition(clampedX, clampedY, false);
};

const toggleWindow = () => {
  if (!window) return;

  if (window.isVisible()) {
    window.hide();
    return;
  }

  console.log('[zuri] tray bounds', tray?.getBounds());
  console.log('[zuri] window bounds', window.getBounds());
  console.log('[zuri] cursor', screen.getCursorScreenPoint());

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

  createWindow();
  createTray();

  const startWatchingIfNeeded = async () => {
    if (!window) return;
    const settings = await loadSettings();
    if (!settings.markdownPath) return;

    await ensureFile(settings.markdownPath);

    if (stopWatching) stopWatching();
    const handle = watchMarkdownFile(settings.markdownPath, window);
    stopWatching = () => handle.close();

    // First schedule
    const model = await readDoc(settings.markdownPath);
    rescheduleNotifications({
      model,
      enabled: settings.features.notifications,
      notificationTime: settings.notificationTime,
    });
  };

  // IPC: settings
  ipcMain.handle('zuri:settings:get', async () => loadSettings());
  ipcMain.handle('zuri:settings:set', async (_evt, patch) => {
    const next = await patchSettings(patch);
    // restart watcher if markdownPath changed
    await startWatchingIfNeeded();
    // reschedule notifications on any settings change
    if (next.markdownPath) {
      const model = await readDoc(next.markdownPath);
      rescheduleNotifications({
        model,
        enabled: next.features.notifications,
        notificationTime: next.notificationTime,
      });
    }
    return next;
  });
  ipcMain.handle('zuri:settings:pickMarkdown', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Markdown file',
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const picked = result.filePaths[0];
    await patchSettings({ markdownPath: picked });
    await startWatchingIfNeeded();
    return picked;
  });

  // IPC: markdown doc ops
  ipcMain.handle('zuri:doc:get', async (): Promise<DocModel> => {
    const settings = await loadSettings();
    if (!settings.markdownPath) return { sections: [] };
    await ensureFile(settings.markdownPath);
    return readDoc(settings.markdownPath);
  });

  const mutate = async (fn: (model: DocModel) => void): Promise<DocModel> => {
    const settings = await loadSettings();
    if (!settings.markdownPath) return { sections: [] };
    await ensureFile(settings.markdownPath);
    const model = await readDoc(settings.markdownPath);
    fn(model);
    await writeDoc(settings.markdownPath, model);

    // notify renderer (our own writes won't always trigger watch reliably)
    window?.webContents.send('zuri:md:changed');

    rescheduleNotifications({
      model,
      enabled: settings.features.notifications,
      notificationTime: settings.notificationTime,
    });

    return model;
  };

  ipcMain.handle('zuri:doc:addSection', async (_evt, name: string) =>
    mutate((m) => {
      if (!m.sections.find((s) => s.name === name)) m.sections.push({ name, tasks: [] });
    }),
  );

  ipcMain.handle('zuri:doc:addTask', async (_evt, args: { section: string; title: string }) =>
    mutate((m) => {
      let sec = m.sections.find((s) => s.name === args.section);
      if (!sec) {
        sec = { name: args.section, tasks: [] };
        m.sections.push(sec);
      }
      sec.tasks.push({
        id: `${sec.name}::${sec.tasks.length}`,
        done: false,
        title: args.title,
        extra: {},
      });
    }),
  );

  ipcMain.handle('zuri:doc:toggleTask', async (_evt, args: { section: string; taskId: string }) =>
    mutate((m) => {
      const sec = m.sections.find((s) => s.name === args.section);
      const task = sec?.tasks.find((t) => t.id === args.taskId);
      if (task) task.done = !task.done;
    }),
  );

  ipcMain.handle(
    'zuri:doc:updateTask',
    async (_evt, args: { section: string; taskId: string; patch: Partial<Task> }) =>
      mutate((m) => {
        const sec = m.sections.find((s) => s.name === args.section);
        const task = sec?.tasks.find((t) => t.id === args.taskId);
        if (!task) return;

        if (typeof args.patch.title === 'string') task.title = args.patch.title;
        if (typeof args.patch.done === 'boolean') task.done = args.patch.done;
        if (typeof args.patch.priority === 'string' || args.patch.priority === undefined)
          task.priority = args.patch.priority as Task['priority'];
        if (typeof args.patch.effort === 'string' || args.patch.effort === undefined)
          task.effort = args.patch.effort as Task['effort'];
        if (typeof args.patch.due === 'string' || args.patch.due === undefined)
          task.due = args.patch.due;
      }),
  );

  await startWatchingIfNeeded();
});

// Keep the app running even if all windows are closed (tray app)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('activate', () => {
  if (!window) createWindow();
  toggleWindow();
});
