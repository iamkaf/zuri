import {
  IconTask,
  IconSettings,
  IconApple,
  IconWindows,
  IconSparkle,
  IconPlus,
  IconFile,
} from '../Icons';
import type { LayoutProps } from '../types';
import { getThemeFamily } from '../lib/theme';
import { filteredTasks } from '../lib/tasks';
import { ContentHeader } from './ContentHeader';
import { TaskList } from './TaskList';
import { AddTaskForm } from './AddTaskForm';
import { SettingsForm } from './SettingsForm';
import { EditTaskModal } from './EditTaskModal';
import styles from './StandardLayout.module.css';

export function StandardLayout({
  app,
  setApp,
  theme,
  currentSection,
  onSetPage,
  onSetThemeFamily,
  onPickMarkdown,
  onPatchSettings,
  onToggleTask,
  onEditTask,
  onAddTask,
  onAddSection,
  onReorderTask,
  onSaveTask,
}: LayoutProps) {
  const sidebar = (
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        <button
          className={`${styles.sidebarItem}${app.page === 'tasks' ? ` ${styles.isActive}` : ''}`}
          onClick={() => onSetPage('tasks')}
          title="Tasks"
        >
          <IconTask />
        </button>
        <button
          className={`${styles.sidebarItem}${app.page === 'settings' ? ` ${styles.isActive}` : ''}`}
          onClick={() => onSetPage('settings')}
          title="Settings"
        >
          <IconSettings />
        </button>
      </nav>
      <div className={styles.sidebarThemes}>
        <button
          className={`${styles.sidebarItem}${getThemeFamily(theme) === 'apple' ? ` ${styles.isActive}` : ''}`}
          onClick={() => void onSetThemeFamily('apple')}
          title="Apple Theme"
        >
          <IconApple />
        </button>
        <button
          className={`${styles.sidebarItem}${getThemeFamily(theme) === 'windows' ? ` ${styles.isActive}` : ''}`}
          onClick={() => void onSetThemeFamily('windows')}
          title="Windows Theme"
        >
          <IconWindows />
        </button>
        <button
          className={`${styles.sidebarItem}${getThemeFamily(theme) === 'open' ? ` ${styles.isActive}` : ''}`}
          onClick={() => void onSetThemeFamily('open')}
          title="Open Theme"
        >
          <IconSparkle />
        </button>
      </div>
    </aside>
  );

  if (!app.settings?.markdownPath && app.page === 'tasks') {
    return (
      <div className={styles.app}>
        {sidebar}
        <main className={styles.main}>
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

  const tasks = currentSection ? filteredTasks(currentSection, app.filter) : [];

  const sectionButton = (
    <button className="btn btn-small" onClick={() => void onAddSection()}>
      <IconPlus size={14} />
      Section
    </button>
  );

  return (
    <div className={styles.app}>
      {sidebar}

      <main className={styles.main}>
        {app.page === 'tasks' ? (
          <>
            <ContentHeader
              title={currentSection?.name ?? 'Tasks'}
              filter={app.filter}
              onSetFilter={(filter) => setApp((prev) => ({ ...prev, filter }))}
              right={sectionButton}
            />
            <AddTaskForm
              onAdd={onAddTask}
              autoFocusTrigger={app.showAddInput}
              onAutoFocusConsumed={() => setApp((prev) => ({ ...prev, showAddInput: false }))}
            />
            <TaskList
              tasks={tasks}
              section={currentSection}
              settings={app.settings}
              pendingRemovals={new Set()}
              focusedTaskId={app.focusedTaskId}
              onToggle={onToggleTask}
              onEdit={onEditTask}
              onReorder={onReorderTask}
              sectionName={app.section}
            />
          </>
        ) : app.settings ? (
          <SettingsForm
            settings={app.settings}
            onPickMarkdown={onPickMarkdown}
            onPatchSettings={onPatchSettings}
          />
        ) : null}
      </main>

      <EditTaskModal
        editing={app.editing}
        settings={app.settings}
        onClose={() => setApp((prev) => ({ ...prev, editing: null }))}
        onSave={onSaveTask}
      />
    </div>
  );
}
