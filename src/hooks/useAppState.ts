import { useCallback, useRef, useState } from 'react';
import type { Task, ThemeId, ZuriSettings } from '../preload';
import type { AppState, Page } from '../types';
import { ensureSection } from '../lib/tasks';
import { getThemeFamily, cycleTheme } from '../lib/theme';

const initialState: AppState = {
  settings: null,
  model: { sections: [] },
  page: 'tasks',
  section: null,
  filter: 'open',
  editing: null,
  showAddInput: false,
  pendingRemovals: new Set(),
  focusedTaskId: null,
};

export function useAppState() {
  const [app, setApp] = useState<AppState>(initialState);
  const settingsRef = useRef<ZuriSettings | null>(null);

  const applyTheme = useCallback((theme: ThemeId) => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const refreshAll = useCallback(async () => {
    const settings = await window.zuri.settings.get();
    settingsRef.current = settings;
    applyTheme(settings.theme);

    if (!settings.markdownPath) {
      setApp((prev) => ({
        ...prev,
        settings,
        model: { sections: [] },
        page: 'settings',
        section: null,
      }));
      return;
    }

    const model = await window.zuri.doc.get();
    setApp((prev) => ({
      ...prev,
      settings,
      model,
      section: ensureSection(model, prev.section),
    }));
  }, [applyTheme]);

  const onSetPage = (page: Page) => {
    setApp((prev) => ({ ...prev, page, showAddInput: false, focusedTaskId: null }));
  };

  const onPickMarkdown = async () => {
    await window.zuri.settings.pickMarkdownFile();
    await refreshAll();
  };

  const onToggleTask = async (taskId: string) => {
    const section = app.section;
    if (!section) return;
    const model = await window.zuri.doc.toggleTask(section, taskId);
    setApp((prev) => ({
      ...prev,
      model,
      section: ensureSection(model, prev.section),
    }));
  };

  const onEditTask = (taskId: string) => {
    const section = app.section;
    if (!section) return;
    const currentSection = app.model.sections.find((s) => s.name === section) ?? null;
    if (!currentSection) return;
    const task = currentSection.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setApp((prev) => ({ ...prev, editing: { section, task } }));
  };

  const onAddSection = async () => {
    const name = prompt('New section name?');
    const normalized = name?.trim();
    if (!normalized) return;
    const model = await window.zuri.doc.addSection(normalized);
    setApp((prev) => ({
      ...prev,
      model,
      section: normalized,
    }));
  };

  const onAddTask = async (title: string) => {
    const section = app.section ?? app.model.sections[0]?.name ?? 'Inbox';
    const model = await window.zuri.doc.addTask(section, title);
    setApp((prev) => ({
      ...prev,
      model,
      section: ensureSection(model, prev.section),
      showAddInput: false,
    }));
  };

  const onPatchSettings = async (patch: Partial<ZuriSettings>) => {
    const settings = await window.zuri.settings.set(patch);
    settingsRef.current = settings;
    applyTheme(settings.theme);
    setApp((prev) => ({ ...prev, settings }));
  };

  const onSaveTask = async (section: string, task: Task, patch: Partial<Task>) => {
    const model = await window.zuri.doc.updateTask(section, task.id, patch);
    setApp((prev) => ({
      ...prev,
      model,
      editing: null,
      section: ensureSection(model, prev.section),
    }));
  };

  const onReorderTask = async (section: string, fromIndex: number, toIndex: number) => {
    const model = await window.zuri.doc.reorderTask(section, fromIndex, toIndex);
    setApp((prev) => ({
      ...prev,
      model,
      section: ensureSection(model, prev.section),
    }));
  };

  const onSetThemeFamily = async (family: 'apple' | 'windows' | 'open') => {
    const current = app.settings?.theme ?? 'open-dark';
    const currentFamily = getThemeFamily(current);
    let newTheme: ThemeId;
    if (family === currentFamily) {
      newTheme = cycleTheme(current, family);
    } else {
      const isDark = current.endsWith('-dark');
      newTheme = isDark ? (`${family}-dark` as ThemeId) : (`${family}-light` as ThemeId);
    }
    await onPatchSettings({ theme: newTheme });
  };

  return {
    app,
    setApp,
    settingsRef,
    refreshAll,
    onSetPage,
    onPickMarkdown,
    onToggleTask,
    onEditTask,
    onAddSection,
    onAddTask,
    onPatchSettings,
    onSaveTask,
    onReorderTask,
    onSetThemeFamily,
  };
}
