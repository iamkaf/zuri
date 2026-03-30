import type { DocModel, Section, Task } from '../preload';
import type { TaskFilter } from '../types';

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

export const ensureSection = (model: DocModel, current: string | null): string | null => {
  if (!current) {
    return model.sections[0]?.name ?? null;
  }
  return model.sections.some((s) => s.name === current)
    ? current
    : (model.sections[0]?.name ?? null);
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
