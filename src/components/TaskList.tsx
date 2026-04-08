import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import { IconCheck, IconChevronDown, IconFolder } from '../Icons';
import type { Section, Task, ZuriSettings } from '../preload';
import { isoToday } from '../lib/date';
import { findTaskWithSection } from '../lib/tasks';
import type { SectionSelection, TaskGroup } from '../types';
import { ALL_SECTIONS } from '../types';
import { SortableTaskRow, TaskRow } from './TaskRow';
import { TaskContextMenu } from './TaskContextMenu';

export type TaskListProps = {
  tasks: Task[];
  section: Section | null;
  taskGroups: TaskGroup[];
  sections: Section[];
  settings: ZuriSettings | null;
  pendingRemovals: Set<string>;
  focusedTaskId: string | null;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  onMove: (fromSection: string, toSection: string, taskId: string) => Promise<void>;
  onDelete: (section: string, taskId: string) => Promise<void>;
  onReorder: (section: string, fromIndex: number, toIndex: number) => Promise<void>;
  sectionName: SectionSelection;
  onToggleSectionCollapsed: (sectionName: string) => Promise<void>;
};

export function TaskList({
  tasks,
  section,
  taskGroups,
  sections,
  settings,
  pendingRemovals,
  focusedTaskId,
  onToggle,
  onEdit,
  onMove,
  onDelete,
  onReorder,
  sectionName,
  onToggleSectionCollapsed,
}: TaskListProps) {
  const [contextMenu, setContextMenu] = useState<{ taskId: string; x: number; y: number } | null>(
    null,
  );
  const taskIds = tasks.map((task) => task.id).join('|');
  const isAggregate = sectionName === ALL_SECTIONS;
  const visibleTaskIds = isAggregate
    ? taskGroups.flatMap((group) => group.tasks.map((task) => task.id)).join('|')
    : taskIds;

  useEffect(() => {
    if (!focusedTaskId) return;
    const el = document.querySelector(`[data-task-id="${focusedTaskId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedTaskId]);

  useEffect(() => {
    setContextMenu(null);
  }, [sectionName, visibleTaskIds]);

  const enabledSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeContextTask =
    contextMenu === null
      ? null
      : (findTaskWithSection(sections, contextMenu.taskId) ?? null);
  const moveTargets = activeContextTask
    ? sections
        .filter((entry) => entry.name !== activeContextTask.section.name)
        .map((entry) => entry.name)
    : [];

  const handleDragEnd = (event: DragEndEvent) => {
    if (contextMenu) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!sectionName || sectionName === ALL_SECTIONS) return;

    const allTasks = section?.tasks ?? [];
    const oldIndex = allTasks.findIndex((t) => t.id === active.id);
    const newIndex = allTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void onReorder(sectionName, oldIndex, newIndex);
  };

  if (sections.length === 0) {
    return (
      <div data-task-list className="flex-1 overflow-y-auto p-2">
        <div className="hint">
          <IconFolder size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>Create your first section to get started.</div>
        </div>
      </div>
    );
  }

  if ((isAggregate ? taskGroups.length : tasks.length) === 0) {
    return (
      <div data-task-list className="flex-1 overflow-y-auto p-2">
        <div className="empty">
          <IconCheck className="empty-icon" size={48} />
          <div className="empty-title">All caught up!</div>
          <div className="empty-text">No tasks to show.</div>
        </div>
      </div>
    );
  }

  return (
    <div data-task-list className="flex-1 overflow-y-auto p-2">
      {isAggregate ? (
        <div className="task-group-list">
          {taskGroups.map((group) => (
            <section key={group.section.name} className="task-group">
              <button
                type="button"
                className="task-group__header"
                aria-expanded={!group.collapsed}
                onClick={() => void onToggleSectionCollapsed(group.section.name)}
              >
                <span className="task-group__header-main">
                  <IconChevronDown
                    size={14}
                    className={group.collapsed ? 'task-group__chevron' : 'task-group__chevron task-group__chevron--expanded'}
                  />
                  <span className="task-group__title">{group.section.name}</span>
                </span>
                <span className="task-group__count">{group.visibleCount}</span>
              </button>
              {!group.collapsed && (
                <div className="task-group__items">
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      settings={settings}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onOpenContextMenu={(taskId, x, y) => setContextMenu({ taskId, x, y })}
                      isPendingRemoval={pendingRemovals.has(task.id)}
                      isFocused={focusedTaskId === task.id}
                      dragDisabled
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={enabledSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                settings={settings}
                onToggle={onToggle}
                onEdit={onEdit}
                onOpenContextMenu={(taskId, x, y) => setContextMenu({ taskId, x, y })}
                isPendingRemoval={pendingRemovals.has(task.id)}
                isFocused={focusedTaskId === task.id}
                dragDisabled={contextMenu !== null}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <TaskContextMenu
        open={activeContextTask !== null && contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        isDone={
          !!activeContextTask &&
          (activeContextTask.task.done || activeContextTask.task.lastDone === isoToday())
        }
        moveTargets={moveTargets}
        onClose={() => setContextMenu(null)}
        onEdit={() => {
          if (!activeContextTask) return;
          onEdit(activeContextTask.task.id);
        }}
        onToggle={() => {
          if (!activeContextTask) return;
          void onToggle(activeContextTask.task.id);
        }}
        onMove={(targetSection) => {
          if (!activeContextTask) return;
          void onMove(activeContextTask.section.name, targetSection, activeContextTask.task.id);
        }}
        onDelete={() => {
          if (!activeContextTask) return;
          void onDelete(activeContextTask.section.name, activeContextTask.task.id);
        }}
      />
    </div>
  );
}
