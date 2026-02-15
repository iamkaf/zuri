import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task, ThemeId, ZuriSettings } from './preload';
import type { AppState, Page } from './types';
import { ensureSection, getThemeFamily, cycleTheme, filteredTasks } from './theme';
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
  focusedTaskId: null,
};

function App() {
  const [app, setApp] = useState<AppState>(initialState);
  const settingsRef = useRef<ZuriSettings | null>(null);
  const appRef = useRef(app);
  appRef.current = app;

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
    const isInputFocused = () => {
      const el = document.activeElement;
      const tag = el?.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const a = appRef.current;
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+N — new task
      if (mod && e.key === 'n') {
        if (isInputFocused()) {
          const el = document.activeElement as HTMLInputElement;
          if (el.placeholder !== 'Add a task...') return;
        }
        e.preventDefault();
        setApp((prev) => ({ ...prev, page: 'tasks', showAddInput: true }));
        return;
      }

      // Escape — layered: modal → add-input → hide window
      if (e.key === 'Escape') {
        if (a.editing) {
          e.preventDefault();
          setApp((prev) => ({ ...prev, editing: null }));
          return;
        }
        if (a.showAddInput) {
          e.preventDefault();
          setApp((prev) => ({ ...prev, showAddInput: false }));
          return;
        }
        if (isInputFocused()) return;
        e.preventDefault();
        window.zuri.window.hide();
        return;
      }

      // Cmd/Ctrl+, — toggle settings/tasks
      if (mod && e.key === ',') {
        e.preventDefault();
        setApp((prev) => ({
          ...prev,
          page: prev.page === 'settings' ? 'tasks' : 'settings',
          showAddInput: false,
          focusedTaskId: null,
        }));
        return;
      }

      // Cmd/Ctrl+1/2/3 — switch filter (tasks page only)
      if (mod && (e.key === '1' || e.key === '2' || e.key === '3') && a.page === 'tasks') {
        e.preventDefault();
        const filterMap = { '1': 'open', '2': 'all', '3': 'done' } as const;
        const filter = filterMap[e.key as '1' | '2' | '3'];
        setApp((prev) => ({ ...prev, filter, focusedTaskId: null }));
        return;
      }

      // Cmd/Ctrl+[ / ] — section cycling (tasks page only)
      if (mod && (e.key === '[' || e.key === ']') && a.page === 'tasks') {
        const sections = a.model.sections;
        if (sections.length === 0) return;
        e.preventDefault();
        const currentIdx = sections.findIndex((s) => s.name === a.section);
        const delta = e.key === ']' ? 1 : -1;
        const nextIdx = (currentIdx + delta + sections.length) % sections.length;
        setApp((prev) => ({ ...prev, section: sections[nextIdx].name, focusedTaskId: null }));
        return;
      }

      // Bare-key shortcuts — only when no input focused, no modal, tasks page
      if (isInputFocused() || a.editing || a.page !== 'tasks') return;

      // J/↓ and K/↑ — task focus navigation
      if (e.key === 'j' || e.key === 'ArrowDown' || e.key === 'k' || e.key === 'ArrowUp') {
        const section = a.model.sections.find((s) => s.name === a.section);
        if (!section) return;
        const tasks = filteredTasks(section, a.filter);
        if (tasks.length === 0) return;
        e.preventDefault();
        const ids = tasks.map((t) => t.id);
        const currentIdx = a.focusedTaskId ? ids.indexOf(a.focusedTaskId) : -1;
        let nextIdx: number;
        if (e.key === 'j' || e.key === 'ArrowDown') {
          nextIdx = currentIdx < ids.length - 1 ? currentIdx + 1 : currentIdx;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : 0;
        }
        setApp((prev) => ({ ...prev, focusedTaskId: ids[nextIdx] }));
        return;
      }

      // Enter — edit focused task
      if (e.key === 'Enter' && a.focusedTaskId) {
        e.preventDefault();
        const section = a.model.sections.find((s) => s.name === a.section);
        if (!section) return;
        const task = section.tasks.find((t) => t.id === a.focusedTaskId);
        if (!task) return;
        setApp((prev) => ({ ...prev, editing: { section: a.section!, task } }));
        return;
      }

      // Space — toggle focused task (click the checkbox to reuse layout toggle logic)
      if (e.key === ' ' && a.focusedTaskId) {
        e.preventDefault();
        const el = document.querySelector(`[data-task-id="${a.focusedTaskId}"] .task-check`);
        if (el instanceof HTMLElement) el.click();
        return;
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
