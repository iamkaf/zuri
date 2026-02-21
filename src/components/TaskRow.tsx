import { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconCheck, IconEdit, IconCalendar, IconFlag, IconClock, IconRepeat } from '../Icons';
import type { Task, ZuriSettings } from '../preload';
import { isoToday, recurStateSuffix } from '../lib/date';
import { cn } from '../lib/cn';

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
  {
    task,
    settings,
    onToggle,
    onEdit,
    isDragging,
    dragHandleProps,
    style,
    isPendingRemoval,
    isFocused,
  },
  ref,
) {
  const isDoneToday = !!task.recur && task.lastDone === isoToday();
  const isDone = task.done || isDoneToday;

  const pri =
    settings?.features.priority && task.priority ? (
      <span
        className={cn(
          'inline-flex items-center gap-[3px] px-[6px] py-px rounded text-[10px] font-medium',
          task.priority === 'P0' &&
            'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger font-semibold',
          task.priority === 'P1' &&
            'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warn',
          (task.priority === 'P2' || task.priority === 'P3') &&
            'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent',
        )}
      >
        <IconFlag size={10} />
        {task.priority}
      </span>
    ) : null;

  const eff =
    settings?.features.effort && task.effort ? (
      <span className="inline-flex items-center gap-[3px] px-[6px] py-px rounded bg-overlay text-muted text-[10px] font-medium">
        <IconClock size={10} />
        {task.effort}
      </span>
    ) : null;

  const due =
    !task.recur && task.due ? (
      <span className="inline-flex items-center gap-[3px] px-[6px] py-px rounded bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent text-[10px] font-medium">
        <IconCalendar size={10} />
        {task.due}
      </span>
    ) : null;

  const recur = (() => {
    if (!settings?.features.recurring || !task.recur) return null;
    const today = isoToday();
    const isOverdue = !!task.due && task.due < today && task.lastDone !== today;
    const suffix = recurStateSuffix(task.due, task.lastDone);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-[3px] px-[6px] py-px rounded text-[10px] font-medium',
          isOverdue
            ? 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warn'
            : 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success',
        )}
      >
        <IconRepeat size={10} />
        {task.recur}
        {suffix}
      </span>
    );
  })();

  return (
    <div
      ref={ref}
      data-task-card
      data-task-id={task.id}
      data-focused={isFocused ? 'true' : undefined}
      data-done={isDone ? 'true' : undefined}
      data-dragging={isDragging ? 'true' : undefined}
      data-pending-removal={isPendingRemoval ? 'true' : undefined}
      className={cn(
        'group grid grid-cols-[auto_1fr_auto] gap-[10px] items-center',
        'py-[10px] px-3 mb-1 bg-surface border border-edge rounded-[var(--radius)]',
        'transition-all cursor-grab active:cursor-grabbing hover:border-edge-strong',
        isDragging && 'opacity-50 shadow-lg',
        isFocused && 'border-accent shadow-[0_0_0_1px_var(--accent)]',
        isDone && 'opacity-[0.55]',
        isPendingRemoval && 'opacity-[0.55]',
      )}
      style={style}
      {...dragHandleProps}
    >
      <button
        className={cn(
          'w-[18px] h-[18px] border-[1.5px] rounded-sm bg-transparent cursor-pointer',
          'grid place-items-center shrink-0 transition-all',
          isDone
            ? 'bg-success border-success text-white'
            : 'border-edge-strong text-transparent hover:border-accent',
        )}
        data-task-check
        aria-label="Toggle done"
        onClick={() => void onToggle(task.id)}
      >
        {isDone ? <IconCheck size={12} /> : null}
      </button>
      <div className="min-w-0 flex flex-col gap-0.5">
        <div
          className={cn(
            'font-medium text-[13px] overflow-hidden text-ellipsis whitespace-nowrap',
            isDone && 'line-through text-muted',
          )}
        >
          {task.title}
        </div>
        <div className="flex gap-1 flex-wrap">
          {pri}
          {eff}
          {due}
          {recur}
        </div>
      </div>
      <div
        className={cn(
          'flex gap-1 opacity-0 transition-opacity group-hover:opacity-100',
          isFocused && 'opacity-100',
        )}
      >
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

export function SortableTaskRow({
  task,
  settings,
  onToggle,
  onEdit,
  isPendingRemoval,
  isFocused,
}: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

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
