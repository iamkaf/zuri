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
import { cn } from '../lib/cn';
import { getThemeFamily } from '../lib/theme';
import { filteredTasks } from '../lib/tasks';
import { ContentHeader } from './ContentHeader';
import { TaskList } from './TaskList';
import { AddTaskForm } from './AddTaskForm';
import { SettingsForm } from './SettingsForm';
import { EditTaskModal } from './EditTaskModal';

const navItemClass = (active: boolean) =>
  cn(
    'relative flex items-center justify-center w-full h-10',
    'border-none bg-transparent cursor-pointer transition-all',
    '[&>svg]:w-5 [&>svg]:h-5',
    active ? 'text-accent' : 'text-muted hover:text-text',
  );

const themeItemClass = (active: boolean) =>
  cn(
    'relative flex items-center justify-center w-full h-9',
    'border-none bg-transparent cursor-pointer transition-all',
    '[&>svg]:w-[18px] [&>svg]:h-[18px]',
    active ? 'text-accent' : 'text-muted hover:text-text',
  );

const ActiveIndicator = () => (
  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent rounded-r-sm" />
);

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
    <aside className="flex flex-col h-full bg-bg border-r border-edge">
      <nav className="flex-1 flex flex-col pt-3">
        <button
          className={navItemClass(app.page === 'tasks')}
          onClick={() => onSetPage('tasks')}
          title="Tasks"
        >
          {app.page === 'tasks' && <ActiveIndicator />}
          <IconTask />
        </button>
        <button
          className={navItemClass(app.page === 'settings')}
          onClick={() => onSetPage('settings')}
          title="Settings"
        >
          {app.page === 'settings' && <ActiveIndicator />}
          <IconSettings />
        </button>
      </nav>
      <div className="flex flex-col pb-2 border-t border-edge pt-2">
        <button
          className={themeItemClass(getThemeFamily(theme) === 'apple')}
          onClick={() => void onSetThemeFamily('apple')}
          title="Apple Theme"
        >
          {getThemeFamily(theme) === 'apple' && <ActiveIndicator />}
          <IconApple />
        </button>
        <button
          className={themeItemClass(getThemeFamily(theme) === 'windows')}
          onClick={() => void onSetThemeFamily('windows')}
          title="Windows Theme"
        >
          {getThemeFamily(theme) === 'windows' && <ActiveIndicator />}
          <IconWindows />
        </button>
        <button
          className={themeItemClass(getThemeFamily(theme) === 'open')}
          onClick={() => void onSetThemeFamily('open')}
          title="Open Theme"
        >
          {getThemeFamily(theme) === 'open' && <ActiveIndicator />}
          <IconSparkle />
        </button>
      </div>
    </aside>
  );

  if (!app.settings?.markdownPath && app.page === 'tasks') {
    return (
      <div className="h-full grid grid-cols-[48px_1fr] bg-bg">
        {sidebar}
        <main className="flex flex-col h-full overflow-hidden bg-bg">
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
    <div className="h-full grid grid-cols-[48px_1fr] bg-bg">
      {sidebar}

      <main className="flex flex-col h-full overflow-hidden bg-bg">
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
