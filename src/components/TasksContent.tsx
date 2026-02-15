import { useEffect, useRef, useState } from 'react';
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
import {
  IconCheck,
  IconPlus,
  IconFolder,
  IconFile,
  IconEllipsis,
} from '../Icons';
import type { Section, ThemeId, ZuriSettings } from '../preload';
import type { AppState, Page, TaskFilter } from '../types';
import { filteredTasks } from '../theme';
import { SortableTaskRow } from './TaskRow';
import { AppleMenu } from './AppleMenu';

export type TasksContentProps = {
  app: AppState;
  setApp?: React.Dispatch<React.SetStateAction<AppState>>;
  currentSection: Section | null;
  onPickMarkdown: () => Promise<void>;
  onSetFilter: (filter: TaskFilter) => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onAddTask: (title: string) => Promise<void>;
  onAddSection: () => Promise<void>;
  onReorderTask: (section: string, fromIndex: number, toIndex: number) => Promise<void>;
  isApple: boolean;
  onOpenMenu?: () => void;
  onCloseMenu?: () => void;
  menuOpen?: boolean;
  menuClosing?: boolean;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  theme?: ThemeId;
  onSetPage?: (page: Page) => void;
  onSetThemeFamily?: (family: 'apple' | 'windows' | 'open') => Promise<void>;
};

export function TasksContent({
  app,
  setApp,
  currentSection,
  onPickMarkdown,
  onSetFilter,
  onToggleTask,
  onEditTask,
  onAddTask,
  onAddSection,
  onReorderTask,
  isApple,
  onOpenMenu,
  onCloseMenu,
  menuOpen,
  menuClosing,
  menuRef,
  theme,
  onSetPage,
  onSetThemeFamily,
}: TasksContentProps) {
  const [title, setTitle] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (app.showAddInput && !isApple) {
      addInputRef.current?.focus();
      if (setApp) setApp((prev) => ({ ...prev, showAddInput: false }));
    }
  }, [app.showAddInput, isApple, setApp]);

  useEffect(() => {
    if (!app.focusedTaskId) return;
    const el = document.querySelector(`[data-task-id="${app.focusedTaskId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [app.focusedTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!app.settings?.markdownPath) {
    return (
      <div className="empty">
        <div className="empty-card">
          <IconFile size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h2>Pick a markdown file</h2>
          <p>Zuri reads and writes a single .md file. Changes sync live.</p>
          <button className="btn btn-primary" onClick={() => void onPickMarkdown()}>
            Choose file...
          </button>
        </div>
      </div>
    );
  }

  const getVisibleTasks = (
    section: Section | null,
    filter: TaskFilter,
    pendingRemovals: Set<string>,
  ) => {
    if (!section) return [];
    const base = filteredTasks(section, filter);
    if (filter === 'open') {
      const pending = section.tasks.filter(
        (t) => t.done && pendingRemovals.has(t.id),
      );
      return [...base, ...pending];
    }
    return base;
  };

  const rows = getVisibleTasks(currentSection, app.filter, isApple ? app.pendingRemovals : new Set());

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!app.section) return;

    const allTasks = currentSection?.tasks ?? [];
    const oldIndex = allTasks.findIndex((t) => t.id === active.id);
    const newIndex = allTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    void onReorderTask(app.section, oldIndex, newIndex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    void onAddTask(value);
    setTitle('');
  };

  const headerRight = isApple ? (
    <div className="apple-menu-trigger">
      <button className="btn btn-ghost btn-small" onClick={onOpenMenu}>
        <IconEllipsis size={16} />
      </button>
      {menuOpen && menuRef && theme && onSetPage && onSetThemeFamily && onCloseMenu && (
        <AppleMenu
          menuOpen={menuOpen}
          menuClosing={menuClosing}
          menuRef={menuRef}
          theme={theme}
          page={app.page}
          onSetPage={onSetPage}
          onSetThemeFamily={onSetThemeFamily}
          onClose={onCloseMenu}
        />
      )}
    </div>
  ) : (
    <button className="btn btn-small" onClick={() => void onAddSection()}>
      <IconPlus size={14} />
      Section
    </button>
  );

  return (
    <>
      <div className="content-header">
        <div className="content-header-top">
          <h1 className="content-title">{currentSection?.name ?? 'Tasks'}</h1>
          {headerRight}
        </div>
        <div className="filters">
          <button
            className={`filter-btn ${app.filter === 'open' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('open')}
          >
            Open
          </button>
          <button
            className={`filter-btn ${app.filter === 'all' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${app.filter === 'done' ? 'isActive' : ''}`}
            onClick={() => onSetFilter('done')}
          >
            Done
          </button>
        </div>
        {!isApple && (
          <form className="add-task" onSubmit={handleSubmit}>
            <input
              ref={addInputRef}
              className="input"
              placeholder="Add a task..."
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setTitle('');
                  addInputRef.current?.blur();
                }
              }}
            />
            <button className="btn btn-primary" type="submit">
              <IconPlus size={14} />
              Add
            </button>
          </form>
        )}
      </div>

      <div className="task-list">
        {currentSection == null ? (
          <div className="hint">
            <IconFolder size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>Create your first section to get started.</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <IconCheck className="empty-icon" size={48} />
            <div className="empty-title">All caught up!</div>
            <div className="empty-text">No tasks to show.</div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rows.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {rows.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  settings={app.settings}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  isPendingRemoval={isApple && app.pendingRemovals.has(task.id)}
                  isFocused={app.focusedTaskId === task.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        {isApple && app.showAddInput && (
          <div className="apple-add-task">
            <div className="task-check apple-add-task-check" />
            <input
              className="apple-add-task-input"
              placeholder="Add a task..."
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = title.trim();
                  if (value) {
                    void onAddTask(value);
                    setTitle('');
                  }
                }
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setTitle('');
                  if (setApp) setApp((prev) => ({ ...prev, showAddInput: false }));
                }
              }}
              autoFocus
            />
          </div>
        )}
      </div>
    </>
  );
}
