import type { DocModel, Section, Task, ThemeId, ZuriSettings } from './preload';

export type Page = 'tasks' | 'settings';
export type TaskFilter = 'open' | 'all' | 'done';

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
  onAddTask: (title: string) => Promise<void>;
  onAddSection: () => Promise<void>;
  onReorderTask: (section: string, fromIndex: number, toIndex: number) => Promise<void>;
  onSaveTask: (section: string, task: Task, patch: Partial<Task>) => Promise<void>;
};
