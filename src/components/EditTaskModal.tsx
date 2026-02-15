import { useCallback, useEffect, useState } from 'react';
import { IconClose } from '../Icons';
import type { Task, ZuriSettings } from '../preload';
import type { EditingState } from '../types';

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

  useEffect(() => {
    if (!editing) return;
    setTitle(editing.task.title);
    setPriority(editing.task.priority ?? '');
    setEffort(editing.task.effort ?? '');
    setDue(editing.task.due ?? '');
  }, [editing]);

  const isPriority = (value: string): value is Task['priority'] =>
    ['P0', 'P1', 'P2', 'P3'].includes(value);

  const isEffort = (value: string): value is Task['effort'] =>
    ['XS', 'S', 'M', 'L', 'XL'].includes(value);

  const handleSave = useCallback(() => {
    if (!editing) return;
    const patch: Partial<Task> = {
      title: title.trim() || editing.task.title,
      priority: isPriority(priority) ? priority : undefined,
      effort: isEffort(effort) ? effort : undefined,
      due: due.trim() === '' ? undefined : due.trim(),
    };
    void onSave(editing.section, editing.task, patch);
  }, [editing, title, priority, effort, due, onSave]);

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

  return (
    <div className="modal" aria-hidden="false">
      <div className="backdrop" onClick={onClose}></div>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-head">
          <div>
            <div className="sheet-title">Edit task</div>
            <div className="sheet-subtitle">{editing.section}</div>
          </div>
          <button className="btn btn-ghost btn-small" onClick={onClose}>
            <IconClose size={16} />
          </button>
        </div>

        <div className="sheet-body">
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
            <input
              className="input"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
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
  );
}
