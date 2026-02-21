import type { DocModel, Section, Task } from '../preload';
import type { TaskFilter } from '../types';

export const filteredTasks = (section: Section, filter: TaskFilter): Task[] => {
  if (filter === 'all') return section.tasks;
  if (filter === 'done') return section.tasks.filter((t) => t.done);
  return section.tasks.filter((t) => !t.done);
};

export const ensureSection = (model: DocModel, current: string | null): string | null => {
  if (!current) {
    return model.sections[0]?.name ?? null;
  }
  return model.sections.some((s) => s.name === current)
    ? current
    : (model.sections[0]?.name ?? null);
};
