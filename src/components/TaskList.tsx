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
import { useEffect } from 'react';
import { IconCheck, IconFolder } from '../Icons';
import type { Section, Task, ZuriSettings } from '../preload';
import { SortableTaskRow } from './TaskRow';
import styles from './TaskList.module.css';

export type TaskListProps = {
  tasks: Task[];
  section: Section | null;
  settings: ZuriSettings | null;
  pendingRemovals: Set<string>;
  focusedTaskId: string | null;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  onReorder: (section: string, fromIndex: number, toIndex: number) => Promise<void>;
  sectionName: string | null;
};

export function TaskList({
  tasks,
  section,
  settings,
  pendingRemovals,
  focusedTaskId,
  onToggle,
  onEdit,
  onReorder,
  sectionName,
}: TaskListProps) {
  useEffect(() => {
    if (!focusedTaskId) return;
    const el = document.querySelector(`[data-task-id="${focusedTaskId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!sectionName) return;

    const allTasks = section?.tasks ?? [];
    const oldIndex = allTasks.findIndex((t) => t.id === active.id);
    const newIndex = allTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void onReorder(sectionName, oldIndex, newIndex);
  };

  if (section == null) {
    return (
      <div className={styles.taskList}>
        <div className="hint">
          <IconFolder size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>Create your first section to get started.</div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.taskList}>
        <div className="empty">
          <IconCheck className="empty-icon" size={48} />
          <div className="empty-title">All caught up!</div>
          <div className="empty-text">No tasks to show.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.taskList}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskRow
              key={task.id}
              task={task}
              settings={settings}
              onToggle={onToggle}
              onEdit={onEdit}
              isPendingRemoval={pendingRemovals.has(task.id)}
              isFocused={focusedTaskId === task.id}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
