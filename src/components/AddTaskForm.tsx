import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { IconPlus } from '../Icons';

export type AddTaskFormHandle = {
  focus: () => void;
};

export type AddTaskFormProps = {
  onAdd: (title: string) => Promise<void>;
  autoFocusTrigger?: boolean;
  onAutoFocusConsumed?: () => void;
};

export const AddTaskForm = forwardRef<AddTaskFormHandle, AddTaskFormProps>(function AddTaskForm(
  { onAdd, autoFocusTrigger, onAutoFocusConsumed },
  ref,
) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (autoFocusTrigger) {
      inputRef.current?.focus();
      onAutoFocusConsumed?.();
    }
  }, [autoFocusTrigger, onAutoFocusConsumed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    void onAdd(value);
    setTitle('');
  };

  return (
    <form className="flex gap-2 px-3 pb-3" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="input"
        placeholder="Add a task..."
        autoComplete="off"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setTitle('');
            inputRef.current?.blur();
          }
        }}
      />
      <button className="btn btn-primary" type="submit">
        <IconPlus size={14} />
        Add
      </button>
    </form>
  );
});
