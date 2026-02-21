import { useCallback, useEffect, useRef, useState } from 'react';
import { IconPlus, IconEllipsis, IconFile } from '../Icons';
import type { AppState, LayoutProps } from '../types';
import { ensureSection, filteredTasks } from '../lib/tasks';
import { ContentHeader } from './ContentHeader';
import { TaskList } from './TaskList';
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
  onReorderTask,
  onSaveTask,
}: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [addTitle, setAddTitle] = useState('');
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

  const onToggleTaskWithDelay = useCallback(
    async (taskId: string) => {
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
    },
    [app.section, currentSection, setApp],
  );

  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const getVisibleTasks = () => {
    if (!currentSection) return [];
    const base = filteredTasks(currentSection, app.filter);
    if (app.filter === 'open') {
      const pending = currentSection.tasks.filter(
        (t) => t.done && app.pendingRemovals.has(t.id),
      );
      return [...base, ...pending];
    }
    return base;
  };

  const ellipsisMenu = (
    <div className="relative">
      <button className="btn btn-ghost btn-small" onClick={() => setMenuOpen(true)}>
        <IconEllipsis size={16} />
      </button>
      {menuOpen && (
        <AppleMenu
          menuOpen={menuOpen}
          menuClosing={menuClosing}
          menuRef={menuRef}
          theme={theme}
          page={app.page}
          onSetPage={onSetPage}
          onSetThemeFamily={onSetThemeFamily}
          onClose={closeMenu}
        />
      )}
    </div>
  );

  if (!app.settings?.markdownPath) {
    return (
      <div data-apple-app className="h-full flex flex-col bg-bg overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="empty">
            <div className="empty-card">
              <IconFile size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h2>Pick a markdown file</h2>
              <p>Zuri reads and writes a single .md file. Changes sync live.</p>
              <button className="btn btn-primary" onClick={() => void onPickMarkdown()}>
                Choose file...
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div data-apple-app className="h-full flex flex-col bg-bg overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        {app.page === 'tasks' ? (
          <>
            <ContentHeader
              title={currentSection?.name ?? 'Tasks'}
              filter={app.filter}
              onSetFilter={(filter) => setApp((prev) => ({ ...prev, filter }))}
              right={ellipsisMenu}
            />
            <TaskList
              tasks={getVisibleTasks()}
              section={currentSection}
              settings={app.settings}
              pendingRemovals={app.pendingRemovals}
              focusedTaskId={app.focusedTaskId}
              onToggle={onToggleTaskWithDelay}
              onEdit={onEditTask}
              onReorder={onReorderTask}
              sectionName={app.section}
            />
            {app.showAddInput && (
              <div data-task-list className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-[auto_1fr] gap-[10px] items-center py-[10px] px-3 mb-1.5 bg-surface border border-edge rounded-[8px] shadow-[var(--inner-highlight,none),0_1px_2px_rgba(0,0,0,0.05)] animate-[appleAddTaskEnter_200ms_ease-out]">
                  <div
                    data-task-check
                    className="w-[18px] h-[18px] border-[1.5px] border-edge-strong rounded-sm bg-transparent grid place-items-center shrink-0 opacity-40"
                  />
                  <input
                    className="bg-transparent border-none text-text text-[13px] font-medium outline-none w-full p-0 placeholder:text-subtle placeholder:font-normal"
                    placeholder="Add a task..."
                    autoComplete="off"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = addTitle.trim();
                        if (value) {
                          void onAddTask(value);
                          setAddTitle('');
                        }
                      }
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setAddTitle('');
                        setApp((prev) => ({ ...prev, showAddInput: false }));
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div data-content-header className="flex flex-col gap-[10px] p-3 bg-bg border-b border-edge">
              <div className="flex items-center justify-between">
                <h1 data-content-title className="text-[18px] font-semibold">Settings</h1>
                {ellipsisMenu}
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

      {app.page === 'tasks' && (
        <button
          className="absolute bottom-4 right-4 z-40 w-12 h-12 p-0 border-none rounded-full bg-accent text-white shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_0.5px_0_rgba(255,255,255,0.2)] cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
