import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task, ThemeId, ZuriSettings } from './preload';
import type { AppState, Page } from './types';
import { ensureSection, getThemeFamily, cycleTheme } from './theme';
import { AppleLayout } from './components/AppleLayout';
import { StandardLayout } from './components/StandardLayout';

const initialState: AppState = {
  settings: null,
  model: { sections: [] },
  page: 'tasks',
  section: null,
  filter: 'open',
  editing: null,
  showAddInput: false,
  pendingRemovals: new Set(),
};

function App() {
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

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        const el = document.activeElement;
        const tag = el?.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          const isAddTask =
            (el as HTMLInputElement).placeholder === 'Add a task...';
          if (!isAddTask) return;
        }
        e.preventDefault();
        setApp((prev) => ({ ...prev, page: 'tasks', showAddInput: true }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = window.zuri.doc.onChanged(async () => {
      if (!settingsRef.current?.markdownPath) return;
      const model = await window.zuri.doc.get();
      setApp((prev) => ({
        ...prev,
        model,
        section: ensureSection(model, prev.section),
      }));
    });
    return unsubscribe;
  }, []);

  const currentSection =
    app.section == null
      ? null
      : app.model.sections.find((s) => s.name === app.section) ?? null;

  const onSetPage = (page: Page) => {
    setApp((prev) => ({ ...prev, page, showAddInput: false }));
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
    if (!section || !currentSection) return;
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
      newTheme = isDark ? `${family}-dark` as ThemeId : `${family}-light` as ThemeId;
    }
    await onPatchSettings({ theme: newTheme });
  };

  const theme = app.settings?.theme ?? 'open-dark';
  const isApple = getThemeFamily(theme) === 'apple';

  if (isApple) {
    return (
      <AppleLayout
        app={app}
        setApp={setApp}
        theme={theme}
        currentSection={currentSection}
        onSetPage={onSetPage}
        onSetThemeFamily={onSetThemeFamily}
        onPickMarkdown={onPickMarkdown}
        onPatchSettings={onPatchSettings}
        onToggleTask={onToggleTask}
        onEditTask={onEditTask}
        onAddTask={onAddTask}
        onAddSection={onAddSection}
        onReorderTask={onReorderTask}
        onSaveTask={onSaveTask}
      />
    );
  }

  return (
    <StandardLayout
      app={app}
      setApp={setApp}
      theme={theme}
      currentSection={currentSection}
      onSetPage={onSetPage}
      onSetThemeFamily={onSetThemeFamily}
      onPickMarkdown={onPickMarkdown}
      onPatchSettings={onPatchSettings}
      onToggleTask={onToggleTask}
      onEditTask={onEditTask}
      onAddTask={onAddTask}
      onAddSection={onAddSection}
      onReorderTask={onReorderTask}
      onSaveTask={onSaveTask}
    />
  );
}

export default App;
