import { useCallback, useEffect, useRef, useState } from 'react';
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
  return model.sections.some((section) => section.name === current)
    ? current
    : model.sections[0]?.name ?? null;
};

const filteredTasks = (section: Section, filter: TaskFilter): Task[] => {
  if (filter === 'all') return section.tasks;
  if (filter === 'done') return section.tasks.filter((task) => task.done);
  return section.tasks.filter((task) => !task.done);
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
      : app.model.sections.find((section) => section.name === app.section) ?? null;

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
    const task = currentSection.tasks.find((item) => item.id === taskId);
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

  const mdPath = app.settings?.markdownPath ?? null;

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="glyph" aria-hidden="true"></div>
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
          <TasksPage
            app={app}
            currentSection={currentSection}
            onPickMarkdown={onPickMarkdown}
            onSetSection={(section) => setApp((prev) => ({ ...prev, section }))}
            onSetFilter={(filter) => setApp((prev) => ({ ...prev, filter }))}
            onToggleTask={onToggleTask}
            onEditTask={onEditTask}
            onAddSection={onAddSection}
            onAddTask={onAddTask}
          />
        ) : null}
        {app.page === 'settings' ? (
          <SettingsPage
            settings={app.settings}
            onPickMarkdown={onPickMarkdown}
            onPatchSettings={onPatchSettings}
          />
        ) : null}
      </main>

      <div className="modal" aria-hidden={app.editing ? 'false' : 'true'}>
        <EditTaskModal
          editing={app.editing}
          settings={app.settings}
          onClose={() => setApp((prev) => ({ ...prev, editing: null }))}
          onSave={onSaveTask}
        />
      </div>
    </div>
  );
}

type TasksPageProps = {
  app: AppState;
  currentSection: Section | null;
  onPickMarkdown: () => Promise<void>;
  onSetSection: (section: string | null) => void;
  onSetFilter: (filter: TaskFilter) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onAddSection: () => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
};

function TasksPage({
  app,
  currentSection,
  onPickMarkdown,
  onSetSection,
  onSetFilter,
  onToggleTask,
  onEditTask,
  onAddSection,
  onAddTask,
}: TasksPageProps) {
  const [title, setTitle] = useState('');

  if (!app.settings?.markdownPath) {
    return (
      <section id="pageTasks">
        <div className="empty">
          <div className="emptyCard">
            <h2>Pick a markdown file to start</h2>
            <p>
              Zuri reads and writes a single .md file. Changes made elsewhere update here live.
            </p>
            <button className="cta" onClick={() => void onPickMarkdown()}>
              Choose file...
            </button>
          </div>
        </div>
      </section>
    );
  }

  const rows =
    currentSection == null ? [] : filteredTasks(currentSection, app.filter);

  return (
    <section id="pageTasks">
      <div className="tabsRow">
        <div className="tabs" role="tablist">
          {app.model.sections.map((section) => (
            <button
              key={section.name}
              className={`tab ${section.name === app.section ? 'isActive' : ''}`}
              onClick={() => onSetSection(section.name)}
            >
              {section.name}
            </button>
          ))}
        </div>
        <button className="small" onClick={() => void onAddSection()}>
          + Section
        </button>
      </div>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Filter">
          <button
            className={`segBtn ${app.filter === 'open' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('open')}
          >
            Open
          </button>
          <button
            className={`segBtn ${app.filter === 'all' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('all')}
          >
            All
          </button>
          <button
            className={`segBtn ${app.filter === 'done' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('done')}
          >
            Done
          </button>
        </div>

        <form
          className="add"
          onSubmit={(event) => {
            event.preventDefault();
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
            onChange={(event) => setTitle(event.target.value)}
          />
          <button className="cta" type="submit">
            Add
          </button>
        </form>
      </div>

      <div className="list">
        {currentSection == null ? (
          <div className="hint">Create your first section.</div>
        ) : rows.length === 0 ? (
          <div className="hint">No tasks here yet.</div>
        ) : (
          rows.map((task) => {
            const pri =
              app.settings?.features.priority && task.priority ? (
                <span className={`pill pri pri-${task.priority}`}>{task.priority}</span>
              ) : null;
            const eff =
              app.settings?.features.effort && task.effort ? (
                <span className="pill eff">{task.effort}</span>
              ) : null;
            const due = task.due ? <span className="pill due">{task.due}</span> : null;

            return (
              <div key={task.id} className={`task ${task.done ? 'isDone' : ''}`}>
                <button
                  className="check"
                  aria-label="Toggle done"
                  onClick={() => void onToggleTask(task.id)}
                >
                  {task.done ? '✓' : ''}
                </button>
                <div className="tMain">
                  <div className="tTitle">{task.title}</div>
                  <div className="tMeta">
                    {pri}
                    {eff}
                    {due}
                  </div>
                </div>
                <button className="ghost" aria-label="Edit" onClick={() => onEditTask(task.id)}>
                  Edit
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

type SettingsPageProps = {
  settings: ZuriSettings | null;
  onPickMarkdown: () => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
};

function SettingsPage({ settings, onPickMarkdown, onPatchSettings }: SettingsPageProps) {
  if (!settings) return null;

  const options = Object.keys(themeLabel) as ThemeId[];

  return (
    <section id="pageSettings">
      <div className="settings">
        <section className="card">
          <h2>Setup</h2>
          <div className="row">
            <div className="label">Markdown file</div>
            <div className="value">
              <div className="path">{settings.markdownPath ? settings.markdownPath : <em>none</em>}</div>
              <button className="small" onClick={() => void onPickMarkdown()}>
                Choose...
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Features</h2>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.features.priority}
              onChange={(event) =>
                void onPatchSettings({
                  features: { ...settings.features, priority: event.target.checked },
                })
              }
            />{' '}
            Priorities
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.features.effort}
              onChange={(event) =>
                void onPatchSettings({
                  features: { ...settings.features, effort: event.target.checked },
                })
              }
            />{' '}
            Effort
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.features.notifications}
              onChange={(event) =>
                void onPatchSettings({
                  features: { ...settings.features, notifications: event.target.checked },
                })
              }
            />{' '}
            Notifications
          </label>
          <div className="row">
            <div className="label">Notify time</div>
            <div className="value">
              <input
                className="input time"
                type="time"
                value={settings.notificationTime}
                onChange={(event) =>
                  void onPatchSettings({
                    notificationTime: event.target.value || '00:00',
                  })
                }
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Theme</h2>
          <div className="row">
            <div className="label">Appearance</div>
            <div className="value">
              <select
                className="input"
                value={settings.theme}
                onChange={(event) =>
                  void onPatchSettings({ theme: event.target.value as ThemeId })
                }
              >
                {options.map((theme) => (
                  <option key={theme} value={theme}>
                    {themeLabel[theme]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <p className="foot">
          Settings are stored at <code>~/.zuri/settings.json</code>.
        </p>
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

  const priorityOptions = ['P0', 'P1', 'P2', 'P3'] as const;
  const effortOptions = ['XS', 'S', 'M', 'L', 'XL'] as const;

  const isPriority = (value: string): value is Task['priority'] =>
    (priorityOptions as readonly string[]).includes(value);

  const isEffort = (value: string): value is Task['effort'] =>
    (effortOptions as readonly string[]).includes(value);

  return (
    <>
      <div className="backdrop" onClick={onClose}></div>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheetHead">
          <div>
            <div className="sheetTitle">Edit task</div>
            <div className="sheetSub">{editing.section}</div>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="sheetBody">
          <label className="field">
            <span>Title</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <div className="grid2">
            <label className={`field ${canPriority ? '' : 'isDisabled'}`}>
              <span>Priority</span>
              <select
                className="input"
                disabled={!canPriority}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="">-</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </label>

            <label className={`field ${canEffort ? '' : 'isDisabled'}`}>
              <span>Effort</span>
              <select
                className="input"
                disabled={!canEffort}
                value={effort}
                onChange={(event) => setEffort(event.target.value)}
              >
                <option value="">-</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Due date</span>
            <input
              className="input"
              placeholder="YYYY-MM-DD"
              value={due}
              onChange={(event) => setDue(event.target.value)}
            />
          </label>

          <div className="sheetActions">
            <button
              className="cta"
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
    </>
  );
}

export default App;
