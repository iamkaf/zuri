import { describe, it, expect } from 'vitest';
import { filteredTasks, ensureSection } from '../tasks';
import type { Section, Task, DocModel } from '../../preload';

const makeTask = (id: string, done: boolean): Task => ({
  id,
  done,
  title: `Task ${id}`,
  extra: {},
});

const makeSection = (tasks: Task[]): Section => ({
  name: 'Inbox',
  tasks,
});

const makeModel = (sectionNames: string[]): DocModel => ({
  sections: sectionNames.map((name): Section => ({ name, tasks: [] })),
});

describe('filteredTasks', () => {
  const tasks = [makeTask('a', false), makeTask('b', true), makeTask('c', false)];
  const section = makeSection(tasks);

  it('returns all tasks for filter "all"', () => {
    expect(filteredTasks(section, 'all')).toHaveLength(3);
  });

  it('returns only done tasks for filter "done"', () => {
    const result = filteredTasks(section, 'done');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('returns only open tasks for filter "open"', () => {
    const result = filteredTasks(section, 'open');
    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.done)).toBe(true);
  });
});

describe('ensureSection', () => {
  it('returns current if it exists in the model', () => {
    const model = makeModel(['Inbox', 'Work']);
    expect(ensureSection(model, 'Work')).toBe('Work');
  });

  it('falls back to first section if current is not in model', () => {
    const model = makeModel(['Inbox', 'Work']);
    expect(ensureSection(model, 'Deleted')).toBe('Inbox');
  });

  it('returns first section when current is null', () => {
    const model = makeModel(['Inbox']);
    expect(ensureSection(model, null)).toBe('Inbox');
  });

  it('returns null when model has no sections', () => {
    const model = makeModel([]);
    expect(ensureSection(model, null)).toBeNull();
  });
});
