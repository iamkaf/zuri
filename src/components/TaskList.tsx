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
import { IconCheck, IconFolder } from '../Icons';
import type { Section, Task, ZuriSettings } from '../preload';
import { isoToday } from '../lib/date';
import { SortableTaskRow } from './TaskRow';
import { TaskContextMenu } from './TaskContextMenu';

export type TaskListProps = {
  tasks: Task[];
  section: Section | null;
  sections: Section[];
  settings: ZuriSettings | null;
  pendingRemovals: Set<string>;
  focusedTaskId: string | null;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  onMove: (fromSection: string, toSection: string, taskId: string) => Promise<void>;
  onDelete: (section: string, taskId: string) => Promise<void>;
  onReorder: (section: string, fromIndex: number, toIndex: number) => Promise<void>;
  sectionName: string | null;
};

export function TaskList({
  tasks,
  section,
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
}: TaskListProps) {
  const [contextMenu, setContextMenu] = useState<{ taskId: string; x: number; y: number } | null>(
    null,
  );
  const taskIds = tasks.map((task) => task.id).join('|');

  useEffect(() => {
    if (!focusedTaskId) return;
    const el = document.querySelector(`[data-task-id="${focusedTaskId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedTaskId]);

  useEffect(() => {
    setContextMenu(null);
  }, [sectionName, taskIds]);

  const enabledSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sensors = contextMenu ? [] : enabledSensors;
  const activeContextTask =
    contextMenu === null ? null : (tasks.find((task) => task.id === contextMenu.taskId) ?? null);
  const moveTargets =
    sectionName === null ? [] : sections.filter((entry) => entry.name !== sectionName).map((entry) => entry.name);

  const handleDragEnd = (event: DragEndEvent) => {
    if (contextMenu) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!sectionName) return;

    const allTasks = section?.tasks ?? [];
    const oldIndex = allTasks.findIndex((t) => t.id === active.id);
    const newIndex = allTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void onReorder(sectionName, oldIndex, newIndex);
  };

  if (section === null) {
    return (
      <div data-task-list className="flex-1 overflow-y-auto p-2">
        <div className="hint">
          <IconFolder size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>Create your first section to get started.</div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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

      <TaskContextMenu
        open={activeContextTask !== null && contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        isDone={
          !!activeContextTask &&
          (activeContextTask.done || activeContextTask.lastDone === isoToday())
        }
        moveTargets={moveTargets}
        onClose={() => setContextMenu(null)}
        onEdit={() => {
          if (!activeContextTask) return;
          onEdit(activeContextTask.id);
        }}
        onToggle={() => {
          if (!activeContextTask) return;
          void onToggle(activeContextTask.id);
        }}
        onMove={(targetSection) => {
          if (!activeContextTask || !sectionName) return;
          void onMove(sectionName, targetSection, activeContextTask.id);
        }}
        onDelete={() => {
          if (!activeContextTask || !sectionName) return;
          void onDelete(sectionName, activeContextTask.id);
        }}
      />
    </div>
  );
}
