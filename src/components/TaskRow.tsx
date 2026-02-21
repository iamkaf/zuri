import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconCheck,
  IconEdit,
  IconCalendar,
  IconFlag,
  IconClock,
  IconRepeat,
} from '../Icons';
import type { Task, ZuriSettings } from '../preload';
import { isoToday, recurStateSuffix } from '../lib/date';
import styles from './TaskRow.module.css';

export type TaskRowProps = {
  task: Task;
  settings: ZuriSettings | null;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  isPendingRemoval?: boolean;
  isFocused?: boolean;
};

export const TaskRow = forwardRef<HTMLDivElement, TaskRowProps>(function TaskRow(
  { task, settings, onToggle, onEdit, isDragging, dragHandleProps, style, isPendingRemoval, isFocused },
  ref,
) {
  const pri =
    settings?.features.priority && task.priority ? (
      <span className={`${styles.pill} ${task.priority === 'P0' ? styles.priP0 : task.priority === 'P1' ? styles.priP1 : task.priority === 'P2' ? styles.priP2 : styles.priP3}`}>
        <IconFlag size={10} />
        {task.priority}
      </span>
    ) : null;
  const eff =
    settings?.features.effort && task.effort ? (
      <span className={styles.pill}>
        <IconClock size={10} />
        {task.effort}
      </span>
    ) : null;
  // For recurring tasks the due date is an implementation detail of the cycle;
  // it's folded into the recur pill instead of shown separately.
  const due = !task.recur && task.due ? (
    <span className={`${styles.pill} ${styles.due}`}>
      <IconCalendar size={10} />
      {task.due}
    </span>
  ) : null;

  const recur = (() => {
    if (!settings?.features.recurring || !task.recur) return null;
    const today = isoToday();
    const isOverdue =
      !!task.due && task.due < today && task.lastDone !== today;
    const suffix = recurStateSuffix(task.due, task.lastDone);
    return (
      <span className={`${styles.pill} ${styles.recur}${isOverdue ? ` ${styles.recurOverdue}` : ''}`}>
        <IconRepeat size={10} />
        {task.recur}{suffix}
      </span>
    );
  })();

  const isDoneToday = !!task.recur && task.lastDone === isoToday();

  const classes = [
    styles.task,
    task.done || isDoneToday ? styles.isDone : '',
    isDragging ? styles.isDragging : '',
    isPendingRemoval ? styles.isPendingRemoval : '',
    isFocused ? styles.isFocused : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      data-task-id={task.id}
      style={style}
      {...dragHandleProps}
    >
      <button
        className={styles.taskCheck}
        data-task-check
        aria-label="Toggle done"
        onClick={() => void onToggle(task.id)}
      >
        {task.done || isDoneToday ? <IconCheck size={12} /> : null}
      </button>
      <div className={styles.taskContent}>
        <div className={styles.taskTitle}>{task.title}</div>
        <div className={styles.taskMeta}>
          {pri}
          {eff}
          {due}
          {recur}
        </div>
      </div>
      <div className={styles.taskActions}>
        <button className="btn btn-ghost btn-small" onClick={() => onEdit(task.id)}>
          <IconEdit size={14} />
        </button>
      </div>
    </div>
  );
});

export type SortableTaskRowProps = {
  task: Task;
  settings: ZuriSettings | null;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  isPendingRemoval?: boolean;
  isFocused?: boolean;
};

export function SortableTaskRow({ task, settings, onToggle, onEdit, isPendingRemoval, isFocused }: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskRow
      ref={setNodeRef}
      style={style}
      task={task}
      settings={settings}
      onToggle={onToggle}
      onEdit={onEdit}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
      isPendingRemoval={isPendingRemoval}
      isFocused={isFocused}
    />
  );
}
