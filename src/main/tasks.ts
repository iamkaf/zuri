import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { BrowserWindow } from 'electron';
import { DocModel, parseMarkdown, writeMarkdown } from './markdown';

export const readDoc = async (filePath: string): Promise<DocModel> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return parseMarkdown(raw);
  } catch (e: unknown) {
    const maybe = e as { code?: unknown };
    if (maybe?.code === 'ENOENT') return { sections: [] };
    throw e;
  }
};

export const writeDoc = async (filePath: string, model: DocModel): Promise<void> => {
  const text = writeMarkdown(model);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, 'utf8');
};

export const ensureFile = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    await writeDoc(filePath, { sections: [{ name: 'Inbox', tasks: [] }] });
  }
};

// --- watching ---

type WatchHandle = {
  close: () => void;
};

export const watchMarkdownFile = (filePath: string, win: BrowserWindow): WatchHandle => {
  const dir = path.dirname(filePath);
  let closed = false;
  let timer: NodeJS.Timeout | null = null;

  const emit = () => {
    if (closed) return;
    win.webContents.send('zuri:md:changed');
  };

  const debounceEmit = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(emit, 120);
  };

  // fs.watch on file can miss atomic saves; watch both file and directory.
  let fileWatcher: fsSync.FSWatcher | null = null;
  let dirWatcher: fsSync.FSWatcher | null = null;

  try {
    fileWatcher = fsSync.watch(filePath, () => debounceEmit());
  } catch {
    fileWatcher = null;
  }

  try {
    dirWatcher = fsSync.watch(dir, (_event, filename) => {
      if (!filename) return debounceEmit();
      if (filename.toString() === path.basename(filePath)) debounceEmit();
    });
  } catch {
    dirWatcher = null;
  }

  // Fallback polling
  fsSync.watchFile(filePath, { interval: 750 }, () => debounceEmit());

  return {
    close: () => {
      closed = true;
      if (timer) clearTimeout(timer);
      if (fileWatcher) fileWatcher.close();
      if (dirWatcher) dirWatcher.close();
      fsSync.unwatchFile(filePath);
    },
  };
};
