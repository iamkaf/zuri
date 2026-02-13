import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconCheck,
  IconPlus,
  IconSettings,
  IconTask,
  IconFolder,
  IconEdit,
  IconClose,
  IconCalendar,
  IconFlag,
  IconClock,
  IconFile,
  IconBell,
} from './Icons';
import type { DocModel, Section, Task, ThemeId, ZuriSettings } from './preload';

type Page = 'tasks' | 'settings';
type TaskFilter = 'open' | 'all' | 'done';

type EditingState = {
  section: string;
  task: Task;
};

type AppState = {
  settings: ZuriSettings | null;
  model: DocModel;
  page: Page;
  section: string | null;
  filter: TaskFilter;
  editing: EditingState | null;
};

const themeLabel: Record<ThemeId, string> = {
  'open-light': 'Open Light',
  'open-dark': 'Open Dark',
  'windows-light': 'Windows Light',
  'windows-dark': 'Windows Dark',
  'apple-light': 'Apple Light',
  'apple-dark': 'Apple Dark',
};

const initialState: AppState = {
  settings: null,
  model: { sections: [] },
  page: 'tasks',
  section: null,
  filter: 'open',
  editing: null,
};

const ensureSection = (model: DocModel, current: string | null): string | null => {
  if (!current) {
    return model.sections[0]?.name ?? null;
  }
  return model.sections.some((s) => s.name === current)
    ? current
    : model.sections[0]?.name ?? null;
};

const filteredTasks = (section: Section, filter: TaskFilter): Task[] => {
  if (filter === 'all') return section.tasks;
  if (filter === 'done') return section.tasks.filter((t) => t.done);
  return section.tasks.filter((t) => !t.done);
};

const isWindowsTheme = (theme: ThemeId) => theme.startsWith('windows-');

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
    setApp((prev) => ({ ...prev, page }));
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

  const theme = app.settings?.theme ?? 'open-dark';
  const mdPath = app.settings?.markdownPath ?? null;
  const useNavRail = isWindowsTheme(theme);

  if (useNavRail) {
    return (
      <div className="app">
        <Sidebar app={app} onSetPage={onSetPage} />
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
            />
          ) : (
            <SettingsContent
              settings={app.settings}
              onPickMarkdown={onPickMarkdown}
              onPatchSettings={onPatchSettings}
            />
          )}
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

  return (
    <OpenLayout
      app={app}
      currentSection={currentSection}
      mdPath={mdPath}
      onSetPage={onSetPage}
      onPickMarkdown={onPickMarkdown}
      onSetSection={(section) => setApp((prev) => ({ ...prev, section }))}
      onSetFilter={(filter) => setApp((prev) => ({ ...prev, filter }))}
      onToggleTask={onToggleTask}
      onEditTask={onEditTask}
      onAddSection={onAddSection}
      onAddTask={onAddTask}
      onPatchSettings={onPatchSettings}
    >
      <EditTaskModal
        editing={app.editing}
        settings={app.settings}
        onClose={() => setApp((prev) => ({ ...prev, editing: null }))}
        onSave={onSaveTask}
      />
    </OpenLayout>
  );
}

type SidebarProps = {
  app: AppState;
  onSetPage: (page: Page) => void;
};

function Sidebar({ app, onSetPage }: SidebarProps) {
  return (
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
    </aside>
  );
}

type TasksContentProps = {
  app: AppState;
  currentSection: Section | null;
  onPickMarkdown: () => Promise<void>;
  onSetFilter: (filter: TaskFilter) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onAddTask: (title: string) => Promise<void>;
};

function TasksContent({
  app,
  currentSection,
  onPickMarkdown,
  onSetFilter,
  onToggleTask,
  onEditTask,
  onAddTask,
}: TasksContentProps) {
  const [title, setTitle] = useState('');

  if (!app.settings?.markdownPath) {
    return (
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
    );
  }

  const rows = currentSection == null ? [] : filteredTasks(currentSection, app.filter);

  return (
    <>
      <div className="content-header">
        <div className="content-header-top">
          <h1 className="content-title">{currentSection?.name ?? 'Tasks'}</h1>
        </div>
        <div className="filters">
          <button
            className={`filter-btn ${app.filter === 'open' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('open')}
          >
            Open
          </button>
          <button
            className={`filter-btn ${app.filter === 'all' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${app.filter === 'done' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('done')}
          >
            Done
          </button>
        </div>
        <form
          className="add-task"
          onSubmit={(e) => {
            e.preventDefault();
            const value = title.trim();
            if (!value) return;
            void onAddTask(value);
            setTitle('');
          }}
        >
          <input
            className="input"
            placeholder="Add a task..."
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            <IconPlus size={16} />
            Add
          </button>
        </form>
      </div>

      <div className="task-list">
        {currentSection == null ? (
          <div className="hint">
            <IconFolder size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>Create your first section to get started.</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <IconCheck className="empty-icon" size={64} />
            <div className="empty-title">All caught up!</div>
            <div className="empty-text">No tasks to show. Add one above.</div>
          </div>
        ) : (
          rows.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              settings={app.settings}
              onToggle={onToggleTask}
              onEdit={onEditTask}
            />
          ))
        )}
      </div>
    </>
  );
}

type TaskRowProps = {
  task: Task;
  settings: ZuriSettings | null;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
};

function TaskRow({ task, settings, onToggle, onEdit }: TaskRowProps) {
  const pri =
    settings?.features.priority && task.priority ? (
      <span className={`pill pri-${task.priority}`}>
        <IconFlag size={12} />
        {task.priority}
      </span>
    ) : null;
  const eff =
    settings?.features.effort && task.effort ? (
      <span className="pill effort">
        <IconClock size={12} />
        {task.effort}
      </span>
    ) : null;
  const due = task.due ? (
    <span className="pill due">
      <IconCalendar size={12} />
      {task.due}
    </span>
  ) : null;

  return (
    <div className={`task ${task.done ? 'isDone' : ''}`}>
      <button
        className="task-check"
        aria-label="Toggle done"
        onClick={() => void onToggle(task.id)}
      >
        {task.done ? <IconCheck size={14} /> : null}
      </button>
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {pri}
          {eff}
          {due}
        </div>
      </div>
      <div className="task-actions">
        <button className="btn btn-ghost btn-small" onClick={() => onEdit(task.id)}>
          <IconEdit size={14} />
        </button>
      </div>
    </div>
  );
}

type SettingsContentProps = {
  settings: ZuriSettings | null;
  onPickMarkdown: () => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
};

function SettingsContent({ settings, onPickMarkdown, onPatchSettings }: SettingsContentProps) {
  if (!settings) return null;

  const options = Object.keys(themeLabel) as ThemeId[];

  return (
    <div className="settings">
      <section className="settings-card">
        <h2 className="settings-card-title">File</h2>
        <div className="settings-row">
          <span className="settings-label">Markdown file</span>
          <div className="settings-value">
            <span className="settings-path">
              {settings.markdownPath || <em>none</em>}
            </span>
            <button className="btn btn-small" onClick={() => void onPickMarkdown()}>
              Choose...
            </button>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">Features</h2>
        <label className="toggle">
          <span>Priority levels</span>
          <input
            type="checkbox"
            checked={settings.features.priority}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, priority: e.target.checked },
              })
            }
          />
        </label>
        <label className="toggle">
          <span>Effort estimates</span>
          <input
            type="checkbox"
            checked={settings.features.effort}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, effort: e.target.checked },
              })
            }
          />
        </label>
        <label className="toggle">
          <span>
            <IconBell size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Notifications
          </span>
          <input
            type="checkbox"
            checked={settings.features.notifications}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, notifications: e.target.checked },
              })
            }
          />
        </label>
        {settings.features.notifications && (
          <div className="settings-row">
            <span className="settings-label">Notify at</span>
            <input
              className="input"
              type="time"
              value={settings.notificationTime}
              onChange={(e) =>
                void onPatchSettings({
                  notificationTime: e.target.value || '09:00',
                })
              }
              style={{ width: 120 }}
            />
          </div>
        )}
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">Appearance</h2>
        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <select
            className="input"
            value={settings.theme}
            onChange={(e) => void onPatchSettings({ theme: e.target.value as ThemeId })}
            style={{ width: 160 }}
          >
            {options.map((t) => (
              <option key={t} value={t}>
                {themeLabel[t]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="settings-foot">
        Settings stored at <code>~/.zuri/settings.json</code>
      </p>
    </div>
  );
}

type OpenLayoutProps = {
  app: AppState;
  currentSection: Section | null;
  mdPath: string | null;
  onSetPage: (page: Page) => void;
  onPickMarkdown: () => Promise<void>;
  onSetSection: (section: string | null) => void;
  onSetFilter: (filter: TaskFilter) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onAddSection: () => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
  children: React.ReactNode;
};

function OpenLayout({
  app,
  currentSection,
  mdPath,
  onSetPage,
  onPickMarkdown,
  onSetSection,
  onSetFilter,
  onToggleTask,
  onEditTask,
  onAddSection,
  onAddTask,
  onPatchSettings,
  children,
}: OpenLayoutProps) {
  const [title, setTitle] = useState('');

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="glyph">
            <IconTask size={18} />
          </div>
          <div className="brandText">
            <div className="name">Zuri</div>
            <div className="meta">{mdPath ?? 'No file selected'}</div>
          </div>
        </div>
        <nav className="nav">
          <button
            className={`navBtn ${app.page === 'tasks' ? 'isActive' : ''}`}
            onClick={() => onSetPage('tasks')}
          >
            Tasks
          </button>
          <button
            className={`navBtn ${app.page === 'settings' ? 'isActive' : ''}`}
            onClick={() => onSetPage('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="main">
        {app.page === 'tasks' ? (
          !app.settings?.markdownPath ? (
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
          ) : (
            <OpenTasksPage
              app={app}
              currentSection={currentSection}
              onSetSection={onSetSection}
              onSetFilter={onSetFilter}
              onToggleTask={onToggleTask}
              onEditTask={onEditTask}
              onAddSection={onAddSection}
              onAddTask={onAddTask}
              title={title}
              setTitle={setTitle}
            />
          )
        ) : (
          <SettingsContent
            settings={app.settings}
            onPickMarkdown={onPickMarkdown}
            onPatchSettings={onPatchSettings}
          />
        )}
      </main>

      {children}
    </div>
  );
}

type OpenTasksPageProps = {
  app: AppState;
  currentSection: Section | null;
  onSetSection: (section: string | null) => void;
  onSetFilter: (filter: TaskFilter) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onAddSection: () => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
  title: string;
  setTitle: (title: string) => void;
};

function OpenTasksPage({
  app,
  currentSection,
  onSetSection,
  onSetFilter,
  onToggleTask,
  onEditTask,
  onAddSection,
  onAddTask,
  title,
  setTitle,
}: OpenTasksPageProps) {
  const rows = currentSection == null ? [] : filteredTasks(currentSection, app.filter);

  return (
    <section id="pageTasks">
      <div className="tabsRow" style={{ marginBottom: 12 }}>
        <div className="tabs" role="tablist" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {app.model.sections.map((section) => (
            <button
              key={section.name}
              className={`btn btn-small ${section.name === app.section ? 'btn-primary' : ''}`}
              onClick={() => onSetSection(section.name)}
              style={{ borderRadius: 999 }}
            >
              {section.name}
            </button>
          ))}
        </div>
        <button className="btn btn-small" onClick={() => void onAddSection()}>
          <IconPlus size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div className="filters" style={{ flex: 1 }}>
          <button
            className={`filter-btn ${app.filter === 'open' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('open')}
          >
            Open
          </button>
          <button
            className={`filter-btn ${app.filter === 'all' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${app.filter === 'done' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('done')}
          >
            Done
          </button>
        </div>
      </div>

      <form
        className="add-task"
        onSubmit={(e) => {
          e.preventDefault();
          const value = title.trim();
          if (!value) return;
          void onAddTask(value);
          setTitle('');
        }}
        style={{ marginBottom: 12 }}
      >
        <input
          className="input"
          placeholder="Add a task..."
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <IconPlus size={16} />
          Add
        </button>
      </form>

      <div className="task-list" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {currentSection == null ? (
          <div className="hint">Create your first section.</div>
        ) : rows.length === 0 ? (
          <div className="empty" style={{ height: 200 }}>
            <IconCheck className="empty-icon" size={48} />
            <div className="empty-title" style={{ fontSize: 16 }}>
              All caught up!
            </div>
          </div>
        ) : (
          rows.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              settings={app.settings}
              onToggle={onToggleTask}
              onEdit={onEditTask}
            />
          ))
        )}
      </div>
    </section>
  );
}

type EditTaskModalProps = {
  editing: EditingState | null;
  settings: ZuriSettings | null;
  onClose: () => void;
  onSave: (section: string, task: Task, patch: Partial<Task>) => Promise<void>;
};

function EditTaskModal({ editing, settings, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('');
  const [effort, setEffort] = useState('');
  const [due, setDue] = useState('');

  useEffect(() => {
    if (!editing) return;
    setTitle(editing.task.title);
    setPriority(editing.task.priority ?? '');
    setEffort(editing.task.effort ?? '');
    setDue(editing.task.due ?? '');
  }, [editing]);

  if (!editing || !settings) return null;

  const canPriority = settings.features.priority;
  const canEffort = settings.features.effort;

  const isPriority = (value: string): value is Task['priority'] =>
    ['P0', 'P1', 'P2', 'P3'].includes(value);

  const isEffort = (value: string): value is Task['effort'] =>
    ['XS', 'S', 'M', 'L', 'XL'].includes(value);

  return (
    <div className="modal" aria-hidden="false">
      <div className="backdrop" onClick={onClose}></div>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-head">
          <div>
            <div className="sheet-title">Edit task</div>
            <div className="sheet-subtitle">{editing.section}</div>
          </div>
          <button className="btn btn-ghost btn-small" onClick={onClose}>
            <IconClose size={16} />
          </button>
        </div>

        <div className="sheet-body">
          <label className="sheet-field">
            <span>Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="sheet-grid">
            <label className={`sheet-field ${canPriority ? '' : 'isDisabled'}`}>
              <span>Priority</span>
              <select
                className="input"
                disabled={!canPriority}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">None</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </label>

            <label className={`sheet-field ${canEffort ? '' : 'isDisabled'}`}>
              <span>Effort</span>
              <select
                className="input"
                disabled={!canEffort}
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
              >
                <option value="">None</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </label>
          </div>

          <label className="sheet-field">
            <span>Due date</span>
            <input
              className="input"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>

          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const patch: Partial<Task> = {
                  title: title.trim() || editing.task.title,
                  priority: isPriority(priority) ? priority : undefined,
                  effort: isEffort(effort) ? effort : undefined,
                  due: due.trim() === '' ? undefined : due.trim(),
                };
                void onSave(editing.section, editing.task, patch);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
