import { useCallback, useEffect, useState } from 'react';
import { IconClose, IconCode } from '../Icons';
import type { RecurPattern, Task, ZuriSettings } from '../preload';
import type { EditingState } from '../types';

const taskToRaw = (task: Task): string => {
  const lines: string[] = [];
  lines.push(`- [${task.done ? 'x' : ' '}] ${task.title}`);
  if (task.priority) lines.push(`  - priority: ${task.priority}`);
  if (task.effort)   lines.push(`  - effort: ${task.effort}`);
  if (task.due)      lines.push(`  - due: ${task.due}`);
  if (task.recur)    lines.push(`  - recur: ${task.recur}`);
  if (task.lastDone) lines.push(`  - lastDone: ${task.lastDone}`);
  for (const [k, v] of Object.entries(task.extra ?? {}))
    lines.push(`  - ${k}: ${v}`);
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

  const isPriority = (value: string): value is Task['priority'] =>
    ['P0', 'P1', 'P2', 'P3'].includes(value);

  const isEffort = (value: string): value is Task['effort'] =>
    ['XS', 'S', 'M', 'L', 'XL'].includes(value);

  const handleSave = useCallback(() => {
    if (!editing) return;
    const recur: RecurPattern | undefined =
      recurSelect === '' ? undefined :
      recurSelect === 'custom' ? `every ${recurDays} days` as RecurPattern :
      recurSelect as RecurPattern;
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
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-head">
          <div>
            <div className="sheet-title">Edit task</div>
            <div className="sheet-subtitle">{editing.section}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {settings.devMode && (
              <button
                className={`btn btn-ghost btn-small${showRaw ? ' isActive' : ''}`}
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

        <div className="sheet-body">
          {showRaw ? (
            <pre className="task-raw">{taskToRaw(editing.task)}</pre>
          ) : null}
          <div style={showRaw ? { display: 'none' } : undefined}>
          <label className="sheet-field">
            <span>Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="sheet-grid">
            <label className={`sheet-field ${canPriority ? '' : 'isDisabled'}`}>
              <span>Priority</span>
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

            <label className={`sheet-field ${canEffort ? '' : 'isDisabled'}`}>
              <span>Effort</span>
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

          <label className="sheet-field">
            <span>Due date</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                style={{ flex: 1 }}
              />
              {due && (
                <button className="btn btn-ghost" type="button" onClick={() => setDue('')}>
                  Clear
                </button>
              )}
            </div>
          </label>

          <label className={`sheet-field ${canRecurring ? '' : 'isDisabled'}`}>
            <span>Repeat</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="input"
                disabled={!canRecurring}
                value={recurSelect}
                onChange={(e) => setRecurSelect(e.target.value)}
                style={{ flex: 1 }}
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
                  onChange={(e) =>
                    setRecurDays(Math.max(2, parseInt(e.target.value, 10) || 2))
                  }
                  style={{ width: 64 }}
                />
              )}
            </div>
          </label>

          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
