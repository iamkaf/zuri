import {
  IconTask,
  IconSettings,
  IconApple,
  IconWindows,
  IconSparkle,
} from '../Icons';
import type { ThemeId } from '../preload';
import type { Page } from '../types';
import { getThemeFamily } from '../theme';

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

  return (
    <div ref={menuRef} className={`apple-menu ${menuClosing ? 'isClosing' : ''}`}>
      <button
        className={`apple-menu-item ${page === 'tasks' ? 'isActive' : ''}`}
        onClick={() => handlePage('tasks')}
      >
        <IconTask size={16} />
        <span>Tasks</span>
      </button>
      <button
        className={`apple-menu-item ${page === 'settings' ? 'isActive' : ''}`}
        onClick={() => handlePage('settings')}
      >
        <IconSettings size={16} />
        <span>Settings</span>
      </button>
      <div className="apple-menu-divider" />
      <button
        className={`apple-menu-item ${getThemeFamily(theme) === 'apple' ? 'isActive' : ''}`}
        onClick={() => handleTheme('apple')}
      >
        <IconApple size={16} />
        <span>Apple Theme</span>
      </button>
      <button
        className={`apple-menu-item ${getThemeFamily(theme) === 'windows' ? 'isActive' : ''}`}
        onClick={() => handleTheme('windows')}
      >
        <IconWindows size={16} />
        <span>Windows Theme</span>
      </button>
      <button
        className={`apple-menu-item ${getThemeFamily(theme) === 'open' ? 'isActive' : ''}`}
        onClick={() => handleTheme('open')}
      >
        <IconSparkle size={16} />
        <span>Open Theme</span>
      </button>
    </div>
  );
}
