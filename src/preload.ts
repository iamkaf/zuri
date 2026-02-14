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
  globalShortcut: {
    enabled: boolean;
    accelerator: string;
  };
  theme: ThemeId;
  notificationTime: string; // HH:MM
  windowBounds?: { x: number; y: number; width: number; height: number };
  trayAnchor?: { x: number; y: number };
};

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Effort = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type Task = {
  id: string;
  done: boolean;
  title: string;
  priority?: Priority;
  effort?: Effort;
  due?: string;
  extra: Record<string, string>;
};

export type Section = {
  name: string;
  tasks: Task[];
};

export type DocModel = {
  sections: Section[];
};

const api = {
  settings: {
    get: () => ipcRenderer.invoke('zuri:settings:get') as Promise<ZuriSettings>,
    set: (patch: Partial<ZuriSettings>) =>
      ipcRenderer.invoke('zuri:settings:set', patch) as Promise<ZuriSettings>,
    pickMarkdownFile: () =>
      ipcRenderer.invoke('zuri:settings:pickMarkdown') as Promise<string | null>,
  },
  doc: {
    get: () => ipcRenderer.invoke('zuri:doc:get') as Promise<DocModel>,
    addSection: (name: string) =>
      ipcRenderer.invoke('zuri:doc:addSection', name) as Promise<DocModel>,
    addTask: (section: string, title: string) =>
      ipcRenderer.invoke('zuri:doc:addTask', { section, title }) as Promise<DocModel>,
    toggleTask: (section: string, taskId: string) =>
      ipcRenderer.invoke('zuri:doc:toggleTask', { section, taskId }) as Promise<DocModel>,
    updateTask: (section: string, taskId: string, patch: Partial<Task>) =>
      ipcRenderer.invoke('zuri:doc:updateTask', { section, taskId, patch }) as Promise<DocModel>,
    reorderTask: (section: string, fromIndex: number, toIndex: number) =>
      ipcRenderer.invoke('zuri:doc:reorderTask', { section, fromIndex, toIndex }) as Promise<DocModel>,
    onChanged: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on('zuri:md:changed', listener);
      return () => {
        ipcRenderer.off('zuri:md:changed', listener);
      };
    },
  },
};

contextBridge.exposeInMainWorld('zuri', api);

export type ZuriApi = typeof api;
