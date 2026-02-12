import './index.css';
import type { DocModel, Section, Task, ThemeId, ZuriSettings } from './preload';

type Page = 'tasks' | 'settings';

const $ = <T extends Element = Element>(sel: string) =>
  document.querySelector<T>(sel);

const escapeHtml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const themeLabel: Record<ThemeId, string> = {
  'open-light': 'Open Light',
  'open-dark': 'Open Dark',
  'windows-light': 'Windows Light',
  'windows-dark': 'Windows Dark',
  'apple-light': 'Apple Light',
  'apple-dark': 'Apple Dark',
};

const state: {
  settings: ZuriSettings | null;
  model: DocModel;
  page: Page;
  section: string | null;
  filter: 'open' | 'all' | 'done';
  editing: null | { section: string; task: Task };
} = {
  settings: null,
  model: { sections: [] },
  page: 'tasks',
  section: null,
  filter: 'open',
  editing: null,
};

const applyTheme = (theme: ThemeId) => {
  document.documentElement.setAttribute('data-theme', theme);
};

const ensureDefaultSection = () => {
  if (!state.section) {
    state.section = state.model.sections[0]?.name ?? null;
  }
  if (state.section && !state.model.sections.find((s) => s.name === state.section)) {
    state.section = state.model.sections[0]?.name ?? null;
  }
};

const refreshAll = async () => {
  state.settings = await window.zuri.settings.get();
  applyTheme(state.settings.theme);

  if (state.settings.markdownPath) {
    state.model = await window.zuri.doc.get();
  } else {
    state.model = { sections: [] };
    state.page = 'settings';
  }

  ensureDefaultSection();
  render();
};

const currentSection = (): Section | null => {
  if (!state.section) return null;
  return state.model.sections.find((s) => s.name === state.section) ?? null;
};

const filteredTasks = (section: Section): Task[] => {
  if (state.filter === 'all') return section.tasks;
  if (state.filter === 'done') return section.tasks.filter((t) => t.done);
  return section.tasks.filter((t) => !t.done);
};

const renderShell = () => {
  const root = $('#app') as HTMLDivElement;
  if (!root) return;

  const mdPath = state.settings?.markdownPath ?? null;

  root.innerHTML = `
    <div class="app">
      <header class="top">
        <div class="brand">
          <div class="glyph" aria-hidden="true"></div>
          <div class="brandText">
            <div class="name">Zuri</div>
            <div class="meta">${mdPath ? escapeHtml(mdPath) : 'No file selected'}</div>
          </div>
        </div>

        <nav class="nav">
          <button class="navBtn ${state.page === 'tasks' ? 'isActive' : ''}" data-nav="tasks">Tasks</button>
          <button class="navBtn ${state.page === 'settings' ? 'isActive' : ''}" data-nav="settings">Settings</button>
        </nav>
      </header>

      <main class="main">
        ${state.page === 'tasks' ? '<section id="pageTasks"></section>' : ''}
        ${state.page === 'settings' ? '<section id="pageSettings"></section>' : ''}
      </main>

      <div class="modal" id="modal" aria-hidden="true"></div>
    </div>
  `;

  root.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.page = btn.dataset.nav as Page;
      render();
    });
  });
};

const renderTasksPage = () => {
  const page = $('#pageTasks') as HTMLElement | null;
  if (!page) return;

  if (!state.settings?.markdownPath) {
    page.innerHTML = `
      <div class="empty">
        <div class="emptyCard">
          <h2>Pick a markdown file to start</h2>
          <p>Zuri reads and writes a single .md file. Changes made elsewhere update here live.</p>
          <button class="cta" id="pickMd">Choose file…</button>
        </div>
      </div>
    `;
    $('#pickMd')?.addEventListener('click', async () => {
      await window.zuri.settings.pickMarkdownFile();
      await refreshAll();
    });
    return;
  }

  ensureDefaultSection();

  const sections = state.model.sections;
  const sec = currentSection();

  const tabs = sections
    .map((s) => {
      const active = s.name === state.section;
      return `<button class="tab ${active ? 'isActive' : ''}" data-tab="${escapeHtml(s.name)}">${escapeHtml(s.name)}</button>`;
    })
    .join('');

  const taskRows = sec
    ? filteredTasks(sec)
        .map((t) => {
          const settings = state.settings;
          const pri = settings?.features.priority && t.priority ? `<span class="pill pri pri-${t.priority}">${t.priority}</span>` : '';
          const eff = settings?.features.effort && t.effort ? `<span class="pill eff">${t.effort}</span>` : '';
          const due = t.due ? `<span class="pill due">${t.due}</span>` : '';
          return `
            <div class="task ${t.done ? 'isDone' : ''}" data-task="${escapeHtml(t.id)}">
              <button class="check" data-toggle="${escapeHtml(t.id)}" aria-label="Toggle done">${t.done ? '✓' : ''}</button>
              <div class="tMain">
                <div class="tTitle">${escapeHtml(t.title)}</div>
                <div class="tMeta">${pri}${eff}${due}</div>
              </div>
              <button class="ghost" data-edit="${escapeHtml(t.id)}" aria-label="Edit">Edit</button>
            </div>
          `;
        })
        .join('')
    : '';

  page.innerHTML = `
    <div class="tabsRow">
      <div class="tabs" role="tablist">${tabs}</div>
      <button class="small" id="addSection">+ Section</button>
    </div>

    <div class="toolbar">
      <div class="seg" role="group" aria-label="Filter">
        <button class="segBtn ${state.filter === 'open' ? 'isActive' : ''}" data-filter="open">Open</button>
        <button class="segBtn ${state.filter === 'all' ? 'isActive' : ''}" data-filter="all">All</button>
        <button class="segBtn ${state.filter === 'done' ? 'isActive' : ''}" data-filter="done">Done</button>
      </div>

      <form class="add" id="addForm">
        <input class="input" id="newTask" placeholder="Add a task…" autocomplete="off" />
        <button class="cta" type="submit">Add</button>
      </form>
    </div>

    <div class="list">
      ${sec ? taskRows || '<div class="hint">No tasks here yet.</div>' : '<div class="hint">Create your first section.</div>'}
    </div>
  `;

  page.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
    b.addEventListener('click', () => {
      state.section = b.dataset.tab ?? null;
      render();
    });
  });

  page.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => {
    b.addEventListener('click', () => {
      state.filter = b.dataset.filter as 'open' | 'all' | 'done';
      renderTasksPage();
    });
  });

  page.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach((b) => {
    b.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = b.dataset.toggle;
      const section = state.section;
      if (!id || !section) return;
      state.model = await window.zuri.doc.toggleTask(section, id);
      ensureDefaultSection();
      renderTasksPage();
    });
  });

  page.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const id = b.dataset.edit;
      const section = state.section;
      if (!id || !section) return;
      const sec2 = currentSection();
      const task = sec2?.tasks.find((t) => t.id === id);
      if (!task) return;
      state.editing = { section, task };
      renderModal();
    });
  });

  $('#addSection')?.addEventListener('click', async () => {
    const name = prompt('New section name?');
    if (!name) return;
    state.model = await window.zuri.doc.addSection(name.trim());
    state.section = name.trim();
    renderTasksPage();
  });

  $('#addForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#newTask') as HTMLInputElement | null;
    if (!input) return;
    const title = input.value.trim();
    if (!title) return;
    const section = state.section ?? state.model.sections[0]?.name ?? 'Inbox';
    state.model = await window.zuri.doc.addTask(section, title);
    input.value = '';
    ensureDefaultSection();
    renderTasksPage();
  });
};

const renderSettingsPage = () => {
  const page = $('#pageSettings') as HTMLElement | null;
  if (!page || !state.settings) return;

  const s = state.settings;

  const themeOptions = (Object.keys(themeLabel) as ThemeId[])
    .map((id) => `<option value="${id}" ${s.theme === id ? 'selected' : ''}>${themeLabel[id]}</option>`)
    .join('');

  page.innerHTML = `
    <div class="settings">
      <section class="card">
        <h2>Setup</h2>
        <div class="row">
          <div class="label">Markdown file</div>
          <div class="value">
            <div class="path">${s.markdownPath ? escapeHtml(s.markdownPath) : '<em>none</em>'}</div>
            <button class="small" id="pickMd2">Choose…</button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Features</h2>
        <label class="toggle"><input type="checkbox" id="featPri" ${s.features.priority ? 'checked' : ''}/> Priorities</label>
        <label class="toggle"><input type="checkbox" id="featEff" ${s.features.effort ? 'checked' : ''}/> Effort</label>
        <label class="toggle"><input type="checkbox" id="featNot" ${s.features.notifications ? 'checked' : ''}/> Notifications</label>
        <div class="row">
          <div class="label">Notify time</div>
          <div class="value">
            <input class="input time" id="notifyTime" type="time" value="${escapeHtml(s.notificationTime)}" />
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Theme</h2>
        <div class="row">
          <div class="label">Appearance</div>
          <div class="value">
            <select class="input" id="themeSel">${themeOptions}</select>
          </div>
        </div>
      </section>

      <p class="foot">Settings are stored at <code>~/.zuri/settings.json</code>.</p>
    </div>
  `;

  $('#pickMd2')?.addEventListener('click', async () => {
    await window.zuri.settings.pickMarkdownFile();
    await refreshAll();
  });

  const pushPatch = async (patch: Partial<ZuriSettings>) => {
    state.settings = await window.zuri.settings.set(patch);
    applyTheme(state.settings.theme);
    renderSettingsPage();
  };

  $('#featPri')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    await pushPatch({ features: { ...s.features, priority: checked } });
  });
  $('#featEff')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    await pushPatch({ features: { ...s.features, effort: checked } });
  });
  $('#featNot')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    await pushPatch({ features: { ...s.features, notifications: checked } });
  });

  $('#notifyTime')?.addEventListener('change', async (e) => {
    const v = (e.target as HTMLInputElement).value;
    await pushPatch({ notificationTime: v || '00:00' });
  });

  $('#themeSel')?.addEventListener('change', async (e) => {
    const v = (e.target as HTMLSelectElement).value as ThemeId;
    await pushPatch({ theme: v });
  });
};

const renderModal = () => {
  const modal = $('#modal') as HTMLDivElement | null;
  if (!modal) return;

  if (!state.editing || !state.settings) {
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '';
    return;
  }

  const { task, section } = state.editing;
  const canPri = state.settings.features.priority;
  const canEff = state.settings.features.effort;

  modal.setAttribute('aria-hidden', 'false');
  modal.innerHTML = `
    <div class="backdrop" id="close"></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheetHead">
        <div>
          <div class="sheetTitle">Edit task</div>
          <div class="sheetSub">${escapeHtml(section)}</div>
        </div>
        <button class="ghost" id="x">Close</button>
      </div>

      <div class="sheetBody">
        <label class="field">
          <span>Title</span>
          <input class="input" id="tTitle" value="${escapeHtml(task.title)}" />
        </label>

        <div class="grid2">
          <label class="field ${canPri ? '' : 'isDisabled'}">
            <span>Priority</span>
            <select class="input" id="tPri" ${canPri ? '' : 'disabled'}>
              <option value="">—</option>
              <option value="P0" ${task.priority === 'P0' ? 'selected' : ''}>P0</option>
              <option value="P1" ${task.priority === 'P1' ? 'selected' : ''}>P1</option>
              <option value="P2" ${task.priority === 'P2' ? 'selected' : ''}>P2</option>
              <option value="P3" ${task.priority === 'P3' ? 'selected' : ''}>P3</option>
            </select>
          </label>

          <label class="field ${canEff ? '' : 'isDisabled'}">
            <span>Effort</span>
            <select class="input" id="tEff" ${canEff ? '' : 'disabled'}>
              <option value="">—</option>
              <option value="XS" ${task.effort === 'XS' ? 'selected' : ''}>XS</option>
              <option value="S" ${task.effort === 'S' ? 'selected' : ''}>S</option>
              <option value="M" ${task.effort === 'M' ? 'selected' : ''}>M</option>
              <option value="L" ${task.effort === 'L' ? 'selected' : ''}>L</option>
              <option value="XL" ${task.effort === 'XL' ? 'selected' : ''}>XL</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span>Due date</span>
          <input class="input" id="tDue" placeholder="YYYY-MM-DD" value="${escapeHtml(task.due ?? '')}" />
        </label>

        <div class="sheetActions">
          <button class="cta" id="save">Save</button>
        </div>
      </div>
    </div>
  `;

  const close = () => {
    state.editing = null;
    renderModal();
  };

  $('#close')?.addEventListener('click', close);
  $('#x')?.addEventListener('click', close);

  $('#save')?.addEventListener('click', async () => {
    const title = ($('#tTitle') as HTMLInputElement).value.trim();
    const priRaw = ($('#tPri') as HTMLSelectElement | null)?.value || '';
    const effRaw = ($('#tEff') as HTMLSelectElement | null)?.value || '';

    const priOptions = ['P0', 'P1', 'P2', 'P3'] as const;
    const effOptions = ['XS', 'S', 'M', 'L', 'XL'] as const;

    const isPriority = (v: string): v is Task['priority'] =>
      (priOptions as readonly string[]).includes(v);
    const isEffort = (v: string): v is Task['effort'] =>
      (effOptions as readonly string[]).includes(v);

    const pri = isPriority(priRaw) ? priRaw : undefined;
    const eff = isEffort(effRaw) ? effRaw : undefined;
    const dueRaw = ($('#tDue') as HTMLInputElement).value.trim();
    const due = dueRaw === '' ? undefined : dueRaw;

    state.model = await window.zuri.doc.updateTask(section, task.id, {
      title: title || task.title,
      priority: pri,
      effort: eff,
      due,
    });

    close();
    render();
  });
};

const render = () => {
  renderShell();
  if (state.page === 'tasks') renderTasksPage();
  if (state.page === 'settings') renderSettingsPage();
  renderModal();
};

// live updates
window.zuri.doc.onChanged(async () => {
  // If file is changed externally, re-read and redraw.
  if (!state.settings?.markdownPath) return;
  state.model = await window.zuri.doc.get();
  ensureDefaultSection();
  render();
});

void refreshAll();
