import { useCallback, useEffect, useState } from 'react';
import { IconClose, IconCode } from '../Icons';
import type { Effort, Priority, RecurPattern, Task, ZuriSettings } from '../preload';
import type { EditingState } from '../types';
import { cn } from '../lib/cn';

const taskToRaw = (task: Task): string => {
  const lines: string[] = [];
  lines.push(`- [${task.done ? 'x' : ' '}] ${task.title}`);
  if (task.priority) lines.push(`  - priority: ${task.priority}`);
  if (task.effort) lines.push(`  - effort: ${task.effort}`);
  if (task.due) lines.push(`  - due: ${task.due}`);
  if (task.recur) lines.push(`  - recur: ${task.recur}`);
  if (task.lastDone) lines.push(`  - lastDone: ${task.lastDone}`);
  for (const [k, v] of Object.entries(task.extra ?? {})) lines.push(`  - ${k}: ${v}`);
  return lines.join('\n');
};

export type EditTaskModalProps = {
  editing: EditingState | null;
  settings: ZuriSettings | null;
  onClose: () => void;
  onSave: (section: string, task: Task, patch: Partial<Task>) => Promise<void>;
};

export function EditTaskModal({ editing, settings, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('');
  const [effort, setEffort] = useState('');
  const [due, setDue] = useState('');
  const [recurSelect, setRecurSelect] = useState('');
  const [recurDays, setRecurDays] = useState(7);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    setShowRaw(false);
    if (!editing) return;
    setTitle(editing.task.title);
    setPriority(editing.task.priority ?? '');
    setEffort(editing.task.effort ?? '');
    setDue(editing.task.due ?? '');
    const recur = editing.task.recur;
    if (!recur) {
      setRecurSelect('');
    } else if (/^every \d+ days$/.test(recur)) {
      setRecurSelect('custom');
      setRecurDays(parseInt(recur.split(' ')[1], 10));
    } else {
      setRecurSelect(recur);
    }
  }, [editing]);

  const isPriority = (value: string): value is Priority => ['P0', 'P1', 'P2', 'P3'].includes(value);

  const isEffort = (value: string): value is Effort => ['XS', 'S', 'M', 'L', 'XL'].includes(value);

  const handleSave = useCallback(() => {
    if (!editing) return;
    const recur: RecurPattern | undefined =
      recurSelect === ''
        ? undefined
        : recurSelect === 'custom'
          ? (`every ${recurDays} days` as RecurPattern)
          : (recurSelect as RecurPattern);
    const patch: Partial<Task> = {
      title: title.trim() || editing.task.title,
      priority: isPriority(priority) ? priority : undefined,
      effort: isEffort(effort) ? effort : undefined,
      due: due.trim() === '' ? undefined : due.trim(),
      recur,
    };
    void onSave(editing.section, editing.task, patch);
  }, [editing, title, priority, effort, due, recurSelect, recurDays, onSave]);

  useEffect(() => {
    if (!editing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, onClose, handleSave]);

  if (!editing || !settings) return null;

  const canPriority = settings.features.priority;
  const canEffort = settings.features.effort;
  const canRecurring = settings.features.recurring;

  return (
    <div className="modal" aria-hidden="false">
      <div className="backdrop" onClick={onClose}></div>
      <div
        data-modal-sheet
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-24px)] max-w-[380px] bg-surface border border-edge rounded-[var(--radius)] shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        <div
          data-sheet-head
          className="flex items-center justify-between px-3 py-[10px] border-b border-edge"
        >
          <div>
            <div className="text-sm font-semibold">Edit task</div>
            <div className="text-[11px] text-muted mt-px">{editing.section}</div>
          </div>
          <div className="flex gap-1">
            {settings.devMode && (
              <button
                className={cn('btn btn-ghost btn-small', showRaw && 'text-accent')}
                onClick={() => setShowRaw((v) => !v)}
                title="Raw markdown"
              >
                <IconCode size={14} />
              </button>
            )}
            <button className="btn btn-ghost btn-small" onClick={onClose}>
              <IconClose size={16} />
            </button>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-[10px]">
          {showRaw ? (
            <pre className="font-mono text-[11px] leading-relaxed bg-overlay text-text border border-edge rounded-[6px] px-3.5 py-3 m-0 whitespace-pre overflow-x-auto">
              {taskToRaw(editing.task)}
            </pre>
          ) : null}
          <div style={showRaw ? { display: 'none' } : undefined}>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted font-medium">Title</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            <div className="grid grid-cols-2 gap-[10px]">
              <label
                className={cn(
                  'flex flex-col gap-1',
                  !canPriority && 'opacity-50 pointer-events-none',
                )}
              >
                <span className="text-[11px] text-muted font-medium">Priority</span>
                <select
                  className="input"
                  disabled={!canPriority}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">None</option>
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                </select>
              </label>

              <label
                className={cn(
                  'flex flex-col gap-1',
                  !canEffort && 'opacity-50 pointer-events-none',
                )}
              >
                <span className="text-[11px] text-muted font-medium">Effort</span>
                <select
                  className="input"
                  disabled={!canEffort}
                  value={effort}
                  onChange={(e) => setEffort(e.target.value)}
                >
                  <option value="">None</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted font-medium">Due date</span>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
                {due && (
                  <button className="btn btn-ghost" type="button" onClick={() => setDue('')}>
                    Clear
                  </button>
                )}
              </div>
            </label>

            <label
              className={cn(
                'flex flex-col gap-1',
                !canRecurring && 'opacity-50 pointer-events-none',
              )}
            >
              <span className="text-[11px] text-muted font-medium">Repeat</span>
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  disabled={!canRecurring}
                  value={recurSelect}
                  onChange={(e) => setRecurSelect(e.target.value)}
                >
                  <option value="">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon–Fri)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Every N days…</option>
                </select>
                {recurSelect === 'custom' && (
                  <input
                    className="input"
                    type="number"
                    min={2}
                    max={365}
                    value={recurDays}
                    onChange={(e) => setRecurDays(Math.max(2, parseInt(e.target.value, 10) || 2))}
                    style={{ width: 64 }}
                  />
                )}
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
