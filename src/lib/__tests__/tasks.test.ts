import { describe, it, expect } from 'vitest';
import {
  deleteTaskFromSection,
  ensureSection,
  findTaskWithSection,
  filteredTasks,
  findSectionNameMatch,
  getCollapsedSectionNames,
  getTaskGroups,
  getVisibleTasks,
  isSectionCollapsed,
  moveTaskBetweenSections,
  normalizeSectionName,
  reindexTaskIds,
} from '../tasks';
import type { Section, Task, DocModel } from '../../preload';
import { ALL_SECTIONS } from '../../types';

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

  it('preserves the all sections selection', () => {
    const model = makeModel(['Inbox', 'Work']);
    expect(ensureSection(model, ALL_SECTIONS)).toBe(ALL_SECTIONS);
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

describe('getTaskGroups', () => {
  const model: DocModel = {
    sections: [
      {
        name: 'Inbox',
        tasks: [makeTask('Inbox::0', false), makeTask('Inbox::1', true)],
      },
      {
        name: 'Work',
        tasks: [makeTask('Work::0', false)],
      },
      {
        name: 'Later',
        tasks: [],
      },
    ],
  };

  it('returns filtered groups in model order', () => {
    const groups = getTaskGroups(model, 'open');
    expect(groups.map((group) => group.section.name)).toEqual(['Inbox', 'Work']);
    expect(groups[0].tasks.map((task) => task.id)).toEqual(['Inbox::0']);
    expect(groups[1].tasks.map((task) => task.id)).toEqual(['Work::0']);
  });

  it('includes done tasks for the all filter', () => {
    const groups = getTaskGroups(model, 'all');
    expect(groups[0].tasks.map((task) => task.id)).toEqual(['Inbox::0', 'Inbox::1']);
  });

  it('marks configured sections as collapsed and keeps their visible count', () => {
    const groups = getTaskGroups(model, 'open', { collapsedSections: ['Work'] });
    expect(groups[0]).toMatchObject({ collapsed: false, visibleCount: 1 });
    expect(groups[1]).toMatchObject({ collapsed: true, visibleCount: 1 });
  });
});

describe('getVisibleTasks', () => {
  const model: DocModel = {
    sections: [
      {
        name: 'Inbox',
        tasks: [makeTask('Inbox::0', false), makeTask('Inbox::1', true)],
      },
      {
        name: 'Work',
        tasks: [makeTask('Work::0', false)],
      },
    ],
  };

  it('returns filtered tasks for a single section', () => {
    expect(getVisibleTasks(model, 'Inbox', 'open').map((task) => task.id)).toEqual(['Inbox::0']);
  });

  it('returns flattened grouped tasks for all sections', () => {
    expect(getVisibleTasks(model, ALL_SECTIONS, 'open').map((task) => task.id)).toEqual([
      'Inbox::0',
      'Work::0',
    ]);
  });

  it('skips collapsed groups in the all sections view', () => {
    expect(
      getVisibleTasks(model, ALL_SECTIONS, 'open', { collapsedSections: ['Work'] }).map(
        (task) => task.id,
      ),
    ).toEqual(['Inbox::0']);
  });
});

describe('collapsed section helpers', () => {
  it('returns an empty set when collapsedSections is absent', () => {
    expect([...getCollapsedSectionNames(null)]).toEqual([]);
  });

  it('returns the configured collapsed section names', () => {
    expect([...getCollapsedSectionNames({ collapsedSections: ['Inbox', 'Work'] })]).toEqual([
      'Inbox',
      'Work',
    ]);
  });

  it('checks whether a section is collapsed', () => {
    expect(isSectionCollapsed({ collapsedSections: ['Inbox'] }, 'Inbox')).toBe(true);
    expect(isSectionCollapsed({ collapsedSections: ['Inbox'] }, 'Work')).toBe(false);
  });

  it('ignores stale collapsed names safely', () => {
    const model: DocModel = {
      sections: [{ name: 'Inbox', tasks: [makeTask('Inbox::0', false)] }],
    };
    const groups = getTaskGroups(model, 'all', { collapsedSections: ['Missing'] });
    expect(groups[0]).toMatchObject({ collapsed: false, visibleCount: 1 });
  });
});

describe('findTaskWithSection', () => {
  const sections: Section[] = [
    { name: 'Inbox', tasks: [makeTask('Inbox::0', false)] },
    { name: 'Work', tasks: [makeTask('Work::0', true)] },
  ];

  it('finds the task and owning section', () => {
    const match = findTaskWithSection(sections, 'Work::0');
    expect(match?.section.name).toBe('Work');
    expect(match?.task.id).toBe('Work::0');
  });

  it('returns null for an unknown task id', () => {
    expect(findTaskWithSection(sections, 'Missing::0')).toBeNull();
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
