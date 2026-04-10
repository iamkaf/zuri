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

type RawBlock = {
  kind: 'raw';
  lines: string[];
};

type TaskBlock = {
  kind: 'task';
  task: Task;
};

type SectionBlock = RawBlock | TaskBlock;

type MarkdownSection = {
  name: string;
  headingLine: string;
  blocks: SectionBlock[];
};

export type MarkdownDoc = {
  preamble: string[];
  sections: MarkdownSection[];
  hadTerminalNewline: boolean;
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

const cloneTask = (task: Task): Task => ({
  ...task,
  extra: { ...(task.extra ?? {}) },
});

const flushRawBlock = (blocks: SectionBlock[], rawLines: string[]) => {
  if (rawLines.length === 0) return;
  blocks.push({ kind: 'raw', lines: [...rawLines] });
  rawLines.length = 0;
};

const compactBlocks = (section: MarkdownSection) => {
  const next: SectionBlock[] = [];

  for (const block of section.blocks) {
    if (block.kind === 'raw' && block.lines.length === 0) continue;

    const previous = next[next.length - 1];
    if (block.kind === 'raw' && previous?.kind === 'raw') {
      previous.lines.push(...block.lines);
      continue;
    }

    next.push(block);
  }

  section.blocks = next;
};

const parseSectionBlocks = (sectionName: string, lines: string[]): SectionBlock[] => {
  const blocks: SectionBlock[] = [];
  const rawLines: string[] = [];
  let taskIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!isTaskLine(line)) {
      rawLines.push(line);
      continue;
    }

    flushRawBlock(blocks, rawLines);

    const parsed = parseTaskLine(line);
    if (!parsed) {
      rawLines.push(line);
      continue;
    }

    const task: Task = {
      id: `${sectionName}::${taskIndex++}`,
      done: parsed.done,
      title: parsed.title,
      extra: {},
    };

    for (let j = i + 1; j < lines.length; j++) {
      const metaLine = lines[j];
      if (!isMetaLine(metaLine)) break;

      const meta = parseMetaLine(metaLine);
      if (!meta) continue;

      const key = meta.key.toLowerCase();
      const value = meta.value;

      if (key === 'priority') {
        if (['P0', 'P1', 'P2', 'P3'].includes(value)) task.priority = value as Priority;
        else task.extra[meta.key] = value;
      } else if (key === 'effort') {
        if (['XS', 'S', 'M', 'L', 'XL'].includes(value)) task.effort = value as Effort;
        else task.extra[meta.key] = value;
      } else if (key === 'due') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) task.due = value;
        else task.extra[meta.key] = value;
      } else if (key === 'recur') {
        if (isRecurPattern(value)) task.recur = value;
        else task.extra[meta.key] = value;
      } else if (key === 'lastdone') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) task.lastDone = value;
        else task.extra[meta.key] = value;
      } else {
        task.extra[meta.key] = value;
      }

      i = j;
    }

    blocks.push({ kind: 'task', task });
  }

  flushRawBlock(blocks, rawLines);
  return blocks;
};

const reindexMarkdownDoc = (doc: MarkdownDoc) => {
  for (const section of doc.sections) {
    let index = 0;
    for (const block of section.blocks) {
      if (block.kind !== 'task') continue;
      block.task.id = `${section.name}::${index++}`;
    }
  }
};

const insertTaskBlock = (section: MarkdownSection, block: TaskBlock) => {
  const lastTaskIndex = [...section.blocks].findLastIndex((entry) => entry.kind === 'task');
  if (lastTaskIndex !== -1) {
    section.blocks.splice(lastTaskIndex + 1, 0, block);
    return;
  }

  const firstRawIndex = section.blocks.findIndex((entry) => entry.kind === 'raw');
  if (firstRawIndex === -1) {
    section.blocks.push(block);
    return;
  }

  section.blocks.splice(firstRawIndex, 0, block);
  const next = section.blocks[firstRawIndex + 1];
  if (next?.kind === 'raw' && next.lines.length > 0 && next.lines[0] !== '') {
    next.lines.unshift('');
  }
};

const getTaskBlockIndices = (section: MarkdownSection): number[] =>
  section.blocks.flatMap((block, index) => (block.kind === 'task' ? [index] : []));

const findTaskBlock = (doc: MarkdownDoc, taskId: string) => {
  for (const section of doc.sections) {
    for (const [blockIndex, block] of section.blocks.entries()) {
      if (block.kind === 'task' && block.task.id === taskId) {
        return { section, blockIndex, block };
      }
    }
  }

  return null;
};

const toMarkdownTaskLines = (task: Task): string[] => {
  const lines = [`- [${task.done ? 'x' : ' '}] ${task.title}`];
  if (task.priority) lines.push(`  - priority: ${task.priority}`);
  if (task.effort) lines.push(`  - effort: ${task.effort}`);
  if (task.due) lines.push(`  - due: ${task.due}`);
  if (task.recur) lines.push(`  - recur: ${task.recur}`);
  if (task.lastDone) lines.push(`  - lastDone: ${task.lastDone}`);
  for (const [key, value] of Object.entries(task.extra ?? {})) {
    lines.push(`  - ${key}: ${value}`);
  }
  return lines;
};

export const parseMarkdownDocument = (md: string): MarkdownDoc => {
  const normalized = md.replace(/\r\n/g, '\n');
  const hadTerminalNewline = normalized.endsWith('\n');
  const trimmed = hadTerminalNewline ? normalized.slice(0, -1) : normalized;
  const lines = trimmed.length === 0 ? [] : trimmed.split('\n');

  const sections: MarkdownSection[] = [];
  let preamble = lines;
  let currentSection: MarkdownSection | null = null;
  let sectionLines: string[] = [];

  const commitSection = () => {
    if (!currentSection) {
      preamble = sectionLines;
      sectionLines = [];
      return;
    }

    currentSection.blocks = parseSectionBlocks(currentSection.name, sectionLines);
    sections.push(currentSection);
    sectionLines = [];
  };

  for (const line of lines) {
    if (!isHeading(line)) {
      sectionLines.push(line);
      continue;
    }

    if (currentSection) {
      commitSection();
    } else {
      preamble = sectionLines;
      sectionLines = [];
    }

    currentSection = {
      name: headingText(line),
      headingLine: line,
      blocks: [],
    };
  }

  commitSection();

  const doc = { preamble, sections, hadTerminalNewline };
  reindexMarkdownDoc(doc);
  return doc;
};

export const toDocModel = (doc: MarkdownDoc): DocModel => ({
  sections: doc.sections.map((section) => ({
    name: section.name,
    tasks: section.blocks
      .filter((block): block is TaskBlock => block.kind === 'task')
      .map((block) => cloneTask(block.task)),
  })),
});

export const parseMarkdown = (md: string): DocModel => toDocModel(parseMarkdownDocument(md));

export const writeMarkdownDocument = (doc: MarkdownDoc): string => {
  const lines = [...doc.preamble];

  for (const section of doc.sections) {
    lines.push(section.headingLine);

    for (const block of section.blocks) {
      if (block.kind === 'raw') {
        lines.push(...block.lines);
      } else {
        lines.push(...toMarkdownTaskLines(block.task));
      }
    }
  }

  const text = lines.join('\n');
  if (doc.hadTerminalNewline || text.length === 0) return text + '\n';
  return text;
};

export const writeMarkdown = (model: DocModel): string => {
  const out: string[] = [];

  out.push('# Tasks', '');

  for (const section of model.sections) {
    out.push(`## ${section.name}`);

    for (const task of section.tasks) {
      out.push(...toMarkdownTaskLines(task));
    }

    out.push('');
  }

  return (
    out
      .join('\n')
      .replace(/\n{3,}$/g, '\n\n')
      .replace(/\s*$/g, '') + '\n'
  );
};

export const addSectionToMarkdownDoc = (doc: MarkdownDoc, name: string): boolean => {
  const normalized = name.trim();
  if (!normalized) return false;

  const normalizedLower = normalized.toLocaleLowerCase();
  if (doc.sections.some((section) => section.name.toLocaleLowerCase() === normalizedLower))
    return false;

  if (doc.sections.length === 0 && doc.preamble.length === 0) {
    doc.preamble = ['# Tasks', ''];
  }

  doc.sections.push({
    name: normalized,
    headingLine: `## ${normalized}`,
    blocks: [],
  });
  return true;
};

export const addTaskToMarkdownDoc = (
  doc: MarkdownDoc,
  sectionName: string,
  title: string,
): boolean => {
  let section = doc.sections.find((entry) => entry.name === sectionName);
  if (!section) {
    section = {
      name: sectionName,
      headingLine: `## ${sectionName}`,
      blocks: [],
    };
    doc.sections.push(section);
  }

  insertTaskBlock(section, {
    kind: 'task',
    task: {
      id: '',
      done: false,
      title,
      extra: {},
    },
  });
  reindexMarkdownDoc(doc);
  return true;
};

export const toggleTaskInMarkdownDoc = (doc: MarkdownDoc, taskId: string): boolean => {
  const match = findTaskBlock(doc, taskId);
  if (!match) return false;

  const task = match.block.task;
  if (task.recur && !task.done) {
    if (task.lastDone === todayISO()) {
      task.lastDone = undefined;
    } else {
      task.lastDone = todayISO();
      task.due = nextDue(task.recur, task.due);
    }
  } else {
    task.done = !task.done;
  }

  return true;
};

export const updateTaskInMarkdownDoc = (
  doc: MarkdownDoc,
  taskId: string,
  patch: Partial<Task>,
): boolean => {
  const match = findTaskBlock(doc, taskId);
  if (!match) return false;

  const task = match.block.task;
  if (typeof patch.title === 'string') task.title = patch.title;
  if (typeof patch.done === 'boolean') task.done = patch.done;
  if (typeof patch.priority === 'string' || patch.priority === undefined)
    task.priority = patch.priority as Task['priority'];
  if (typeof patch.effort === 'string' || patch.effort === undefined)
    task.effort = patch.effort as Task['effort'];
  if (typeof patch.due === 'string' || patch.due === undefined) task.due = patch.due;
  if (typeof patch.recur === 'string' || patch.recur === undefined)
    task.recur = patch.recur as Task['recur'];
  if (typeof patch.lastDone === 'string' || patch.lastDone === undefined)
    task.lastDone = patch.lastDone;

  return true;
};

export const reorderTaskInMarkdownDoc = (
  doc: MarkdownDoc,
  sectionName: string,
  fromIndex: number,
  toIndex: number,
): boolean => {
  const section = doc.sections.find((entry) => entry.name === sectionName);
  if (!section || fromIndex === toIndex) return false;

  const taskBlockIndices = getTaskBlockIndices(section);
  if (fromIndex < 0 || fromIndex >= taskBlockIndices.length) return false;
  if (toIndex < 0 || toIndex >= taskBlockIndices.length) return false;

  const [block] = section.blocks.splice(taskBlockIndices[fromIndex], 1);
  if (!block) return false;

  const remainingTaskBlockIndices = getTaskBlockIndices(section);
  if (remainingTaskBlockIndices.length === 0) {
    section.blocks.unshift(block);
  } else if (toIndex >= remainingTaskBlockIndices.length) {
    section.blocks.splice(
      remainingTaskBlockIndices[remainingTaskBlockIndices.length - 1] + 1,
      0,
      block,
    );
  } else {
    section.blocks.splice(remainingTaskBlockIndices[toIndex], 0, block);
  }

  compactBlocks(section);
  reindexMarkdownDoc(doc);
  return true;
};

export const moveTaskBetweenSectionsInMarkdownDoc = (
  doc: MarkdownDoc,
  fromSectionName: string,
  toSectionName: string,
  taskId: string,
): boolean => {
  if (fromSectionName === toSectionName) return false;

  const source = doc.sections.find((section) => section.name === fromSectionName);
  if (!source) return false;

  const taskBlockIndex = source.blocks.findIndex(
    (block) => block.kind === 'task' && block.task.id === taskId,
  );
  if (taskBlockIndex === -1) return false;

  let target = doc.sections.find((section) => section.name === toSectionName);
  if (!target) {
    target = {
      name: toSectionName,
      headingLine: `## ${toSectionName}`,
      blocks: [],
    };
    doc.sections.push(target);
  }

  const [block] = source.blocks.splice(taskBlockIndex, 1);
  if (!block || block.kind !== 'task') return false;

  compactBlocks(source);
  insertTaskBlock(target, block);
  reindexMarkdownDoc(doc);
  return true;
};

export const deleteTaskFromMarkdownDoc = (
  doc: MarkdownDoc,
  sectionName: string,
  taskId: string,
): boolean => {
  const section = doc.sections.find((entry) => entry.name === sectionName);
  if (!section) return false;

  const taskBlockIndex = section.blocks.findIndex(
    (block) => block.kind === 'task' && block.task.id === taskId,
  );
  if (taskBlockIndex === -1) return false;

  section.blocks.splice(taskBlockIndex, 1);
  compactBlocks(section);
  reindexMarkdownDoc(doc);
  return true;
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
