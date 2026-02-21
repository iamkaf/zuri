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
const isoYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const fmtLastDone = (dateStr: string): string => {
  if (dateStr === isoToday()) return 'done today';
  if (dateStr === isoYesterday()) return 'done yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return `done ${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
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
  const due = task.due ? (
    <span className="pill due">
      <IconCalendar size={10} />
      {task.due}
    </span>
  ) : null;
  const recur =
    settings?.features.recurring && task.recur ? (
      <span className="pill recur">
        <IconRepeat size={10} />
        {task.recur}
      </span>
    ) : null;
  const lastDone =
    settings?.features.recurring && task.recur && task.lastDone ? (
      <span className={`pill lastDone ${task.lastDone === isoToday() ? 'lastDone-today' : ''}`}>
        <IconCheck size={10} />
        {fmtLastDone(task.lastDone)}
      </span>
    ) : null;

  return (
    <div
      ref={ref}
      className={`task ${task.done ? 'isDone' : ''} ${isDragging ? 'isDragging' : ''} ${isPendingRemoval ? 'isPendingRemoval' : ''} ${isFocused ? 'isFocused' : ''}`}
      data-task-id={task.id}
      style={style}
      {...dragHandleProps}
    >
      <button
        className="task-check"
        aria-label="Toggle done"
        onClick={() => void onToggle(task.id)}
      >
        {task.done ? <IconCheck size={12} /> : null}
      </button>
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {pri}
          {eff}
          {due}
          {recur}
          {lastDone}
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
