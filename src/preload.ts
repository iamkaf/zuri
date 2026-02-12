import { contextBridge, ipcRenderer } from 'electron';

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
  };
  theme: ThemeId;
  notificationTime: string; // HH:MM
};

const api = {
  settings: {
    get: () => ipcRenderer.invoke('zuri:settings:get') as Promise<ZuriSettings>,
    set: (patch: Partial<ZuriSettings>) =>
      ipcRenderer.invoke('zuri:settings:set', patch) as Promise<ZuriSettings>,
    pickMarkdownFile: () =>
      ipcRenderer.invoke('zuri:settings:pickMarkdown') as Promise<string | null>,
  },
};

contextBridge.exposeInMainWorld('zuri', api);

export type ZuriApi = typeof api;
