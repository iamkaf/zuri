import { describe, expect, it } from 'vitest';
import {
  deleteTaskFromMarkdownDoc,
  moveTaskBetweenSectionsInMarkdownDoc,
  parseMarkdownDocument,
  toDocModel,
  toggleTaskInMarkdownDoc,
  updateTaskInMarkdownDoc,
  writeMarkdownDocument,
} from './markdown';

const findTaskId = (markdown: string, sectionName: string, title: string) => {
  const doc = parseMarkdownDocument(markdown);
  const model = toDocModel(doc);
  const section = model.sections.find((entry) => entry.name === sectionName);
  const task = section?.tasks.find((entry) => entry.title === title);
  expect(task).toBeDefined();
  return task!.id;
};

describe('markdown document mutations', () => {
  it('preserves unrelated notes when toggling a task', () => {
    const before = `# Tasks

## Focus

## Goals
- [ ] Advance Spriteform toward a real revenue-shaped artifact
- [ ] Complete the most important mod fleet work
- [ ] Move planning into Board
- [ ] Make art this month

## Active Work
- [x] Carry forward everything from March note (minus blog and Patreon posts)
- [x] Finish March financial report
- [x] Review Liteminer PR
- [ ] Release Liteminer
- [ ] Spriteform maintenance and dogfooding
- [ ] Add AI-assisted moderation tools to i18n
- [ ] Konfig fieldset
- [ ] Rewrite z.kaf.sh using TanStack Start
- [ ] Make art this month

## Secondary Work
- [ ] Build TanStack sticker app
- [ ] Slop Studio architecture review
- [ ] Board app maintenance
- [ ] Draft lore for Umbra Aurum
- [ ] Adjust mods AGENTS.md
- [ ] Review [[Ticket Index|Tickets]]
- [ ] Close old tickets

## Personal
- [x] Eat popcorn
- [ ] Clean room
- [x] Play Dark Souls 2 DLCs

## System
- [x] Use this monthly note as the source of truth
- [x] Use Zuri to execute from this note
- [ ] Use Board for planning and shaping

## Notes

**Apr 08**
Doing a soft reset this month, I lost track of important work and got sidetracked. I did complete good work last month but I didn't do the things I wanted to do.

**Apr 10**
Audited and summarized the full visible Discord support ticket backlog into Obsidian, building per-ticket notes plus an index split between open/unresolved and resolved. Did an additional pass to reclassify clearly abandoned or later-fixed tickets so the remaining open pile is closer to real actionable support work.

## End of Month
`;

    const after = `# Tasks

## Focus

## Goals
- [ ] Advance Spriteform toward a real revenue-shaped artifact
- [ ] Complete the most important mod fleet work
- [ ] Move planning into Board
- [ ] Make art this month

## Active Work
- [x] Carry forward everything from March note (minus blog and Patreon posts)
- [x] Finish March financial report
- [x] Review Liteminer PR
- [ ] Release Liteminer
- [ ] Spriteform maintenance and dogfooding
- [ ] Add AI-assisted moderation tools to i18n
- [ ] Konfig fieldset
- [ ] Rewrite z.kaf.sh using TanStack Start
- [ ] Make art this month

## Secondary Work
- [ ] Build TanStack sticker app
- [ ] Slop Studio architecture review
- [ ] Board app maintenance
- [ ] Draft lore for Umbra Aurum
- [ ] Adjust mods AGENTS.md
- [x] Review [[Ticket Index|Tickets]]
- [ ] Close old tickets

## Personal
- [x] Eat popcorn
- [ ] Clean room
- [x] Play Dark Souls 2 DLCs

## System
- [x] Use this monthly note as the source of truth
- [x] Use Zuri to execute from this note
- [ ] Use Board for planning and shaping

## Notes

**Apr 08**
Doing a soft reset this month, I lost track of important work and got sidetracked. I did complete good work last month but I didn't do the things I wanted to do.

**Apr 10**
Audited and summarized the full visible Discord support ticket backlog into Obsidian, building per-ticket notes plus an index split between open/unresolved and resolved. Did an additional pass to reclassify clearly abandoned or later-fixed tickets so the remaining open pile is closer to real actionable support work.

## End of Month
`;

    const doc = parseMarkdownDocument(before);
    const taskId = findTaskId(before, 'Secondary Work', 'Review [[Ticket Index|Tickets]]');

    expect(toggleTaskInMarkdownDoc(doc, taskId)).toBe(true);

    expect(writeMarkdownDocument(doc)).toBe(after);
  });

  it('updates a task without dropping prose-only sections', () => {
    const markdown = `# Tasks

## Work
- [ ] Ship release

## Notes

This section is not task-shaped.
It must survive task edits unchanged.
`;

    const doc = parseMarkdownDocument(markdown);
    const taskId = findTaskId(markdown, 'Work', 'Ship release');

    expect(updateTaskInMarkdownDoc(doc, taskId, { title: 'Ship release candidate' })).toBe(true);

    expect(writeMarkdownDocument(doc)).toBe(`# Tasks

## Work
- [ ] Ship release candidate

## Notes

This section is not task-shaped.
It must survive task edits unchanged.
`);
  });

  it('preserves existing metadata when a partial patch only changes the title', () => {
    const markdown = `# Tasks

## Work
- [ ] Ship release
  - priority: P1
  - effort: M
  - due: 2026-04-15
  - recur: weekly
  - lastDone: 2026-04-08
`;

    const doc = parseMarkdownDocument(markdown);
    const taskId = findTaskId(markdown, 'Work', 'Ship release');

    expect(updateTaskInMarkdownDoc(doc, taskId, { title: 'Ship release candidate' })).toBe(true);

    expect(writeMarkdownDocument(doc)).toBe(`# Tasks

## Work
- [ ] Ship release candidate
  - priority: P1
  - effort: M
  - due: 2026-04-15
  - recur: weekly
  - lastDone: 2026-04-08
`);
  });

  it('moves task blocks without deleting prose in the target section', () => {
    const markdown = `# Tasks

## Work
- [ ] Ship release

## Notes
Project context lives here.
`;

    const doc = parseMarkdownDocument(markdown);
    const taskId = findTaskId(markdown, 'Work', 'Ship release');

    expect(moveTaskBetweenSectionsInMarkdownDoc(doc, 'Work', 'Notes', taskId)).toBe(true);

    expect(writeMarkdownDocument(doc)).toBe(`# Tasks

## Work

## Notes
- [ ] Ship release

Project context lives here.
`);
  });

  it('deletes by task id after a move without relying on the previous section', () => {
    const markdown = `# Tasks

## Work
- [ ] Ship release

## Notes
Project context lives here.
`;

    const doc = parseMarkdownDocument(markdown);
    const taskId = findTaskId(markdown, 'Work', 'Ship release');

    expect(moveTaskBetweenSectionsInMarkdownDoc(doc, 'Work', 'Notes', taskId)).toBe(true);
    const movedTaskId = toDocModel(doc)
      .sections.find((section) => section.name === 'Notes')
      ?.tasks.find((task) => task.title === 'Ship release')?.id;
    expect(movedTaskId).toBeDefined();
    expect(deleteTaskFromMarkdownDoc(doc, movedTaskId!)).toBe(true);

    expect(writeMarkdownDocument(doc)).toBe(`# Tasks

## Work

## Notes

Project context lives here.
`);
  });
});
