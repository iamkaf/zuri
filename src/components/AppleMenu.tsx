import {
  IconTask,
  IconSettings,
  IconApple,
  IconWindows,
  IconSparkle,
} from '../Icons';
import type { ThemeId } from '../preload';
import type { Page } from '../types';
import { cn } from '../lib/cn';
import { getThemeFamily } from '../lib/theme';

export type AppleMenuProps = {
  menuOpen: boolean;
  menuClosing?: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  theme: ThemeId;
  page: Page;
  onSetPage: (page: Page) => void;
  onSetThemeFamily: (family: 'apple' | 'windows' | 'open') => Promise<void>;
  onClose: () => void;
};

export function AppleMenu({
  menuOpen,
  menuClosing,
  menuRef,
  theme,
  page,
  onSetPage,
  onSetThemeFamily,
  onClose,
}: AppleMenuProps) {
  if (!menuOpen) return null;

  const handlePage = (p: Page) => {
    onSetPage(p);
    onClose();
  };

  const handleTheme = (family: 'apple' | 'windows' | 'open') => {
    void onSetThemeFamily(family);
    onClose();
  };

  const menuClass = cn(
    'absolute top-full right-0 z-50 min-w-[160px] p-1.5',
    'bg-surface backdrop-blur-xl border border-edge rounded-[10px]',
    'shadow-[var(--inner-highlight,none),0_8px_24px_rgba(0,0,0,0.2)] mt-1 origin-top-right',
    menuClosing
      ? 'animate-[appleMenuExit_100ms_ease-in_both]'
      : 'animate-[appleMenuEnter_150ms_ease-out_both]',
  );

  const itemClass = (active: boolean) => cn(
    'flex items-center gap-[10px] w-full px-[10px] py-2',
    'border-none bg-transparent text-[13px] font-medium text-left',
    'rounded-[6px] cursor-pointer transition-colors',
    'hover:bg-accent hover:text-white',
    active ? 'text-accent' : 'text-text',
  );

  return (
    <div ref={menuRef} className={menuClass}>
      <button className={itemClass(page === 'tasks')} onClick={() => handlePage('tasks')}>
        <IconTask size={16} />
        <span>Tasks</span>
      </button>
      <button className={itemClass(page === 'settings')} onClick={() => handlePage('settings')}>
        <IconSettings size={16} />
        <span>Settings</span>
      </button>
      <div className="h-px bg-edge mx-1 my-1.5" />
      <button
        className={itemClass(getThemeFamily(theme) === 'apple')}
        onClick={() => handleTheme('apple')}
      >
        <IconApple size={16} />
        <span>Apple Theme</span>
      </button>
      <button
        className={itemClass(getThemeFamily(theme) === 'windows')}
        onClick={() => handleTheme('windows')}
      >
        <IconWindows size={16} />
        <span>Windows Theme</span>
      </button>
      <button
        className={itemClass(getThemeFamily(theme) === 'open')}
        onClick={() => handleTheme('open')}
      >
        <IconSparkle size={16} />
        <span>Open Theme</span>
      </button>
    </div>
  );
}
