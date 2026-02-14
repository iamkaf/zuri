import {
  IconTask,
  IconSettings,
  IconApple,
  IconWindows,
  IconSparkle,
  IconPlus,
} from '../Icons';
import type { LayoutProps } from '../types';
import { getThemeFamily } from '../theme';
import { TasksContent } from './TasksContent';
import { SettingsForm } from './SettingsForm';
import { EditTaskModal } from './EditTaskModal';

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
  return (
    <div className="app">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${app.page === 'tasks' ? 'isActive' : ''}`}
            onClick={() => onSetPage('tasks')}
            title="Tasks"
          >
            <IconTask />
          </button>
          <button
            className={`sidebar-item ${app.page === 'settings' ? 'isActive' : ''}`}
            onClick={() => onSetPage('settings')}
            title="Settings"
          >
            <IconSettings />
          </button>
        </nav>
        <div className="sidebar-themes">
          <button
            className={`sidebar-item ${getThemeFamily(theme) === 'apple' ? 'isActive' : ''}`}
            onClick={() => void onSetThemeFamily('apple')}
            title="Apple Theme"
          >
            <IconApple />
          </button>
          <button
            className={`sidebar-item ${getThemeFamily(theme) === 'windows' ? 'isActive' : ''}`}
            onClick={() => void onSetThemeFamily('windows')}
            title="Windows Theme"
          >
            <IconWindows />
          </button>
          <button
            className={`sidebar-item ${getThemeFamily(theme) === 'open' ? 'isActive' : ''}`}
            onClick={() => void onSetThemeFamily('open')}
            title="Open Theme"
          >
            <IconSparkle />
          </button>
        </div>
      </aside>

      <main className="main">
        {app.page === 'tasks' ? (
          <TasksContent
            app={app}
            currentSection={currentSection}
            onPickMarkdown={onPickMarkdown}
            onSetFilter={(filter) => setApp((prev) => ({ ...prev, filter }))}
            onToggleTask={onToggleTask}
            onEditTask={onEditTask}
            onAddTask={onAddTask}
            onAddSection={onAddSection}
            onReorderTask={onReorderTask}
            isApple={false}
          />
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
