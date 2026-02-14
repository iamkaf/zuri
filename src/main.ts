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
let lastTrayClickPoint: { x: number; y: number } | null = null;
// Best-effort anchor tracking for debugging/future heuristics
let lastGoodAnchorPoint: { x: number; y: number } | null = null;
// Fixed tray anchor: once we find a good click location, keep using it (Linux stability)
let fixedAnchorPoint: { x: number; y: number } | null = null;

const getAssetPath = (...paths: string[]) => {
  // In dev, this file is built to .vite/build/main.js, so ../../ points at the project root.
  // In prod, packaged assets live in process.resourcesPath.
  return app.isPackaged
    ? path.join(process.resourcesPath, ...paths)
    : path.join(__dirname, '../../', ...paths);
};

const createWindow = async () => {
  const settings = await loadSettings();
  const saved = settings.windowBounds;
  fixedAnchorPoint = settings.trayAnchor ?? null;

  window = new BrowserWindow({
    width: saved?.width ?? 380,
    height: saved?.height ?? 520,
    x: saved?.x,
    y: saved?.y,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    // backgroundColor: '#111111',
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Persist last window position/size (best-effort)
  let saveTimer: NodeJS.Timeout | null = null;
  const scheduleSaveBounds = () => {
    if (!window) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!window) return;
      const b = window.getBounds();
      void patchSettings({ windowBounds: b });
    }, 250);
  };

  window.on('move', scheduleSaveBounds);
  window.on('resize', scheduleSaveBounds);

  // Auto-hide when it loses focus (common tray-app behavior)
  window.on('blur', () => {
    if (window && window.isVisible()) window.hide();
  });
};

const positionWindow = () => {
  if (!window) return;

  const [w, h] = window.getSize();

  // Prefer fixed anchor (first known good) for stability on Linux; then fallback.
  const raw = fixedAnchorPoint ?? lastTrayClickPoint ?? screen.getCursorScreenPoint();

  // Some Linux environments can occasionally report (0,0). If we have a fixed anchor,
  // ignore the bogus value. Otherwise: do not reposition (avoids the dreaded top-left jump).
  const anchorLooksBogus = raw.x === 0 && raw.y === 0;
  if (anchorLooksBogus) {
    if (fixedAnchorPoint) return;
    // anchor point bogus; skipping reposition
    return;
  }

  lastGoodAnchorPoint = raw;
  void lastGoodAnchorPoint;

  // Tray bounds can be bogus on Linux (0,0,0,0). Use tray when valid, otherwise use anchor.
  const trayBounds = tray?.getBounds();
  const trayBoundsValid =
    trayBounds &&
    Number.isFinite(trayBounds.width) &&
    Number.isFinite(trayBounds.height) &&
    trayBounds.width > 0 &&
    trayBounds.height > 0;

  const anchorPoint = trayBoundsValid && trayBounds ? { x: trayBounds.x, y: trayBounds.y } : raw;

  const display = screen.getDisplayNearestPoint(anchorPoint);
  const workArea = display.workArea;

  let x: number;
  let y: number;

  if (trayBoundsValid && trayBounds) {
    x = Math.round(trayBounds.x + trayBounds.width / 2 - w / 2);
    y =
      process.platform === 'darwin'
        ? Math.round(trayBounds.y + trayBounds.height + 4)
        : Math.round(trayBounds.y - h - 4);
  } else {
    // Edge-aware placement around the click point.
    const margin = 12;
    const placeLeft = raw.x > workArea.x + workArea.width / 2;
    const placeUp = raw.y > workArea.y + workArea.height / 2;

    x = placeLeft ? Math.round(raw.x - w - margin) : Math.round(raw.x + margin);
    y = placeUp ? Math.round(raw.y - h - margin) : Math.round(raw.y + margin);
  }

  const clampedX = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - w);
  const clampedY = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - h);

  window.setPosition(clampedX, clampedY, false);
};

const toggleWindow = () => {
  if (!window) return;

  if (window.isVisible()) {
    window.hide();
    return;
  }

  // (logs removed)

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

  tray.on('click', (event, bounds, position) => {
    // Linux tray geometry is unreliable. Try (in order):
    // 1) click `position` (when provided)
    // 2) event coordinates (varies by platform)
    // 3) bounds center (if valid)
    // 4) cursor position

    const fromPositionRaw =
      position && typeof position.x === 'number' && typeof position.y === 'number'
        ? { x: position.x, y: position.y }
        : null;

    const nonZero = (p: { x: number; y: number } | null) =>
      p && !(p.x === 0 && p.y === 0) ? p : null;

    const fromPosition = nonZero(fromPositionRaw);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEvent = event as any;
    const fromEventRaw =
      anyEvent && typeof anyEvent.x === 'number' && typeof anyEvent.y === 'number'
        ? { x: anyEvent.x, y: anyEvent.y }
        : anyEvent && typeof anyEvent.screenX === 'number' && typeof anyEvent.screenY === 'number'
          ? { x: anyEvent.screenX, y: anyEvent.screenY }
          : null;

    const fromEvent = nonZero(fromEventRaw);

    const boundsValid =
      bounds &&
      Number.isFinite(bounds.width) &&
      Number.isFinite(bounds.height) &&
      bounds.width > 0 &&
      bounds.height > 0;

    const fromBoundsRaw = boundsValid
      ? { x: Math.round(bounds.x + bounds.width / 2), y: Math.round(bounds.y + bounds.height / 2) }
      : null;

    const fromBounds = nonZero(fromBoundsRaw);

    const fromCursorRaw = screen.getCursorScreenPoint();
    const fromCursor = nonZero(fromCursorRaw);

    const pos = fromPosition ?? fromEvent ?? fromBounds ?? fromCursor ?? { x: 0, y: 0 };

    // (logs removed)

    // Some environments may report (0,0). Treat as bogus.
    if (pos.x === 0 && pos.y === 0) {
      lastTrayClickPoint = null;
      return toggleWindow();
    }

    // Always keep lastTrayClickPoint for logs/telemetry.
    lastTrayClickPoint = pos;
    lastGoodAnchorPoint = pos;

    // First known good tray click point becomes the fixed anchor for the session,
    // and we persist it for future runs.
    if (!fixedAnchorPoint) {
      fixedAnchorPoint = pos;
      void patchSettings({ trayAnchor: pos });
    }

    toggleWindow();
  });

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

  await createWindow();
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

  ipcMain.handle(
    'zuri:doc:reorderTask',
    async (_evt, args: { section: string; fromIndex: number; toIndex: number }) =>
      mutate((m) => {
        const sec = m.sections.find((s) => s.name === args.section);
        if (!sec || args.fromIndex === args.toIndex) return;
        if (args.fromIndex < 0 || args.fromIndex >= sec.tasks.length) return;
        if (args.toIndex < 0 || args.toIndex >= sec.tasks.length) return;
        const [task] = sec.tasks.splice(args.fromIndex, 1);
        sec.tasks.splice(args.toIndex, 0, task);
      }),
  );

  await startWatchingIfNeeded();
});

// Keep the app running even if all windows are closed (tray app)
app.on('window-all-closed', () => {
  // tray app: keep running
});

app.on('activate', async () => {
  if (!window) await createWindow();
  toggleWindow();
});
