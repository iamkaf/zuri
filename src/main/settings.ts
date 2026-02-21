import fs from 'node:fs/promises';
import path from 'node:path';
import { app, nativeTheme } from 'electron';

export type ThemeId =
  | 'open-light'
  | 'open-dark'
  | 'windows-light'
  | 'windows-dark'
  | 'apple-light'
  | 'apple-dark';

export type ZuriSettings = {
  markdownPath: string | null;
  features: {
    priority: boolean;
    effort: boolean;
    notifications: boolean;
    recurring: boolean;
  };
  globalShortcut: {
    enabled: boolean;
    accelerator: string;
  };
  theme: ThemeId;
  notificationTime: string; // HH:MM
  devMode: boolean;
  windowBounds?: { x: number; y: number; width: number; height: number };
  trayAnchor?: { x: number; y: number };
};

const SETTINGS_DIR = () => path.join(app.getPath('home'), '.zuri');
const SETTINGS_PATH = () => path.join(SETTINGS_DIR(), 'settings.json');

const platformDefaultTheme = (): ThemeId => {
  const isDark = nativeTheme.shouldUseDarkColors;
  if (process.platform === 'win32') return isDark ? 'windows-dark' : 'windows-light';
  if (process.platform === 'darwin') return isDark ? 'apple-dark' : 'apple-light';
  return isDark ? 'open-dark' : 'open-light';
};

export const defaultSettings = (): ZuriSettings => ({
  markdownPath: null,
  features: {
    priority: true,
    effort: true,
    notifications: true,
    recurring: true,
  },
  globalShortcut: {
    enabled: false,
    accelerator: 'CmdOrCtrl+Shift+Space',
  },
  theme: platformDefaultTheme(),
  notificationTime: '00:00',
  devMode: false,
});

export const loadSettings = async (): Promise<ZuriSettings> => {
  try {
    const raw = await fs.readFile(SETTINGS_PATH(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<ZuriSettings>;
    return {
      ...defaultSettings(),
      ...parsed,
      features: {
        ...defaultSettings().features,
        ...(parsed.features ?? {}),
      },
      globalShortcut: {
        ...defaultSettings().globalShortcut,
        ...(parsed.globalShortcut ?? {}),
      },
    };
  } catch {
    return defaultSettings();
  }
};

export const saveSettings = async (settings: ZuriSettings): Promise<void> => {
  await fs.mkdir(SETTINGS_DIR(), { recursive: true });
  await fs.writeFile(SETTINGS_PATH(), JSON.stringify(settings, null, 2) + '\n', 'utf8');
};

export const patchSettings = async (
  patch: Partial<ZuriSettings>,
): Promise<ZuriSettings> => {
  const current = await loadSettings();
  const next: ZuriSettings = {
    ...current,
    ...patch,
    features: {
      ...current.features,
      ...(patch.features ?? {}),
    },
    globalShortcut: {
      ...current.globalShortcut,
      ...(patch.globalShortcut ?? {}),
    },
  };
  await saveSettings(next);
  return next;
};
