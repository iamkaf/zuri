import { describe, it, expect } from 'vitest';
import {
  deleteTaskFromSection,
  ensureSection,
  filteredTasks,
  findSectionNameMatch,
  moveTaskBetweenSections,
  normalizeSectionName,
  reindexTaskIds,
} from '../tasks';
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

describe('normalizeSectionName', () => {
  it('trims outer whitespace', () => {
    expect(normalizeSectionName('  Work  ')).toBe('Work');
  });
});

describe('findSectionNameMatch', () => {
  const sections = makeModel(['Inbox', 'Work', 'Personal']).sections;

  it('finds an exact match', () => {
    expect(findSectionNameMatch(sections, 'Work')).toBe('Work');
  });

  it('finds a case-insensitive match', () => {
    expect(findSectionNameMatch(sections, 'personal')).toBe('Personal');
  });

  it('returns null when the section is absent', () => {
    expect(findSectionNameMatch(sections, 'Archive')).toBeNull();
  });
});

describe('reindexTaskIds', () => {
  it('reassigns task ids from their section and position', () => {
    const model: DocModel = {
      sections: [
        {
          name: 'Inbox',
          tasks: [
            { ...makeTask('x', false), title: 'One' },
            { ...makeTask('y', false), title: 'Two' },
          ],
        },
      ],
    };

    reindexTaskIds(model);

    expect(model.sections[0].tasks.map((task) => task.id)).toEqual(['Inbox::0', 'Inbox::1']);
  });
});

describe('moveTaskBetweenSections', () => {
  it('moves a task into another section', () => {
    const model: DocModel = {
      sections: [
        { name: 'Inbox', tasks: [{ ...makeTask('Inbox::0', false), title: 'Ship it' }] },
        { name: 'Work', tasks: [] },
      ],
    };

    expect(moveTaskBetweenSections(model, 'Inbox', 'Work', 'Inbox::0')).toBe(true);
    expect(model.sections[0].tasks).toHaveLength(0);
    expect(model.sections[1].tasks[0].title).toBe('Ship it');
  });

  it('returns false when moving into the same section', () => {
    const model: DocModel = {
      sections: [{ name: 'Inbox', tasks: [{ ...makeTask('Inbox::0', false), title: 'Ship it' }] }],
    };

    expect(moveTaskBetweenSections(model, 'Inbox', 'Inbox', 'Inbox::0')).toBe(false);
  });
});

describe('deleteTaskFromSection', () => {
  it('removes a task from the given section', () => {
    const model: DocModel = {
      sections: [
        {
          name: 'Inbox',
          tasks: [
            { ...makeTask('Inbox::0', false), title: 'Keep' },
            { ...makeTask('Inbox::1', false), title: 'Delete' },
          ],
        },
      ],
    };

    expect(deleteTaskFromSection(model, 'Inbox', 'Inbox::1')).toBe(true);
    expect(model.sections[0].tasks.map((task) => task.title)).toEqual(['Keep']);
  });
});
