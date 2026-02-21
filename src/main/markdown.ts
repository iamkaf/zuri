export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Effort = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type RecurPattern = 'daily' | 'weekdays' | 'weekly' | 'monthly' | `every ${number} days`;

export type Task = {
  id: string; // derived
  done: boolean;
  title: string;
  priority?: Priority;
  effort?: Effort;
  due?: string; // YYYY-MM-DD
  recur?: RecurPattern;
  lastDone?: string; // YYYY-MM-DD, set when a recurring task is completed
  extra: Record<string, string>;
};

export type Section = {
  name: string;
  tasks: Task[];
};

export type DocModel = {
  sections: Section[];
};

const isHeading = (line: string) => /^#{2,6}\s+/.test(line);
const headingText = (line: string) => line.replace(/^#{2,6}\s+/, '').trim();

const isTaskLine = (line: string) => /^\s*- \[( |x|X)\] /.test(line);
const parseTaskLine = (line: string) => {
  const m = line.match(/^\s*- \[( |x|X)\] (.*)$/);
  if (!m) return null;
  return { done: m[1].toLowerCase() === 'x', title: m[2].trimEnd() };
};

const isRecurPattern = (value: string): value is RecurPattern =>
  value === 'daily' ||
  value === 'weekdays' ||
  value === 'weekly' ||
  value === 'monthly' ||
  /^every \d+ days$/.test(value);

const isMetaLine = (line: string) => /^\s{2,}-\s+[^:]+:\s*.*$/.test(line);
const parseMetaLine = (line: string) => {
  const m = line.match(/^\s{2,}-\s+([^:]+):\s*(.*)$/);
  if (!m) return null;
  return { key: m[1].trim(), value: m[2].trim() };
};

export const parseMarkdown = (md: string): DocModel => {
  const lines = md.replace(/\r\n/g, '\n').split('\n');

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentTask: Task | null = null;

  const ensureSection = (name: string) => {
    let section = sections.find((s) => s.name === name);
    if (!section) {
      section = { name, tasks: [] };
      sections.push(section);
    }
    return section;
  };

  const defaultSectionName = 'Inbox';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isHeading(line)) {
      const name = headingText(line);
      currentSection = ensureSection(name);
      currentTask = null;
      continue;
    }

    if (isTaskLine(line)) {
      const parsed = parseTaskLine(line);
      if (!parsed) continue;
      if (!currentSection) currentSection = ensureSection(defaultSectionName);

      const idx = currentSection.tasks.length;
      const task: Task = {
        id: `${currentSection.name}::${idx}`,
        done: parsed.done,
        title: parsed.title,
        extra: {},
      };
      currentSection.tasks.push(task);
      currentTask = task;
      continue;
    }

    if (currentTask && isMetaLine(line)) {
      const meta = parseMetaLine(line);
      if (!meta) continue;

      const key = meta.key.toLowerCase();
      const value = meta.value;

      if (key === 'priority') {
        if (['P0', 'P1', 'P2', 'P3'].includes(value)) currentTask.priority = value as Priority;
        else currentTask.extra[meta.key] = value;
      } else if (key === 'effort') {
        if (['XS', 'S', 'M', 'L', 'XL'].includes(value)) currentTask.effort = value as Effort;
        else currentTask.extra[meta.key] = value;
      } else if (key === 'due') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) currentTask.due = value;
        else currentTask.extra[meta.key] = value;
      } else if (key === 'recur') {
        if (isRecurPattern(value)) currentTask.recur = value;
        else currentTask.extra[meta.key] = value;
      } else if (key === 'lastdone') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) currentTask.lastDone = value;
        else currentTask.extra[meta.key] = value;
      } else {
        currentTask.extra[meta.key] = value;
      }

      continue;
    }

    // blank or unrelated line: ignore
  }

  return { sections };
};

export const writeMarkdown = (model: DocModel): string => {
  const out: string[] = [];

  // Optional top heading (keeps file friendly)
  out.push('# Tasks', '');

  for (const section of model.sections) {
    out.push(`## ${section.name}`);

    for (const task of section.tasks) {
      out.push(`- [${task.done ? 'x' : ' '}] ${task.title}`);
      if (task.priority) out.push(`  - priority: ${task.priority}`);
      if (task.effort) out.push(`  - effort: ${task.effort}`);
      if (task.due) out.push(`  - due: ${task.due}`);
      if (task.recur) out.push(`  - recur: ${task.recur}`);
      if (task.lastDone) out.push(`  - lastDone: ${task.lastDone}`);
      for (const [k, v] of Object.entries(task.extra ?? {})) {
        out.push(`  - ${k}: ${v}`);
      }
    }

    out.push('');
  }

  // Trim trailing blank lines to single newline
  return out.join('\n').replace(/\n{3,}$/g, '\n\n').replace(/\s*$/g, '') + '\n';
};

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => fmtDate(new Date());

export const nextDue = (pattern: RecurPattern, currentDue?: string): string => {
  const base =
    currentDue && /^\d{4}-\d{2}-\d{2}$/.test(currentDue)
      ? new Date(currentDue + 'T00:00:00')
      : new Date();

  if (pattern === 'daily') {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    return fmtDate(d);
  }

  if (pattern === 'weekdays') {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return fmtDate(d);
  }

  if (pattern === 'weekly') {
    const d = new Date(base);
    d.setDate(d.getDate() + 7);
    return fmtDate(d);
  }

  if (pattern === 'monthly') {
    const d = new Date(base);
    d.setMonth(d.getMonth() + 1);
    return fmtDate(d);
  }

  const m = pattern.match(/^every (\d+) days$/);
  if (m) {
    const d = new Date(base);
    d.setDate(d.getDate() + parseInt(m[1], 10));
    return fmtDate(d);
  }

  return fmtDate(new Date());
};
