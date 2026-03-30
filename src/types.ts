import type { DocModel, Section, Task, ThemeId, ZuriSettings } from './preload';

export type Page = 'tasks' | 'settings';
export type TaskFilter = 'open' | 'all' | 'done';
export type AddSectionResult =
  | { status: 'created'; section: string }
  | { status: 'invalid'; reason: 'empty' }
  | { status: 'invalid'; reason: 'duplicate'; section: string };

export type EditingState = {
  section: string;
  task: Task;
};

export type AppState = {
  settings: ZuriSettings | null;
  model: DocModel;
  page: Page;
  section: string | null;
  filter: TaskFilter;
  editing: EditingState | null;
  showAddInput: boolean;
  pendingRemovals: Set<string>;
  focusedTaskId: string | null;
};

export type LayoutProps = {
  app: AppState;
  setApp: React.Dispatch<React.SetStateAction<AppState>>;
  theme: ThemeId;
  currentSection: Section | null;
  onSetPage: (page: Page) => void;
  onSetThemeFamily: (family: 'apple' | 'windows' | 'open') => Promise<void>;
  onPickMarkdown: () => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string) => void;
  onMoveTask: (fromSection: string, toSection: string, taskId: string) => Promise<void>;
  onDeleteTask: (section: string, taskId: string) => Promise<void>;
  onSelectSection: (name: string) => void;
  onAddTask: (title: string) => Promise<void>;
  onAddSection: (name: string) => Promise<AddSectionResult>;
  onReorderTask: (section: string, fromIndex: number, toIndex: number) => Promise<void>;
  onSaveTask: (section: string, task: Task, patch: Partial<Task>) => Promise<void>;
};
