import { useEffect, useRef } from 'react';
import type { AppState } from '../types';
import { filteredTasks } from '../lib/tasks';

export function useKeyboard(
  appRef: React.RefObject<AppState>,
  setApp: React.Dispatch<React.SetStateAction<AppState>>,
) {
  // Keep a stable ref to setApp so the effect doesn't re-run
  const setAppRef = useRef(setApp);
  setAppRef.current = setApp;

  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      const tag = el?.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const a = appRef.current;
      const mod = e.metaKey || e.ctrlKey;
      const setState = setAppRef.current;

      // Cmd/Ctrl+N — new task
      if (mod && e.key === 'n') {
        if (isInputFocused()) {
          const el = document.activeElement as HTMLInputElement;
          if (el.placeholder !== 'Add a task...') return;
        }
        e.preventDefault();
        setState((prev) => ({ ...prev, page: 'tasks', showAddInput: true }));
        return;
      }

      // Escape — layered: modal → add-input → hide window
      if (e.key === 'Escape') {
        if (a.editing) {
          e.preventDefault();
          setState((prev) => ({ ...prev, editing: null }));
          return;
        }
        if (a.showAddInput) {
          e.preventDefault();
          setState((prev) => ({ ...prev, showAddInput: false }));
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
        setState((prev) => ({
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
        setState((prev) => ({ ...prev, filter, focusedTaskId: null }));
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
        setState((prev) => ({ ...prev, section: sections[nextIdx].name, focusedTaskId: null }));
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
        setState((prev) => ({ ...prev, focusedTaskId: ids[nextIdx] }));
        return;
      }

      // Enter — edit focused task
      if (e.key === 'Enter' && a.focusedTaskId) {
        e.preventDefault();
        const section = a.model.sections.find((s) => s.name === a.section);
        if (!section) return;
        const task = section.tasks.find((t) => t.id === a.focusedTaskId);
        if (!task) return;
        setState((prev) => ({ ...prev, editing: { section: section.name, task } }));
        return;
      }

      // Space — toggle focused task (click the checkbox to reuse layout toggle logic)
      if (e.key === ' ' && a.focusedTaskId) {
        e.preventDefault();
        const el = document.querySelector(`[data-task-id="${a.focusedTaskId}"] [data-task-check]`);
        if (el instanceof HTMLElement) el.click();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // appRef and setAppRef are stable refs, not reactive deps
  }, []);
}
