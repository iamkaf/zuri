import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck, IconChevronRight, IconEdit, IconFolder, IconTrash } from '../Icons';
import { cn } from '../lib/cn';

export type TaskContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  isDone: boolean;
  moveTargets: string[];
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onMove: (section: string) => void;
  onDelete: () => void;
};

export function TaskContextMenu({
  open,
  x,
  y,
  isDone,
  moveTargets,
  onClose,
  onEdit,
  onToggle,
  onMove,
  onDelete,
}: TaskContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useLayoutEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    if (!menu) return;

    const margin = 12;
    const nextX = Math.min(x, window.innerWidth - menu.offsetWidth - margin);
    const nextY = Math.min(y, window.innerHeight - menu.offsetHeight - margin);
    setPosition({
      x: Math.max(margin, nextX),
      y: Math.max(margin, nextY),
    });
  }, [open, x, y]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="task-context-menu"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="Task actions"
      onContextMenu={(event) => event.preventDefault()}
    >
      <button
        type="button"
        className="task-context-menu__item"
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <span className="task-context-menu__item-main">
          <IconEdit size={14} />
          Edit task
        </span>
      </button>

      <button
        type="button"
        className="task-context-menu__item"
        onClick={() => {
          onToggle();
          onClose();
        }}
      >
        <span className="task-context-menu__item-main">
          <IconCheck size={14} />
          {isDone ? 'Mark as open' : 'Mark as done'}
        </span>
      </button>

      <div className="task-context-menu__divider" />

      <div className="task-context-menu__group-label">Move to section</div>
      {moveTargets.length > 0 ? (
        moveTargets.map((section) => (
          <button
            key={section}
            type="button"
            className="task-context-menu__item"
            onClick={() => {
              onMove(section);
              onClose();
            }}
          >
            <span className="task-context-menu__item-main">
              <IconFolder size={14} />
              {section}
            </span>
            <IconChevronRight size={13} className="task-context-menu__item-trailing" />
          </button>
        ))
      ) : (
        <div className={cn('task-context-menu__item', 'task-context-menu__item--disabled')}>
          <span className="task-context-menu__item-main">
            <IconFolder size={14} />
            No other sections
          </span>
        </div>
      )}

      <div className="task-context-menu__divider" />

      <button
        type="button"
        className={cn('task-context-menu__item', 'task-context-menu__item--danger')}
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <span className="task-context-menu__item-main">
          <IconTrash size={14} />
          Delete task
        </span>
      </button>
    </div>,
    document.body,
  );
}
