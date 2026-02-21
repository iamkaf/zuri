import { cn } from '../lib/cn';
import type { TaskFilter } from '../types';

export type ContentHeaderProps = {
  title: string;
  filter: TaskFilter;
  onSetFilter: (filter: TaskFilter) => void;
  right?: React.ReactNode;
};

export function ContentHeader({ title, filter, onSetFilter, right }: ContentHeaderProps) {
  return (
    <div data-content-header className="flex flex-col gap-[10px] p-3 bg-bg border-b border-edge">
      <div className="flex items-center justify-between">
        <h1 data-content-title className="text-[18px] font-semibold">
          {title}
        </h1>
        {right}
      </div>
      <div className="flex gap-0.5 p-0.5 bg-overlay rounded">
        {(['open', 'all', 'done'] as const).map((f) => (
          <button
            key={f}
            className={cn(
              'h-[26px] px-[10px] border-none bg-transparent text-muted rounded text-xs font-medium cursor-pointer transition-all hover:text-text',
              filter === f && 'bg-surface text-text shadow-xs',
            )}
            onClick={() => onSetFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
