import { useCallback, useEffect, useRef, useState } from 'react';
import { IconPlus, IconEllipsis, IconSettings, IconTask } from '../Icons';
import type { ZuriSettings } from '../preload';
import type { AppState, LayoutProps } from '../types';
import { ensureSection } from '../theme';
import { TasksContent } from './TasksContent';
import { SettingsForm } from './SettingsForm';
import { EditTaskModal } from './EditTaskModal';
import { AppleMenu } from './AppleMenu';

export function AppleLayout({
  app,
  setApp,
  theme,
  currentSection,
  onSetPage,
  onSetThemeFamily,
  onPickMarkdown,
  onPatchSettings,
  onEditTask,
  onAddTask,
  onAddSection,
  onReorderTask,
  onSaveTask,
}: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const closeMenu = useCallback(() => {
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 100);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [menuOpen, closeMenu]);

  const onToggleTaskWithDelay = useCallback(async (taskId: string) => {
    const section = app.section;
    if (!section) return;

    const task = currentSection?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.done) {
      const timer = pendingTimersRef.current.get(taskId);
      if (timer) {
        clearTimeout(timer);
        pendingTimersRef.current.delete(taskId);
        setApp((prev: AppState) => {
          const newSet = new Set(prev.pendingRemovals);
          newSet.delete(taskId);
          return { ...prev, pendingRemovals: newSet };
        });
      }
      const model = await window.zuri.doc.toggleTask(section, taskId);
      setApp((prev: AppState) => ({
        ...prev,
        model,
        section: ensureSection(model, prev.section),
      }));
    } else {
      const model = await window.zuri.doc.toggleTask(section, taskId);
      setApp((prev: AppState) => {
        const newSet = new Set(prev.pendingRemovals);
        newSet.add(taskId);
        return {
          ...prev,
          model,
          section: ensureSection(model, prev.section),
          pendingRemovals: newSet,
        };
      });
      const timer = setTimeout(() => {
        setApp((prev: AppState) => {
          const newSet = new Set(prev.pendingRemovals);
          newSet.delete(taskId);
          return { ...prev, pendingRemovals: newSet };
        });
        pendingTimersRef.current.delete(taskId);
      }, 1500);
      pendingTimersRef.current.set(taskId, timer);
    }
  }, [app.section, currentSection, setApp]);

  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <div className="app apple-app">
      <main className="main apple-main">
        {app.page === 'tasks' ? (
          <TasksContent
            app={app}
            setApp={setApp}
            currentSection={currentSection}
            onPickMarkdown={onPickMarkdown}
            onSetFilter={(filter) => setApp((prev) => ({ ...prev, filter }))}
            onToggleTask={onToggleTaskWithDelay}
            onEditTask={onEditTask}
            onAddTask={onAddTask}
            onAddSection={onAddSection}
            onReorderTask={onReorderTask}
            isApple
            onOpenMenu={() => setMenuOpen(true)}
            onCloseMenu={closeMenu}
            menuOpen={menuOpen}
            menuClosing={menuClosing}
            menuRef={menuRef}
            theme={theme}
            onSetPage={onSetPage}
            onSetThemeFamily={onSetThemeFamily}
          />
        ) : (
          <>
            <div className="content-header">
              <div className="content-header-top">
                <h1 className="content-title">Settings</h1>
                <div className="apple-menu-trigger">
                  <button className="btn btn-ghost btn-small" onClick={() => setMenuOpen(true)}>
                    <IconEllipsis size={16} />
                  </button>
                  {menuOpen && (
                    <AppleMenu
                      menuOpen={menuOpen}
                      menuClosing={menuClosing}
                      menuRef={menuRef}
                      theme={theme}
                      page="settings"
                      onSetPage={onSetPage}
                      onSetThemeFamily={onSetThemeFamily}
                      onClose={closeMenu}
                    />
                  )}
                </div>
              </div>
            </div>
            {app.settings && (
              <SettingsForm
                settings={app.settings}
                onPickMarkdown={onPickMarkdown}
                onPatchSettings={onPatchSettings}
              />
            )}
          </>
        )}
      </main>

      {app.page === 'tasks' && app.settings?.markdownPath && (
        <button
          className="apple-fab"
          onClick={() => setApp((prev) => ({ ...prev, showAddInput: !prev.showAddInput }))}
          aria-label="Add task"
        >
          <IconPlus size={20} />
        </button>
      )}

      <EditTaskModal
        editing={app.editing}
        settings={app.settings}
        onClose={() => setApp((prev) => ({ ...prev, editing: null }))}
        onSave={onSaveTask}
      />
    </div>
  );
}
