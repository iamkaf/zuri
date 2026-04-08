import type { DocModel, Section, Task } from '../preload';
import { ALL_SECTIONS, type SectionSelection, type TaskFilter, type TaskGroup } from '../types';

export const filteredTasks = (section: Section, filter: TaskFilter): Task[] => {
  if (filter === 'all') return section.tasks;
  if (filter === 'done') return section.tasks.filter((t) => t.done);
  return section.tasks.filter((t) => !t.done);
};

export const normalizeSectionName = (name: string): string => name.trim();

export const findSectionNameMatch = (sections: Section[], candidate: string): string | null => {
  const normalized = normalizeSectionName(candidate).toLocaleLowerCase();
  if (!normalized) return null;
  return sections.find((section) => section.name.toLocaleLowerCase() === normalized)?.name ?? null;
};

export const ensureSection = (model: DocModel, current: SectionSelection): SectionSelection => {
  if (model.sections.length === 0) {
    return null;
  }
  if (current === ALL_SECTIONS) {
    return ALL_SECTIONS;
  }
  if (!current) {
    return model.sections[0]?.name ?? null;
  }
  return model.sections.some((s) => s.name === current)
    ? current
    : (model.sections[0]?.name ?? null);
};

export const getTaskGroups = (model: DocModel, filter: TaskFilter): TaskGroup[] =>
  model.sections
    .map((section) => ({ section, tasks: filteredTasks(section, filter) }))
    .filter((group) => group.tasks.length > 0);

export const getVisibleTasks = (
  model: DocModel,
  selection: SectionSelection,
  filter: TaskFilter,
): Task[] => {
  if (selection === ALL_SECTIONS) {
    return getTaskGroups(model, filter).flatMap((group) => group.tasks);
  }
  if (!selection) return [];
  const section = model.sections.find((entry) => entry.name === selection);
  return section ? filteredTasks(section, filter) : [];
};

export const findTaskWithSection = (
  sections: Section[],
  taskId: string,
): { section: Section; task: Task } | null => {
  for (const section of sections) {
    const task = section.tasks.find((entry) => entry.id === taskId);
    if (task) {
      return { section, task };
    }
  }
  return null;
};

export const reindexTaskIds = (model: DocModel): void => {
  for (const section of model.sections) {
    for (const [index, task] of section.tasks.entries()) {
      task.id = `${section.name}::${index}`;
    }
  }
};

export const moveTaskBetweenSections = (
  model: DocModel,
  fromSectionName: string,
  toSectionName: string,
  taskId: string,
): boolean => {
  if (fromSectionName === toSectionName) return false;

  const source = model.sections.find((section) => section.name === fromSectionName);
  if (!source) return false;

  const taskIndex = source.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return false;

  let target = model.sections.find((section) => section.name === toSectionName);
  if (!target) {
    target = { name: toSectionName, tasks: [] };
    model.sections.push(target);
  }

  const [task] = source.tasks.splice(taskIndex, 1);
  target.tasks.push(task);
  return true;
};

export const deleteTaskFromSection = (
  model: DocModel,
  sectionName: string,
  taskId: string,
): boolean => {
  const section = model.sections.find((entry) => entry.name === sectionName);
  if (!section) return false;

  const taskIndex = section.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return false;

  section.tasks.splice(taskIndex, 1);
  return true;
};
