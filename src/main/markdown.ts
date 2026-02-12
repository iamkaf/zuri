export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Effort = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type Task = {
  id: string; // derived
  done: boolean;
  title: string;
  priority?: Priority;
  effort?: Effort;
  due?: string; // YYYY-MM-DD
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
      for (const [k, v] of Object.entries(task.extra ?? {})) {
        out.push(`  - ${k}: ${v}`);
      }
    }

    out.push('');
  }

  // Trim trailing blank lines to single newline
  return out.join('\n').replace(/\n{3,}$/g, '\n\n').replace(/\s*$/g, '') + '\n';
};
