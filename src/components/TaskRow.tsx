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

const pad2 = (n: number) => String(n).padStart(2, '0');
const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// Returns the status suffix shown inside the recur pill, e.g. "· done today" or "· Feb 21"
const recurStateSuffix = (due: string | undefined, lastDone: string | undefined): string => {
  const today = isoToday();
  if (lastDone === today) return ' · done today';
  if (due) {
    const diffMs = new Date(due + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime();
    const diffDays = Math.round(diffMs / 86_400_000);
    if (diffDays < 0) return ` · ${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return ' · due today';
    if (diffDays === 1) return ' · tomorrow';
    return ` · ${new Date(due + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  }
  if (lastDone) {
    return ` · done ${new Date(lastDone + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  }
  return '';
};
import type { Task, ZuriSettings } from '../preload';

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
      <span className={`pill pri-${task.priority}`}>
        <IconFlag size={10} />
        {task.priority}
      </span>
    ) : null;
  const eff =
    settings?.features.effort && task.effort ? (
      <span className="pill effort">
        <IconClock size={10} />
        {task.effort}
      </span>
    ) : null;
  // For recurring tasks the due date is an implementation detail of the cycle;
  // it's folded into the recur pill instead of shown separately.
  const due = !task.recur && task.due ? (
    <span className="pill due">
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
      <span className={`pill recur${isOverdue ? ' recur-overdue' : ''}`}>
        <IconRepeat size={10} />
        {task.recur}{suffix}
      </span>
    );
  })();

  const isDoneToday = !!task.recur && task.lastDone === isoToday();

  return (
    <div
      ref={ref}
      className={`task ${task.done || isDoneToday ? 'isDone' : ''} ${isDragging ? 'isDragging' : ''} ${isPendingRemoval ? 'isPendingRemoval' : ''} ${isFocused ? 'isFocused' : ''}`}
      data-task-id={task.id}
      style={style}
      {...dragHandleProps}
    >
      <button
        className="task-check"
        aria-label="Toggle done"
        onClick={() => void onToggle(task.id)}
      >
        {task.done || isDoneToday ? <IconCheck size={12} /> : null}
      </button>
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {pri}
          {eff}
          {due}
          {recur}
        </div>
      </div>
      <div className="task-actions">
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
