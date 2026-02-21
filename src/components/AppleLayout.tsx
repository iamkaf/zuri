import { useCallback, useEffect, useRef, useState } from 'react';
import { IconPlus, IconEllipsis, IconFile } from '../Icons';
import type { AppState, LayoutProps } from '../types';
import { ensureSection, filteredTasks } from '../lib/tasks';
import { ContentHeader } from './ContentHeader';
import { TaskList } from './TaskList';
import { SettingsForm } from './SettingsForm';
import { EditTaskModal } from './EditTaskModal';
import { AppleMenu } from './AppleMenu';
import styles from './AppleLayout.module.css';
import menuStyles from './AppleMenu.module.css';
import headerStyles from './ContentHeader.module.css';
import taskListStyles from './TaskList.module.css';
import taskRowStyles from './TaskRow.module.css';

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
    <div className={menuStyles.appleMenuTrigger}>
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
      <div className={styles.appleApp}>
        <main className={styles.appleMain}>
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
    <div className={styles.appleApp}>
      <main className={styles.appleMain}>
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
              <div className={taskListStyles.taskList}>
                <div className={styles.appleAddTask}>
                  <div className={`${taskRowStyles.taskCheck} ${styles.appleAddTaskCheck}`} />
                  <input
                    className={styles.appleAddTaskInput}
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
            <div className={headerStyles.contentHeader}>
              <div className={headerStyles.contentHeaderTop}>
                <h1 className={headerStyles.contentTitle}>Settings</h1>
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
          className={styles.appleFab}
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
